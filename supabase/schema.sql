-- ============================================================
-- SKEMA PORTAL DOSEN — jalankan ini di Supabase SQL Editor
-- ============================================================
create extension if not exists "pgcrypto";

-- ---------- PROFIL (satu baris, id = 1) ----------
create table profil (
  id int primary key default 1,
  nama text not null default '',
  jabatan text not null default '',
  institusi text not null default '',
  email text not null default '',
  bio text not null default '',
  chips text[] not null default '{}',
  constraint satu_baris check (id = 1)
);
insert into profil (id, nama, jabatan, institusi, email, bio, chips) values
  (1, 'Dr. Amanda Putri, S.Kom., M.T.', 'Dosen Tetap, Program Studi Informatika',
      'Universitas Cendekia Nusantara', 'amanda.putri@ucn.ac.id',
      'Amanda mengajar dan meneliti di persimpangan kecerdasan buatan dan rekayasa perangkat lunak.',
      array['Kecerdasan Buatan','Pemrosesan Bahasa Alami','Rekayasa Perangkat Lunak']);

create table pendidikan (
  id uuid primary key default gen_random_uuid(),
  tahun text not null,
  gelar text not null,
  tempat text not null,
  urutan int not null default 0
);

create table matkul (
  id uuid primary key default gen_random_uuid(),
  kode text not null,
  nama text not null,
  info text not null default ''
);

create table publikasi (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  venue text not null,
  tahun text not null,
  link text default '',
  created_at timestamptz not null default now()
);

-- ---------- BERITA ----------
create table berita (
  id uuid primary key default gen_random_uuid(),
  tipe text not null default 'sendiri' check (tipe in ('sendiri','eksternal')),
  judul text not null,
  penulis text default '',
  isi text default '',
  gambar_url text,
  posisi_gambar text default 'atas',
  sumber_media text,
  link text,
  ringkasan text,
  created_at timestamptz not null default now()
);

-- ---------- TOKEN TAHUN AJARAN (satu baris, id = 1) ----------
create table token_ta (
  id int primary key default 1,
  token text not null default '',
  tahun_ajaran text not null default '',
  constraint satu_baris_token check (id = 1)
);
insert into token_ta (id, token, tahun_ajaran) values (1, 'TA2026GENAP', '2026/2027 Ganjil');

-- ---------- EMAILJS CONFIG (satu baris, id = 1) ----------
create table emailjs_config (
  id int primary key default 1,
  public_key text default '',
  service_id text default '',
  template_id text default '',
  constraint satu_baris_emailjs check (id = 1)
);
insert into emailjs_config (id) values (1);

-- ---------- BIMBINGAN (Skripsi & PKL) ----------
create table bimbingan (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  email text default '',
  judul text not null,
  jenis text not null default 'skripsi' check (jenis in ('skripsi','pkl')),
  tahun_ajaran text default '',
  created_at timestamptz not null default now()
);

create table bimbingan_bab (
  id uuid primary key default gen_random_uuid(),
  bimbingan_id uuid not null references bimbingan(id) on delete cascade,
  nomor int not null check (nomor between 1 and 6),
  status text not null default 'locked' check (status in ('locked','terbuka','acc')),
  unique (bimbingan_id, nomor)
);

create table bimbingan_thread (
  id uuid primary key default gen_random_uuid(),
  bab_id uuid not null references bimbingan_bab(id) on delete cascade,
  pengirim text not null,
  teks text default '',
  file_url text,
  file_nama text,
  tag text check (tag in ('revisi','acc') or tag is null),
  created_at timestamptz not null default now()
);

-- Trigger: saat mahasiswa baru dibuat, otomatis buat 6 bab (Bab 1 terbuka, sisanya terkunci)
create or replace function buat_bab_default()
returns trigger as $$
begin
  insert into bimbingan_bab (bimbingan_id, nomor, status)
  select new.id, n, case when n = 1 then 'terbuka' else 'locked' end
  from generate_series(1,6) as n;
  return new;
end;
$$ language plpgsql;

create trigger trg_buat_bab_default
after insert on bimbingan
for each row execute function buat_bab_default();

-- Fungsi: saat sebuah bab di-ACC, buka bab berikutnya otomatis
create or replace function acc_bab(p_bab_id uuid)
returns void as $$
declare
  v_bimbingan_id uuid;
  v_nomor int;
begin
  update bimbingan_bab set status = 'acc' where id = p_bab_id
    returning bimbingan_id, nomor into v_bimbingan_id, v_nomor;
  update bimbingan_bab set status = 'terbuka'
    where bimbingan_id = v_bimbingan_id and nomor = v_nomor + 1 and status = 'locked';
end;
$$ language plpgsql security definer;

