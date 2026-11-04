# Desain Fitur Berbagi Gambar ke Media Sosial di Mobile

Status: **menunggu persetujuan pengguna**.

## 1. Tujuan dan Alasan

Menambahkan opsi berbagi (*share*) langsung dari aplikasi ke aplikasi media sosial (WhatsApp, Instagram, Telegram, dll.) khusus pada perangkat *mobile*. Fitur ini mempermudah pengguna mempublikasikan atau mengirim daftar harga emas yang sudah diperbarui langsung dari smartphone tanpa harus mengunduh file secara manual lalu mencari file tersebut di galeri.

## 2. Goals, Non-Goals, & Anti-Goals

### Goals
- Menyediakan tombol aksi berbagi gambar di samping/bawah tombol "Unduh PNG" pada panel pratinjau (`ImagePreview.tsx`).
- Hanya menampilkan tombol berbagi di perangkat mobile saat browser mendukung Web Share API untuk file gambar (`navigator.canShare({ files })`).
- Berbagi file gambar asli berformat PNG (`harga-emas.png`) secara langsung ke aplikasi target seperti WhatsApp, Instagram (Feed/Stories), dll. lewat *native share sheet* sistem operasi (Android/iOS).
- Memastikan touch target berukuran minimal 44px dan responsif dari viewport 360px ke atas.
- Menangani pembatalan berbagi (`AbortError`) secara senyap tanpa menampilkan pesan kesalahan.

### Non-Goals
- Tidak menampilkan tombol berbagi di desktop (desktop tetap menggunakan tombol "Unduh PNG").
- Tidak membuat backend pengunggah gambar publik atau membuat tautan URL publik.
- Tidak membuat tombol khusus per-aplikasi yang terpisah (misal tombol khusus logo WA, tombol khusus logo IG) karena Web Share API pada browser web memanggil native share sheet sistem operasi yang secara otomatis memuat semua aplikasi yang terpasang di HP pengguna.

### Anti-Goals
- Jangan menampilkan tombol mati atau tombol yang error di browser yang tidak mendukung Web Share API untuk file.
- Jangan mengunggah foto pengguna ke server pihak ketiga manapun (tetap 100% lokal di browser).

## 3. Batasan Teknis (Constraints)

- Aplikasi bersifat 100% client-side (offline-ready/local in-memory Canvas).
- `navigator.share` hanya dapat dipanggil sebagai respons langsung dari interaksi pengguna (*transient activation* / *user gesture*).
- Berbagi file membutuhkan dukungan `navigator.canShare` dengan objek `{ files: [File] }` dan protokol aman (HTTPS atau localhost).

## 4. Approaches

1. **Deteksi Kapabilitas Web Share (`navigator.canShare` dengan file) + Deteksi Tampilan Mobile (Dipilih Pengguna)**
   - Tombol "Bagikan Gambar" hanya dirender jika perangkat adalah mobile dan `navigator.canShare?.({ files: [dummyFile] })` bernilai `true`.
   - Menghasilkan pengalaman pengguna yang bersih: tombol hanya ada jika benar-benar berfungsi di perangkat tersebut.
   - Penanganan pembatalan interaksi user tidak memicu pesan error.

2. **Tombol Selalu Tampil di Tampilan Mobile via Breakpoint CSS (Tidak Dipilih)**
   - Tombol selalu tampil di mobile; jika API tidak didukung, dialihkan ke unduh otomatis.
   - Tidak dipilih karena membingungkan jika aksi yang dilakukan pengguna adalah "Bagikan" tetapi perilakunya sama dengan "Unduh".

## 5. Keputusan Teknis dan Alur Antarmuka

- **Deteksi Ketersediaan:** Helper diinisialisasi/diperiksa untuk mendeteksi apakah `navigator.share` dan `navigator.canShare` mendukung file PNG dan sedang berjalan di lingkungan mobile / touch.
- **Komponen UI (`ImagePreview.tsx`):**
  - Jika didukung, tampilkan tombol tombol aksi:
    - Label: "Bagikan Gambar" (dengan ikon atau keterangan pendukung seperti "WhatsApp, Instagram, dll.").
    - Status disabled mengikuti `model.canDownload` (hanya aktif saat gambar sudah siap/valid).
    - Status loading: "Menyiapkan gambar…".
- **Aksi Berbagi (`usePriceImage.ts`):**
  - Fungsi `share()`: Mengonversi canvas saat ini ke PNG blob melalui `canvasToPng`, membuat instance `File([blob], 'harga-emas.png', { type: 'image/png' })`, lalu memanggil `navigator.share({ files: [file], title: 'Daftar Harga Emas' })`.
  - Jika pengguna membatalkan (menutup share sheet), abaikan `AbortError`.
  - Jika terjadi error sistem lain yang bukan pembatalan, tampilkan pesan ramah pengguna di bawah tombol.

## 6. Bagian untuk Builder

- Detail styling CSS responsif dan penyesuaian tata letak tombol aksi (flex layout berdampingan atau bertumpuk rapi di mobile).
- Penulisan unit test / mocking untuk memverifikasi pemanggilan `navigator.share` dan penanganan `AbortError`.
