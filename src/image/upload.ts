import type { SourceImage } from '../domain/model.ts';
import { InputError } from '../domain/pricing.ts';
import { REFERENCE } from './profile.ts';

export async function decodeUpload(file: File): Promise<SourceImage> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, i) => bytes[i] === value);
  const webp = [0x52, 0x49, 0x46, 0x46].every((value, i) => bytes[i] === value)
    && [0x57, 0x45, 0x42, 0x50].every((value, i) => bytes[i + 8] === value);
  if (!jpeg && !png && !webp) throw new InputError('Pilih foto JPEG, PNG, atau WebP yang valid.');
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!width || !height || Math.abs(width / height - REFERENCE.width / REFERENCE.height) > 0.015) {
      throw new InputError('Gunakan foto utuh dengan rasio 4:5 seperti contoh Redmark/Gift Series, tanpa crop atau rotasi.');
    }
    return { image, width, height, url, dispose: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    if (error instanceof InputError) throw error;
    const problem = new InputError('Foto tidak dapat dibaca. Pilih file gambar lain.');
    problem.cause = error;
    throw problem;
  }
}
