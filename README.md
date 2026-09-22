# nepali-unicode

Convert romanized/phonetic Nepali text into real Devanagari Unicode —
no special keyboard layout, no Preeti/Kantipur-style font hacks.

## Install

```bash
pnpm add nepali-unicode
```

## Usage

```ts
import { transliterate } from 'nepali-unicode';

transliterate('namaste'); // 'नमस्ते'
```

The output is real Devanagari Unicode (U+0900–U+097F) — safe to copy,
search, and render in any standard Devanagari font.

## Scheme

Standard phonetic (Sanscript/ITRANS-style): "ka" → क, "kha" → ख,
"aa"/"A" → आ, etc. Consonant clusters with no vowel between them form
conjuncts automatically (e.g. "namaste" → नमस्ते). Unmapped characters
(digits, punctuation, spaces) pass through unchanged. Vocalic R ("R"/"RR"
→ ऋ/ॠ), chandrabindu ("~" → ँ), anusvara ("M" → ं), and "." → । (purna
biram) are also supported.

Plain English spelling can't disambiguate retroflex vs. dental
consonants, vowel length, or anusvara — so casual spellings of common
words (e.g. "kathmandu") won't round-trip through the phonetic rules
correctly on their own. A small built-in dictionary (`WORDS`) intercepts
known words by exact (case-insensitive) match before the phonetic engine
runs:

```ts
transliterate('kathmandu'); // 'काठमाडौं' — from the dictionary
transliterate('kaaThamaaDauM'); // 'काठमाडौं' — same result via precise phonetic spelling
```

Add your own words with the optional second argument (yours override the
built-in list on conflict):

```ts
transliterate('biratnagar', { biratnagar: 'विराटनगर' });
```

## Recommended Devanagari fonts

Pair this library's output with any Unicode-correct Devanagari font.
Recommended free options:

- **Noto Sans Devanagari** — Google's default, broad script coverage, good conjunct rendering.
- **Mukta** — clean, popular for UI text.
- **Hind Guptha** — designed for Nepali/Devanagari readability at small sizes.

Avoid legacy fonts like Preeti or Kantipur — they remap Latin ASCII
codepoints to Devanagari-look glyphs instead of using real Unicode, so
text typed in them breaks when copied, searched, or shown in another font.
