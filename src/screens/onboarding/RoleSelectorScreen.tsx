import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue;

type Role = 'apoderado' | 'profesor' | 'admin';

const ROLE_META: Record<string, {
  icon: string;
  label: string;
  sub: string;
  color: string;
}> = {
  apoderado: {
    icon:  'people-outline',
    label: 'Apoderado',
    sub:   'Seguimiento de pupilos, pagos y comunicados',
    color: BLUE,
  },
  profesor: {
    icon:  'school-outline',
    label: 'Profesor / Coach',
    sub:   'Asistencia, planillas y comunicación con el club',
    color: '#0F7D4B',
  },
  admin: {
    icon:  'shield-checkmark-outline',
    label: 'Administrador',
    sub:   'Gestión del club, usuarios y configuración',
    color: '#7C1A3A',
  },
};

const SCREEN_FOR_ROLE: Record<string, string> = {
  apoderado: 'AppTabs',
  profesor:  'ProfesorHome',
  admin:     'AdminHome',
};

export default function RoleSelectorScreen({ navigation, route }: any) {
  const { state, setActiveRole } = useAuth();
  // fromApp=true cuando se llega desde dentro de la app (cambio de rol)
  const fromApp: boolean = route.params?.fromApp ?? false;

  const user  = state.status === 'authenticated' ? state.user  : null;
  const roles = (user?.roles ?? []) as string[];

  // Sin roles → enrolamiento
  useEffect(() => {
    if (state.status !== 'loading' && roles.length === 0) {
      navigation.replace('Enrollment');
    }
  }, [state.status]);

  // Un solo rol y es login inicial → saltar selector
  useEffect(() => {
    if (!fromApp && roles.length === 1) {
      applyRole(roles[0]);
    }
  }, [state.status]);

  const applyRole = async (role: string) => {
    await setActiveRole(role);
    const target = SCREEN_FOR_ROLE[role] ?? 'AppTabs';
    if (role === 'apoderado' && !fromApp) {
      // Login inicial: primero seleccionar pupilo
      navigation.replace('PupilSelector');
    } else {
      // Cambio en caliente: reset completo del stack
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: target }] }),
      );
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        {fromApp && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        <View style={styles.logo}>
          <Text style={styles.logoI}>CLUB</Text>
          <Text style={styles.logoB}>DIGI</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.greeting}>Hola, {user.name}</Text>
        <Text style={styles.title}>{fromApp ? '¿A qué rol{\n}deseas cambiar?' : '¿Con qué rol{\n}ingresas hoy?'}</Text>
        <Text style={styles.sub}>
          Tienes {roles.length} {roles.length === 1 ? 'rol activo' : 'roles activos'} en el sistema.
        </Text>

        <FlatList
          data={roles}
          keyExtractor={r => r}
          contentContainerStyle={{ gap: 12, marginTop: 24 }}
          renderItem={({ item: role }) => {
            const meta = ROLE_META[role] ?? { icon: 'ellipse-outline', label: role, sub: '', color: BLUE };
            const isActive = state.status === 'authenticated' && state.activeRole === role;
            return (
              <TouchableOpacity
                style={[styles.card, isActive && styles.cardActive]}
                onPress={() => applyRole(role)}
                activeOpacity={0.85}
              >
                <View style={[styles.iconBox, { backgroundColor: meta.color + '15' }]}>
                  <Ionicons name={meta.icon as any} size={26} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roleLabel}>{meta.label}</Text>
                  <Text style={styles.roleSub}>{meta.sub}</Text>
                </View>
                {isActive
                  ? <View style={styles.activeBadge}><Text style={styles.activeTxt}>Activo</Text></View>
                  : <Ionicons name="chevron-forward" size={18} color={Colors.gray} />}
              </TouchableOpacity>
            );
          }}
        />

        {!fromApp && (
          <TouchableOpacity
            style={styles.addRoleBtn}
            onPress={() => navigation.navigate('Enrollment')}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={16} color={BLUE} />
            <Text style={styles.addRoleTxt}>Agregar nuevo rol</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.surf },
  header:     { backgroundColor: BLUE, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 22, flexDirection: 'row', alignItems: 'center', gap: 12 },
  back:       { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  logo:       { flexDirection: 'row', alignItems: 'baseline' },
  logoI:      { fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:      { fontSize: 16, fontWeight: '800', color: '#fff' },
  body:       { flex: 1, padding: 24, paddingTop: 30 },
  greeting:   { fontSize: 13, color: Colors.gray, marginBottom: 4 },
  title:      { fontSize: 26, fontWeight: '800', color: Colors.black, letterSpacing: -0.5, marginBottom: 8 },
  sub:        { fontSize: 13, color: Colors.gray },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardActive:  { borderWidth: 2, borderColor: BLUE },
  iconBox:    { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  roleLabel:  { fontSize: 15, fontWeight: '700', color: Colors.black, marginBottom: 2 },
  roleSub:    { fontSize: 12, color: Colors.gray, lineHeight: 16 },
  activeBadge:{ backgroundColor: BLUE + '18', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  activeTxt:  { fontSize: 11, fontWeight: '700', color: BLUE },
  addRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: 28,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  addRoleTxt: { fontSize: 13, color: BLUE, fontWeight: '600' },
});
