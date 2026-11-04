# Gold Price Generator

Aplikasi berbahasa Indonesia untuk mengubah harga dan tanggal pada foto daftar harga emas berformat Redmark/Gift Series. Foto diproses di browser; tidak ada upload foto ke API/server aplikasi.

## Cara pakai

1. Tekan **Unggah foto** dan pilih JPEG, PNG, atau WebP utuh berasio 4:5 seperti contoh: 9 harga Redmark dan 2 Gift Series.
2. Tunggu OCR, periksa seluruh harga awal, koreksi yang keliru, lalu **Konfirmasi harga awal**.
3. Isi kenaikan semua harga dalam rupiah atau persen. Input berupa text: `50.000` rupiah atau `1,5` persen.
4. Bila perlu, pilih **Khusus Rp/%** per produk. Aturan khusus menggantikan aturan semua harga; nilai `0` sah.
5. **Ganti tanggal** bersifat opsional. **Pakai tanggal foto** mempertahankan tanggal asli, termasuk ketika OCR tanggal tidak terbaca.
6. Buka **Pratinjau**, periksa hasil, lalu **Unduh PNG**.

Foto baru mereset aturan kenaikan. Koreksi harga awal meminta konfirmasi ulang. Nilai kosong/tidak valid atau teks yang tidak muat memblokir ekspor, bukan dipotong atau ditumpuk.

## Menjalankan proyek

Gunakan Node 22; workstation verifikasi memakai Node `22.23.3` dan npm `10.9.9`.

```bash
npm ci
npm run dev -- --port 5174 --strictPort
```

Port 5174 terdaftar pada workstation pemilik untuk proyek ini, loopback saja. Di workstation lain, pilih port bebas; jangan menghentikan layanan proyek lain.

```bash
./init.sh       # test lengkap, type-check, dan build produksi
npm run check  # type-check saja
npm test       # regression domain/session/date/input
npm run build  # siapkan aset OCR, type-check, build ke dist/
```

`npm run dev` dan `npm run build` menyiapkan worker, core LSTM, model Inggris, dan lisensi dari dependency yang dipin ke `public/ocr/`. Folder ini hasil generate dan tidak perlu di-commit. Semua model/core/font disajikan oleh origin aplikasi; tidak membutuhkan API key OCR.

## Vercel

Import repository ini dan gunakan konfigurasi Vite yang sudah tersedia:

- Install: `npm ci`
- Build: `npm run build`
- Output: `dist`
- Node: `22.x`

Tidak ada environment secret yang dibutuhkan. Deployment awal ditujukan sebagai preview; halaman memakai `noindex, nofollow`. Hapus kebijakan preview tersebut hanya saat memang mempromosikan situs publik produksi. URL live tidak ditulis sebelum deployment benar-benar tersedia.

## Batas dan privasi

- Mendukung format foto contoh utuh, bukan editor bebas untuk crop, rotasi, susunan kolom lain, atau semua poster.
- Hasil OCR wajib diperiksa; uji satu foto bukan jaminan akurasi untuk semua foto.
- PNG mempertahankan dimensi sumber dan piksel hasil decode di luar area edit. Ini bukan identitas byte JPEG/PNG.
- Font asli/desain berlapis tidak tersedia. Harga memakai Roboto dan tanggal memakai Montserrat yang dicocokkan terhadap contoh; pixel-identical pada area teks pengganti tidak diklaim.
- Gunakan browser modern dengan Canvas, Web Workers, WebAssembly, FontFaceSet, dan `Promise.withResolvers`. Chromium emulation/synthesized touch sudah diuji; Safari/perangkat fisik belum disahkan.
- Foto dan pengaturan tidak dipersistenkan. Memuat ulang halaman menghapus sesi; koneksi awal diperlukan untuk aset/model.

## Struktur

- `src/domain/`: parsing Indonesia, aritmetika integer, draft/caret, dan state sesi.
- `src/image/`: profil area, decode file, worker OCR yang dapat dibatalkan, tanggal, renderer PNG.
- `src/hooks/`: lifecycle foto/worker/render dan kelayakan ekspor.
- `src/components/`: kontrol unggah, pemeriksaan harga, dan pratinjau.
- `PRODUCT.md`, `CLAUDE.md`, `feature_list.json`, `progress.md`, `session-handoff.md`: konteks dan bukti kerja agen.
- `docs/verification/` dan `docs/audits/`: bukti OCR/PNG/browser serta audit sebelum/sesudah perbaikan.

CodeGraph lokal berada di `.codegraph/` dan tidak dikirim ke GitHub. Gunakan `codegraph explore` sebelum pencarian kode dan `codegraph sync .` setelah perubahan source. Pemeriksaan struktur harness opsional: `node scripts/verify-harness.mjs` (memerlukan skill `harness-creator` lokal); nilainya bukan pengganti test/build/smoke aplikasi.

Dependency dan lockfile dipin. Tesseract/core, language package, Roboto, dan Montserrat membawa lisensi masing-masing; salinannya disertakan dalam aset OCR yang dihasilkan. Foto fixture berasal dari contoh yang diberikan pemilik dan tidak dijadikan harga default aplikasi.
