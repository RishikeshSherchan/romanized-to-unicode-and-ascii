import { matchLongest, sortedByLengthDesc } from './rules.js';

// Preeti's key-to-glyph mapping is font-designer-arbitrary (not phonetic),
// so this table is transcribed directly from a verified open-source source
// rather than reconstructed from memory: Shuvayatra/preeti
// (https://github.com/Shuvayatra/preeti), via
// https://gist.github.com/behnam/9dd669190cd8379c4c2e09956e40316a
export const PREETI_TO_UNICODE: Record<string, string> = {
  '÷': '/',
  v: 'ख',
  r: 'च',
  '"': 'ू',
  '~': 'ञ्',
  z: 'श',
  ç: 'ॐ',
  f: 'ा',
  b: 'द',
  n: 'ल',
  j: 'व',
  '×': '×',
  V: 'ख्',
  R: 'च्',
  ß: 'द्म',
  '^': '६',
  Û: '!',
  Z: 'श्',
  F: 'ँ',
  B: 'द्य',
  N: 'ल्',
  Ë: 'ङ्ग',
  J: 'व्',
  '6': 'ट',
  '2': 'द्द',
  '¿': 'रू',
  '>': 'श्र',
  ':': 'स्',
  '§': 'ट्ट',
  '&': '७',
  '£': 'घ्',
  '•': 'ड्ड',
  '.': '।',
  '«': '्र',
  '*': '८',
  '„': 'ध्र',
  w: 'ध',
  s: 'क',
  g: 'न',
  æ: '“',
  c: 'अ',
  o: 'य',
  k: 'प',
  W: 'ध्',
  Ö: '=',
  S: 'क्',
  Ò: '¨',
  _: ')',
  '[': 'ृ',
  Ú: '’',
  G: 'न्',
  ˆ: 'फ्',
  C: 'ऋ',
  O: 'इ',
  Î: 'ङ्ख',
  K: 'प्',
  '7': 'ठ',
  '¶': 'ठ्ठ',
  '3': 'घ',
  '9': 'ढ',
  '?': 'रु',
  ';': 'स',
  "'": 'ु',
  '#': '३',
  '¢': 'द्घ',
  '/': 'र',
  '+': 'ं',
  ª: 'ङ',
  t: 'त',
  p: 'उ',
  '|': '्र',
  x: 'ह',
  å: 'द्व',
  d: 'म',
  '`': 'ञ',
  l: 'ि',
  h: 'ज',
  T: 'त्',
  P: 'ए',
  Ý: 'ट्ठ',
  '\\': '्',
  Ù: ';',
  X: 'ह्',
  Å: 'हृ',
  D: 'म्',
  '@': '२',
  Í: 'ङ्क',
  L: 'ी',
  H: 'ज्',
  '4': 'द्ध',
  '±': '+',
  '0': 'ण्',
  '<': '?',
  '8': 'ड',
  '¥': 'र्‍',
  $: '४',
  '¡': 'ज्ञ्',
  ',': ',',
  '©': 'र',
  '(': '९',
  '‘': 'ॅ',
  u: 'ग',
  q: 'त्र',
  '}': 'ै',
  y: 'थ',
  e: 'भ',
  a: 'ब',
  i: 'ष्',
  '‰': 'झ्',
  U: 'ग्',
  Q: 'त्त',
  ']': 'े',
  '˜': 'ऽ',
  Y: 'थ्',
  Ø: '्य',
  E: 'भ्',
  A: 'ब्',
  M: 'ः',
  Ì: 'न्न',
  I: 'क्ष्',
  '5': 'छ',
  '´': 'झ',
  '1': 'ज्ञ',
  '°': 'ङ्ढ',
  '=': '.',
  Æ: '”',
  '‹': 'ङ्घ',
  '%': '५',
  '¤': 'झ्',
  '!': '१',
  '-': '(',
  '›': 'द्र',
  ')': '०',
  '…': '‘',
  Ü: '%',
};

// The reverse direction is derived from PREETI_TO_UNICODE, never
// hand-transcribed, so it can't drift from the verified forward table.
// A few Unicode values are reachable from more than one Preeti key (e.g.
// both '/' and '©' produce 'र'); the first key encountered wins, which is
// stable since Object.entries preserves insertion order.
//
// Some Preeti keys are plain ASCII/punctuation passthroughs baked into the
// same table (e.g. 'Û' -> '!', 'Ö' -> '='), for typing ordinary symbols
// while in Preeti mode. Inverting those would make unicodeToPreeti "convert"
// already-fine punctuation into a different Preeti key, so only Devanagari
// values (U+0900-U+097F) are included in the reverse map.
function isDevanagari(value: string): boolean {
  return [...value].some((ch) => {
    const code = ch.codePointAt(0) ?? 0;
    return code >= 0x0900 && code <= 0x097f;
  });
}

export const UNICODE_TO_PREETI: Record<string, string> = {};
for (const [preetiKey, unicodeSeq] of Object.entries(PREETI_TO_UNICODE)) {
  if (isDevanagari(unicodeSeq) && !(unicodeSeq in UNICODE_TO_PREETI)) {
    UNICODE_TO_PREETI[unicodeSeq] = preetiKey;
  }
}

const UNICODE_KEYS = sortedByLengthDesc(Object.keys(UNICODE_TO_PREETI));

const SHORT_I_MATRA = 'ि';
const SHORT_I_KEY = UNICODE_TO_PREETI[SHORT_I_MATRA];

// Converts real Devanagari Unicode into Preeti's legacy ASCII-glyph
// encoding, so text can be displayed correctly in old Preeti-style fonts
// (which have no glyphs at all in the Unicode Devanagari range — see
// README). Longest-match first because some Unicode sequences (e.g.
// द्द, 3 codepoints) contain a shorter valid sequence (द्) as a prefix.
//
// The short-i matra (ि) is Unicode's one "pre-base" vowel sign: it's
// encoded AFTER its consonant (logical order) but renders BEFORE it
// visually — normally a font's shaping engine reorders this, but Preeti
// has no shaping smarts and just draws glyphs in the order given, so the
// key for ि must be emitted before the consonant's key whenever it
// follows one in the source text.
export function unicodeToPreeti(text: string): string {
  let result = '';
  let i = 0;

  while (i < text.length) {
    const seq = matchLongest(text, i, UNICODE_KEYS);
    if (seq) {
      const key = UNICODE_TO_PREETI[seq];
      if (seq !== SHORT_I_MATRA && text.startsWith(SHORT_I_MATRA, i + seq.length)) {
        result += SHORT_I_KEY + key;
        i += seq.length + SHORT_I_MATRA.length;
      } else {
        result += key;
        i += seq.length;
      }
    } else {
      result += text[i];
      i += 1;
    }
  }

  return result;
}
