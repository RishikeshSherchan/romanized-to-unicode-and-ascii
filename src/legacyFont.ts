import { matchLongest, sortedByLengthDesc } from './rules.js';

const SHORT_I_MATRA = 'ि';
const REPH = 'र्'; // र + halant, as the first member of a conjunct (e.g. धर्म)

// Ordinary (non-pre-base) vowel signs and nasal marks. Used only to decide
// whether a character right after a reph-target consonant is decoration on
// that same syllable (चो in निमार्चोक) rather than an unrelated next
// consonant — reph must trigger after the whole decorated syllable, not
// wedge itself between the consonant and its own matra.
const MATRA_MARKS = new Set(['ा', 'ि', 'ी', 'ु', 'ू', 'ृ', 'े', 'ै', 'ो', 'ौ', 'ं', 'ः', 'ँ']);

// This family of legacy fonts (Preeti, Kantipur, and others built on the
// same underlying converter rules) shares two conventions beyond their
// per-font key tables, confirmed against Shuvayatra/preeti's own verified
// test vectors (not guessed):
//  - 'm' is a modifier suffix for a handful of letters that have no direct
//    key of their own (प+m -> फ, since these fonts have no standalone फ key)
//  - '{' is the reph trigger: typed AFTER the consonant reph attaches to,
//    since reph renders above/before that consonant but these fonts have
//    no shaping engine to reorder it themselves
const M_MODIFIER = 'm';
const REPH_TRIGGER = '{';

function isDevanagari(value: string): boolean {
  return [...value].some((ch) => {
    const code = ch.codePointAt(0) ?? 0;
    return code >= 0x0900 && code <= 0x097f;
  });
}

// Shared machinery for converting Unicode Devanagari into any legacy
// ASCII-glyph-hack font's encoding (Preeti, Kantipur, Himali, Ganesh, ...).
// Each of these fonts has its own font-designer-arbitrary key layout, but
// they all render the same script under the same rules, so the matching,
// reversal, and short-i reordering logic is identical — only the forward
// table differs per font.
export function createLegacyFontConverter(forwardMap: Record<string, string>) {
  // The reverse direction is derived from the forward map, never
  // hand-transcribed, so it can't drift from whatever verified source the
  // forward map was transcribed from.
  //
  // Some legacy keys are plain ASCII/punctuation passthroughs baked into
  // the same table (e.g. a key that just produces '!' or '='), for typing
  // ordinary symbols while in the legacy font. Inverting those would make
  // the converter "convert" already-fine punctuation into a different key,
  // so only Devanagari values (U+0900-U+097F) are included in the reverse
  // map. A few Unicode values are also reachable from more than one legacy
  // key; the first key encountered wins, stable since Object.entries
  // preserves insertion order.
  const reverseMap: Record<string, string> = {};
  for (const [legacyKey, unicodeSeq] of Object.entries(forwardMap)) {
    if (isDevanagari(unicodeSeq) && !(unicodeSeq in reverseMap)) {
      reverseMap[unicodeSeq] = legacyKey;
    }
  }

  // These fonts have no single key for the "compound" matras/vowels ो, ौ,
  // ओ, औ — they're built from two or three separate keys (confirmed via
  // Shuvayatra/preeti's test vectors, e.g. "आफ्नो" encodes ो as its ा-key
  // then its े-key). Likewise ण and ष have no standalone (inherent-vowel)
  // key, only their halant-attached form — typing [halant-key][ा-key] and
  // then discarding the halant is how real Preeti/Kantipur text represents
  // them; we replicate that same composite for our own encoded output.
  const aa = reverseMap['ा'];
  const e = reverseMap['े'];
  const ai = reverseMap['ै'];
  const a = reverseMap['अ'];
  if (a && aa) reverseMap['आ'] ??= a + aa;
  if (aa && e) {
    reverseMap['ो'] ??= aa + e;
    if (a) reverseMap['ओ'] ??= a + aa + e;
  }
  if (aa && ai) {
    reverseMap['ौ'] ??= aa + ai;
    if (a) reverseMap['औ'] ??= a + aa + ai;
  }
  if (aa) {
    const naHalant = reverseMap['ण्'];
    const shaHalant = reverseMap['ष्'];
    if (naHalant) reverseMap['ण'] ??= naHalant + aa;
    if (shaHalant) reverseMap['ष'] ??= shaHalant + aa;
  }
  const pa = reverseMap['प'];
  if (pa) reverseMap['फ'] ??= pa + M_MODIFIER;

  const unicodeKeys = sortedByLengthDesc(Object.keys(reverseMap));
  const shortIKey = reverseMap[SHORT_I_MATRA];

  // Converts real Devanagari Unicode into the legacy font's ASCII-glyph
  // encoding, so text can be displayed correctly in that font (which has
  // no glyphs at all in the Unicode Devanagari range — see README).
  // Longest-match first because some Unicode sequences (e.g. द्द, 3
  // codepoints) contain a shorter valid sequence (द्) as a prefix.
  //
  // The short-i matra (ि) is Unicode's one "pre-base" vowel sign: it's
  // encoded AFTER its consonant (logical order) but renders BEFORE it
  // visually — normally a font's shaping engine reorders this, but these
  // legacy fonts have no shaping smarts and just draw glyphs in the order
  // given, so the key for ि must be emitted before the consonant's key
  // whenever it follows one in the source text.
  //
  // Reph (र्, as the first member of a conjunct — धर्म, गर्न, कर्म) has the
  // opposite problem: Unicode puts it BEFORE the consonant it attaches to,
  // but it renders as a small hook above/after that consonant, and typing
  // it requires the consonant's own key followed by the reph trigger.
  function toLegacy(text: string): string {
    let result = '';
    let i = 0;

    while (i < text.length) {
      if (text.startsWith(REPH, i)) {
        const following = matchLongest(text, i + REPH.length, unicodeKeys);
        if (following) {
          let consumed = REPH.length + following.length;
          let unit = reverseMap[following];

          // The reph-target consonant may itself carry an ordinary matra
          // (चो, गे, ...) — that decoration stays attached to the consonant,
          // with the reph trigger coming after all of it, not in the middle.
          const decoration = matchLongest(text, i + consumed, unicodeKeys);
          if (decoration && decoration !== SHORT_I_MATRA && MATRA_MARKS.has(decoration)) {
            unit += reverseMap[decoration];
            consumed += decoration.length;
          }

          result += unit + REPH_TRIGGER;
          i += consumed;
          continue;
        }
      }

      const seq = matchLongest(text, i, unicodeKeys);
      if (seq) {
        const key = reverseMap[seq];
        if (seq !== SHORT_I_MATRA && text.startsWith(SHORT_I_MATRA, i + seq.length)) {
          result += shortIKey + key;
          i += seq.length + SHORT_I_MATRA.length;
        } else {
          result += key;
          i += seq.length;
        }
      } else {
        result += text[i];
        i += 1;
      }
    }

    return result;
  }

  return { reverseMap, toLegacy };
}
