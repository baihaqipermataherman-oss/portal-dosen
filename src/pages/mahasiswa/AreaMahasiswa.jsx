import { useState } from 'react';
import Bimbingan from './Bimbingan';
import Materi from './Materi';

export default function AreaMahasiswa() {
  const [tab, setTab] = useState('bimbingan');
  return (
    <section>
      <div className="subtabs" style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button className="btn-ghost" style={tab === 'bimbingan' ? { borderColor: 'var(--maroon)', color: 'var(--maroon)' } : {}} onClick={() => setTab('bimbingan')}>Bimbingan</button>
        <button className="btn-ghost" style={tab === 'materi' ? { borderColor: 'var(--maroon)', color: 'var(--maroon)' } : {}} onClick={() => setTab('materi')}>Materi Kuliah</button>
      </div>
      {tab === 'bimbingan' ? <Bimbingan /> : <Materi />}
    </section>
  );
}
