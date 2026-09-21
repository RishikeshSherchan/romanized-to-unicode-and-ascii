import {
  VOWELS,
  MATRAS,
  CONSONANTS,
  HALANT,
  VOWEL_KEYS,
  MATRA_KEYS,
  CONSONANT_KEYS,
  matchLongest,
} from './rules';

export function transliterate(input: string): string {
  let result = '';
  let i = 0;

  while (i < input.length) {
    const consonantKey = matchLongest(input, i, CONSONANT_KEYS);

    if (consonantKey) {
      const consonantChar = CONSONANTS[consonantKey];
      i += consonantKey.length;

      const matraKey = matchLongest(input, i, MATRA_KEYS);
      if (matraKey) {
        result += consonantChar + MATRAS[matraKey];
        i += matraKey.length;
        continue;
      }

      if (input[i] === 'a') {
        result += consonantChar;
        i += 1;
        continue;
      }

      const nextIsConsonant = matchLongest(input, i, CONSONANT_KEYS) !== null;
      if (nextIsConsonant) {
        result += consonantChar + HALANT;
      } else {
        result += consonantChar;
      }
      continue;
    }

    const vowelKey = matchLongest(input, i, VOWEL_KEYS);
    if (vowelKey) {
      result += VOWELS[vowelKey];
      i += vowelKey.length;
      continue;
    }

    result += input[i];
    i += 1;
  }

  return result;
}
