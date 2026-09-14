import { useEffect, useState } from 'react';
import { supabase, unggahBerkas } from '../supabaseClient';

const fmtWaktu = (iso) =>
  new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';

export default function BabThread({ bab, pengirim, isAdmin, onAccUpdated }) {
  const [thread, setThread] = useState([]);
  const [teks, setTeks] = useState('');
  const [file, setFile] = useState(null);
  const [tag, setTag] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => { muatThread(); }, [bab.id]);

  const muatThread = async () => {
    const { data } = await supabase.from('bimbingan_thread').select('*').eq('bab_id', bab.id).order('created_at');
    setThread(data || []);
  };

  const kirim = async () => {
    if (!teks.trim() && !file) return;
    setBusy(true); setNotice(null);
    try {
      let file_url = null, file_nama = null;
      if (file) {
        const hasil = await unggahBerkas(file, 'bimbingan');
        file_url = hasil.url; file_nama = hasil.nama;
      }
      const { error } = await supabase.from('bimbingan_thread').insert({
        bab_id: bab.id, pengirim, teks: teks.trim(), file_url, file_nama, tag: tag || null,
      });
      if (error) throw error;
      setTeks(''); setFile(null); setTag('');
      await muatThread();
    } catch (e) {
      setNotice({ tipe: 'err', pesan: e.message });
    }
    setBusy(false);
  };

  const accBab = async () => {
    await supabase.rpc('acc_bab', { p_bab_id: bab.id });
    onAccUpdated && onAccUpdated();
  };

  if (bab.status === 'locked') {
    return <div className="notice err">Bab ini masih terkunci. Selesaikan dan tunggu ACC pada bab sebelumnya.</div>;
  }

  return (
    <div className={`bab-panel ${bab.status === 'acc' ? 'acc' : ''}`}>
      <div style={{ marginBottom: 10 }}>
        <span className="badge" style={{ borderColor: bab.status === 'acc' ? 'var(--ok)' : 'var(--brass)', color: bab.status === 'acc' ? 'var(--ok)' : 'var(--brass)' }}>
          {bab.status === 'acc' ? 'Sudah ACC' : 'Berlangsung'}
        </span>
      </div>

      <div className="thread">
        {thread.length === 0 && <p className="muted">Belum ada aktivitas di bab ini.</p>}
        {thread.map((b) => (
          <div className={`bubble ${b.pengirim === 'Dosen' ? 'dosen' : 'mahasiswa'}`} key={b.id}>
            <div className="meta">
              <strong>{b.pengirim}</strong> · {fmtWaktu(b.created_at)}
              {b.tag === 'revisi' && <span className="badge tag-revisi">Revisi</span>}
              {b.tag === 'acc' && <span className="badge tag-acc">ACC</span>}
            </div>
            {b.teks && <div style={{ whiteSpace: 'pre-wrap' }}>{b.teks}</div>}
            {b.file_url && (
              <a href={b.file_url} target="_blank" rel="noopener noreferrer" style={{ marginTop: 6, display: 'inline-block', fontSize: '.86rem', padding: '5px 10px', borderRadius: 3 }}>
                📎 {b.file_nama}
              </a>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="field" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
          <textarea rows={2} value={teks} onChange={(e) => setTeks(e.target.value)} placeholder="Tulis komentar..." />
        </div>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        {isAdmin && (
          <select value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="">Tidak ditandai</option>
            <option value="revisi">Revisi</option>
            <option value="acc">ACC</option>
          </select>
        )}
        <button className="btn btn-small" disabled={busy} onClick={kirim}>Kirim</button>
      </div>
      {notice && <div className={`notice ${notice.tipe}`} style={{ marginTop: 10 }}>{notice.pesan}</div>}

      {isAdmin && bab.status !== 'acc' && (
        <button className="btn-acc" style={{ marginTop: 12 }} onClick={accBab}>
          ACC Bab {bab.nomor} &amp; buka berikutnya
        </button>
      )}
    </div>
  );
}
