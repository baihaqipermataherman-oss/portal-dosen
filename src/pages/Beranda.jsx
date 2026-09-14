import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Beranda({ profil }) {
  const [pendidikan, setPendidikan] = useState([]);
  const [matkul, setMatkul] = useState([]);

  useEffect(() => {
    supabase.from('pendidikan').select('*').order('urutan').then(({ data }) => setPendidikan(data || []));
    supabase.from('matkul').select('*').then(({ data }) => setMatkul(data || []));
  }, []);

  if (!profil) return <p className="muted">Memuat…</p>;

  const inisial = (profil.nama || '').split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();

  return (
    <section style={{ paddingTop: 8 }}>
      <div style={{ display: 'flex', gap: 30, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {profil.foto_url ? (
          <img
            src={profil.foto_url}
            alt={profil.nama}
            style={{ width: 180, height: 225, objectFit: 'cover', flexShrink: 0, borderRadius: 4, border: '1px solid var(--maroon)', boxShadow: 'var(--shadow)' }}
          />
        ) : (
          <div className="plate" style={{ float: 'none', margin: 0, flexShrink: 0 }} aria-hidden="true">{inisial}</div>
        )}
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: '1.9rem' }}>{profil.nama}</h1>
          <p className="muted">{profil.jabatan}</p>
          <p style={{ maxWidth: '65ch' }}>{profil.bio}</p>
          <div className="chips">
            {(profil.chips || []).map((c) => <span className="chip" key={c}>{c}</span>)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 34 }}>
        <h2 style={{ fontSize: '1.2rem' }}>Pendidikan</h2>
        {pendidikan.length === 0 && <p className="muted">Belum ada data.</p>}
        {pendidikan.map((p) => (
          <div className="list-row" key={p.id}>
            <div><strong>{p.gelar}</strong><div className="muted">{p.tempat}</div></div>
            <div className="muted">{p.tahun}</div>
          </div>
        ))}

        <h2 style={{ fontSize: '1.2rem', marginTop: 26 }}>Mata Kuliah Diampu</h2>
        {matkul.length === 0 && <p className="muted">Belum ada data.</p>}
        {matkul.map((m) => (
          <div className="list-row" key={m.id}>
            <div><strong>{m.nama}</strong><div className="muted">{m.kode}</div></div>
            <div className="muted">{m.info}</div>
          </div>
        ))}

        <h2 style={{ fontSize: '1.2rem', marginTop: 26 }}>Kontak</h2>
        <p className="muted">{profil.email}</p>
      </div>
    </section>
  );
}
