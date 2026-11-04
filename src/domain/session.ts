import { PRODUCTS, type ProductId, type RecognitionResult } from './model.ts';
import { InputError, formatRupiah, parseRupiah } from './pricing.ts';

export type SessionState = {
  generation: number;
  phase: 'empty' | 'reading' | 'review' | 'ready' | 'error';
  fileName: string | null;
  drafts: Record<ProductId, string>;
  confidence: Record<ProductId, number | null>;
  dateISO: string | null;
  progress: number;
  error: string | null;
};
export type SessionAction =
  | { type: 'begin'; generation: number; fileName: string }
  | { type: 'progress'; generation: number; progress: number }
  | { type: 'result'; generation: number; result: RecognitionResult }
  | { type: 'error'; generation: number; message: string }
  | { type: 'correct'; id: ProductId; text: string }
  | { type: 'confirm' };

export function initialSession(): SessionState {
  return {
    generation: 0, phase: 'empty', fileName: null,
    drafts: Object.fromEntries(PRODUCTS.map(p => [p.id, ''])) as Record<ProductId, string>,
    confidence: Object.fromEntries(PRODUCTS.map(p => [p.id, null])) as Record<ProductId, number | null>,
    dateISO: null, progress: 0, error: null,
  };
}

export function sourceValues(drafts: Record<ProductId, string>): Record<ProductId, bigint> | null {
  const values = {} as Record<ProductId, bigint>;
  for (const product of PRODUCTS) {
    try {
      const value = parseRupiah(drafts[product.id]);
      if (value === null) return null;
      values[product.id] = value;
    } catch (error) {
      if (error instanceof InputError) return null;
      throw error;
    }
  }
  return values;
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  if (action.type === 'begin') {
    return { ...initialSession(), generation: action.generation, fileName: action.fileName, phase: 'reading' };
  }
  if ('generation' in action && (action.generation !== state.generation || state.phase !== 'reading')) return state;
  switch (action.type) {
    case 'progress':
      return { ...state, progress: Math.min(1, Math.max(state.progress, action.progress)) };
    case 'result':
      return {
        ...state, phase: 'review', progress: 1, dateISO: action.result.dateISO, error: null,
        drafts: Object.fromEntries(PRODUCTS.map(p => {
          const value = action.result.prices[p.id].value;
          return [p.id, value === null ? '' : formatRupiah(value)];
        })) as Record<ProductId, string>,
        confidence: Object.fromEntries(PRODUCTS.map(p => [p.id, action.result.prices[p.id].confidence])) as Record<ProductId, number | null>,
      };
    case 'error':
      return { ...state, phase: 'error', error: action.message };
    case 'correct':
      if (state.phase === 'empty' || state.phase === 'reading') return state;
      return { ...state, phase: 'review', drafts: { ...state.drafts, [action.id]: action.text }, error: null };
    case 'confirm':
      if (state.phase === 'empty' || state.phase === 'reading') return state;
      if (sourceValues(state.drafts) === null) return { ...state, phase: 'review', error: 'Lengkapi dan periksa semua harga awal terlebih dahulu.' };
      return { ...state, phase: 'ready', error: null };
  }
}
