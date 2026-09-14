import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function PublikasiAdmin() {
  const [daftar, setDaftar] = useState([]);
  const [form, setForm] = useState({ judul: '', venue: '', tahun: '', link: '' });

  useEffect(() => { muat(); }, []);
  const muat = async () => {
    const { data } = await supabase.from('publikasi').select('*').order('created_at', { ascending: false });
    setDaftar(data || []);
  };

  const tambah = async () => {
    if (!form.judul || !form.venue || !form.tahun) { alert('Isi judul, jurnal/konferensi, dan tahun.'); return; }
    await supabase.from('publikasi').insert(form);
    setForm({ judul: '', venue: '', tahun: '', link: '' });
    muat();
  };
  const hapus = async (id) => {
    if (!confirm('Hapus publikasi ini?')) return;
    await supabase.from('publikasi').delete().eq('id', id);
    muat();
  };

  return (
    <div>
      <div className="card">
        <h3>Tambah artikel ilmiah</h3>
        <div className="row3">
          <div className="field"><label>Judul artikel</label><input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} /></div>
          <div className="field"><label>Jurnal / Konferensi</label><input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
          <div className="field"><label>Tahun</label><input value={form.tahun} onChange={(e) => setForm({ ...form, tahun: e.target.value })} /></div>
        </div>
        <div className="field"><label>Tautan</label><input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." /></div>
        <button className="btn" onClick={tambah}>Tambah publikasi</button>
      </div>
      {daftar.map((p) => (
        <div className="list-row" key={p.id}>
          <div><strong>{p.judul}</strong><div className="muted">{p.venue}, {p.tahun}{p.link && <> — <a href={p.link} target="_blank" rel="noopener noreferrer">tautan</a></>}</div></div>
          <button className="btn-danger" onClick={() => hapus(p.id)}>Hapus</button>
        </div>
      ))}
    </div>
  );
}
