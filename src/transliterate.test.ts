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

  it('inserts anusvara after the vowel it nasalizes', () => {
    expect(transliterate('kaaThamaaDauM')).toBe('काठमाडौं');
  });

  it('looks up dictionary words regardless of casing', () => {
    expect(transliterate('kathmandu')).toBe('काठमाडौं');
    expect(transliterate('Kathmandu')).toBe('काठमाडौं');
    expect(transliterate('KATHMANDU')).toBe('काठमाडौं');
  });

  it('uses the dictionary for a word embedded in a phonetic sentence', () => {
    expect(transliterate('kathmandu sundar chha.')).toBe('काठमाडौं सुन्दर छ।');
  });

  it('falls through to the phonetic engine for words not in the dictionary', () => {
    expect(transliterate('namaste')).toBe('नमस्ते');
  });

  it('merges in extraWords, which override the built-in dictionary', () => {
    expect(transliterate('biratnagar', { biratnagar: 'विराटनगर' })).toBe('विराटनगर');
    expect(transliterate('kathmandu', { kathmandu: 'काठमान्डू' })).toBe('काठमान्डू');
  });

  it('covers common retroflex place names and everyday words', () => {
    expect(transliterate('patan')).toBe('पाटन');
    expect(transliterate('butwal')).toBe('बुटवल');
    expect(transliterate('itahari')).toBe('इटहरी');
    expect(transliterate('birgunj')).toBe('वीरगन्ज');
    expect(transliterate('hetauda')).toBe('हेटौडा');
    expect(transliterate('dhangadhi')).toBe('धनगढी');
    expect(transliterate('tansen')).toBe('तान्सेन');
    expect(transliterate('topi')).toBe('टोपी');
    expect(transliterate('dhunga')).toBe('ढुंगा');
    expect(transliterate('ghadi')).toBe('घडी');
    expect(transliterate('natak')).toBe('नाटक');
    expect(transliterate('thulo')).toBe('ठुलो');
  });
});
