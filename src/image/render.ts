import '@fontsource/roboto/latin-400.css';
import '@fontsource/montserrat/latin-900.css';
import { PRODUCTS, type DateEdit, type ProductId, type SourceImage } from '../domain/model.ts';
import { InputError, formatRupiah } from '../domain/pricing.ts';
import { formatIndonesianDate } from './dates.ts';
import { DATE_REGION, PRICE_REGIONS, REFERENCE, nativeRect, type Rect } from './profile.ts';

export class ImageEditError extends InputError {
  readonly field: ProductId | 'date';
  constructor(field: ProductId | 'date', message: string) {
    super(message);
    this.name = 'ImageEditError';
    this.field = field;
  }
}

export type ImageEdits = {
  prices: Record<ProductId, bigint>;
  date: DateEdit;
  // A manual source correction must be honored even when final === reviewed base.
  forcePrices?: ReadonlySet<ProductId>;
};
export type RenderResult = { canvas: HTMLCanvasElement; regions: readonly Rect[]; smallerText: readonly (ProductId | 'date')[] };
type Patch = { rect: Rect; data: ImageData; inkLeft: number | null; color: string };
type Base = { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D; patches: Map<ProductId | 'date', Patch> };
const bases = new WeakMap<SourceImage, Base>();
let fontsReady = false;

async function ensureFonts(): Promise<void> {
  if (fontsReady) return;
  const [regular, bold] = await Promise.all([
    document.fonts.load('400 36px Roboto', '0123456789.'),
    document.fonts.load('900 40px Montserrat', '30 September 2026'),
  ]);
  if (!regular.length || !bold.length) throw new Error('Font gambar gagal dimuat. Muat ulang sebelum mengunduh.');
  fontsReady = true;
}

function sourceBase(source: SourceImage): Base {
  const cached = bases.get(source);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Browser tidak menyediakan pemrosesan gambar.');
  context.drawImage(source.image, 0, 0);
  const base = { canvas, context, patches: new Map<ProductId | 'date', Patch>() };
  bases.set(source, base);
  return base;
}

function expandedMask(core: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  const horizontal = new Uint8Array(core.length);
  const result = new Uint8Array(core.length);
  for (let y = 0; y < height; y++) {
    const offset = y * width;
    let total = 0;
    for (let x = 0; x <= radius && x < width; x++) total += core[offset + x]!;
    for (let x = 0; x < width; x++) {
      horizontal[offset + x] = total > 0 ? 1 : 0;
      if (x - radius >= 0) total -= core[offset + x - radius]!;
      if (x + radius + 1 < width) total += core[offset + x + radius + 1]!;
    }
  }
  for (let x = 0; x < width; x++) {
    let total = 0;
    for (let y = 0; y <= radius && y < height; y++) total += horizontal[y * width + x]!;
    for (let y = 0; y < height; y++) {
      result[y * width + x] = total > 0 ? 1 : 0;
      if (y - radius >= 0) total -= horizontal[(y - radius) * width + x]!;
      if (y + radius + 1 < height) total += horizontal[(y + radius + 1) * width + x]!;
    }
  }
  return result;
}

function restoreGlyphs(source: SourceImage, base: Base, field: ProductId | 'date', reference: Rect): Patch {
  const cached = base.patches.get(field);
  if (cached) return cached;
  const rect = nativeRect(reference, source.width, source.height);
  const { x, y, width, height } = rect;
  const data = base.context.getImageData(x, y, width, height);
  const sampleRows = Math.max(1, Math.round(3 * source.height / REFERENCE.height));
  const above = base.context.getImageData(x, y - sampleRows, width, sampleRows).data;
  const below = base.context.getImageData(x, y + height, width, sampleRows).data;
  const top = new Float32Array(width * 4);
  const bottom = new Float32Array(width * 4);
  for (let column = 0; column < width; column++) for (let c = 0; c < 4; c++) {
    let a = 0, b = 0;
    for (let sample = 0; sample < sampleRows; sample++) {
      a += above[(sample * width + column) * 4 + c]!;
      b += below[(sample * width + column) * 4 + c]!;
    }
    top[column * 4 + c] = a / sampleRows;
    bottom[column * 4 + c] = b / sampleRows;
  }
  const core = new Uint8Array(width * height);
  let inkLeft: number | null = null;
  let red = 0, green = 0, blue = 0, darkCount = 0;
  for (let row = 0; row < height; row++) for (let column = 0; column < width; column++) {
    const i = (row * width + column) * 4, offset = column * 4;
    const r = data.data[i]!, g = data.data[i + 1]!, b = data.data[i + 2]!, alpha = data.data[i + 3]! / 255;
    const shade = (r + g + b) / 3 * alpha + 255 * (1 - alpha);
    const topAlpha = top[offset + 3]! / 255, bottomAlpha = bottom[offset + 3]! / 255;
    const topShade = (top[offset]! + top[offset + 1]! + top[offset + 2]!) / 3 * topAlpha + 255 * (1 - topAlpha);
    const bottomShade = (bottom[offset]! + bottom[offset + 1]! + bottom[offset + 2]!) / 3 * bottomAlpha + 255 * (1 - bottomAlpha);
    const backdrop = topShade + (bottomShade - topShade) * (row + 1) / (height + 1);
    if (shade < 190 && backdrop - shade > 27 && Math.max(r, g, b) - Math.min(r, g, b) < 45) {
      core[row * width + column] = 1;
      inkLeft = inkLeft === null ? x + column : Math.min(inkLeft, x + column);
      if (shade < 90) { red += r; green += g; blue += b; darkCount++; }
    }
  }
  const mask = expandedMask(core, width, height, Math.max(1, Math.round(3 * Math.min(source.width / REFERENCE.width, source.height / REFERENCE.height))));
  for (let row = 0; row < height; row++) for (let column = 0; column < width; column++) {
    if (!mask[row * width + column]) continue;
    const i = (row * width + column) * 4, offset = column * 4;
    const r = data.data[i]!, g = data.data[i + 1]!, b = data.data[i + 2]!;
    // Colored circles/icons are source artwork, not old number ink.
    if ((r > g + 10 && r > b + 10) || Math.max(r, g, b) - Math.min(r, g, b) > 45) continue;
    const ratio = (row + 1) / (height + 1);
    for (let c = 0; c < 4; c++) data.data[i + c] = top[offset + c]! + (bottom[offset + c]! - top[offset + c]!) * ratio;
  }
  const color = darkCount ? `rgb(${Math.round(red / darkCount)},${Math.round(green / darkCount)},${Math.round(blue / darkCount)})` : field === 'date' ? '#000000' : '#333936';
  const patch = { rect, data, inkLeft, color };
  base.patches.set(field, patch);
  return patch;
}

