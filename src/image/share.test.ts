import { describe, expect, it, vi } from 'vitest';
import { canShareImageFiles, shareImageFile } from './share.ts';

describe('share utility', () => {
  it('returns false when navigator or share API is missing', () => {
    expect(canShareImageFiles(undefined)).toBe(false);
    expect(canShareImageFiles({} as Navigator)).toBe(false);
  });

  it('returns false when canShare returns false or throws', () => {
    const nav = {
      share: vi.fn(),
      canShare: vi.fn().mockReturnValue(false),
    } as unknown as Navigator;
    expect(canShareImageFiles(nav)).toBe(false);

    const throwingNav = {
      share: vi.fn(),
      canShare: vi.fn().mockImplementation(() => { throw new Error('not supported'); }),
    } as unknown as Navigator;
    expect(canShareImageFiles(throwingNav)).toBe(false);
  });

  it('returns true when canShare accepts image file', () => {
    const nav = {
      share: vi.fn(),
      canShare: vi.fn().mockReturnValue(true),
    } as unknown as Navigator;
    expect(canShareImageFiles(nav)).toBe(true);
  });

  it('successfully shares file via navigator.share', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    const nav = {
      share: shareMock,
      canShare: vi.fn().mockReturnValue(true),
    } as unknown as Navigator;
    const file = new File(['test'], 'harga-emas.png', { type: 'image/png' });

    const result = await shareImageFile(file, nav);
    expect(result).toBe(true);
    expect(shareMock).toHaveBeenCalledWith({
      files: [file],
      title: 'Daftar Harga Emas',
    });
  });

  it('returns false silently on AbortError cancellation', async () => {
    const abortErr = new Error('Share canceled');
    abortErr.name = 'AbortError';
    const nav = {
      share: vi.fn().mockRejectedValue(abortErr),
      canShare: vi.fn().mockReturnValue(true),
    } as unknown as Navigator;
    const file = new File(['test'], 'harga-emas.png', { type: 'image/png' });

    const result = await shareImageFile(file, nav);
    expect(result).toBe(false);
  });

  it('throws friendly Indonesian message on unexpected errors', async () => {
    const nav = {
      share: vi.fn().mockRejectedValue(new Error('Permission denied')),
      canShare: vi.fn().mockReturnValue(true),
    } as unknown as Navigator;
    const file = new File(['test'], 'harga-emas.png', { type: 'image/png' });

    await expect(shareImageFile(file, nav)).rejects.toThrow('Gagal membagikan gambar ke media sosial');
  });
});
