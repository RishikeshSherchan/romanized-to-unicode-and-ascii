import { describe, it, expect } from 'vitest';
import { applyBeforeInputEvent } from './beforeInputBuffer';

describe('applyBeforeInputEvent', () => {
  it('appends inserted text', () => {
    expect(applyBeforeInputEvent('nama', 'insertText', 's')).toBe('namas');
  });

  it('removes the last character on backspace', () => {
    expect(applyBeforeInputEvent('namas', 'deleteContentBackward', null)).toBe('nama');
  });

  it('appends a newline on Enter', () => {
    expect(applyBeforeInputEvent('namaste', 'insertLineBreak', null)).toBe('namaste\n');
  });

  it('leaves the buffer unchanged for an input type with no data', () => {
    expect(applyBeforeInputEvent('namaste', 'deleteContentForward', null)).toBe('namaste');
  });

  it('handles backspace on an empty buffer without going negative', () => {
    expect(applyBeforeInputEvent('', 'deleteContentBackward', null)).toBe('');
  });
});
