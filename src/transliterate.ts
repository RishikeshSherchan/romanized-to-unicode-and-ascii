import {
  VOWELS,
  MATRAS,
  CONSONANTS,
  MARKS,
  HALANT,
  VOWEL_KEYS,
  MATRA_KEYS,
  CONSONANT_KEYS,
  MARK_KEYS,
  matchLongest,
} from './rules.js';
import { WORDS } from './words.js';

// A "word" is a maximal run of letters (or the mid-word chandrabindu
// trigger `~`); everything else (spaces, digits, punctuation) is a
// separator. Splitting on this boundary is what lets the dictionary
// look up whole words while leaving surrounding text untouched.
const WORD_TOKEN = /[A-Za-z~]+|[^A-Za-z~]+/g;

export function transliterate(input: string, extraWords?: Record<string, string>): string {
  const dictionary = extraWords ? { ...WORDS, ...extraWords } : WORDS;
  const tokens = input.match(WORD_TOKEN) ?? [];

  return tokens
    .map((token) => dictionary[token.toLowerCase()] ?? transliteratePhonetic(token))
    .join('');
}

function transliteratePhonetic(input: string): string {
  let result = '';
  let i = 0;

  while (i < input.length) {
    const markKey = matchLongest(input, i, MARK_KEYS);
    if (markKey) {
      result += MARKS[markKey];
      i += markKey.length;
      continue;
    }

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
