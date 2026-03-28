# ClubDigi — Pendientes Frontend

Lista de mejoras identificadas pero no urgentes. Implementar cuando corresponda.

---

## P-001 — Enviar `device_id` al registrar push token

**Prioridad:** Baja  
**Archivo:** `src/hooks/usePushNotifications.ts`  
**Función:** `registerForPushNotifications()`

**Contexto:**  
El backend acepta `device_id` (UUID del dispositivo) en `POST /apoderado/me/devices` para evitar duplicados cuando el mismo usuario tiene varios dispositivos. Actualmente el frontend no lo envía (`device_id: null` en la respuesta del backend).

**Implementación sugerida:**
```typescript
import * as Application from 'expo-application';

// Obtener ID único del dispositivo
const deviceId = Application.androidId   // Android
              ?? Application.getIosIdForVendorAsync(); // iOS (async)

await NotificationsAPI.registerToken(tokenData.data, deviceId, Platform.OS);
```

Actualizar `NotificationsAPI.registerToken` para aceptar los nuevos campos opcionales e incluirlos en el body.

**Dependencia:** Requiere instalar `expo-application` si no está disponible.

---

## P-002 — Modal de cobranza al tocar notificación de pago

**Prioridad:** Media (próxima versión)  
**Versión objetivo:** v1.3.x o superior

**Contexto:**  
Cuando el apoderado toca una notificación de tipo **cobranza/pago**, en vez de ir directo a la pantalla de pagos, mostrar un modal intermedio que permita gestionar la situación.

**Flujo propuesto:**

1. Notificación tipo `cobranza` recibida → al tocar, mostrar **Modal de Cobranza**
2. Modal pregunta: **"¿Ya realizaste el pago?"**
   - **Sí** → registrar pago, cerrar modal, navegar a PagosScreen
   - **No** → mostrar campo de fecha de regularización comprometida → guardar en backend
3. Si el apoderado debe **más de 3 meses** → mostrar opción adicional: **"Realizar abono parcial"**
   - Abono parcial integra flujo **Webpay** para pago en línea

**Componentes nuevos necesarios:**
- `CobranzaModal.tsx` — modal con los tres estados (pagó / no pagó + fecha / abono parcial)
- Integración Webpay (SDK o WebView hacia pasarela) — requiere coordinación con backend

**Backend necesita:**
- Endpoint para registrar fecha de regularización comprometida
- Endpoint para iniciar transacción Webpay y retornar URL de pago
- Webhook/callback para confirmar pago exitoso desde Webpay

**Nota:** La integración Webpay es la parte más compleja y se deja para una versión dedicada. El modal y la fecha de regularización pueden implementarse antes sin Webpay.

---

## P-003 — Badge de notificaciones no leídas

**Prioridad:** Media  
**Archivos:** `src/api/index.ts`, `src/components/Header.tsx` (o donde esté el ícono de campana)

**Contexto:**  
La pantalla de inbox (`NotificacionesScreen`), el `markRead` individual, el `markAllRead` y la navegación desde push ya están implementados. Lo que falta es mostrar un **badge con el número de no leídas** sobre el ícono de campana.

**Implementación sugerida:**

1. Agregar endpoint en la API:
```typescript
// api/index.ts
unreadCount: () => request<{ count: number }>('GET', '/apoderado/me/inbox/unread-count'),
```

2. Llamar al iniciar sesión y al volver de `NotificacionesScreen`:
```typescript
const { data } = await InboxAPI.unreadCount();
setUnreadCount(data.count); // estado global o contexto
```

3. Mostrar badge en el ícono de campana del Header con el número si `count > 0`.

**Nota:** El count debería actualizarse también cada vez que se marque una notificación como leída.

---

## P-004 — BUG: Crash al entrar a pantalla Documentos

**Prioridad:** Alta (bug en producción)  
**Archivo:** `src/screens/apoderado/DocumentosScreen.tsx`

**Descripción:**  
Al tocar "Documentos" desde el menú o navegación, la app se cierra o rompe. El crash ocurre probablemente porque:
- El backend devuelve un error o datos inesperados en `GET /apoderado/pupilos/{id}/documentos`
- El campo `doc.type` o `doc.status` trae un valor no mapeado en `TYPE_ICON` / `STATUS_MAP`, causando render inválido
- El endpoint aún no está implementado en el backend (devuelve 404/500)

