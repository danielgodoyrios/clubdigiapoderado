import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const MAROON = '#7C1A3A';

export default function AdminHomeScreen({ navigation }: any) {
  const { state } = useAuth();
  const user = state.status === 'authenticated' ? state.user : null;
  const name = user?.name ?? 'Admin';
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={{ backgroundColor: MAROON }}>
        <View style={styles.topRow}>
          <View style={styles.logo}>
            <Text style={styles.logoI}>CLUB</Text>
            <Text style={styles.logoB}>DIGI</Text>
          </View>
          <TouchableOpacity
            style={styles.switchRole}
            onPress={() => navigation.replace('RoleSelector')}
          >
            <Ionicons name="swap-horizontal-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.switchTxt}>Cambiar rol</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rolePill}>ADMINISTRADOR</Text>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userMeta}>Panel de Administración</Text>
          </View>
        </View>
      </View>

      {/* Body */}
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.comingSoon}>Panel Admin</Text>
        <Text style={styles.comingSoonSub}>
          Esta sección está en desarrollo.{'\n'}
          Las siguientes funcionalidades estarán disponibles próximamente:
        </Text>

        {[
          { icon: 'people-outline',         label: 'Gestión de Usuarios',    sub: 'Apoderados, profesores y jugadores' },
          { icon: 'shield-outline',          label: 'Roles y Permisos',       sub: 'Asignar y revocar accesos' },
          { icon: 'card-outline',            label: 'Finanzas del Club',      sub: 'Cuotas, pagos y estados de cuenta' },
          { icon: 'document-text-outline',   label: 'Documentos Oficiales',   sub: 'Contratos, licencias y actas' },
          { icon: 'notifications-outline',   label: 'Comunicaciones Masivas', sub: 'Enviar comunicados a todos los apoderados' },
          { icon: 'settings-outline',        label: 'Configuración del Club', sub: 'Datos, categorías y temporadas' },
          { icon: 'bar-chart-outline',       label: 'Reportes',               sub: 'Asistencia, pagos y actividad' },
          { icon: 'key-outline',             label: 'Códigos de Invitación',  sub: 'Generar y gestionar códigos de acceso' },
        ].map((item, i) => (
          <View key={i} style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: MAROON + '12' }]}>
              <Ionicons name={item.icon as any} size={22} color={MAROON} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureLabel}>{item.label}</Text>
              <Text style={styles.featureSub}>{item.sub}</Text>
            </View>
            <View style={styles.soonBadge}>
              <Text style={styles.soonTxt}>Próximo</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.surf },
  topRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  logo:      { flexDirection: 'row', alignItems: 'baseline' },
  logoI:     { fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:     { fontSize: 16, fontWeight: '800', color: '#fff' },
  switchRole:{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  switchTxt: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  profileRow:{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  avatar:    { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 17, fontWeight: '800', color: '#fff' },
  rolePill:  { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 2 },
  userName:  { fontSize: 17, fontWeight: '800', color: '#fff' },
  userMeta:  { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  body:      { flex: 1, padding: 20 },
  comingSoon:    { fontSize: 20, fontWeight: '800', color: Colors.black, marginTop: 8, marginBottom: 6 },
  comingSoonSub: { fontSize: 13, color: Colors.gray, lineHeight: 18, marginBottom: 20 },
  featureCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  featureIcon:  { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featureLabel: { fontSize: 14, fontWeight: '700', color: Colors.black },
  featureSub:   { fontSize: 12, color: Colors.gray, marginTop: 1 },
  soonBadge:    { backgroundColor: '#F0F0F0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  soonTxt:      { fontSize: 10, fontWeight: '700', color: Colors.gray },
});
