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
