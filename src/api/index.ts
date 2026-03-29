import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../config';

// Base: https://api.clubdigital.cl/api
const BASE = Config.API_URL;
// Storage base for relative photo URLs
const STORAGE_BASE = BASE.replace('/api', '');

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
  initials?: string;
  rut?: string | null;
  email?: string | null;
  photo_url?: string | null;
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

// ── PROFESOR tipos ────────────────────────────────────────────
export type ProfesorTeam = {
  id: number;
  name: string;
  category: string | null;
  sport: string | null;
  player_count: number;
  next_event_date: string | null;
};

export type ProfesorPlayer = {
  id: number;             // pupil_id
  name: string;
  rut: string | null;
  photo: string | null;
  number: number | null;
  position: string | null;
  birth_date: string | null;
  gender: string | null;
  status: 'active' | 'inactive' | 'injured';
  is_federado: boolean;
  injuries_count: number;
};

export type ProfesorEvent = {
  id: number;
  type: 'training' | 'match' | 'event';
  title: string;
  date: string;             // "YYYY-MM-DD"
  time: string | null;      // "HH:MM"
  location: string | null;
  venue: string | null;
  team_id: number;
  team_name: string | null;
  home_team: string | null;
  away_team: string | null;
  status: 'upcoming' | 'live' | 'finished';
  convocados: number;
  confirmados: number;
  my_result?: string | null;  // e.g. "2:1"
};

export type AsistenciaRegistro = {
  pupil_id: number;
  present: boolean;
  late?: boolean;
  notes?: string | null;
};

export type AsistenciaSession = {
  id: number;
  date: string;
  type: 'training' | 'match';
  title: string | null;
  team_id: number;
  submitted: boolean;
  total: number;
  present_count: number;
  absent_count: number;
  records: Array<{
    pupil_id: number;
    name: string;
    photo: string | null;
    present: boolean;
    late: boolean;
    notes: string | null;
  }>;
};

export type Lesion = {
  id: number;
  pupil_id: number;
  pupil_name: string;
  pupil_photo: string | null;
  type: string;         // "muscular", "ligamento", "fractura", "contusion", "otro"
  zone: string;         // "rodilla", "tobillo", "hombro", etc.
  severity: 'leve' | 'moderada' | 'grave';
  date_start: string;
  date_end: string | null;
  is_active: boolean;
  notes: string | null;
};

export type ConvocadoEstado = {
  pupil_id: number;
  name: string;
  photo: string | null;
  number: number | null;
  position: string | null;
  convocado: boolean;
  status: 'confirmed' | 'pending' | 'declined' | null;
};

function mapProfesorPlayer(raw: any): ProfesorPlayer {
  return {
    id:             raw.id ?? raw.pupil_id,
    name:           raw.full_name ?? raw.name ?? '',
    rut:            raw.rut ?? null,
    photo:          toAbsoluteUrl(raw.photo_url ?? raw.photo),
    number:         raw.number ?? null,
    position:       raw.position ?? null,
    birth_date:     raw.birth_date ?? null,
    gender:         raw.gender ?? null,
    status:         raw.status ?? 'active',
    is_federado:    raw.is_federado ?? raw.federado ?? false,
    injuries_count: raw.injuries_count ?? 0,
  };
}

function mapProfesorEvent(raw: any): ProfesorEvent {
  const dateRaw: string = raw.date ?? raw.fecha ?? '';
  const date = dateRaw.length > 10 ? dateRaw.slice(0, 10) : dateRaw;
  const time = dateRaw.length > 10 ? dateRaw.slice(11, 16) : (raw.time ?? raw.hora ?? null);
  return {
    id:          raw.id,
    type:        raw.type ?? raw.tipo ?? 'training',
    title:       raw.title ?? raw.titulo ?? '',
    date,
    time,
    location:    raw.location ?? raw.lugar ?? null,
    venue:       raw.venue ?? raw.recinto ?? null,
    team_id:     raw.team_id ?? raw.equipo_id,
    team_name:   raw.team_name ?? raw.equipo ?? null,
    home_team:   raw.home_team ?? null,
    away_team:   raw.away_team ?? null,
    status:      raw.status ?? 'upcoming',
    convocados:  raw.convocados ?? 0,
    confirmados: raw.confirmados ?? 0,
    my_result:   raw.resultado ?? null,
  };
}

