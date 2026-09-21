# Nepali Unicode Transliteration Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable, dependency-free TypeScript library that converts romanized/phonetic Nepali text ("namaste") into real Devanagari Unicode text ("नमस्ते").

**Architecture:** A static rule-table module (`rules.ts`) plus a single greedy longest-match tokenizer function (`transliterate.ts`) that walks the input left to right, consuming consonants/vowels and deciding between inherent vowel, matra substitution, or halant (conjunct) insertion at each step. Pure function, no DOM, runs identically in Node and browser.

**Tech Stack:** TypeScript, pnpm, vitest (testing), plain `tsc` for build (no bundler).

**Spec:** `docs/superpowers/specs/2026-09-21-nepali-unicode-transliteration-design.md`

## Global Constraints

- Zero runtime dependencies.
- Must run identically in Node and browser (no DOM APIs in `src/`).
- Romanization scheme: standard phonetic / Sanscript-ITRANS-style (as fixed in the spec).
- Unmapped input characters (digits, punctuation, unknown sequences) pass through unchanged — the library never throws on unrecognized input.
- Package manager: pnpm.
- Test runner: vitest.

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `src/sanity.test.ts`

**Interfaces:**
- Produces: a working `pnpm install` / `pnpm test` / `pnpm build` toolchain that later tasks assume exists.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "nepali-unicode",
  "version": "0.1.0",
  "description": "Transliterate romanized/phonetic text into real Devanagari Unicode (Nepali).",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Write `.gitignore`**

```
node_modules
dist
```

- [ ] **Step 5: Write a sanity test to prove the toolchain works**

`src/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('project wiring', () => {
  it('runs tests via vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Install and run**

Run: `pnpm install && pnpm test`
Expected: 1 test file, 1 test, PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts .gitignore pnpm-lock.yaml src/sanity.test.ts
git commit -m "chore: scaffold project (pnpm, typescript, vitest)"
```

---

### Task 2: Rule tables

**Files:**
- Create: `src/rules.ts`
- Test: `src/rules.test.ts`

**Interfaces:**
- Consumes: nothing (leaf module).
- Produces (used by Task 3):
  - `HALANT: string`
  - `VOWELS: Record<string, string>`
  - `MATRAS: Record<string, string>`
  - `CONSONANTS: Record<string, string>`
  - `VOWEL_KEYS: string[]` (all `VOWELS` keys, sorted longest-first)
  - `MATRA_KEYS: string[]` (all `MATRAS` keys, sorted longest-first)
  - `CONSONANT_KEYS: string[]` (all `CONSONANTS` keys, sorted longest-first)
  - `matchLongest(input: string, pos: number, keys: string[]): string | null`

- [ ] **Step 1: Write the failing test**

`src/rules.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { CONSONANTS, VOWELS, MATRAS, CONSONANT_KEYS, matchLongest } from './rules';

describe('rules tables', () => {
  it('maps basic consonants, vowels, and matras', () => {
    expect(CONSONANTS.k).toBe('क');
    expect(CONSONANTS.chh).toBe('छ');
    expect(VOWELS.a).toBe('अ');
    expect(MATRAS.aa).toBe('ा');
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `src/rules.ts` does not exist yet.

- [ ] **Step 3: Write `src/rules.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS (4 tests: 1 sanity + 3 rules).

- [ ] **Step 5: Commit**

```bash
git add src/rules.ts src/rules.test.ts
git commit -m "feat: add Devanagari romanization rule tables"
```

---

### Task 3: Transliteration engine

**Files:**
- Create: `src/transliterate.ts`
- Create: `src/index.ts`
- Test: `src/transliterate.test.ts`
- Modify: delete `src/sanity.test.ts` (no longer needed once real tests exist)

