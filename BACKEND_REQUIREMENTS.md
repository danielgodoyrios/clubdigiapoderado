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
