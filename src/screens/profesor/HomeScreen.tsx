import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const GREEN = '#0F7D4B';

export default function ProfesorHomeScreen({ navigation }: any) {
  const { state } = useAuth();
  const user = state.status === 'authenticated' ? state.user : null;
  const name = user?.name ?? 'Profesor';
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const teams = user?.profesor_info?.teams ?? [];
  const teamNames = teams.map(t => t.name);
  const firstTeam = teamNames[0] ?? 'Club';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={{ backgroundColor: GREEN }}>
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

        {/* Profesor info */}
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rolePill}>PROFESOR / COACH</Text>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userMeta}>{firstTeam}</Text>
          </View>
        </View>

        {/* Categorías / Equipos */}
        <View style={styles.tagsRow}>
          {teamNames.length > 0 ? teamNames.map(cat => (
            <View key={cat} style={styles.tag}>
              <Text style={styles.tagTxt}>{cat}</Text>
            </View>
          )) : null}
        </View>
      </View>

      {/* Body */}
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.comingSoon}>
          Panel Profesor
        </Text>
        <Text style={styles.comingSoonSub}>
          Esta sección está en desarrollo.{'\n'}
          Las siguientes funcionalidades estarán disponibles próximamente:
        </Text>

        {[
          { icon: 'clipboard-outline',    label: 'Pasar Asistencia',       sub: 'Registro rápido por sesión' },
          { icon: 'people-outline',        label: 'Ver mis jugadores',       sub: 'Listado por categoría' },
          { icon: 'calendar-outline',      label: 'Mi Agenda',               sub: 'Entrenamientos y partidos' },
          { icon: 'chatbubble-outline',    label: 'Comunicados',             sub: 'Mensajes del club' },
          { icon: 'bar-chart-outline',     label: 'Estadísticas',            sub: 'Rendimiento del equipo' },
          { icon: 'document-text-outline', label: 'Planillas',               sub: 'Actas y documentos oficiales' },
        ].map((item, i) => (
          <View key={i} style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: GREEN + '15' }]}>
              <Ionicons name={item.icon as any} size={22} color={GREEN} />
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
  profileRow:{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  avatar:    { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 17, fontWeight: '800', color: '#fff' },
  rolePill:  { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 2 },
  userName:  { fontSize: 17, fontWeight: '800', color: '#fff' },
  userMeta:  { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  tagsRow:   { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 16, marginTop: 4 },
  tag:       { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tagTxt:    { fontSize: 11, color: '#fff', fontWeight: '600' },
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
