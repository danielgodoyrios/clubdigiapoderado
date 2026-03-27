import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../config';

// Base: https://api.clubdigital.cl/api
const BASE = Config.API_URL;

// ── Storage keys ──────────────────────────────────────────────
const KEY_ACCESS  = 'auth_access_token';
const KEY_REFRESH = 'auth_refresh_token';

// ── Token helpers ─────────────────────────────────────────────
export async function saveTokens(access: string, refresh: string) {
  await AsyncStorage.multiSet([[KEY_ACCESS, access], [KEY_REFRESH, refresh]]);
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_ACCESS);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([KEY_ACCESS, KEY_REFRESH]);
}

// ── Core fetch ────────────────────────────────────────────────
async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: object,
  auth = true,
  bearerToken?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = bearerToken ?? await getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, ...data };
  return data as T;
}

// ── 1. AUTH ───────────────────────────────────────────────────
export type AuthUser = {
  id: number;
  name: string;
  phone: string;
  roles: string[];
  is_new: boolean;
  club_id: number;
};

export const Auth = {
  requestOTP: (phone: string) =>
    request<{ message: string; phone: string; expires_in: number }>(
      'POST', '/auth/otp/request', { phone }, false,
    ),

  verifyOTP: async (phone: string, code: string) => {
    const res = await request<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user: AuthUser;
    }>('POST', '/auth/otp/verify', { phone, code }, false);
    await saveTokens(res.access_token, res.refresh_token);
    return res;
  },

  // Refresh usa el refresh_token como Bearer header (no body)
  refreshToken: async () => {
    const refresh = await AsyncStorage.getItem(KEY_REFRESH);
    if (!refresh) throw new Error('No refresh token');
    const res = await request<{ access_token: string; expires_in: number }>(
      'POST', '/auth/refresh', undefined, true, refresh,
    );
    await AsyncStorage.setItem(KEY_ACCESS, res.access_token);
    return res;
  },

  logout: async () => {
    try { await request<void>('POST', '/auth/logout'); } catch {}
    await clearTokens();
  },

  enroll: (code: string) =>
    request<{ roles: string[] }>('POST', '/auth/enroll', { code }),

  unenroll: (role: string) =>
    request<{ roles: string[] }>('DELETE', `/auth/enroll/${role}`),
};

// ── 2. PERFILES ───────────────────────────────────────────────
export type MeResponse = {
  id: number;
  name: string;
  phone: string;
  roles: string[];
  is_new: boolean;
  club_id: number;
  profesor_info?: {
    coach_id: number;
    bio: string | null;
    teams: Array<{ id: number; name: string }>;
  } | null;
  admin_info?: object | null;
};

// Re-export para compatibilidad con AuthContext
export type ApoderadoProfile = MeResponse;

export const Apoderado = {
  getMe: () => request<MeResponse>('GET', '/apoderado/me'),
  updateMe: (data: Partial<{ name: string; email: string }>) =>
    request<MeResponse>('PATCH', '/apoderado/me', data),
};

export const Profesor = {
  getMe: () => request<MeResponse>('GET', '/profesor/me'),
};

export const Admin = {
  getMe: () => request<MeResponse>('GET', '/admin/me'),
  createCode: (data: { role: string; max_uses?: number; expires_hours?: number; notes?: string }) =>
    request<{ code: string; display: string; role: string; expires_at: string }>(
      'POST', '/admin/codes', data,
    ),
};

// ── 3. PUPILOS ────────────────────────────────────────────────
export type Pupil = {
  id: number;
  name: string;       // mapeado desde full_name
  rut: string;
  team: string | null;
  category: string | null;
  photo: string | null;
  birth_date: string | null;
  gender: string | null;
  status: string;
};

type PupilRaw = {
  id: number;
  name: string;
  lastname: string;
  full_name: string;
  rut: string;
  birth_date: string | null;
  gender: string | null;
  photo: string | null;
  status: string;
  club_id: number;
  team: string | null;
  category?: string | null;
};

function mapPupil(raw: PupilRaw): Pupil {
  return {
    id:         raw.id,
    name:       raw.full_name ?? `${raw.name} ${raw.lastname}`.trim(),
    rut:        raw.rut,
    team:       raw.team ?? null,
    category:   raw.category ?? null,
    photo:      raw.photo ?? null,
    birth_date: raw.birth_date ?? null,
    gender:     raw.gender ?? null,
    status:     raw.status,
  };
}

export const Pupils = {
  list: async (): Promise<Pupil[]> => {
    const res = await request<{ data: PupilRaw[] } | PupilRaw[]>('GET', '/apoderado/me/pupils');
    // El backend puede envolver en { data: [...] } o devolver array directo
    const raw = Array.isArray(res) ? res : (res as any).data ?? [];
    return raw.map(mapPupil);
  },
};

// ── 4. AGENDA / EVENTOS ───────────────────────────────────────
export type Event = {
  id: number;
  type: 'training' | 'match' | 'event';
  title: string;
  date: string;        // "2026-03-01"
  time?: string;       // "10:00"
  location?: string;
  venue?: string;
  league?: string;
};

export const Events = {
  list: async (pupilId: number, from?: string, to?: string, type = 'all'): Promise<Event[]> => {
    const params = new URLSearchParams({ type });
    if (from) params.append('from', from);
    if (to)   params.append('to', to);
    const res = await request<Event[] | { data: Event[] }>('GET', `/apoderado/pupils/${pupilId}/events?${params}`);
    return Array.isArray(res) ? res : ((res as any).data ?? []);
  },
};

