import { describe, expect, it } from 'vitest';
import { formatIndonesianDate, isValidISODate, parseIndonesianDate } from './dates.ts';

describe('source and edited dates', () => {
  it.each([
    ['30 September 2026', '2026-09-30'], ['03November2026\n', '2026-11-03'],
    ['29 Februari 2000', '2000-02-29'], ['01 Januari 0099', '0099-01-01'],
  ])('reads a real calendar date %s', (text, expected) => {
    expect(parseIndonesianDate(text)).toBe(expected);
  });
  it.each(['', '31 Februari 2026', '29 Februari 1900', '31 April 2026', '00 Januari 2026', '01 Januari 0000', 'unreadable'])('does not normalize or guess an unread source date %s', text => {
    expect(parseIndonesianDate(text)).toBeNull();
  });
  it('formats the replacement date with an Indonesian month', () => {
    expect(formatIndonesianDate('2026-11-04')).toBe('04 November 2026');
  });
  it('retains the four-digit year when formatting a valid early calendar year', () => {
    expect(formatIndonesianDate('0099-01-01')).toBe('01 Januari 0099');
  });
  it('blocks invalid replacement dates instead of overflowing to the next month', () => {
    expect(isValidISODate('2026-02-31')).toBe(false);
    expect(isValidISODate('2024-02-29')).toBe(true);
    expect(() => formatIndonesianDate('2026-02-31')).toThrow();
  });
});
