import { describe, it, expect } from 'vitest';
import { PREETI_TO_UNICODE, UNICODE_TO_PREETI, unicodeToPreeti } from './preeti';

// Decodes a Preeti-encoded string back to Unicode, undoing the same
// short-i pre-base reordering that unicodeToPreeti applies. This only
// exists to verify round-tripping in these tests — the library doesn't
// need a Preeti-to-Unicode direction for its current feature set.
function decodePreeti(preeti: string): string {
  const shortIKey = UNICODE_TO_PREETI['ि'];
  let result = '';
  let i = 0;

  while (i < preeti.length) {
    const key = preeti[i];
    if (key === shortIKey && i + 1 < preeti.length) {
      const nextUnicode = PREETI_TO_UNICODE[preeti[i + 1]];
      if (nextUnicode !== undefined) {
        result += nextUnicode + 'ि';
        i += 2;
        continue;
      }
    }
    result += PREETI_TO_UNICODE[key] ?? key;
    i += 1;
  }

  return result;
}

describe('preeti mapping tables', () => {
  it('maps known Preeti keys to their Unicode glyphs', () => {
    expect(PREETI_TO_UNICODE.s).toBe('क');
    expect(PREETI_TO_UNICODE.l).toBe('ि');
    expect(PREETI_TO_UNICODE['2']).toBe('द्द');
  });

  it('derives the reverse map without drifting from the forward table', () => {
    expect(UNICODE_TO_PREETI['क']).toBe('s');
    expect(UNICODE_TO_PREETI['ि']).toBe('l');
  });
});

describe('unicodeToPreeti', () => {
  it('converts simple consonants with no matra', () => {
    expect(unicodeToPreeti('क')).toBe('s');
  });

  it('reorders the short-i matra before its consonant', () => {
    // सि (स + ि): Preeti must draw the ि-shape (key l) before the
    // स-shape (key ;), otherwise the vowel sign renders on the wrong side.
    expect(unicodeToPreeti('सि')).toBe('l;');
  });

  it('does not reorder other matras, which attach normally', () => {
    expect(unicodeToPreeti('सा')).toBe(';f');
  });

  it('handles a real word containing the short-i matra mid-word', () => {
    expect(unicodeToPreeti('मित्र')).toBe('ldq');
  });

  it('round-trips common words through encode and decode', () => {
    for (const word of ['नमस्ते', 'सुन्दर', 'मित्र', 'सिता', 'काठमाडौं']) {
      expect(decodePreeti(unicodeToPreeti(word))).toBe(word);
    }
  });

  it('passes through characters with no Preeti mapping unchanged', () => {
    expect(unicodeToPreeti('क 5!')).toBe('s 5!');
  });
});
