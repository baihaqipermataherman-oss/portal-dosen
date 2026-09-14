import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import KartuBimbingan from '../../components/KartuBimbingan';

export default function Bimbingan() {
  const [nama, setNama] = useState('');
  const [jenis, setJenis] = useState('skripsi');
  const [token, setToken] = useState('');
  const [notice, setNotice] = useState(null);
  const [tahunAjaran, setTahunAjaran] = useState('');
  const [mhs, setMhs] = useState(null);
  const [belumTerdaftar, setBelumTerdaftar] = useState(false);
  const [judulBaru, setJudulBaru] = useState('');
  const [emailBaru, setEmailBaru] = useState('');

  const cari = async () => {
    setNotice(null); setMhs(null); setBelumTerdaftar(false);
    if (!nama.trim() || !token.trim()) { setNotice({ tipe: 'err', pesan: 'Isi nama dan token tahun ajaran terlebih dahulu.' }); return; }

    const { data: cek } = await supabase.rpc('cek_token_ta', { p_token: token.trim() });
    const hasil = cek && cek[0];
    if (!hasil || !hasil.cocok) { setNotice({ tipe: 'err', pesan: 'Token tahun ajaran tidak sesuai. Tanyakan ke dosen pembimbing.' }); return; }
    setTahunAjaran(hasil.tahun_ajaran);

    const { data: found } = await supabase.from('bimbingan').select('*').ilike('nama', nama.trim()).eq('jenis', jenis).maybeSingle();
    if (!found) { setBelumTerdaftar(true); return; }
    setMhs(found);
  };

  const daftarkanDiri = async () => {
    if (!judulBaru.trim()) { alert('Isi judul terlebih dahulu.'); return; }
    const { data, error } = await supabase.from('bimbingan')
      .insert({ nama: nama.trim(), email: emailBaru.trim(), judul: judulBaru.trim(), jenis, tahun_ajaran: tahunAjaran })
      .select().single();
    if (error) { alert('Gagal menyimpan: ' + error.message); return; }
    setMhs(data); setBelumTerdaftar(false);
  };

  return (
    <div>
      <div className="card">
        <div className="row3">
          <div className="field"><label>Nama Anda</label><input value={nama} onChange={(e) => setNama(e.target.value)} /></div>
          <div className="field"><label>Jenis</label>
            <select value={jenis} onChange={(e) => setJenis(e.target.value)}>
              <option value="skripsi">Skripsi</option>
              <option value="pkl">PKL</option>
            </select>
          </div>
          <div className="field"><label>Token tahun ajaran</label><input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Dari dosen pembimbing" /></div>
        </div>
        <button className="btn-ghost" onClick={cari}>Cari data bimbingan saya</button>
        {notice && <div className={`notice ${notice.tipe}`} style={{ marginTop: 12 }}>{notice.pesan}</div>}
      </div>

      {belumTerdaftar && (
        <>
          <div className="notice err">Nama belum terdaftar sebagai bimbingan {jenis === 'pkl' ? 'PKL' : 'Skripsi'}. Hubungi dosen pembimbing, atau daftarkan judul Anda di bawah ini.</div>
          <div className="card">
            <div className="field"><label>Judul {jenis === 'pkl' ? 'laporan PKL' : 'skripsi'}</label><input value={judulBaru} onChange={(e) => setJudulBaru(e.target.value)} /></div>
            <div className="field"><label>Email Anda (untuk notifikasi)</label><input type="email" value={emailBaru} onChange={(e) => setEmailBaru(e.target.value)} /></div>
            <button className="btn" onClick={daftarkanDiri}>Daftarkan diri</button>
          </div>
        </>
      )}

      {mhs && (
        <div className="card">
          <KartuBimbingan mhs={mhs} pengirim={mhs.nama} isAdmin={false} />
        </div>
      )}
    </div>
  );
}
