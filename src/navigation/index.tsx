
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';

// ── Onboarding ──────────────────────────────────────────────
import SplashScreen        from '../screens/onboarding/SplashScreen';
import PhoneScreen         from '../screens/onboarding/PhoneScreen';
import OTPScreen           from '../screens/onboarding/OTPScreen';
import PupilSelectorScreen from '../screens/onboarding/PupilSelectorScreen';

// ── Tabs ────────────────────────────────────────────────────
import { ApoderadoHomeScreen } from '../screens/apoderado/HomeScreen';
import AgendaScreen            from '../screens/apoderado/AgendaScreen';
import GestionScreen           from '../screens/apoderado/GestionScreen';

// ── Asistencia ──────────────────────────────────────────────
import AsistenciaScreen       from '../screens/apoderado/AsistenciaScreen';
import AsistenciaDetalleScreen from '../screens/apoderado/AsistenciaDetalleScreen';

// ── Pagos ────────────────────────────────────────────────────
import PagosScreen      from '../screens/apoderado/PagosScreen';
import PagoDetalleScreen from '../screens/apoderado/PagoDetalleScreen';

// ── Comunicados ──────────────────────────────────────────────
import ComunicadosScreen       from '../screens/apoderado/ComunicadosScreen';
import ComunicadoDetalleScreen from '../screens/apoderado/ComunicadoDetalleScreen';

// ── Documentos ───────────────────────────────────────────────
import DocumentosScreen    from '../screens/apoderado/DocumentosScreen';
import DocumentoFirmaScreen from '../screens/apoderado/DocumentoFirmaScreen';

// ── Carnet ───────────────────────────────────────────────────
import CarnetScreen        from '../screens/apoderado/CarnetScreen';
import CarnetEnrolarScreen from '../screens/apoderado/CarnetEnrolarScreen';

// ── Perfil ───────────────────────────────────────────────────
import PerfilScreen         from '../screens/apoderado/PerfilScreen';
import EditarPupilo         from '../screens/apoderado/EditarPupilo';
import ConfiguracionScreen  from '../screens/apoderado/ConfiguracionScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          borderTopColor: Colors.light,
          height: 60,
          paddingBottom: 8,
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

export default function AppNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        {/* ── Onboarding ── */}
        <Stack.Screen name="Splash"         component={SplashScreen} />
        <Stack.Screen name="Phone"          component={PhoneScreen} />
        <Stack.Screen name="OTP"            component={OTPScreen} />
        <Stack.Screen name="PupilSelector"  component={PupilSelectorScreen} />

        {/* ── App (tabs) ── */}
        <Stack.Screen name="AppTabs"        component={AppTabs} />

        {/* ── Asistencia ── */}
        <Stack.Screen name="Asistencia"        component={AsistenciaScreen} />
        <Stack.Screen name="AsistenciaDetalle" component={AsistenciaDetalleScreen} />

        {/* ── Pagos ── */}
        <Stack.Screen name="Pagos"       component={PagosScreen} />
        <Stack.Screen name="PagoDetalle" component={PagoDetalleScreen} />

        {/* ── Comunicados ── */}
        <Stack.Screen name="Comunicados"       component={ComunicadosScreen} />
        <Stack.Screen name="ComunicadoDetalle" component={ComunicadoDetalleScreen} />

        {/* ── Documentos ── */}
        <Stack.Screen name="Documentos"     component={DocumentosScreen} />
        <Stack.Screen name="DocumentoFirma" component={DocumentoFirmaScreen} />

        {/* ── Carnet ── */}
        <Stack.Screen name="Carnet"        component={CarnetScreen} />
        <Stack.Screen name="CarnetEnrolar" component={CarnetEnrolarScreen} />

        {/* ── Perfil ── */}
        <Stack.Screen name="Perfil"         component={PerfilScreen} />
        <Stack.Screen name="EditarPupilo"   component={EditarPupilo} />
        <Stack.Screen name="Configuracion"  component={ConfiguracionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
