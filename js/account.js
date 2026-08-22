// Real accounts only — email + password against a Supabase project.
// There is deliberately no local/offline profile fallback: a "login" that
// anyone can walk past isn't a login.
//
// BACKEND_URL/BACKEND_KEY are the deployment's own credentials. The anon
// key is public by design (Supabase enforces access server-side via row
// level security), so shipping it in the page is how it's meant to work —
// unlike a secret key, which must never be in client code. With these
// filled in the site comes up already pointed at its project; the owner can
// still repoint it at runtime from the gate's setup panel, which takes
// precedence over these values.
const BACKEND_URL = 'https://tkllekpavimbuponicaz.supabase.co';
const BACKEND_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrbGxla3BhdmltYnVwb25pY2F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNTEwMDMsImV4cCI6MjEwMjgyNzAwM30.NKPQT2eJTAp_iBMChXW4UFFTMUsGD75v2eHtbST9xMc';

/**
 * Reduce whatever the dashboard put on someone's clipboard to the origin the
 * client actually needs.
 *
 * This is the single most common way connecting a project fails, and it
 * fails silently: Supabase shows several URLs, and the one sitting under
 * "Project API" is the REST endpoint, `https://<ref>.supabase.co/rest/v1/`.
 * Paste that and the client builds `.../rest/v1/auth/v1/token`, which 404s
 * on every sign-in with nothing on screen to say why. Accept any of them.
 */
export function normalizeSupabaseUrl(input) {
  let url = String(input || '').trim();
  if (!url) return '';
  // A bare host is a reasonable thing to paste; assume https rather than
  // rejecting it, since Supabase is https-only anyway.
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return '';
  }
  return parsed.origin;
}

/**
 * What a pasted key actually is.
 *
 * Supabase shows the anon key and the service-role key side by side, and
 * they look identical at a glance. The service-role key bypasses row level
 * security entirely, so pasting it into a web page would hand every visitor
 * full read/write access to the database. Refusing it loudly is the whole
 * point of this function; the rest is a courtesy.
 */
export function inspectSupabaseKey(input) {
  const key = String(input || '').trim();
  if (!key) return { ok: false, reason: 'empty', message: 'Paste the anon public key.' };

  const parts = key.split('.');
  if (parts.length !== 3) {
    return {
      ok: false,
      reason: 'not-a-key',
      message: 'That does not look like a Supabase key. Copy the "anon public" key from Project Settings → API.',
    };
  }

  let payload;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    payload = JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)));
  } catch {
    return { ok: false, reason: 'unreadable', message: 'That key could not be read. Copy it again from Project Settings → API.' };
  }

  if (payload.role === 'service_role') {
    return {
      ok: false,
      reason: 'service-role',
      message: 'That is the service_role key — it bypasses all security and must never go in a web page. Use the "anon public" key instead.',
    };
  }
  if (payload.role !== 'anon') {
    return { ok: false, reason: 'wrong-role', message: `That key has role "${payload.role || 'unknown'}". Use the "anon public" key.` };
  }
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return { ok: false, reason: 'expired', message: 'That key has expired. Copy the current one from Project Settings → API.' };
  }

  return { ok: true, ref: payload.ref || '', role: payload.role };
}

/**
 * Check a URL and key describe the same project.
 *
 * Every anon key names its project in the `ref` claim, and that ref is the
 * subdomain of the project URL. Two halves from different projects is an
 * easy mistake when juggling several, and it produces an "Invalid API key"
 * that reads as though the key itself were bad.
 */
