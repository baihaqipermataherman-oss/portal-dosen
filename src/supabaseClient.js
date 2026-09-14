import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diatur. Salin .env.example menjadi .env dan isi dengan kredensial proyek Supabase Anda.'
  );
}

export const supabase = createClient(url, anonKey);

// Nama bucket Supabase Storage untuk semua berkas yang diunggah
export const BUCKET = 'uploads';

export async function unggahBerkas(file, folder) {
  const path = `${folder}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, nama: file.name };
}
