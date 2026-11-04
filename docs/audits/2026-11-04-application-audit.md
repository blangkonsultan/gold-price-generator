# Audit aplikasi Gold Price Generator

Target: aplikasi React sebenarnya pada port loopback 5174, bukan mockup. Pengguna sudah meminta audit dan polish. Ini adalah keadaan sebelum satu batch perbaikan UI dan satu putaran konfirmasi.

## Verdict integritas implementasi

**Pass pada alur yang diperiksa.** Unggah file native, OCR worker/model lokal, pemeriksaan harga, kenaikan global/per baris, tanggal, validasi, dan pengunduhan PNG sudah dijalankan. Tidak ada harga contoh yang menggantikan foto baru. Detektor mekanis aplikasi (`detect --json src index.html`) mengembalikan `[]`; itu bukan sertifikasi kualitas atau aksesibilitas menyeluruh.

## Skor sebelum polish

| Dimensi | Skor | Bukti / batas |
|---|---:|---|
| Aksesibilitas | 2/4 | Label/fokus/error lokal tersedia, tetapi batas kontrol kurang kontras dan nama input khusus belum mencakup satuan label terlihat. |
| Performa | 3/4 | OCR/model dimuat saat file dipilih; rendering memakai source immutable dan patch tersimpan. Build/bundle produksi belum dinilai pada checkpoint ini. |
| Theming | 4/4 | Token semantik, native input/select terang, state error/disabled/focus konsisten; mode gelap tidak diminta. |
| Responsif | 3/4 | 360/768/1024/1440px tanpa overflow, target minimal 44px, input/select minimal 16px. Label satuan masih sempit; gesture touch baru akan dikonfirmasi. |
| Integritas implementasi | 4/4 | Angka berasal dari file sebenarnya, prioritas override benar, source edit membatalkan konfirmasi, output yang tidak muat diblokir. |
| **Total** | **16/20** | **Good — perbaiki temuan aksesibilitas dan kontrol sempit sebelum rilis.** |

## Temuan terverifikasi

### P1 — Batas input/secondary button di bawah kontras 3:1
- `src/styles.css:12`: token `--control` menghasilkan `rgb(155,172,159)` pada permukaan putih.
- Rasio terukur **2,3876:1**; batas kontrol diperlukan untuk mengenali input putih di atas permukaan putih (WCAG 1.4.11).
- Perbaikan: gelapkan token ke `#819487`, kandidat terukur **3,2212:1**, tanpa mengganti arah visual.

### P1 — Nama aksesibel input khusus tidak memuat satuan pada label terlihat
- `src/components/PriceEditor.tsx:84-85`: label terlihat `Kenaikan khusus (Rp)` tetapi nama aksesibel `Kenaikan khusus Redmark 0,5 gram`.
- Pengguna voice control/AT tidak memperoleh label yang sama (WCAG 2.5.3).
- Perbaikan: sertakan `(Rp)`/`(%)` pada nama aksesibel, sambil mempertahankan kategori dan gramasi.

### P2 — Tanggal pengganti wajib belum diumumkan sebagai required
- `src/components/PriceEditor.tsx:40-43`: pengosongan tanggal pengganti sudah memblokir PNG dan menampilkan error, tetapi DOM `required` masih false.
- Perbaikan: required hanya pada mode penggantian tanggal; mode memakai tanggal foto tetap tidak memerlukan tanggal hasil OCR.

### P2 — Teks opsi satuan sempit
- `src/styles.css:93,171`: kolom 134/132px memotong ujung label `Rupiah (Rp)` pada capture desktop/tablet.
- Perbaikan: lebarkan kolom satuan menjadi 148px; field nominal tetap fleksibel dan tidak membuat overflow mobile.

