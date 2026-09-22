import { describe, it, expect } from 'vitest';
import { HIMALI_TO_UNICODE, UNICODE_TO_HIMALI, unicodeToHimali } from './himali';

describe('himali mapping tables', () => {
  it('maps known Himali keys to their Unicode glyphs', () => {
    expect(HIMALI_TO_UNICODE.s).toBe('क');
    expect(HIMALI_TO_UNICODE.l).toBe('ि');
    expect(HIMALI_TO_UNICODE['@']).toBe('द्द');
  });

  it('derives the reverse map without drifting from the forward table', () => {
    expect(UNICODE_TO_HIMALI['क']).toBe('s');
    expect(UNICODE_TO_HIMALI['ि']).toBe('l');
  });

  it('prefers the visually-correct duplicate key for ा (f over F)', () => {
    // Both keys decode to ा per the table, but Himali's own test vectors
    // consistently use 'f' — same class of ambiguity as Preeti's «/| for
    // subscript-र, where the table alone can't tell us which renders right.
    expect(UNICODE_TO_HIMALI['ा']).toBe('f');
  });
});

describe('unicodeToHimali', () => {
  it('converts simple consonants with no matra', () => {
    expect(unicodeToHimali('क')).toBe('s');
  });

  it('reorders the short-i matra before its consonant', () => {
    expect(unicodeToHimali('सि')).toBe('l;');
  });

  it('passes through characters with no Himali mapping unchanged', () => {
    expect(unicodeToHimali('क 5!')).toBe('s 5!');
  });

  // Expected strings verified two ways against sapradhan/nep-ttf2utf's
  // dedicated Himali test vectors (test/vectors/fontasy_himali_tt.tsv):
  // either an exact string match, or — where multiple valid encodings
  // exist for the same meaning — running our output back through the
  // reference decode algorithm (char-map + post-rules) and confirming it
  // reconstructs the correct Unicode.
  it('matches the vector for a simple word', () => {
    expect(unicodeToHimali('नेपाल')).toBe('g]kfn');
  });

  it('decomposes ो into its two component matra keys', () => {
    expect(unicodeToHimali('गणेश')).toBe('u)f]z');
  });

  it('decomposes ौ into its two component matra keys', () => {
    expect(unicodeToHimali('पौवा')).toBe('kf}jf');
  });

  it('repositions reph (र्) after the consonant it attaches to', () => {
    expect(unicodeToHimali('गर्न')).toBe('ug{');
  });

  it('keeps a matra attached to its reph-target consonant, trigger last', () => {
    expect(unicodeToHimali('निमार्चोक')).toBe('lgdfrf]{s');
  });

  it('uses bare consonant + subscript-र key for conjuncts with no dedicated ligature', () => {
    expect(unicodeToHimali('उप्रेती')).toBe('pk|]tL');
  });

  it('reorders short-i before a whole [consonant+subscript-र] cluster, not just the consonant', () => {
    // राष्ट्रिय: ि attaches after ष्ट्र as a unit (rendered via the ट्र
    // subscript-र cluster) — this previously stranded ि after the cluster
    // instead of moving it before, since the subscript-र special case
    // didn't check for a following short-i the way the normal path does.
    expect(unicodeToHimali('राष्ट्रिय')).toBe('/fil^|o');
  });

  it('builds independent ऊ from उ + the m-modifier, like फ from प + m', () => {
    expect(unicodeToHimali('जाऊ')).toBe('hfpm');
  });
});
