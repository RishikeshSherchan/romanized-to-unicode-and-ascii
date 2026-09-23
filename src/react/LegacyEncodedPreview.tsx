import { unicodeToPreeti } from '../preeti.js';
import { unicodeToKantipur } from '../kantipur.js';
import { unicodeToHimali } from '../himali.js';

const CONVERTERS = {
  preeti: unicodeToPreeti,
  kantipur: unicodeToKantipur,
  himali: unicodeToHimali,
} as const;

export interface LegacyEncodedPreviewProps {
  /** Unicode Devanagari text to convert. */
  value: string;
  /** Which legacy font's encoding to produce. */
  font: keyof typeof CONVERTERS;
}

// Renders the raw ASCII string a legacy font (Preeti, Kantipur, Himali)
// would need to display the same text — e.g. for testing how Unicode
// content will look when printed with an old font. No wrapper markup is
// imposed; render this wherever you'd style the reference text yourself.
export function LegacyEncodedPreview({ value, font }: LegacyEncodedPreviewProps) {
  return <>{CONVERTERS[font](value)}</>;
}
