# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A zero-dependency TypeScript library with two jobs:

1. **Phonetic transliteration**: convert romanized/phonetic Nepali text (`"namaste"`) into real Devanagari Unicode (`"नमस्ते"`) — no keyboard layout, no font hacks.
2. **Legacy font conversion**: convert that same Unicode text into the ASCII-glyph encoding that old pre-Unicode Nepali fonts (Preeti, Kantipur, Himali) actually use internally, for cases where you need to produce output for one of those fonts (e.g. matching an old printed document).

An optional React binding ships under a separate `/react` subpath so the core package stays dependency-free for non-React consumers.

## Commands

```bash
pnpm build   # tsc — compiles src/ to dist/ (includes .d.ts generation, and the /react subpath's .tsx files)
pnpm test    # vitest run — all tests, once
```

Run a single test file: `pnpm vitest run src/preeti.test.ts`. There is no lint script configured.

The demo page (`demo/index.html`) is not part of the package — it imports directly from `../dist/index.js`, so run `pnpm build` before testing it in a browser. It needs a static server run from the **repo root** (not `demo/`), because browsers block ES module imports over `file://` and the page's relative import paths assume root-relative serving:

```bash
python3 -m http.server 8080   # from repo root
# open http://localhost:8080/demo/index.html
```

## Architecture

### Phonetic engine (`rules.ts` → `transliterate.ts` → `words.ts`)

`rules.ts` holds the romanization tables (`VOWELS`, `MATRAS`, `CONSONANTS`, `MARKS`) plus two shared utilities used everywhere in this codebase: `sortedByLengthDesc` and `matchLongest`. Every conversion function in this project — the phonetic engine and all three legacy converters — is a greedy longest-match loop over one of these tables, built with these two helpers. If you're adding a new mapping table (a new mark, a new legacy font), reuse them rather than writing another matching loop.

`transliterate(input, extraWords?)` first splits the input into word/non-word tokens and checks each word against `words.ts`'s `WORDS` dictionary (merged with `extraWords`) before falling through to the phonetic engine. That dictionary exists because plain English spelling can't disambiguate retroflex-vs-dental consonants, vowel length, or anusvara — casual spellings of common words (`"kathmandu"`) don't round-trip through the phonetic rules on their own. Words already in `WORDS` are the ones this has been fixed for.

### Legacy font converters (`legacyFont.ts` → `preeti.ts` / `kantipur.ts` / `himali.ts`)

`legacyFont.ts`'s `createLegacyFontConverter(forwardMap)` is a factory — each of `preeti.ts`/`kantipur.ts`/`himali.ts` is just a verified `{key: unicodeValue}` table plus one call to this factory. All the actual hard logic lives in the factory, because these fonts share the same underlying design (confirmed identical "post-rules" pipeline across multiple independent source projects):

- **Short-i pre-base reordering**: Unicode's ि is logically encoded *after* its consonant but renders *before* it — the factory emits the ि key first whenever it follows a matched unit, including when that unit is a whole reph/subscript-र cluster (not just a bare consonant).
- **Reph repositioning**: र् (as the first member of a conjunct — धर्म, गर्न) is logically *before* its consonant in Unicode but the font needs it typed *after*, via a literal `{` trigger character. If the target consonant also carries its own matra (चो in निमार्चोक), the trigger goes after the whole decorated syllable, not wedged in the middle.
- **Subscript-र preference**: प्र-style conjuncts with no dedicated ligature key must be built as `[bare consonant][subscript-र key]`, not `[consonant's own halant-key][bare र]` — both are valid *decodes* of the same meaning, but only one renders correctly in the actual font.
- **Compound vowel composition**: ो, ौ, आ, ओ, औ have no single key in any of these fonts — they're built from 2–3 separate keys (े+ा, ै+ा, etc.), derived automatically from whichever keys the font uses for its component parts.
- **The `m`-modifier trick**: ण, ष, फ, and independent ऊ have no direct key either; they're built via `[halant-key]+ा` (cleaned up by a font-side rule) or `[base-key]+'m'` depending on the specific letter — see the comments in `legacyFont.ts` for which pattern applies to which letter.
- **Duplicate-key preference**: some fonts have two different keys that both *decode* to the same Unicode value, but only one *renders* correctly — this can't be determined from the mapping table alone. `KEY_PREFERENCES` in `legacyFont.ts` lists the ones confirmed by actually testing output in a real font-installed editor (Preeti's `«`/`|` for subscript-र; Himali's `F`/`f` for ा). If you add a new legacy font and output looks visually wrong despite matching the table, suspect this before anything else — check for a second key mapping to the same value and test both in a real copy of the font.

### Verification methodology (read this before touching a legacy font table)

Every legacy font table in this repo is transcribed from a verified open-source converter (never reconstructed from memory — these key layouts are font-designer-arbitrary, not phonetic, so there's no way to guess them), then checked byte-for-byte against that source programmatically, and cross-checked against a *second independent* source where one exists. Beyond that, tables are validated against the source project's own test vectors — but **exact string match against a vector is the wrong bar**, since multiple valid encodings can exist for the same meaning (confirmed by decoding our own output through the reference algorithm and checking it reconstructs the correct Unicode, not by requiring byte-identical output). The real ground truth, when available, is pasting output into an actual document with the real font installed — that's what caught the duplicate-key issues above, which no amount of table-checking would have found.

If you're extending this to another legacy font: find its table from an actual open-source converter project, verify it programmatically against the source, and don't trust any single key's correctness — including this project's own existing tables — over real font rendering if the two ever disagree.

### Known limitations (by design, not bugs)

- **Literal ASCII punctuation collision**: characters like `(` and `)` are repurposed as Devanagari-producing keys in some of these fonts, so literal parentheses mixed into otherwise-Devanagari text can't currently round-trip as literal punctuation. Shared across all three converters.
- **Reph on a consonant that's itself mid-conjunct** (हेर्थ्यो: reph lands on थ, which also conjuncts with य) is a compounding edge case beyond the reordering rules above and isn't handled.
- The phonetic engine's short-i handling in `transliterate.ts` is unrelated to the legacy converters' pre-base reordering — Unicode text itself doesn't need positional correction, only the ASCII-glyph fonts do.

### React subpath (`src/react/`)

`TransliterateInput` is a controlled `<textarea>` — the raw romanized keystroke buffer is tracked in a ref (`beforeInputBuffer.ts`, a pure function, unit-tested without any DOM/testing-library dependency) since the displayed value is always already-converted Unicode and can't itself be re-fed through `transliterate()`. `LegacyEncodedPreview` is a thin wrapper picking one of the three converters by a `font` prop. `react` is an optional peer dependency — only pulled in if a consumer imports from `romanized-to-unicode-and-ascii/react`; the main entry point stays dependency-free.

## License

PolyForm Noncommercial 1.0.0 — free for personal/noncommercial use, commercial use requires a separate agreement with the author (see `LICENSE`).
