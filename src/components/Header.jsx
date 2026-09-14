import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header({ profil }) {
  const { sudahLogin } = useAuth();

  return (
    <header className="masthead">
      <div className="wrap">
        {/* Baris atas: nama institusi + link Login Dosen kecil, terpisah dari menu utama */}
        <div className="kop-baris">
          <span className="institusi">{profil?.institusi || 'Portal Dosen'}</span>
          <NavLink to={sudahLogin ? '/admin' : '/login'} className="login-kecil">
            {sudahLogin ? 'Dasbor Dosen' : 'Login Dosen'}
          </NavLink>
        </div>

        {/* Menu utama publik — Login Dosen sengaja TIDAK ada di sini */}
        <nav className="modeswitch" aria-label="Navigasi utama">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'aktif' : '')}>Situs Publik</NavLink>
          <NavLink to="/publikasi" className={({ isActive }) => (isActive ? 'aktif' : '')}>Publikasi</NavLink>
          <NavLink to="/berita" className={({ isActive }) => (isActive ? 'aktif' : '')}>Berita</NavLink>
          <NavLink to="/mahasiswa" className={({ isActive }) => (isActive ? 'aktif' : '')}>Area Mahasiswa</NavLink>
          <a href="https://jadwalprodi.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto' }}>
            Jadwal Perkuliahan ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