### P2 — Metadata form dan pengumuman validasi dapat dipertegas
- Amount/select/date/file fields belum memakai `name` yang bermakna, meskipun label sudah tersedia.
- Error terkait field sudah memakai `aria-describedby`/`aria-invalid`; tambahkan pengumuman polite dan status pemeriksaan harga tanpa membuat toast sebagai satu-satunya feedback.
- Tambahkan ruang scroll mobile untuk fokus agar footer tetap tidak menutupi kontrol.

## Hal baik yang dipertahankan

- Tombol unggah terlihat pada viewport awal 360px; tidak didahului pratinjau besar.
- Semua input harga/kenaikan berupa text; tidak ada `input[type=number]`.
- Masukan `1,5%`, override Rp70.000, override nol, override 10%, koreksi source, tanggal/restore, harga terlalu panjang/recovery, invalid `1.5` rupiah, edit tengah, dan backspace separator benar-benar diperiksa pada aplikasi.
- Native trusted clipboard paste berhasil dan mengubah kalkulasi sesuai nilai. Helper clipboard tool sempat mencampur shim/native store; masalah tool dilaporkan, bukan ditambal di aplikasi. Izin clipboard khusus pengujian dan isi clipboard dipulihkan; aplikasi tidak meminta izin clipboard programmatic.
- Saat unggahan pertama masih mempunyai worker aktif, unggahan PNG lain menggantikannya; nama file, harga 1.650.000, tanggal 2026-11-04, serta reset kenaikan menunjukkan source baru, bukan hasil lama. Inventori worker native kosong setelah selesai.
- File bukan gambar membersihkan data sebelumnya dan memberi error; memilih JPEG valid kembali berhasil.
- Rasio teks muted **6,3141:1**, tombol utama **9,1607:1** pada state yang diperiksa.
- Zoom tidak dikunci, fokus terlihat, kontrol native, skip link, dan source-image dimensions tersedia.

## Rujukan dan pengecualian lingkup

Pemeriksaan memakai [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) dan playbook Impeccable. URL sync untuk foto/private price drafts, modal navigasi baru, framework/primitives tambahan, dan mode gelap tidak ditambahkan: aplikasi bekerja di memori lokal dengan elemen native dan scope yang sudah disetujui. Tombol ekspor sengaja dinonaktifkan ketika data/fit belum valid, sesuai syarat keamanan harga pengguna.

Capture awal: `.impeccable/review/empty-mobile.png`, `mobile-editor.png`, `mobile-fields.png`, `mobile-preview.png`, `tablet.png`, `desktop.png`. Semua capture dibuka dan diperiksa. Pengujian ini adalah Chromium emulation, bukan klaim perangkat Safari fisik atau sertifikasi WCAG lengkap.

## Tindakan

`$impeccable polish`: terapkan temuan terverifikasi dalam satu batch, lalu konfirmasi responsive/semantics/contrast serta touch/keyboard. Build produksi dan review rilis independen tetap merupakan tahap berikutnya.

## Konfirmasi setelah satu batch polish

- Token batas kontrol sudah menjadi `#819487` (3,2212:1 pada putih); field/select tetap minimal 16px dan 44px.
- Kolom satuan 148px menampilkan `Rupiah (Rp)` utuh pada capture konfirmasi.
- Nama aksesibel input khusus kini mencakup label terlihat berikut satuannya; tanggal pengganti required, seluruh input/select memiliki name, dan error/status memakai pengumuman polite.
- Viewport 320/360/768/1024/1440px diperiksa tanpa overflow atau kontrol kecil. Trusted touch membuka file picker, mengonfirmasi, memfokuskan nominal (scale tetap 1), berpindah panel, dan mengunduh PNG. Keyboard Enter memindahkan panel serta fokus ke heading.
- Capture final dibuka dan diperiksa; capture awal disimpan di `round-1/`. Tidak ada putaran polish tambahan setelah konfirmasi ini.

Tidak ada temuan material audit di atas yang masih terbuka. Ini tetap bukan sertifikasi WCAG/AT atau Safari/perangkat fisik. Build produksi dan review rilis independen masih merupakan gate terpisah.
