# romanized-to-unicode-and-ascii

Convert romanized/phonetic Nepali text into real Devanagari Unicode — no
special keyboard layout, no Preeti/Kantipur-style font hacks — and, if you
need to support legacy documents, convert that Unicode into the ASCII-glyph
encoding those old fonts actually use.

## Install

```bash
pnpm add romanized-to-unicode-and-ascii
```

## Usage

```ts
import { transliterate } from 'romanized-to-unicode-and-ascii';

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

## Legacy font converters

Old Nepali fonts (Preeti, Kantipur, Himali, ...) predate Unicode support —
they remap Latin ASCII codepoints to Devanagari-look glyphs, so text typed
in them isn't real Unicode and breaks when copied, searched, or shown in
another font. If you need to produce text for one of these fonts anyway
(e.g. printing to match an old document), convert your Unicode text with:

```ts
import { unicodeToPreeti, unicodeToKantipur, unicodeToHimali } from 'romanized-to-unicode-and-ascii';

unicodeToPreeti('नमस्ते'); // 'gd:t]' — displays correctly only when rendered in the Preeti font
```

Each converter's mapping table is transcribed from verified open-source
sources (not guessed) and cross-checked against real test vectors — see
the source comments in `src/preeti.ts`, `src/kantipur.ts`, and
`src/himali.ts` for exact provenance. Known limitation shared by all
three: literal ASCII punctuation that a font has repurposed as a
Devanagari key (e.g. `(` and `)` in some fonts) can't currently round-trip
as literal punctuation.

## Recommended Devanagari fonts

Pair this library's output with any Unicode-correct Devanagari font.
Recommended free options:

- **Noto Sans Devanagari** — Google's default, broad script coverage, good conjunct rendering.
- **Mukta** — clean, popular for UI text.
- **Hind Guptha** — designed for Nepali/Devanagari readability at small sizes.

## License

[PolyForm Noncommercial License 1.0.0](LICENSE) — free for personal,
educational, and other noncommercial use. Commercial use requires a
separate agreement — contact the author.
