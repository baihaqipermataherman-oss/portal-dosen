import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import KartuBimbingan from '../../components/KartuBimbingan';

function genToken() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function Bimbingan() {
  const [nama, setNama] = useState('');
  const [jenis, setJenis] = useState('skripsi');
  const [tokenPribadi, setTokenPribadi] = useState('');
  const [notice, setNotice] = useState(null);
  const [mhs, setMhs] = useState(null);

  const [modeDaftar, setModeDaftar] = useState(false);
  const [judulBaru, setJudulBaru] = useState('');
  const [emailBaru, setEmailBaru] = useState('');
  const [tokenTahunAjaran, setTokenTahunAjaran] = useState('');
  const [tokenBaru, setTokenBaru] = useState('');

  const cari = async () => {
    setNotice(null); setMhs(null); setModeDaftar(false); setTokenBaru('');
    if (!nama.trim() || !tokenPribadi.trim()) { setNotice({ tipe: 'err', pesan: 'Isi nama dan token pribadi Anda.' }); return; }
    const { data: found } = await supabase.from('bimbingan').select('*')
      .ilike('nama', nama.trim()).eq('jenis', jenis).eq('token', tokenPribadi.trim().toUpperCase()).maybeSingle();
    if (!found) {
      setNotice({ tipe: 'err', pesan: 'Data tidak ditemukan — nama, jenis, atau token pribadi tidak cocok. Kalau Anda belum pernah didaftarkan, isi form pendaftaran di bawah.' });
      setModeDaftar(true);
      return;
    }
    setMhs(found);
  };

  const daftarkanDiri = async () => {
    if (!judulBaru.trim() || !tokenTahunAjaran.trim()) { alert('Isi judul dan token tahun ajaran dari dosen.'); return; }
    const { data: cek } = await supabase.rpc('cek_token_ta', { p_token: tokenTahunAjaran.trim() });
    const hasil = cek && cek[0];
    if (!hasil || !hasil.cocok) { alert('Token tahun ajaran tidak sesuai. Tanyakan ke dosen pembimbing.'); return; }

    const tokenSaya = genToken();
    const { data, error } = await supabase.from('bimbingan')
      .insert({ nama: nama.trim(), email: emailBaru.trim(), judul: judulBaru.trim(), jenis, tahun_ajaran: hasil.tahun_ajaran, token: tokenSaya })
      .select().single();
    if (error) { alert('Gagal mendaftar: ' + error.message); return; }
    setTokenBaru(tokenSaya);
    setMhs(data);
    setModeDaftar(false);
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
          <div className="field"><label>Token pribadi Anda</label><input value={tokenPribadi} onChange={(e) => setTokenPribadi(e.target.value)} placeholder="Diberikan dosen saat pertama daftar" /></div>
        </div>
        <button className="btn-ghost" onClick={cari}>Cari data bimbingan saya</button>
        {notice && <div className={`notice ${notice.tipe}`} style={{ marginTop: 12 }}>{notice.pesan}</div>}
      </div>

      {modeDaftar && !mhs && (
        <div className="card">
          <h3>Belum pernah didaftarkan? Daftar di sini</h3>
          <p className="muted" style={{ marginBottom: 14 }}>
            Minta <strong>token tahun ajaran</strong> ke dosen pembimbing untuk mendaftar pertama kali.
            Setelah mendaftar, Anda akan mendapat <strong>token pribadi</strong> sendiri (beda dari token tahun ajaran)
            untuk membuka bimbingan ini di kunjungan berikutnya.
          </p>
          <div className="field"><label>Judul {jenis === 'pkl' ? 'laporan PKL' : 'skripsi'}</label><input value={judulBaru} onChange={(e) => setJudulBaru(e.target.value)} /></div>
          <div className="field"><label>Email Anda</label><input type="email" value={emailBaru} onChange={(e) => setEmailBaru(e.target.value)} /></div>
          <div className="field"><label>Token tahun ajaran (dari dosen)</label><input value={tokenTahunAjaran} onChange={(e) => setTokenTahunAjaran(e.target.value)} /></div>
          <button className="btn" onClick={daftarkanDiri}>Daftarkan diri</button>
        </div>
      )}

      {tokenBaru && (
        <div className="notice ok">
          Pendaftaran berhasil! <strong>Catat token pribadi Anda: {tokenBaru}</strong> — dibutuhkan untuk membuka
          bimbingan ini nanti. Dosen Anda juga bisa melihat token ini kapan saja di panel admin, jadi tidak akan hilang.
        </div>
      )}

      {mhs && (
        <div className="card">
          <KartuBimbingan mhs={mhs} pengirim={mhs.nama} isAdmin={false} />
        </div>
      )}
    </div>
  );
}
