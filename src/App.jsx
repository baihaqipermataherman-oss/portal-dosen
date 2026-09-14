import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import { supabase } from './supabaseClient';

import Beranda from './pages/Beranda';
import Publikasi from './pages/Publikasi';
import Berita from './pages/Berita';
import Login from './pages/Login';
import AreaMahasiswa from './pages/mahasiswa/AreaMahasiswa';
import AdminLayout from './pages/admin/AdminLayout';

export default function App() {
  const [profil, setProfil] = useState(null);

  useEffect(() => {
    supabase.from('profil').select('*').eq('id', 1).single().then(({ data }) => setProfil(data));
  }, []);

  return (
    <>
      <Header profil={profil} />
      <main className="wrap">
        <Routes>
          <Route path="/" element={<Beranda profil={profil} />} />
          <Route path="/publikasi" element={<Publikasi />} />
          <Route path="/berita" element={<Berita />} />
          <Route path="/login" element={<Login />} />
          <Route path="/mahasiswa/*" element={<AreaMahasiswa />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <footer>
        <div className="wrap">© {new Date().getFullYear()} {profil?.institusi || 'Portal Dosen'}</div>
      </footer>
    </>
  );
}
