# Mobile Social Share Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mobile-only social sharing button to share the generated PNG price list image directly to WhatsApp, Instagram, Telegram, and other apps via the Web Share API.

**Architecture:** A lightweight browser-capability utility (`src/image/share.ts`) checks for file-sharing support and handles `navigator.share` execution with `AbortError` cancellation filtering. The `usePriceImage` hook exposes share state and actions, while `ImagePreview.tsx` renders the action button styled to appear strictly on mobile viewports (<= 980px) with touch-target compliance.

**Tech Stack:** React 19, TypeScript, Vitest, Web Share API (`navigator.share`, `navigator.canShare`), HTML5 Canvas PNG Blob.

**Spec:** `docs/superpowers/specs/2026-11-04-mobile-share-design.md`

## Global Constraints

- Indonesian language for all UI copy, button labels, and user-facing error messages.
- Privacy invariant: 100% client-side in-memory processing; never upload user images to any server.
- The share button MUST only be displayed on mobile screens (viewport <= 980px) where file sharing is supported.
- Desktop viewports (> 980px) must hide the share button.
- Minimum 44px touch targets on interactive buttons with zero horizontal overflow down to 360px mobile.
- `AbortError` triggered when the user cancels the OS share sheet must be swallowed silently without displaying error messages.

## Review Focus

1. **User cancellation (`AbortError`):** When the user opens the native share sheet and taps outside/cancels, no error text must appear on the UI.
2. **Unsupported browser / in-app WebView:** If `navigator.canShare({ files })` returns `false` or throws, `canShare` evaluates to `false` and the button is omitted.
3. **Desktop hiding:** On screens wider than 980px, the share button must not be rendered or visible even if the desktop browser supports `canShare`.
4. **Stale canvas / race condition:** If the user edits prices while share generation is in flight, the share action must not dispatch a stale image.
5. **Non-AbortError exceptions (e.g. PermissionDenied or NotAllowedError):** Friendly Indonesian error message must be shown under the actions area.

---

### Task 1: Share Utility Module and Unit Tests

**Files:**
- Create: `src/image/share.ts`
- Create: `src/image/share.test.ts`

**Interfaces:**
- Produces:
  - `canShareImageFiles(nav?: Navigator): boolean`
  - `shareImageFile(file: File, nav?: Navigator): Promise<boolean>`

- [ ] **Step 1: Write the failing tests in `src/image/share.test.ts`**

```typescript
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

  it('throws on unexpected errors', async () => {
    const nav = {
      share: vi.fn().mockRejectedValue(new Error('Permission denied')),
      canShare: vi.fn().mockReturnValue(true),
    } as unknown as Navigator;
    const file = new File(['test'], 'harga-emas.png', { type: 'image/png' });

    await expect(shareImageFile(file, nav)).rejects.toThrow('Permission denied');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test src/image/share.test.ts`
Expected: FAIL with module not found or functions not defined.

- [ ] **Step 3: Implement `canShareImageFiles` and `shareImageFile` in `src/image/share.ts`**

Implement:
```typescript
export function canShareImageFiles(nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined): boolean {
  if (!nav || typeof nav.share !== 'function' || typeof nav.canShare !== 'function') return false;
  try {
    const dummy = new File([new Uint8Array([0])], 'probe.png', { type: 'image/png' });
    return nav.canShare({ files: [dummy] });
  } catch {
    return false;
  }
}

export async function shareImageFile(file: File, nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined): Promise<boolean> {
  if (!nav || typeof nav.share !== 'function') {
    throw new Error('Fitur berbagi tidak didukung pada browser ini.');
  }
  try {
    await nav.share({
      files: [file],
      title: 'Daftar Harga Emas',
    });
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return false;
    }
    throw error;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test src/image/share.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/image/share.ts src/image/share.test.ts
git commit -m "feat(share): add canShareImageFiles and shareImageFile utilities with tests"
```

---

### Task 2: Integrate Share Action into `usePriceImage` Hook

**Files:**
- Modify: `src/hooks/usePriceImage.ts`

**Interfaces:**
- Consumes:
  - `canShareImageFiles(nav?: Navigator): boolean` from `src/image/share.ts`
  - `shareImageFile(file: File, nav?: Navigator): Promise<boolean>` from `src/image/share.ts`
  - `canvasToPng(canvas: HTMLCanvasElement): Promise<Blob>` from `src/image/render.ts`
- Produces:
  - `PreviewModel.canShare: boolean`
  - `PreviewModel.sharing: boolean`
  - `PreviewModel.shareError: string | null`
  - `usePriceImage().share: () => Promise<void>`

- [ ] **Step 1: Update `PreviewModel` type and add hook state in `src/hooks/usePriceImage.ts`**

Add fields to `PreviewModel`:
```typescript
canShare: boolean;
sharing: boolean;
shareError: string | null;
```
Add state hooks in `usePriceImage`:
```typescript
const [sharing, setSharing] = useState(false);
const [shareError, setShareError] = useState<string | null>(null);
const [canShareSupported] = useState(() => canShareImageFiles());
```

