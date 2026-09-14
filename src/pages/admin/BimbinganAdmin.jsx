import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import KartuBimbingan from '../../components/KartuBimbingan';

function genToken() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function BimbinganAdmin() {
  const [tokenTA, setTokenTA] = useState({ token: '', tahun_ajaran: '' });
  const [statusTA, setStatusTA] = useState('');
  const [jenisAktif, setJenisAktif] = useState('skripsi');
  const [daftar, setDaftar] = useState([]);
  const [form, setForm] = useState({ nama: '', email: '', judul: '', tahun_ajaran: '' });
  const [tahunTerbuka, setTahunTerbuka] = useState(new Set());
  const [mhsTerbuka, setMhsTerbuka] = useState(new Set());

  useEffect(() => { muatToken(); muatDaftar(); }, []);

  const muatToken = async () => {
    const { data } = await supabase.from('token_ta').select('*').eq('id', 1).single();
    if (data) { setTokenTA(data); setForm((f) => ({ ...f, tahun_ajaran: f.tahun_ajaran || data.tahun_ajaran })); }
  };
  const simpanToken = async () => {
    const { error } = await supabase.from('token_ta').update(tokenTA).eq('id', 1);
    setStatusTA(error ? 'Gagal menyimpan.' : 'Tersimpan.');
    setTimeout(() => setStatusTA(''), 2500);
  };

  const muatDaftar = async () => {
    const { data } = await supabase.from('bimbingan').select('*, bimbingan_bab(status)').order('tahun_ajaran', { ascending: false });
    setDaftar(data || []);
  };

  const tambahMahasiswa = async () => {
    if (!form.nama.trim() || !form.judul.trim()) { alert('Isi nama dan judul terlebih dahulu.'); return; }
    const { error } = await supabase.from('bimbingan').insert({
      nama: form.nama.trim(), email: form.email.trim(), judul: form.judul.trim(),
      jenis: jenisAktif, tahun_ajaran: form.tahun_ajaran.trim() || tokenTA.tahun_ajaran,
    });
    if (error) { alert('Gagal menyimpan: ' + error.message); return; }
    setForm({ ...form, nama: '', email: '', judul: '' });
    muatDaftar();
  };

  const hapusMhs = async (id) => {
    if (!confirm('Hapus data bimbingan mahasiswa ini?')) return;
    await supabase.from('bimbingan').delete().eq('id', id);
    muatDaftar();
  };

  const toggleTahun = (t) => {
    const s = new Set(tahunTerbuka); s.has(t) ? s.delete(t) : s.add(t); setTahunTerbuka(new Set(s));
  };
  const toggleMhs = (id) => {
    const s = new Set(mhsTerbuka); s.has(id) ? s.delete(id) : s.add(id); setMhsTerbuka(new Set(s));
  };

  const terfilter = daftar.filter((m) => (m.jenis || 'skripsi') === jenisAktif);
  const grup = {};
  terfilter.forEach((m) => { const k = m.tahun_ajaran || 'Belum ditentukan'; (grup[k] = grup[k] || []).push(m); });
  const tahunUrut = Object.keys(grup).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      <div className="card">
        <h3>Token tahun ajaran</h3>
        <p className="muted" style={{ marginBottom: 14 }}>Satu token yang sama dibagikan ke seluruh mahasiswa bimbingan pada tahun ajaran ini.</p>
        <div className="token-aktif">
          <div><div className="label">Label tahun ajaran</div><div className="value" style={{ fontSize: '1rem' }}>{tokenTA.tahun_ajaran || '—'}</div></div>
          <div><div className="label">Token aktif</div><div className="value">{tokenTA.token || '—'}</div></div>
        </div>
        <div className="row2" style={{ marginTop: 18 }}>
          <div className="field"><label>Label tahun ajaran</label><input value={tokenTA.tahun_ajaran} onChange={(e) => setTokenTA({ ...tokenTA, tahun_ajaran: e.target.value })} /></div>
          <div className="field"><label>Token</label><input value={tokenTA.token} onChange={(e) => setTokenTA({ ...tokenTA, token: e.target.value.toUpperCase() })} /></div>
        </div>
        <button className="btn-ghost" onClick={() => setTokenTA({ ...tokenTA, token: genToken() })}>Buat token acak</button>{' '}
        <button className="btn" onClick={simpanToken}>Simpan perubahan</button>
        <span className="muted" style={{ marginLeft: 10 }}>{statusTA}</span>
      </div>

      <div className="subtabs" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className="btn-ghost" style={jenisAktif === 'skripsi' ? { borderColor: 'var(--maroon)', color: 'var(--maroon)' } : {}} onClick={() => setJenisAktif('skripsi')}>Skripsi</button>
        <button className="btn-ghost" style={jenisAktif === 'pkl' ? { borderColor: 'var(--maroon)', color: 'var(--maroon)' } : {}} onClick={() => setJenisAktif('pkl')}>PKL</button>
      </div>

      <div className="card">
        <h3>Tambah mahasiswa bimbingan</h3>
        <div className="row2">
          <div className="field"><label>Nama mahasiswa</label><input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></div>
          <div className="field"><label>Email mahasiswa</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        </div>
        <div className="field"><label>Judul</label><input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} placeholder="Judul skripsi / laporan PKL" /></div>
        <div className="field"><label>Tahun ajaran</label><input value={form.tahun_ajaran} onChange={(e) => setForm({ ...form, tahun_ajaran: e.target.value })} /></div>
        <button className="btn" onClick={tambahMahasiswa}>Tambah</button>
      </div>

      {terfilter.length === 0 && <p className="muted">Belum ada mahasiswa bimbingan {jenisAktif === 'pkl' ? 'PKL' : 'Skripsi'}.</p>}
      {tahunUrut.map((tahun) => (
        <div key={tahun}>
          <div className="year-header" onClick={() => toggleTahun(tahun)}>
            <div><h3>Tahun Ajaran {tahun}</h3><p className="muted" style={{ margin: '2px 0 0' }}>{grup[tahun].length} mahasiswa</p></div>
            <span>{tahunTerbuka.has(tahun) ? '▲' : '▾'}</span>
          </div>
          {tahunTerbuka.has(tahun) && (
            <div className="year-body">
              {grup[tahun].map((m) => {
                const babSelesai = (m.bimbingan_bab || []).filter((b) => b.status === 'acc').length;
                return (
                  <div key={m.id}>
                    <div className="list-row" style={{ cursor: 'pointer' }} onClick={() => toggleMhs(m.id)}>
                      <div><strong>{m.nama}</strong><div className="muted">{m.judul} — {babSelesai}/6 bab selesai</div></div>
                      <span className="muted">{mhsTerbuka.has(m.id) ? 'Sembunyikan ▲' : 'Lihat riwayat ▾'}</span>
                    </div>
                    {mhsTerbuka.has(m.id) && (
                      <div className="card" style={{ marginBottom: 10 }}>
                        <KartuBimbingan mhs={m} pengirim="Dosen" isAdmin onHapus={() => hapusMhs(m.id)} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
