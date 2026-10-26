// Encodes Float32 PCM as a 16-bit WAV Blob for download. Deliberately 16-bit
// integer rather than 32-bit float: it's the most universally compatible
// WAV variant for whatever the user opens the file in next, not just
// browsers — unlike the in-app playback path, a downloaded file has no
// control over what decodes it later.
export function encodeWav16(float32Audio, sampleRate) {
  const n = float32Audio.length;
  const buffer = new ArrayBuffer(44 + n * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + n * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, n * 2, true);

  let offset = 44;
  for (let i = 0; i < n; i++, offset += 2) {
    const clamped = Math.max(-1, Math.min(1, float32Audio[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}
