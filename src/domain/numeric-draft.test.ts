import { describe, expect, it } from 'vitest';
import { formatNumericDraft, separatorDeletionRange } from './numeric-draft.ts';

describe('formatted text entry', () => {
  it('groups plain pasted rupiah and preserves the logical caret', () => {
    expect(formatNumericDraft('1000000', 'rupiah', { start: 7, end: 7 })).toEqual({ text: '1.000.000', start: 9, end: 9 });
  });
  it('preserves middle editing instead of moving the caret to the end', () => {
    expect(formatNumericDraft('15.000.000', 'rupiah', { start: 2, end: 2 })).toEqual({ text: '15.000.000', start: 2, end: 2 });
  });
  it('regroups a digit typed after an automatically grouped value', () => {
    expect(formatNumericDraft('1.0000', 'rupiah', { start: 6, end: 6 }, { previousText: '1.000', inputType: 'insertText', data: '0' })).toEqual({ text: '10.000', start: 6, end: 6 });
  });
  it('does not silently reinterpret a pasted decimal-looking rupiah value', () => {
    expect(formatNumericDraft('1.5', 'rupiah', { start: 3, end: 3 }, { previousText: '', inputType: 'insertFromPaste', data: null })).toEqual({ text: '1.5', start: 3, end: 3 });
  });
  it.each(['', '-1000', 'abc', '1,'])('retains incomplete or invalid drafts for validation: %s', text => {
    expect(formatNumericDraft(text, 'rupiah', { start: text.length, end: text.length }).text).toBe(text);
  });
  it('keeps the comma and fractional digits in a percentage', () => {
    expect(formatNumericDraft('1,50', 'percent', { start: 4, end: 4 })).toEqual({ text: '1,50', start: 4, end: 4 });
  });
  it('preserves a replacement selection across inserted grouping dots', () => {
    expect(formatNumericDraft('1250000', 'rupiah', { start: 2, end: 5 })).toEqual({ text: '1.250.000', start: 3, end: 7 });
  });
});

describe('native deletion around grouping separators', () => {
  it('lets backspace remove the preceding digit rather than reinsert the same dot', () => {
    expect(separatorDeletionRange('12.345', { start: 3, end: 3 }, 'Backspace')).toEqual({ start: 1, end: 3 });
  });
  it('lets delete remove the following digit beside a grouping dot', () => {
    expect(separatorDeletionRange('12.345', { start: 2, end: 2 }, 'Delete')).toEqual({ start: 2, end: 4 });
  });
  it('leaves a native non-empty selection unchanged', () => {
    expect(separatorDeletionRange('12.345', { start: 1, end: 4 }, 'Backspace')).toBeNull();
  });
  it('does not delete an extra digit at the decimal comma', () => {
    expect(separatorDeletionRange('1,50', { start: 2, end: 2 }, 'Backspace')).toBeNull();
  });
});
