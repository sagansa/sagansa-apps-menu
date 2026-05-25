'use client';

import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from 'react-native';

import apiService from '@/lib/api';
import { clearToken, loadToken, saveToken } from '@/lib/storage';

interface AuthContextValue {
  user: any | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const storedToken = await loadToken();
        if (storedToken) {
          apiService.setToken(storedToken);
          const profile = await apiService.fetchProfile();
          if (isMounted) {
            setToken(storedToken);
            setUser(profile.user);
          }
        }
      } catch (error) {
        console.warn('Failed to restore authentication', error);
        await clearToken();
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useMemo(
    () =>
      async (email: string, password: string) => {
        try {
          const { token: newToken, user: profile } = await apiService.login({ email, password });
          await saveToken(newToken);
          apiService.setToken(newToken);
          setToken(newToken);
          setUser(profile);
        } catch (error) {
          console.error('Login failed', error);
          Alert.alert('Login Gagal', 'Email atau password salah. Silakan coba lagi.');
          throw error;
        }
      },
    [],
  );

  const logout = useMemo(
    () =>
      async () => {
        if (token) {
          try {
            await apiService.logout();
          } catch (error) {
            console.warn('Failed to notify server about logout', error);
          }
        }

        await clearToken();
        apiService.setToken(null);
        setToken(null);
        setUser(null);
        router.replace('/login');
      },
    [token, router],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [user, token, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}