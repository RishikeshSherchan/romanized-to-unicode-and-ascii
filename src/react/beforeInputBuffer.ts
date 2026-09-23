// The romanized buffer's state transition for a single `beforeinput` event.
// Pulled out as a pure function (no DOM) so it's directly unit-testable —
// TransliterateInput just wires this to the actual event.
export function applyBeforeInputEvent(
  raw: string,
  inputType: string,
  data: string | null
): string {
  if (inputType === 'deleteContentBackward') return raw.slice(0, -1);
  if (inputType === 'insertLineBreak') return raw + '\n';
  if (data) return raw + data;
  return raw;
}
