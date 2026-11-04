# Gold Price Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the real Indonesian upload–OCR–review–markup–date–PNG workflow for the approved fixed-format price-list editor, then publish the verified application.

**Architecture:** React owns source-image/session state and editable text drafts; pure domain functions own parsing and price arithmetic. A lazy browser worker recognizes fixed source regions, while a separate Canvas renderer edits the immutable native-resolution source and refuses unreadable text. No application server or remote photo processing.

**Tech Stack:** React, Vite, TypeScript, Tesseract.js, self-hosted OCR assets, Canvas, Vitest for pure behavior, npm, Node 22, GitHub, Vercel preview.

**Spec:** `docs/superpowers/specs/2026-11-04-gold-price-generator-design.md` — specification and implementation plan approved by the owner; Native execution selected.

## Global Constraints

- Indonesian UI, labels, instructions, accessible names, statuses, and errors.
- Fixed-format reference: nine Redmark prices and two Gift Series prices on a complete 1024 × 1280 source; proportionally resized complete images supported.
- Money/percentage inputs are `type="text"`; `1.000.000` means integer rupiah and `1,5` means 1.5 percent. Currency uses `inputmode="numeric"`; percentage uses `inputmode="decimal"`.
- A per-row rule replaces global markup, including an explicit zero. Always calculate from reviewed original prices. Fixed rupiah is once per product, not per gram; percentage results round to whole rupiah.
- Keep the original date until deliberately changed. Do not guess today when OCR cannot read the original date.
- Export native source dimensions and preserve decoded pixels outside price/date edit regions. OCR preprocessing is not the export source.
- No overlap, wrapping, clipping, truncation, or sample-price fallback. Minimum output font equivalents: prices 22px and date 28px on the 1024px reference; block export below those floors.
- Mobile-first, no horizontal overflow from 360px through 1280px or wider; input/select fonts at least 16px and primary touch controls at least 44px.
- Pin exact dependency versions and commit the lockfile. Self-host worker/core/language assets; no paid OCR API or server-side photo storage.
- Private `blangkonsultan/gold-price-generator` repository; initial Vercel preview, never force push. No secrets, caches, dependencies, or unfinished application paths in the release.

## Review Focus

1. An old upload's late OCR result/progress/error must not overwrite a newer upload — Task 2 session-transition tests and Task 4 real two-upload smoke.
2. Fractional percentage rounding, zero overrides, and unsafe integer results must not silently change selling prices — Task 1 literal arithmetic/range tests.
3. An unreadable source date must stay untouched; an invalid replacement date must block export rather than normalize itself — Task 3 date tests and actual Canvas smoke.
4. Long prices and late font loading must not overlap neighboring artwork or resample the whole source — Task 3 actual-font boundary/native-pixel browser checks.
5. Paste, middle editing, deletion beside separators, empty drafts, and comma percentages must not move the caret arbitrarily or reinterpret amounts — Task 1 draft/parser tests and Task 4 native input interaction.

---

## Current Checkpoint

- [x] Project directory, approved design, Obsidian project/decision records, Impeccable `PRODUCT.md`, and initial harness created.
- [x] `./init.sh` executed the actual installed structural validator: 100/100, five subsystems 5/5. This is not an application test or build.
- [x] CodeGraph initialized and refreshed against the bootstrap adapter. Its application-source graph does not yet exist.
- [x] Owner approved the plan, selected Native execution, and confirmed the separate CLAUDE.md improvements.

## File Responsibilities and Shared Interfaces

- `package.json`, lockfile, TypeScript/Vite configuration, `index.html`, `.nvmrc`: reproducible React app and actual `check`, `test`, `build`, `dev`, `preview` commands. Keep the existing docs/harness; do not scaffold over the directory.
- `src/domain/model.ts`: `ProductId`, canonical markup/date/recognition contracts below.
- `src/domain/pricing.ts`: strict Indonesian amount parsing and exact integer price arithmetic.
- `src/domain/numeric-draft.ts`: pure grouped-draft/caret/deletion handling, separate from canonical domain values.
- `src/domain/session.ts`: generation-aware recognition/review transitions; no image/OCR work in the reducer.
- `src/image/profile.ts`: fixed eleven-row crop/edit regions scaled from the supplied reference, plus the separate date region.
- `src/image/upload.ts`, `ocr.ts`, `dates.ts`, `render.ts`: decode/dispose source, actual worker recognition, calendar-safe dates, and native-resolution image output.
- `src/hooks/usePriceImage.ts`: source lifetime, abort/terminate worker, session reducer, and derived export eligibility.
- `src/components/AmountInput.tsx`, `UploadPanel.tsx`, `PriceEditor.tsx`, `ImagePreview.tsx`; `src/App.tsx`, `main.tsx`, `styles.css`: complete Indonesian interface, not an alternate calculation implementation.
- `scripts/copy-ocr-assets.mjs`: build-time self-hosting of pinned worker/core/model assets; fail if required shipped package files cannot be resolved.
- `tests/fixtures/reference-price-list.jpg`: the actual owner-supplied photo, for development evidence rather than production default values.
- Pure behavior tests live beside their modules. Actual OCR/Canvas/UI smoke uses the real browser and source file; no new React wiring/mock-echo tests.

