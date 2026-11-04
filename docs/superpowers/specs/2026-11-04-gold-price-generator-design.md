# Desain Gold Price Generator

Status: **disetujui pengguna**. Pengguna meminta inisialisasi tooling proyek sebelum implementasi. Persetujuan desain bukan bukti bahwa aplikasi produksi, GitHub repository, atau deployment sudah selesai.

## Tujuan dan alasan

Mengubah daftar harga emas harian dari foto dengan format seperti contoh Redmark/Gift Series. Pengguna memilih foto, memeriksa angka yang terbaca, mengatur kenaikan, mengubah tanggal bila diperlukan, lalu mengunduh gambar. Desain foto asli tidak dibuat ulang sebagai poster HTML.

## Kebutuhan yang sudah dikonfirmasi

- Aplikasi dan percakapan menggunakan bahasa Indonesia.
- Fokus utama adalah mobile; desktop tetap didukung.
- Pendekatan pertama dipilih: editor khusus format gambar contoh, bukan editor bebas untuk sembarang layout.
- Foto sumber tetap digunakan. Yang boleh berubah hanya harga dan tanggal yang sengaja diubah pengguna.
- Kenaikan dapat berupa persentase atau rupiah, berlaku untuk semua harga atau satu baris.
- Aturan per baris menggantikan aturan global untuk baris itu, bukan ditambahkan lagi.
- Input nominal dan persentase menggunakan `type="text"`, bukan number. Nominal ditampilkan dengan pemisah ribuan Indonesia, misalnya `1.000.000`.
- Tidak boleh ada teks bertumpuk, terpotong, atau harga yang disembunyikan dengan elipsis.
- Aksi unggah foto harus jelas dan berada pada awal alur mobile.
- Folder proyek: `/home/bagas/projects/laragon/gold-price-generator`.
- Pengguna meminta push ke akun GitHub `blangkonsultan` dan deployment Vercel bila akses tersedia.

## Approaches

1. **Editor khusus format contoh — dipilih pengguna.** OCR dan posisi edit disesuaikan dengan profil Redmark/Gift Series. Seluruh foto dipertahankan di luar area harga/tanggal. Alur lebih sederhana, tetapi foto yang dipotong atau layout yang dipindah tidak termasuk dukungan otomatis.
2. **Editor dengan area harga yang dapat dipindah-pindah — tidak dipilih.** Lebih fleksibel terhadap layout lain, tetapi memerlukan kontrol dan koreksi posisi yang lebih banyak.

Membangun ulang seluruh poster dengan HTML/CSS tidak dipakai karena bertentangan dengan tujuan mempertahankan artwork asli.

## Pilihan teknis yang disetujui

Pengguna menyetujui usulan berikut sebagai dasar implementasi:

- **React + Vite + TypeScript**, aplikasi statis yang dapat dideploy ke Vercel. Next.js tidak diperlukan karena tidak ada kebutuhan server, database, login, atau SEO dinamis.
- OCR menggunakan **Tesseract.js di browser**, dimuat saat dibutuhkan. File worker, core, dan bahasa dipin dan disajikan dari origin aplikasi agar tidak membutuhkan API OCR berbayar atau mengirim foto ke penyedia OCR.
- Foto diproses di memori browser dan tidak disimpan di server. Memuat aset aplikasi/model tetap memerlukan jaringan pada kunjungan pertama; dukungan offline penuh tidak dijanjikan.
- Kenaikan rupiah ditambahkan sekali pada harga setiap produk, bukan dikalikan gramasi.
- Hasil persentase dibulatkan ke rupiah utuh terdekat. Tidak ada pembulatan otomatis ke ribuan/puluhan ribu yang tidak diminta.
- Repository GitHub baru dibuat **private** sebagai default aman. User sudah memberi izin push; tidak ada force push atau perubahan repository lain.
- Deploy awal adalah **Vercel preview**, bukan production, kecuali pengguna meminta production secara eksplisit.
- Semua dependency dipin ke versi pasti dan dicatat di lockfile ketika implementasi dimulai.

## Alur dan tampilan mobile

