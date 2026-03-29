import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Auth, Apoderado, Profesor, Admin, Pupils, Club, getAccessToken, MeResponse, Pupil, ModuloEstado } from '../api';
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
  /** Módulos habilitados por el club (claves) */
  modulosHabilitados: string[];
  /** Estado completo de módulos (con es_nuevo, nombre, etc.) */
  modulosEstado: ModuloEstado[];
  /** Verifica si un módulo está activo */
  isModuloHabilitado: (modulo: string) => boolean;
  /** Verifica si un módulo es nuevo (es_nuevo=true) y el usuario aún no lo vio */
  isModuloNuevo: (clave: string) => boolean;
  /** Marca un módulo como visto (elimina badge NUEVO) */
  marcarModuloVisto: (clave: string) => void;
  /** Recarga módulos del club */
  loadModulosHabilitados: (clubId: number) => Promise<void>;
}

// Módulos habilitados por defecto cuando el endpoint falla (fail-open controlado)
const DEFAULT_MODULOS: string[] = [
  'asistencia', 'pagos', 'comunicados', 'documentos',
  'justificativos', 'agenda', 'convocatorias', 'carnet',
];
// Intervalo mínimo entre refrescos en foreground (30 min)
const MODULOS_REFRESH_MS = 30 * 60 * 1000;

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
  const [modulosHabilitados, setModulosHabilitados] = useState<string[]>([]);
  const [modulosEstado, setModulosEstado] = useState<ModuloEstado[]>([]);
  const [modulosVistos, setModulosVistos] = useState<string[]>([]);
  const modulosLastFetched = useRef<number>(0);
  const clubIdRef = useRef<number | null>(null);

  usePushNotifications(state.status === 'authenticated');

  // Refresh de módulos al volver al primer plano si pasaron más de 30 min
  useEffect(() => {
    const handleAppState = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && clubIdRef.current) {
        const elapsed = Date.now() - modulosLastFetched.current;
        if (elapsed > MODULOS_REFRESH_MS) {
          loadModulosHabilitados(clubIdRef.current);
        }
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [loadModulosHabilitados]);

  // Cargar módulos vistos desde AsyncStorage al arrancar
  useEffect(() => {
    AsyncStorage.getItem('modulos_vistos').then(raw => {
      if (raw) setModulosVistos(JSON.parse(raw));
    }).catch(() => {});
  }, []);

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
        // Cargar módulos habilitados del club en background
        if (user.club_id) loadModulosHabilitados(user.club_id);
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
      // Cargar módulos habilitados del club en background
      if (user.club_id) loadModulosHabilitados(user.club_id);
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

  const loadModulosHabilitados = useCallback(async (clubId: number) => {
    try {
      const res = await Club.modulosHabilitados(clubId);
      setModulosEstado(res.modulos);
      setModulosHabilitados(res.modulos.filter(m => m.habilitado).map(m => m.clave));
      modulosLastFetched.current = Date.now();
      clubIdRef.current = clubId;
    } catch {
      // Fail-open controlado: si no hay estado previo, usar los módulos por defecto
      if (modulosEstado.length === 0) {
        setModulosHabilitados(DEFAULT_MODULOS);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulosEstado.length]);

  const isModuloHabilitado = useCallback((modulo: string): boolean => {
    // Si no se han cargado módulos aún, usar lista de defaults
    if (modulosEstado.length === 0) return DEFAULT_MODULOS.includes(modulo);
    return modulosEstado.find(m => m.clave === modulo)?.habilitado ?? false;
  }, [modulosEstado]);

  const isModuloNuevo = useCallback((clave: string): boolean => {
    const m = modulosEstado.find(mod => mod.clave === clave);
    if (!m?.es_nuevo || !m.habilitado) return false;
    return !modulosVistos.includes(clave);
  }, [modulosEstado, modulosVistos]);

  const marcarModuloVisto = useCallback((clave: string) => {
    setModulosVistos(prev => {
      if (prev.includes(clave)) return prev;
      const next = [...prev, clave];
      AsyncStorage.setItem('modulos_vistos', JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const logout = useCallback(async () => {
    await Auth.logout();
    await AsyncStorage.removeItem('active_role');
    setModulosHabilitados([]);
    setModulosEstado([]);
    setState({ status: 'unauthenticated' });
  }, []);

  return (
    <AuthContext.Provider value={{ state, requestOTP, verifyOTP, setActiveRole, setActivePupil, refreshPupils, logout, modulosHabilitados, modulosEstado, isModuloHabilitado, isModuloNuevo, marcarModuloVisto, loadModulosHabilitados }}>
      {children}
    </AuthContext.Provider>
  );
}
