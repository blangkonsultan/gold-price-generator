import type { RecognitionResult, SourceImage } from '../domain/model.ts';
import { InputError, parseRupiah } from '../domain/pricing.ts';
import { parseIndonesianDate } from './dates.ts';
import { DATE_REGION, PRICE_REGIONS, REFERENCE, priceCrop, type Rect } from './profile.ts';

export function parseOcrPrice(text: string): bigint | null {
  let raw = text.trim().replace(/\s*([.,])\s*/g, '$1');
  if (/\s/.test(raw)) {
    if (!/^\d{1,3}(?:\s+\d{3})+$/.test(raw)) return null;
    raw = raw.replace(/\s+/g, '.');
  }
  if (!/^\d+(?:[.,]\d{3})*$/.test(raw)) return null;
  try {
    return parseRupiah(raw.replace(/[.,]/g, ''));
  } catch (error) {
    if (error instanceof InputError) return null;
    throw error;
  }
}

function aborted(signal: AbortSignal): Error {
  return signal.reason instanceof Error ? signal.reason : new DOMException('Pembacaan dibatalkan.', 'AbortError');
}

// Pinned Tesseract.js 7 worker protocol. Owning the native worker lets abort
// terminate core/model loading too, before the SDK's async factory resolves.
function ownWorker(signal: AbortSignal) {
  if (signal.aborted) throw aborted(signal);
  const worker = new Worker(new URL('/ocr/worker.min.js', location.origin));
  const pending = new Map<string, { resolve(data: unknown): void; reject(error: Error): void }>();
  let sequence = 0;
  let closed = false;
  function close(error: Error = aborted(signal)) {
    if (closed) return;
    closed = true;
    signal.removeEventListener('abort', onAbort);
    worker.terminate();
    for (const job of pending.values()) job.reject(error);
    pending.clear();
  }
  function onAbort() { close(aborted(signal)); }
  signal.addEventListener('abort', onAbort, { once: true });
  worker.addEventListener('error', event => close(new Error(`Mesin OCR gagal dijalankan: ${event.message}`)));
  worker.addEventListener('message', (event: MessageEvent<{ jobId: string; status: string; data: unknown }>) => {
    if (closed || event.data.status === 'progress') return;
    const job = pending.get(event.data.jobId);
    if (!job) return;
    pending.delete(event.data.jobId);
    if (event.data.status === 'resolve') job.resolve(event.data.data);
    else job.reject(new Error(`Pembacaan OCR gagal: ${String(event.data.data)}`));
  });
  return {
    request<T>(action: string, payload: Record<string, unknown>, transfer: Transferable[] = []): Promise<T> {
      if (closed) return Promise.reject(aborted(signal));
      const jobId = String(++sequence);
      const job = Promise.withResolvers<unknown>();
      pending.set(jobId, job);
      try {
        worker.postMessage({ workerId: 'gold-price-reader', jobId, action, payload }, transfer);
      } catch (error) {
        pending.delete(jobId);
        job.reject(error);
      }
      return job.promise as Promise<T>;
    },
    close,
  };
}

async function cropForRecognition(source: SourceImage, rect: Rect): Promise<ArrayBuffer> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(rect.width * 3);
  canvas.height = Math.round(rect.height * 3);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Browser tidak menyediakan pemrosesan gambar.');
  context.drawImage(source.image,
    rect.x * source.width / REFERENCE.width, rect.y * source.height / REFERENCE.height,
    rect.width * source.width / REFERENCE.width, rect.height * source.height / REFERENCE.height,
    0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  let total = 0;
  for (let i = 0; i < pixels.data.length; i += 4) {
    const r = pixels.data[i]!, g = pixels.data[i + 1]!, b = pixels.data[i + 2]!;
    const gray = Math.max(r, g, b) - Math.min(r, g, b) > 45 ? 255 : Math.round((r + g + b) / 3);
    pixels.data[i] = gray;
    total += gray;
  }
  const threshold = Math.min(180, Math.max(65, total / (pixels.data.length / 4) - 45));
  for (let i = 0; i < pixels.data.length; i += 4) {
    const value = pixels.data[i]! < threshold ? 0 : 255;
    pixels.data[i] = value;
    pixels.data[i + 1] = value;
    pixels.data[i + 2] = value;
    pixels.data[i + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  const { promise, resolve, reject } = Promise.withResolvers<Blob>();
  canvas.toBlob(value => {
    if (value) resolve(value);
    else reject(new Error('Potongan gambar gagal disiapkan untuk OCR.'));
  }, 'image/png');
  const blob = await promise;
  return blob.arrayBuffer();
}

type TextResult = { text: string; confidence?: number };

export async function recognizePrices(source: SourceImage, options: { signal: AbortSignal; onProgress(value: number): void }): Promise<RecognitionResult> {
  const { signal, onProgress } = options;
  const worker = ownWorker(signal);
  const request = async (rect: Rect): Promise<TextResult> => {
    const buffer = await cropForRecognition(source, rect);
    if (signal.aborted) throw aborted(signal);
    const data = await worker.request<TextResult>('recognize', { image: new Uint8Array(buffer), options: {}, output: { text: true } }, [buffer]);
    if (typeof data.text !== 'string') throw new Error('Mesin OCR tidak mengembalikan teks yang valid.');
    return data;
  };
  try {
    onProgress(0);
    await worker.request('load', { options: { lstmOnly: true, corePath: new URL('/ocr/core', location.origin).href, logging: false } });
    await worker.request('loadLanguage', { langs: ['eng'], options: { langPath: new URL('/ocr/lang', location.origin).href, gzip: true, cacheMethod: 'none', lstmOnly: true } });
    await worker.request('initialize', { langs: 'eng', oem: 1, config: {} });
    await worker.request('setParameters', { params: { tessedit_pageseg_mode: '7', tessedit_char_whitelist: '0123456789.,', user_defined_dpi: '300' } });
    const prices = {} as RecognitionResult['prices'];
    for (const [index, region] of PRICE_REGIONS.entries()) {
      const data = await request(priceCrop(region));
      prices[region.id] = { value: parseOcrPrice(data.text), confidence: typeof data.confidence === 'number' && Number.isFinite(data.confidence) ? data.confidence : null };
      onProgress((index + 1) / (PRICE_REGIONS.length + 1));
    }
    await worker.request('setParameters', { params: { tessedit_char_whitelist: '' } });
    const date = await request({ x: DATE_REGION.clearLeft, y: DATE_REGION.y, width: DATE_REGION.clearRight - DATE_REGION.clearLeft, height: DATE_REGION.height });
    onProgress(1);
    return { prices, dateISO: parseIndonesianDate(date.text) };
  } finally {
    worker.close();
  }
}
