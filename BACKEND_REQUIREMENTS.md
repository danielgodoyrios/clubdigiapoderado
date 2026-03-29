# ClubDigi — Requerimientos de Backend API

**Base URL:** `https://api.clubdigital.cl/v1`  
**Protocolo:** HTTPS · REST · JSON  
**Autenticación:** Bearer Token (JWT) en header `Authorization: Bearer <token>`  
**Formato fechas:** ISO 8601 (`2026-04-05T20:00:00Z`)  
**Formato montos:** entero en CLP (ej. `25000`, NO strings con `$`)

---

## 1. AUTENTICACIÓN (Onboarding)

### 1.1 Solicitar OTP por teléfono
```
POST /auth/otp/request
```
**Body:**
```json
{ "phone": "+56987654321" }
```
**Response 200:**
```json
{ "message": "OTP enviado", "expires_in": 300 }
```

---

### 1.2 Verificar OTP y obtener token
```
POST /auth/otp/verify
```
**Body:**
```json
{ "phone": "+56987654321", "code": "123456" }
```
**Response 200:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```
**Response 401:** `{ "error": "OTP inválido o expirado" }`

---

### 1.3 Renovar token
```
POST /auth/refresh
```
**Body:**
```json
{ "refresh_token": "eyJ..." }
```
**Response 200:**
```json
{ "access_token": "eyJ...", "expires_in": 86400 }
```

---

## 2. APODERADO (Usuario logueado)

### 2.1 Obtener perfil del apoderado
```
GET /apoderado/me
```
**Response 200:**
```json
{
  "id": "usr_001",
  "name": "Carlos Muñoz",
  "initials": "CM",
  "rut": "18.234.567-k",
  "phone": "+56987654321",
  "email": "carlos@email.com"
}
```

---

### 2.2 Actualizar perfil del apoderado
```
PUT /apoderado/me
```
**Body:**
```json
{
  "name": "Carlos Muñoz",
  "email": "carlos@email.com"
}
```
**Response 200:** perfil actualizado (mismo formato que GET)

---

## 3. PUPILOS

### 3.1 Listar pupilos del apoderado
```
GET /apoderado/me/pupils
```
**Response 200:**
```json
[
  {
    "id": "pup_001",
    "name": "Carlos Muñoz Jr.",
    "initials": "CM",
    "number": 8,
    "category": "Alevín",
    "club": "C.D. Santo Domingo",
    "club_id": "club_001",
    "attendance_pct": 92,
    "license_id": "LIC-2026-0892",
    "quota_pending": true
  }
]
```

---

### 3.2 Actualizar datos de un pupilo
```
PUT /apoderado/me/pupils/{pupil_id}
```
**Body:**
```json
{
  "name": "Carlos Muñoz Jr.",
  "number": 8,
  "category": "Alevín"
}
```
**Response 200:** pupilo actualizado (mismo formato que listado)

---

## 4. AGENDA / PARTIDOS

### 4.1 Obtener eventos de un pupilo
```
GET /pupils/{pupil_id}/events
```
**Query params:**
- `from` (fecha ISO, ej. `2026-03-01`)
- `to` (fecha ISO, ej. `2026-03-31`)
- `type` (opcional): `training` | `match` | `all` (default: `all`)

**Response 200:**
```json
[
  {
    "id": "evt_001",
    "type": "match",
    "title": "C.D. Santo Domingo vs Quilpué BC",
    "home_team": "C.D. Santo Domingo",
    "away_team": "Quilpué BC",
    "date": "2026-03-25T20:00:00Z",
    "venue": "Gimnasio Municipal",
    "league": "Liga Regional Valparaíso",
    "status": "upcoming"
  },
  {
    "id": "evt_002",
    "type": "training",
    "title": "Entrenamiento Alevín",
    "date": "2026-03-26T18:00:00Z",
    "venue": "Cancha Techada",
    "status": "upcoming"
  }
]
```

---

## 5. ASISTENCIA

### 5.1 Resumen de asistencia mensual de un pupilo
```
GET /pupils/{pupil_id}/attendance/summary
```
**Query params:**
- `months` (int, default: `6`): cuántos meses hacia atrás incluir

**Response 200:**
```json
[
  {
    "month": "2026-03",
    "month_label": "Marzo 2026",
    "sessions_total": 12,
    "sessions_present": 11,
    "sessions_absent": 1,
    "attendance_pct": 92
  }
]
```

---

### 5.2 Detalle de sesiones de un mes específico
```
GET /pupils/{pupil_id}/attendance/{year}/{month}
```
**Response 200:**
```json
{
  "month_label": "Marzo 2026",
  "attendance_pct": 92,
  "sessions": [
    {
      "id": "ses_001",
      "date": "2026-03-04T18:00:00Z",
      "type": "training",
      "label": "Entrenamiento",
      "present": true,
      "justified": false
    },
    {
      "id": "ses_002",
      "date": "2026-03-07T20:00:00Z",
      "type": "match",
      "label": "Partido vs Quilpué BC",
      "present": false,
      "justified": true,
      "justification": "Enfermedad"
    }
  ]
}
```

---

## 6. PAGOS

### 6.1 Listar pagos de un pupilo
```
GET /pupils/{pupil_id}/payments
```
**Response 200:**
```json
{
  "pending": [
    {
      "id": "pay_001",
      "concept": "Cuota Abril 2026",
      "amount": 25000,
      "due_date": "2026-04-05",
      "status": "pending"
    }
  ],
  "history": [
    {
      "id": "pay_002",
      "concept": "Cuota Marzo 2026",
      "amount": 25000,
      "paid_date": "2026-03-03",
      "status": "paid",
      "receipt_url": "https://api.clubdigital.cl/receipts/pay_002.pdf"
    }
  ]
}
```

---

### 6.2 Iniciar pago (generar intención/link de pago)
```
POST /payments/{payment_id}/checkout
```
**Response 200:**
```json
{
  "payment_id": "pay_001",
  "checkout_url": "https://webpay.cl/...",
  "token": "abc123",
  "expires_at": "2026-04-05T23:59:59Z"
}
```
> El pago se procesa en la pasarela (Webpay, Flow, Khipu, etc.). El backend confirma vía webhook y actualiza el estado.

---

### 6.3 Confirmar estado de un pago (polling post-checkout)
```
GET /payments/{payment_id}
```
**Response 200:**
```json
{
  "id": "pay_001",
  "status": "paid",
  "paid_date": "2026-04-04T15:22:00Z",
  "receipt_url": "https://api.clubdigital.cl/receipts/pay_001.pdf"
}
```

---

## 7. COMUNICADOS

### 7.1 Listar comunicados de un pupilo
```
GET /pupils/{pupil_id}/comunicados
```
**Query params:**
- `page` (int, default: `1`)
- `per_page` (int, default: `20`)

**Response 200:**
```json
[
  {
    "id": "com_001",
    "title": "Cambio de horario entrenamiento",
    "preview": "A partir del lunes...",
    "category": "info",
    "date": "2026-03-20T10:00:00Z",
    "read": false
  },
  {
    "id": "com_002",
    "title": "Autorización viaje a Viña",
    "preview": "Se solicita firma...",
    "category": "action",
    "date": "2026-03-18T09:00:00Z",
    "read": true
  }
]
```
**Categorías válidas:** `info` | `action` | `admin`

---

### 7.2 Obtener detalle de un comunicado
```
GET /comunicados/{comunicado_id}
```
**Response 200:**
```json
{
  "id": "com_001",
  "title": "Cambio de horario entrenamiento",
  "category": "info",
  "date": "2026-03-20T10:00:00Z",
  "body": "Estimados apoderados, a partir del lunes...",
  "read": false,
  "requires_signature": false
}
```

---

### 7.3 Marcar comunicado como leído
```
POST /comunicados/{comunicado_id}/read
```
**Response 200:** `{ "ok": true }`

---

## 8. DOCUMENTOS

### 8.1 Listar documentos de un pupilo
```
GET /pupils/{pupil_id}/documentos
```
**Response 200:**
```json
{
  "pending": [
    {
      "id": "doc_001",
      "title": "Autorización Gira Viña del Mar",
      "description": "Firmar antes del 28 de Marzo",
      "due_date": "2026-03-28",
      "status": "pending"
    }
  ],
  "signed": [
    {
      "id": "doc_002",
      "title": "Autorización Torneo Copa Chile",
      "signed_date": "2026-02-15",
      "status": "signed"
    }
  ]
}
```

---

### 8.2 Obtener documento para firmar
```
GET /documentos/{documento_id}
```
**Response 200:**
```json
{
  "id": "doc_001",
  "title": "Autorización Gira Viña del Mar",
  "body": "Yo, Carlos Muñoz, autorizo a mi pupilo...",
  "requires_signature": true,
  "status": "pending",
  "due_date": "2026-03-28"
}
```

---

### 8.3 Firmar documento
```
POST /documentos/{documento_id}/sign
```
**Body:**
```json
{
  "signature_data": "base64_string_de_firma_o_confirmacion",
  "confirmed": true
}
```
**Response 200:**
```json
{
  "ok": true,
  "signed_date": "2026-03-24T15:30:00Z",
  "document_url": "https://api.clubdigital.cl/docs/doc_001_signed.pdf"
}
```

---

## 9. CARNET DIGITAL

### 9.1 Obtener token de carnet (QR/NFC)
```
GET /pupils/{pupil_id}/carnet/token
```
**Response 200:**
```json
{
  "token": "CDIGI-LIC2026-0892-XK9F",
  "qr_data": "https://api.clubdigital.cl/verify/CDIGI-LIC2026-0892-XK9F",
  "expires_at": "2026-03-24T16:05:00Z",
  "pupil": {
    "name": "Carlos Muñoz Jr.",
    "number": 8,
    "category": "Alevín",
    "club": "C.D. Santo Domingo",
    "license_id": "LIC-2026-0892",
    "photo_url": "https://api.clubdigital.cl/photos/pup_001.jpg"
  }
}
```
> Token expira en 5 minutos. La app solicita uno nuevo automáticamente.

---

### 9.2 Verificar token de carnet (uso del club/árbitro)
```
GET /verify/{token}
```
> Endpoint **público** (sin auth). El escáner QR hace un `GET` a esta URL — el código QR embebe la URL completa `https://api.clubdigital.cl/verify/{token}` y el dispositivo la abre en el navegador o vía deeplink. Responde a **GET únicamente** (no POST).

**Response 200:**
```json
{
  "valid": true,
  "name": "Carlos Muñoz Jr.",
  "category": "Alevín",
  "club": "C.D. Santo Domingo",
  "license_id": "LIC-2026-0892",
  "status": "active"
}
```
**Response 404/410:** `{ "valid": false, "reason": "Token expirado" }`

---

### 9.3 Enrolar carnet (vincular pupilo al carnet)
```
POST /pupils/{pupil_id}/carnet/enroll
```
**Body:**
```json
{ "enrollment_code": "CLB-2026-ABCD" }
```
**Response 200:**
```json
{ "ok": true, "license_id": "LIC-2026-0892" }
```
**Response 400:** `{ "error": "Código inválido o ya utilizado" }`

---

## 10. BENEFICIOS

### 10.1 Listar beneficios del club
```
GET /clubs/{club_id}/benefits
```
**Response 200:**
```json
[
  {
    "id": "ben_001",
    "name": "GymMax · 30% descuento",
    "description": "Presenta tu carnet en recepción",
    "type": "carnet",
    "active": true,
    "logo_url": "https://api.clubdigital.cl/benefits/gymmax.png"
  },
  {
    "id": "ben_002",
    "name": "Pizza Sport · 2x1",
    "type": "qr",
    "qr_data": "BENEFIT-BEN002-USR001",
    "active": true
  },
  {
    "id": "ben_003",
    "name": "SportShop · 15% off",
    "type": "code",
    "code": "IDEBASKET15",
    "active": true
  }
]
```
**Tipos válidos:** `carnet` | `qr` | `code`

---

## 11. JUSTIFICATIVOS MÉDICOS

> Solo motivos médicos (`enfermedad` | `lesion`) son considerados justificados por el club.

### 11.1 Listar justificativos de un pupilo
```
GET /apoderado/pupils/{pupil_id}/justificativos
```
**Response 200:**
```json
[
  {
    "id": 1,
    "date": "2026-03-19",
    "type": "enfermedad",
    "reason": "Fiebre alta",
    "days": 3,
    "file_url": "https://api.clubdigital.cl/files/cert_001.jpg",
    "status": "approved"
  },
  {
    "id": 2,
    "date": "2026-04-02",
    "type": "lesion",
    "reason": "Esguince tobillo derecho",
    "days": 7,
    "file_url": null,
    "status": "pending"
  }
]
```

---

### 11.2 Enviar justificativo médico
```
POST /apoderado/pupils/{pupil_id}/justificativos
```
**Body:**
```json
{
  "date": "2026-04-10",
  "type": "enfermedad",
  "reason": "Bronquitis aguda",
  "days": 5,
  "file_base64": "base64_de_imagen_opcional",
  "file_name": "certificado_2026-04-10.jpg"
}
```
**Campos:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `date` | string (YYYY-MM-DD) | ✅ | Fecha de ausencia |
| `type` | `'enfermedad'` \| `'lesion'` | ✅ | Tipo médico |
| `reason` | string | ✅ | Descripción del motivo |
| `days` | integer ≥ 1 | ✅ | Días de licencia médica |
| `file_base64` | string (base64) | ❌ | Imagen del certificado |
| `file_name` | string | ❌ | Nombre del archivo |

**Notas de implementación:**
- Si `file_base64` es enviado, el backend debe decodificarlo y guardarlo como imagen (JPG/PNG).
- `file_url` en la respuesta debe ser una URL accesible (firmada o pública).
- Al cambiar `status` a `approved` o `rejected`, enviar push notification al apoderado.
- La sesión correspondiente a `date` en asistencia debe actualizarse: `justified: true` cuando `status = 'approved'`.

**Response 201:**
```json
{
  "id": 3,
  "date": "2026-04-10",
  "type": "enfermedad",
  "reason": "Bronquitis aguda",
  "days": 5,
  "file_url": "https://api.clubdigital.cl/files/cert_003.jpg",
  "status": "pending"
}
```

---

## 12. NOTIFICACIONES (Push)

### 11.1 Registrar dispositivo para push notifications
```
POST /apoderado/me/devices
```
**Body:**
```json
{
  "push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "android",
  "device_id": "uuid-del-dispositivo"
}
```
**Response 200:** `{ "ok": true }`