1. **Unggah foto** adalah tindakan utama di bagian atas, sebelum pratinjau besar. Tampilkan nama file, thumbnail, ukuran, serta tombol ganti foto. JPEG, PNG, dan WebP didukung.
2. Tampilkan proses **Membaca harga** dan progres yang sebenarnya. Jangan mengisi foto baru dengan nilai dari gambar contoh.
3. Tampilkan **Periksa harga awal**: sembilan baris Redmark dan dua baris Gift Series. Setiap nilai dapat dikoreksi lewat input text terformat. Nilai yang belum terbaca tetap kosong dan ditandai, bukan diganti nol atau tebakan.
4. Pengguna mengatur **Tanggal pada gambar** dan **Kenaikan semua harga**. Tanggal asal dipertahankan sampai sengaja diganti. Tanggal keluaran menggunakan nama bulan Indonesia.
5. Setiap baris menampilkan harga awal, sumber aturan (Semua/Khusus), dan harga akhir. Kenaikan khusus nol tetap merupakan override sah; tidak kembali ke global secara diam-diam.
6. **Pratinjau** dan **Unduh PNG** mudah dijangkau dari mobile. Pada desktop, pengaturan dan pratinjau boleh berdampingan. Jangan menaruh gambar tinggi sebelum kontrol unggah/pengaturan di mobile.
7. Ekspor hanya tersedia setelah angka sudah diperiksa, tanggal valid, dan semua area teks lolos pemeriksaan ruang.

State yang harus nyata: belum ada foto, membaca, menunggu pemeriksaan, siap, gagal membaca, input tidak valid, teks tidak muat, serta gagal membuat PNG. Pesan harus menjelaskan tindakan perbaikannya. Memilih foto baru membatalkan/mengabaikan hasil pembacaan foto sebelumnya dan menghapus data harga lama.

## Perilaku input text

- Nominal rupiah: `type="text"`, `inputmode="numeric"`, format ribuan titik; nilai domain adalah bilangan rupiah utuh, bukan string terformat.
- Persentase: `type="text"`, `inputmode="decimal"`; koma adalah tanda desimal Indonesia. Contoh `1,5` berarti 1,5 persen, bukan 15 persen.
- Mengetik, paste, menghapus, memilih seluruh nilai, serta mengedit di tengah angka harus tetap masuk akal; posisi kursor tidak boleh selalu melompat ke akhir.
- Input kosong adalah draft kosong, bukan kenaikan nol tersembunyi. Karakter tidak valid, nilai negatif untuk fitur kenaikan, dan hasil di luar rentang integer aman harus menghasilkan pesan, bukan hasil angka yang salah.
- Pesan kesalahan input ditempatkan di dekat field terkait serta dihubungkan melalui `aria-invalid` dan `aria-describedby`; pengguna mobile tidak harus mencari pesan di bagian pratinjau yang jauh.
- Mengubah kenaikan tidak pernah menghitung ulang dari harga akhir sebelumnya: selalu dari harga awal yang dikonfirmasi.

## Profil gambar, OCR, dan tanggal

- Profil referensi memakai koordinat relatif terhadap foto 1024 × 1280 yang diberikan. Versi utuh dengan ukuran berbeda dan rasio yang setara didukung; crop, rotasi, atau perpindahan kolom bukan dukungan otomatis.
- OCR membaca area harga yang diketahui, bukan semua angka di poster. Gramasi, tahun, dan harga dari kategori lain tidak boleh tertukar.
- OCR boleh menggunakan salinan gambar yang dinormalisasi/diperbesar untuk membaca. **Ekspor tidak boleh memakai salinan yang di-resample**: gambar asli harus digambar pada ukuran piksel aslinya, lalu patch/edit diposisikan dengan skala profil.
- Hasil pembacaan selalu disajikan untuk pemeriksaan/koreksi. Kegagalan OCR ditampilkan secara eksplisit; entri manual pada foto yang sama boleh menyelesaikan data yang gagal dibaca, bukan fallback palsu atau harga contoh.
- Tanggal asal dibaca dari area tanggal bila memungkinkan. Bila tidak terbaca, pengguna diminta mengisi tanggal atau mempertahankan tanggal pada gambar tanpa menggambar ulang; aplikasi tidak menebak tanggal hari ini.

## Rendering dan jaminan tidak overlap