```ts
// src/domain/model.ts
export type ProductId =
  | 'redmark:0.5' | 'redmark:1' | 'redmark:2' | 'redmark:3' | 'redmark:5'
  | 'redmark:10' | 'redmark:25' | 'redmark:50' | 'redmark:100'
  | 'gift:0.5' | 'gift:1';
export type Markup =
  | { kind: 'rupiah'; amount: bigint }
  | { kind: 'percent'; coefficient: bigint; scale: bigint };
// Percentage 1,5 has coefficient 15n and scale 10n.
export type DateEdit = { kind: 'keep' } | { kind: 'replace'; iso: string };
export type RecognizedPrice = { value: bigint | null; confidence: number | null };
export type RecognitionResult = {
  prices: Record<ProductId, RecognizedPrice>;
  dateISO: string | null;
};
export type SourceImage = {
  image: HTMLImageElement; width: number; height: number; url: string;
  dispose(): void;
};
```

## Task 1: Reproducible App and Exact Numeric Domain

**Files:** Create package/lock/TypeScript/Vite configuration files; `src/domain/model.ts`, `pricing.ts`, `numeric-draft.ts`, and their behavior tests. Preserve the populated project directory; app HTML/React entrypoints belong to Task 4.

**Interfaces produced:**
- `parseRupiah(text: string): bigint | null` and `parsePercent(text: string): { coefficient: bigint; scale: bigint } | null`; null means empty/incomplete draft, never implicit zero. Invalid syntax/negative/unsafe money is an explicit error.
- `calculatePrice(original: bigint, global: Markup, override: Markup | null): bigint`; output must remain within `Number.MAX_SAFE_INTEGER`.
- `formatRupiah(value: bigint): string`.
- `formatNumericDraft(raw: string, kind: 'rupiah' | 'percent', selection: { start: number; end: number }): { text: string; start: number; end: number }`; retain invalid drafts for visible validation rather than silently deleting letters/signs.
- `separatorDeletionRange(text: string, selection: { start: number; end: number }, key: 'Backspace' | 'Delete'): { start: number; end: number } | null`; let native deletion remove an adjacent digit when otherwise trapped on an auto-inserted grouping dot.

- [ ] Create a minimal React/Vite/TypeScript manifest without running a generator over existing docs. Resolve supported stable packages, save exact versions, and lock npm dependencies. Use Node `22.x` for hosting and record observed local Node `22.23.3` in `.nvmrc`.
- [ ] Write the failing domain tests before implementation. Hand-checked expectations include:

```ts
expect(parseRupiah('1.000.000')).toBe(1000000n);
expect(parseRupiah('')).toBeNull();
expect(parsePercent('1,5')).toEqual({ coefficient: 15n, scale: 10n });
expect(calculatePrice(1600000n, { kind: 'percent', coefficient: 5n, scale: 1n }, null)).toBe(1680000n);
expect(calculatePrice(1600000n, { kind: 'percent', coefficient: 5n, scale: 1n }, { kind: 'rupiah', amount: 70000n })).toBe(1670000n);
expect(calculatePrice(1600000n, { kind: 'rupiah', amount: 50000n }, { kind: 'rupiah', amount: 0n })).toBe(1600000n);
expect(calculatePrice(101n, { kind: 'percent', coefficient: 5n, scale: 10n }, null)).toBe(102n);
expect(() => calculatePrice(9007199254740991n, { kind: 'rupiah', amount: 1n }, null)).toThrow();
```

Also pin invalid mixed separators/negative currency, incomplete comma drafts, recalculation from the same original twice, and middle-edit/deletion selections using literal expected text/caret positions.
- [ ] Run the targeted Vitest files and observe the expected missing-behavior failure. Implement parsing, half-up whole-rupiah percentage rounding using integer arithmetic, range guards, and draft handling; rerun those tests to green. Do not test literal source wording or incidental CSS.
- [ ] Record evidence and commit the domain/config files with a Conventional Commit. Initialize local Git if still absent; do not push the partial app.

