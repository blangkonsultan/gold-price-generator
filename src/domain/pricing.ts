import type { Markup } from './model.ts';

export const MAX_MONEY = 9007199254740991n;
const WHOLE = /^(?:\d+|\d{1,3}(?:\.\d{3})+)$/;
const PERCENT = /^((?:\d+|\d{1,3}(?:\.\d{3})+))(?:,(\d+))?$/;
const formatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

export class InputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InputError';
  }
}

function requireMoney(value: bigint): bigint {
  if (value < 0n) throw new InputError('Nominal tidak boleh negatif.');
  if (value > MAX_MONEY) throw new InputError('Nominal melebihi batas angka yang aman. Kurangi nilainya.');
  return value;
}

export function parseRupiah(text: string): bigint | null {
  const raw = text.trim();
  if (!raw) return null;
  if (!WHOLE.test(raw)) throw new InputError('Masukkan rupiah utuh, misalnya 1.000.000.');
  return requireMoney(BigInt(raw.replaceAll('.', '')));
}

export function parsePercent(text: string): { coefficient: bigint; scale: bigint } | null {
  const raw = text.trim();
  if (!raw || (raw.endsWith(',') && WHOLE.test(raw.slice(0, -1)))) return null;
  const match = PERCENT.exec(raw);
  if (!match) throw new InputError('Gunakan koma untuk desimal persentase, misalnya 1,5.');
  const fraction = match[2] ?? '';
  return {
    coefficient: BigInt(match[1]!.replaceAll('.', '') + fraction),
    scale: 10n ** BigInt(fraction.length),
  };
}

export function formatRupiah(value: bigint): string {
  return formatter.format(value);
}

export function calculatePrice(original: bigint, global: Markup, override: Markup | null): bigint {
  requireMoney(original);
  const rule = override ?? global;
  if (rule.kind === 'rupiah') return requireMoney(original + requireMoney(rule.amount));
  if (rule.coefficient < 0n || rule.scale <= 0n) throw new InputError('Persentase tidak valid.');
  const denominator = 100n * rule.scale;
  const increase = (original * rule.coefficient + denominator / 2n) / denominator;
  return requireMoney(original + increase);
}

export function parseMarkup(kind: 'rupiah' | 'percent', text: string): Markup | null {
  if (kind === 'rupiah') {
    const amount = parseRupiah(text);
    return amount === null ? null : { kind, amount };
  }
  const value = parsePercent(text);
  return value === null ? null : { kind, ...value };
}
