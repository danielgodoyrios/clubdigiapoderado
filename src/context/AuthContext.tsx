import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Auth, Apoderado, Pupils, getAccessToken, MeResponse, Pupil } from '../api';

// ── Types ─────────────────────────────────────────────────────
type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: MeResponse; pupils: Pupil[]; activePupil: Pupil | null; activeRole: string };

interface AuthContextValue {
  state: AuthState;
  /** Llama al backend para enviar OTP */
  requestOTP: (phone: string) => Promise<void>;
  /** Verifica el OTP; devuelve true si el usuario ya tiene roles asignados */
  verifyOTP: (phone: string, code: string) => Promise<boolean>;
  /** Selecciona el rol activo para esta sesión */
  setActiveRole: (role: string) => void;
  /** Cambia el pupilo activo */
  setActivePupil: (pupil: Pupil) => void;
  /** Recarga pupilos desde el backend */
  refreshPupils: () => Promise<void>;
  /** Cierra sesión */
  logout: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  // Al arrancar: comprobar si hay token guardado
  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) { setState({ status: 'unauthenticated' }); return; }

        const [user, pupils] = await Promise.all([
          Apoderado.getMe(),
          Pupils.list(),
        ]);

        const savedRole = await AsyncStorage.getItem('active_role');
        const activeRole = savedRole ?? (user.roles?.[0] ?? 'apoderado');

        setState({
          status: 'authenticated',
          user,
          pupils,
          activePupil: pupils[0] ?? null,
          activeRole,
        });
      } catch {
        setState({ status: 'unauthenticated' });
      }
    })();
  }, []);

  const requestOTP = async (phone: string) => {
    await Auth.requestOTP(phone);
  };

  const verifyOTP = async (phone: string, code: string) => {
    const res = await Auth.verifyOTP(phone, code);
    const { user } = res;
    const hasRoles = (user.roles?.length ?? 0) > 0;
    if (hasRoles) {
      const pupils = await Pupils.list();
      const activeRole = user.roles[0];
      await AsyncStorage.setItem('active_role', activeRole);
      setState({ status: 'authenticated', user, pupils, activePupil: pupils[0] ?? null, activeRole });
    }
    return hasRoles;
  };

  const setActiveRole = useCallback(async (role: string) => {
    await AsyncStorage.setItem('active_role', role);
    setState(prev =>
      prev.status === 'authenticated' ? { ...prev, activeRole: role } : prev,
    );
  }, []);

  const setActivePupil = useCallback((pupil: Pupil) => {
    setState(prev =>
      prev.status === 'authenticated' ? { ...prev, activePupil: pupil } : prev,
    );
  }, []);

  const refreshPupils = useCallback(async () => {
    const pupils = await Pupils.list();
    setState(prev =>
      prev.status === 'authenticated'
        ? { ...prev, pupils, activePupil: pupils.find(p => p.id === prev.activePupil?.id) ?? pupils[0] ?? null }
        : prev,
    );
  }, []);

  const logout = useCallback(async () => {
    await Auth.logout();
    await AsyncStorage.removeItem('active_role');
    setState({ status: 'unauthenticated' });
  }, []);

  return (
    <AuthContext.Provider value={{ state, requestOTP, verifyOTP, setActiveRole, setActivePupil, refreshPupils, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
