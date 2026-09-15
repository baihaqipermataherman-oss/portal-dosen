import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { masuk } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [memuat, setMemuat] = useState(false);

  const kirim = async (e) => {
    e.preventDefault();
    setError(''); setMemuat(true);
    const { error } = await masuk(email, password);
    setMemuat(false);
    if (error) { setError('Email atau kata sandi salah.'); return; }
    navigate('/admin');
  };

  return (
    <section style={{ maxWidth: 360 }}>
      <h2>Login Dosen</h2>
      <p className="muted" style={{ marginBottom: 16 }}>
      </p>
      <form onSubmit={kirim}>
        <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="field"><label>Kata sandi</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        {error && <div className="notice err">{error}</div>}
        <button className="btn" disabled={memuat}>{memuat ? 'Memproses…' : 'Masuk'}</button>
      </form>
    </section>
  );
}