// ── 5. ASISTENCIA ─────────────────────────────────────────────
export type AttendanceMonth = {
  month: string;      // "2026-03"
  present: number;
  absent: number;
  justified: number;
  total: number;
};

export type AttendanceSession = {
  date: string;       // "2026-03-01"
  status: 'present' | 'absent' | 'justified';
  session: string;    // "Entrenamiento"
};

export const Attendance = {
  summary: (pupilId: number) =>
    request<{ months: AttendanceMonth[] }>('GET', `/apoderado/pupils/${pupilId}/attendance`),
  detail: async (pupilId: number, month: string): Promise<AttendanceSession[]> => {
    const res = await request<AttendanceSession[] | { data: AttendanceSession[] }>('GET', `/apoderado/pupils/${pupilId}/attendance/${month}`);
    return Array.isArray(res) ? res : ((res as any).data ?? []);
  },
};

// ── 6. PAGOS ──────────────────────────────────────────────────
export type Payment = {
  id: number;
  concept: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid';
};

export const Payments = {
  list: async (pupilId: number): Promise<Payment[]> => {
    const res = await request<Payment[] | { data: Payment[] }>('GET', `/apoderado/pupils/${pupilId}/payments`);
    return Array.isArray(res) ? res : ((res as any).data ?? []);
  },
  checkout: (pupilId: number, invoiceId: number, returnUrl = 'clubdigi://payment-result') =>
    request<{ webpay_url: string | null; webpay_token: string }>(
      'POST', `/apoderado/pupils/${pupilId}/payments/${invoiceId}/checkout`,
      { return_url: returnUrl },
    ),

  getStatus: (pupilId: number, invoiceId: number) =>
    request<{ status: 'paid' | 'pending' | 'failed'; paid_at?: string }>(
      'GET', `/apoderado/pupils/${pupilId}/payments/${invoiceId}/status`,
    ),
};

// ── 7. COMUNICADOS ────────────────────────────────────────────
export type Comunicado = {
  id: number;
  title: string;
  preview?: string;
  date: string;
  read: boolean;
  category?: 'info' | 'action' | 'admin';
};

export type ComunicadoDetail = {
  id: number;
  title: string;
  body: string;
  date: string;
  attachments: Array<{ name: string; url: string }>;
};

export const Comunicados = {
  list: async (pupilId: number, page = 1): Promise<Comunicado[]> => {
    const res = await request<Comunicado[] | { data: Comunicado[] }>(
      'GET', `/apoderado/pupils/${pupilId}/comunicados?page=${page}&per_page=20`,
    );
    return Array.isArray(res) ? res : ((res as any).data ?? []);
  },
  get: (pupilId: number, newsId: number) =>
    request<ComunicadoDetail>('GET', `/apoderado/pupils/${pupilId}/comunicados/${newsId}`),
  markRead: (pupilId: number, newsId: number) =>
    request<void>('POST', `/apoderado/pupils/${pupilId}/comunicados/${newsId}/read`),
};

// ── 8a. JUSTIFICATIVOS ───────────────────────────────────────
export type Justificativo = {
  id: number;
  date: string;                                // "2026-03-19"
  type: 'enfermedad' | 'lesion' | string;
  reason: string;
  days: number;
  file_url?: string | null;
  status: 'pending' | 'approved' | 'rejected';
};

export const Justificativos = {
  list: (pupilId: number) =>
    request<Justificativo[]>('GET', `/apoderado/pupils/${pupilId}/justificativos`),
  submit: (pupilId: number, data: {
    date: string;
    type: 'enfermedad' | 'lesion';
    reason: string;
    days: number;
    file_base64?: string;
    file_name?:   string;
  }) =>
    request<Justificativo>('POST', `/apoderado/pupils/${pupilId}/justificativos`, data),
};

// ── 8. DOCUMENTOS ─────────────────────────────────────────────
export type Documento = {
  id: number;
  title: string;
  type: string;
  status: 'pending_signature' | 'signed' | 'pending_review';
  date: string;
  due?: string;
};

export const Documentos = {
  list: async (pupilId: number): Promise<Documento[]> => {
    const res = await request<Documento[] | { data: Documento[] }>('GET', `/apoderado/pupils/${pupilId}/documents`);
    return Array.isArray(res) ? res : ((res as any).data ?? []);
  },  get: (pupilId: number, docId: number) =>
    request<Documento>('GET', `/apoderado/pupils/${pupilId}/documents/${docId}`),
  sign: (pupilId: number, docId: number) =>
    request<{ signed: boolean; signed_at: string }>(
      'POST', `/apoderado/pupils/${pupilId}/documents/${docId}/sign`,
    ),
};

// ── 9. CARNET ─────────────────────────────────────────────────
export type CarnetData = {
  token: string;       // "CDIGI-LIC1-XXXX"
  qr_payload: string;
  player_name: string;
  team: string;
};

export const Carnet = {
  get: (pupilId: number) =>
    request<CarnetData>('GET', `/apoderado/pupils/${pupilId}/carnet`),
};

// ── 10. BENEFICIOS ────────────────────────────────────────────
export type Benefit = {
  id: number;
  name: string;
  description: string;
  url: string;
};

export const Benefits = {
  list: () => request<Benefit[]>('GET', '/apoderado/benefits'),
};

// ── 11. PUSH NOTIFICATIONS ────────────────────────────────────
export const NotificationsAPI = {
  registerToken: (push_token: string) =>
    request<{ ok: boolean }>('POST', '/apoderado/me/devices', { push_token }),
};
