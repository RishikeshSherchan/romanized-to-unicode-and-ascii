import { describe, it, expect } from 'vitest';
import { transliterate } from './transliterate';

describe('transliterate', () => {
  it('converts a bare vowel', () => {
    expect(transliterate('a')).toBe('अ');
  });

  it('converts a consonant with the inherent vowel', () => {
    expect(transliterate('ka')).toBe('क');
  });

  it('converts an aspirated consonant', () => {
    expect(transliterate('kha')).toBe('ख');
  });

  it('applies a matra when a vowel follows a consonant', () => {
    expect(transliterate('ki')).toBe('कि');
  });

  it('converts a full simple word', () => {
    expect(transliterate('sita')).toBe('सित');
    expect(transliterate('kamala')).toBe('कमल');
  });

  it('inserts halant for a consonant cluster with no vowel between', () => {
    expect(transliterate('kt')).toBe('क्त');
  });

  it('handles the special ksh and gy conjunct clusters', () => {
    expect(transliterate('ksha')).toBe('क्ष');
    expect(transliterate('gyaan')).toBe('ज्ञान');
  });

  it('converts a common word with an internal conjunct', () => {
    expect(transliterate('namaste')).toBe('नमस्ते');
  });

  it('passes through unmapped characters unchanged', () => {
    expect(transliterate('ka 5!')).toBe('क 5!');
  });

  it('handles a full sentence with spaces, digits, and punctuation', () => {
    expect(transliterate('namaste 2026!')).toBe('नमस्ते 2026!');
  });

  it('converts vocalic R words (short and long)', () => {
    expect(transliterate('RShi')).toBe('ऋषि');
    expect(transliterate('kRShNa')).toBe('कृष्ण');
    expect(transliterate('RR')).toBe('ॠ');
  });

  it('inserts chandrabindu right after the vowel it nasalizes', () => {
    expect(transliterate('aa~khaa')).toBe('आँखा');
  });

  it('converts a period to purna biram (danda)', () => {
    expect(transliterate('aankhaa mero naam ho.')).toBe('आन्खा मेरो नाम हो।');
  });
});
