import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { mockUser } from '../../mock/data';

const BLUE = Colors.blue;

type Role = 'apoderado' | 'profesor' | 'admin';

const ROLE_META: Record<Role, {
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

const NAV_TARGET: Record<Role, string> = {
  apoderado: 'PupilSelector',
  profesor:  'ProfesorHome',
  admin:     'AdminHome',
};

export default function RoleSelectorScreen({ navigation }: any) {
  const roles = mockUser.roles as Role[];

  // Si el usuario no tiene ningún rol → ir a enrolamiento
  useEffect(() => {
    if (roles.length === 0) {
      navigation.replace('Enrollment');
    }
  }, []);

  // Si tiene exactamente 1 rol → saltar selector
  useEffect(() => {
    if (roles.length === 1) {
      navigation.replace(NAV_TARGET[roles[0]]);
    }
  }, []);

  function selectRole(role: Role) {
    navigation.replace(NAV_TARGET[role]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoI}>CLUB</Text>
          <Text style={styles.logoB}>DIGI</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.greeting}>Hola, {mockUser.name}</Text>
        <Text style={styles.title}>¿Con qué rol{'\n'}ingresas hoy?</Text>
        <Text style={styles.sub}>
          Tienes {roles.length} roles activos en el sistema.
        </Text>

        <FlatList
          data={roles}
          keyExtractor={r => r}
          contentContainerStyle={{ gap: 12, marginTop: 24 }}
          renderItem={({ item: role }) => {
            const meta = ROLE_META[role];
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => selectRole(role)}
                activeOpacity={0.85}
              >
                <View style={[styles.iconBox, { backgroundColor: meta.color + '15' }]}>
                  <Ionicons name={meta.icon as any} size={26} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roleLabel}>{meta.label}</Text>
                  <Text style={styles.roleSub}>{meta.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.gray} />
              </TouchableOpacity>
            );
          }}
        />

        {/* Agregar otro rol */}
        <TouchableOpacity
          style={styles.addRoleBtn}
          onPress={() => navigation.navigate('Enrollment')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={16} color={BLUE} />
          <Text style={styles.addRoleTxt}>Agregar nuevo rol</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.surf },
  header:     { backgroundColor: BLUE, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 22 },
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
  iconBox:    { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  roleLabel:  { fontSize: 15, fontWeight: '700', color: Colors.black, marginBottom: 2 },
  roleSub:    { fontSize: 12, color: Colors.gray, lineHeight: 16 },
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