- [ ] **Step 2: Implement `share` function in `usePriceImage.ts`**

```typescript
async function share(): Promise<void> {
  if (!current || !request || !currentResult || saving || sharing || sourceRef.current !== request.source) return;
  const atClick = generation.current;
  setSharing(true);
  setShareError(null);
  try {
    const blob = await canvasToPng(currentResult.canvas);
    if (atClick !== generation.current || latestRequest.current !== request) return;
    const file = new File([blob], 'harga-emas.png', { type: 'image/png' });
    await shareImageFile(file);
  } catch (error) {
    if (atClick === generation.current) {
      setShareError(error instanceof Error ? error.message : 'Gagal membagikan gambar.');
    }
  } finally {
    if (atClick === generation.current) setSharing(false);
  }
}
```

Include `canShare: canShareSupported && current && !saving && !sharing`, `sharing`, `shareError` in `preview` object, and return `share` in hook return value.

- [ ] **Step 3: Run existing test suite and check types**

Run: `npm run check && npm test`
Expected: PASS with 0 type errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/usePriceImage.ts
git commit -m "feat(hook): expose share method and model state in usePriceImage"
```

---

### Task 3: UI Integration in `ImagePreview.tsx` and `App.tsx`

**Files:**
- Modify: `src/components/ImagePreview.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes:
  - `Props.onShare?(): void` in `ImagePreview`
  - `tool.share` in `App.tsx`

- [ ] **Step 1: Update `ImagePreview.tsx` props and JSX**

In `src/components/ImagePreview.tsx`:
Add `onShare?(): void` to `Props`.
Render share button next to download button within `.preview-actions`:
```tsx
<div className="preview-actions">
  <button id="download-png" className="primary download-button" type="button" disabled={!model.canDownload}
    aria-describedby="preview-reason" aria-busy={model.saving} onClick={onDownload}>
    {model.saving ? 'Menyiapkan PNG…' : 'Unduh PNG'}
  </button>
  {model.canShare ? (
    <button id="share-png" className="secondary share-button mobile-only-action" type="button"
      disabled={!model.canDownload || model.saving || model.sharing}
      aria-describedby="preview-reason" aria-busy={model.sharing} onClick={onShare}>
      {model.sharing ? 'Menyiapkan gambar…' : 'Bagikan Gambar'}
    </button>
  ) : null}
</div>
{model.downloadError ? <p className="field-error" role="alert">{model.downloadError}</p> : null}
{model.shareError ? <p className="field-error" role="alert">{model.shareError}</p> : null}
```

- [ ] **Step 2: Connect `onShare` in `src/App.tsx`**

Pass `onShare={() => { void tool.share(); }}` to `<ImagePreview>` in `src/App.tsx`.

- [ ] **Step 3: Run check and test suite**

Run: `npm run check && npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ImagePreview.tsx src/App.tsx
git commit -m "feat(ui): add mobile share button to ImagePreview component"
```

---

### Task 4: CSS Styling and Mobile-Only Visibility in `src/styles.css`

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Add CSS rules for `.preview-actions`, `.share-button`, and `.mobile-only-action`**

In `src/styles.css`:
- Desktop default:
  ```css
  .preview-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
  .preview-actions .download-button { margin-top: 0; width: 100%; }
  .mobile-only-action { display: none; }
  .share-button {
    width: 100%;
    min-height: 44px;
    padding: 12px 18px;
    font-size: 15px;
    font-weight: 600;
  }
  ```
- Mobile breakpoint (`@media (max-width: 980px)`):
  ```css
  .mobile-only-action { display: block; }
  ```
- Ensure touch target is at least 44px and button flows cleanly at 360px without horizontal scroll.

- [ ] **Step 2: Build project and verify CSS**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "style: add responsive styles for mobile share button and desktop hiding"
```

---

### Task 5: End-to-End Verification and Quality Gates

**Files:**
- Test: Full build and test suite
- Verification: `./init.sh` and browser visual check on mobile & desktop viewports

- [ ] **Step 1: Run complete verification script**

Run: `./init.sh`
Expected: All tests pass, type-check passes, assets copy, build succeeds.

- [ ] **Step 2: Verify responsive layout and mobile share behavior**

Start preview or test dev server:
Verify:
1. Desktop (> 980px): Share button is hidden.
2. Mobile (<= 980px): Share button is visible when `canShare` is supported, minimum touch target is 44px.
3. No horizontal overflow at 360px viewport.

- [ ] **Step 3: Update documentation/tracking artifacts**

Update `progress.md` with session summary and verification evidence.
Update `CLAUDE.md` / `feature_list.json` if applicable.

- [ ] **Step 4: Final commit**

```bash
git add progress.md
git commit -m "docs: record verification and completion of mobile social share feature"
```
