export const PRODUCTS = [
  { id: 'redmark:0.5', category: 'Redmark', weight: '0,5 gram' },
  { id: 'redmark:1', category: 'Redmark', weight: '1 gram' },
  { id: 'redmark:2', category: 'Redmark', weight: '2 gram' },
  { id: 'redmark:3', category: 'Redmark', weight: '3 gram' },
  { id: 'redmark:5', category: 'Redmark', weight: '5 gram' },
  { id: 'redmark:10', category: 'Redmark', weight: '10 gram' },
  { id: 'redmark:25', category: 'Redmark', weight: '25 gram' },
  { id: 'redmark:50', category: 'Redmark', weight: '50 gram' },
  { id: 'redmark:100', category: 'Redmark', weight: '100 gram' },
  { id: 'gift:0.5', category: 'Gift Series', weight: '0,5 gram' },
  { id: 'gift:1', category: 'Gift Series', weight: '1 gram' },
] as const;

export type ProductId = typeof PRODUCTS[number]['id'];
export type AmountKind = 'rupiah' | 'percent';
export type Markup =
  | { kind: 'rupiah'; amount: bigint }
  | { kind: 'percent'; coefficient: bigint; scale: bigint };
export type DateEdit = { kind: 'keep' } | { kind: 'replace'; iso: string };
export type RecognizedPrice = { value: bigint | null; confidence: number | null };
export type RecognitionResult = {
  prices: Record<ProductId, RecognizedPrice>;
  dateISO: string | null;
};
export type SourceImage = {
  image: HTMLImageElement;
  width: number;
  height: number;
  url: string;
  dispose(): void;
};