**Pasos para reproducir:**  
1. Iniciar sesión como apoderado
2. Tocar "Documentos" desde el menú lateral o pantalla de gestión

**Investigación necesaria:**
- Verificar si el endpoint `GET /apoderado/pupilos/{id}/documentos` existe en backend
- Revisar logs del crash (Expo / logcat en Android)
- Agregar manejo de errores defensivo en DocumentosScreen si falta

---

## P-005 — Imagen de jugadores no se muestra

**Prioridad:** Media  
**Archivos:** `src/api/index.ts` (campo `photo`), pantallas que muestran datos del pupilo

**Descripción:**  
Las fotos/imágenes de los jugadores (pupilos) no se muestran. Actualmente el carnet y el menú lateral muestran solo las iniciales del nombre en un avatar de texto.

**Causa probable:**  
- El campo `photo` llega como `null` desde el backend (no hay foto cargada para los jugadores)
- O la URL de la imagen no es accesible (ruta relativa sin base URL, o sin permisos)

**Investigación necesaria:**  
- Verificar si el backend efectivamente devuelve un valor en `photo` para los pupilos
- Si llega una URL, revisar que sea absoluta (con `https://`) y accesible
- Implementar `<Image source={{ uri: pupil.photo }} />` en `CarnetModal` y `SideMenu` cuando `photo` exista, con fallback a las iniciales si es `null`

---

## P-006 — BUG: Envío de justificativo falla con "No se pudo enviar"

**Prioridad:** Alta (flujo crítico)  
**Archivo:** `src/screens/apoderado/JustificativoScreen.tsx` → `handleSubmit`

**Descripción:**  
Al completar el formulario de justificativo y presionar "Enviar", aparece un mensaje de error y no se envía. El mensaje proviene directamente del backend (`err.message`), por lo que el problema está en el servidor, no en el frontend.

**Posibles causas a verificar en backend:**
- El endpoint `POST /apoderado/pupilos/{id}/justificativos` no existe o tiene un error 500
- Falla de validación (campo requerido que el frontend no envía, o formato incorrecto de fecha/datos)
- El campo `file_base64` genera un error si el archivo es muy grande o tiene formato inesperado
- Problema de permisos o autenticación en el endpoint

**Frontend — lo que envía:**
```json
{
  "date": "YYYY-MM-DD",
  "type": "medico|deportivo|otro",
  "reason": "texto",
  "days": 1,
  "file_base64": "...",  // opcional
  "file_name": "..."     // opcional
}
```

**Acción:** Verificar con el desarrollador backend que el endpoint existe, acepta estos campos y no tiene errores internos. Revisar logs del servidor al momento del envío.

---

## P-007 — Manejo de errores centralizado desde el backend

**Prioridad:** Media (calidad UX)  
**Alcance:** Todos los endpoints — `src/api/index.ts`

**Descripción:**  
Actualmente cuando el backend devuelve un error, el frontend muestra directamente `err.message` que puede ser un mensaje técnico o en inglés. El manejo de errores debe ser responsabilidad del backend: devolver mensajes claros, en español, y con códigos HTTP apropiados.

**Convención esperada del backend:**
```json
// Error de validación → 422
{ "message": "La fecha de ausencia es requerida." }

// Error de negocio → 400
{ "message": "El pupilo no tiene sesiones registradas en esa fecha." }

// No autorizado → 401
{ "message": "Tu sesión ha expirado. Inicia sesión nuevamente." }

// Error interno → 500
{ "message": "Ocurrió un error inesperado. Intenta más tarde." }
```

**Lo que hace el frontend:** Muestra el `message` tal cual llega. Si el backend envía mensajes correctos, el usuario verá mensajes apropiados automáticamente en todas las pantallas sin cambios en el frontend.

**Acción:** Coordinar con el desarrollador backend para estandarizar las respuestas de error en todos los endpoints con mensajes en español, descriptivos y orientados al usuario final.

---