## Task 2: Real Upload, Self-Hosted OCR, and Stale-Session Protection

**Files:** `src/domain/session.ts` and tests; `src/image/profile.ts`, `upload.ts`, `ocr.ts`, parsing tests; `scripts/copy-ocr-assets.mjs`; fixture image.

**Interfaces consumed:** Task 1 contracts.

**Interfaces produced:**
- `decodeUpload(file: File): Promise<SourceImage>`; decode only supported image types, reject incompatible full-image proportions with a clear error, and release object URLs on disposal.
- `recognizePrices(source: SourceImage, options: { signal: AbortSignal; onProgress(value: number): void }): Promise<RecognitionResult>`; a real lazy Tesseract worker, terminated on abort/unmount/replacement.
- `parseOcrPrice(text: string): bigint | null`; accept one unambiguous grouped/ungrouped price, normalize OCR grouping punctuation only when structurally valid, reject multiple prices or weight/date contamination instead of selecting a convenient token.
- `sessionReducer(state: SessionState, action: SessionAction): SessionState`; state carries current generation, filename, phase, recognized/reviewed rows, original date, progress, and error. Define typed begin/progress/result/error/correct/confirm actions; generation-bearing results from older jobs are ignored.

- [ ] Add pinned Tesseract.js/core/English-language packages. Inspect their resolved shipped files before coding asset-copy paths; self-host the actual worker, required JS/WASM variants, and English traineddata under `/ocr/`. Add asset generation to the production build and ignore generated copies, not the lockfile.
- [ ] Write failing pure tests for ambiguous OCR text, missing values, late generation-A success/progress/error after generation B begins, new-upload clearing, confirmation blocked while any original price is missing, and source corrections invalidating an earlier confirmation.
- [ ] Implement the fixed eleven-row profile and use a separately normalized OCR canvas. Whitelist price characters per crop; recognize the date separately with appropriate character settings. Never export this preprocessed canvas or insert hardcoded sample amounts.
- [ ] Implement actual upload/session/review transitions, including correction after recognition failure. Increment generation at file selection before awaiting decode; dispose late-decoded sources and ignore stale OCR callbacks. Keep missing amounts null and visible; confirm all source prices in one explicit review action rather than requiring eleven confirmation taps.
- [ ] Check the current host-port registries and listeners before starting any app dev/preview server; reserve a free loopback port without disturbing the existing 5179 companion or other projects. Record the actual port rather than assuming the draft plan owns one.
- [ ] Before the production UI exists, use an owned throwaway HTML smoke page under ignored `.superpowers/smoke/` that imports the actual source modules through Vite. This is not a permanent placeholder application; remove it after the real integrated path is exercised.
- [ ] Run the pure tests, then exercise actual recognition on the supplied JPEG in the browser. Record what it really read and what required correction; no mocked OCR or claims from parser tests alone. Verify worker/core/language requests are same-origin and no missing model assets.
- [ ] Commit only the completed upload/OCR/session deliverable and its evidence.

## Task 3: Native-Resolution PNG, Optional Date, and No-Overlap Rendering

**Files:** `src/image/dates.ts`, date tests, `render.ts`, profile calibration; locally served replacement font assets resolved from a pinned licensed font package if needed.

**Interfaces consumed:** source/markup/recognition contracts and fixed profile.

**Interfaces produced:**
- `parseIndonesianDate(text: string): string | null` and `formatIndonesianDate(iso: string): string`; calendar-safe validation, not JavaScript date-overflow normalization.
- `renderPriceImage(source: SourceImage, original: { prices: Record<ProductId, bigint>; dateISO: string | null }, edited: { prices: Record<ProductId, bigint>; date: DateEdit }): Promise<{ canvas: HTMLCanvasElement; regions: ReadonlyArray<{ x: number; y: number; width: number; height: number }> }>`; compare original/final values to skip unchanged fields, and identify any field/row that cannot fit.
- `canvasToPng(canvas: HTMLCanvasElement): Promise<Blob>`; propagate real encoding failure.

