import type { AmountKind } from './model.ts';
import { formatRupiah } from './pricing.ts';

type Selection = { start: number; end: number };
type Edit = { previousText: string; inputType: string; data: string | null };
const WHOLE = /^(?:\d+|\d{1,3}(?:\.\d{3})+)$/;
const DIGITS = /^\d+$/;

function isCompleteDraft(text: string, kind: AmountKind): boolean {
  const parts = text.split(',');
  return parts.length <= (kind === 'percent' ? 2 : 1)
    && WHOLE.test(parts[0] ?? '')
    && (parts.length === 1 || DIGITS.test(parts[1] ?? ''));
}

function logicalCaret(text: string, position: number): number {
  let count = 0;
  for (let i = 0; i < position; i++) if (/[\d,]/.test(text[i] ?? '')) count++;
  return count;
}

function physicalCaret(text: string, logical: number): number {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (count === logical) return i;
    if (/[\d,]/.test(text[i]!)) count++;
  }
  return text.length;
}

export function formatNumericDraft(
  raw: string,
  kind: AmountKind,
  selection: Selection,
  edit?: Edit,
): { text: string; start: number; end: number } {
  const unchanged = { text: raw, ...selection };
  const clean = raw.trim();
  if (!clean) return { text: '', start: 0, end: 0 };
  if (!/^[\d.,]+$/.test(clean) || (kind === 'rupiah' && clean.includes(','))) return unchanged;
  const parts = clean.split(',');
  if (parts.length > 2 || !parts[0]) return unchanged;
  const whole = parts[0];
  const canRegroup = edit && isCompleteDraft(edit.previousText, kind)
    && (edit.inputType.startsWith('delete') || (edit.inputType === 'insertText' && DIGITS.test(edit.data ?? '')));
  if (!WHOLE.test(whole) && !canRegroup) return unchanged;
  const digits = whole.replaceAll('.', '');
  if (!DIGITS.test(digits) || (parts[1] !== undefined && !/^\d*$/.test(parts[1]))) return unchanged;
  const text = formatRupiah(BigInt(digits)) + (parts.length === 2 ? ',' + parts[1] : '');
  return {
    text,
    start: physicalCaret(text, logicalCaret(raw, selection.start)),
    end: physicalCaret(text, logicalCaret(raw, selection.end)),
  };
}

export function separatorDeletionRange(text: string, selection: Selection, key: 'Backspace' | 'Delete'): Selection | null {
  if (selection.start !== selection.end) return null;
  const at = selection.start;
  if (key === 'Backspace' && at > 1 && text[at - 1] === '.' && /\d/.test(text[at - 2] ?? '')) {
    return { start: at - 2, end: at };
  }
  if (key === 'Delete' && text[at] === '.' && /\d/.test(text[at + 1] ?? '')) {
    return { start: at, end: at + 2 };
  }
  return null;
}
