// Exporting a video.
//
// Frame-by-frame PNGs were honest but not a deliverable: nobody wants three
// hundred files and an editor to assemble them. MediaRecorder can capture a
// canvas straight to a video file, in the browser, with no encoder to ship.
//
// The catch that shapes this module: MediaRecorder records in real time from
// a live stream. Naively you would play the animation and record — but any
// frame the browser is too slow to draw is simply a frame the recording
// misses, so a heavy scene silently exports juddering and short. Instead the
// canvas stream is driven manually: the recorder is given a 0 fps stream,
// which captures only when explicitly asked, so we render frame n, request
// exactly one capture, and move on. The result is frame-accurate regardless
// of how slow the rendering is — a 30 fps export is 30 real frames per
// second of output even if each took 200ms to draw.

/** Codecs in order of preference; the first the browser admits to wins. */
const CANDIDATES = [
  { mime: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4', label: 'MP4 (H.264)' },
  { mime: 'video/webm;codecs=vp9', ext: 'webm', label: 'WebM (VP9)' },
  { mime: 'video/webm;codecs=vp8', ext: 'webm', label: 'WebM (VP8)' },
  { mime: 'video/webm', ext: 'webm', label: 'WebM' },
];

/**
 * What this browser can actually produce, or null if it cannot record.
 *
 * Safari has historically claimed MediaRecorder while supporting no useful
 * canvas codec, so the type is probed rather than assumed.
 */
export function pickFormat(supports = (m) => typeof MediaRecorder !== 'undefined'
    && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) {
  for (const c of CANDIDATES) {
    if (supports(c.mime)) return c;
  }
  return null;
}

export function canRecord() {
  return typeof MediaRecorder !== 'undefined'
    && typeof HTMLCanvasElement !== 'undefined'
    && !!HTMLCanvasElement.prototype.captureStream
    && !!pickFormat();
}

/**
 * A sensible bitrate for the frame size.
 *
 * Roughly 0.1 bits per pixel per frame, which keeps flat motion-graphic
 * colour clean without producing a file nobody can upload. Clamped at both
 * ends: too low turns gradients to mud, too high wastes minutes of encode
 * on a 640x360 preview.
 */
export function bitrateFor(width, height, fps) {
  const raw = width * height * fps * 0.1;
  return Math.round(Math.min(24_000_000, Math.max(1_500_000, raw)));
}

/** Total frames an export will contain. */
export function frameCount(duration, fps) {
  return Math.max(1, Math.ceil(duration * fps));
}

/**
 * Render a scene to a video file.
 *
 * `drawFrame(t)` must draw the given moment synchronously and return the
 * canvas it drew to — which may differ between the WebGL and 2D renderers,
 * so it is asked for rather than assumed.
 *
 * `onProgress(done, total)` is called per frame so a long export can show
 * where it is; `shouldCancel()` lets the caller stop one.
 */
export async function recordScene({
  drawFrame,
  duration,
  fps = 30,
  audioStream = null,
  onProgress = () => {},
  shouldCancel = () => false,
  maxFrames = 1800,
} = {}) {
  const format = pickFormat();
  if (!format) {
    return { ok: false, message: 'This browser cannot record video. Export frames instead.' };
  }

  const total = Math.min(maxFrames, frameCount(duration, fps));
  if (total < 1) return { ok: false, message: 'Nothing to export.' };

  // Draw frame zero first: the stream must be created from the canvas that
  // is actually being drawn to, and which that is depends on the renderer.
  const canvas = drawFrame(0);
  if (!canvas || !canvas.captureStream) {
    return { ok: false, message: 'This browser cannot capture the preview.' };
  }

  // 0 fps means "capture only when asked" — the whole basis of frame
  // accuracy here.
  let stream;
  try {
    stream = canvas.captureStream(0);
  } catch (err) {
    return { ok: false, message: `Could not capture the preview: ${err.message || err}` };
  }
  const track = stream.getVideoTracks()[0];
  if (!track || typeof track.requestFrame !== 'function') {
    // Without manual capture the recording would drop frames on any scene
    // heavy enough to matter, so this refuses rather than exporting junk.
    return { ok: false, message: 'This browser cannot export frame-accurate video. Export frames instead.' };
  }

  if (audioStream) {
    for (const a of audioStream.getAudioTracks()) stream.addTrack(a);
  }

  let recorder;
  try {
    recorder = new MediaRecorder(stream, {
      mimeType: format.mime,
      videoBitsPerSecond: bitrateFor(canvas.width, canvas.height, fps),
    });
  } catch (err) {
    return { ok: false, message: `Could not start the recorder: ${err.message || err}` };
  }

  const chunks = [];
  recorder.ondataavailable = (ev) => { if (ev.data && ev.data.size) chunks.push(ev.data); };

  const finished = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = (ev) => reject(new Error((ev.error && ev.error.message) || 'Recording failed.'));
  });

  recorder.start();

  let cancelled = false;
  for (let i = 0; i < total; i++) {
    if (shouldCancel()) { cancelled = true; break; }
    drawFrame(i / fps);
    track.requestFrame();
    onProgress(i + 1, total);
    // Yield to the browser: the encoder runs off the main thread but the
    // capture callback does not, and without a gap the whole export is one
    // unbroken task that freezes the tab and starves the encoder.
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 0));
  }

  // A stop() during the final requestFrame can lose the last chunk, so give
  // the encoder one turn to drain before asking it to finish.
  await new Promise((r) => setTimeout(r, 60));
  try {
    recorder.stop();
    await finished;
  } catch (err) {
    return { ok: false, message: err.message || 'Recording failed.' };
  }
  for (const t of stream.getTracks()) t.stop();

  if (cancelled) return { ok: false, cancelled: true, message: 'Export cancelled.' };
  if (!chunks.length) return { ok: false, message: 'The recording came back empty.' };

  const blob = new Blob(chunks, { type: format.mime });
  return {
    ok: true,
    blob,
    ext: format.ext,
    label: format.label,
    frames: total,
    seconds: total / fps,
  };
}