- [ ] Write failing date tests for `30 September 2026`, invalid February dates, leap-year boundaries, and explicit keep-versus-replace behavior. Unreadable original date plus keep mode must not create today's date.
- [ ] Implement original-dimension rendering from an immutable source canvas. Scale profile coordinates to native dimensions, retain source labels/icons, and skip unchanged amounts/date. Restore old glyph regions without painting over adjacent colored icons; calibrate cleanup against the actual sample, not a plain white rectangle.
- [ ] Load the intended replacement font before measuring or drawing. Use actual horizontal ink bounds, ascent, descent, baseline, and safe gaps; shrink from the calibrated size down to the specified 22px/28px reference floors. If it still cannot fit, throw an identified fit error; clipping must never hide a failed fit.
- [ ] Exercise a real-browser regression with a first-column long price equivalent to `12.347.278.900`, and another value that exceeds readable capacity. Observe fitted glyphs inside bounds and blocked PNG for the latter. Check a changed date and keep mode.
- [ ] Download/open the actual PNG and compare decoded pixels outside the returned edit regions against the original; require zero changed outside pixels and identical dimensions on the reference and a resized complete variant. Inspect the edited regions visually for old-digit remnants, patches, and font drift. Poor fidelity remains a release blocker.
- [ ] Run date tests, record actual rendering evidence, and commit the completed renderer.

## Task 4: Complete Indonesian Mobile Workflow

**Files:** `index.html`; `src/hooks/usePriceImage.ts`; the four components in the file map; `src/App.tsx`, `main.tsx`, `styles.css`.

**Interfaces consumed:** Tasks 1–3; no second parser/calculation/renderer in components.

- [ ] Build the complete empty → selected/reading → review → editable preview → PNG path. Initial global markup is zero. The upload action is prominent before a large preview; show actual filename, dimensions, progress, and errors.
- [ ] Connect formatted text fields to canonical parsed values without treating blank drafts as zero. Support native paste, selection replacement, separator deletion, and middle editing; keep readable 16px controls and 44px primary targets.
- [ ] Keep date editing explicit: default `DateEdit` is keep. The date field can replace with a valid ISO date; a nearby keep-original action restores keep mode. Clearing an attempted replacement is an invalid draft, not permission to guess a date.
- [ ] Derive download eligibility from reviewed complete originals, valid markup/date, current-generation source, loaded fonts, and a successful latest render. Ignore render promises from previous source/draft effects. A previous preview may remain visible on errors only with a clear paused/stale-preview label and disabled export.
- [ ] Place errors at their actual fields and link via `aria-invalid`/`aria-describedby`; preserve visible focus and named controls. Make preview/export reachable on mobile without placing a tall image ahead of upload/settings.
- [ ] Smoke the actual app using file selection, OCR, source correction/confirmation, global percentage/rupiah, row override including zero, date replacement/restore, long-price failure/recovery, and PNG download. Start a second real upload while the first is reading and verify no stale data appears. Inspect browser console/network errors.
- [ ] Inspect 360px, an intermediate touch layout, and 1280px+ desktop in one screenshot round; fix verified issues in one batch and confirm in at most one further round. No new permanent UI wiring tests; domain/session uncertainty is already tested.
- [ ] Record evidence and commit the complete user-facing workflow.

## Task 5: Audit, Review, Documentation, and Publication

**Files:** actual check/build scripts in `package.json` and `init.sh`; README; `vercel.json` if needed; existing state/progress/handoff; audit evidence under `docs/`; CodeGraph index remains local.

- [ ] Run the actual project check, full test command, and production build after integration. Update `init.sh` to execute the real application checks once those commands exist; stop treating structural validation as the application gate.
- [ ] Use the approved Impeccable audit/polish workflow on the completed surface, not only the mockup. Run one detector pass where no automatic hook exists; verify warnings in context. Keep measured browser evidence separate from physical-device/Safari claims.
- [ ] Obtain fresh code/security/requirements review with the approved spec, this plan, changed-file interfaces, actual screenshots, and exercised behavior. Resolve material findings before release; do not use a structural score as code/visual review.
- [ ] Write usage/development/build/deploy instructions from commands that actually ran. Update feature evidence, progress, handoff, Obsidian project/daily records, and CodeGraph with actual source and state. Remove only owned throwaway smoke scaffolds; keep meaningful behavior tests and the actual fixture.
- [ ] Finish atomic Conventional Commits and create/push the private `blangkonsultan/gold-price-generator` repository using the already authorized account. Do not force push, publish secrets, or upload an unverified half-app.
- [ ] Follow the deployment skill's real linked/authenticated/fallback flow for an initial Vercel preview. Existing CLI timeout/API 403 is not a successful login. If no authenticated or supported fallback deployment works, finish the GitHub deliverable and report the exact remaining account/network prerequisite. Report only returned URLs and observed deployment status.

## Plan Review and Execution

The owner approved the production design and requested these initializations. This plan and the targeted CLAUDE.md change proposal are the next review gates, not evidence that application code exists.

**Recommended execution:** Native in this session. The OCR, immutable-source rendering, and mobile state lifetimes share tight contracts; one integration owner can keep them consistent, followed by fresh whole-project review. Subagent-driven execution remains available if the owner prefers per-task implementation/review contexts.
