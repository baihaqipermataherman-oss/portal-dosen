# Portal Dosen — React + Vite + Supabase

Ini adalah versi produksi dari prototipe Portal Dosen: profil publik, publikasi,
berita, bimbingan Skripsi/PKL (dengan Bab 1–6 dan chat revisi/ACC), dan materi
kuliah per pertemuan dengan token unduh. Login Dosen memakai Supabase Auth
sungguhan (bukan lagi kata sandi tertulis di kode).

## 1. Siapkan proyek Supabase

1. Buat proyek baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, tempel seluruh isi `supabase/schema.sql`, lalu jalankan (**Run**).
   Ini akan membuat semua tabel, kebijakan keamanan (RLS), dan dua fungsi bantu
   (`cek_token_ta`, `buka_materi`, `acc_bab`).
3. Buka **Storage → New bucket**, buat bucket bernama `uploads`, centang **Public bucket**.
   Lalu jalankan dua baris SQL berikut di SQL Editor (sudah ada juga sebagai komentar
   di akhir `schema.sql`):
   ```sql
   create policy "baca publik uploads" on storage.objects for select using (bucket_id = 'uploads');
   create policy "unggah oleh siapapun" on storage.objects for insert with check (bucket_id = 'uploads');
   ```
4. Buka **Authentication → Users → Add user**, buat satu akun untuk dosen
   (email + kata sandi). Akun inilah yang dipakai untuk "Login Dosen".
5. Buka **Project Settings → API**, salin **Project URL** dan **anon public key**.

## 2. Jalankan di komputer Anda

```bash
npm install
cp .env.example .env
# lalu isi .env dengan Project URL & anon key dari langkah 1.5
npm run dev
```

Buka `http://localhost:5173`. Login Dosen ada di kanan atas (baris kecil di
atas menu utama, bukan sejajar dengan menu publik), memakai email/kata sandi
yang dibuat di langkah 1.4.

## 3. Deploy ke Vercel

1. Push folder ini ke sebuah repo GitHub.
2. Di [vercel.com](https://vercel.com), **Add New → Project**, pilih repo tersebut.
   Vercel otomatis mengenali proyek Vite.
3. Di **Environment Variables**, tambahkan `VITE_SUPABASE_URL` dan
   `VITE_SUPABASE_ANON_KEY` (nilai yang sama seperti di `.env`).
4. Deploy. `vercel.json` sudah disertakan agar navigasi React Router (mis.
   `/admin`, `/mahasiswa`) tidak 404 saat direfresh langsung di URL tersebut.

## Catatan keamanan & batasan yang perlu diketahui

- **Mahasiswa tidak login lewat akun sungguhan** — akses bimbingan/materi
  memakai "token tahun ajaran" di level aplikasi, seperti di prototipe. Ini
  cukup untuk skala satu jurusan, tapi siapa pun yang tahu URL Supabase &
  anon key bisa membaca/menulis ke tabel bimbingan lewat API langsung (bukan
  hanya lewat website ini). Untuk keamanan lebih ketat, pindahkan validasi
  token dan penulisan bimbingan ke **Supabase Edge Function**, sehingga anon
  key tidak punya akses tulis langsung ke tabel tersebut.
- **Token materi & token tahun ajaran** sengaja tidak bisa dibaca langsung
  lewat `select *` dari peran anon — pengecekan token lewat fungsi
  `cek_token_ta()` / `buka_materi()` agar nilai tokennya sendiri tidak bocor
  ke siapa pun yang membuka DevTools.
- **Notifikasi email otomatis** (fitur EmailJS dari prototipe) belum
  disertakan di build ini agar kredensial pihak ketiga tidak ikut ter-commit.
  Untuk menambahkannya: buat akun di emailjs.com, lalu di `BabThread.jsx`
  tambahkan pemanggilan `emailjs.send(...)` setelah `insert` thread berhasil,
  persis seperti pola yang sudah dipakai di prototipe HTML sebelumnya.
- **Rich text editor** memakai `contentEditable` + `execCommand` bawaan
  browser (ringan, tanpa dependensi tambahan). Untuk kebutuhan jangka
  panjang yang lebih andal, pertimbangkan migrasi ke pustaka seperti
  [Tiptap](https://tiptap.dev) — struktur komponen `RichTextEditor.jsx`
  sudah dipisah sehingga bisa diganti tanpa menyentuh halaman lain.

## Struktur proyek

```
src/
  components/      Header, ProtectedRoute, RichTextEditor, BabThread, KartuBimbingan
  context/          AuthContext (Supabase Auth)
  pages/            Beranda, Publikasi, Berita, Login
  pages/mahasiswa/  Area Mahasiswa (Bimbingan, Materi)
  pages/admin/      Panel dosen (Edit Profil, Publikasi, Berita, Bimbingan, Materi)
  styles/global.css Sistem desain (warna, tipografi) dari prototipe
supabase/schema.sql Skema database + RLS + fungsi bantu
```

Lanjutkan pengembangan halaman demi halaman seperti sebelumnya — beri tahu
saya fitur atau perbaikan apa yang ingin ditambahkan berikutnya.