type TextPlan = { text: string; font: string; x: number; baseline: number; patch: Patch; field: ProductId | 'date'; smaller: boolean };

function fitText(context: CanvasRenderingContext2D, source: SourceImage, field: ProductId | 'date', text: string, box: Rect, referenceBaseline: number, patch: Patch): TextPlan {
  const sx = source.width / REFERENCE.width, sy = source.height / REFERENCE.height;
  const scale = Math.min(sx, sy);
  const date = field === 'date';
  const maximum = date ? 40 : 36, minimum = date ? 28 : 22;
  const baseline = referenceBaseline * sy;
  const desiredLeft = Math.max(box.x + Math.max(0.5, sx), patch.inkLeft ?? box.x + 4 * sx);
  for (let referenceSize = maximum; referenceSize >= minimum; referenceSize--) {
    const font = `${date ? 900 : 400} ${referenceSize * scale}px ${date ? 'Montserrat' : 'Roboto'}`;
    context.font = font;
    const metrics = context.measureText(text);
    const drawX = desiredLeft + metrics.actualBoundingBoxLeft;
    if (drawX + metrics.actualBoundingBoxRight <= box.x + box.width - 5 * sx
      && baseline - metrics.actualBoundingBoxAscent >= box.y + Math.max(0.5, sy)
      && baseline + metrics.actualBoundingBoxDescent <= box.y + box.height - Math.max(0.5, sy)) {
      return { text, font, x: drawX, baseline, patch, field, smaller: referenceSize < maximum };
    }
  }
  const product = PRODUCTS.find(p => p.id === field);
  const label = product ? `${product.category} ${product.weight}` : 'Tanggal';
  throw new ImageEditError(field, `${label} tidak muat pada ukuran yang terbaca. Kurangi nilainya; gambar tidak akan dipotong atau dibuat bertumpuk.`);
}

export async function renderPriceImage(source: SourceImage, originalPrices: Record<ProductId, bigint>, edited: ImageEdits): Promise<RenderResult> {
  const base = sourceBase(source);
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Browser tidak menyediakan pemrosesan gambar.');
  context.drawImage(base.canvas, 0, 0);
  const changed = PRICE_REGIONS.filter(region => edited.prices[region.id] !== originalPrices[region.id] || edited.forcePrices?.has(region.id));
  if (!changed.length && edited.date.kind === 'keep') return { canvas, regions: [], smallerText: [] };
  await ensureFonts();
  const plans: TextPlan[] = [];
  for (const region of changed) {
    const reference = { x: region.clearLeft, y: region.baseline - 36, width: region.right - region.clearLeft, height: 45 };
    const patch = restoreGlyphs(source, base, region.id, reference);
    plans.push(fitText(context, source, region.id, formatRupiah(edited.prices[region.id]), patch.rect, region.baseline, patch));
  }
  if (edited.date.kind === 'replace') {
    let text: string;
    try { text = formatIndonesianDate(edited.date.iso); }
    catch (error) {
      if (error instanceof InputError) throw new ImageEditError('date', error.message);
      throw error;
    }
    const patch = restoreGlyphs(source, base, 'date', { x: DATE_REGION.clearLeft, y: DATE_REGION.y, width: DATE_REGION.clearRight - DATE_REGION.clearLeft, height: DATE_REGION.height });
    const box = nativeRect({ x: DATE_REGION.x, y: DATE_REGION.y, width: DATE_REGION.right - DATE_REGION.x, height: DATE_REGION.height }, source.width, source.height);
    plans.push(fitText(context, source, 'date', text, box, DATE_REGION.baseline, patch));
  }
  const regions: Rect[] = [];
  const smallerText: (ProductId | 'date')[] = [];
  context.textBaseline = 'alphabetic';
  context.textAlign = 'left';
  for (const plan of plans) {
    context.putImageData(plan.patch.data, plan.patch.rect.x, plan.patch.rect.y);
    context.font = plan.font;
    context.fillStyle = plan.patch.color;
    context.fillText(plan.text, plan.x, plan.baseline);
    const right = plan.x + context.measureText(plan.text).actualBoundingBoxRight;
    regions.push({ ...plan.patch.rect, width: Math.max(plan.patch.rect.width, Math.ceil(right) - plan.patch.rect.x) });
    if (plan.smaller) smallerText.push(plan.field);
  }
  return { canvas, regions, smallerText };
}

export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  const { promise, resolve, reject } = Promise.withResolvers<Blob>();
  canvas.toBlob(blob => {
    if (blob) resolve(blob);
    else reject(new Error('PNG gagal dibuat. Coba unduh kembali.'));
  }, 'image/png');
  return promise;
}
