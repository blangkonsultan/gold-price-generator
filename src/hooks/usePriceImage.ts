import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import { PRODUCTS, type AmountKind, type DateEdit, type Markup, type ProductId, type RecognitionResult, type SourceImage } from '../domain/model.ts';
import { InputError, calculatePrice, parseMarkup, parseRupiah } from '../domain/pricing.ts';
import { initialSession, sessionReducer, type SessionState } from '../domain/session.ts';
import { isValidISODate } from '../image/dates.ts';
import { recognizePrices } from '../image/ocr.ts';
import { ImageEditError, canvasToPng, renderPriceImage, type ImageEdits, type RenderResult } from '../image/render.ts';
import { decodeUpload } from '../image/upload.ts';

export type MarkupDraft = { kind: AmountKind; text: string };
export type Overrides = Partial<Record<ProductId, MarkupDraft>>;
type Issues = Partial<Record<ProductId, string>>;
export type DerivedPrices = {
  originals: Record<ProductId, bigint> | null;
  prices: Record<ProductId, bigint> | null;
  finals: Partial<Record<ProductId, bigint>>;
  sourceIssues: Issues;
  rowIssues: Issues;
  globalIssue: string | null;
  dateIssue: string | null;
  knownCount: number;
  forcePrices: ReadonlySet<ProductId>;
};
export type EditorModel = { session: SessionState; global: MarkupDraft; overrides: Overrides; date: DateEdit; derived: DerivedPrices; renderError: ImageEditError | null };
export type EditorActions = {
  globalKind(kind: AmountKind): void;
  globalText(text: string): void;
  rowKind(id: ProductId, kind: AmountKind | 'global'): void;
  rowText(id: ProductId, text: string): void;
  sourceText(id: ProductId, text: string): void;
  confirm(): void;
  date(iso: string): void;
  replaceDate(): void;
  keepDate(): void;
};
type RenderRequest = { source: SourceImage; originals: Record<ProductId, bigint>; edited: ImageEdits };
type Snapshot = { request: RenderRequest | null; phase: 'idle' | 'rendering' | 'ready' | 'error'; result: RenderResult | null; error: Error | null };
export type PreviewModel = {
  source: SourceImage;
  canvas: HTMLCanvasElement | null;
  phase: 'original' | 'paused' | 'rendering' | 'ready' | 'error';
  reason: string;
  smallerText: readonly (ProductId | 'date')[];
  canDownload: boolean;
  saving: boolean;
  downloadError: string | null;
};