function mapLesion(raw: any): Lesion {
  return {
    id:          raw.id,
    pupil_id:    raw.pupil_id ?? raw.deportista_id,
    pupil_name:  raw.pupil_name ?? raw.full_name ?? raw.name ?? '',
    pupil_photo: toAbsoluteUrl(raw.photo_url ?? raw.photo),
    type:        raw.type ?? raw.tipo ?? 'otro',
    zone:        raw.zone ?? raw.zona ?? '',
    severity:    raw.severity ?? raw.gravedad ?? 'leve',
    date_start:  raw.date_start ?? raw.fecha_inicio ?? '',
    date_end:    raw.date_end ?? raw.fecha_fin ?? null,
    is_active:   raw.is_active ?? raw.activa ?? true,
    notes:       raw.notes ?? raw.observaciones ?? null,
  };
}

export const Profesor = {
  getMe: () => request<MeResponse>('GET', '/profesor/me'),

  // Equipos
  teams: async (): Promise<ProfesorTeam[]> => {
    const res = await request<any>('GET', '/profesor/teams');
    const arr = Array.isArray(res) ? res : (res.data ?? []);
    return arr.map((r: any) => ({
      id:              r.id,
      name:            r.name ?? r.nombre ?? '',
      category:        r.category ?? r.categoria ?? null,
      sport:           r.sport ?? r.deporte ?? null,
      player_count:    r.player_count ?? r.total_jugadores ?? 0,
      next_event_date: r.next_event_date ?? null,
    }));
  },

  // Jugadores de un equipo
  players: async (teamId: number): Promise<ProfesorPlayer[]> => {
    const res = await request<any>('GET', `/profesor/teams/${teamId}/players`);
    const arr = Array.isArray(res) ? res : (res.data ?? []);
    return arr.map(mapProfesorPlayer);
  },

  // Eventos / Agenda
  events: async (teamId: number, from: string, to: string): Promise<ProfesorEvent[]> => {
    const res = await request<any>('GET', `/profesor/teams/${teamId}/events?from=${from}&to=${to}`);
    const arr = Array.isArray(res) ? res : (res.data ?? []);
    return arr.map(mapProfesorEvent);
  },

  allEvents: async (from: string, to: string): Promise<ProfesorEvent[]> => {
    const res = await request<any>('GET', `/profesor/events?from=${from}&to=${to}`);
    const arr = Array.isArray(res) ? res : (res.data ?? []);
    return arr.map(mapProfesorEvent);
  },

  createEvent: (data: {
    team_id: number; type: string; title: string; date: string;
    time?: string; location?: string; venue?: string;
    home_team?: string; away_team?: string; notes?: string;
  }) => request<ProfesorEvent>('POST', '/profesor/events', data),

  // Asistencia
  attendanceSessions: async (teamId: number): Promise<AsistenciaSession[]> => {
    const res = await request<any>('GET', `/profesor/teams/${teamId}/attendance`);
    const arr = Array.isArray(res) ? res : (res.data ?? []);
    return arr;
  },

  attendanceDetail: (sessionId: number): Promise<AsistenciaSession> =>
    request<AsistenciaSession>('GET', `/profesor/attendance/${sessionId}`),

  createAttendanceSession: (teamId: number, data: { date: string; type: string; title?: string }): Promise<AsistenciaSession> =>
    request<AsistenciaSession>('POST', `/profesor/teams/${teamId}/attendance`, data),

  submitAttendance: (sessionId: number, records: AsistenciaRegistro[]) =>
    request<{ ok: boolean }>('POST', `/profesor/attendance/${sessionId}/submit`, { records }),

  // Convocatorias
  convocatoria: async (eventId: number): Promise<ConvocadoEstado[]> => {
    const res = await request<any>('GET', `/profesor/events/${eventId}/convocatoria`);
    const arr = Array.isArray(res) ? res : (res.data ?? []);
    return arr.map((r: any): ConvocadoEstado => ({
      pupil_id:   r.pupil_id ?? r.id,
      name:       r.full_name ?? r.name ?? '',
      photo:      toAbsoluteUrl(r.photo_url ?? r.photo),
      number:     r.number ?? null,
      position:   r.position ?? null,
      convocado:  r.convocado ?? false,
      status:     r.status ?? null,
    }));
  },

  updateConvocatoria: (eventId: number, pupilIds: number[]) =>
    request<{ ok: boolean }>('PUT', `/profesor/events/${eventId}/convocatoria`, { pupil_ids: pupilIds }),

  // Lesiones
  injuries: async (teamId: number): Promise<Lesion[]> => {
    const res = await request<any>('GET', `/profesor/teams/${teamId}/injuries`);
    const arr = Array.isArray(res) ? res : (res.data ?? []);
    return arr.map(mapLesion);
  },

  playerInjuries: async (pupilId: number): Promise<Lesion[]> => {
    const res = await request<any>('GET', `/profesor/players/${pupilId}/injuries`);
    const arr = Array.isArray(res) ? res : (res.data ?? []);
    return arr.map(mapLesion);
  },

  createInjury: (data: {
    pupil_id: number; team_id?: number; type: string; zone: string; severity: string;
    date_start: string; notes?: string;
  }): Promise<Lesion> =>
    request<Lesion>('POST', '/profesor/injuries', data),

  closeInjury: (injuryId: number, data: { date_end: string; notes?: string }): Promise<Lesion> =>
    request<Lesion>('PATCH', `/profesor/injuries/${injuryId}/close`, data),
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
  federado: boolean | null;
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

function toAbsoluteUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return STORAGE_BASE + (url.startsWith('/') ? '' : '/') + url;
}

