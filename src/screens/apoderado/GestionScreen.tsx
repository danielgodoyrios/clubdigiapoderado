import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { CarnetIcon } from '../../components/CarnetIcon';
import { CarnetModal } from '../../components/CarnetModal';
import SideMenu from '../../components/SideMenu';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue;

const SECTIONS = [
  {
    title: 'Seguimiento',
    items: [
      { id: 'asistencia', icon: 'clipboard-outline',    label: 'Asistencia',      sub: 'Ver historial mensual',             dot: Colors.ok,    screen: 'Asistencia',        active: true  },
      { id: 'pagos',      icon: 'card-outline',          label: 'Pagos',           sub: 'Cuotas y estado de pago',           dot: Colors.amber, screen: 'Pagos',             active: true  },
      { id: 'horarios',   icon: 'time-outline',          label: 'Horarios',        sub: 'Programación de entrenamientos',    dot: BLUE,         screen: 'Horarios',          active: true  },
      { id: 'agenda',     icon: 'calendar-outline',      label: 'Agenda',          sub: 'Calendario de eventos',             dot: Colors.gray,  screen: 'Agenda',            active: true  },
      { id: 'convocatorias', icon: 'megaphone-outline',  label: 'Convocatorias',   sub: 'Confirma tu asistencia',            dot: Colors.amber, screen: 'Convocatorias',     active: true  },
    ],
  },
  {
    title: 'Trámites',
    items: [
      { id: 'justificativo', icon: 'add-circle-outline', label: 'Nuevo Justificativo', sub: 'Enviar ausencia al club',              dot: Colors.ok,    screen: 'Justificativo',     active: true },
      { id: 'misjust',      icon: 'document-outline',   label: 'Mis Justificativos', sub: 'Historial de justificaciones',         dot: Colors.amber, screen: 'MisJustificativos', active: true },
      { id: 'permiso',      icon: 'ribbon-outline',     label: 'Permiso Deportivo',  sub: 'Actividad oficial · Ausencia escolar', dot: BLUE,         screen: 'PermisoDeportivo',  active: true },
    ],
  },
  {
    title: 'Comunicación',
    items: [
      { id: 'comunicados', icon: 'chatbubble-outline',     label: 'Comunicados',    sub: 'Avisos del club',             dot: BLUE,         screen: 'Comunicados',  active: true },
      { id: 'consultas',   icon: 'help-circle-outline',    label: 'Consultas',      sub: 'Envía preguntas al club',     dot: BLUE,         screen: 'Consultas',    active: true },
      { id: 'encuestas',   icon: 'bar-chart-outline',      label: 'Encuestas',      sub: 'Participa y opina',           dot: Colors.green, screen: 'Encuestas',    active: true },
      { id: 'documentos',  icon: 'document-text-outline',  label: 'Documentos',     sub: 'Autorizaciones y contratos',  dot: BLUE,         screen: 'Documentos',   active: true },
    ],
  },
  {
    title: 'Club',
    items: [
      { id: 'institucional', icon: 'people-outline',  label: 'El Club',          sub: 'Directiva y cuerpo técnico',   dot: BLUE,         screen: 'InfoInstitucional',   active: true  },
      { id: 'encuestas2',    icon: 'pricetag-outline', label: 'Beneficios',       sub: 'Descuentos y ventajas',        dot: Colors.green, screen: null,                  active: false },
      { id: 'tienda',        icon: 'bag-outline',      label: 'Tienda',           sub: 'Indumentaria del club',        dot: Colors.amber, screen: 'Tienda',              active: true  },
    ],
  },
  {
    title: 'Salud',
    items: [
      { id: 'lesiones', icon: 'medkit-outline', label: 'Lesiones y Enfermedades', sub: 'Historial médico del jugador', dot: Colors.red, screen: 'HistorialLesiones', active: true },
    ],
  },
  {
    title: 'Identificación',
    items: [
      { id: 'carnet',  icon: 'card-outline',    label: 'Carnet Digital',  sub: 'Ver QR + token',     dot: Colors.ok,   screen: 'Carnet',        active: true },
      { id: 'enrolar', icon: 'qr-code-outline', label: 'Enrolar en Liga', sub: 'Escanear código QR', dot: Colors.gray, screen: 'CarnetEnrolar', active: true },
    ],
  },
  {
    title: 'Mi Cuenta',
    items: [
      { id: 'perfil', icon: 'person-outline',   label: 'Perfil',         sub: 'Datos del apoderado',         dot: Colors.gray, screen: 'Perfil',        active: true },
      { id: 'config', icon: 'settings-outline', label: 'Configuración',  sub: 'Notificaciones · Logout',     dot: Colors.gray, screen: 'Configuracion', active: true },
    ],
  },
];

