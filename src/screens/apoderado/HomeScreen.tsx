
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { CarnetModal } from '../../components/CarnetModal';
import { CarnetIcon } from '../../components/CarnetIcon';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue; // #1A3A7C

const QUICK_ACTIONS = [
  { id: 'att',     icon: 'clipboard-outline',   label: 'Asistencia', primary: true },
  { id: 'pay',     icon: 'card-outline',         label: 'Pagos',      primary: true },
  { id: 'cal',     icon: 'calendar-outline',     label: 'Agenda' },
  { id: 'doc',     icon: 'document-text-outline',label: 'Documentos' },
  { id: 'msg',     icon: 'chatbubble-outline',   label: 'Comunicados' },
  { id: 'stats',   icon: 'bar-chart-outline',    label: 'Estadísticas' },
];

export const ApoderadoHomeScreen: React.FC = () => {
  const [carnetVisible, setCarnetVisible] = useState(false);
  const { state, setActivePupil } = useAuth();
  const [pupilIdx, setPupilIdx] = useState(0);

  // Usar datos reales del AuthContext
  const pupils = state.status === 'authenticated' ? state.pupils : [];
  const pupil  = pupils[pupilIdx] ?? null;

  const cyclePupil = () => {
    const nextIdx = (pupilIdx + 1) % pupils.length;
    setPupilIdx(nextIdx);
    setActivePupil(pupils[nextIdx]);
  };

  if (!pupil) return null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={{ backgroundColor: BLUE }}>
        {/* Top row */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.ic}>
            <Ionicons name="menu" size={22} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
          <View style={styles.logo}>
            <Text style={styles.logoI}>CLUB</Text>
            <Text style={styles.logoB}>DIGI</Text>
          </View>
          <View style={styles.hIcons}>
            <TouchableOpacity style={styles.ic}>
              <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.5)" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            {/* CARNET — solo icono + punto verde */}
            <CarnetIcon onPress={() => setCarnetVisible(true)} headerColor={BLUE} />
          </View>
        </View>

        {/* Pupil selector */}
        <TouchableOpacity style={styles.pupilSel} onPress={cyclePupil}>
          <View style={styles.pupilAv}>
            <Text style={styles.pupilAvTxt}>{pupil.initials}</Text>
            <View style={styles.pupilDot} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.apodLabel}>Apoderado de</Text>
            <Text style={styles.pupilName}>{pupil.name}</Text>
            <Text style={styles.pupilMeta}>{pupil.category} · #{pupil.number} · {pupil.club}</Text>
          </View>
          {pupils.length > 1 && (
            <View style={styles.switchPill}>
              <Ionicons name="chevron-forward" size={11} color="rgba(255,255,255,0.5)" />
              <Text style={styles.switchTxt}>{pupils.length} pupilos</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Status pills */}
        <View style={styles.pillsRow}>
          <View style={styles.statusPill}>
            <View style={[styles.pillDot, { backgroundColor: Colors.ok }]} />
            <Text style={styles.pillLbl}>Asistencia</Text>
            <Text style={styles.pillVal}>{pupil.attendance_pct}%</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={[styles.pillDot, { backgroundColor: pupil.quota_pending ? '#D97706' : Colors.ok }]} />
            <Text style={styles.pillLbl}>Cuota</Text>
            <Text style={styles.pillVal}>{pupil.quota_pending ? 'Pendiente' : 'Al día'}</Text>
          </View>
        </View>
      </View>

      {/* BODY */}
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Quick actions */}
        <View style={styles.qaHeader}>
          <Text style={styles.sectionLbl}>ACCESOS RÁPIDOS</Text>
          <TouchableOpacity><Text style={[styles.editBtn, { color: BLUE }]}>Editar</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 9 }}>
          {QUICK_ACTIONS.map(a => (
            <TouchableOpacity key={a.id} style={styles.qaItem}>
              <View style={styles.qaCircle}>
                <Ionicons name={a.icon as any} size={19} color={a.primary ? BLUE : Colors.gray} />
              </View>
              <Text style={styles.qaLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Next match */}
        <View style={styles.section}>
          <Text style={styles.sectionLbl}>PRÓXIMO PARTIDO</Text>
          <View style={styles.card}>
            <View style={styles.matchTag}>
              <View style={[styles.tagDot, { backgroundColor: BLUE }]} />
              <Text style={[styles.tagTxt, { color: BLUE }]}>SÁBADO 28 · 10:00</Text>
            </View>
            <View style={styles.matchTeams}>
              <Text style={styles.teamName}>Sto. Domingo</Text>
              <Text style={styles.vs}>VS</Text>
              <Text style={styles.teamName}>Quilpué BC</Text>
            </View>
            <Text style={styles.matchMeta}>📍 Gim. Municipal · Liga Alevín</Text>
          </View>
        </View>

        {/* Attendance */}
        <View style={styles.section}>
          <Text style={styles.sectionLbl}>ASISTENCIA ESTE MES</Text>
          <View style={styles.card}>
            <View style={styles.attRow}>
              {[{v:'11',l:'Presentes',color:'#1a7c4a'},{v:'1',l:'Ausencias',color:Colors.red},{v:'92%',l:'% Total',color:Colors.black}].map((s,i) => (
                <View key={i} style={styles.attItem}>
                  <Text style={[styles.attVal, { color: s.color }]}>{s.v}</Text>
                  <Text style={styles.attLbl}>{s.l}</Text>
                  <View style={styles.attBar}><View style={[styles.attFill, { width: s.l==='Ausencias'?'8%':'92%' as any, backgroundColor: s.color }]} /></View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Comunicados */}
        <View style={styles.section}>
          <Text style={styles.sectionLbl}>COMUNICADOS</Text>
          <View style={styles.card}>
            {[
              { icon: 'chatbubble-outline', color: BLUE,       title: 'Cambio de horario', sub: 'Martes pasa a 18:30',     dot: BLUE },
              { icon: 'document-text-outline', color: Colors.gray, title: 'Autorización torneo', sub: 'Requiere firma · 5 Abr', dot: Colors.red },
            ].map((m, i) => (
              <View key={i} style={[styles.msgItem, i > 0 && styles.msgBorder]}>
                <View style={styles.msgIc}><Ionicons name={m.icon as any} size={13} color={m.color} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.msgTitle}>{m.title}</Text>
                  <Text style={styles.msgSub}>{m.sub}</Text>
                </View>
                <View style={[styles.unreadDot, { backgroundColor: m.dot }]} />
              </View>
            ))}
          </View>
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Carnet modal del pupilo */}
      <CarnetModal
        visible={carnetVisible}
        onClose={() => setCarnetVisible(false)}
        role="jugador"
        name={pupil.name}
        initials={pupil.initials}
        licenseId={pupil.license_id}
        headerColor={BLUE}
        position={pupil.category}
        club={pupil.club}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surf },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  logo: { flexDirection: 'row', alignItems: 'baseline' },
  logoI: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB: { fontSize: 14, fontWeight: '800', color: '#fff' },
  hIcons: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  ic: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notifDot: { position: 'absolute', top: 1, right: 1, width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.red },
  pupilSel: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 11 },
  pupilAv: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  pupilAvTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
  pupilDot: { position: 'absolute', bottom: -1, right: -1, width: 13, height: 13, borderRadius: 7, backgroundColor: Colors.ok, borderWidth: 2, borderColor: Colors.blue },
  apodLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  pupilName: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  pupilMeta: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  switchPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  switchTxt: { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  pillsRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 18, paddingBottom: 14 },
  statusPill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillLbl: { flex: 1, fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  pillVal: { fontSize: 9, color: '#fff', fontWeight: '700' },
  body: { flex: 1 },
  qaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 7 },
  sectionLbl: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Colors.gray },
  editBtn: { fontSize: 11, fontWeight: '600' },
  qaItem: { alignItems: 'center', gap: 5, width: 56, marginBottom: 4 },
  qaCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.light, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontSize: 9, color: Colors.black, fontWeight: '500', textAlign: 'center', lineHeight: 12 },
  section: { paddingHorizontal: 14, marginBottom: 8, marginTop: 4 },
  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 11, borderWidth: 1, borderColor: Colors.light },
  matchTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagTxt: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  matchTeams: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  teamName: { fontSize: 12, fontWeight: '700', color: Colors.black },
  vs: { fontSize: 10, fontWeight: '600', color: Colors.gray },
  matchMeta: { fontSize: 10, color: Colors.gray },
  attRow: { flexDirection: 'row', gap: 8 },
  attItem: { flex: 1, alignItems: 'center' },
  attVal: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  attLbl: { fontSize: 9, color: Colors.gray, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  attBar: { height: 4, backgroundColor: Colors.light, borderRadius: 2, overflow: 'hidden', width: '100%', marginTop: 3 },
  attFill: { height: '100%', borderRadius: 2 },
  msgItem: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 8 },
  msgBorder: { borderTopWidth: 1, borderTopColor: Colors.surf },
  msgIc: { width: 28, height: 28, borderRadius: 7, backgroundColor: Colors.surf, borderWidth: 1, borderColor: Colors.light, alignItems: 'center', justifyContent: 'center' },
  msgTitle: { fontSize: 11, fontWeight: '600', color: Colors.black },
  msgSub: { fontSize: 10, color: Colors.gray, marginTop: 1 },
  unreadDot: { width: 7, height: 7, borderRadius: 4 },
});