---

### 11.2 Leer preferencias de notificación
```
GET /apoderado/me/notifications
```
**Response 200:**
```json
{
  "pagos":          true,
  "asistencia":     true,
  "comunicados":    true,
  "agenda":         false,
  "justificativos": true
}
```

---

### 11.3 Actualizar preferencias de notificación
```
PATCH /apoderado/me/notifications
```
> Usar `PATCH` (no `PUT`): solo los campos enviados se actualizan, el resto mantiene su valor actual.

**Body (campos opcionales, al menos uno requerido):**
```json
{
  "pagos":          true,
  "asistencia":     true,
  "comunicados":    true,
  "agenda":         false,
  "justificativos": true
}
```
- `justificativos` ← campo nuevo: notificar cuando el estado de un justificativo cambia (aprobado/rechazado).

**Response 200:** objeto completo con todos los campos actualizados

---

## 13. MANEJO DE ERRORES

Todos los endpoints deben retornar errores con este formato:

```json
{
  "error": "Descripción legible del error",
  "code": "ERROR_CODE",
  "details": {}
}
```

| HTTP Status | Uso |
|-------------|-----|
| `200` | OK |
| `201` | Creado |
| `400` | Parámetros inválidos |
| `401` | No autenticado / token inválido |
| `403` | Sin permisos |
| `404` | Recurso no encontrado |
| `409` | Conflicto (ej. código ya utilizado) |
| `422` | Entidad no procesable |
| `500` | Error interno del servidor |

---

## 14. SEGURIDAD

- Todo tráfico por **HTTPS** (TLS 1.2+)
- JWT con expiración máxima **24 horas** (access token) y **30 días** (refresh token)
- Rate limiting: máximo **60 req/min** por token
- El endpoint `/verify/{token}` tiene rate limiting por IP: **30 req/min**
- Datos sensibles (RUT, teléfono) **nunca en logs**
- Archivos subidos (firmas, fotos) solo accesibles vía URL firmada con expiración

---

## 15. RESUMEN DE ENDPOINTS

| # | Método | Endpoint | Descripción |
|---|--------|----------|-------------|
| 1 | POST | `/auth/otp/request` | Solicitar OTP |
| 2 | POST | `/auth/otp/verify` | Verificar OTP → JWT |
| 3 | POST | `/auth/refresh` | Renovar token |
| 4 | GET | `/apoderado/me` | Perfil apoderado |
| 5 | PUT | `/apoderado/me` | Actualizar perfil |
| 6 | GET | `/apoderado/me/pupils` | Listar pupilos |
| 7 | PUT | `/apoderado/me/pupils/{id}` | Actualizar pupilo |
| 8 | GET | `/pupils/{id}/events` | Agenda/partidos |
| 9 | GET | `/pupils/{id}/attendance/summary` | Resumen asistencia |
| 10 | GET | `/pupils/{id}/attendance/{year}/{month}` | Detalle asistencia |
| 11 | GET | `/pupils/{id}/payments` | Listar pagos |
| 12 | POST | `/payments/{id}/checkout` | Iniciar pago |
| 13 | GET | `/payments/{id}` | Estado de pago |
| 14 | GET | `/pupils/{id}/comunicados` | Listar comunicados |
| 15 | GET | `/comunicados/{id}` | Detalle comunicado |
| 16 | POST | `/comunicados/{id}/read` | Marcar como leído |
| 17 | GET | `/pupils/{id}/documentos` | Listar documentos |
| 18 | GET | `/documentos/{id}` | Documento para firmar |
| 19 | POST | `/documentos/{id}/sign` | Firmar documento |
| 20 | GET | `/pupils/{id}/carnet/token` | Token QR carnet |
| 21 | GET | `/verify/{token}` | Verificar carnet (público) |
| 22 | POST | `/pupils/{id}/carnet/enroll` | Enrolar carnet |
| 23 | GET | `/clubs/{id}/benefits` | Listar beneficios |
| 24 | GET | `/apoderado/pupils/{id}/justificativos` | Listar justificativos médicos |
| 25 | POST | `/apoderado/pupils/{id}/justificativos` | Enviar justificativo médico |
| 26 | POST | `/apoderado/me/devices` | Registrar push token |
| 27 | PUT | `/apoderado/me/notifications` | Preferencias notificaciones |

---

---

# ══════════════════════════════════════════════════════════════
# REQUERIMIENTO 2 — PROMPT COMPLETO PARA DESARROLLADOR BACKEND
# ══════════════════════════════════════════════════════════════

> Copia todo lo que está debajo de esta línea y pégalo al desarrollador backend de manera íntegra.

---

## CONTEXTO DEL PROYECTO

Estás construyendo el backend de **ClubDigi**, una aplicación móvil (React Native / Expo) para que apoderados de un club de básquetbol gestionen la participación de sus pupilos. La app ya está en producción en Play Store (versión interna). El backend debe exponer una **REST API en JSON** que la app consume mediante JWT Bearer tokens.

- **Base URL:** `https://api.clubdigital.cl/api`
- **Protocolo:** HTTPS obligatorio · REST · JSON
- **Autenticación:** `Authorization: Bearer <access_token>` en todos los endpoints protegidos
- **Formato fechas:** ISO 8601 — `YYYY-MM-DD` para fechas puras, `YYYY-MM-DDTHH:MM:SSZ` para timestamps
- **Formato montos:** entero en CLP sin decimales ni símbolo (ej. `25000`)
- **Content-Type:** `application/json` en todos los requests y responses
- **Charset:** UTF-8

---

## REGLAS GLOBALES DE VALIDACIÓN

Aplican a **todos** los endpoints salvo que se indique lo contrario.

### Autenticación y autorización
| Regla | Detalle |
|-------|---------|
| Token ausente | `401 Unauthorized` — `{ "error": "Token requerido", "code": "AUTH_MISSING" }` |
| Token inválido o malformado | `401` — `{ "error": "Token inválido", "code": "AUTH_INVALID" }` |
| Token expirado | `401` — `{ "error": "Token expirado", "code": "AUTH_EXPIRED" }` |
| Recurso de otro usuario | `403 Forbidden` — `{ "error": "Sin permisos", "code": "FORBIDDEN" }` |
| Pupilo no pertenece al apoderado | `403` — `{ "error": "Este pupilo no te pertenece", "code": "PUPIL_FORBIDDEN" }` |

### Formato de todos los errores
Todos los errores, sin excepción, usan este envelope:
```json
{
  "error": "Mensaje legible en español para el usuario",
  "code":  "ERROR_CODE_EN_MAYUSCULAS",
  "details": {
    "field": "nombre_del_campo_con_error",
    "value": "valor_recibido"
  }
}
```
- `details` es **opcional** y solo se incluye cuando hay un campo específico que causó el error.
- `error` siempre en español, sin jerga técnica.

### Paginación (cuando aplique)
- Query params: `?page=1&per_page=20`
- Response incluye header `X-Total-Count: 42` con el total de registros sin paginar.
- Si no se proveen, usar valores por defecto: `page=1`, `per_page=20`.

### Rate limiting
| Endpoint | Límite |
|----------|--------|
| Todos los autenticados | 60 req/min por token |
| `POST /auth/otp/request` | 5 req/min por IP (anti-spam) |
| `GET /verify/{token}` (público) | 30 req/min por IP |
- Respuesta al superar límite: `429 Too Many Requests` — `{ "error": "Demasiadas solicitudes", "code": "RATE_LIMIT", "retry_after": 60 }`

---

## MÓDULO 1 — AUTENTICACIÓN

### POST /auth/otp/request
Envío de OTP por SMS al teléfono del apoderado.

**Validaciones:**
- `phone` requerido · string
- Formato válido: E.164 international (`+56XXXXXXXXX`) — rechazar si no coincide con regex `^\+[1-9]\d{7,14}$`
- Si el número no está registrado: crear usuario nuevo con `is_new: true`

**Errores específicos:**
| Caso | HTTP | code |
|------|------|------|
| `phone` ausente | 400 | `PHONE_REQUIRED` |
| Formato inválido | 400 | `PHONE_INVALID` |
| Proveedor SMS caído | 503 | `SMS_UNAVAILABLE` |

**Response 200:**
```json
{ "message": "OTP enviado", "phone": "+56987654321", "expires_in": 300 }
```
- El OTP expira en **5 minutos**.
- Máximo **3 intentos** de reenvío antes de bloquear el número por 15 minutos.

---

### POST /auth/otp/verify
Verificar el código OTP y emitir JWT.

**Validaciones:**
- `phone` requerido — mismo formato E.164
- `code` requerido — exactamente 6 dígitos numéricos (`^\d{6}$`)
- OTP debe existir en BD, no estar expirado y pertenecer al teléfono

**Errores específicos:**
| Caso | HTTP | code |
|------|------|------|
| `code` ausente | 400 | `CODE_REQUIRED` |
| Formato inválido (no 6 dígitos) | 400 | `CODE_INVALID_FORMAT` |
| OTP incorrecto | 401 | `OTP_WRONG` |
| OTP expirado | 401 | `OTP_EXPIRED` |
| Demasiados intentos fallidos (5+) | 429 | `OTP_BLOCKED` |

**Response 200:**
```json
{
  "access_token":  "eyJ...",
  "refresh_token": "eyJ...",
  "token_type":    "Bearer",
  "expires_in":    86400,
  "user": {
    "id":      1,
    "name":    "Carlos Muñoz",
    "phone":   "+56987654321",
    "roles":   ["apoderado"],
    "is_new":  false,
    "club_id": 1
  }
}
```
- Tras emitir token, invalidar el OTP usado (no reutilizable).
- `is_new: true` si es la primera vez que el usuario inicia sesión.

---

### POST /auth/refresh
Renovar access token usando refresh token.

**Validaciones:**
- `refresh_token` requerido · string
- Debe existir en BD y no haber sido revocado ni expirado

**Errores:**
| Caso | HTTP | code |
|------|------|------|
| Ausente | 400 | `REFRESH_TOKEN_REQUIRED` |
| Inválido | 401 | `REFRESH_TOKEN_INVALID` |
| Expirado (30 días) | 401 | `REFRESH_TOKEN_EXPIRED` |

**Response 200:**
```json
{ "access_token": "eyJ...", "expires_in": 86400 }
```

---

## MÓDULO 2 — APODERADO (perfil)

### GET /apoderado/me
Perfil del apoderado autenticado. No recibe parámetros.

**Response 200:**
```json
{
  "id":       1,
  "name":     "Carlos Muñoz",
  "initials": "CM",
  "rut":      "18.234.567-k",
  "phone":    "+56987654321",
  "email":    "carlos@email.com",
  "photo_url": null
}
```
- `initials` se calcula en backend: primeras letras de cada palabra del nombre, máx 2 caracteres, mayúsculas.
- `rut` puede ser null si no está registrado.

---

### PUT /apoderado/me
Actualizar datos del perfil.

**Validaciones:**
- `name` opcional · string · mín 2 chars · máx 100 chars · solo letras, espacios y tildes
- `email` opcional · formato válido RFC 5322 · máx 200 chars
- No se puede cambiar `phone` por este endpoint (es el identificador de auth)
- Al menos un campo debe estar presente; si el body está vacío: `400 EMPTY_BODY`

**Errores:**
| Campo | Caso | code |
|-------|------|------|
| `name` | Menos de 2 chars | `NAME_TOO_SHORT` |
| `name` | Más de 100 chars | `NAME_TOO_LONG` |
| `email` | Formato inválido | `EMAIL_INVALID` |
| — | Body vacío / sin campos | `EMPTY_BODY` |

**Response 200:** objeto apoderado completo (mismo formato que GET).

---

## MÓDULO 3 — PUPILOS

### GET /apoderado/me/pupils
Listar pupilos vinculados al apoderado autenticado.

**Response 200:**
```json
[
  {
    "id":             1,
    "name":           "Carlos Muñoz Jr.",
    "initials":       "CM",
    "number":         8,
    "category":       "Alevín",
    "club":           "C.D. Santo Domingo",
    "club_id":        1,
    "attendance_pct": 92,
    "license_id":     "LIC-2026-0892",
    "quota_pending":  true,
    "photo_url":      "https://api.clubdigital.cl/photos/pup_001.jpg"
  }
]
```
- Si el apoderado no tiene pupilos: devolver `[]` (no 404).
- `attendance_pct` es el porcentaje de asistencia de los últimos 3 meses (entero 0-100).
- `quota_pending: true` si tiene pagos con estado `pending`.

---

### PUT /apoderado/me/pupils/{pupil_id}
Actualizar datos de un pupilo.

**Validaciones:**
- `pupil_id` debe pertenecer al apoderado autenticado → `403 PUPIL_FORBIDDEN` si no
- `name` opcional · mín 2 · máx 100 chars
- `number` opcional · entero 0-99
- `category` opcional · máx 50 chars
- `photo_base64` opcional · imagen JPG/PNG base64 · máx 5MB decodificado

**Errores:**
| Caso | code |
|------|------|
| Pupilo no existe | `PUPIL_NOT_FOUND` (404) |
| Pupilo de otro apoderado | `PUPIL_FORBIDDEN` (403) |
| `number` fuera de rango | `NUMBER_OUT_OF_RANGE` (400) |
| `photo_base64` supera 5MB | `PHOTO_TOO_LARGE` (400) |
| Formato de imagen inválido | `PHOTO_INVALID_FORMAT` (400) |

---

## MÓDULO 4 — AGENDA / PARTIDOS

### GET /pupils/{pupil_id}/events

**Filtros (query params):**
| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `from` | YYYY-MM-DD | hoy | Fecha inicio |
| `to` | YYYY-MM-DD | hoy + 90 días | Fecha término |
| `type` | `training\|match\|all` | `all` | Tipo de evento |

**Validaciones:**
- `from` y `to` deben ser fechas válidas ISO — `400 DATE_INVALID` si no lo son
- `to` no puede ser anterior a `from` — `400 DATE_RANGE_INVALID`
- Rango máximo 365 días — `400 DATE_RANGE_TOO_WIDE`
- `pupil_id` debe pertenecer al apoderado — `403 PUPIL_FORBIDDEN`

