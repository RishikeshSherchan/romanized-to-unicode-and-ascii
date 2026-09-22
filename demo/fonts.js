// Add one entry per font file you drop into demo/fonts/.
// name: whatever you want to see in the dropdown
// file: the exact filename inside demo/fonts/
// legacy: which converter to run before displaying text in this font
//   (ASCII-glyph-hack fonts have no real Unicode Devanagari glyphs, so the
//   demo must convert first) — 'preeti', 'kantipur', 'himali', or omit for
//   a normal Unicode font.
export const FONTS = [
  { name: 'Noto Sans Devanagari Regular', file: 'NotoSansDevanagari-Regular.ttf' },
  { name: 'Noto Sans Devanagari Medium', file: 'NotoSansDevanagari-Medium.ttf' },
  { name: 'Noto Sans Devanagari Bold', file: 'NotoSansDevanagari-Bold.ttf' },
  { name: 'Noto Sans Devanagari Black', file: 'NotoSansDevanagari-Black.ttf' },
  { name: 'Hind Regular', file: 'Hind-Regular.ttf' },
  { name: 'Hind Bold', file: 'Hind-Bold.ttf' },
  { name: 'Preeti Regular', file: 'Preeti Normal.otf', legacy: 'preeti' },
  { name: 'Preeti Bold', file: 'Preeti Bold.otf', legacy: 'preeti' },
  { name: 'Kantipur Regular', file: 'Kantipur Regular.ttf', legacy: 'kantipur' },
  { name: 'Fontasy Himali (incomplete, 12 missing glyphs)', file: 'Fontasy Himali Regular.ttf', legacy: 'himali' },
  { name: 'Himali 4 (more complete)', file: 'HIMALI_4.TTF', legacy: 'himali' },
];