export function usePriceImage() {
  const [session, dispatch] = useReducer(sessionReducer, undefined, initialSession);
  const [source, setSource] = useState<SourceImage | null>(null);
  const sourceRef = useRef<SourceImage | null>(null);
  const generation = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const recognized = useRef<RecognitionResult | null>(null);
  const [global, setGlobal] = useState<MarkupDraft>({ kind: 'rupiah', text: '0' });
  const [overrides, setOverrides] = useState<Overrides>({});
  const [date, setDate] = useState<DateEdit>({ kind: 'keep' });
  const [snapshot, setSnapshot] = useState<Snapshot>({ request: null, phase: 'idle', result: null, error: null });
  const [saving, setSaving] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [technicalError, setTechnicalError] = useState<string | null>(null);
  const latestRequest = useRef<RenderRequest | null>(null);

  useEffect(() => () => {
    generation.current++;
    abort.current?.abort();
    sourceRef.current?.dispose();
  }, []);

  async function loadFile(file: File): Promise<void> {
    const current = ++generation.current;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    sourceRef.current?.dispose();
    sourceRef.current = null;
    recognized.current = null;
    latestRequest.current = null;
    setSource(null);
    setGlobal({ kind: 'rupiah', text: '0' });
    setOverrides({});
    setDate({ kind: 'keep' });
    setSnapshot({ request: null, phase: 'idle', result: null, error: null });
    setDownloadError(null);
    setTechnicalError(null);
    dispatch({ type: 'begin', generation: current, fileName: file.name });
    try {
      const decoded = await decodeUpload(file);
      if (generation.current !== current || controller.signal.aborted) { decoded.dispose(); return; }
      sourceRef.current = decoded;
      setSource(decoded);
      const result = await recognizePrices(decoded, {
        signal: controller.signal,
        onProgress: progress => { if (generation.current === current) dispatch({ type: 'progress', generation: current, progress }); },
      });
      if (generation.current !== current || controller.signal.aborted) return;
      recognized.current = result;
      dispatch({ type: 'result', generation: current, result });
    } catch (error) {
      if (generation.current !== current || controller.signal.aborted) return;
      dispatch({ type: 'error', generation: current, message: error instanceof InputError ? error.message : 'Pembacaan otomatis gagal. Anda dapat mengisi harga awal dari foto secara manual atau memilih foto lain.' });
      if (!(error instanceof InputError)) setTechnicalError(error instanceof Error ? error.message : String(error));
    }
  }

  const derived = useMemo<DerivedPrices>(() => {
    const partial: Partial<Record<ProductId, bigint>> = {};
    const finals: Partial<Record<ProductId, bigint>> = {};
    const sourceIssues: Issues = {}, rowIssues: Issues = {};
    let knownCount = 0;
    for (const product of PRODUCTS) {
      try {
        const value = parseRupiah(session.drafts[product.id]);
        if (value === null) sourceIssues[product.id] = 'Belum terbaca. Isi harga awal yang sesuai foto.';
        else { partial[product.id] = value; knownCount++; }
      } catch (error) {
        if (!(error instanceof InputError)) throw error;
        sourceIssues[product.id] = error.message;
      }
    }
    let globalRule: Markup | null = null;
    let globalIssue: string | null = null;
    try {
      globalRule = parseMarkup(global.kind, global.text);
      if (!globalRule) globalIssue = 'Isi kenaikan semua harga, atau gunakan 0 tanpa kenaikan.';
    } catch (error) {
      if (!(error instanceof InputError)) throw error;
      globalIssue = error.message;
    }
    const usesGlobal = PRODUCTS.some(product => !overrides[product.id]);
    if (!usesGlobal) globalIssue = null;
    for (const product of PRODUCTS) {
      const draft = overrides[product.id];
      let override: Markup | null = null;
      if (draft) {
        try {
          override = parseMarkup(draft.kind, draft.text);
          if (!override) rowIssues[product.id] = 'Isi kenaikan khusus; gunakan 0 jika harga tidak dinaikkan.';
        } catch (error) {
          if (!(error instanceof InputError)) throw error;
          rowIssues[product.id] = error.message;
        }
      }
      const base = partial[product.id];
      const availableGlobal = globalRule ?? override;
      if (base === undefined || !availableGlobal || rowIssues[product.id]) continue;
      try { finals[product.id] = calculatePrice(base, availableGlobal, override); }
      catch (error) {
        if (!(error instanceof InputError)) throw error;
        rowIssues[product.id] = error.message;
      }
    }
    const originals = knownCount === PRODUCTS.length ? partial as Record<ProductId, bigint> : null;
    const prices = originals && !globalIssue && !Object.keys(rowIssues).length && Object.keys(finals).length === PRODUCTS.length
      ? finals as Record<ProductId, bigint> : null;
    const forcePrices = new Set<ProductId>();
    if (originals) for (const product of PRODUCTS) {
      if (recognized.current?.prices[product.id].value !== originals[product.id]) forcePrices.add(product.id);
    }
    return {
      originals, prices, finals, sourceIssues, rowIssues, globalIssue, knownCount, forcePrices,
      dateIssue: date.kind === 'replace' && !isValidISODate(date.iso) ? 'Pilih tanggal yang valid, atau pakai tanggal asli di foto.' : null,
    };
  }, [session.drafts, session.generation, global, overrides, date]);

  const request = useMemo<RenderRequest | null>(() => source && session.phase === 'ready' && derived.originals && derived.prices && !derived.dateIssue
    ? { source, originals: derived.originals, edited: { prices: derived.prices, date, forcePrices: derived.forcePrices } } : null,
  [source, session.phase, derived, date]);
  useLayoutEffect(() => { latestRequest.current = request; }, [request]);
  useEffect(() => {
    if (!request) return;
    let active = true;
    setSnapshot(previous => ({ request, phase: 'rendering', result: previous.request?.source === request.source ? previous.result : null, error: null }));
    renderPriceImage(request.source, request.originals, request.edited).then(result => {
      if (!active) return;
      setSnapshot({ request, phase: 'ready', result, error: null });
      setDownloadError(null);
    }, error => {
      if (!active) return;
      setSnapshot(previous => ({ ...previous, request, phase: 'error', error: error instanceof Error ? error : new Error(String(error)) }));
    });
    return () => { active = false; };
  }, [request]);

  const currentResult = snapshot.request?.source === source ? snapshot.result : null;
  const current = !!request && snapshot.request === request && snapshot.phase === 'ready';
  const activeRenderError = request && snapshot.request === request && snapshot.error instanceof ImageEditError ? snapshot.error : null;
  let phase: PreviewModel['phase'] = 'original';
  let reason = 'Periksa dan konfirmasi semua harga awal untuk menyiapkan hasil.';
  if (session.phase === 'reading') reason = 'Harga sedang dibaca. Yang ditampilkan masih foto asli.';
  else if (session.phase !== 'ready') { phase = currentResult ? 'paused' : 'original'; }
  else if (!request) { phase = 'paused'; reason = 'Perbaiki input yang ditandai. Hasil sebelumnya tidak dapat diunduh.'; }
  else if (snapshot.request !== request || snapshot.phase === 'rendering') { phase = 'rendering'; reason = 'Menyiapkan pratinjau dengan ukuran foto asli…'; }
  else if (snapshot.phase === 'error') { phase = 'error'; reason = snapshot.error?.message ?? 'Pratinjau gagal dibuat.'; }
  else if (current) { phase = 'ready'; reason = 'Harga dan tanggal sudah diperiksa ukurannya. Gambar siap diunduh.'; }

  async function download(): Promise<void> {
    if (!current || !request || !currentResult || saving || sourceRef.current !== request.source) return;
    const atClick = generation.current;
    setSaving(true);
    setDownloadError(null);
    try {
      const blob = await canvasToPng(currentResult.canvas);
      if (atClick !== generation.current || latestRequest.current !== request) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'harga-emas.png';
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      if (atClick === generation.current) setDownloadError(error instanceof Error ? error.message : String(error));
    } finally { setSaving(false); }
  }

  const actions: EditorActions = {
    globalKind(kind) {
      if (kind === global.kind) return;
      latestRequest.current = null;
      setGlobal({ kind, text: '' });
    },
    globalText(text) {
      if (text === global.text) return;
      latestRequest.current = null;
      setGlobal(previous => ({ ...previous, text }));
    },
    rowKind(id, kind) {
      if ((overrides[id]?.kind ?? 'global') === kind) return;
      latestRequest.current = null;
      setOverrides(previous => {
        const next = { ...previous };
        if (kind === 'global') delete next[id];
        else next[id] = { kind, text: '' };
        return next;
      });
    },
    rowText(id, text) {
      if (overrides[id]?.text === text) return;
      latestRequest.current = null;
      setOverrides(previous => previous[id] ? { ...previous, [id]: { ...previous[id], text } } : previous);
    },
    sourceText(id, text) {
      if (text === session.drafts[id]) return;
      latestRequest.current = null;
      dispatch({ type: 'correct', id, text });
    },
    confirm() { dispatch({ type: 'confirm' }); },
    date(iso) { latestRequest.current = null; setDate({ kind: 'replace', iso }); },
    replaceDate() { latestRequest.current = null; setDate({ kind: 'replace', iso: session.dateISO ?? '' }); },
    keepDate() { if (date.kind === 'keep') return; latestRequest.current = null; setDate({ kind: 'keep' }); },
  };
  const editor: EditorModel = { session, global, overrides, date, derived, renderError: activeRenderError };
  const preview: PreviewModel | null = source ? {
    source, canvas: currentResult?.canvas ?? null, phase, reason,
    smallerText: currentResult?.smallerText ?? [], canDownload: current && !saving, saving, downloadError,
  } : null;
  return { session, source, technicalError, loadFile, editor, actions, preview, download };
}