**Response 200:**
```json
[
  {
    "id":         "evt_001",
    "type":       "match",
    "title":      "C.D. Santo Domingo vs Quilpué BC",
    "home_team":  "C.D. Santo Domingo",
    "away_team":  "Quilpué BC",
    "date":       "2026-03-25T20:00:00Z",
    "venue":      "Gimnasio Municipal",
    "league":     "Liga Regional Valparaíso",
    "status":     "upcoming",
    "result":     null
  }
]
```
- `status` puede ser: `upcoming` | `live` | `finished` | `cancelled`
- `result` solo presente si `status = finished`: `{ "home": 72, "away": 68 }`
- Ordenar por `date` ASC

---

## MÓDULO 5 — ASISTENCIA

### GET /pupils/{pupil_id}/attendance/summary

**Filtros:**
| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `months` | int 1-24 | 6 | Cuántos meses atrás incluir |

**Validaciones:**
- `months` debe ser entero entre 1 y 24 — `400 MONTHS_INVALID`

**Response 200:** array ordenado DESC por mes (más reciente primero)
```json
[
  {
    "month":             "2026-03",
    "month_label":       "Marzo 2026",
    "sessions_total":    12,
    "sessions_present":  11,
    "sessions_absent":   1,
    "attendance_pct":    92
  }
]
```

---

### GET /pupils/{pupil_id}/attendance/{year}/{month}
Detalle de sesiones de un mes específico.

**Validaciones:**
- `year` entero 4 dígitos — `400 YEAR_INVALID`
- `month` entero 1-12 — `400 MONTH_INVALID`
- No permitir mes futuro (mes > mes actual del año actual) — `400 FUTURE_MONTH`

**Response 200:**
```json
{
  "month_label":    "Marzo 2026",
  "attendance_pct": 92,
  "sessions": [
    {
      "id":            "ses_001",
      "date":          "2026-03-04T18:00:00Z",
      "type":          "training",
      "label":         "Entrenamiento",
      "present":       true,
      "justified":     false,
      "justification": null
    },
    {
      "id":            "ses_002",
      "date":          "2026-03-07T20:00:00Z",
      "type":          "match",
      "label":         "Partido vs Quilpué BC",
      "present":       false,
      "justified":     true,
      "justification": "Enfermedad"
    }
  ]
}
```
- `justified: true` solo si existe un justificativo con `status = 'approved'` para esa fecha.
- `justification` contiene el `type` del justificativo aprobado (legible).
- Sesiones ordenadas por `date` ASC.

---

## MÓDULO 6 — PAGOS

### GET /pupils/{pupil_id}/payments

**Filtros:**
| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `status` | `pending\|paid\|overdue\|all` | `all` | Filtrar por estado |
| `year` | int | año actual | Filtrar por año |

**Response 200:**
```json
{
  "pending": [
    {
      "id":       "pay_001",
      "concept":  "Cuota Abril 2026",
      "amount":   25000,
      "due_date": "2026-04-05",
      "status":   "pending",
      "overdue":  false
    }
  ],
  "history": [
    {
      "id":          "pay_002",
      "concept":     "Cuota Marzo 2026",
      "amount":      25000,
      "paid_date":   "2026-03-03",
      "status":      "paid",
      "receipt_url": "https://api.clubdigital.cl/receipts/pay_002.pdf"
    }
  ]
}
```
- `overdue: true` cuando `due_date < hoy` y `status = pending`.
- `receipt_url` solo presente cuando `status = paid`.

---

### POST /payments/{payment_id}/checkout
Iniciar proceso de pago (generar link/token de pasarela).

**Validaciones:**
- Pago debe existir y pertenece al pupilo del apoderado — `403 FORBIDDEN`
- `status` debe ser `pending` o `overdue` — `409 ALREADY_PAID` si ya está pagado

**Response 200:**
```json
{
  "payment_id":   "pay_001",
  "checkout_url": "https://webpay.cl/...",
  "token":        "abc123",
  "expires_at":   "2026-04-05T23:59:59Z"
}
```

---

### GET /payments/{payment_id}
Consultar estado de un pago (polling post-checkout).

**Response 200:**
```json
{
  "id":          "pay_001",
  "status":      "paid",
  "paid_date":   "2026-04-04T15:22:00Z",
  "receipt_url": "https://api.clubdigital.cl/receipts/pay_001.pdf"
}
```

---

## MÓDULO 7 — COMUNICADOS

### GET /pupils/{pupil_id}/comunicados

**Filtros:**
| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `read` | `true\|false\|all` | `all` | Filtrar por estado de lectura |
| `category` | `info\|action\|admin\|all` | `all` | Filtrar por categoría |
| `page` | int | 1 | Página |
| `per_page` | int (máx 50) | 20 | Items por página |

**Validaciones:**
- `per_page` máximo 50 — si supera, usar 50 sin error
- `category` debe ser valor del enum o `all` — `400 CATEGORY_INVALID`

**Response 200:** array con header `X-Total-Count`
```json
[
  {
    "id":       "com_001",
    "title":    "Cambio de horario entrenamiento",
    "preview":  "A partir del lunes 28...",
    "category": "info",
    "date":     "2026-03-20T10:00:00Z",
    "read":     false
  }
]
```
- Ordenar por `date` DESC (más reciente primero).
- `preview`: primeros 120 caracteres del body, sin HTML, sin saltos de línea.

---

### GET /comunicados/{comunicado_id}
Detalle completo. Al consultar, marcar automáticamente como leído (`read: true`).

**Response 200:**
```json
{
  "id":                 "com_001",
  "title":              "Cambio de horario entrenamiento",
  "category":           "info",
  "date":               "2026-03-20T10:00:00Z",
  "body":               "Estimados apoderados, a partir del lunes...",
  "read":               true,
  "requires_signature": false
}
```

---

### POST /comunicados/{comunicado_id}/read
Marcar manualmente como leído (idempotente).

**Response 200:** `{ "ok": true }`
- Si ya estaba marcado como leído: devolver `200` igualmente (idempotente).

---

## MÓDULO 8 — DOCUMENTOS

### GET /pupils/{pupil_id}/documentos

**Filtros:**
| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `status` | `pending\|signed\|all` | `all` | Filtrar por estado |

**Response 200:**
```json
{
  "pending": [
    {
      "id":          "doc_001",
      "title":       "Autorización Gira Viña del Mar",
      "description": "Firmar antes del 28 de Marzo",
      "due_date":    "2026-03-28",
      "status":      "pending",
      "overdue":     false
    }
  ],
  "signed": [
    {
      "id":          "doc_002",
      "title":       "Autorización Torneo Copa Chile",
      "signed_date": "2026-02-15",
      "status":      "signed"
    }
  ]
}
```
- `overdue: true` cuando `due_date < hoy` y `status = pending`.

---

### GET /documentos/{documento_id}

**Validaciones:**
- Documento debe pertenecer a un pupilo del apoderado autenticado — `403 FORBIDDEN`
- Si `status = signed`: devolver igualmente el documento pero con `requires_signature: false`

**Response 200:**
```json
{
  "id":                 "doc_001",
  "title":              "Autorización Gira Viña del Mar",
  "body":               "Yo, Carlos Muñoz, autorizo a mi pupilo...",
  "requires_signature": true,
  "status":             "pending",
  "due_date":           "2026-03-28"
}
```

---

### POST /documentos/{documento_id}/sign

**Validaciones:**
- `confirmed: true` requerido — `400 CONFIRMATION_REQUIRED`
- `signature_data` requerido · string base64 · mín 100 chars — `400 SIGNATURE_REQUIRED`
- Documento no debe estar ya firmado — `409 ALREADY_SIGNED`
- Documento no debe estar vencido (si `due_date < hoy`) — `422 DOCUMENT_OVERDUE`

**Errores:**
| Caso | HTTP | code |
|------|------|------|
| `confirmed` false o ausente | 400 | `CONFIRMATION_REQUIRED` |
| `signature_data` ausente | 400 | `SIGNATURE_REQUIRED` |
| Ya firmado | 409 | `ALREADY_SIGNED` |
| Vencido | 422 | `DOCUMENT_OVERDUE` |
| Doc de otro pupilo | 403 | `FORBIDDEN` |

**Response 200:**
```json
{
  "ok":           true,
  "signed_date":  "2026-03-24T15:30:00Z",
  "document_url": "https://api.clubdigital.cl/docs/doc_001_signed.pdf"
}
```

---

## MÓDULO 9 — CARNET DIGITAL

### GET /pupils/{pupil_id}/carnet/token
Generar token temporal para mostrar QR.

**Comportamiento:**
- Generar token alfanumérico único de 20 chars: `CDIGI-{LICENSE}-{RANDOM4}`
- Guardar en caché/BD con TTL de **5 minutos**
- Cada llamada genera un nuevo token (el anterior se invalida)

**Errores:**
| Caso | code |
|------|------|
| Pupilo sin licencia asignada | `NO_LICENSE` (404) |
| Licencia suspendida | `LICENSE_SUSPENDED` (403) |

**Response 200:**
```json
{
  "token":      "CDIGI-LIC2026-0892-XK9F",
  "qr_data":    "https://api.clubdigital.cl/verify/CDIGI-LIC2026-0892-XK9F",
  "expires_at": "2026-03-24T16:05:00Z",
  "pupil": {
    "name":       "Carlos Muñoz Jr.",
    "number":     8,
    "category":   "Alevín",
    "club":       "C.D. Santo Domingo",
    "license_id": "LIC-2026-0892",
    "photo_url":  "https://api.clubdigital.cl/photos/pup_001.jpg"
  }
}
```

---

### GET /verify/{token}
**Endpoint público — sin autenticación.**

**Rate limit especial:** 30 req/min por IP.

**Validaciones:**
- Token debe existir en BD y no haber expirado — `404` si no existe, `410 Gone` si expirado

**Response 200:**
```json
{
  "valid":      true,
  "name":       "Carlos Muñoz Jr.",
  "category":   "Alevín",
  "club":       "C.D. Santo Domingo",
  "license_id": "LIC-2026-0892",
  "status":     "active"
}
```
**Response 404:** `{ "valid": false, "reason": "Token no existe" }`
**Response 410:** `{ "valid": false, "reason": "Token expirado" }`

---

### POST /pupils/{pupil_id}/carnet/enroll

**Validaciones:**
- `enrollment_code` requerido · string · formato `CLB-YYYY-XXXX` — `400 CODE_INVALID_FORMAT`
- Código debe existir en BD — `400 CODE_NOT_FOUND`
- Código no debe haber sido ya utilizado — `409 CODE_ALREADY_USED`
- Pupilo no debe tener ya un carnet activo — `409 CARNET_ALREADY_ACTIVE`

**Response 200:**
```json
{ "ok": true, "license_id": "LIC-2026-0892" }
```

---

## MÓDULO 10 — BENEFICIOS

### GET /clubs/{club_id}/benefits

**Filtros:**
| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `active` | `true\|false\|all` | `true` | Mostrar solo activos |
| `type` | `carnet\|qr\|code\|all` | `all` | Tipo de beneficio |

**Validaciones:**
- `club_id` debe corresponder al club del apoderado autenticado — `403 CLUB_FORBIDDEN`
- `type` debe ser del enum — `400 TYPE_INVALID`

**Response 200:**
```json
[
  {
    "id":          "ben_001",
    "name":        "GymMax · 30% descuento",
    "description": "Presenta tu carnet en recepción",
    "type":        "carnet",
    "active":      true,
    "logo_url":    "https://api.clubdigital.cl/benefits/gymmax.png"
  },
  {
    "id":       "ben_002",
    "name":     "Pizza Sport · 2x1",
    "type":     "qr",
    "qr_data":  "BENEFIT-BEN002-USR001",
    "active":   true
  },
  {
    "id":     "ben_003",
    "name":   "SportShop · 15% off",
    "type":   "code",
    "code":   "IDEBASKET15",
    "active": true
  }
]
```
- Tipos válidos: `carnet` | `qr` | `code`
- `qr_data` solo presente si `type = qr`
- `code` solo presente si `type = code`

---

## MÓDULO 11 — JUSTIFICATIVOS MÉDICOS

> **Regla de negocio crítica:** Solo los justificativos de tipo `enfermedad` o `lesion` con `status = 'approved'` cambian el campo `justified` en la sesión de asistencia correspondiente. Los de tipo `otro` se registran pero **no** justifican la inasistencia a efectos del club.

### GET /apoderado/pupils/{pupil_id}/justificativos

**Filtros:**
| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `type` | `enfermedad\|lesion\|otro\|all` | `all` | Filtrar por tipo |
| `status` | `pending\|approved\|rejected\|all` | `all` | Filtrar por estado |
| `from` | YYYY-MM-DD | — | Fecha inicio del rango |
| `to` | YYYY-MM-DD | — | Fecha fin del rango |

**Validaciones:**
- `pupil_id` debe pertenecer al apoderado — `403 PUPIL_FORBIDDEN`
- `from` y `to` deben ser fechas válidas si se proveen — `400 DATE_INVALID`
- `to` no puede ser anterior a `from` — `400 DATE_RANGE_INVALID`
- `type` y `status` deben ser del enum — `400 FILTER_INVALID`

**Response 200:** array ordenado por `date` DESC
```json
[
  {
    "id":       1,
    "date":     "2026-03-19",
    "type":     "enfermedad",
    "reason":   "Fiebre alta, diagnóstico médico",
    "days":     3,
    "file_url": "https://api.clubdigital.cl/files/cert_001.jpg",
    "status":   "approved"
  },
  {
    "id":       2,
    "date":     "2026-04-02",
    "type":     "lesion",
    "reason":   "Esguince tobillo derecho",
    "days":     7,
    "file_url": null,
    "status":   "pending"
  }
]
```

---

### POST /apoderado/pupils/{pupil_id}/justificativos

**Validaciones de campos:**
| Campo | Tipo | Req | Regla |
|-------|------|-----|-------|
| `date` | string YYYY-MM-DD | ✅ | Fecha válida · no más de 30 días en el pasado · no fecha futura |
| `type` | enum | ✅ | Solo `enfermedad` o `lesion` (rechazar `otro` con `400 TYPE_NOT_ALLOWED`) |
| `reason` | string | ✅ | mín 10 chars · máx 500 chars |
| `days` | integer | ✅ | Entre 1 y 180 |
| `file_base64` | string base64 | ❌ | Si presente: JPG o PNG · máx 5 MB decodificado |
| `file_name` | string | ❌ | Si `file_base64` presente, este campo también requerido |

