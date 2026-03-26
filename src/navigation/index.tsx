
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Onboarding ──────────────────────────────────────────────
import SplashScreen        from '../screens/onboarding/SplashScreen';
import WelcomeScreen       from '../screens/onboarding/WelcomeScreen';
import PhoneScreen         from '../screens/onboarding/PhoneScreen';
import OTPScreen           from '../screens/onboarding/OTPScreen';
import RoleSelectorScreen  from '../screens/onboarding/RoleSelectorScreen';
import EnrollmentScreen    from '../screens/onboarding/EnrollmentScreen';
import PupilSelectorScreen from '../screens/onboarding/PupilSelectorScreen';

// ── Apoderado Tabs ───────────────────────────────────────────
import { ApoderadoHomeScreen } from '../screens/apoderado/HomeScreen';
import AgendaScreen            from '../screens/apoderado/AgendaScreen';
import GestionScreen           from '../screens/apoderado/GestionScreen';

// ── Apoderado Screens ────────────────────────────────────────
import AsistenciaScreen        from '../screens/apoderado/AsistenciaScreen';
import AsistenciaDetalleScreen from '../screens/apoderado/AsistenciaDetalleScreen';
import PagosScreen             from '../screens/apoderado/PagosScreen';
import PagoDetalleScreen       from '../screens/apoderado/PagoDetalleScreen';
import ComunicadosScreen       from '../screens/apoderado/ComunicadosScreen';
import ComunicadoDetalleScreen from '../screens/apoderado/ComunicadoDetalleScreen';
import DocumentosScreen        from '../screens/apoderado/DocumentosScreen';
import DocumentoFirmaScreen    from '../screens/apoderado/DocumentoFirmaScreen';
import CarnetScreen            from '../screens/apoderado/CarnetScreen';
import CarnetEnrolarScreen     from '../screens/apoderado/CarnetEnrolarScreen';
import PerfilScreen            from '../screens/apoderado/PerfilScreen';
import EditarPupilo            from '../screens/apoderado/EditarPupilo';
import ConfiguracionScreen     from '../screens/apoderado/ConfiguracionScreen';
import JustificativoScreen     from '../screens/apoderado/JustificativoScreen';

// ── Profesor ─────────────────────────────────────────────────
import ProfesorHomeScreen from '../screens/profesor/HomeScreen';

// ── Admin ─────────────────────────────────────────────────────
import AdminHomeScreen from '../screens/admin/HomeScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

function ApoderadoTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          borderTopColor: Colors.light,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
        },
        tabBarActiveTintColor:   Colors.blue,
        tabBarInactiveTintColor: Colors.gray,
        tabBarLabelStyle: { fontSize: 9, fontWeight: '700' },
        tabBarIcon: ({ color }) => {
          const icons: Record<string, string> = {
            Inicio:  'home-outline',
            Agenda:  'calendar-outline',
            Gestión: 'grid-outline',
          };
          return <Ionicons name={(icons[route.name] ?? 'ellipse-outline') as any} size={20} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio"  component={ApoderadoHomeScreen} />
      <Tab.Screen name="Agenda"  component={AgendaScreen} />
      <Tab.Screen name="Gestión" component={GestionScreen} />
    </Tab.Navigator>
  );
}

// ── Auth stack (no autenticado) ──────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      <Stack.Screen name="Splash"        component={SplashScreen} />
      <Stack.Screen name="Welcome"       component={WelcomeScreen} />
      <Stack.Screen name="Phone"         component={PhoneScreen} />
      <Stack.Screen name="OTP"           component={OTPScreen} />
      <Stack.Screen name="RoleSelector"  component={RoleSelectorScreen} />
      <Stack.Screen name="Enrollment"    component={EnrollmentScreen} />
      <Stack.Screen name="PupilSelector" component={PupilSelectorScreen} />
    </Stack.Navigator>
  );
}

// ── App stack (autenticado) ───────────────────────────────────
function AppStack({ role }: { role: string }) {
  const initialRoute =
    role === 'profesor' ? 'ProfesorHome' :
    role === 'admin'    ? 'AdminHome'    :
    'AppTabs';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
      {/* Selector de rol (accesible desde dentro de la app) */}
      <Stack.Screen name="RoleSelector"  component={RoleSelectorScreen} />
      <Stack.Screen name="PupilSelector" component={PupilSelectorScreen} />
      <Stack.Screen name="Enrollment"    component={EnrollmentScreen} />

      {/* ── Apoderado ── */}
      <Stack.Screen name="AppTabs"           component={ApoderadoTabs} />
      <Stack.Screen name="Asistencia"        component={AsistenciaScreen} />
      <Stack.Screen name="AsistenciaDetalle" component={AsistenciaDetalleScreen} />
      <Stack.Screen name="Pagos"             component={PagosScreen} />
      <Stack.Screen name="PagoDetalle"       component={PagoDetalleScreen} />
      <Stack.Screen name="Comunicados"       component={ComunicadosScreen} />
      <Stack.Screen name="ComunicadoDetalle" component={ComunicadoDetalleScreen} />
      <Stack.Screen name="Documentos"        component={DocumentosScreen} />
      <Stack.Screen name="DocumentoFirma"    component={DocumentoFirmaScreen} />
      <Stack.Screen name="Carnet"            component={CarnetScreen} />
      <Stack.Screen name="CarnetEnrolar"     component={CarnetEnrolarScreen} />
      <Stack.Screen name="Perfil"            component={PerfilScreen} />
      <Stack.Screen name="EditarPupilo"      component={EditarPupilo} />
      <Stack.Screen name="Configuracion"     component={ConfiguracionScreen} />
      <Stack.Screen name="Justificativo"     component={JustificativoScreen} />

      {/* ── Profesor ── */}
      <Stack.Screen name="ProfesorHome" component={ProfesorHomeScreen} />

      {/* ── Admin ── */}
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigation() {
  const { state } = useAuth();

  // Spinner mientras se verifica si hay sesión guardada
  if (state.status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.blue }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {state.status === 'authenticated'
        ? <AppStack role={state.activeRole} />
        : <AuthStack />
      }
    </NavigationContainer>
  );
}
