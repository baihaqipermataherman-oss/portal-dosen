import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function EditProfil() {
  const [profil, setProfil] = useState(null);
  const [chipsTeks, setChipsTeks] = useState('');
  const [pendidikan, setPendidikan] = useState([]);
  const [matkul, setMatkul] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => { muat(); }, []);
  const muat = async () => {
    const { data: p } = await supabase.from('profil').select('*').eq('id', 1).single();
    setProfil(p); setChipsTeks((p?.chips || []).join(', '));
    const { data: pend } = await supabase.from('pendidikan').select('*').order('urutan');
    setPendidikan(pend || []);
    const { data: mk } = await supabase.from('matkul').select('*');
    setMatkul(mk || []);
  };

  const simpanProfil = async () => {
    const chips = chipsTeks.split(',').map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase.from('profil').update({ ...profil, chips }).eq('id', 1);
    setStatus(error ? 'Gagal menyimpan.' : 'Tersimpan.');
    setTimeout(() => setStatus(''), 2500);
  };

  const tambahPendidikan = async () => {
    const { data } = await supabase.from('pendidikan').insert({ tahun: '', gelar: '', tempat: '', urutan: pendidikan.length }).select().single();
    setPendidikan([...pendidikan, data]);
  };
  const ubahPendidikan = (id, field, value) => setPendidikan(pendidikan.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  const simpanPendidikan = async (p) => { await supabase.from('pendidikan').update(p).eq('id', p.id); };
  const hapusPendidikan = async (id) => { await supabase.from('pendidikan').delete().eq('id', id); setPendidikan(pendidikan.filter((p) => p.id !== id)); };

  const tambahMatkul = async () => {
    const { data } = await supabase.from('matkul').insert({ kode: '', nama: '', info: '' }).select().single();
    setMatkul([...matkul, data]);
  };
  const ubahMatkul = (id, field, value) => setMatkul(matkul.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  const simpanMatkul = async (m) => { await supabase.from('matkul').update(m).eq('id', m.id); };
  const hapusMatkul = async (id) => { await supabase.from('matkul').delete().eq('id', id); setMatkul(matkul.filter((m) => m.id !== id)); };

  if (!profil) return <p className="muted">Memuat…</p>;

  return (
    <div>
      <div className="row2">
        <div className="field"><label>Nama</label><input value={profil.nama} onChange={(e) => setProfil({ ...profil, nama: e.target.value })} /></div>
        <div className="field"><label>Jabatan</label><input value={profil.jabatan} onChange={(e) => setProfil({ ...profil, jabatan: e.target.value })} /></div>
      </div>
      <div className="row2">
        <div className="field"><label>Institusi</label><input value={profil.institusi} onChange={(e) => setProfil({ ...profil, institusi: e.target.value })} /></div>
        <div className="field"><label>Email kontak</label><input value={profil.email} onChange={(e) => setProfil({ ...profil, email: e.target.value })} /></div>
      </div>
      <div className="field"><label>Bio singkat</label><textarea rows={3} value={profil.bio} onChange={(e) => setProfil({ ...profil, bio: e.target.value })} /></div>
      <div className="field"><label>Bidang keahlian (pisahkan dengan koma)</label><input value={chipsTeks} onChange={(e) => setChipsTeks(e.target.value)} /></div>

      <h3 style={{ margin: '20px 0 10px', fontSize: '1rem' }}>Pendidikan</h3>
      {pendidikan.map((p) => (
        <div key={p.id} style={{ marginBottom: 10 }}>
          <div className="row2">
            <div className="field"><input placeholder="Tahun" value={p.tahun} onChange={(e) => ubahPendidikan(p.id, 'tahun', e.target.value)} onBlur={() => simpanPendidikan(p)} /></div>
            <div className="field"><input placeholder="Gelar/Jenjang" value={p.gelar} onChange={(e) => ubahPendidikan(p.id, 'gelar', e.target.value)} onBlur={() => simpanPendidikan(p)} /></div>
          </div>
          <div className="row2">
            <div className="field"><input placeholder="Institusi" value={p.tempat} onChange={(e) => ubahPendidikan(p.id, 'tempat', e.target.value)} onBlur={() => simpanPendidikan(p)} /></div>
            <div><button className="btn-danger" onClick={() => hapusPendidikan(p.id)}>Hapus</button></div>
          </div>
        </div>
      ))}
      <button className="btn-ghost" onClick={tambahPendidikan}>+ Tambah jenjang</button>

      <h3 style={{ margin: '24px 0 10px', fontSize: '1rem' }}>Mata kuliah diampu</h3>
      {matkul.map((m) => (
        <div className="row2" key={m.id} style={{ marginBottom: 10 }}>
          <div className="field"><input placeholder="Kode" value={m.kode} onChange={(e) => ubahMatkul(m.id, 'kode', e.target.value)} onBlur={() => simpanMatkul(m)} /></div>
          <div className="field"><input placeholder="Nama mata kuliah" value={m.nama} onChange={(e) => ubahMatkul(m.id, 'nama', e.target.value)} onBlur={() => simpanMatkul(m)} /></div>
          <div className="field"><input placeholder="Info (mis. S1 · Ganjil)" value={m.info} onChange={(e) => ubahMatkul(m.id, 'info', e.target.value)} onBlur={() => simpanMatkul(m)} /></div>
          <div><button className="btn-danger" onClick={() => hapusMatkul(m.id)}>Hapus</button></div>
        </div>
      ))}
      <button className="btn-ghost" onClick={tambahMatkul}>+ Tambah mata kuliah</button>

      <div style={{ marginTop: 26 }}>
        <button className="btn" onClick={simpanProfil}>Simpan perubahan</button>
        <span className="muted" style={{ marginLeft: 10 }}>{status}</span>
      </div>
    </div>
  );
}