**Errores específicos:**
| Caso | HTTP | code |
|------|------|------|
| `date` ausente | 400 | `DATE_REQUIRED` |
| `date` inválida | 400 | `DATE_INVALID` |
| `date` futura | 400 | `DATE_FUTURE_NOT_ALLOWED` |
| `date` más de 30 días atrás | 400 | `DATE_TOO_OLD` |
| Ya existe justificativo para esa fecha y pupilo | 409 | `DUPLICATE_JUSTIFICATIVO` |
| `type` ausente | 400 | `TYPE_REQUIRED` |
| `type` no médico (`otro` u otro valor) | 400 | `TYPE_NOT_ALLOWED` |
| `reason` demasiado corta | 400 | `REASON_TOO_SHORT` |
| `reason` demasiado larga | 400 | `REASON_TOO_LONG` |
| `days` < 1 o > 180 | 400 | `DAYS_INVALID` |
| `file_base64` sin `file_name` | 400 | `FILE_NAME_REQUIRED` |
| Archivo supera 5 MB | 400 | `FILE_TOO_LARGE` |
| Formato de archivo no JPG/PNG | 400 | `FILE_INVALID_FORMAT` |

**Procesamiento del archivo:**
1. Decodificar base64 → validar que sea imagen válida (magic bytes)
2. Comprimir/redimensionar si supera 1920px en cualquier dimensión
3. Guardar en almacenamiento (S3, disco, etc.) con nombre único
4. Guardar `file_url` pública o firmada en la BD
5. Si falla la subida: continuar sin archivo y loguear el error (no fallar el request)

**Response 201:**
```json
{
  "id":       3,
  "date":     "2026-04-10",
  "type":     "enfermedad",
  "reason":   "Bronquitis aguda",
  "days":     5,
  "file_url": "https://api.clubdigital.cl/files/cert_003.jpg",
  "status":   "pending"
}
```

**Efectos secundarios al cambiar status (desde panel admin):**
- `approved` → actualizar la sesión de asistencia de la misma `date` con `justified: true`, `justification: type`
- `rejected` → enviar push notification al apoderado con mensaje: *"Tu justificativo del DD/MM/YYYY fue rechazado"*
- `approved` → enviar push notification: *"Tu justificativo del DD/MM/YYYY fue aprobado"*

---

## MÓDULO 12 — NOTIFICACIONES PUSH (Expo)

### POST /apoderado/me/devices
Registrar o actualizar el token de push notifications del dispositivo.

> **Fix aplicado en commit `ecade99`:** `platform` era `required` → causaba 422 porque el frontend solo envía `push_token`. Ahora es nullable con default `android`.

**Body mínimo (frontend actual):**
```json
{ "push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" }
```

**Body completo (multi-device tracking futuro):**
```json
{
  "push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "android",
  "device_id": "uuid-v4-del-dispositivo"
}
```

**Validaciones:**
- `push_token` requerido · formato `ExponentPushToken[xxxx]` o `ExpoPushToken[xxxx]`
- `platform` opcional · enum: `android` | `ios` | `web` · default: `android`
- `device_id` opcional · UUID v4 · nullable

**Comportamiento:**
- Si el `device_id` ya existe: **actualizar** el `push_token` (upsert, no duplicar)
- Si el `push_token` ya está registrado en otro `device_id`: mover al nuevo
- No fallar si el dispositivo ya tenía otro token (actualizar silenciosamente)

**Response 201:** nuevo registro · **Response 200:** token actualizado

---

### GET /apoderado/me/notifications
Leer preferencias de notificación del apoderado autenticado.

**Response 200:**
```json
{
  "pagos":          true,
  "asistencia":     true,
  "comunicados":    true,
  "agenda":         false,
  "justificativos": true
}
```

---

### PATCH /apoderado/me/notifications
Actualizar preferencias de notificación (parcial — solo campos enviados se modifican).

**Validaciones:**
- Body debe tener al menos un campo — `400 EMPTY_BODY`
- Todos los campos deben ser booleanos — `400 INVALID_TYPE` si no lo son

**Campos aceptados:** `pagos` · `asistencia` · `comunicados` · `agenda` · `justificativos`

> `justificativos` — nuevo campo: el apoderado recibe push cuando el estado de su justificativo cambia a `approved` o `rejected`.

**Response 200:** objeto completo con todos los campos (incluyendo los no modificados)
```json
{
  "pagos":          true,
  "asistencia":     true,
  "comunicados":    true,
  "agenda":         false,
  "justificativos": true
}
```

---

### Envío de push notifications (desde el backend)

Usar la **Expo Push Notifications API**: `https://exp.host/--/api/v2/push/send`

**Template de payload:**
```json
{
  "to":    "ExponentPushToken[xxxx]",
  "title": "ClubDigi",
  "body":  "Tu justificativo del 10/04/2026 fue aprobado",
  "data":  {
    "screen": "HistorialLesiones",
    "pupilId": 1
  },
  "sound":    "default",
  "badge":    1,
  "priority": "high"
}
```

**Eventos que disparan push y pantalla de destino (`data.screen`):**

| Evento | Título | Cuerpo | `data.screen` | `data.params` |
|--------|--------|--------|--------------|---------------|
| Justificativo aprobado | `Justificativo aprobado ✓` | `Tu justificativo del {fecha} fue aprobado` | `Justificativo` | `{ pupilId }` |
| Justificativo rechazado | `Justificativo rechazado` | `Tu justificativo del {fecha} no fue aprobado` | `Justificativo` | `{ pupilId }` |
| Nuevo comunicado | `Nuevo comunicado` | `{título del comunicado}` | `ComunicadoDetalle` | `{ id: comunicado_id }` |
| Documento por firmar | `Documento pendiente` | `Tienes un documento por firmar: {título}` | `DocumentoFirma` | `{ id: documento_id }` |
| Pago pendiente | `Pago pendiente` | `Tienes un pago de $${monto} pendiente` | `Pagos` | `{ pupilId }` |
| Pago confirmado | `Pago confirmado ✓` | `Tu pago de $${monto} fue procesado` | `Pagos` | `{ pupilId }` |
| Inasistencia registrada | `Inasistencia registrada` | `{nombre} no asistió al entrenamiento de hoy` | `Asistencia` | `{ pupilId }` |
| Partido mañana | `Partido mañana ⛹️` | `{hora} vs {rival} en {sede}` | `Agenda` | `{ pupilId }` |

> **Regla:** El frontend lee `data.screen` al recibir o presionar la notificación y navega directamente con `navigation.navigate(data.screen, data.params ?? {})`. El campo `data.pupilId` (cuando corresponda) permite al frontend preseleccionar el pupilo correcto antes de navegar.

**Ejemplo completo de payload:**
```json
{
  "to":    "ExponentPushToken[xxxx]",
  "title": "Nuevo comunicado",
  "body":  "Cambio de horario entrenamiento del lunes",
  "data":  {
    "screen": "ComunicadoDetalle",
    "params": { "id": 42 },
    "pupilId": 1
  },
  "sound":    "default",
  "badge":    1,
  "priority": "high"
}
```

**Manejo de errores de push:**
- Si Expo devuelve `DeviceNotRegistered`: eliminar ese token de la BD
- Si devuelve `InvalidCredentials`: loguear y alertar al equipo
- Reintentar máximo 3 veces con backoff exponencial (1s, 3s, 9s)

---

## REGLAS DE SEGURIDAD

| Regla | Detalle |
|-------|---------|
| TLS | Todo tráfico HTTPS, TLS 1.2+ mínimo. Rechazar HTTP. |
| JWT access token | Expiración 24 horas. Algoritmo HS256 o RS256. |
| JWT refresh token | Expiración 30 días. Rotation: al usar un refresh, emitir uno nuevo e invalidar el anterior. |
| Ownership | Cada recurso valida que pertenece al usuario autenticado antes de operar. |
| Logs | Nunca loguear: `phone`, `rut`, `email`, `access_token`, `refresh_token`, `push_token`, `file_base64`. |
| Archivos | URLs de archivos subidos deben ser firmadas con expiración de 1 hora, o estar detrás de middleware de auth. |
| SQL / NoSQL injection | Usar ORM con queries parametrizadas, nunca interpolación de strings con input del usuario. |
| Rate limiting | Ver tabla en sección REGLAS GLOBALES. Headers `Retry-After` obligatorios en respuestas 429. |
| CORS | Solo permitir origen de la app (Expo Go y builds de producción). |
| Datos sensibles en responses | No exponer campos internos de BD (created_at de tokens, IDs internos de sesiones de BD, etc.) salvo que sean necesarios para la app. |

---

## FORMATO ESTÁNDAR DE RESPUESTAS

### Éxito con datos
```json
{ /* el objeto o array directamente, sin wrapper */ }
```

### Creación exitosa
```
HTTP 201 Created
{ /* objeto creado */ }
```

### Operación OK sin datos
```json
{ "ok": true }
```

### Error (todos los casos)
```json
{
  "error":   "Mensaje legible en español",
  "code":    "ERROR_CODE_UPPER_SNAKE",
  "details": { "field": "nombre_campo", "value": "valor_recibido" }
}
```

### Tabla de status codes
| HTTP | Cuándo usarlo |
|------|---------------|
| `200` | GET, PUT, PATCH exitoso |
| `201` | POST que crea recurso |
| `400` | Input inválido, campo faltante, formato incorrecto |
| `401` | Sin token, token inválido o expirado |
| `403` | Autenticado pero sin permisos sobre ese recurso |
| `404` | Recurso no encontrado |
| `409` | Conflicto de estado (ya existe, ya firmado, ya pagado) |
| `410` | Recurso expirado (token de QR) |
| `422` | Entidad no procesable (regla de negocio violada) |
| `429` | Rate limit superado |
| `500` | Error interno del servidor |
| `503` | Servicio externo no disponible (SMS, pasarela de pago) |

---

## REQUERIMIENTO 3 — NUEVOS ENDPOINTS (Horarios · Permiso Deportivo)

> Esta sección complementa el Requerimiento 2 con tres endpoints adicionales que corresponden a las nuevas pantallas implementadas en el frontend.

---

### 3.1  Horario Semanal del Club

**Objetivo:** Devolver el horario recurrente de entrenamientos/partidos de una categoría específica o de todo el club. Los datos son de tipo "horario fijo semanal" (no calendario de eventos puntuales).

**Endpoint:**
`'`
GET /api/clubs/{club_id}/schedule
`'`

**Query params (opcionales):**
- category — Filtra por categoría (Ej: "Sub-14", "Mini"). Si se omite, devuelve todos.

**Autenticación:** Pública o autenticada con Bearer (el frontend siempre la llama con auth).

**Respuesta 200:**
`'`json
[
  {
    "id": "uuid-o-int",
    "day_of_week": 1,
    "time_start": "18:00",
    "time_end": "20:00",
    "type": "training",
    "venue": "Cancha Municipal Sector Norte",
    "notes": "Llevar hidratación",
    "category": "Sub-14",
    "active": true
  }
]
`'`

**Campos:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string/int | Identificador único del bloque horario |
| day_of_week | int (0-6) | 0=Domingo, 1=Lunes, ..., 6=Sábado |
| 	ime_start | string "HH:MM" | Hora de inicio |
| 	ime_end | string "HH:MM" | Hora de término |
| 	ype | enum | 	raining, match, practice, other |
| enue | string | Nombre del recinto |
| 
otes | string\|null | Indicaciones adicionales |
| category | string | Categoría asociada |
| ctive | bool | Si el bloque está vigente |

**Gestión (admin/profesor):**
`'`
POST   /api/clubs/{club_id}/schedule       — Crear bloque horario
PUT    /api/clubs/{club_id}/schedule/{id}  — Actualizar
DELETE /api/clubs/{club_id}/schedule/{id}  — Eliminar
`'`

**Body POST/PUT:**
`'`json
{
  "day_of_week": 3,
  "time_start": "09:00",
  "time_end": "11:00",
  "type": "training",
  "venue": "Gimnasio Club",
  "notes": null,
  "category": "Mini"
}
`'`

---

### 3.2  Permisos Deportivos (Decreto 22 / Ausencia Escolar)

**Objetivo:** Permitir al apoderado solicitar un "Permiso Deportivo" que certifica la participación del alumno en una actividad deportiva oficial, para presentarlo en el establecimiento educacional como justificativo de ausencia.

#### 3.2.1  Listar permisos del alumno

`'`
GET /api/apoderado/pupils/{pupil_id}/permisos-deportivos
`'`

**Auth:** Bearer (apoderado). Solo ve los permisos de sus propios pupilos.

**Respuesta 200:**
`'`json
[
  {
    "id": 1,
    "event_id": 42,
    "event_title": "Torneo Regional Sub-14",
    "event_date": "2026-05-10",
    "school_name": "Liceo Politécnico A-54",
    "grade": "2° Medio",
    "notes": "Ausencia días 10 y 11 de mayo",
    "status": "approved",
    "certificate_url": "https://cdn.clubdigital.cl/permisos/1.pdf",
    "created_at": "2026-04-28T10:00:00Z"
  }
]
`'`

#### 3.2.2  Solicitar permiso deportivo

`'`
POST /api/apoderado/pupils/{pupil_id}/permisos-deportivos
`'`

**Auth:** Bearer (apoderado). Validar que el pupilo le pertenece.

**Body:**
`'`json
{
  "event_id": 42,
  "school_name": "Liceo Politécnico A-54",
  "grade": "2° Medio",
  "notes": "Ausencia días 10 y 11 de mayo"
}
`'`

**Validaciones:**
- event_id existente, de tipo match o event, perteneciente al club del alumno.
- El evento debe ser en el futuro (no aceptar eventos pasados).
- school_name requerido, max 120 caracteres.
- grade requerido (puede ser texto libre o enum validado).
- El apoderado no puede solicitar más de un permiso por el mismo evento para el mismo alumno — devolver 409 si ya existe.

**Respuesta 201:**
`'`json
{
  "id": 2,
  "event_id": 42,
  "event_title": "Torneo Regional Sub-14",
  "event_date": "2026-05-10",
  "school_name": "Liceo Politécnico A-54",
  "grade": "2° Medio",
  "notes": null,
  "status": "pending",
  "certificate_url": null,
  "created_at": "2026-04-29T14:32:00Z"
}
`'`

#### 3.2.3  Gestión por admin/coach (revisar y aprobar)

