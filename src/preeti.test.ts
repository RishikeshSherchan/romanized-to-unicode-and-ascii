import { describe, it, expect } from 'vitest';
import { PREETI_TO_UNICODE, UNICODE_TO_PREETI, unicodeToPreeti } from './preeti';

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

  it('passes through characters with no Preeti mapping unchanged', () => {
    expect(unicodeToPreeti('क 5!')).toBe('s 5!');
  });

  // The following expected strings are not guessed — each is copied
  // directly from Shuvayatra/preeti's own verified test vector suite
  // (github.com/Shuvayatra/preeti/blob/master/test/preeti.vector.json),
  // which pairs real Preeti-encoded text with its correct Unicode meaning.
  // Using the same words here confirms our encoder produces text that
  // library's own decoder would read back correctly.
  it('decomposes ो into its two component matra keys (no direct key exists)', () => {
    expect(unicodeToPreeti('गणेश')).toBe('u0f]z');
  });

  it('decomposes ौ into its two component matra keys', () => {
    expect(unicodeToPreeti('पौवा')).toBe('kf}jf');
  });

  it('builds bare ष from its halant key plus आ-matra, per the cleanup convention', () => {
    expect(unicodeToPreeti('षोडशी')).toBe('iff]8zL');
  });

  it('repositions reph (र्) after the consonant it attaches to', () => {
    expect(unicodeToPreeti('गर्न')).toBe('ug{');
  });

  it('keeps a matra attached to its reph-target consonant, trigger last', () => {
    // निमार्चोक: reph attaches to च, which also carries the ो matra —
    // the reph trigger must come after the whole चो syllable, not between
    // च and its matra.
    expect(unicodeToPreeti('निमार्चोक')).toBe('lgdfrf]{s');
  });

  it('uses bare consonant + subscript-र key for conjuncts with no dedicated ligature', () => {
    // प्र has no precomposed key (only त्र, द्र, श्र, ध्र do) — a working
    // reference converter confirms the correct encoding is bare प + the
    // subscript-र key ('|', verified in an actual Preeti-installed editor —
    // '«' decodes to the same Unicode value but renders visibly wrong),
    // not प्'s own halant-key followed by bare र.
    expect(unicodeToPreeti('उप्रेती')).toBe('pk|]tL');
  });

  it('leaves conjuncts with their own precomposed ligature key untouched', () => {
    expect(unicodeToPreeti('मित्र')).toBe('ldq');
  });
});
