-- Jalankan ini di Supabase SQL Editor (proyek yang SUDAH online),
-- karena schema.sql utama sudah pernah dijalankan sebelumnya.

alter table profil add column if not exists foto_url text;
