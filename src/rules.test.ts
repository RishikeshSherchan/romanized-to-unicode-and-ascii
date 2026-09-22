import { describe, it, expect } from 'vitest';
import { CONSONANTS, VOWELS, MATRAS, MARKS, CONSONANT_KEYS, matchLongest } from './rules';

describe('rules tables', () => {
  it('maps basic consonants, vowels, and matras', () => {
    expect(CONSONANTS.k).toBe('क');
    expect(CONSONANTS.chh).toBe('छ');
    expect(VOWELS.a).toBe('अ');
    expect(MATRAS.aa).toBe('ा');
  });

  it('maps vocalic R vowels and the chandrabindu mark', () => {
    expect(VOWELS.R).toBe('ऋ');
    expect(VOWELS.RR).toBe('ॠ');
    expect(MATRAS.R).toBe('ृ');
    expect(MATRAS.RR).toBe('ॄ');
    expect(MARKS['~']).toBe('ँ');
    expect(MARKS.M).toBe('ं');
    expect(MARKS['.']).toBe('।');
  });

  it('orders consonant keys longest-first so multi-character sounds win', () => {
    expect(CONSONANT_KEYS.indexOf('ksh')).toBeLessThan(CONSONANT_KEYS.indexOf('k'));
    expect(CONSONANT_KEYS.indexOf('chh')).toBeLessThan(CONSONANT_KEYS.indexOf('ch'));
  });

  it('matchLongest finds the longest matching key at a position', () => {
    expect(matchLongest('ksha', 0, CONSONANT_KEYS)).toBe('ksh');
    expect(matchLongest('kata', 0, CONSONANT_KEYS)).toBe('k');
    expect(matchLongest('xyz', 0, CONSONANT_KEYS)).toBeNull();
  });
});
