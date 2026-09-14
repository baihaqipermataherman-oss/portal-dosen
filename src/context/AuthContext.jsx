import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setMemuat(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sesiBaru) => {
      setSession(sesiBaru);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const masuk = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const keluar = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ session, memuat, masuk, keluar, sudahLogin: !!session }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