export function checkSupabasePair(url, key) {
  const origin = normalizeSupabaseUrl(url);
  if (!origin) return { ok: false, message: 'Enter the Project URL, e.g. https://yourproject.supabase.co' };

  const info = inspectSupabaseKey(key);
  if (!info.ok) return { ok: false, message: info.message };

  const host = origin.replace(/^https?:\/\//, '');
  const subdomain = host.split('.')[0];
  if (info.ref && subdomain && info.ref !== subdomain && host.endsWith('.supabase.co')) {
    return {
      ok: false,
      message: `That key belongs to project "${info.ref}", but the URL points at "${subdomain}". Take both from the same project.`,
    };
  }
  return { ok: true, url: origin, anonKey: String(key).trim() };
}

const SUPABASE_CONFIG_KEY = 'thevoice_supabase_config';
const SUPABASE_SDK_URL = 'https://esm.sh/@supabase/supabase-js@2';

export function getSupabaseConfig() {
  // A runtime override wins over the baked-in project, so the owner can
  // repoint a deployed site without a rebuild.
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(SUPABASE_CONFIG_KEY) || 'null');
  } catch {
    stored = null;
  }
  if (stored && stored.url && stored.anonKey) {
    // Repair rather than reject: a site already storing the REST endpoint
    // from an earlier attempt should start working, not stay broken.
    return { url: normalizeSupabaseUrl(stored.url), anonKey: String(stored.anonKey).trim() };
  }
  if (BACKEND_URL && BACKEND_KEY) {
    return { url: normalizeSupabaseUrl(BACKEND_URL), anonKey: BACKEND_KEY };
  }
  return null;
}

export function setSupabaseConfig(url, anonKey) {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({
    url: normalizeSupabaseUrl(url),
    anonKey: String(anonKey || '').trim(),
  }));
  clientPromise = null; // force a rebuild against the new project
}

export function clearSupabaseConfig() {
  localStorage.removeItem(SUPABASE_CONFIG_KEY);
  clientPromise = null;
}

export function isBackendConfigured() {
  return !!getSupabaseConfig();
}

let clientPromise = null;

async function getClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  if (!clientPromise) {
    clientPromise = import(SUPABASE_SDK_URL)
      .then(({ createClient }) => createClient(config.url, config.anonKey))
      .catch((err) => {
        clientPromise = null;
        throw new Error(`Couldn't reach the authentication service: ${err.message || err}`);
      });
  }
  return clientPromise;
}

function friendlyAuthError(err) {
  const msg = String((err && err.message) || err || '');
  if (/Invalid API key|invalid.*key|Failed to fetch/i.test(msg)) return 'Cannot reach the authentication service.';
  if (/User already registered/i.test(msg)) return 'An account with that email already exists.';
  if (/Invalid login credentials/i.test(msg)) return 'Incorrect email or password.';
  if (/Email not confirmed/i.test(msg)) return 'Confirm your email address before signing in.';
  if (/Password should be at least/i.test(msg)) return 'Password must be at least 6 characters.';
  if (/valid email/i.test(msg)) return 'Enter a valid email address.';
  return msg || 'Authentication failed.';
}

export async function supabaseSignUp(email, password) {
  const client = await getClient();
  if (!client) throw new Error('No authentication service configured.');
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw new Error(friendlyAuthError(error));
  return data;
}

export async function supabaseSignIn(email, password) {
  const client = await getClient();
  if (!client) throw new Error('No authentication service configured.');
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(friendlyAuthError(error));
  return data;
}

// Social sign-in. Each provider must also be switched on in the Supabase
// dashboard (Authentication -> Providers) with its client id/secret —
// Supabase brokers the OAuth handshake, so no provider secrets are ever
// present in this page.
export async function signInWithProvider(provider) {
  const client = await getClient();
  if (!client) throw new Error('No authentication service configured.');
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.href.split('#')[0] },
  });
  if (error) throw new Error(friendlyAuthError(error));
}

export async function signOutUser() {
  const client = await getClient();
  if (!client) return;
  await client.auth.signOut();
}

