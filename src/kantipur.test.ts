import { describe, it, expect } from 'vitest';
import { KANTIPUR_TO_UNICODE, UNICODE_TO_KANTIPUR, unicodeToKantipur } from './kantipur';

describe('kantipur mapping tables', () => {
  it('maps known Kantipur keys to their Unicode glyphs', () => {
    expect(KANTIPUR_TO_UNICODE.s).toBe('क');
    expect(KANTIPUR_TO_UNICODE.l).toBe('ि');
    expect(KANTIPUR_TO_UNICODE['2']).toBe('द्द');
  });

  it('derives the reverse map without drifting from the forward table', () => {
    expect(UNICODE_TO_KANTIPUR['क']).toBe('s');
    expect(UNICODE_TO_KANTIPUR['ि']).toBe('l');
  });

  it('keeps ष direct, since Kantipur (unlike Preeti) has its own bare key', () => {
    expect(UNICODE_TO_KANTIPUR['ष']).toBe('È');
  });
});

describe('unicodeToKantipur', () => {
  it('converts simple consonants with no matra', () => {
    expect(unicodeToKantipur('क')).toBe('s');
  });

  it('reorders the short-i matra before its consonant', () => {
    expect(unicodeToKantipur('सि')).toBe('l;');
  });

  it('handles a real word containing the short-i matra mid-word', () => {
    expect(unicodeToKantipur('मित्र')).toBe('ldq');
  });

  it('passes through characters with no Kantipur mapping unchanged', () => {
    expect(unicodeToKantipur('क 5!')).toBe('s 5!');
  });

  // Expected strings copied directly from Shuvayatra/preeti's own verified
  // test vectors (test/kantipur.vector.json), same source used for Preeti.
  it('decomposes ो into its two component matra keys (no direct key exists)', () => {
    expect(unicodeToKantipur('गणेश')).toBe('u0f]z');
  });

  it('decomposes ौ into its two component matra keys', () => {
    expect(unicodeToKantipur('पौवा')).toBe('kf}jf');
  });

  it('uses the direct ष key rather than the halant+aa-matra workaround', () => {
    // Unlike Preeti, Kantipur has its own bare ष key, so षोडशी should NOT
    // need the halant-then-cleanup composite Preeti requires.
    expect(unicodeToKantipur('षोडशी')).toBe('Èf]8zL');
  });

  it('repositions reph (र्) after the consonant it attaches to', () => {
    expect(unicodeToKantipur('गर्न')).toBe('ug{');
  });

  it('keeps a matra attached to its reph-target consonant, trigger last', () => {
    expect(unicodeToKantipur('निमार्चोक')).toBe('lgdfrf]{s');
  });

  it('matches the vector for a word using the mad-dat conjunct', () => {
    expect(unicodeToKantipur('मद्दत')).toBe('d2t');
  });

  it('uses the direct ष key for vocalic-R words too, not the workaround', () => {
    // The shared vector file (copied verbatim from Preeti's own vectors)
    // says "Clif", using Preeti's halant+aa-matra workaround — but Kantipur
    // has its own bare ष key ('È'), so our encoder correctly prefers the
    // shorter, more direct "ClÈ" instead.
    expect(unicodeToKantipur('ऋषि')).toBe('ClÈ');
  });
});
