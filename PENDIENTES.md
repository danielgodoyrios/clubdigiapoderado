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
