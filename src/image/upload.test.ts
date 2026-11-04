import { describe, expect, it } from 'vitest';
import { InputError } from '../domain/pricing.ts';
import { decodeUpload } from './upload.ts';

describe('raster upload boundary', () => {
  it('rejects a text/SVG payload even when named and labeled as PNG', async () => {
    const file = new File(['<svg xmlns="http://www.w3.org/2000/svg"></svg>'], 'not-a-photo.png', { type: 'image/png' });
    await expect(decodeUpload(file)).rejects.toBeInstanceOf(InputError);
  });
  it('rejects an unsupported GIF before attempting browser decoding', async () => {
    const file = new File(['GIF89a'], 'example.gif', { type: 'image/gif' });
    await expect(decodeUpload(file)).rejects.toBeInstanceOf(InputError);
  });
});
