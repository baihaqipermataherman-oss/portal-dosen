import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

const fmtTgl = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

function KartuMateri({ item }) {
  const [kode, setKode] = useState('');
  const [hasil, setHasil] = useState(null);

  const buka = async () => {
    setHasil(null);
    if (item.terkunci) { setHasil({ tipe: 'err', pesan: 'Materi ini sedang dikunci oleh dosen.' }); return; }
    const { data } = await supabase.rpc('buka_materi', { p_materi_id: item.id, p_token: kode.trim() });
    const baris = data && data[0];
    if (!baris || !baris.file_url) { setHasil({ tipe: 'err', pesan: 'Token tidak sesuai atau sudah kedaluwarsa.' }); return; }
    setHasil({ tipe: 'ok', url: baris.file_url, nama: baris.file_nama });
  };

  return (
    <div className="card">
      <h3>{item.judul}</h3>
      <p className="muted">diunggah {fmtTgl(item.created_at)}</p>
      {item.terkunci ? (
        <div className="notice err">Materi ini sedang dikunci oleh dosen dan belum bisa diunduh.</div>
      ) : (
        <>
          <div className="row2" style={{ alignItems: 'end' }}>
            <div className="field"><label>Masukkan kode token dari dosen</label><input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="mis. 7F3K9A" /></div>
            <div><button className="btn btn-small" onClick={buka} style={{ marginBottom: 14 }}>Buka</button></div>
          </div>
          {hasil && hasil.tipe === 'err' && <div className="notice err">{hasil.pesan}</div>}
          {hasil && hasil.tipe === 'ok' && (
            <>
              <div className="notice ok">
                Token benar. {hasil.nama === hasil.url ? 'Materi ini berupa tautan eksternal.' : <>Berkas: <strong>{hasil.nama}</strong></>}
              </div>
              <a href={hasil.url} target="_blank" rel="noopener noreferrer">
                <button className="btn btn-small">{hasil.nama === hasil.url ? 'Buka tautan' : 'Unduh berkas'}</button>
              </a>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function Materi() {
  const [semua, setSemua] = useState([]);
  const [matkulAktif, setMatkulAktif] = useState(null);

  useEffect(() => {
    supabase.from('materi').select('*').order('pertemuan').then(({ data }) => setSemua(data || []));
  }, []);

  if (matkulAktif === null) {
    const daftarMatkul = [...new Set(semua.map((x) => x.matkul))];
    if (daftarMatkul.length === 0) return <p className="muted">Belum ada materi yang diunggah dosen.</p>;
    return (
      <div>
        {daftarMatkul.map((mk) => (
          <div className="list-row" key={mk} style={{ cursor: 'pointer' }} onClick={() => setMatkulAktif(mk)}>
            <div><strong>{mk}</strong><div className="muted">{semua.filter((x) => x.matkul === mk).length} materi</div></div>
            <span className="muted">Lihat →</span>
          </div>
        ))}
      </div>
    );
  }

  const daftarMateri = semua.filter((x) => x.matkul === matkulAktif);
  const pertemuanTerpakai = [...new Set(daftarMateri.map((x) => x.pertemuan))].sort((a, b) => a - b);

  return (
    <div>
      <button className="btn-ghost btn-small" style={{ marginBottom: 18 }} onClick={() => setMatkulAktif(null)}>← Kembali ke daftar mata kuliah</button>
      <h3 style={{ marginBottom: 12 }}>{matkulAktif}</h3>
      {pertemuanTerpakai.map((p) => (
        <div key={p}>
          <h4 style={{ fontFamily: "'Fraunces',serif", fontWeight: 500, fontSize: '.98rem', margin: '18px 0 8px', color: 'var(--brass)' }}>Pertemuan {p}</h4>
          {daftarMateri.filter((x) => x.pertemuan === p).map((item) => <KartuMateri item={item} key={item.id} />)}
        </div>
      ))}
    </div>
  );
}
