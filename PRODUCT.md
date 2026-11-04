# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Approved by the owner: React + Vite + TypeScript, browser-local Tesseract.js OCR, and Canvas PNG export. Static deployment to Vercel; no application server, database, user accounts, or paid OCR API. Pin exact dependency versions and commit the lockfile during implementation.

## Users

People updating the supplied Redmark/Gift Series gold price-list image for redistribution. Mobile is the primary usage surface; desktop remains supported. No additional user roles are specified.

## Product Purpose

Upload a daily price-list image, review and correct extracted prices, apply percentage or fixed-rupiah increases, optionally change its date, and download the same artwork with updated values and no overlapping text.

## Positioning

A focused editor for the known price-list layout, not a general poster generator. Preserve the uploaded raster rather than rebuilding the design in HTML.

## Operating Context

- Reference content: nine Redmark prices and two Gift Series prices on a complete 1024 × 1280 image, with proportionally resized complete variants supported.
- The uploaded date stays unchanged unless the user deliberately changes it; output month names are Indonesian.
- Initial network access is needed for application/model assets. Photos remain in browser memory; full offline operation is not promised.
- A private GitHub repository under `blangkonsultan` and an initial Vercel preview are the approved delivery targets.

## Capabilities and Constraints

- Indonesian application copy and user-facing messages.
- Visible photo upload at the start of the mobile workflow; JPEG, PNG, and WebP support.
- Currency and percentage fields use text inputs: grouping dot for rupiah, decimal comma for percentage. Preserve meaningful caret behavior.
- Global percentage or fixed-rupiah markup; a per-row rule replaces global, including an explicit zero override.
- Calculate from reviewed original prices. Fixed rupiah is added once per product, not per gram; percentage results round to whole rupiah.
- Missing OCR values remain missing and editable, never filled from a sample. A new upload must not retain stale prices or OCR results.
- Change only intended price/date regions. Preserve native output dimensions and decoded source pixels outside edited regions.
- Measure text before drawing. Reduce only to a readable minimum; block export instead of overlap, wrapping, clipping, or truncation.
- Cropped, rotated, and reorganized layouts are outside automatic support.
- No unrequested history, accounts, watermark, server-side photo storage, or arbitrary-layout editor.

## Brand Commitments

Retain the artwork, title, category labels, product weights, icons, and logo already present in each uploaded image. No new product visual identity has been requested.

## Evidence on Hand

- Approved specification: `docs/superpowers/specs/2026-11-04-gold-price-generator-design.md`.
- Prototype audit and actual browser evidence: `docs/audits/2026-11-04-mockup-audit.md`.
- Temporary prototype demonstrates Indonesian copy, formatted text inputs, file selection, date/markup controls, and boundary behavior; it does not implement production OCR.
- Original font and layered design assets are absent. Pixel-identical replacement text/background remains unproven and must not be claimed from the prototype.
- Production application code and deployment are not yet present.

## Product Principles

1. Preserve the source, not a lookalike.
2. Make original prices and active markup rules inspectable.
3. Prefer an explicit correction or blocked export to a plausible wrong price.
4. Keep upload, editing, and export reachable on a narrow mobile screen.
5. Claim only behavior actually exercised on the uploaded image.

## Accessibility & Inclusion

Support widths down to 360px and up to 1280px or more without horizontal overflow. Primary touch controls are at least 44px; form input/select text is at least 16px. Keep visible keyboard focus, named controls, accessible status, and local field errors linked through `aria-invalid` and `aria-describedby`. Browser emulation is not physical-device or Safari verification.
