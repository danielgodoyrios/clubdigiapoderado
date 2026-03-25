import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../config';

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
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: object,
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = await getAccessToken();
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
export const Auth = {
  requestOTP: (phone: string) =>
    request<{ message: string; expires_in: number }>(
      'POST', '/auth/otp/request', { phone }, false,
    ),

  verifyOTP: async (phone: string, code: string) => {
    const res = await request<{
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
    }>('POST', '/auth/otp/verify', { phone, code }, false);
    await saveTokens(res.access_token, res.refresh_token);
    return res;
  },

  refreshToken: async () => {
    const refresh = await AsyncStorage.getItem(KEY_REFRESH);
    if (!refresh) throw new Error('No refresh token');
    const res = await request<{ access_token: string; expires_in: number }>(
      'POST', '/auth/refresh', { refresh_token: refresh }, false,
    );
    await AsyncStorage.setItem(KEY_ACCESS, res.access_token);
    return res;
  },

  logout: () => clearTokens(),
};

// ── 2. APODERADO ──────────────────────────────────────────────
export type ApoderadoProfile = {
  id: string; name: string; initials: string;
  rut: string; phone: string; email: string;
  roles?: string[];
};

export const Apoderado = {
  getMe: () => request<ApoderadoProfile>('GET', '/apoderado/me'),
  updateMe: (data: Partial<Pick<ApoderadoProfile, 'name' | 'email'>>) =>
    request<ApoderadoProfile>('PUT', '/apoderado/me', data),
};

// ── 3. PUPILOS ────────────────────────────────────────────────
export type Pupil = {
  id: string; name: string; initials: string;
  number: number; category: string;
  club: string; club_id: string;
  attendance_pct: number; license_id: string;
  quota_pending: boolean;
};

export const Pupils = {
  list: () => request<Pupil[]>('GET', '/apoderado/me/pupils'),
  update: (pupilId: string, data: Partial<Pick<Pupil, 'name' | 'number' | 'category'>>) =>
    request<Pupil>('PUT', `/apoderado/me/pupils/${pupilId}`, data),
};

// ── 4. AGENDA / EVENTOS ───────────────────────────────────────
export type Event = {
  id: string; type: 'match' | 'training';
  title: string; date: string; venue: string;
  home_team?: string; away_team?: string;
  league?: string; status: string;
};

export const Events = {
  list: (pupilId: string, from: string, to: string, type = 'all') =>
    request<Event[]>('GET', `/pupils/${pupilId}/events?from=${from}&to=${to}&type=${type}`),
};

// ── 5. ASISTENCIA ─────────────────────────────────────────────
export type AttendanceSummaryMonth = {
  month: string; month_label: string;
  sessions_total: number; sessions_present: number;
  sessions_absent: number; attendance_pct: number;
};

export type AttendanceDetail = {
  month_label: string; attendance_pct: number;
  sessions: Array<{
    id: string; date: string; type: string;
    label: string; present: boolean;
    justified: boolean; justification?: string;
  }>;
};

export const Attendance = {
  summary: (pupilId: string, months = 6) =>
    request<AttendanceSummaryMonth[]>(
      'GET', `/pupils/${pupilId}/attendance/summary?months=${months}`,
    ),
  detail: (pupilId: string, year: number, month: number) =>
    request<AttendanceDetail>(
      'GET', `/pupils/${pupilId}/attendance/${year}/${String(month).padStart(2, '0')}`,
    ),
};

// ── 6. PAGOS ──────────────────────────────────────────────────
export type Payment = {
  id: string; concept: string; amount: number;
  due_date?: string; paid_date?: string;
  status: 'pending' | 'paid' | 'overdue';
  receipt_url?: string;
};

export type PaymentsResponse = { pending: Payment[]; history: Payment[] };

export const Payments = {
  list: (pupilId: string) =>
    request<PaymentsResponse>('GET', `/pupils/${pupilId}/payments`),
  checkout: (paymentId: string) =>
    request<{ payment_id: string; checkout_url: string; token: string; expires_at: string }>(
      'POST', `/payments/${paymentId}/checkout`,
    ),
  getStatus: (paymentId: string) =>
    request<Payment>('GET', `/payments/${paymentId}`),
};

// ── 7. COMUNICADOS ────────────────────────────────────────────
export type Comunicado = {
  id: string; title: string; preview: string;
  category: 'info' | 'action' | 'admin';
  date: string; read: boolean;
};

export type ComunicadoDetail = Comunicado & { body: string; attachments?: Array<{ name: string; url: string }> };

export const Comunicados = {
  list: (pupilId: string, page = 1) =>
    request<Comunicado[]>('GET', `/pupils/${pupilId}/comunicados?page=${page}&per_page=20`),
  get: (comunicadoId: string) =>
    request<ComunicadoDetail>('GET', `/comunicados/${comunicadoId}`),
  markRead: (comunicadoId: string) =>
    request<void>('POST', `/comunicados/${comunicadoId}/read`),
};

// ── 8. DOCUMENTOS ─────────────────────────────────────────────
export type Documento = {
  id: string; title: string;
  type: 'authorization' | 'contract' | 'medical' | 'regulation';
  status: 'pending_signature' | 'signed' | 'pending_review';
  date: string; due?: string;
};

export const Documentos = {
  list: (pupilId: string) =>
    request<Documento[]>('GET', `/pupils/${pupilId}/documents`),
  sign: (documentId: string) =>
    request<{ signed: boolean; signed_at: string }>(
      'POST', `/documents/${documentId}/sign`,
    ),
};

// ── 9. CARNET / BENEFICIOS ────────────────────────────────────
export type Benefit = {
  id: string; name: string; emoji: string;
  type: 'carnet' | 'qr' | 'code'; code?: string; active: boolean;
};

export const Carnet = {
  getBenefits: (pupilId: string) =>
    request<Benefit[]>('GET', `/pupils/${pupilId}/benefits`),
  getQR: (pupilId: string) =>
    request<{ qr_url: string; expires_at: string }>(
      'GET', `/pupils/${pupilId}/carnet/qr`,
    ),
};

