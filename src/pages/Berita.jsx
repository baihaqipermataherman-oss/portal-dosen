import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

function ringkasan(html, panjang) {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  const teks = (div.textContent || '').trim();
  return teks.length > panjang ? teks.slice(0, panjang).trim() + '…' : teks;
}

const fmtTgl = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Berita() {
  const [daftar, setDaftar] = useState([]);
  const [terbuka, setTerbuka] = useState(new Set());

  useEffect(() => {
    supabase.from('berita').select('*').order('created_at', { ascending: false }).then(({ data }) => setDaftar(data || []));
  }, []);

  const toggle = (id) => {
    const s = new Set(terbuka);
    s.has(id) ? s.delete(id) : s.add(id);
    setTerbuka(new Set(s));
  };

  const KartuTeks = ({ b }) => (
    <div className="berita-teks">
      <h3>{b.judul}</h3>
      <p className="muted">{fmtTgl(b.created_at)} · oleh {b.penulis || '-'}</p>
      {terbuka.has(b.id) ? (
        <>
          <div dangerouslySetInnerHTML={{ __html: b.isi }} />
          <button className="btn-ghost btn-small" style={{ marginTop: 10 }} onClick={() => toggle(b.id)}>Tutup ▲</button>
        </>
      ) : (
        <>
          <p>{ringkasan(b.isi, 140)}</p>
          <button className="btn-ghost btn-small" onClick={() => toggle(b.id)}>Baca selengkapnya ▾</button>
        </>
      )}
    </div>
  );

  return (
    <section>
      <h2>Berita &amp; Kegiatan</h2>
      {daftar.length === 0 && <p className="muted">Belum ada berita.</p>}
      {daftar.map((b) => {
        if (b.tipe === 'eksternal') {
          return (
            <div className="card" key={b.id}>
              <p className="muted" style={{ marginBottom: 4 }}>Diberitakan oleh {b.sumber_media} · {fmtTgl(b.created_at)} · ditambahkan oleh {b.penulis || '-'}</p>
              <h3 style={{ marginBottom: 6 }}><a href={b.link} target="_blank" rel="noopener noreferrer">{b.judul} ↗</a></h3>
              {b.ringkasan && <p>{b.ringkasan}</p>}
            </div>
          );
        }
        if (!b.gambar_url) return <div className="card" key={b.id}><KartuTeks b={b} /></div>;
        const img = <img src={b.gambar_url} alt={b.judul} style={{ width: '100%', borderRadius: 5, border: '1px solid var(--line)' }} />;
        if (b.posisi_gambar === 'kiri') return <div className="card" key={b.id}><div style={{ display: 'flex', gap: 20 }}><div style={{ width: 200, flexShrink: 0 }}>{img}</div><KartuTeks b={b} /></div></div>;
        if (b.posisi_gambar === 'kanan') return <div className="card" key={b.id}><div style={{ display: 'flex', gap: 20, flexDirection: 'row-reverse' }}><div style={{ width: 200, flexShrink: 0 }}>{img}</div><KartuTeks b={b} /></div></div>;
        if (b.posisi_gambar === 'bawah') return <div className="card" key={b.id}><KartuTeks b={b} /><div style={{ marginTop: 14 }}>{img}</div></div>;
        return <div className="card" key={b.id}><div style={{ marginBottom: 14 }}>{img}</div><KartuTeks b={b} /></div>;
      })}
    </section>
  );
}
