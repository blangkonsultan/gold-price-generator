# Actual native-resolution PNG verification

Target: `src/image/render.ts`, real Canvas fonts/metrics, source JPEG, and real PNG encoding/decoding. Executed in Chromium through an owned ignored smoke page, before the production editing interface is connected.

## Source and typography

- Source: the actual owner-provided 1024 × 1280 price list, decoded through the real upload function and read by the actual OCR worker.
- Numbers use self-hosted Roboto 400; the date uses self-hosted Montserrat 900. Both pinned packages carry OFL licenses copied with generated assets.
- The source date's dark-ink span was measured at x=31..443 and y=483..518. At 40px, the Roboto Black candidate advance was about 357.85px and Montserrat Black about 416.88px; Montserrat was the visibly closer date candidate. Advance width and dark-ink width are not identical metrics; this does not identify or prove possession of the original font.
- The safe date height is 50 reference pixels, leaving room for actual descenders before the price panel. Text is measured after fonts load; no clipping operation hides failed fits.

## Executed scenarios

| Scenario | Observed result |
|---|---|
| No price/date edits | Zero changed pixels across the entire 1024 × 1280 output |
| All prices +Rp50.000, date replaced with 04 November 2026 | 65,133 changed pixels inside edit regions; zero outside; native dimensions retained |
| Actual encoded PNG read back by actual OCR | First price 1.650.000, Gift Series 1 g 3.400.000, date 2026-11-04 |
| Long first-column price 12.347.278.900 | Font reduction reported for that row; zero changed pixels outside its safe edit region |
| First-column price 900.000.001.600.000 | Identified `redmark:0.5` fit error; no overlapping/truncated export returned |
| Manual source correction with zero markup | Explicit corrected row repainted; actual PNG OCR read 1.700.000 rather than retaining the old 1.600.000 |
| Resized complete source, 543 × 680 | Native dimensions retained; 20,092 changed pixels inside edit regions, zero outside |

The PNG was actually downloaded as `gold-price-render-proof.png` (673,231 bytes) and opened through the file reader. Visual inspection found the source artwork, title, category labels, weights, icons, and logo retained, with no visible old-digit remnants, white rectangle patches, or overlap in this output.

## Intent and immutability

- Untouched values and keep-date mode preserve the original raster rather than repainting it.
- Manual source correction is an explicit edit intent. A corrected row must be repainted even if final price equals the reviewed base; otherwise zero markup could display a number in the editor that is not present in the image.
- Explicit date replacement is honored, even if it matches an untrusted OCR estimate. Keep mode is the unambiguous request not to repaint the source date.
- The source canvas stays immutable; cached glyph-restoration patches use pixel replacement rather than alpha compositing over the original. Each returned output canvas is separate.

## Scope limits

This is real renderer/PNG evidence, not completion of the editing UI. The original font/layered design assets remain unavailable, so pixel-identical typography in edited regions is not claimed. The unchanged-region equality is measured against the browser-decoded source, not JPEG file-byte identity. Physical Safari/mobile-device behavior remains untested.

Production UI integration, responsive audit/polish, actual production build, fresh release review, GitHub push, and Vercel preview remain required. The owned smoke pages are temporary and must be removed after the integrated app path is exercised.
