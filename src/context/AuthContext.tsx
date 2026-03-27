import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Auth, Apoderado, Profesor, Admin, Pupils, getAccessToken, MeResponse, Pupil } from '../api';
import { usePushNotifications } from '../hooks/usePushNotifications';

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

  usePushNotifications(state.status === 'authenticated');

  // Al arrancar: comprobar si hay token guardado
  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) { setState({ status: 'unauthenticated' }); return; }

        const savedRole = await AsyncStorage.getItem('active_role') ?? 'apoderado';

        // Llamar /me del rol correspondiente
        const getMeFn = savedRole === 'profesor' ? Profesor.getMe
                      : savedRole === 'admin'    ? Admin.getMe
                      : Apoderado.getMe;
        let user;
        try {
          user = await getMeFn();
        } catch (err) {
          // Token inválido o expirado
          await Auth.logout();
          setState({ status: 'unauthenticated' });
          return;
        }

        let pupils: Pupil[] = [];
        if (savedRole === 'apoderado') {
          try {
            pupils = await Pupils.list();
            console.log('[AuthContext] Pupils loaded:', JSON.stringify(pupils));
          } catch (err) {
            console.error('[AuthContext] Pupils.list() error:', JSON.stringify(err));
            // Solo cerrar sesión si es error de auth (401/403), no en otros errores
            if ((err as any)?.status === 401 || (err as any)?.status === 403) {
              await Auth.logout();
              setState({ status: 'unauthenticated' });
              return;
            }
            // En caso de otro error (500, red), continuar sin pupilos
          }
        }
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
      const activeRole = user.roles[0];
      const pupils = activeRole === 'apoderado' ? await Pupils.list() : [];
      await AsyncStorage.setItem('active_role', activeRole);
      setState({ status: 'authenticated', user, pupils, activePupil: pupils[0] ?? null, activeRole });
    }
    return hasRoles;
  };

  const setActiveRole = useCallback(async (role: string) => {
    await AsyncStorage.setItem('active_role', role);
    if (role === 'apoderado') {
      try {
        const pupils = await Pupils.list();
        console.log('[AuthContext] setActiveRole → pupils:', JSON.stringify(pupils));
        setState(prev =>
          prev.status === 'authenticated'
            ? { ...prev, activeRole: role, pupils, activePupil: prev.activePupil ?? pupils[0] ?? null }
            : prev,
        );
      } catch (err) {
        console.error('[AuthContext] setActiveRole Pupils.list() error:', JSON.stringify(err));
        setState(prev =>
          prev.status === 'authenticated' ? { ...prev, activeRole: role } : prev,
        );
      }
    } else {
      setState(prev =>
        prev.status === 'authenticated' ? { ...prev, activeRole: role } : prev,
      );
    }
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
