'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { AuthSession } from '@/lib/types';
import { getSession, saveSession, clearSession } from '@/lib/storage';

interface AuthContextType {
  session: AuthSession | null;
  login: (session: AuthSession) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const s = getSession();
    setSession(s);
    setLoading(false);
  }, []);

  const login = (s: AuthSession) => {
    saveSession(s);
    setSession(s);
  };

  const logout = () => {
    clearSession();
    setSession(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ session, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export function useRequireAuth() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  return { session, loading };
}