function toStr(v: any): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v || null;
  // Backend may return object { id, name, ... } instead of plain string
  if (typeof v === 'object') return (v.name ?? v.label ?? v.category ?? String(v)) || null;
  return String(v) || null;
}

function mapPupil(raw: PupilRaw): Pupil {
  const anyRaw = raw as any;
  return {
    id:         raw.id,
    name:       raw.full_name ?? `${raw.name} ${raw.lastname}`.trim(),
    rut:        raw.rut,
    team:       toStr(raw.team ?? anyRaw.equipo ?? anyRaw.team_name),
    category:   toStr(raw.category ?? anyRaw.categoria ?? anyRaw.feba_category ?? anyRaw.age_group ?? anyRaw.division),
    photo:      toAbsoluteUrl(anyRaw.photo_url ?? raw.photo),
    birth_date: raw.birth_date ?? null,
    gender:     raw.gender ?? null,
    status:     raw.status,
    federado:   anyRaw.federado ?? anyRaw.is_federated ?? null,
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
  home_team?: string;
  away_team?: string;
  status?: 'upcoming' | 'live' | 'finished';
  my_status?: 'confirmed' | 'pending' | 'declined' | null;
  jersey_color?: string | null;       // color camiseta para el partido
  jersey_color_hex?: string | null;   // hex del color, ej. "#FF0000"
  presentation_time?: string | null;  // hora presentación, ej. "18:30"
  home_away?: 'home' | 'away' | null; // si jugamos de local o visita
  notes?: string | null;              // instrucciones del DT
};

export type RosterPlayer = {
  id: number;
  name: string;
  photo: string | null;
  number: number | null;
  position: string | null;
  status: 'confirmed' | 'pending' | 'declined';
};

function mapEvent(raw: any): Event {
  // Backend returns date as full ISO datetime "2026-03-25T20:00:00Z" or plain "2026-03-25"
  const rawDate: string = raw.date ?? raw.start_date ?? raw.scheduled_at ?? '';
  const dateOnly = rawDate.length >= 10 ? rawDate.slice(0, 10) : rawDate;
  const timeOnly = rawDate.length > 10
    ? rawDate.slice(11, 16)   // "20:00" from "2026-03-25T20:00:00Z"
    : (raw.time ?? undefined);
  return {
    id:                raw.id,
    type:              raw.type ?? 'event',
    title:             raw.title ?? raw.label ?? raw.name ?? 'Evento',
    date:              dateOnly,
    time:              timeOnly,
    location:          raw.location ?? raw.venue ?? undefined,
    venue:             raw.venue ?? raw.location ?? undefined,
    league:            raw.league ?? undefined,
    home_team:         raw.home_team ?? undefined,
    away_team:         raw.away_team ?? undefined,
    status:            raw.status ?? 'upcoming',
    my_status:         raw.my_status ?? raw.convocatoria_status ?? null,
    jersey_color:      raw.jersey_color ?? raw.color_camiseta ?? null,
    jersey_color_hex:  raw.jersey_color_hex ?? raw.color_hex ?? null,
    presentation_time: raw.presentation_time ?? raw.hora_presentacion ?? null,
    home_away:         raw.home_away ?? raw.local_visita ?? null,
    notes:             raw.notes ?? raw.instrucciones ?? raw.description ?? null,
  };
}

function mapRosterPlayer(raw: any): RosterPlayer {
  return {
    id:       raw.id,
    name:     raw.full_name ?? raw.name ?? '—',
    photo:    toAbsoluteUrl(raw.photo_url ?? raw.photo),
    number:   raw.number ?? raw.jersey_number ?? null,
    position: raw.position ?? raw.posicion ?? null,
    status:   raw.status ?? raw.convocatoria_status ?? 'pending',
  };
}

export const Events = {
  list: async (pupilId: number, from?: string, to?: string, type = 'all'): Promise<Event[]> => {
    const params = new URLSearchParams({ type });
    if (from) params.append('from', from);
    if (to)   params.append('to', to);
    const url = `/apoderado/pupils/${pupilId}/events?${params}`;
    console.log('[Events] GET', url);
    const res = await request<any[] | { data: any[] }>('GET', url);
    console.log('[Events] raw response:', JSON.stringify(res));
    const raw = Array.isArray(res) ? res : ((res as any).data ?? []);
    return raw.filter((e: any) => e && e.id != null).map(mapEvent);
  },

  detail: async (pupilId: number, eventId: number): Promise<Event> => {
    const res = await request<any>('GET', `/apoderado/pupils/${pupilId}/events/${eventId}`);
    return mapEvent(Array.isArray(res) ? res[0] : ((res as any).data ?? res));
  },

  roster: async (eventId: number): Promise<RosterPlayer[]> => {
    const res = await request<any>('GET', `/apoderado/events/${eventId}/roster`);
    const raw = Array.isArray(res) ? res : ((res as any).data ?? []);
    return raw.filter((p: any) => p && p.id != null).map(mapRosterPlayer);
  },

  respond: async (eventId: number, pupilId: number, status: 'confirmed' | 'declined'): Promise<void> => {
    await request<any>('POST', `/apoderado/events/${eventId}/roster/${pupilId}/respond`, { status });
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
    const raw = Array.isArray(res) ? res : ((res as any).data ?? []);
    return raw
      .filter((d: any) => d && d.id != null)
      .map((d: any): Documento => ({
        id:     d.id,
        title:  d.title ?? d.name ?? d.tipo ?? 'Documento',
        type:   d.type ?? d.tipo ?? 'document',
        status: d.status ?? d.estado ?? 'pending_signature',
        date:   d.date ?? d.created_at ?? '',
        due:    d.due ?? d.due_date ?? d.fecha_vencimiento ?? undefined,
      }));
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
export type NotifPrefs = {
  pagos: boolean;
  asistencia: boolean;
  comunicados: boolean;
  agenda: boolean;
  justificativos: boolean;
};

export const NotificationsAPI = {
  registerToken: (push_token: string) =>
    request<{ ok: boolean }>('POST', '/apoderado/me/devices', { push_token }),
  getPrefs: () =>
    request<NotifPrefs>('GET', '/apoderado/me/notifications'),
  updatePrefs: (prefs: Partial<NotifPrefs>) =>
    request<NotifPrefs>('PATCH', '/apoderado/me/notifications', prefs),
};

// ── 12. INBOX DE NOTIFICACIONES ──────────────────────────────
export type InboxNotif = {
  id: number;
  title: string;
  body: string;
  type: 'pago' | 'comunicado' | 'justificativo' | 'documento' | 'agenda' | 'asistencia' | 'general';
  screen?: string;
  params?: Record<string, unknown>;
  read: boolean;
  created_at: string;
};

export const InboxAPI = {
  list: () => request<InboxNotif[]>('GET', '/apoderado/me/inbox'),
  markRead: (id: number) => request<{ ok: boolean }>('POST', `/apoderado/me/inbox/${id}/read`),
  markAllRead: () => request<{ ok: boolean }>('POST', '/apoderado/me/inbox/read-all'),
};

// ── 13. HORARIO SEMANAL ───────────────────────────────────────
export type ScheduleEntry = {
  id: string;
  day_of_week: number;   // 0=Dom, 1=Lun, ..., 6=Sáb
  time_start: string;    // "18:00"
  time_end: string;      // "20:00"
  type: 'training' | 'match' | 'practice' | 'other';
  venue: string;
  notes?: string;
};

export const Schedule = {
  list: (clubId: number, category?: string) => {
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    return request<ScheduleEntry[]>('GET', `/clubs/${clubId}/schedule${q}`);
  },
};

// ── 13. PERMISOS DEPORTIVOS ───────────────────────────────────
export type PermisoDeportivo = {
  id: number;
  event_id: number;
  event_title: string;
  event_date: string;
  school_name: string;
  grade: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  certificate_url?: string | null;
  created_at: string;
};

export const PermisoDeportivos = {
  list: (pupilId: number) =>
    request<PermisoDeportivo[]>('GET', `/apoderado/pupils/${pupilId}/permisos-deportivos`),
  submit: (pupilId: number, data: {
    event_id: number;
    school_name: string;
    grade: string;
    notes?: string;
  }) =>
    request<PermisoDeportivo>('POST', `/apoderado/pupils/${pupilId}/permisos-deportivos`, data),
};

// ── 14. CLUB (info pública, módulos, configuración, institucional) ──
export type ClubInfoBasica = {
  nombre: string;
  logo_url: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
};

export type ModuloEstado = {
  clave: string;         // e.g. "pagos", "comunicados", "asistencia"
  nombre: string;        // display name
  habilitado: boolean;
  es_nuevo: boolean;     // true si fue habilitado en los últimos 7 días
  descripcion?: string | null;
};

export type ClubModulos = {
  modulos: ModuloEstado[];
};

export type ClubConfiguracion = {
  notificaciones_ttl_dias: number;
  convocatoria_recordatorio_horas: number;
  resultados_encuestas_visibles: boolean;
};

export type ClubInstitucional = {
  descripcion: string | null;
  logo_url: string | null;
  historia: string | null;
  directiva: Array<{ nombre: string; cargo: string; foto_url: string | null }>;
  coaches: Array<{ nombre: string; cargo: string; certificacion: string | null; foto_url: string | null }>;
};

export const Club = {
  infoBasica:       (clubId: number) =>
    request<ClubInfoBasica>('GET', `/club/${clubId}/info-basica`),
  modulosHabilitados: (clubId: number) =>
    request<ClubModulos>('GET', `/club/${clubId}/modulos-habilitados`),
  configuracion:    (clubId: number) =>
    request<ClubConfiguracion>('GET', `/club/${clubId}/configuracion`),
  institucional:    (clubId: number) =>
    request<ClubInstitucional>('GET', `/club/${clubId}/institucional`),
};

// ── 15. INBOX — extensión con archivado (US03, US04) ─────────
// Extiende InboxAPI ya existente
export const InboxArchiveAPI = {
  archive:    (id: number) =>
    request<{ ok: boolean }>('PATCH', `/apoderado/me/inbox/${id}/archivar`),
  listArchived: () =>
    request<InboxNotif[]>('GET', '/apoderado/me/inbox/archivadas'),
};

// ── 16. CONSULTAS al club (US06) ─────────────────────────────
export type Consulta = {
  id: number;
  asunto: string;
  mensaje: string;
  created_at: string;
  estado: 'enviado' | 'leido' | 'respondido';
};

export const Consultas = {
  enviar: (clubId: number, data: { asunto: string; mensaje: string; hijo_id: number }) =>
    request<{ id: number; created_at: string; estado: 'enviado' }>(
      'POST', `/club/${clubId}/consultas`, data,
    ),
  historial: (clubId: number) =>
    request<Consulta[]>('GET', `/apoderado/consultas?club_id=${clubId}`),
};

// ── 17. JUSTIFICATIVOS — extensión (US07, US08) ──────────────
// Tipos extendidos sobre el Justificativo ya existente
export type JustificativoMotivo = 'enfermedad' | 'lesion' | 'otros';

export type JustificativoV2 = {
  id: number;
  actividad_id: number | null;
  hijo_id: number;
  motivo: JustificativoMotivo;
  descripcion: string | null;
  estado: 'pendiente' | 'acusado';
  acusado_at: string | null;
  tiene_pdf: boolean;
  pdf_url: string | null;
  created_at: string;
};

export const JustificativosV2 = {
  submit: (data: {
    actividad_id?: number;
    hijo_id: number;
    motivo: JustificativoMotivo;
    descripcion?: string;
  }) =>
    request<JustificativoV2>('POST', '/api/justificativos', data),

  delete: (id: number) =>
    request<{ ok: boolean }>('DELETE', `/api/justificativos/${id}`),

  get: (id: number) =>
    request<JustificativoV2>('GET', `/api/justificativos/${id}`),

  pdfStatus: (id: number) =>
    request<{ tiene_pdf: boolean; pdf_url: string | null; generated_at: string | null }>(
      'GET', `/api/justificativos/${id}/pdf-status`,
    ),

  generarPdf: (id: number) =>
    request<{ pdf_url: string; generated_at: string }>(
      'POST', `/api/justificativos/${id}/generar-pdf`,
    ),
};

// ── 18. ENCUESTAS (US11) ──────────────────────────────────────
export type EncuestaResumen = {
  id: number;
  titulo: string;
  estado: 'abierta' | 'cerrada';
  fecha_cierre: string | null;
  respondida: boolean;
};

export type PreguntaTipo = 'opcion_multiple' | 'texto_libre' | 'escala';

export type Pregunta = {
  id: number;
  tipo: PreguntaTipo;
  texto: string;
  opciones?: string[];
  requerida: boolean;
};

export type EncuestaDetalle = {
  id: number;
  titulo: string;
  preguntas: Pregunta[];
  estado: 'abierta' | 'cerrada';
  resultados_visibles: boolean;
};

export type RespuestaItem = { pregunta_id: number; valor: string | number };

export const Encuestas = {
  list: (clubId: number, hijoId: number) =>
    request<EncuestaResumen[]>('GET', `/encuestas?club_id=${clubId}&hijo_id=${hijoId}`),

  get: (id: number) =>
    request<EncuestaDetalle>('GET', `/encuestas/${id}`),

  submit: (id: number, respuestas: RespuestaItem[]) =>
    request<{ ok: boolean }>('POST', `/encuestas/${id}/respuestas`, { respuestas }),

  misRespuestas: (id: number) =>
    request<{ respuestas: RespuestaItem[] }>('GET', `/encuestas/${id}/mis-respuestas`),

  resultados: (id: number) =>
    request<{ resumen: Array<{ pregunta_id: number; distribucion: Record<string, number> }> }>(
      'GET', `/encuestas/${id}/resultados`,
    ),
};

// ── 19. CONVOCATORIAS (US15) ──────────────────────────────────
export type ConvocatoriaRespuesta = 'si' | 'no' | 'sin_respuesta';

export type Convocatoria = {
  id: number;
  evento: string;
  fecha: string;
  fecha_limite: string;
  respuesta: ConvocatoriaRespuesta;
};

export const Convocatorias = {
  list: (hijoId: number) =>
    request<Convocatoria[]>('GET', `/convocatorias?hijo_id=${hijoId}`),

  responder: (id: number, respuesta: 'si' | 'no') =>
    request<{ ok: boolean }>('PATCH', `/convocatorias/${id}/respuesta`, { respuesta }),
};

// ── 20. TIENDA (US17) ─────────────────────────────────────────
export type ProductoTienda = {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen_url: string | null;
  tallas?: string[];
};

export type SolicitudTiendaItem = {
  producto_id: number;
  cantidad: number;
  talla?: string;
};

export type SolicitudTienda = {
  id: number;
  items: Array<SolicitudTiendaItem & { nombre: string; precio: number }>;
  estado: 'pendiente' | 'acusado';
  created_at: string;
  acusado_at: string | null;
};

export const Tienda = {
  catalogo: (clubId: number) =>
    request<ProductoTienda[]>('GET', `/club/${clubId}/tienda/productos`),

  crearSolicitud: (data: { hijo_id: number; items: SolicitudTiendaItem[] }) =>
    request<{ id: number; estado: 'pendiente'; created_at: string }>(
      'POST', '/tienda/solicitudes', data,
    ),

  misSolicitudes: () =>
    request<SolicitudTienda[]>('GET', '/apoderado/tienda/solicitudes'),

  editarSolicitud: (id: number, items: SolicitudTiendaItem[]) =>
    request<SolicitudTienda>('PUT', `/tienda/solicitudes/${id}`, { items }),

  eliminarSolicitud: (id: number) =>
    request<{ ok: boolean }>('DELETE', `/tienda/solicitudes/${id}`),
};

// ── 21. BENEFICIOS — extensión con origen y condiciones (US18) ─
export type BeneficioV2 = {
  id: number;
  titulo: string;
  descripcion: string;
  condiciones: string;
  origen: 'club' | 'plataforma';
  vigencia_hasta: string;
  imagen_url: string | null;
};

export const BeneficiosV2 = {
  list: (clubId: number) =>
    request<BeneficioV2[]>('GET', `/beneficios?club_id=${clubId}`),
};

// ── 22. ADS / PUBLICIDAD (US19) ───────────────────────────────
export type Ad = {
  id: number;
  imagen_url: string;
  url_destino: string | null;
  vigencia_hasta: string;
};

export const AdsAPI = {
  list: (clubId: number, hijoId: number) =>
    request<Ad[]>('GET', `/ads?club_id=${clubId}&hijo_id=${hijoId}`),
};

// ── 23. DISPOSITIVOS / TOKEN PUSH (US13) ─────────────────────
export const DispositivosAPI = {
  registerToken: (push_token: string, plataforma: 'android' | 'ios') =>
    request<{ ok: boolean }>('POST', '/apoderado/dispositivos/token', { push_token, plataforma }),
};

// ── 24. HORARIOS DEL CLUB (US10) ──────────────────────────────
export type HorarioClub = {
  id: number;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  lugar: string;
  categoria: string;
  descripcion?: string;
};

export type HorarioHijo = {
  id: number;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  lugar: string;
  categoria: string;
};

export const Horarios = {
  misHorarios: (hijoId: number) =>
    request<HorarioHijo[]>('GET', `/apoderado/horarios?hijo_id=${hijoId}`),
  horariosClub: (clubId: number) =>
    request<HorarioClub[]>('GET', `/club/${clubId}/horarios`),
};
