// Bringing things in.
//
// The app could produce a great deal and accept nothing: ten download paths
// and not one file input. You could record a voice but not import one,
// export a scene but never open it again, and animate five built-in shapes
// but never your own logo. This module is the missing half.
//
// Everything arriving here is untrusted. A file picked by a user is not
// hostile in the way a network payload is, but it is routinely the wrong
// type, far too large, or a JSON file written by a different version — so
// every entry point validates before anything downstream sees it, and
// reports what was wrong in words rather than throwing.

// Generous enough for a full audiobook chapter, small enough that a
// mis-picked video file is refused before it exhausts memory.
export const LIMITS = {
  audio: 100 * 1024 * 1024,
  image: 12 * 1024 * 1024,
  json: 8 * 1024 * 1024,
  model: 64 * 1024 * 1024,
};

const AUDIO_EXT = ['wav', 'mp3', 'm4a', 'aac', 'ogg', 'oga', 'opus', 'webm', 'flac', 'aiff', 'aif'];
const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'];
const MODEL_EXT = ['glb', 'gltf'];

export function fileExtension(name) {
  const m = /\.([a-z0-9]+)$/i.exec(String(name || ''));
  return m ? m[1].toLowerCase() : '';
}

export function formatBytes(n) {
  if (!Number.isFinite(n) || n < 0) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Decide whether a file is the kind being asked for.
 *
 * Browsers are inconsistent about the MIME type they report — a .m4a often
 * arrives as an empty string, and Windows reports .wav as audio/wave — so
 * the extension is checked as well as the type, and either one matching is
 * enough. Being strict here would reject files that work perfectly.
 */
export function validateFile(file, kind) {
  if (!file) return { ok: false, message: 'No file chosen.' };

  const ext = fileExtension(file.name);
  const type = String(file.type || '').toLowerCase();
  const limit = LIMITS[kind];

  const matches = {
    audio: () => type.startsWith('audio/') || type.startsWith('video/') || AUDIO_EXT.includes(ext),
    image: () => type.startsWith('image/') || IMAGE_EXT.includes(ext),
    json: () => type === 'application/json' || type === 'text/plain' || ext === 'json',
    // Browsers disagree about the MIME type for .glb — some report
    // model/gltf-binary, some application/octet-stream, some nothing at
    // all — so the extension is what decides.
    model: () => MODEL_EXT.includes(ext) || type.startsWith('model/'),
  }[kind];

  if (!matches || !matches()) {
    const expected = { audio: 'an audio file', image: 'an image', json: 'a saved .json file',
                       model: 'a .glb or .gltf 3D model' }[kind] || 'a supported file';
    return { ok: false, message: `That is not ${expected}. “${file.name}” looks like ${ext ? `a .${ext} file` : 'an unknown type'}.` };
  }

  if (limit && file.size > limit) {
    return { ok: false, message: `“${file.name}” is ${formatBytes(file.size)} — the limit is ${formatBytes(limit)}.` };
  }

  // A zero-byte file decodes to nothing and produces a baffling error much
  // further downstream, so it is caught here where the cause is obvious.
  if (file.size === 0) {
    return { ok: false, message: `“${file.name}” is empty.` };
  }

  return { ok: true, file, kind, ext };
}

/**
 * Open the system file picker and resolve with the chosen file.
 *
 * The input is created per call and never attached to the document. A single
 * reused input would keep the previous selection, so picking the same file
 * twice in a row would silently fire no change event the second time.
 */
export function pickFile(accept, { multiple = false } = {}) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.style.position = 'fixed';
    input.style.left = '-9999px';

    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(value);
    };

    input.addEventListener('change', () => finish(multiple ? Array.from(input.files) : input.files[0] || null));
    // Cancelling the dialog fires no `change` event in most browsers, which
    // would leave the promise pending forever and the calling button stuck
    // on "Loading…". `cancel` covers browsers that support it; the focus
    // fallback covers the rest.
    input.addEventListener('cancel', () => finish(multiple ? [] : null));
    window.addEventListener('focus', () => {
      setTimeout(() => finish(multiple ? [] : null), 600);
    }, { once: true });

    document.body.appendChild(input);
    input.click();
  });
}

export const ACCEPT = {
  audio: 'audio/*,video/webm,.wav,.mp3,.m4a,.aac,.ogg,.opus,.flac,.aiff',
  image: 'image/*,.png,.jpg,.jpeg,.gif,.webp,.svg,.avif',
  json: 'application/json,.json',
  model: '.glb,.gltf,model/gltf-binary,model/gltf+json',
};

/** Pick a file of a given kind, validating before it is handed back. */
export async function pickValidated(kind) {
  const file = await pickFile(ACCEPT[kind] || '*/*');
  if (!file) return { ok: false, cancelled: true, message: '' };
  return validateFile(file, kind);
}

/** Read a file as raw bytes, for binary formats like .glb. */
export function readArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Could not read “${file.name}”.`));
    reader.readAsArrayBuffer(file);
  });
}

export function readText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Could not read “${file.name}”.`));
    reader.readAsText(file);
  });
}

export function readDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Could not read “${file.name}”.`));
    reader.readAsDataURL(file);
  });
}

/** Parse JSON from a file, reporting a damaged file as such. */
export async function readJson(file) {
  const text = await readText(file);
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`“${file.name}” is not valid JSON — it may be damaged or only partly saved.`);
  }
}

/**
 * Load an image and report its natural size.
 *
 * Resolving on `decode()` rather than `load` means the caller gets an image
 * that is ready to draw; drawing one that has loaded but not decoded can
 * paint nothing on the first frame.
 */
export async function loadImage(dataUrl) {
  const img = new Image();
  img.src = dataUrl;
  if (img.decode) {
    await img.decode();
  } else {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('That image could not be decoded.'));
    });
  }
  return img;
}

/**
 * Make any element accept dropped files.
 *
 * Dropping onto a page that is not expecting it makes the browser navigate
 * away to the file — losing unsaved work — so the document-level handlers
 * below suppress that everywhere, and only the registered zones act.
 */
export function makeDropTarget(el, kind, onFile, { activeClass = 'drop-active' } = {}) {
  if (!el) return () => {};
  let depth = 0; // dragenter/leave fire per child; a counter avoids flicker

  const over = (ev) => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'copy';
  };
  const enter = (ev) => {
    ev.preventDefault();
    depth += 1;
    el.classList.add(activeClass);
  };
  const leave = () => {
    depth = Math.max(0, depth - 1);
    if (depth === 0) el.classList.remove(activeClass);
  };
  const drop = (ev) => {
    ev.preventDefault();
    depth = 0;
    el.classList.remove(activeClass);
    const file = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
    if (!file) return;
    onFile(validateFile(file, kind));
  };

  el.addEventListener('dragover', over);
  el.addEventListener('dragenter', enter);
  el.addEventListener('dragleave', leave);
  el.addEventListener('drop', drop);

  return () => {
    el.removeEventListener('dragover', over);
    el.removeEventListener('dragenter', enter);
    el.removeEventListener('dragleave', leave);
    el.removeEventListener('drop', drop);
  };
}

/** Stop a stray drop from navigating the page away and losing the session. */
export function guardStrayDrops() {
  const stop = (ev) => {
    if (ev.target && ev.target.closest && ev.target.closest('[data-drop-zone]')) return;
    ev.preventDefault();
    if (ev.type === 'drop' && ev.dataTransfer) ev.dataTransfer.dropEffect = 'none';
  };
  document.addEventListener('dragover', stop);
  document.addEventListener('drop', stop);
}