**Interfaces:**
- Consumes: `HALANT`, `VOWELS`, `MATRAS`, `CONSONANTS`, `VOWEL_KEYS`, `MATRA_KEYS`, `CONSONANT_KEYS`, `matchLongest` from `./rules` (Task 2).
- Produces (used by Task 4 and by library consumers): `transliterate(input: string): string`, re-exported from `src/index.ts`.

- [ ] **Step 1: Write the failing test**

`src/transliterate.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `src/transliterate.ts` does not exist yet.

- [ ] **Step 3: Write `src/transliterate.ts`**

```ts
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
```

- [ ] **Step 4: Write `src/index.ts`**

```ts
export { transliterate } from './transliterate';
```

- [ ] **Step 5: Delete the now-unneeded sanity test**

Run: `rm src/sanity.test.ts`

- [ ] **Step 6: Run tests to verify everything passes**

Run: `pnpm test`
Expected: PASS (all `rules.test.ts` + `transliterate.test.ts` tests, sanity test gone).

- [ ] **Step 7: Commit**

```bash
git add -A src/
git commit -m "feat: implement phonetic-to-Devanagari transliteration engine"
```

---

### Task 4: Integration test, README, and build verification

**Files:**
- Test: `src/transliterate.test.ts` (add one integration test)
- Create: `README.md`

**Interfaces:**
- Consumes: `transliterate` from `./index` (public API, as an outside consumer would).
- Produces: nothing further consumed by other tasks — this is the final task.

- [ ] **Step 1: Add a sentence-level integration test**

Append to `src/transliterate.test.ts`:

```ts
  it('handles a full sentence with spaces, digits, and punctuation', () => {
    expect(transliterate('namaste 2026!')).toBe('नमस्ते 2026!');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL if the sentence case exposes a bug; otherwise it should already PASS since it composes behavior already implemented in Task 3. Either way, confirm the actual result before moving on.

- [ ] **Step 3: Fix `src/transliterate.ts` only if Step 2 failed**

No changes are anticipated — this step exists only to close the loop if the integration test surfaces an edge case the unit tests missed.

- [ ] **Step 4: Run tests to verify everything passes**

Run: `pnpm test`
Expected: PASS, all tests green.

- [ ] **Step 5: Write `README.md`**

```markdown
# nepali-unicode

Convert romanized/phonetic Nepali text into real Devanagari Unicode —
no special keyboard layout, no Preeti/Kantipur-style font hacks.

## Install

\`\`\`bash
pnpm add nepali-unicode
\`\`\`

## Usage

\`\`\`ts
import { transliterate } from 'nepali-unicode';

transliterate('namaste'); // 'नमस्ते'
\`\`\`

The output is real Devanagari Unicode (U+0900–U+097F) — safe to copy,
search, and render in any standard Devanagari font.

## Scheme

Standard phonetic (Sanscript/ITRANS-style): "ka" → क, "kha" → ख,
"aa"/"A" → आ, etc. Consonant clusters with no vowel between them form
conjuncts automatically (e.g. "namaste" → नमस्ते). Unmapped characters
(digits, punctuation, spaces) pass through unchanged.

## Recommended Devanagari fonts

Pair this library's output with any Unicode-correct Devanagari font.
Recommended free options:

- **Noto Sans Devanagari** — Google's default, broad script coverage, good conjunct rendering.
- **Mukta** — clean, popular for UI text.
- **Hind Guptha** — designed for Nepali/Devanagari readability at small sizes.

Avoid legacy fonts like Preeti or Kantipur — they remap Latin ASCII
codepoints to Devanagari-look glyphs instead of using real Unicode, so
text typed in them breaks when copied, searched, or shown in another font.
```

- [ ] **Step 6: Verify the build**

Run: `pnpm build`
Expected: `dist/index.js`, `dist/transliterate.js`, `dist/rules.js`, and their `.d.ts` files are generated with no errors.

- [ ] **Step 7: Commit**

```bash
git add src/transliterate.test.ts README.md
git commit -m "test: add sentence-level integration test; add README with usage and font recommendations"
```
