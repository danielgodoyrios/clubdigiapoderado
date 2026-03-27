import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { NotificationsAPI } from '../api';
import { navigationRef } from '../navigation';

// Pantallas válidas que se pueden abrir desde una notificación
const VALID_SCREENS = [
  'Pagos', 'PagoDetalle',
  'Comunicados', 'ComunicadoDetalle',
  'Asistencia', 'AsistenciaDetalle',
  'Documentos', 'DocumentoFirma',
  'Carnet', 'Agenda',
  'Justificativo',
] as const;

type NotifScreen = typeof VALID_SCREENS[number];

// Comportamiento cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Solicita permisos, obtiene el Expo Push Token y lo registra en el backend.
 * También escucha notificaciones en primer plano y respuestas del usuario.
 * Solo actúa cuando isAuthenticated === true.
 */
export function usePushNotifications(isAuthenticated: boolean) {
  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    registerForPushNotifications();

    // Notificación recibida con la app abierta
    notifListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Push] Recibida:', notification.request.content.title);
    });

    // Usuario tocó la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const screen = data?.screen as string | undefined;
      const params = data?.params as Record<string, unknown> | undefined;

      if (screen && (VALID_SCREENS as readonly string[]).includes(screen)) {
        // Esperar a que el NavigationContainer esté listo
        const navigate = () => {
          if (navigationRef.current?.isReady()) {
            navigationRef.current.navigate(screen as NotifScreen, params as any);
          } else {
            setTimeout(navigate, 300);
          }
        };
        navigate();
      }
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated]);
}

async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.warn('[Push] Push no disponible en simulador/emulador');
    return;
  }

  // Canal por defecto para Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'ClubDigi',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1A3A7C',
      sound: 'default',
    });
  }

  // Verificar/solicitar permisos
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Permisos no otorgados por el usuario');
    return;
  }

  // Obtener Expo Push Token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.error('[Push] projectId no encontrado en app.json');
    return;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[Push] Token:', tokenData.data);
    await NotificationsAPI.registerToken(tokenData.data);
  } catch (err) {
    console.error('[Push] Error al registrar token:', err);
  }
}