export default function GestionScreen({ navigation }: any) {
  const { state } = useAuth();
  const pupil = state.status === 'authenticated' ? state.activePupil : null;
  const pupilLabel = pupil ? `${pupil.name}${pupil.category ? ` · ${pupil.category}` : ''}` : '';
  const [carnetVisible, setCarnetVisible] = useState(false);
  const [menuVisible,   setMenuVisible]   = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} navigation={navigation} />
      {/* ── Header ── */}
      <View style={{ backgroundColor: BLUE }}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.ic} onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={22} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
          <View style={styles.logo}>
            <Text style={styles.logoI}>CLUB</Text>
            <Text style={styles.logoB}>DIGI</Text>
          </View>
          <View style={styles.hIcons}>
            <TouchableOpacity style={styles.ic} onPress={() => navigation.navigate('Notificaciones')}>
              <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
            <CarnetIcon onPress={() => setCarnetVisible(true)} headerColor={BLUE} />
          </View>
        </View>
        <View style={styles.headerTitle}>
          <Text style={styles.pageTitle}>Gestión</Text>
          <Text style={styles.pageSub}>{pupilLabel}</Text>
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {SECTIONS.map(sec => (
          <View key={sec.title} style={styles.section}>
            <Text style={styles.sectionLbl}>{sec.title.toUpperCase()}</Text>
            <View style={styles.card}>
              {sec.items.map((item, i) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.row, i > 0 && styles.rowBorder, !item.active && { opacity: 0.45 }]}
                  onPress={item.active && item.screen ? () => navigation.navigate(item.screen!) : undefined}
                  disabled={!item.active}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowIcon}>
                    <Ionicons name={item.icon as any} size={18} color={item.active ? BLUE : Colors.gray} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    <Text style={styles.rowSub}>{item.sub}</Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: item.dot }]} />
                  <Ionicons name="chevron-forward" size={15} color={Colors.light} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: 28 }} />
      </ScrollView>

      <CarnetModal
        visible={carnetVisible}
        onClose={() => setCarnetVisible(false)}
        role="jugador"
        name="Carlos Muñoz Jr."
        initials="CM"
        licenseId="LIC-2026-0892"
        headerColor={BLUE}
        position="Alevín · #8"
        club="C.D. Santo Domingo"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.surf },
  topRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  logo:        { flexDirection: 'row', alignItems: 'baseline' },
  logoI:       { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:       { fontSize: 14, fontWeight: '800', color: '#fff' },
  hIcons:      { flexDirection: 'row', gap: 4, alignItems: 'center' },
  ic:          { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { paddingHorizontal: 18, paddingBottom: 14, paddingTop: 4 },
  pageTitle:   { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  pageSub:     { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  body:        { flex: 1 },
  section:     { paddingHorizontal: 14, marginTop: 14 },
  sectionLbl:  { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Colors.gray, marginBottom: 7 },
  card:        { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.light, overflow: 'hidden' },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13 },
  rowBorder:   { borderTopWidth: 1, borderTopColor: Colors.surf },
  rowIcon:     { width: 36, height: 36, borderRadius: 10, backgroundColor: BLUE + '12', alignItems: 'center', justifyContent: 'center' },
  rowLabel:    { fontSize: 13, fontWeight: '600', color: Colors.black },
  rowSub:      { fontSize: 10, color: Colors.gray, marginTop: 1 },
  statusDot:   { width: 8, height: 8, borderRadius: 4 },
});
