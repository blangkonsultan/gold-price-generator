import type { ProductId } from '../domain/model.ts';

export const REFERENCE = { width: 1024, height: 1280 } as const;
export type Rect = { x: number; y: number; width: number; height: number };
export type PriceRegion = {
  id: ProductId; x: number; baseline: number; right: number; clearLeft: number; clearRight: number;
};

export const PRICE_REGIONS: readonly PriceRegion[] = [
  { id: 'redmark:0.5', x: 250, baseline: 640, right: 425, clearLeft: 246, clearRight: 425 },
  { id: 'redmark:1', x: 250, baseline: 698, right: 425, clearLeft: 246, clearRight: 425 },
  { id: 'redmark:2', x: 250, baseline: 756, right: 750, clearLeft: 246, clearRight: 440 },
  { id: 'redmark:3', x: 250, baseline: 813, right: 750, clearLeft: 246, clearRight: 440 },
  { id: 'redmark:5', x: 250, baseline: 871, right: 750, clearLeft: 246, clearRight: 455 },
  { id: 'redmark:10', x: 250, baseline: 928, right: 750, clearLeft: 245, clearRight: 455 },
  { id: 'redmark:25', x: 250, baseline: 985, right: 750, clearLeft: 246, clearRight: 465 },
  { id: 'redmark:50', x: 250, baseline: 1043, right: 750, clearLeft: 246, clearRight: 480 },
  { id: 'redmark:100', x: 258, baseline: 1101, right: 750, clearLeft: 256, clearRight: 490 },
  { id: 'gift:0.5', x: 576, baseline: 640, right: 753, clearLeft: 576, clearRight: 753 },
  { id: 'gift:1', x: 576, baseline: 698, right: 753, clearLeft: 572, clearRight: 753 },
];

export const DATE_REGION = { x: 29, y: 475, right: 711, height: 44, baseline: 511, clearLeft: 28, clearRight: 454 } as const;

export function priceCrop(region: PriceRegion): Rect {
  return { x: region.clearLeft, y: region.baseline - 36, width: region.clearRight - region.clearLeft, height: 45 };
}

export function nativeRect(rect: Rect, width: number, height: number): Rect {
  const x = Math.floor(rect.x * width / REFERENCE.width);
  const y = Math.floor(rect.y * height / REFERENCE.height);
  return {
    x, y,
    width: Math.ceil((rect.x + rect.width) * width / REFERENCE.width) - x,
    height: Math.ceil((rect.y + rect.height) * height / REFERENCE.height) - y,
  };
}
