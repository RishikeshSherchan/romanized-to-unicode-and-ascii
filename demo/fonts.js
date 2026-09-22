// Add one entry per font file you drop into demo/fonts/.
// name: whatever you want to see in the dropdown
// file: the exact filename inside demo/fonts/
// legacy: true for ASCII-glyph-hack fonts (Preeti, Kantipur, etc.) with no
//   real Unicode Devanagari glyphs — the demo runs unicodeToPreeti() before
//   displaying text in these, instead of showing raw Unicode.
export const FONTS = [
  { name: 'Noto Sans Devanagari Regular', file: 'NotoSansDevanagari-Regular.ttf' },
  { name: 'Noto Sans Devanagari Medium', file: 'NotoSansDevanagari-Medium.ttf' },
  { name: 'Noto Sans Devanagari Bold', file: 'NotoSansDevanagari-Bold.ttf' },
  { name: 'Noto Sans Devanagari Black', file: 'NotoSansDevanagari-Black.ttf' },
  { name: 'Hind Regular', file: 'Hind-Regular.ttf' },
  { name: 'Hind Bold', file: 'Hind-Bold.ttf' },
  { name: 'Preeti Regular', file: 'Preeti Normal.otf', legacy: true },
  { name: 'Preeti Bold', file: 'Preeti Bold.otf', legacy: true },
];
