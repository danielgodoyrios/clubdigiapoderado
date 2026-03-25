import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Switch,
  StyleSheet, SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue;

export default function ConfiguracionScreen({ navigation }: any) {
  const { logout, state } = useAuth();
  const roles = state.status === 'authenticated' ? (state.user?.roles ?? []) : [];
  const hasMultiRoles = roles.length > 1;
  const [notifPartidos,    setNotifPartidos]    = useState(true);
  const [notifEntrenam,    setNotifEntrenam]    = useState(true);
  const [notifComunicados, setNotifComunicados] = useState(true);
  const [notifPagos,       setNotifPagos]       = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Deseas salir de tu cuenta ClubDigi?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir',    style: 'destructive', onPress: logout },
      ],
    );
  };

  const Row = ({
    label, sub, value, onToggle, last = false,
  }: {
    label: string; sub?: string; value: boolean; onToggle: (v: boolean) => void; last?: boolean;
  }) => (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.light, true: BLUE + '60' }}
        thumbColor={value ? BLUE : Colors.gray}
        ios_backgroundColor={Colors.light}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={{ backgroundColor: BLUE }}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.ic}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.logo}>
            <Text style={styles.logoI}>CLUB</Text>
            <Text style={styles.logoB}>DIGI</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.headerTitle}>
          <Text style={styles.pageTitle}>Configuración</Text>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Notifications */}
        <Text style={styles.sectionLbl}>NOTIFICACIONES</Text>
        <View style={styles.card}>
          <Row label="Partidos"      sub="Recordatorio 1h antes"          value={notifPartidos}    onToggle={setNotifPartidos}    />
          <Row label="Entrenamientos" sub="Recordatorio 2h antes"         value={notifEntrenam}    onToggle={setNotifEntrenam}    />
          <Row label="Comunicados"   sub="Nuevos mensajes del club"       value={notifComunicados} onToggle={setNotifComunicados} />
          <Row label="Pagos"         sub="Cuotas pendientes y vencidas"   value={notifPagos}       onToggle={setNotifPagos}       last />
        </View>

        {/* App info */}
        <Text style={[styles.sectionLbl, { marginTop: 16 }]}>INFORMACIÓN</Text>
        <View style={styles.card}>
          {[
            { label: 'Versión',      value: '1.0.0' },
            { label: 'Entorno',      value: 'Producción' },
            { label: 'Última sync',  value: 'Hoy 09:42' },
          ].map((r, i) => (
            <View key={i} style={[styles.infoRow, i > 0 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.infoVal}>{r.value}</Text>
            </View>
          ))}
        </View>

        {/* Role switch */}
        {hasMultiRoles && (
          <TouchableOpacity
            style={styles.switchRoleBtn}
            onPress={() => navigation.navigate('RoleSelector', { fromApp: true })}
            activeOpacity={0.85}
          >
            <Ionicons name="swap-horizontal-outline" size={18} color={BLUE} />
            <Text style={styles.switchRoleTxt}>Cambiar de rol</Text>
          </TouchableOpacity>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color={Colors.red} />
          <Text style={styles.logoutTxt}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.surf },
  topRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  logo:        { flexDirection: 'row', alignItems: 'baseline' },
  logoI:       { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:       { fontSize: 14, fontWeight: '800', color: '#fff' },
  ic:          { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 16 },
  pageTitle:   { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  body:        { flex: 1, paddingHorizontal: 14 },
  sectionLbl:  { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Colors.gray, marginTop: 14, marginBottom: 7 },
  card:        { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.light, overflow: 'hidden' },
  row:         { flexDirection: 'row', alignItems: 'center', padding: 13 },
  rowBorder:   { borderTopWidth: 1, borderTopColor: Colors.surf },
  rowLabel:    { fontSize: 13, fontWeight: '500', color: Colors.black },
  rowSub:      { fontSize: 10, color: Colors.gray, marginTop: 2 },
  infoRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 13 },
  infoVal:     { fontSize: 12, fontWeight: '600', color: Colors.gray },
  switchRoleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BLUE + '12', borderRadius: 12, borderWidth: 1, borderColor: BLUE + '30', paddingVertical: 14, marginTop: 16 },
  switchRoleTxt: { fontSize: 14, fontWeight: '700', color: BLUE },
  logoutBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.red + '12', borderRadius: 12, borderWidth: 1, borderColor: Colors.red + '30', paddingVertical: 14, marginTop: 10 },
  logoutTxt:   { fontSize: 14, fontWeight: '700', color: Colors.red },
});
