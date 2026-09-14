import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Publikasi() {
  const [daftar, setDaftar] = useState([]);

  useEffect(() => {
    supabase.from('publikasi').select('*').order('created_at', { ascending: false }).then(({ data }) => setDaftar(data || []));
  }, []);

  return (
    <section>
      <h2>Publikasi</h2>
      {daftar.length === 0 && <p className="muted">Belum ada publikasi.</p>}
      {daftar.map((p, i) => (
        <div className="biblio-row" key={p.id}>
          <span className="no">{i + 1}</span>
          <div>
            <div>{p.judul}{p.link && <> — <a href={p.link} target="_blank" rel="noopener noreferrer">tautan</a></>}</div>
            <div className="muted">{p.venue}, {p.tahun}</div>
          </div>
        </div>
      ))}
    </section>
  );
}
