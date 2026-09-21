# Nepali Unicode Transliteration Library — Design

Date: 2026-09-21

## Problem

Typing Nepali normally requires either a Devanagari keyboard layout
(unfamiliar key positions) or old hack fonts (Preeti/Kantipur) that
remap Latin ASCII codepoints to Devanagari-look glyphs — producing text
that is NOT real Unicode (breaks on copy/paste, search, other fonts).

Goal: a reusable JS/TS library that takes romanized/phonetic input
("namaste") and returns real Devanagari Unicode text ("नमस्ते"), so any
consumer (web app, Node script) can pair it with a standard Unicode
Devanagari font (e.g. Noto Sans Devanagari) and get correct Nepali text
with zero new keyboard layout to learn.

## Scope (v1)

In scope:
- Pure function `transliterate(input: string): string`
- Standard phonetic scheme (Sanscript/ITRANS-style): "ka"→क, "kha"→ख,
  "a"→अ, "aa"/"A"→आ, conjuncts via halant insertion, common matras
- Works identically in Node and browser (no DOM dependency)
- README with usage + a short curated list of recommended Devanagari
  Unicode fonts (Noto Sans Devanagari, Mukta, Hind Guptha)

Out of scope (explicitly deferred):
- Live-typing DOM/React binding (cursor-aware input handling) — add
  only once wired into a real input field
- Custom/Preeti-key-position romanization scheme
- Build bundler / multi-target packaging beyond plain `tsc` output

## Architecture

Single TypeScript package, zero runtime dependencies.

```
src/
  rules.ts          - static mapping tables (vowels, consonants, matras, specials)
  transliterate.ts  - greedy longest-match tokenizer engine
  index.ts          - public re-export
transliterate.test.ts - acceptance table of known word pairs
README.md
package.json (pnpm)
```

### Algorithm

Greedy longest-match tokenizer, same family of approach used by
Sanscript and other ITRANS-style engines:

1. Walk the input string left to right.
2. At each position, try matching the longest known Roman sequence
   first (e.g. "ksh" before falling back to "k" + "sh" + "h"), so
   multi-character consonant clusters and aspirated consonants aren't
   mis-split.
3. Vowel immediately following a consonant → replace the consonant's
   inherent vowel with the corresponding matra, rather than emitting a
   separate vowel letter.
4. Consonant immediately followed by another consonant (no vowel
   between) → insert halant (्) to form a conjunct.
5. Any character with no mapping (digits already in Nepali form,
   punctuation, unknown sequences) passes through unchanged.

### Error handling

No throwing. Unmapped input passes through as-is — matches standard
phonetic IME behavior and avoids crashing on mixed-language text (e.g.
"namaste 2026" should not error on the digits).

### Testing

One test file, `transliterate.test.ts` (vitest), containing a table of
known romanized → Devanagari word pairs covering: simple vowels,
simple consonants, aspirated consonants, common conjuncts, and a full
sentence. This table is both the spec and the regression check.

## Non-goals / risks

- Ambiguity is inherent to phonetic transliteration (e.g. Roman "a" at
  word start vs mid-word behaves differently in some schemes) — v1
  picks the standard Sanscript convention and does not attempt to
  support multiple simultaneous schemes.
- This library does not attempt spellchecking or dictionary lookup —
  it's a mechanical phonetic mapping only.
