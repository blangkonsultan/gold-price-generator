import { useLayoutEffect, useRef } from 'react';
import type { AmountKind } from '../domain/model.ts';
import { formatNumericDraft, separatorDeletionRange } from '../domain/numeric-draft.ts';

type Props = {
  id: string; label: string; value: string; kind: AmountKind;
  onChange(text: string): void;
  ariaLabel?: string; hint?: string; error?: string | null; disabled?: boolean; required?: boolean;
};

export function AmountInput({ id, label, value, kind, onChange, ariaLabel, hint, error, disabled, required }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const selection = useRef<{ start: number; end: number } | null>(null);
  useLayoutEffect(() => {
    if (selection.current && input.current && document.activeElement === input.current) {
      input.current.setSelectionRange(selection.current.start, selection.current.end);
    }
    selection.current = null;
  }, [value]);
  const descriptions = [hint ? id + '-hint' : null, error ? id + '-error' : null].filter(Boolean).join(' ') || undefined;
  return <div className="field amount-field">
    <label htmlFor={id}>{label}</label>
    <input ref={input} id={id} name={id} type="text" inputMode={kind === 'rupiah' ? 'numeric' : 'decimal'}
      value={value} disabled={disabled} required={required} autoComplete="off" spellCheck={false}
      aria-label={ariaLabel} aria-describedby={descriptions} aria-invalid={error ? true : undefined}
      placeholder={kind === 'rupiah' ? '1.000.000' : '1,5'}
      onKeyDown={event => {
        if (event.ctrlKey || event.metaKey || event.altKey || (event.key !== 'Backspace' && event.key !== 'Delete')) return;
        const node = event.currentTarget;
        const range = separatorDeletionRange(node.value, { start: node.selectionStart ?? 0, end: node.selectionEnd ?? 0 }, event.key);
        if (range) node.setSelectionRange(range.start, range.end);
      }}
      onChange={event => {
        const node = event.currentTarget;
        const native = event.nativeEvent as InputEvent;
        const formatted = formatNumericDraft(node.value, kind, { start: node.selectionStart ?? node.value.length, end: node.selectionEnd ?? node.value.length },
          { previousText: value, inputType: native.inputType ?? 'insertFromPaste', data: native.data ?? null });
        selection.current = { start: formatted.start, end: formatted.end };
        node.value = formatted.text;
        node.setSelectionRange(formatted.start, formatted.end);
        onChange(formatted.text);
      }} />
    {hint ? <p className="hint" id={id + '-hint'}>{hint}</p> : null}
    {error ? <p className="field-error" id={id + '-error'} aria-live="polite">{error}</p> : null}
  </div>;
}