`'`
GET    /api/clubs/{club_id}/permisos-deportivos              — Lista todos (usa filtros ?status=pending)
PUT    /api/clubs/{club_id}/permisos-deportivos/{id}/approve — Aprobar y adjuntar certificado (PDF URL)
PUT    /api/clubs/{club_id}/permisos-deportivos/{id}/reject  — Rechazar con motivo
`'`

**Body APPROVE:**
`'`json
{
  "certificate_url": "https://cdn.clubdigital.cl/permisos/1.pdf"
}
`'`

**Body REJECT:**
`'`json
{
  "reject_reason": "El evento no corresponde a actividad oficial registrada."
}
`'`

**Respuesta 200:** Objeto PermisoDeportivo actualizado.

**Push notification al apoderado:**
- Al aprobar: "¡Permiso listo! El permiso deportivo de {nombre} para {evento} ya está disponible."
- Al rechazar: "Tu solicitud de permiso deportivo para {evento} fue rechazada. Motivo: {motivo}"

---

### 3.3  Mis Justificativos (sin filtro de tipo)

> El endpoint ya existe: GET /api/apoderado/pupils/{pupil_id}/justificativos
> La nueva pantalla "Mis Justificativos" lo consume sin filtro de tipo (a diferencia de "Historial Médico" que filtra solo enfermedad y lesion).

**Asegurarse que el endpoint:**
- Devuelva TODOS los tipos (enfermedad, lesion, otro, y futuros tipos).
- Admita filtro opcional por query param: ?status=pending|approved|rejected (para optimizar en el futuro, aunque el filtro actual se hace en cliente).
- Ordene por date DESC por defecto.

---

### 3.4  Modelo de base de datos (tablas nuevas)

