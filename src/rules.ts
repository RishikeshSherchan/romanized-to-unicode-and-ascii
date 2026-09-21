export const HALANT = '्';

export const VOWELS: Record<string, string> = {
  aa: 'आ', A: 'आ',
  ii: 'ई', I: 'ई',
  uu: 'ऊ', U: 'ऊ',
  ai: 'ऐ',
  au: 'औ',
  a: 'अ',
  i: 'इ',
  u: 'उ',
  e: 'ए',
  o: 'ओ',
};

export const MATRAS: Record<string, string> = {
  aa: 'ा', A: 'ा',
  ii: 'ी', I: 'ी',
  uu: 'ू', U: 'ू',
  ai: 'ै',
  au: 'ौ',
  i: 'ि',
  u: 'ु',
  e: 'े',
  o: 'ो',
};

export const CONSONANTS: Record<string, string> = {
  ksh: 'क्ष',
  gy: 'ज्ञ',
  chh: 'छ',
  kh: 'ख',
  gh: 'घ',
  ng: 'ङ',
  ch: 'च',
  jh: 'झ',
  ny: 'ञ',
  Th: 'ठ',
  Dh: 'ढ',
  th: 'थ',
  dh: 'ध',
  ph: 'फ',
  bh: 'भ',
  sh: 'श',
  Sh: 'ष',
  k: 'क',
  g: 'ग',
  j: 'ज',
  T: 'ट',
  D: 'ड',
  N: 'ण',
  t: 'त',
  d: 'द',
  n: 'न',
  p: 'प',
  f: 'फ',
  b: 'ब',
  m: 'म',
  y: 'य',
  r: 'र',
  l: 'ल',
  v: 'व',
  w: 'व',
  s: 'स',
  h: 'ह',
};

function sortedByLengthDesc(keys: string[]): string[] {
  return [...keys].sort((a, b) => b.length - a.length);
}

export const VOWEL_KEYS = sortedByLengthDesc(Object.keys(VOWELS));
export const MATRA_KEYS = sortedByLengthDesc(Object.keys(MATRAS));
export const CONSONANT_KEYS = sortedByLengthDesc(Object.keys(CONSONANTS));

export function matchLongest(input: string, pos: number, keys: string[]): string | null {
  for (const key of keys) {
    if (input.startsWith(key, pos)) return key;
  }
  return null;
}
