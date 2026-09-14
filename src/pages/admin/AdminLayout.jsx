import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import EditProfil from './EditProfil';
import PublikasiAdmin from './PublikasiAdmin';
import BeritaAdmin from './BeritaAdmin';
import BimbinganAdmin from './BimbinganAdmin';
import MateriAdmin from './MateriAdmin';

const SUBTAB = [
  ['editprofil', 'Edit Profil'],
  ['publikasi', 'Publikasi'],
  ['berita', 'Berita'],
  ['bimbingan', 'Bimbingan'],
  ['materi', 'Materi'],
];

export default function AdminLayout() {
  const [tab, setTab] = useState('editprofil');
  const { keluar } = useAuth();

  return (
    <section>
      <div className="subtabs" style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {SUBTAB.map(([id, label]) => (
          <button
            key={id}
            className="btn-ghost"
            style={tab === id ? { borderColor: 'var(--maroon)', color: 'var(--maroon)' } : {}}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
        <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={keluar}>Keluar</button>
      </div>

      {tab === 'editprofil' && <EditProfil />}
      {tab === 'publikasi' && <PublikasiAdmin />}
      {tab === 'berita' && <BeritaAdmin />}
      {tab === 'bimbingan' && <BimbinganAdmin />}
      {tab === 'materi' && <MateriAdmin />}
    </section>
  );
}