#### Tabla schedule_blocks
`'`sql
CREATE TABLE schedule_blocks (
  id          SERIAL PRIMARY KEY,
  club_id     INT NOT NULL REFERENCES clubs(id),
  category    VARCHAR(50),
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  time_start  TIME NOT NULL,
  time_end    TIME NOT NULL,
  type        VARCHAR(20) NOT NULL DEFAULT 'training',
  venue       VARCHAR(150) NOT NULL,
  notes       TEXT,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_schedule_club ON schedule_blocks(club_id, active);
`'`

#### Tabla sports_permits (Permisos Deportivos)
`'`sql
CREATE TABLE sports_permits (
  id               SERIAL PRIMARY KEY,
  pupil_id         INT NOT NULL REFERENCES pupils(id),
  apoderado_id     INT NOT NULL REFERENCES users(id),
  club_id          INT NOT NULL REFERENCES clubs(id),
  event_id         INT REFERENCES events(id),
  school_name      VARCHAR(120) NOT NULL,
  grade            VARCHAR(30) NOT NULL,
  notes            TEXT,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending',
  certificate_url  VARCHAR(500),
  reject_reason    TEXT,
  processed_by     INT REFERENCES users(id),
  processed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (pupil_id, event_id)
);
CREATE INDEX idx_sports_permits_club ON sports_permits(club_id, status);
`'`

---

## REQUERIMIENTO 4 — MODELO DE NEGOCIO

### 4.1  Visión General

ClubDigi opera un modelo **freemium B2B2C**: el club paga una suscripción base que habilita la plataforma, y los apoderados acceden con funcionalidades progresivamente restringidas según su nivel de suscripción.

Los tres pilares de monetización son:
1. **Suscripción de Club (B2B)** — El club paga mensualmente para usar la plataforma.
2. **Suscripción de Familia (B2C)** — Los apoderados pagan ~ USD/mes por funciones premium y sin publicidad.
3. **Beneficios y Comercios Asociados** — Sponsors o comercios pagan por exposición a apoderados deportivos.

---

### 4.2  Planes y Funcionalidades

#### Plan Gratuito (Familia)
Acceso sin costo al apoderado. Incluye:
- Visualizar asistencia mensual (sin descarga)
- Comunicados del club
- Carnet Digital (QR de identificación)
- Horarios de entrenamiento
- Ver sus justificativos (sin envío de archivos adjuntos)

Limitaciones:
- Publicidad visible (banners de comercios asociados)
- Sin acceso a documentos para firmar
- Sin historial detallado de pagos
- Sin Permiso Deportivo
- Sin descarga de certificados

#### Plan Premium Familia (~ USD/mes ≈ .800 CLP/mes)
Todo lo del plan gratuito, más:
- Envío de justificativos con adjunto (foto/PDF)
- Historial médico completo (Lesiones y Enfermedades)
- Permiso Deportivo (solicitud y descarga de certificado)
- Mis Justificativos (historial completo + filtros)
- Historial completo de pagos + comprobantes
- Documentos para firma digital
- Sin publicidad
- Notificaciones push prioritarias

#### Plan Club (B2B — precio por acuerdo)
Habilita la plataforma para el club. El precio varía según número de alumnos activos:
- 1-50 alumnos: tarifa base
- 51-150 alumnos: tarifa media  
- 150+ alumnos: tarifa personalizada

Incluye:
- Panel de administración (comunicados, eventos, documentos, pagos)
- Registro de asistencia (profesores)
- Gestión de justificativos (aprobar/rechazar)
- Gestión de Permisos Deportivos (aprobar y emitir certificado PDF)
- Gestión de carnet y enrolamiento
- Push notifications al club completo
- Estadísticas de asistencia por categoría
- Soporte prioritario

---

### 4.3  Publicidad y Beneficios para Usuarios Gratuitos

Los usuarios del plan gratuito ven **banners de comercios asociados** en la pantalla principal (HomeScreen) y en la pantalla de Beneficios. Estos patrocinadores pagan al club o a ClubDigi directamente por exposición.

Tipos de beneficios/publicidad:
- Tiendas deportivas (descuentos en ropa, zapatillas, implementos)
- Nutrición deportiva y suplementos para jóvenes atletas
- Seguros deportivos infantiles
- Academias de idiomas o educación complementaria
- Servicios locales del sector (fisioterapia, fonoaudiología)

El **Plan Premium** desactiva estos banners, reemplazándolos por un mensaje neutral.

**Implementación backend requerida:**
`'`
GET /api/apoderado/benefits     — Lista de beneficios activos (ya existe)
GET /api/apoderado/ads          — Lista de banners publicitarios activos (nuevo)
POST /api/apoderado/ads/{id}/click  — Registrar click para analytics (nuevo)
`'`

---

### 4.4  Suscripción de Familia — Flujo de Pago

**Opción A (recomendada al inicio):** Pago manual vía link de transferencia o Webpay. El admin activa manualmente el plan premium del apoderado.

**Opción B (escalable):** Integración con Mercado Pago Subscriptions o Stripe para pago recurrente automático.

**Endpoint requerido:**
`'`
GET    /api/apoderado/me/subscription          — Estado actual (plan, vence_at, cancel_at)
POST   /api/apoderado/me/subscription/upgrade  — Iniciar proceso de pago (devuelve URL de pago)
POST   /api/apoderado/me/subscription/cancel   — Cancelar al vencimiento
`'`

**Respuesta GET subscription:**
`'`json
{
  "plan": "free",
  "expires_at": null,
  "cancel_at_period_end": false,
  "features": ["asistencia", "comunicados", "carnet", "horarios"]
}
`'`

---

### 4.5  Control de Acceso por Plan (Backend)

El backend debe incluir un middleware de plan que bloquee endpoints premium cuando el apoderado tiene plan gratuito:

`'`
403 Forbidden
{
  "error": "PLAN_REQUIRED",
  "message": "Esta función requiere el Plan Premium Familia.",
  "upgrade_url": "https://clubdigital.cl/upgrade"
}
`'`

**Endpoints que requieren Plan Premium:**
- POST /apoderado/pupils/{id}/justificativos (con ile_base64)
- GET/POST /apoderado/pupils/{id}/permisos-deportivos
- GET /apoderado/pupils/{id}/documents
- POST /apoderado/pupils/{id}/documents/{docId}/sign

**Regla de negocio en backend:**
`'`python
def require_plan(plan_name: str):
    def decorator(fn):
        def wrapper(*args, **kwargs):
            apoderado = get_current_apoderado()
            if apoderado.plan < plan_name:
                raise ForbiddenError(code='PLAN_REQUIRED')
            return fn(*args, **kwargs)
        return wrapper
    return decorator
`'`

---

### 4.6  Tabla de suscripciones (base de datos)

`'`sql
CREATE TABLE apoderado_subscriptions (
  id               SERIAL PRIMARY KEY,
  apoderado_id     INT NOT NULL UNIQUE REFERENCES users(id),
  plan             VARCHAR(20) NOT NULL DEFAULT 'free',
  started_at       TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  cancel_at_period BOOLEAN NOT NULL DEFAULT FALSE,
  payment_method   VARCHAR(50),
  external_sub_id  VARCHAR(100),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
`'`

**Valores de plan:** ree, premium_family

---

### 4.7  Resumen de Revenue Streams

| Fuente | Modelo | Quién paga |
|--------|--------|-----------|
| Suscripción Club | Mensual/anual por rango de alumnos | El club deportivo |
| Suscripción Familia | ~ USD/mes cancelable en cualquier momento | El apoderado |
| Beneficios/Sponsors | CPC o CPM acordado | Comercios y patrocinadores |
| Comisiones de pago | % sobre transacciones procesadas vía app | Transparente al club |

---

### 4.8  Decisión de diseño: ¿Qué es gratis vs premium?

**Principio:** El valor central gratuito es la **comunicación y visibilidad** (saber si tu hijo fue, leer avisos del club, mostrar el carnet). El valor premium es la **gestión y acción** (pagar, firmar documentos, enviar justificativos con certificado, permisos deportivos).

Esta dicotomía hace que el plan gratuito sea útil pero tenga un techo natural que motiva el upgrade sin forzarlo.

---

## REQUERIMIENTO 5 — CORRECCIONES Y ACLARACIONES (Frontend v1.1.0)

> Sección generada a partir de la auditoría del frontend (27 Mar 2026).
> **Estado:** ✅ Implementado por backend en commit `319fe09` — spec final acordada.

---

### 5.1  `GET /apoderado/me` — Campos obligatorios en la respuesta ✅

El frontend consume `initials`, `rut`, `email` y `photo_url` directamente en `PerfilScreen`. El endpoint **retorna siempre estos campos** (`null` si no hay dato).

**Response:**
```json
{
  "id": 1,
  "name": "Carlos Muñoz",
  "phone": "+56987654321",
  "roles": ["apoderado"],
  "is_new": false,
  "club_id": 1,
  "initials": "CM",
  "rut": "18.234.567-k",
  "email": "carlos@email.com",
  "photo_url": null
}
```

> `initials` se calcula en el backend: primeras letras de cada palabra del nombre, máx 2 caracteres, mayúsculas (ej. `"Carlos Muñoz"` → `"CM"`).

---

### 5.2  `GET /apoderado/pupils/{pupil_id}/carnet` — Spec final acordada ✅

**Ruta definitiva:** `/apoderado/pupils/{pupil_id}/carnet` (no `/carnet/token`)

**Comportamiento:**
- Cada llamada **rota el token** — el anterior queda inválido inmediatamente
- TTL: **5 minutos** (coherente con el refresh del frontend cada 300 s)
- `qr_payload` es la URL completa de verificación pública

**Response:**
```json
{
  "token": "CDIGI-XXXXXXXXXXXXXXXXXXXX",
  "qr_payload": "https://api.clubdigital.cl/api/verify/CDIGI-...",
  "player_name": "Carlos Muñoz Jr.",
  "team": "C.D. Santo Domingo",
  "expires_at": "2026-03-27T16:05:00Z"
}
```

---

### 5.3  `GET /apoderado/me/notifications` y `PATCH /apoderado/me/notifications` ✅

Sin cambios respecto al Módulo 12 — ya estaba implementado tal como describe el spec.

**Response GET / body PATCH / Response PATCH:**
```json
{
  "pagos":          true,
  "asistencia":     true,
  "comunicados":    true,
  "agenda":         false,
  "justificativos": true
}
```

> `PATCH` es parcial: solo se envía el campo que cambió (ej. `{ "agenda": true }`). Responde con el objeto completo actualizado.

---

### 5.4  `POST /auth/enroll` — Spec final acordada ✅

El rol **no va en el body** — se infiere automáticamente del código en BD.

**Body:**
```json
{ "code": "APO-2026-XXXX" }
```

**Response 200:**
```json
{ "roles": ["apoderado"] }
```

**Errores:**

| Caso | HTTP | code |
|------|------|------|
| Body sin `code` | 400 | `CODE_REQUIRED` |
| Código no existe en BD | 400 | `CODE_NOT_FOUND` |
| Código agotado / revocado | 409 | `CODE_ALREADY_USED` |
| Código expirado | 400 | `CODE_EXPIRED` |
| Rol ya activo en el usuario | 409 | `ROLE_ALREADY_ACTIVE` |

> Tras el enrolamiento exitoso el frontend navega al flujo del rol activado (`PupilSelector` para apoderado, etc.) usando el array `roles` retornado, sin necesidad de un `GET /apoderado/me` adicional.

---

## REQUERIMIENTO 6 — INBOX DE NOTIFICACIONES (Frontend v1.2.0)

> **Estado:** ✅ Implementado por backend en commit `5e7968a`

El frontend ahora tiene una pantalla **Notificaciones** accesible desde el ícono de campana en los headers de Inicio, Agenda y Gestión. Necesita los siguientes endpoints:

---

### 6.1  `GET /apoderado/me/inbox` — Listar notificaciones ✅

**Auth:** Bearer token requerido.

**Response 200:**
```json
[
  {
    "id": 1,
    "title": "Cuota de Abril pendiente",
    "body": "Recuerda pagar la cuota de Abril antes del 30/04.",
    "type": "pago",
    "screen": "Pagos",
    "params": {},
    "read": false,
    "created_at": "2026-04-15T10:30:00Z"
  }
]
```

**Campo `type`** (string enum):

| Valor | Descripción |
|-------|-------------|
| `pago` | Aviso de pago pendiente o confirmado |
| `comunicado` | Nuevo comunicado del club |
| `justificativo` | Estado de justificativo actualizado |
| `documento` | Documento disponible para firmar |
| `agenda` | Evento próximo (partido, entreno) |
| `asistencia` | Inasistencia registrada |
| `general` | Aviso general del club |

**Campo `screen`** (opcional): nombre de la pantalla de destino a la que navegará el frontend al tocar la notificación. Debe coincidir con los nombres de las rutas del stack:
- `Pagos`, `PagoDetalle`, `Comunicados`, `ComunicadoDetalle`, `Documentos`, `DocumentoFirma`, `Justificativo`, `Asistencia`, `Agenda`

**Campo `params`** (opcional, objeto plano): parámetros de navegación que se pasarán a la pantalla destino. Ej: `{ "pagoId": 42 }` para `PagoDetalle`.

**Orden:** del más reciente al más antiguo (`ORDER BY created_at DESC`).

---

### 6.2  `POST /apoderado/me/inbox/{id}/read` — Marcar una como leída ✅

**Auth:** Bearer token requerido.
**Path param:** `id` — ID de la notificación.

**Response 200:**
```json
{ "ok": true }
```

**Errores:**

| Caso | HTTP | Detalle |
|------|------|---------|
| Notificación no existe | 404 | — |
| Notificación de otro usuario | 403 | — |

---

### 6.3  `POST /apoderado/me/inbox/read-all` — Marcar todas como leídas ✅

**Auth:** Bearer token requerido.

Marca como `read = true` todas las notificaciones no leídas del apoderado autenticado.

**Response 200:**
```json
{ "ok": true }
```

---

### 6.4  Notas adicionales

- Las notificaciones se generan desde el backend en eventos relevantes (pago registrado, comunicado publicado, inasistencia, etc.). El frontend **no crea** notificaciones — solo las lee y las marca.
- ✅ **`GET /apoderado/me/inbox/unread-count`** — ya implementado: `{ "count": N }`. Listo para conectar el badge numérico en la campana.
- ✅ **Filtro `?read=false`** — ya soportado en `GET /apoderado/me/inbox`.
- ✅ **Integración push → inbox**: `forPlayer()`, `forClub()`, `forGuardian()` insertan automáticamente filas en la tabla `guardian_notifications` con mapeo de topic → `type` (`pagos→pago`, `comunicados→comunicado`, `justificativos→justificativo`, `documentos→documento`, resto → `general`).

**Archivos creados/modificados en backend:**

| Archivo | Acción |
|---------|--------|
| `2026_03_27_000022_create_guardian_notifications_table.php` | Migración tabla `guardian_notifications` |
| `GuardianNotification.php` | Modelo Eloquent |
| `InboxController.php` | Controlador (list, markRead, markAllRead, unreadCount) |
| `api.php` | 4 rutas inbox registradas |
| `GuardianPushNotifier.php` | `writeInbox()` hookeado en envíos push |









---

## SECCI�N 4 � Nuevos endpoints (US01�US19, revisi�n app Apoderado)

> Todos los endpoints requieren `Authorization: Bearer <token>` salvo indicaci�n contraria.  
> El backend debe validar que `hijo_id` pertenezca al apoderado autenticado en cada request que lo reciba (403 si no corresponde).

---

### 4.1 Club � Informaci�n b�sica (US01)
```
GET /api/club/:club_id/info-basica
```
**Response 200:**
```json
{ "nombre": "Club Basket", "logo_url": "https://...", "telefono": "+56912345678", "email": "club@email.com", "direccion": "Calle 123" }
```

---

### 4.2 Club � M�dulos habilitados (US09)
```
GET /api/club/:club_id/modulos-habilitados
```
**Response 200:**
```json
{ "modulos": ["pagos", "tienda", "encuestas", "beneficios", "convocatorias", "consultas"] }
```
> Se consulta al iniciar sesi�n y al cambiar de hijo activo.  
> Los m�dulos no listados no deben renderizarse en la app (no solo ocultarse).

---

### 4.3 Club � Configuraci�n (US04, US15)
```
GET /api/club/:club_id/configuracion
```
**Response 200:**
```json
{
  "notificaciones_ttl_dias": 60,
  "convocatoria_recordatorio_horas": 6,
  "resultados_encuestas_visibles": false
}
```

---

### 4.4 Club � Informaci�n institucional (US14)
```
GET /api/club/:club_id/institucional
```
**Response 200:**
```json
{
  "descripcion": "Club fundado en 2001...",
  "logo_url": "https://...",
  "historia": "Historia del club...",
  "directiva": [
    { "nombre": "Juan P�rez", "cargo": "Presidente", "foto_url": null }
  ],
  "coaches": [
    { "nombre": "Pedro Garc�a", "cargo": "Head Coach", "certificacion": "FIBA Level 2", "foto_url": null }
  ]
}
```

---

### 4.5 Club � Horarios del club (US10)
```
GET /api/club/:club_id/horarios
```
**Response 200:**
```json
[{ "id": 1, "dia": "Lunes", "hora_inicio": "18:00", "hora_fin": "20:00", "lugar": "Gimnasio A", "categoria": "Sub-14", "descripcion": "Entrenamiento t�cnico" }]
```

---

### 4.6 Apoderado � Horarios del hijo (US10)
```
GET /api/apoderado/horarios?hijo_id=:id
```
**Response 200:**
```json
[{ "id": 1, "dia": "Lunes", "hora_inicio": "18:00", "hora_fin": "20:00", "lugar": "Gimnasio A", "categoria": "Sub-14" }]
```

---

### 4.7 Inbox � Archivar notificaci�n (US04)
```
PATCH /api/apoderado/me/inbox/:id/archivar
```
**Response 200:** `{ "ok": true }`

Eliminaci�n autom�tica de notificaciones (archivadas y no archivadas) luego de `notificaciones_ttl_dias` d�as � implementar con job/cron en backend.

---

### 4.8 Inbox � Listado archivadas (US04)
```
GET /api/apoderado/me/inbox/archivadas
```
**Response 200:**
```json
[{ "id": 1, "title": "...", "body": "...", "type": "general", "read": true, "created_at": "2026-03-01T10:00:00Z" }]
```

---

### 4.9 Consultas al club (US06)
```
POST /api/club/:club_id/consultas
```
**Body:** `{ "asunto": "...", "mensaje": "...", "hijo_id": 5 }`  
**Response 201:** `{ "id": 1, "created_at": "...", "estado": "enviado" }`

```
GET /api/apoderado/consultas?club_id=:id
```
**Response 200:**
```json
[{ "id": 1, "asunto": "...", "mensaje": "...", "created_at": "...", "estado": "enviado" }]
```
`estado` posibles: `enviado | leido | respondido`

---

### 4.10 Justificativos v2 � Motivos flexibles (US07)
```
POST /api/justificativos
```
**Body:**
```json
{ "actividad_id": 10, "hijo_id": 5, "motivo": "otros", "descripcion": "Viaje familiar" }
```
`motivo` posibles: `enfermedad | lesion | otros`  
Si `motivo = "otros"`, `descripcion` es **requerido**.  
**Response 201:** `{ "id": 1, "estado": "pendiente", "created_at": "..." }`

```
DELETE /api/justificativos/:id
```
Solo permitido si `estado = "pendiente"` (sin acuse del club).  
**Response 200:** `{ "ok": true }`  
**Error 403:** `{ "error": "Justificativo ya acusado, no se puede eliminar" }`

```
GET /api/justificativos/:id
```
**Response 200:**
```json
{ "id": 1, "motivo": "otros", "descripcion": "...", "estado": "pendiente", "acusado_at": null }
```

---

### 4.11 Justificativos � PDF (US08)
```
POST /api/justificativos/:id/generar-pdf
```
**Response 200:** `{ "pdf_url": "https://...", "generated_at": "..." }`  
**Error 409:** `{ "error": "Ya existe un PDF generado para este justificativo" }`

```
GET /api/justificativos/:id/pdf-status
```
**Response 200:** `{ "tiene_pdf": true, "pdf_url": "https://...", "generated_at": "..." }`

---

### 4.12 Encuestas (US11)
```
GET /api/encuestas?club_id=:id&hijo_id=:id
```
**Response 200:**
```json
[{ "id": 1, "titulo": "�Cambio de horario?", "estado": "abierta", "fecha_cierre": "2026-04-15", "respondida": false }]
```

```
GET /api/encuestas/:id
```
**Response 200:**
```json
{
  "id": 1,
  "titulo": "...",
  "estado": "abierta",
  "resultados_visibles": false,
  "preguntas": [
    { "id": 1, "tipo": "opcion_multiple", "texto": "�Est�s de acuerdo?", "opciones": ["S�", "No", "Tal vez"], "requerida": true }
  ]
}
```
`tipo` posibles: `opcion_multiple | texto_libre | escala`

```
POST /api/encuestas/:id/respuestas
```
**Body:** `{ "respuestas": [{ "pregunta_id": 1, "valor": "S�" }] }`  
**Error 403:** `{ "error": "Encuesta cerrada" }`

```
GET /api/encuestas/:id/mis-respuestas
```
**Response 200:** `{ "respuestas": [{ "pregunta_id": 1, "valor": "S�" }] }`

```
GET /api/encuestas/:id/resultados
```
Solo disponible si `resultados_visibles = true`.  
**Response 200:** `{ "resumen": [{ "pregunta_id": 1, "distribucion": { "S�": 10, "No": 3, "Tal vez": 2 } }] }`  
**Error 403:** `{ "error": "Resultados no habilitados" }`

---

### 4.13 Convocatorias (US15)
```
GET /api/convocatorias?hijo_id=:id
```
**Response 200:**
```json
[{ "id": 1, "evento": "Partido vs Club Norte", "fecha": "2026-04-10T15:00:00Z", "fecha_limite": "2026-04-08T23:59:59Z", "respuesta": "sin_respuesta" }]
```
`respuesta` posibles: `si | no | sin_respuesta`  
Si vence el plazo sin respuesta, el estado queda `sin_respuesta` � **el backend no asume "no asiste"**.

```
PATCH /api/convocatorias/:id/respuesta
```
**Body:** `{ "respuesta": "si" }`  
**Response 200:** `{ "ok": true }`  
**Error 403:** `{ "error": "Plazo de respuesta vencido" }`

> **Recordatorios autom�ticos:** El backend debe enviar push notification cada `convocatoria_recordatorio_horas` horas mientras `respuesta = sin_respuesta` y no haya vencido el plazo. Los recordatorios se detienen al responder o vencer el plazo.

---

### 4.14 Tienda (US17)
```
GET /api/club/:club_id/tienda/productos
```
**Response 200:**
```json
[{ "id": 1, "nombre": "Camiseta Oficial", "descripcion": "...", "precio": 25000, "stock": 10, "imagen_url": "https://...", "tallas": ["S", "M", "L", "XL"] }]
```

```
POST /api/tienda/solicitudes
```
**Body:** `{ "hijo_id": 5, "items": [{ "producto_id": 1, "cantidad": 2, "talla": "L" }] }`  
**Response 201:** `{ "id": 1, "estado": "pendiente", "created_at": "..." }`

```
GET /api/apoderado/tienda/solicitudes
```
**Response 200:**
```json
[{ "id": 1, "items": [{ "producto_id": 1, "nombre": "Camiseta", "precio": 25000, "cantidad": 2, "talla": "L" }], "estado": "pendiente", "created_at": "...", "acusado_at": null }]
```

```
PUT /api/tienda/solicitudes/:id
```
**Body:** `{ "items": [...] }`  
Solo permitido si `acusado_at` es null.  
**Error 403:** `{ "error": "Solicitud ya acusada" }`

```
DELETE /api/tienda/solicitudes/:id
```
Solo permitido si `acusado_at` es null.  
**Error 403:** `{ "error": "Solicitud ya acusada" }`

---

### 4.15 Beneficios v2 (US18)
```
GET /api/beneficios?club_id=:id
```
**Response 200:**
```json
[{ "id": 1, "titulo": "20% en farmacia", "descripcion": "...", "condiciones": "Solo socios activos", "origen": "club", "vigencia_hasta": "2026-12-31", "imagen_url": null }]
```
`origen` posibles: `club | plataforma`  
El backend filtra por `vigencia_hasta >= hoy`.

---

### 4.16 Publicidad / Ads (US19)
```
GET /api/ads?club_id=:id&hijo_id=:id
```
**Response 200:**
```json
[{ "id": 1, "imagen_url": "https://...", "url_destino": "https://...", "vigencia_hasta": "2026-06-30" }]
```
> El backend **no retorna ads** si el apoderado tiene plan Pro (la segmentaci�n ocurre en servidor).  
> El cliente simplemente no muestra modal si la respuesta es lista vac�a.

---

### 4.17 Dispositivos � Token push (US13)
```
POST /api/apoderado/dispositivos/token
```
**Body:** `{ "push_token": "ExponentPushToken[...]", "plataforma": "android" }`  
**Response 200:** `{ "ok": true }`  
> Se llama al iniciar sesi�n. Reemplaza token existente del dispositivo si ya existe.

---

### 4.18 Notificaciones accionables (US03)
El campo `accion_modulo` en las notificaciones indica qu� m�dulo debe estar habilitado para mostrar el bot�n de acci�n.  
Si el m�dulo est� deshabilitado, la notificaci�n se muestra como solo-informativa (sin bot�n de acci�n).

Considerar agregar a `GET /api/apoderado/me/inbox`:
```json
{ ..., "accion_ruta": "Pagos", "accion_modulo": "pagos", "hijo_id": 5 }
```

---

### Reglas generales de seguridad y consistencia

| Regla | Detalle |
|-------|---------|
| `hijo_id` ownership | Validar en backend que `hijo_id` pertenece al apoderado autenticado � 403 si no |
| Estado pendiente/acusado | `justificativos`, `tienda/solicitudes`: editable solo mientras `acusado_at = null` |
| M�dulos vs. roles | Endpoints exclusivos de `coach/admin` retornan 403 si token es de apoderado |
| Cache-Control | Respuestas cr�ticas (pagos, asistencia) deben incluir `Cache-Control: no-store` |
| TTL notificaciones | Eliminar notificaciones (archivadas y activas) tras `notificaciones_ttl_dias` d�as con cron |

---

## 5. Correcciones de datos requeridas

### 5.1 URLs de im�genes de pupilos (CR�TICO)

**Problema detectado:** El campo photo devuelto por GET /apoderado/me/pupils contiene una ruta con prefijo /api/storage/... que no es accesible p�blicamente. Las im�genes son accesibles en /storage/... (sin prefijo /api).

**URL incorrecta que llega al cliente:**
`
https://api.clubdigital.cl/api/storage/enrollments/2/archivo.jpg
`

**URL correcta donde existe el archivo:**
`
https://api.clubdigital.cl/storage/enrollments/2/archivo.jpg
`

**Correcci�n requerida en Laravel:**

En el modelo Pupil (o donde se serialice el campo photo), usar Storage::url() para generar la URL p�blica correcta:

`php
// En el Resource o al mapear el campo:
'photo' => ->photo ? Storage::url(->photo) : null,
`

O si se guarda la ruta relativa en BD, asegurarse que Storage::url() genere https://api.clubdigital.cl/storage/... y **no** incluya /api/ en la ruta.

**Verificar tambi�n en:** cualquier otro modelo que tenga photo_url, imagen_url, oto_url � aplicar la misma correcci�n para que todas las im�genes del sistema devuelvan URLs p�blicas v�lidas sin el prefijo /api.

---

### 5.2 Campo category null en respuesta de pupilos

**Endpoint:** GET /apoderado/me/pupils

**Problema:** El campo category llega como 
ull para todos los pupilos aunque exista la relaci�n en BD.

**Respuesta actual:**
`json
{ "id": 78, "category": null, "team": null, ... }
`

**Correcci�n requerida:** incluir la categor�a del jugador en el response. Ejemplo:
`json
{ "id": 78, "category": "Sub-8", "team": "Escuelita CDSD", ... }
`

El campo category debe ser un **string con el nombre de la categor�a** (ej. "Sub-8", "Sub-10", "Senior", etc.), no un objeto ni un ID num�rico.

---

## 6. CAMPOS ADICIONALES EN EVENTOS (Requerido)

### 6.1 Campos de partido para la app mobile

El endpoint `GET /apoderado/pupils/{id}/events` (y su versi�n de detalle) debe incluir los siguientes campos para cada evento de tipo `match`:

```json
{
  "id": 123,
  "type": "match",
  "title": "C.D. Santo Domingo vs Quilpu� BC",
  "date": "2026-04-05T20:00:00Z",
  "home_team": "C.D. Santo Domingo",
  "away_team": "Quilpu� BC",
  "venue": "Gimnasio Municipal",
  "league": "Liga Regional Valpara�so",
  "status": "upcoming",
  "my_status": "confirmed",

  "home_away": "home",
  "presentation_time": "19:00",
  "jersey_color": "Blanco",
  "jersey_color_hex": "#FFFFFF",
  "notes": "Traer zapatillas blancas. El bus sale a las 18:30."
}
```

**Descripci�n de campos nuevos:**

| Campo | Tipo | Descripci�n |
|-------|------|-------------|
| `home_away` | `"home" \| "away" \| null` | Si el equipo juega de local o visita |
| `presentation_time` | `string \| null` | Hora de presentaci�n en formato `"HH:MM"` (ej. `"19:00"`). Generalmente 1h antes del partido. |
| `jersey_color` | `string \| null` | Nombre del color de camiseta (ej. `"Blanco"`, `"Azul oscuro"`) |
| `jersey_color_hex` | `string \| null` | C�digo hex del color para visualizaci�n en la app (ej. `"#1A3A7C"`) |
| `notes` | `string \| null` | Instrucciones del DT para los jugadores convocados |

### 6.2 Campo `my_status` en lista de eventos

El campo `my_status` debe indicar el estado de convocatoria **del jugador activo** (pupilo) en cada evento:
- `"confirmed"` � confirm� asistencia
- `"pending"` � convocado, no ha respondido
- `"declined"` � declin� la convocatoria
- `null` � no est� convocado a ese evento

Este campo permite mostrar el indicador de convocatoria directamente en las tarjetas de la agenda sin necesidad de llamadas adicionales.

### 6.3 Endpoint de respuesta a convocatoria

```
POST /apoderado/events/{event_id}/roster/{pupil_id}/respond
```

**Body:**
```json
{ "status": "confirmed" }
```
Valores aceptados: `"confirmed"` | `"declined"`

**Response 200:**
```json
{ "message": "Respuesta registrada", "status": "confirmed" }
```

### 6.4 Endpoint de n�mina del evento

```
GET /apoderado/events/{event_id}/roster
```

**Response 200:**
```json
[
  {
    "id": 80,
    "full_name": "AMELIA PAZ GODOY L�PEZ",
    "photo_url": "https://api.clubdigital.cl/storage/...",
    "number": 7,
    "position": "Base",
    "status": "confirmed"
  }
]
```

---

## 7. SISTEMA DE M�DULOS / FEATURE FLAGS (Requerido)

### 7.1 Objetivo

El admin del club debe poder habilitar o deshabilitar funciones de la app de forma gradual, sin necesidad de publicar una nueva versi�n. Cuando una funci�n se activa por primera vez, la app debe mostrar un indicador "NUEVO" para que el apoderado sepa que hay una nueva funcionalidad disponible.

La app consulta al backend qu� m�dulos est�n habilitados para el club en cada inicio de sesi�n y decide qu� mostrar en el men� y navagaci�n.

---

### 7.2 Cat�logo de m�dulos disponibles

| `clave` | Nombre visible | Descripci�n |
|---------|----------------|-------------|
| `asistencia` | Asistencia | Registro y consulta de asistencia a entrenamientos/partidos |
| `pagos` | Pagos | Historial y detalle de pagos del deportista |
| `comunicados` | Comunicados | Mensajes y comunicados del club/equipo |
| `documentos` | Documentos | Documentos para firma digital |
| `justificativos` | Justificativos | Env�o de justificativos de inasistencia |
| `agenda` | Agenda | Calendario de eventos, entrenamientos y partidos |
| `convocatorias` | Convocatorias | N�mina de partidos y respuesta de convocatoria |
| `carnet` | Carnet Digital | Carnet digital del deportista con QR |
| `beneficios` | Beneficios | Beneficios y descuentos del club (futuro) |
| `tienda` | Tienda | Tienda online del club (futuro) |
| `encuestas` | Encuestas | Encuestas de satisfacci�n/feedback (futuro) |
| `horarios` | Horarios | Horarios de entrenamiento del equipo (futuro) |
| `permisos_deportivos` | Permiso Deportivo | Solicitud de permisos deportivos (futuro) |

---

### 7.3 Endpoint: `GET /club/{club_id}/modulos-habilitados` (ACTUALIZACI�N)

> **BREAKING CHANGE respecto al esquema actual:** el campo `modulos` cambia de `string[]` a `ModuloEstado[]`.

**Auth:** Bearer token requerido.

**Response 200:**
```json
{
  "modulos": [
    {
      "clave": "asistencia",
      "nombre": "Asistencia",
      "habilitado": true,
      "es_nuevo": false,
      "descripcion": "Registro y consulta de asistencia a entrenamientos y partidos"
    },
    {
      "clave": "pagos",
      "nombre": "Pagos",
      "habilitado": true,
      "es_nuevo": true,
      "descripcion": "Historial y detalle de pagos del deportista"
    },
    {
      "clave": "comunicados",
      "nombre": "Comunicados",
      "habilitado": false,
      "es_nuevo": false,
      "descripcion": "Mensajes y comunicados del club/equipo"
    }
  ]
}
```

**Descripci�n de campos:**

| Campo | Tipo | Descripci�n |
|-------|------|-------------|
| `clave` | `string` | Identificador �nico del m�dulo (snake_case, ver cat�logo �7.2) |
| `nombre` | `string` | Nombre visible del m�dulo |
| `habilitado` | `boolean` | Si el club tiene este m�dulo activo |
| `es_nuevo` | `boolean` | `true` si fue habilitado en los �ltimos **7 d�as** (configurable). La app muestra badge "NUEVO" |
| `descripcion` | `string \| null` | Descripci�n corta del m�dulo (opcional) |

**Reglas:**
- Se deben retornar **todos los m�dulos del cat�logo**, habilitados o no.
- Si el club no tiene configuraci�n para un m�dulo, se asume `habilitado: false`.
- La respuesta es p�blica una vez autenticado el usuario (cualquier rol puede consultarla).
- Se puede cachear en el cliente por 30 minutos.

---

### 7.4 L�gica de `es_nuevo`

Un m�dulo tiene `es_nuevo: true` si:
- Fue habilitado (cambiado de `habilitado: false` ? `true`) en los �ltimos **N d�as** (por defecto `N = 7`).
- N debe ser configurable en la tabla de configuraci�n del club o en variables de entorno del backend.

Sugerencia de implementaci�n:
```sql
-- Tabla: club_modulos
-- Columnas: id, club_id, clave, habilitado, habilitado_en (TIMESTAMP), created_at, updated_at

SELECT
  clave,
  habilitado,
  (habilitado = 1 AND habilitado_en >= NOW() - INTERVAL 7 DAY) AS es_nuevo
FROM club_modulos
WHERE club_id = ?
```

---

### 7.5 Endpoints de administraci�n de m�dulos

#### `GET /admin/clubs/{club_id}/modulos`

Lista todos los m�dulos del cat�logo con su estado actual para el club.

**Auth:** Bearer token con rol `admin`.

**Response 200:**
```json
{
  "modulos": [
    {
      "clave": "pagos",
      "nombre": "Pagos",
      "habilitado": true,
      "es_nuevo": true,
      "habilitado_en": "2026-03-22T14:30:00Z",
      "descripcion": "Historial y detalle de pagos del deportista"
    }
  ]
}
```

---

#### `PUT /admin/clubs/{club_id}/modulos/{clave}`

Habilita o deshabilita un m�dulo espec�fico para el club. Si se habilita, registra `habilitado_en = NOW()`.

**Auth:** Bearer token con rol `admin`.

**Body:**
```json
{ "habilitado": true }
```

**Response 200:**
```json
{
  "clave": "pagos",
  "habilitado": true,
  "es_nuevo": true,
  "habilitado_en": "2026-03-29T10:00:00Z"
}
```

**Errores:**

| C�digo | Motivo |
|--------|--------|
| `400` | `clave` inv�lida (no existe en el cat�logo) |
| `403` | No es admin del club |
| `404` | Club no encontrado |

---

#### `PUT /admin/clubs/{club_id}/modulos` (bulk)

Actualiza m�ltiples m�dulos en una sola llamada.

**Auth:** Bearer token con rol `admin`.

**Body:**
```json
{
  "modulos": [
    { "clave": "pagos", "habilitado": true },
    { "clave": "comunicados", "habilitado": false },
    { "clave": "documentos", "habilitado": true }
  ]
}
```

**Response 200:**
```json
{ "actualizados": 3 }
```

---

### 7.6 Comportamiento esperado en la app (para referencia del backend)

1. **Al iniciar sesi�n:** la app llama a `GET /club/{club_id}/modulos-habilitados` y almacena el resultado.
2. **M�dulos deshabilitados:** sus opciones se ocultan del men� lateral y la navegaci�n. Si el usuario intenta acceder directamente, ve una pantalla de "Funcionalidad no disponible".
3. **M�dulos nuevos (`es_nuevo: true`):** la app muestra un badge rojo "NUEVO" en el �tem del men�. Al hacer tap, el badge desaparece (se guarda en almacenamiento local que el usuario ya lo vio).
4. **M�dulos sin configurar:** si el endpoint responde vac�o o falla, la app muestra todos los m�dulos (modo degradado � fail open).

---

---

## Sección 8: ROL PROFESOR (Coach)

Esta sección describe todos los endpoints necesarios para el rol de **Profesor / Entrenador** en ClubDigi. El profesor puede gestionar equipos asignados, pasar asistencia, crear eventos, convocar jugadores y registrar lesiones.

**Autenticación:** Bearer token. El backend debe verificar que el usuario tiene rol `profesor` en el club indicado. El club ID se infiere del token o se pasa via header `X-Club-Id`.

---

### 8.1 Mis Equipos

```
GET /api/profesor/teams
```
**Auth:** Bearer `profesor`  
**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Sub-15 Masculino",
    "category": "Sub-15",
    "sport": "Fútbol",
    "player_count": 22,
    "next_event_date": "2025-02-10"
  }
]
```

---

### 8.2 Jugadores de un equipo

```
GET /api/profesor/teams/{team_id}/players
```
**Auth:** Bearer `profesor`  
**Response 200:**
```json
[
  {
    "id": 101,
    "name": "Martín López",
    "rut": "12.345.678-9",
    "photo": "https://cdn.example.com/foto.jpg",
    "number": 10,
    "position": "Delantero",
    "birth_date": "2010-03-22",
    "gender": "M",
    "status": "active",
    "is_federado": true,
    "injuries_count": 0
  }
]
```
**`status` valores posibles:** `active`, `inactive`, `injured`

---

### 8.3 Eventos / Agenda del equipo

```
GET /api/profesor/teams/{team_id}/events?from={YYYY-MM-DD}&to={YYYY-MM-DD}
```
**Auth:** Bearer `profesor`  
**Response 200:**
```json
[
  {
    "id": 55,
    "type": "match",
    "title": "Club A vs Club B",
    "date": "2025-02-15",
    "time": "18:00",
    "location": "Estadio Municipal",
    "venue": null,
    "team_id": 1,
    "team_name": "Sub-15 Masculino",
    "home_team": "Club A",
    "away_team": "Club B",
    "status": "upcoming",
    "convocados": 16,
    "confirmados": 12
  }
]
```
**`type` valores:** `training`, `match`, `event`  
**`status` valores:** `upcoming`, `live`, `finished`

```
GET /api/profesor/events?from={YYYY-MM-DD}&to={YYYY-MM-DD}
```
Igual que el anterior pero devuelve eventos de **todos** los equipos del profesor.

---

### 8.4 Crear evento

```
POST /api/profesor/events
```
**Auth:** Bearer `profesor`  
**Body:**
```json
{
  "team_id": 1,
  "type": "match",
  "title": "Sub-15 vs Rival FC",
  "date": "2025-02-20",
  "time": "15:30",
  "location": "Estadio Municipal",
  "home_team": "Sub-15 Masculino",
  "away_team": "Rival FC"
}
```
**Response 201:**
```json
{ "id": 56, "title": "Sub-15 vs Rival FC", "date": "2025-02-20" }
```

---

### 8.5 Asistencia — Listar sesiones

```
GET /api/profesor/teams/{team_id}/attendance
```
**Auth:** Bearer `profesor`  
**Response 200:**
```json
[
  {
    "id": 10,
    "date": "2025-02-05",
    "type": "training",
    "title": "Entrenamiento",
    "team_id": 1,
    "submitted": true,
    "total": 22,
    "present_count": 18,
    "absent_count": 4
  }
]
```

---

### 8.6 Asistencia — Detalle de sesión

```
GET /api/profesor/attendance/{session_id}
```
**Auth:** Bearer `profesor`  
**Response 200:**
```json
{
  "id": 10,
  "date": "2025-02-05",
  "type": "training",
  "title": "Entrenamiento",
  "team_id": 1,
  "submitted": false,
  "total": 22,
  "present_count": 0,
  "absent_count": 0,
  "records": [
    {
      "pupil_id": 101,
      "name": "Martín López",
      "photo": null,
      "present": false,
      "late": false,
      "notes": null
    }
  ]
}
```

---

### 8.7 Asistencia — Crear sesión

```
POST /api/profesor/teams/{team_id}/attendance
```
**Auth:** Bearer `profesor`  
**Body:**
```json
{
  "date": "2025-02-06",
  "type": "training",
  "title": "Entrenamiento tarde"
}
```
**Response 201:** Mismo formato que detalle de sesión (con `records` poblados desde el roster del equipo).

---

### 8.8 Asistencia — Enviar registros

```
POST /api/profesor/attendance/{session_id}/submit
```
**Auth:** Bearer `profesor`  
**Body:**
```json
{
  "records": [
    { "pupil_id": 101, "present": true,  "late": false, "notes": null },
    { "pupil_id": 102, "present": false, "late": false, "notes": "Permiso" },
    { "pupil_id": 103, "present": true,  "late": true,  "notes": null }
  ]
}
```
**Response 200:**
```json
{ "ok": true, "session_id": 10, "present": 18, "absent": 4 }
```

---

### 8.9 Convocatoria — Ver estado

```
GET /api/profesor/events/{event_id}/convocatoria
```
**Auth:** Bearer `profesor`  
**Response 200:**
```json
[
  {
    "pupil_id": 101,
    "name": "Martín López",
    "photo": null,
    "number": 10,
    "position": "Delantero",
    "convocado": true,
    "status": "confirmed"
  },
  {
    "pupil_id": 102,
    "name": "Lucas Rodríguez",
    "photo": null,
    "number": 5,
    "position": "Defensa",
    "convocado": false,
    "status": "pending"
  }
]
```
**`status` valores (solo aplica si `convocado: true`):** `pending`, `confirmed`, `declined`

---

### 8.10 Convocatoria — Actualizar

```
PUT /api/profesor/events/{event_id}/convocatoria
```
**Auth:** Bearer `profesor`  
**Body:**
```json
{ "pupil_ids": [101, 103, 107, 110] }
```
**Response 200:**
```json
{ "ok": true, "convocados": 4 }
```
El backend reemplaza la lista completa de convocados. Los jugadores convocados recibirán una notificación push.

---

### 8.11 Lesiones — Por equipo

```
GET /api/profesor/teams/{team_id}/injuries
```
**Auth:** Bearer `profesor`  
**Response 200:**
```json
[
  {
    "id": 1,
    "pupil_id": 101,
    "pupil_name": "Martín López",
    "pupil_photo": null,
    "type": "muscular",
    "zone": "muslo",
    "severity": "moderada",
    "date_start": "2025-01-20",
    "date_end": null,
    "is_active": true,
    "notes": "Desgarro grado 2"
  }
]
```

---

### 8.12 Lesiones — Por jugador

```
GET /api/profesor/players/{pupil_id}/injuries
```
**Auth:** Bearer `profesor`  
**Response 200:** Mismo formato que 8.11 (array de lesiones del jugador).

---

### 8.13 Lesiones — Registrar

```
POST /api/profesor/injuries
```
**Auth:** Bearer `profesor`  
**Body:**
```json
{
  "pupil_id": 101,
  "team_id": 1,
  "type": "muscular",
  "zone": "muslo",
  "severity": "moderada",
  "date_start": "2025-02-06",
  "notes": "Desgarro en entrenamiento"
}
```
**`severity` valores:** `leve`, `moderada`, `grave`  
**Response 201:**
```json
{ "id": 2, "pupil_id": 101, "is_active": true }
```

---

### 8.14 Lesiones — Dar de alta

```
PATCH /api/profesor/injuries/{injury_id}/close
```
**Auth:** Bearer `profesor`  
**Body:**
```json
{
  "date_end": "2025-02-20",
  "notes": "Alta médica. Retorna a actividad normal."
}
```
**Response 200:**
```json
{ "ok": true, "injury_id": 2, "is_active": false }
```

---

### 8.15 Restricciones de módulos para el rol profesor

Los módulos de la Sección 7 aplican también al rol profesor. La app oculta las secciones según las claves habilitadas:

| Módulo (clave)    | Qué se oculta en el rol Profesor        |
|-------------------|-----------------------------------------|
| `asistencia`      | Acceso rápido "Pasar Asistencia", tab   |
| `convocatorias`   | Acción "Convocar" y `ConvocatoriaGestion` |
| `agenda`          | Tab "Agenda" completo                   |
| `lesiones`        | Sección lesiones en Home, LesionesEquipo |

Los endpoints del profesor siempre están disponibles en el backend; es la app quien filtra la UI según los módulos.

---

## Sección 9: AGENDA UNIFICADA DEL PROFESOR + PROGRAMACIÓN SEMANAL

> Esta sección documenta los endpoints implementados por el frontend en las pantallas **ProgramacionScreen** (Agenda + Semanal) y **PartidoDetalleScreen**. Son todos nuevos y **aún no implementados en el backend**.

---

### 9.1 Agenda Unificada del Profesor

**Objetivo:** Devolver en una sola respuesta todos los eventos del profesor para un rango de fechas: sesiones de entrenamiento, partidos, eventos del club y bloques de horario pendientes de crear sesión. La app los agrupa por fecha y los muestra en el tab "Agenda" de ProgramacionScreen.

```
GET /api/profesor/agenda?from={YYYY-MM-DD}&to={YYYY-MM-DD}
```

**Auth:** Bearer `profesor`

**Response 200:** Array de `AgendaItem`, ordenado por `date` ASC, `time` ASC.

```json
[
  {
    "item_type": "training",
    "date": "2026-03-31",
    "time": "18:00",
    "end_time": "20:00",
    "title": "Entrenamiento Sub-15",
    "subtitle": null,
    "location": "Gimnasio A",
    "team_id": 1,
    "team_name": "Sub-15 Masculino",
    "status": "upcoming",
    "session_id": 42,
    "match_id": null,
    "club_event_id": null,
    "schedule_id": null,
    "can_take_attendance": true,
    "attendance_stats": null,
    "score": null
  },
  {
    "item_type": "match",
    "date": "2026-04-05",
    "time": "15:30",
    "end_time": null,
    "title": "Sub-15 Masculino vs Rival FC",
    "subtitle": "Liga Regional",
    "location": "Estadio Municipal",
    "team_id": 1,
    "team_name": "Sub-15 Masculino",
    "status": "scheduled",
    "session_id": null,
    "match_id": 88,
    "club_event_id": 55,
    "schedule_id": null,
    "can_take_attendance": false,
    "attendance_stats": null,
    "score": null
  },
  {
    "item_type": "pending_schedule",
    "date": "2026-04-07",
    "time": "08:00",
    "end_time": "10:00",
    "title": "Entrenamiento Sub-15",
    "subtitle": null,
    "location": "Cancha B",
    "team_id": 1,
    "team_name": "Sub-15 Masculino",
    "status": "upcoming",
    "session_id": null,
    "match_id": null,
    "club_event_id": null,
    "schedule_id": 12,
    "can_take_attendance": false,
    "attendance_stats": null,
    "score": null
  }
]
```

**Descripción de campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `item_type` | enum | `training` · `match_session` · `event_session` · `match` · `club_event` · `pending_schedule` |
| `date` | `"YYYY-MM-DD"` | Fecha del evento |
| `time` | `"HH:MM" \| null` | Hora de inicio |
| `end_time` | `"HH:MM" \| null` | Hora de término |
| `title` | `string` | Nombre del evento (ej. `"Sub-15 vs Rival FC"`) |
| `subtitle` | `string \| null` | Info secundaria (liga, categoría, etc.) |
| `location` | `string \| null` | Lugar |
| `team_id` | `int \| null` | ID del equipo |
| `team_name` | `string \| null` | Nombre del equipo |
| `status` | enum | `upcoming` · `scheduled` · `played` · `finished` · `pending` · `cancelled` |
| `session_id` | `int \| null` | ID de sesión de asistencia existente (si ya se creó) |
| `match_id` | `int \| null` | ID del partido (ClubMatch) — requerido para registrar resultado |
| `club_event_id` | `int \| null` | ID del evento del club — **requerido para cargar la nómina (convocatoria)**. Para items `match`, debe corresponder al evento padre del partido. |
| `schedule_id` | `int \| null` | ID del bloque de horario recurrente (solo para `pending_schedule`) |
| `can_take_attendance` | `bool` | Si el profesor puede marcar asistencia en este item ahora |
| `attendance_stats` | `object \| null` | `{ total, present, absent }` — solo si ya hay sesión con registros |
| `score` | `string \| null` | Resultado en formato `"2:1"` (solo items de tipo `match`) |

**Lógica de construcción:**

El backend debe unir en un solo array:
1. **TrainingSession** (sesiones de entrenamiento del profesor) → `item_type: "training"`, `session_id` poblado, `can_take_attendance: true`
2. **ClubMatch** programados → `item_type: "match"`, `match_id` + `club_event_id` poblados, `score` si hay resultado
3. **ClubEvent** del club/equipo → `item_type: "club_event"`, `club_event_id` poblado
4. **ScheduleBlock** sin sesión en esa fecha → `item_type: "pending_schedule"`, `schedule_id` poblado, `can_take_attendance: false`

**CRÍTICO:** Para items de tipo `match`, el campo `club_event_id` debe retornar el ID del `ClubEvent` padre del partido. La app lo usa para llamar `GET /api/profesor/events/{club_event_id}/convocatoria` y mostrar la nómina en `PartidoDetalleScreen`.

---

### 9.2 Programación Semanal del Profesor

**Objetivo:** Devolver el horario recurrente (bloques fijos por día de la semana) asignados al profesor. La app los muestra en el tab "Semanal" de ProgramacionScreen y los proyecta sobre los próximos días.

```
GET /api/profesor/schedule
```

**Auth:** Bearer `profesor`

**Response 200:**

```json
[
  {
    "id": 12,
    "day_of_week": 1,
    "day_name": "Lunes",
    "title": "Entrenamiento Sub-15",
    "start_time": "18:00",
    "end_time": "20:00",
    "scope_type": "team",
    "target_ids": [1],
    "location": "Gimnasio A",
    "venue": { "id": 3, "name": "Gimnasio A" },
    "coach": { "id": 7, "name": "Pedro García" },
    "backup_coach": null,
    "is_mine": true
  }
]
```

**Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int | ID del bloque de horario |
| `day_of_week` | int (0-6) | 0=Domingo … 6=Sábado |
| `day_name` | string | Nombre del día en español (ej. `"Lunes"`) |
| `title` | string | Descripción del bloque (ej. `"Entrenamiento Sub-15"`) |
| `start_time` | `"HH:MM"` | Hora de inicio |
| `end_time` | `"HH:MM"` | Hora de término |
| `scope_type` | `"team" \| "category"` | Si aplica a un equipo específico o a una categoría |
| `target_ids` | `int[]` | IDs de los equipos/categorías a los que aplica |
| `location` | `string \| null` | Lugar |
| `venue` | `{ id, name } \| null` | Recinto |
| `coach` | `{ id, name } \| null` | Profesor principal |
| `backup_coach` | `{ id, name } \| null` | Profesor de respaldo |
| `is_mine` | `bool` | `true` si el profesor autenticado es el coach principal |

---

### 9.3 Crear sesión desde bloque de horario

**Objetivo:** Cuando el profesor toca un bloque `pending_schedule` en la agenda semanal, la app crea una sesión de asistencia concreta para esa fecha a partir del bloque recurrente.

```
POST /api/profesor/schedule/{slot_id}/session
```

**Auth:** Bearer `profesor`

**Body:**
```json
{
  "date": "2026-04-07",
  "team_id": 1
}
```

**Validaciones:**
- `slot_id` debe pertenecer al club del profesor autenticado.
- `date` debe coincidir con el `day_of_week` del bloque (o si no, aceptar de todas formas y loguear).
- Si ya existe una sesión para ese bloque + fecha, devolver la existente (idempotente, no 409).

**Response 201:**
```json
{
  "session_id": 55,
  "title": "Entrenamiento Sub-15",
  "date": "2026-04-07",
  "status": "upcoming",
  "created": true
}
```

Si ya existía la sesión: devolver igual pero con `"created": false`.

---

### 9.4 Crear sesión de asistencia para un partido (actualización de 8.7)

> **ACTUALIZACIÓN al endpoint 8.7** — el body ahora acepta el campo opcional `match_id`.

```
POST /api/profesor/teams/{team_id}/attendance
```

**Body actualizado:**
```json
{
  "date": "2026-04-05",
  "type": "match",
  "title": "Sub-15 vs Rival FC",
  "match_id": 88
}
```

El campo `match_id` (opcional) permite al backend vincular la sesión de asistencia al partido específico, para:
- Evitar sesiones duplicadas para el mismo partido.
- Asociar la asistencia al resultado del partido en reportes.

Si ya existe una sesión vinculada al `match_id`, devolver la existente (idempotente).

**Response 201:** Mismo formato que 8.6 (detalle de sesión con `records` poblados).

---

### 9.5 Registrar resultado de un partido

```
PUT /api/profesor/matches/{match_id}/result
```

**Auth:** Bearer `profesor`

**Body:**
```json
{ "score": "2:1" }
```

**Formato de score:** `"{goles_local}:{goles_visita}"` (ej. `"2:1"`, `"0:0"`, `"15:7"`)

**Validaciones:**
- `match_id` debe pertenecer a un equipo del profesor autenticado.
- Ambos valores deben ser enteros ≥ 0.
- Se puede llamar múltiples veces (actualiza el resultado existente).

**Response 200:**
```json
{ "ok": true }
```

**Errores:**

| HTTP | Caso |
|------|------|
| `403` | El partido no pertenece a un equipo del profesor |
| `404` | Partido no encontrado |
| `400` | Formato de score inválido |

