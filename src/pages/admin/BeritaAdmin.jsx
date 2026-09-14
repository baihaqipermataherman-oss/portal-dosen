import { useEffect, useState } from 'react';
import { supabase, unggahBerkas } from '../../supabaseClient';
import RichTextEditor from '../../components/RichTextEditor';

const KOSONG_SENDIRI = { judul: '', penulis: '', isi: '', posisi_gambar: 'atas' };
const KOSONG_EKSTERNAL = { judul: '', sumber_media: '', link: '', ringkasan: '', penulis: '' };

const fmtTgl = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

export default function BeritaAdmin() {
  const [daftar, setDaftar] = useState([]);
  const [profilNama, setProfilNama] = useState('');
  const [formSendiri, setFormSendiri] = useState(KOSONG_SENDIRI);
  const [gambarFile, setGambarFile] = useState(null);
  const [formEksternal, setFormEksternal] = useState(KOSONG_EKSTERNAL);
  const [editId, setEditId] = useState(null);
  const [editTipe, setEditTipe] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    muat();
    supabase.from('profil').select('nama').eq('id', 1).single().then(({ data }) => {
      setProfilNama(data?.nama || '');
      setFormSendiri((f) => ({ ...f, penulis: f.penulis || data?.nama || '' }));
      setFormEksternal((f) => ({ ...f, penulis: f.penulis || data?.nama || '' }));
    });
  }, []);

  const muat = async () => {
    const { data } = await supabase.from('berita').select('*').order('created_at', { ascending: false });
    setDaftar(data || []);
  };

  const mulaiEdit = (item) => {
    if (item.tipe === 'eksternal') {
      setEditId(item.id); setEditTipe('eksternal');
      setFormEksternal({ judul: item.judul, sumber_media: item.sumber_media, link: item.link, ringkasan: item.ringkasan || '', penulis: item.penulis || '' });
    } else {
      setEditId(item.id); setEditTipe('sendiri');
      setFormSendiri({ judul: item.judul, penulis: item.penulis || '', isi: item.isi || '', posisi_gambar: item.posisi_gambar || 'atas' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const batalEdit = () => {
    setEditId(null); setEditTipe(null);
    setFormSendiri({ ...KOSONG_SENDIRI, penulis: profilNama });
    setFormEksternal({ ...KOSONG_EKSTERNAL, penulis: profilNama });
    setGambarFile(null);
  };

  const simpanSendiri = async () => {
    if (!formSendiri.judul.trim() || !formSendiri.isi.replace(/<[^>]+>/g, '').trim()) { alert('Isi judul dan isi berita.'); return; }
    setNotice('');
    try {
      let gambar_url;
      if (gambarFile) { const hasil = await unggahBerkas(gambarFile, 'berita'); gambar_url = hasil.url; }
      if (editId && editTipe === 'sendiri') {
        const payload = { ...formSendiri };
        if (gambar_url) payload.gambar_url = gambar_url;
        await supabase.from('berita').update(payload).eq('id', editId);
      } else {
        await supabase.from('berita').insert({ ...formSendiri, tipe: 'sendiri', gambar_url: gambar_url || null });
      }
      batalEdit();
      muat();
    } catch (e) { setNotice(e.message); }
  };

  const simpanEksternal = async () => {
    if (!formEksternal.judul.trim() || !formEksternal.sumber_media.trim() || !formEksternal.link.trim()) { alert('Isi judul, nama media, dan tautan.'); return; }
    if (editId && editTipe === 'eksternal') {
      await supabase.from('berita').update(formEksternal).eq('id', editId);
    } else {
      await supabase.from('berita').insert({ ...formEksternal, tipe: 'eksternal' });
    }
    batalEdit();
    muat();
  };

  const hapus = async (id) => {
    if (!confirm('Hapus berita ini?')) return;
    await supabase.from('berita').delete().eq('id', id);
    muat();
  };

  return (
    <div>
      <div className="card">
        <h3>Publikasikan berita/kegiatan sendiri</h3>
        <div className="field"><label>Judul</label><input value={formSendiri.judul} onChange={(e) => setFormSendiri({ ...formSendiri, judul: e.target.value })} /></div>
        <div className="field"><label>Dipublikasikan oleh</label><input value={formSendiri.penulis} onChange={(e) => setFormSendiri({ ...formSendiri, penulis: e.target.value })} /></div>
        <div className="field">
          <label>Isi berita</label>
          <RichTextEditor value={formSendiri.isi} onChange={(html) => setFormSendiri((f) => ({ ...f, isi: html }))} />
        </div>
        <div className="row2">
          <div className="field"><label>Gambar (opsional)</label><input type="file" accept="image/*" onChange={(e) => setGambarFile(e.target.files[0])} /></div>
          <div className="field"><label>Tata letak gambar</label>
            <select value={formSendiri.posisi_gambar} onChange={(e) => setFormSendiri({ ...formSendiri, posisi_gambar: e.target.value })}>
              <option value="atas">Di atas judul</option>
              <option value="kiri">Di samping kiri teks</option>
              <option value="kanan">Di samping kanan teks</option>
              <option value="bawah">Di bawah isi</option>
            </select>
          </div>
        </div>
        {notice && <div className="notice err">{notice}</div>}
        <button className="btn" onClick={simpanSendiri}>{editId && editTipe === 'sendiri' ? 'Simpan perubahan' : 'Publikasikan'}</button>{' '}
        {editId && editTipe === 'sendiri' && <button className="btn-ghost" onClick={batalEdit}>Batal edit</button>}
      </div>

      <div className="card">
        <h3>Selipkan liputan dari media lain</h3>
        <div className="row3">
          <div className="field"><label>Judul berita</label><input value={formEksternal.judul} onChange={(e) => setFormEksternal({ ...formEksternal, judul: e.target.value })} /></div>
          <div className="field"><label>Nama media</label><input value={formEksternal.sumber_media} onChange={(e) => setFormEksternal({ ...formEksternal, sumber_media: e.target.value })} /></div>
          <div className="field"><label>Tautan berita</label><input value={formEksternal.link} onChange={(e) => setFormEksternal({ ...formEksternal, link: e.target.value })} /></div>
        </div>
        <div className="field"><label>Kutipan/pengantar singkat</label><textarea rows={2} value={formEksternal.ringkasan} onChange={(e) => setFormEksternal({ ...formEksternal, ringkasan: e.target.value })} /></div>
        <div className="field"><label>Ditambahkan oleh</label><input value={formEksternal.penulis} onChange={(e) => setFormEksternal({ ...formEksternal, penulis: e.target.value })} /></div>
        <button className="btn" onClick={simpanEksternal}>{editId && editTipe === 'eksternal' ? 'Simpan perubahan' : 'Tambahkan tautan'}</button>{' '}
        {editId && editTipe === 'eksternal' && <button className="btn-ghost" onClick={batalEdit}>Batal edit</button>}
      </div>

      {daftar.map((b) => (
        <div className="list-row" key={b.id}>
          <div><strong>{b.judul}</strong><div className="muted">{fmtTgl(b.created_at)} · oleh {b.penulis || '-'}{b.tipe === 'eksternal' ? ` · liputan ${b.sumber_media}` : ''}</div></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost btn-small" onClick={() => mulaiEdit(b)}>Edit</button>
            <button className="btn-danger" onClick={() => hapus(b.id)}>Hapus</button>
          </div>
        </div>
      ))}
    </div>
  );
}
