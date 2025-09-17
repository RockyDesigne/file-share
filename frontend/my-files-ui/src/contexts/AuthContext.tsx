import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface AuthState {
  token: string | null;
  username: string | null;
  role: 'ROLE_ADMIN' | 'ROLE_USER' | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, token: string, role: 'ROLE_ADMIN' | 'ROLE_USER') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('username'));
  const [role, setRole] = useState<'ROLE_ADMIN' | 'ROLE_USER' | null>(() => localStorage.getItem('role') as 'ROLE_ADMIN' | 'ROLE_USER' | null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (username) {
      localStorage.setItem('username', username);
    } else {
      localStorage.removeItem('username');
    }
  }, [username]);

  useEffect(() => {
    if (role) {
      localStorage.setItem('role', role);
    } else {
      localStorage.removeItem('role');
    }
  }, [role]);

  const login = (u: string, t: string, r: 'ROLE_ADMIN' | 'ROLE_USER') => {
    setUsername(u);
    setToken(t);
    setRole(r);
  };

  const logout = () => {
    setUsername(null);
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, username, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
