// The AI scene agent's server half.
//
// This exists for one reason: the Anthropic API key must never reach the
// browser. A key in client code is visible in view-source, gets scraped by
// bots within hours, and is billed to whoever owns it. So the key lives
// here, in Supabase's environment, and the page calls this function.
//
// Deploy:
//   supabase functions deploy scene-agent
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Note there is no --no-verify-jwt here, unlike the Stripe webhook. That
// one is called by Stripe, which has no user token; this one is called by a
// signed-in person, and Supabase verifying their JWT is what stops the
// endpoint from being a free, anonymous relay to a paid API.

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY');

// A scene is small and bounded; a long prompt is either a mistake or an
// attempt to run up a bill.
const MAX_PROMPT = 2000;

// Per-user throttle, held in memory. This is a speed bump, not a security
// boundary — instances recycle and there may be several — but it stops a
// stuck client retrying in a loop from costing real money. For a hard
// guarantee, count requests in a table instead.
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const seen = new Map<string, number[]>();

function overRateLimit(userId: string): boolean {
  const now = Date.now();
  const hits = (seen.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  seen.set(userId, hits);
  return hits.length > RATE_LIMIT;
}

// The shape the model must return. Structured outputs make this a guarantee
// rather than a hope: the response is validated against this schema before
// it is returned, so the page never has to parse freeform text or — far
// worse — evaluate generated code.
const KEYFRAME = {
  type: 'object',
  additionalProperties: false,
  required: ['time', 'x', 'y', 'scale', 'rotation', 'opacity', 'color'],
  properties: {
    time: { type: 'number', description: 'Seconds from the start of the scene.' },
    x: { type: 'number', description: 'Horizontal position, 0-100 across the frame.' },
    y: { type: 'number', description: 'Vertical position, 0-100 down the frame.' },
    scale: { type: 'number', description: 'Size multiplier; 1 is the default size.' },
    rotation: { type: 'number', description: 'Degrees, about the view axis.' },
    z: { type: 'number', description: 'Depth: 0 is the focal plane, positive is away from the viewer.' },
    rotX: { type: 'number', description: 'Tilt in degrees, for 3D solids.' },
    rotY: { type: 'number', description: 'Turn in degrees, for 3D solids.' },
    opacity: { type: 'number', description: '0 is invisible, 1 is solid.' },
    color: { type: 'string', description: 'Hex colour such as #3fc6ff.' },
    ease: {
      type: 'string',
      description: 'How the move out of this keyframe is paced.',
      enum: ['linear', 'ease', 'easeIn', 'easeOut', 'easeInOut', 'quadIn', 'quadOut',
             'quartIn', 'quartOut', 'expoIn', 'expoOut', 'settle', 'anticipate',
             'backIn', 'backOut', 'bounce', 'elastic', 'hold', 'step'],
    },
  },
};

const SCENE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['duration', 'fps', 'background', 'shapes', 'summary'],
  properties: {
    duration: { type: 'number', description: 'Scene length in seconds, 1-60.' },
    fps: { type: 'number', description: 'Frames per second, usually 30.' },
    background: { type: 'string', description: 'Hex background colour.' },
    summary: { type: 'string', description: 'One sentence describing what was made, for the user.' },
    shapes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'label', 'keyframes'],
        properties: {
          type: { type: 'string', enum: ['circle', 'rect', 'triangle', 'text', 'wave',
                                          'cube', 'sphere', 'pyramid', 'cylinder'] },
          label: { type: 'string' },
          text: { type: 'string', description: 'Only used when type is text.' },
          reactive: { type: 'boolean', description: 'Scale follows the audio level.' },
          keyframes: { type: 'array', items: KEYFRAME },
        },
      },
    },
  },
};