export async function getCurrentSession() {
  const client = await getClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

export async function onAuthChange(callback) {
  // Subscribing is best-effort: if the SDK cannot load there is nothing to
  // listen to, and this is called at start-up without anyone awaiting it, so
  // letting it reject would surface as an uncaught error on the page.
  const client = await getClient().catch(() => null);
  if (!client) return () => {};
  const { data } = client.auth.onAuthStateChange((event, session) => callback(event, session));
  return () => data.subscription.unsubscribe();
}

/**
 * Whether the authentication SDK itself can be fetched.
 *
 * It is loaded from a CDN on demand, so an offline machine, a corporate
 * proxy or a blocked CDN leaves the sign-in form present but inert. That
 * looks identical to a wrong password, so it needs naming explicitly.
 */
export async function canReachAuthSdk() {
  try {
    await getClient();
    return true;
  } catch {
    return false;
  }
}

/**
 * Read the signed-in user's plan straight from the subscriptions table.
 *
 * This is the fresh source: the Stripe webhook writes the row server-side,
 * and row level security lets the owner read it the moment it changes —
 * whereas the plan baked into the JWT stays stale until the token is
 * refreshed. Reading is all the browser is allowed to do; there is no write
 * policy for normal users, which is what stops anyone granting themselves a
 * paid plan from devtools.
 *
 * Returns null rather than throwing when the table is missing or unreadable,
 * so a deployment that hasn't run schema.sql yet degrades to the JWT plan
 * instead of breaking the Plans page.
 */
export async function fetchSubscriptionPlan() {
  const client = await getClient().catch(() => null);
  if (!client) return null;
  const { data: sessionData } = await client.auth.getSession();
  const session = sessionData.session;
  if (!session) return null;
  const { data, error } = await client
    .from('subscriptions')
    .select('plan')
    .eq('user_id', session.user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data.plan || null;
}

/**
 * Pull a new access token so the plan inside the JWT catches up with the
 * subscriptions row. Anything gated on app_metadata elsewhere then sees the
 * upgrade too.
 */
export async function refreshSession() {
  const client = await getClient().catch(() => null);
  if (!client) return null;
  const { data, error } = await client.auth.refreshSession();
  if (error) return null;
  return data.session;
}

/**
 * Actually talk to the project, and say precisely what came back.
 *
 * The connect button used to "verify" by calling getSession(), which only
 * reads localStorage — it never touches the network, so it reported
 * "Connected." for a URL pointing at nothing. That silent false success is
 * why a wrong URL could be re-deployed a dozen times without ever producing
 * an error message.
 *
 * /auth/v1/settings is the right probe: it is unauthenticated, it exists on
 * every project, and it distinguishes the failure modes — a bad key gives
 * 401, a wrong path gives 404, a wrong host fails to resolve at all.
 */
export async function verifyBackend(url, anonKey) {
  const origin = normalizeSupabaseUrl(url);
  if (!origin) return { ok: false, message: 'Enter the Project URL, e.g. https://yourproject.supabase.co' };

  let res;
  try {
    res = await fetch(`${origin}/auth/v1/settings`, {
      headers: { apikey: String(anonKey || '').trim() },
    });
  } catch {
    return {
      ok: false,
      message: `Could not reach ${origin}. Check the Project URL — it should look like https://yourproject.supabase.co`,
    };
  }

  if (res.status === 401 || res.status === 403) {
    return { ok: false, message: 'That project rejected the key. Copy the "anon public" key from Project Settings → API.' };
  }
  if (res.status === 404) {
    return {
      ok: false,
      message: `${origin} answered, but has no authentication service. That is usually the wrong URL — use the Project URL, not the REST or API endpoint.`,
    };
  }
  if (!res.ok) {
    return { ok: false, message: `That project answered with an error (${res.status}). Try again in a moment.` };
  }

  // A healthy response also tells us which sign-in methods are switched on,
  // which is what the Google/Apple buttons should follow.
  let settings = {};
  try {
    settings = await res.json();
  } catch {
    /* a 200 is enough on its own */
  }
  const providers = settings && settings.external
    ? Object.keys(settings.external).filter((k) => settings.external[k] === true)
    : [];
  return {
    ok: true,
    url: origin,
    anonKey: String(anonKey || '').trim(),
    emailEnabled: !settings || settings.external_email_enabled !== false,
    providers,
  };
}
