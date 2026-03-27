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
> Endpoint público (sin auth). Devuelve si el carnet es válido.

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

### 11.2 Actualizar preferencias de notificación
```
PUT /apoderado/me/notifications
```
**Body:**
```json
{
  "pagos": true,
  "asistencia": true,
  "comunicados": true,
  "agenda": false
}
```
**Response 200:** preferencias actualizadas

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

**Validaciones:**
- `push_token` requerido · formato `ExponentPushToken[xxxx]` o `ExpoPushToken[xxxx]`
- `platform` requerido · enum: `android` | `ios`
- `device_id` requerido · UUID v4

**Comportamiento:**
- Si el `device_id` ya existe: **actualizar** el `push_token` (upsert, no duplicar)
- Si el `push_token` ya está registrado en otro `device_id`: mover al nuevo
- No fallar si el dispositivo ya tenía otro token (actualizar silenciosamente)

**Response 200:** `{ "ok": true }`

---

### PUT /apoderado/me/notifications
Actualizar preferencias de notificación.

**Validaciones:**
- Body debe tener al menos un campo — `400 EMPTY_BODY`
- Todos los campos son booleanos — `400 INVALID_TYPE` si no lo son

**Campos aceptados:** `pagos` · `asistencia` · `comunicados` · `agenda` · `justificativos`

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

**Eventos que disparan push:**
| Evento | Título | Cuerpo |
|--------|--------|--------|
| Justificativo aprobado | `Justificativo aprobado ✓` | `Tu justificativo del {fecha} fue aprobado` |
| Justificativo rechazado | `Justificativo rechazado` | `Tu justificativo del {fecha} no fue aprobado` |
| Nuevo comunicado | `Nuevo comunicado` | `{título del comunicado}` |
| Pago pendiente | `Pago pendiente` | `Tienes un pago de ${monto} pendiente` |
| Pago confirmado | `Pago confirmado ✓` | `Tu pago de ${monto} fue procesado` |

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
