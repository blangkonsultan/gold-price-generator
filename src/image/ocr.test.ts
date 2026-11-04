import { describe, expect, it } from 'vitest';
import { parseOcrPrice } from './ocr.ts';

describe('OCR price extraction', () => {
  it.each([
    ['1.600.000\n', 1600000n], ['1600000', 1600000n],
    ['1,850,000', 1850000n], ['1. 600 .000', 1600000n],
    ['1 600 000', 1600000n], ['1600.000', 1600000n],
  ])('extracts one whole source price from %s', (text, expected) => {
    expect(parseOcrPrice(text as string)).toBe(expected);
  });
  it.each(['', '1gr 3.350.000', '1.600.000 1.850.000', '1600000 1850000', '30 September 2026', '0.5', 'OOO', '1.60.000', '9007199254740992'])('keeps missing, ambiguous or unsafe OCR missing: %s', text => {
    expect(parseOcrPrice(text)).toBeNull();
  });
});
