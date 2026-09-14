import { useEffect, useState } from 'react';
import { supabase, unggahBerkas } from '../../supabaseClient';

function genToken() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
const fmtTgl = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtWaktu = (iso) => new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
const kedaluwarsa = (x) => new Date(x.expired_at).getTime() < Date.now();

export default function MateriAdmin() {
  const [matkulList, setMatkulList] = useState([]);
  const [materi, setMateri] = useState([]);
  const [form, setForm] = useState({ pertemuan: 1, matkul: '', judul: '', durasi: 24, satuan: 'hari' });
  const [file, setFile] = useState(null);
  const [notice, setNotice] = useState('');
  const [matkulTerbuka, setMatkulTerbuka] = useState(new Set());
  const [matkulBaru, setMatkulBaru] = useState('');

  useEffect(() => { muat(); }, []);
  const muat = async () => {
    const { data: mk } = await supabase.from('matkul').select('*');
    setMatkulList(mk || []);
    if (mk && mk.length && !form.matkul) setForm((f) => ({ ...f, matkul: mk[0].nama }));
    const { data: m } = await supabase.from('materi').select('*').order('pertemuan');
    setMateri(m || []);
  };

  const unggah = async () => {
    setNotice('');
    if (!form.matkul || !form.judul.trim() || !file || !form.durasi) { setNotice('Lengkapi mata kuliah, judul, berkas, dan lama aktif token.'); return; }
    try {
      const hasil = await unggahBerkas(file, 'materi');
      const durasiMs = form.durasi * (form.satuan === 'hari' ? 86400000 : 3600000);
      const { error } = await supabase.from('materi').insert({
        pertemuan: form.pertemuan, matkul: form.matkul, judul: form.judul.trim(),
        file_url: hasil.url, file_nama: hasil.nama, token: genToken(),
        terkunci: false, expired_at: new Date(Date.now() + durasiMs).toISOString(),
      });
      if (error) throw error;
      setForm({ ...form, judul: '' }); setFile(null);
      setNotice('Materi berhasil diunggah.');
      muat();
    } catch (e) { setNotice(e.message); }
  };

  const tambahMatkulBaru = async () => {
    if (!matkulBaru.trim()) return;
    const { data, error } = await supabase.from('matkul').insert({ kode: '', nama: matkulBaru.trim(), info: '' }).select().single();
    if (error) { alert('Gagal menambah mata kuliah: ' + error.message); return; }
    setMatkulList([...matkulList, data]);
    setForm((f) => ({ ...f, matkul: data.nama }));
    setMatkulBaru('');
  };

  const hapus = async (id) => { if (!confirm('Hapus materi ini?')) return; await supabase.from('materi').delete().eq('id', id); muat(); };
  const toggleKunci = async (item) => { await supabase.from('materi').update({ terkunci: !item.terkunci }).eq('id', item.id); muat(); };
  const toggleMatkul = (mk) => { const s = new Set(matkulTerbuka); s.has(mk) ? s.delete(mk) : s.add(mk); setMatkulTerbuka(new Set(s)); };

  const grup = {};
  materi.forEach((x) => { (grup[x.matkul] = grup[x.matkul] || []).push(x); });
  const matkulUrut = Object.keys(grup).sort();

  return (
    <div>
      <div className="card">
        <h3>Unggah materi baru</h3>
        <div className="row3">
          <div className="field"><label>Pertemuan</label>
            <select value={form.pertemuan} onChange={(e) => setForm({ ...form, pertemuan: +e.target.value })}>
              {Array.from({ length: 16 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>Pertemuan {n}</option>)}
            </select>
          </div>
          <div className="field"><label>Mata kuliah</label>
            <select value={form.matkul} onChange={(e) => setForm({ ...form, matkul: e.target.value })}>
              {matkulList.length === 0 && <option value="">Belum ada mata kuliah</option>}
              {matkulList.map((m) => <option key={m.id} value={m.nama}>{m.nama}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <input placeholder="Tambah mata kuliah baru…" value={matkulBaru} onChange={(e) => setMatkulBaru(e.target.value)} style={{ flex: 1 }} />
              <button type="button" className="btn-ghost btn-small" onClick={tambahMatkulBaru}>+ Tambah</button>
            </div>
          </div>
          <div className="field"><label>Judul materi</label><input value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} /></div>
        </div>
        <div className="row3">
          <div className="field"><label>Berkas</label><input type="file" onChange={(e) => setFile(e.target.files[0])} /></div>
          <div className="field"><label>Lama aktif token</label><input type="number" min="1" value={form.durasi} onChange={(e) => setForm({ ...form, durasi: +e.target.value })} /></div>
          <div className="field"><label>Satuan</label>
            <select value={form.satuan} onChange={(e) => setForm({ ...form, satuan: e.target.value })}>
              <option value="jam">Jam</option>
              <option value="hari">Hari</option>
            </select>
          </div>
        </div>
        {notice && <div className={`notice ${notice.includes('berhasil') ? 'ok' : 'err'}`}>{notice}</div>}
        <button className="btn" onClick={unggah}>Unggah &amp; buat kode token</button>
      </div>

      {matkulUrut.length === 0 && <p className="muted">Belum ada materi diunggah.</p>}
      {matkulUrut.map((mk) => (
        <div key={mk}>
          <div className="year-header" onClick={() => toggleMatkul(mk)}>
            <div><h3>{mk}</h3><p className="muted" style={{ margin: '2px 0 0' }}>{grup[mk].length} materi</p></div>
            <span>{matkulTerbuka.has(mk) ? '▲' : '▾'}</span>
          </div>
          {matkulTerbuka.has(mk) && (
            <div className="year-body">
              {[...new Set(grup[mk].map((x) => x.pertemuan))].sort((a, b) => a - b).map((p) => (
                <div key={p}>
                  <h4 style={{ fontFamily: "'Fraunces',serif", fontWeight: 500, fontSize: '.95rem', margin: '14px 0 6px', color: 'var(--brass)' }}>Pertemuan {p}</h4>
                  {grup[mk].filter((x) => x.pertemuan === p).map((x) => (
                    <div className="list-row" key={x.id}>
                      <div>
                        <strong>{x.judul}</strong>
                        <div className="muted">{x.file_nama} — diunggah {fmtTgl(x.created_at)}</div>
                        <div className="muted">{kedaluwarsa(x) ? <span style={{ color: 'var(--err)' }}>Token kedaluwarsa</span> : `Token aktif hingga ${fmtWaktu(x.expired_at)}`}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span className="token">{x.token}</span>
                        <span className="badge" style={{ borderColor: x.terkunci ? 'var(--err)' : 'var(--ok)', color: x.terkunci ? 'var(--err)' : 'var(--ok)' }}>{x.terkunci ? 'Terkunci' : 'Terbuka'}</span>
                        <button className="btn-ghost btn-small" onClick={() => toggleKunci(x)}>{x.terkunci ? 'Buka kunci' : 'Kunci materi'}</button>
                        <button className="btn-danger" onClick={() => hapus(x.id)}>Hapus</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
