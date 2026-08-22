// Splits long-form text into synthesis-sized chunks. Neural TTS degrades
// (and can run out of memory) on very long inputs, so an audiobook has to
// be generated piece by piece and stitched back together — this decides
// where those cuts go.
//
// Cuts prefer real structural boundaries in the text over arbitrary
// character counts: an explicit "Chapter N" heading wins, then a blank
// line (paragraph break), then a sentence end. Only if a single sentence
// somehow exceeds the cap does it hard-split mid-text.
const DEFAULT_MAX_CHARS = 900;

const HEADING_RE = /^\s*(chapter|part|section)\s+([0-9]+|[ivxlcdm]+)\b.*$/i;

export function splitIntoChapters(text, maxChars = DEFAULT_MAX_CHARS) {
  const trimmed = (text || '').trim();
  if (!trimmed) return [];

  const blocks = splitByHeadings(trimmed);
  const chunks = [];

  for (const block of blocks) {
    for (const piece of splitBlock(block.body, maxChars)) {
      chunks.push({ title: block.title, text: piece });
    }
  }

  return chunks.map((c, i) => ({
    index: i,
    title: c.title || `Part ${i + 1}`,
    text: c.text,
    chars: c.text.length,
  }));
}

function splitByHeadings(text) {
  const lines = text.split('\n');
  const blocks = [];
  let currentTitle = null;
  let buffer = [];

  const flush = () => {
    const body = buffer.join('\n').trim();
    if (body) blocks.push({ title: currentTitle, body });
    buffer = [];
  };

  for (const line of lines) {
    if (HEADING_RE.test(line)) {
      flush();
      currentTitle = line.trim();
    } else {
      buffer.push(line);
    }
  }
  flush();

  return blocks.length ? blocks : [{ title: null, body: text }];
}

function splitBlock(text, maxChars) {
  if (text.length <= maxChars) return [text];

  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
  const pieces = [];
  let current = '';

  const push = () => {
    if (current.trim()) pieces.push(current.trim());
    current = '';
  };

  for (const para of paragraphs) {
    if (para.length > maxChars) {
      push();
      pieces.push(...splitBySentence(para, maxChars));
      continue;
    }
    if ((current + '\n\n' + para).trim().length > maxChars) push();
    current = current ? `${current}\n\n${para}` : para;
  }
  push();

  return pieces;
}

function splitBySentence(text, maxChars) {
  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [text];
  const pieces = [];
  let current = '';

  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      if (current.trim()) {
        pieces.push(current.trim());
        current = '';
      }
      for (let i = 0; i < sentence.length; i += maxChars) {
        pieces.push(sentence.slice(i, i + maxChars).trim());
      }
      continue;
    }
    if ((current + sentence).length > maxChars) {
      if (current.trim()) pieces.push(current.trim());
      current = '';
    }
    current += sentence;
  }
  if (current.trim()) pieces.push(current.trim());

  return pieces;
}

// Concatenates rendered chunks into one continuous Float32 track, with a
// short silence between parts so chapters don't run into each other.
export function concatAudio(parts, sampleRate, gapSeconds = 0.6) {
  const gapSamples = Math.round(sampleRate * gapSeconds);
  const total = parts.reduce((sum, p) => sum + p.length, 0) + gapSamples * Math.max(0, parts.length - 1);
  const out = new Float32Array(total);
  let offset = 0;
  parts.forEach((part, i) => {
    out.set(part, offset);
    offset += part.length;
    if (i < parts.length - 1) offset += gapSamples;
  });
  return out;
}
