import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { sudahLogin, memuat } = useAuth();
  if (memuat) return <p className="muted">Memuat…</p>;
  if (!sudahLogin) return <Navigate to="/login" replace />;
  return children;
}
