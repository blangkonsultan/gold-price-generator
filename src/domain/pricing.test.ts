import { describe, expect, it } from 'vitest';
import { calculatePrice, formatRupiah, parsePercent, parseRupiah } from './pricing.ts';

describe('Indonesian amount parsing', () => {
  it.each([
    ['1.000.000', 1000000n], ['1000000', 1000000n], ['0', 0n],
    [' 50.000 ', 50000n], ['9.007.199.254.740.991', 9007199254740991n],
  ])('reads whole rupiah %s without changing magnitude', (text, amount) => {
    expect(parseRupiah(text as string)).toBe(amount);
  });
  it.each(['', '   '])('keeps an empty rupiah draft missing', text => {
    expect(parseRupiah(text)).toBeNull();
  });
  it.each(['-1.000', '1,5', '1.5', '1..000', 'Rp 1000', '9.007.199.254.740.992'])('rejects invalid or unsafe rupiah %s', text => {
    expect(() => parseRupiah(text)).toThrow();
  });
  it('reads comma percentage exactly, including precision smaller than a basis point', () => {
    expect(parsePercent('1,5')).toEqual({ coefficient: 15n, scale: 10n });
    expect(parsePercent('0,0001')).toEqual({ coefficient: 1n, scale: 10000n });
    expect(parsePercent('1.000,25')).toEqual({ coefficient: 100025n, scale: 100n });
  });
  it.each(['', '1,'])('does not turn an incomplete percentage into zero', text => {
    expect(parsePercent(text)).toBeNull();
  });
  it.each(['-5', '1.5', '1,,5', 'NaN', '1e3'])('rejects ambiguous percentage %s', text => {
    expect(() => parsePercent(text)).toThrow();
  });
  it('formats an integer amount without precision loss', () => {
    expect(formatRupiah(9007199254740991n)).toBe('9.007.199.254.740.991');
  });
});

describe('selling-price rules', () => {
  it('adds fixed rupiah once per listed product', () => {
    expect(calculatePrice(1600000n, { kind: 'rupiah', amount: 50000n }, null)).toBe(1650000n);
    expect(calculatePrice(260000000n, { kind: 'rupiah', amount: 50000n }, null)).toBe(260050000n);
  });
  it('calculates global percentage from the original amount', () => {
    expect(calculatePrice(1600000n, { kind: 'percent', coefficient: 5n, scale: 1n }, null)).toBe(1680000n);
    expect(calculatePrice(1600000n, { kind: 'percent', coefficient: 10n, scale: 1n }, null)).toBe(1760000n);
  });
  it('replaces percentage global markup with a row rupiah rule', () => {
    expect(calculatePrice(1600000n, { kind: 'percent', coefficient: 5n, scale: 1n }, { kind: 'rupiah', amount: 70000n })).toBe(1670000n);
  });
  it('keeps an explicit zero override instead of falling back to global', () => {
    expect(calculatePrice(1600000n, { kind: 'rupiah', amount: 50000n }, { kind: 'rupiah', amount: 0n })).toBe(1600000n);
  });
  it('applies a row percentage instead of stacking it', () => {
    expect(calculatePrice(1600000n, { kind: 'rupiah', amount: 50000n }, { kind: 'percent', coefficient: 15n, scale: 10n })).toBe(1624000n);
  });
  it('rounds half-rupiah upward with exact integer arithmetic', () => {
    expect(calculatePrice(101n, { kind: 'percent', coefficient: 5n, scale: 10n }, null)).toBe(102n);
    expect(calculatePrice(100n, { kind: 'percent', coefficient: 49n, scale: 100n }, null)).toBe(100n);
  });
  it('blocks an unsafe final amount rather than losing a rupiah', () => {
    expect(() => calculatePrice(9007199254740991n, { kind: 'rupiah', amount: 1n }, null)).toThrow();
  });
});
