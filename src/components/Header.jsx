import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { wrapStyle } from '../styles/wrapStyle';

export default function Header({ profil }) {
  const { sudahLogin } = useAuth();

  return (
    <header className="masthead">
      <div className="wrap" style={wrapStyle}>
        <div className="kop-baris">
          <span className="institusi">{profil?.institusi || 'Portal Dosen'}</span>
        </div>

        <nav className="modeswitch" aria-label="Navigasi utama">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'aktif' : '')}>Situs Publik</NavLink>
          <NavLink to="/publikasi" className={({ isActive }) => (isActive ? 'aktif' : '')}>Publikasi</NavLink>
          <NavLink to="/berita" className={({ isActive }) => (isActive ? 'aktif' : '')}>Berita</NavLink>
          <NavLink to="/mahasiswa" className={({ isActive }) => (isActive ? 'aktif' : '')}>Area Mahasiswa</NavLink>
          <NavLink to={sudahLogin ? '/admin' : '/login'} className={({ isActive }) => (isActive ? 'aktif' : '')}>
            {sudahLogin ? 'Dasbor Dosen' : 'Login Dosen'}
          </NavLink>
          <a href="https://jadwalprodi.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto' }}>
            Jadwal Perkuliahan ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
