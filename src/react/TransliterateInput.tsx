import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react';
import { transliterate } from '../transliterate.js';
import { applyBeforeInputEvent } from './beforeInputBuffer.js';

export interface TransliterateInputProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'defaultValue'> {
  /** Current Unicode Devanagari text. You own this state, same as any controlled input. */
  value: string;
  /** Called with the newly converted Unicode text after each keystroke. */
  onChange: (unicodeText: string) => void;
  /** Extra dictionary words, same as transliterate()'s second argument. */
  extraWords?: Record<string, string>;
}

// A controlled <textarea> that runs romanized keystrokes through
// transliterate() live. The field only ever displays converted Unicode, so
// it can't also be the source of truth for what was typed — re-running
// transliterate() on its own displayed output would feed Devanagari
// characters back in as if they were romanized input (see the library's
// README for why). Instead this tracks the raw romanized buffer in a ref,
// converting fresh from it on every keystroke via applyBeforeInputEvent.
//
// If a parent sets `value` to something this component didn't just emit
// itself (other than clearing it to ''), the raw buffer can't be
// reconstructed from that Unicode text alone — future keystrokes continue
// from the last-known raw buffer rather than the new external value. This
// mirrors how any transliterating IME behaves with externally-set text.
export function TransliterateInput({
  value,
  onChange,
  extraWords,
  ...rest
}: TransliterateInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rawRef = useRef('');
  const lastEmittedRef = useRef('');
  const moveCursorToEndRef = useRef(false);

  if (value !== lastEmittedRef.current) {
    if (value === '') rawRef.current = '';
    lastEmittedRef.current = value;
  }

  useLayoutEffect(() => {
    if (moveCursorToEndRef.current && textareaRef.current) {
      const end = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(end, end);
      moveCursorToEndRef.current = false;
    }
  }, [value]);

  const handleBeforeInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const native = e.nativeEvent as InputEvent;
    rawRef.current = applyBeforeInputEvent(rawRef.current, native.inputType, native.data);

    const unicodeText = transliterate(rawRef.current, extraWords);
    lastEmittedRef.current = unicodeText;
    moveCursorToEndRef.current = true;
    onChange(unicodeText);
  };

  return (
    <textarea
      {...rest}
      ref={textareaRef}
      value={value}
      onChange={() => {}}
      onBeforeInput={handleBeforeInput}
    />
  );
}