const SYSTEM = `You turn a description of a motion graphic into a scene for a
keyframe animation engine.

The frame is 640x360. Position is a percentage: x 0 is the left edge, x 100
the right, y 0 the top, y 100 the bottom. Centre is 50,50. A shape's default
size is about a sixth of the frame; scale multiplies that.

Rules that make the difference between motion that looks designed and motion
that looks computed:

- Give every shape at least two keyframes, or it will not move.
- Stagger entrances. Shapes that all start at t=0 read as a single object.
- Choose easing per keyframe. "settle" for arrivals, "backOut" for anything
  that should feel bouncy, "expoOut" for something fast that glides to a
  halt, "linear" only for continuous motion like a spin.
- Overshoot ("backOut", "anticipate") makes an entrance feel alive. Use it
  for titles and logos.
- Fade things in by starting at opacity 0, not by having them appear.
- Keep the palette tight — two or three colours reads as design; six reads
  as an accident.

cube, sphere, pyramid and cylinder are real 3D solids, lit and shaded. Use
them when the description implies objects or space; give them z (depth,
roughly -80 to 200) and rotX/rotY keyframe values so they turn in depth
rather than twirling flat. A slow rotY sweep on a solid reads as premium
motion design.

PHYSICAL EVENTS

When the description involves things acting on each other — hitting,
breaking, exploding, orbiting, chasing — stage it as an event with a
before, an instant, and an aftermath. A collision with no aftermath is not
a collision, it is a stop.

To make one object destroy another:
- The aggressor accelerates in from off-frame (ease "quartIn" on its first
  keyframe) and reaches the target at roughly a third of the way through.
- The target holds still until that instant, then in the NEXT keyframe
  (about 0.01s later, ease "hold" on the keyframe before it) drops to
  scale 0.001 and opacity 0. Fading it out reads as a dissolve; vanishing
  in one frame reads as breaking.
- Add 8-14 fragment shapes of the same type at scale 0.15-0.3. Each stays
  at opacity 0 until the impact, then flies outward on its own arc.

Fragments must look thrown, not placed:
- Spread their directions evenly around a sphere rather than randomly, or
  they clump on one side.
- Add the impact direction to every fragment's velocity so the debris
  carries the aggressor's momentum — all of it should travel broadly the
  same way, spreading as it goes.
- Give every fragment a downward curve: sample 6-8 keyframes where y
  increases faster over time (y runs DOWN), because things fall.
- Vary each fragment's speed and give it rotX/rotY/rotation spin.
- Use ease "linear" on fragment keyframes: the arc is already in the
  positions, and easing them again applies the acceleration twice.
- Fade fragments out toward the end so the frame does not fill with debris.

Other events:
- Orbiting: sample 20+ keyframes around a circle, and tilt it (vary y less
  than x and z) so it reads as an orbit rather than a flat ring.
- Going crazy, glitching, malfunctioning: many keyframes of small irregular
  jumps in position and rotation. Irregular matters — a smooth wobble
  reads as a machine, and "crazy" means the opposite of predictable.
- Exploding: one beat of anticipation where the object swells slightly,
  then it vanishes and the fragments radiate outward from its centre.

Set "reactive": true on shapes that should pulse with a voice or music track
when one is loaded.

Keep the scene to at most 12 shapes and 60 seconds.`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  if (!ANTHROPIC_KEY) {
    return json({ error: 'The scene agent is not configured on the server yet.' }, 503);
  }

  // Supabase has already verified the JWT before this runs; the claim is
  // only read here to key the rate limiter to a person.
  let userId = 'anonymous';
  try {
    const auth = req.headers.get('authorization') ?? '';
    const token = auth.replace(/^Bearer\s+/i, '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    userId = payload.sub ?? 'anonymous';
  } catch {
    /* keyed as anonymous; the throttle still applies */
  }

  if (overRateLimit(userId)) {
    return json({ error: 'That is a lot of scenes in one hour. Try again shortly.' }, 429);
  }

  let prompt = '';
  let existing: unknown = null;
  try {
    const body = await req.json();
    prompt = String(body.prompt ?? '').slice(0, MAX_PROMPT);
    existing = body.scene ?? null;
  } catch {
    return json({ error: 'Malformed request.' }, 400);
  }
  if (!prompt.trim()) return json({ error: 'Describe what you want to see.' }, 400);

  // Editing an existing scene is the same request with the current scene
  // supplied as context, so "make it slower" has something to work from.
  const userContent = existing
    ? `Current scene:\n${JSON.stringify(existing).slice(0, 20000)}\n\nChange requested: ${prompt}`
    : prompt;

  let res: Response;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-5',
        max_tokens: 16000,
        system: SYSTEM,
        // Adaptive thinking: the model decides how much reasoning a given
        // description needs. Effort is medium rather than the default high
        // because someone is watching a spinner while this runs — this is a
        // latency choice, and raising it is a one-word change.
        thinking: { type: 'adaptive' },
        output_config: {
          effort: 'medium',
          format: { type: 'json_schema', schema: SCENE_SCHEMA },
        },
        messages: [{ role: 'user', content: userContent }],
      }),
    });
  } catch (err) {
    return json({ error: `Could not reach the model: ${(err as Error).message}` }, 502);
  }

  if (!res.ok) {
    const detail = await res.text();
    // Anthropic's error body can name the account; keep it server-side and
    // return only what helps the person using the app.
    console.error('anthropic error', res.status, detail);
    if (res.status === 429) return json({ error: 'The model is busy. Try again in a moment.' }, 429);
    if (res.status === 401) return json({ error: 'The server is misconfigured — its API key was rejected.' }, 500);
    return json({ error: 'The model could not complete that request.' }, 502);
  }

  const data = await res.json();

  // A refusal arrives as HTTP 200 with stop_reason "refusal", so checking
  // res.ok alone is not enough — reading content[0] would throw here.
  if (data.stop_reason === 'refusal') {
    return json({ error: 'The model declined that request. Try describing it differently.' }, 422);
  }

  const block = (data.content ?? []).find((b: { type: string }) => b.type === 'text');
  if (!block) return json({ error: 'The model returned nothing usable.' }, 502);

  let scene: unknown;
  try {
    scene = JSON.parse(block.text);
  } catch {
    return json({ error: 'The model returned a malformed scene.' }, 502);
  }

  return json({ scene, usage: data.usage ?? null });
});
