# Integrated application smoke evidence

The real React application was exercised in Chromium, not a mockup or mocked OCR path.

Verified behaviors:
- Native file picker: source JPEG produced all eleven expected prices and `2026-09-30`; export stayed disabled before source confirmation.
- Global +Rp50.000 produced 1.650.000 and 260.050.000 for the first/last Redmark rows. Global 1,5% produced 1.624.000 for the first row.
- Row Rp70.000 replaced global percentage (1.670.000); row zero retained 1.600.000; row 10% produced 1.760.000 without stacking.
- Changing a source amount invalidated confirmation. After re-confirmation, zero markup used the corrected 1.700.000.
- Date replacement and restoration worked; an empty attempted replacement blocked PNG and marked the date input invalid.
- A safe integer amount too wide for the first column blocked export and identified the actual row. A smaller long amount recovered successfully.
- Invalid rupiah `1.5` remained invalid, not silently interpreted as 15.
- Middle editing retained the caret; backspace beside a separator removed the intended digit. Trusted native paste of `1.250.000` updated the final amount to 2.950.000 for a corrected 1.700.000 source.
- The clipboard helper initially mixed its shim store with the native clipboard. A scoped temporary CDP permission verified real trusted paste; the permission and clipboard were restored. No application code requests clipboard permissions.
- An upload replaced an active OCR worker. The new filename, 1.650.000 source amount, 2026-11-04 date, reset global rule, and empty native worker inventory confirmed no stale results from the first JPEG.
- A non-image file removed old editable/output data and showed the actual validation error; selecting a valid JPEG recovered.
- Real PNG downloads were completed from both click and synthesized touch interaction.

## Responsive and input evidence

At 320, 360, 768, 1024, and 1440 CSS pixels: document width matched the viewport; no visible primary control was below 44px in either dimension; all form input/select text was at least 16px.

Trusted touch events opened the file picker, confirmed source prices, focused the amount field, switched to preview, and downloaded PNG. Pointer type was `touch`; the focused amount field kept `visualViewport.scale === 1`. Keyboard Enter switched the view and moved focus to the target heading.

This is Chromium emulation and synthesized touch, not physical Safari or on-screen keyboard certification.

## Audit/polish confirmation

One first inspection round and one targeted correction/confirmation round were used. The control border now uses `#819487` (3.2212:1 on white), the unit selector is 148px wide, visible override-unit text is included in the accessible name, replacement date is required only when enabled, and every input/select has a name. Final captures were opened and inspected under `.impeccable/review/`; first-round evidence is preserved under `round-1/`.

The bundled detector returned no findings on the completed app. Browser JavaScript error capture was empty during the exercised normal/recovery paths. Production artifact/build and independent release review are separate gates recorded afterward.
