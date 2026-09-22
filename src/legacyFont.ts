import { matchLongest, sortedByLengthDesc } from './rules.js';

const SHORT_I_MATRA = 'ि';
const REPH = 'र्'; // र + halant, as the first member of a conjunct (e.g. धर्म)
const SUBSCRIPT_RA = '्र'; // halant + र, as the SECOND member of a conjunct (e.g. प्र, क्र)

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

  // Two keys decoding to the same Unicode value doesn't mean they render
  // identically — confirmed empirically (not guessed) in real testing:
  // Preeti's '«' and '|' both decode to '्र' (subscript-र), but only '|'
  // renders correctly ('«' shows visibly wrong in an actual Preeti-
  // installed editor); Himali's 'F' and 'f' both decode to 'ा', but its
  // own test vectors consistently use 'f'. Since the table itself gives no
  // signal for which duplicate is the visually-correct one, list the
  // preferences we've actually confirmed and apply them when both keys
  // exist for a given font.
  const KEY_PREFERENCES: Array<[unicodeValue: string, preferred: string, other: string]> = [
    [SUBSCRIPT_RA, '|', '«'],
    ['ा', 'f', 'F'],
  ];
  for (const [value, preferred, other] of KEY_PREFERENCES) {
    if (forwardMap[preferred] === value && forwardMap[other] === value) {
      reverseMap[value] = preferred;
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

  // Independent (word-initial, non-matra) ऊ has no key of its own either —
  // same 'm'-modifier trick as फ, confirmed via "hfpm" -> "जाऊ" in the
  // shared test vectors (उ-key + 'm' collapses to ऊ via a post-rule).
  const ua = reverseMap['उ'];
  if (ua) reverseMap['ऊ'] ??= ua + M_MODIFIER;

  const unicodeKeys = sortedByLengthDesc(Object.keys(reverseMap));
  const shortIKey = reverseMap[SHORT_I_MATRA];
  const subscriptRaKey = reverseMap[SUBSCRIPT_RA];

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
  //
  // र as the SECOND member of a conjunct (प्र, क्र, ...) needs its own care:
  // greedy longest-match would happily consume [consonant]+halant as that
  // consonant's own precomposed halant-key (प् -> K), leaving र to be typed
  // separately (bare र -> /) — technically a valid decoding, but visually
  // wrong, since these fonts draw a dedicated subscript-र glyph meant to
  // attach to a FULL-form consonant, not their own halant-form. Confirmed
  // against a working reference converter for प्र specifically: the
  // correct encoding is [bare consonant][subscript-र key], not
  // [consonant's halant-key][bare र]. The handful of conjuncts with their
  // own hand-drawn ligature (त्र, द्र, श्र, ध्र) are unaffected — those are
  // matched whole by the normal longest-match path below before this
  // check would ever apply.
  function toLegacy(text: string): string {
    let result = '';
    let i = 0;

    while (i < text.length) {
      if (subscriptRaKey && text.startsWith(SUBSCRIPT_RA, i + 1)) {
        const precomposed = matchLongest(text, i, unicodeKeys);
        const bareConsonantKey = reverseMap[text[i]];
        if (!(precomposed && precomposed.length === 1 + SUBSCRIPT_RA.length) && bareConsonantKey) {
          let consumed = 1 + SUBSCRIPT_RA.length;
          let unit = bareConsonantKey + subscriptRaKey;

          // The whole [consonant]+्र cluster (राष्ट्रिय's ट्र, प्रतिक्रिया's
          // क्र) is itself just a "consonant" as far as a following short-i
          // is concerned — ि still needs to move before the WHOLE cluster,
          // not sit stranded after it.
          if (text.startsWith(SHORT_I_MATRA, i + consumed)) {
            unit = shortIKey + unit;
            consumed += SHORT_I_MATRA.length;
          }

          result += unit;
          i += consumed;
          continue;
        }
      }

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