- Setiap harga mempunyai area aman sesuai barisnya. Dua baris pertama Redmark tidak boleh masuk ke ikon/teks Gift Series; area baris bawah tidak boleh menutupi gramasi, ikon, atau keluar dari panel.
- Ukur teks memakai metrik font aktual sebelum menggambar. Pertahankan satu baris, perkecil font hanya bila perlu, dan jaga jarak aman terhadap elemen yang tidak diedit.
- Ukuran font minimum harga adalah ekuivalen **22px pada referensi 1024px**, tanggal **28px**. Batas ini diskalakan ke resolusi asli. Bila tetap tidak muat, tampilkan baris bermasalah dan blokir ekspor, bukan wrap, clip, truncate, atau menutupi kategori sebelah.
- Tanggal mempunyai area sendiri dan pemeriksaan lebar/tinggi yang sama.
- Jangan menggambar ulang area harga yang nilainya tidak berubah; jangan menggambar ulang tanggal jika tidak berubah. Bersihkan angka lama secara lengkap pada area edit tanpa menghapus ikon di sebelahnya.
- PNG mempertahankan dimensi sumber. Garis bantu tidak ikut diekspor. Piksel di luar area edit harus tetap sama dengan hasil decode gambar sumber.

### Batas kesamaan visual yang harus terlihat saat persetujuan

Font asli dan file desain berlapis belum tersedia. Foto JPEG saja tidak membuktikan bahwa font dan background di balik angka dapat direkonstruksi pixel-identical. Mockup sebelumnya membuktikan kontrol, aritmetika, pembatasan area, dan PNG contoh, **bukan** kesamaan sempurna pada area yang diedit.

Implementasi harus mencocokkan font dan pemulihan background terhadap contoh, menampilkan hasil sebenarnya, serta tidak menyembunyikan artefak. Klaim pixel-identical untuk angka/tanggal pengganti hanya dapat diberikan bila didukung pengukuran/aset asli; jika hasil tidak memenuhi kualitas yang pengguna setujui, kualitas rendering tetap merupakan blocker rilis, bukan pekerjaan yang diam-diam ditinggalkan. Di luar area edit, persamaan piksel dapat dan harus diverifikasi langsung.

## Non-goals dan anti-goals

- Tidak membuat editor bebas untuk semua poster, background generator, akun pengguna, database, riwayat harga, katalog produk dinamis, watermark, atau template baru.
- Tidak mengirim foto ke server atau menjadikan layanan AI berbayar sebagai prasyarat.
- Tidak merilis harga hardcoded, OCR palsu, tombol unggah palsu, hasil gambar yang saling menimpa, atau implementasi separuh jadi sebagai aplikasi selesai.
- Tidak memasukkan credential, file `.env`, cache, atau `node_modules` ke GitHub.

## Verifikasi dan rilis

- Jalankan alur sebenarnya: pilih foto contoh dari file, baca dengan OCR nyata, periksa angka, terapkan kenaikan global/per baris, ganti tanggal, unduh PNG, dan lihat hasil file tersebut.
- Uji nominal bertitik, persentase berkoma, override nol, edit di tengah input, paste, pergantian foto saat membaca, hasil baca kosong/salah, harga panjang, dan batas ruang tanggal.
- Verifikasi visual minimal pada lebar 360px, ukuran menengah, serta 1280px atau lebih. Periksa keyboard focus, nama kontrol, input minimal 16px, target sentuh minimal 44px, dan tidak ada overflow horizontal.
- Audit teknis menggunakan Impeccable, lalu polish terarah berdasarkan temuan; jangan mengubah artwork poster atau mengganti arah visual yang sudah dipilih.
- Build produksi, smoke run, review independen, dokumentasi pemakaian/deploy, commit Conventional Commits, push ke `blangkonsultan/gold-price-generator`, lalu deploy preview bila akses tersedia.
- Bila autentikasi/deploy tetap tidak tersedia setelah pemeriksaan yang wajar, laporkan status GitHub yang benar-benar tercapai dan langkah yang masih memerlukan pemilik akun. Jangan mengklaim URL live yang belum terbentuk.

## Yang diserahkan kepada implementer

Struktur modul React, strategi state sederhana, detail preprocessing OCR, kalibrasi font/patch, penggunaan memoization yang benar-benar perlu, pemilihan versi pasti dependency, dan detil build aset worker. Pilihan ini tidak boleh mengurangi kebutuhan unggah/OCR nyata atau jaminan tidak overlap di atas.
