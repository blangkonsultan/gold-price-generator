import { describe, expect, it } from 'vitest';
import { PRODUCTS, type RecognitionResult } from './model.ts';
import { initialSession, sessionReducer, sourceValues } from './session.ts';

function recognizedFixture(value: bigint): RecognitionResult {
  return { prices: Object.fromEntries(PRODUCTS.map(p => [p.id, { value, confidence: 90 }])) as RecognitionResult['prices'], dateISO: '2026-09-30' };
}

const beginFirst = () => sessionReducer(initialSession(), { type: 'begin', generation: 1, fileName: 'first.jpg' });

describe('source-image session transitions', () => {
  it('clears reviewed source values and date immediately on another upload', () => {
    const read = sessionReducer(beginFirst(), { type: 'result', generation: 1, result: recognizedFixture(1600000n) });
    const ready = sessionReducer(read, { type: 'confirm' });
    expect(ready.phase).toBe('ready');
    const next = sessionReducer(ready, { type: 'begin', generation: 2, fileName: 'second.jpg' });
    expect(next.fileName).toBe('second.jpg');
    expect(next.phase).toBe('reading');
    expect(next.drafts['redmark:0.5']).toBe('');
    expect(next.drafts['gift:1']).toBe('');
    expect(next.dateISO).toBeNull();
    expect(sourceValues(next.drafts)).toBeNull();
  });
  it('ignores a late successful result from a previous image', () => {
    const next = sessionReducer(beginFirst(), { type: 'begin', generation: 2, fileName: 'second.jpg' });
    const stale = sessionReducer(next, { type: 'result', generation: 1, result: recognizedFixture(1600000n) });
    expect(stale.phase).toBe('reading');
    expect(stale.fileName).toBe('second.jpg');
    expect(stale.drafts['redmark:0.5']).toBe('');
  });
  it('ignores old progress and old errors instead of interrupting the new job', () => {
    const next = sessionReducer(beginFirst(), { type: 'begin', generation: 2, fileName: 'second.jpg' });
    const progressed = sessionReducer(next, { type: 'progress', generation: 1, progress: 0.9 });
    expect(progressed.progress).toBe(0);
    const failed = sessionReducer(progressed, { type: 'error', generation: 1, message: 'old job failure' });
    expect(failed.phase).toBe('reading');
    expect(failed.error).toBeNull();
  });
  it('cannot confirm a result containing an unread price', () => {
    const result = recognizedFixture(1600000n);
    result.prices['gift:1'] = { value: null, confidence: null };
    const review = sessionReducer(beginFirst(), { type: 'result', generation: 1, result });
    const attempted = sessionReducer(review, { type: 'confirm' });
    expect(attempted.phase).toBe('review');
    expect(sourceValues(attempted.drafts)).toBeNull();
  });
  it('invalidates confirmation after editing an otherwise complete source', () => {
    const read = sessionReducer(beginFirst(), { type: 'result', generation: 1, result: recognizedFixture(1600000n) });
    const ready = sessionReducer(read, { type: 'confirm' });
    const changed = sessionReducer(ready, { type: 'correct', id: 'redmark:0.5', text: '1.700.000' });
    expect(changed.phase).toBe('review');
    expect(sourceValues(changed.drafts)?.['redmark:0.5']).toBe(1700000n);
    expect(sessionReducer(changed, { type: 'confirm' }).phase).toBe('ready');
  });
  it('retains an invalid manual draft but cannot confirm it', () => {
    const read = sessionReducer(beginFirst(), { type: 'result', generation: 1, result: recognizedFixture(1600000n) });
    const changed = sessionReducer(read, { type: 'correct', id: 'gift:1', text: '-1.000' });
    expect(changed.drafts['gift:1']).toBe('-1.000');
    expect(sessionReducer(changed, { type: 'confirm' }).phase).toBe('review');
    expect(sourceValues(changed.drafts)).toBeNull();
  });
});
