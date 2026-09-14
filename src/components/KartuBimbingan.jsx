import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import BabThread from './BabThread';

export default function KartuBimbingan({ mhs, pengirim, isAdmin, onHapus }) {
  const [babs, setBabs] = useState([]);
  const [aktif, setAktif] = useState(0);

  useEffect(() => { muatBab(); }, [mhs.id]);

  const muatBab = async () => {
    const { data } = await supabase.from('bimbingan_bab').select('*').eq('bimbingan_id', mhs.id).order('nomor');
    setBabs(data || []);
  };

  return (
    <div>
      <h3>{mhs.nama}</h3>
      <p className="muted">{mhs.judul}</p>
      <div className="bab-tabs">
        {babs.map((b, i) => (
          <button key={b.id} disabled={b.status === 'locked'} className={i === aktif ? 'aktif' : ''} onClick={() => setAktif(i)}>
            Bab {b.nomor}{b.status === 'acc' ? ' ✓' : ''}
          </button>
        ))}
      </div>
      {babs[aktif] && (
        <BabThread bab={babs[aktif]} pengirim={pengirim} isAdmin={isAdmin} onAccUpdated={muatBab} />
      )}
      {isAdmin && onHapus && (
        <button className="btn-danger" style={{ marginTop: 12 }} onClick={onHapus}>Hapus mahasiswa ini</button>
      )}
    </div>
  );
}