-- ---------- MATERI (per mata kuliah & pertemuan) ----------
create table materi (
  id uuid primary key default gen_random_uuid(),
  matkul text not null,
  pertemuan int not null check (pertemuan between 1 and 16),
  judul text not null,
  file_url text,
  file_nama text,
  token text not null,
  terkunci boolean not null default false,
  expired_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Fungsi aman untuk memeriksa token tahun ajaran TANPA membocorkan tokennya ke publik
create or replace function cek_token_ta(p_token text)
returns table (cocok boolean, tahun_ajaran text) as $$
begin
  return query
  select (upper(t.token) = upper(p_token)), t.tahun_ajaran
  from token_ta t where t.id = 1;
end;
$$ language plpgsql security definer;

-- Fungsi aman untuk membuka materi dengan token (mengembalikan link file hanya jika token & status cocok)
create or replace function buka_materi(p_materi_id uuid, p_token text)
returns table (file_url text, file_nama text) as $$
begin
  return query
  select m.file_url, m.file_nama from materi m
  where m.id = p_materi_id
    and m.terkunci = false
    and m.expired_at > now()
    and upper(m.token) = upper(p_token);
end;
$$ language plpgsql security definer;

-- ============================================================
-- ROW LEVEL SECURITY
-- Catatan: mahasiswa TIDAK login lewat Supabase Auth (memakai
-- token tahun ajaran di level aplikasi), sehingga tabel bimbingan
-- & thread dibuka untuk peran anon agar alur bimbingan berjalan.
-- Ini cocok untuk skala satu jurusan/dosen; untuk keamanan lebih
-- ketat di kemudian hari, pindahkan logika ini ke Supabase Edge
-- Functions agar token diverifikasi di server sebelum baca/tulis.
-- ============================================================
alter table profil enable row level security;
alter table pendidikan enable row level security;
alter table matkul enable row level security;
alter table publikasi enable row level security;
alter table berita enable row level security;
alter table token_ta enable row level security;
alter table emailjs_config enable row level security;
alter table bimbingan enable row level security;
alter table bimbingan_bab enable row level security;
alter table bimbingan_thread enable row level security;
alter table materi enable row level security;

-- Baca publik untuk konten profil/publikasi/berita/matkul/pendidikan
create policy "baca publik profil" on profil for select using (true);
create policy "baca publik pendidikan" on pendidikan for select using (true);
create policy "baca publik matkul" on matkul for select using (true);
create policy "baca publik publikasi" on publikasi for select using (true);
create policy "baca publik berita" on berita for select using (true);

-- Materi: metadata boleh dibaca publik (nama, pertemuan, tanggal) TAPI file_url
-- sebaiknya tidak diandalkan dari SELECT langsung untuk unduhan — gunakan RPC buka_materi().
create policy "baca publik materi" on materi for select using (true);

-- token_ta & emailjs_config TIDAK boleh dibaca langsung oleh anon (pakai RPC cek_token_ta)
-- (tidak ada policy select untuk anon -> default deny)

-- Tulis hanya untuk dosen yang sudah login (Supabase Auth)
create policy "tulis dosen profil" on profil for update using (auth.role() = 'authenticated');
create policy "tulis dosen pendidikan" on pendidikan for all using (auth.role() = 'authenticated');
create policy "tulis dosen matkul" on matkul for all using (auth.role() = 'authenticated');
create policy "tulis dosen publikasi" on publikasi for all using (auth.role() = 'authenticated');
create policy "tulis dosen berita" on berita for all using (auth.role() = 'authenticated');
create policy "tulis dosen materi" on materi for all using (auth.role() = 'authenticated');
create policy "tulis dosen token_ta" on token_ta for all using (auth.role() = 'authenticated');
create policy "baca dosen token_ta" on token_ta for select using (auth.role() = 'authenticated');
create policy "tulis dosen emailjs" on emailjs_config for all using (auth.role() = 'authenticated');
create policy "baca dosen emailjs" on emailjs_config for select using (auth.role() = 'authenticated');

-- Bimbingan: dosen bebas; mahasiswa (anon) boleh baca & tulis (lihat catatan keamanan di atas)
create policy "dosen penuh bimbingan" on bimbingan for all using (auth.role() = 'authenticated');
create policy "mahasiswa baca bimbingan" on bimbingan for select using (true);
create policy "mahasiswa daftar bimbingan" on bimbingan for insert with check (true);

create policy "dosen penuh bab" on bimbingan_bab for all using (auth.role() = 'authenticated');
create policy "siapapun baca bab" on bimbingan_bab for select using (true);

create policy "dosen penuh thread" on bimbingan_thread for all using (auth.role() = 'authenticated');
create policy "siapapun baca thread" on bimbingan_thread for select using (true);
create policy "siapapun kirim thread" on bimbingan_thread for insert with check (true);

-- ============================================================
-- STORAGE: buat bucket 'uploads' lewat dashboard Supabase Storage,
-- set Public bucket = true (agar file_url bisa langsung diakses).
-- Lalu tambahkan policy storage (lewat dashboard atau SQL berikut):
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('uploads','uploads', true);
-- create policy "baca publik uploads" on storage.objects for select using (bucket_id = 'uploads');
-- create policy "unggah oleh siapapun" on storage.objects for insert with check (bucket_id = 'uploads');
