
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { CarnetModal } from '../../components/CarnetModal';
import { CarnetIcon } from '../../components/CarnetIcon';
import SideMenu from '../../components/SideMenu';
import { useAuth } from '../../context/AuthContext';
import {
  Events, Event,
  Attendance, AttendanceMonth,
  Comunicados, Comunicado,
  Payments,
} from '../../api';

const BLUE = Colors.blue; // #1A3A7C

const QUICK_ACTIONS = [
  { id: 'att',   icon: 'clipboard-outline',    label: 'Asistencia',   screen: 'Asistencia',  active: true  },
  { id: 'pay',   icon: 'card-outline',          label: 'Pagos',        screen: 'Pagos',       active: true  },
  { id: 'msg',   icon: 'chatbubble-outline',    label: 'Comunicados',  screen: 'Comunicados', active: true  },
  { id: 'cal',   icon: 'calendar-outline',      label: 'Agenda',       screen: null,          active: false },
  { id: 'doc',   icon: 'document-text-outline', label: 'Documentos',   screen: null,          active: false },
  { id: 'stats', icon: 'bar-chart-outline',     label: 'Estadísticas', screen: null,          active: false },
];

export const ApoderadoHomeScreen: React.FC<any> = ({ navigation }) => {
  const [carnetVisible, setCarnetVisible] = useState(false);
  const [menuVisible,  setMenuVisible]  = useState(false);
  const { state, setActivePupil, logout } = useAuth();
  const [pupilIdx, setPupilIdx] = useState(0);

  const [nextMatch,    setNextMatch]    = useState<Event | null>(null);
  const [attMonth,     setAttMonth]     = useState<AttendanceMonth | null>(null);
  const [msgs,         setMsgs]         = useState<Comunicado[]>([]);
  const [quotaPending, setQuotaPending] = useState(false);

  // Usar datos reales del AuthContext
  const pupils = state.status === 'authenticated' ? state.pupils : [];
  const pupil  = pupils[pupilIdx] ?? null;

  const cyclePupil = () => {
    const nextIdx = (pupilIdx + 1) % pupils.length;
    setPupilIdx(nextIdx);
    setActivePupil(pupils[nextIdx]);
  };

  useEffect(() => {
    if (!pupil?.id) return;
    const id  = pupil.id;
    const now = new Date();
    const from = now.toISOString().slice(0, 10);
    const to   = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);

    Events.list(id, from, to, 'match')
      .then(evs => setNextMatch(evs[0] ?? null))
      .catch(() => {});

    Attendance.summary(id)
      .then(data => {
        const key = now.toISOString().slice(0, 7);
        setAttMonth(data.months.find(m => m.month === key) ?? data.months[data.months.length - 1] ?? null);
      })
      .catch(() => {});

    Comunicados.list(id)
      .then(list => setMsgs(list.slice(0, 3)))
      .catch(() => {});

    Payments.list(id)
      .then(pays => setQuotaPending(pays.some(p => p.status === 'pending')))
      .catch(() => {});
  }, [pupil?.id]);

  if (state.status === 'loading') {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={BLUE} />
      </SafeAreaView>
    );
  }

  if (!pupil) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Ionicons name="person-add-outline" size={52} color={Colors.light} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.black, marginTop: 16, marginBottom: 8, textAlign: 'center' }}>
          Sin pupilos registrados
        </Text>
        <Text style={{ fontSize: 13, color: Colors.gray, textAlign: 'center', marginBottom: 32 }}>
          Agrega un pupilo para ver su información.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: BLUE, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 16 }}
          onPress={() => navigation.navigate('Enrollment')}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Agregar pupilo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={logout}>
          <Text style={{ color: Colors.gray, fontSize: 13, fontWeight: '600' }}>Cerrar sesión</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} navigation={navigation} />
      {/* HEADER */}
      <View style={{ backgroundColor: BLUE }}>
        {/* Top row */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.ic} onPress={() => setMenuVisible(true)}>
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
            {pupil.photo
              ? <Image source={{ uri: pupil.photo }} style={styles.pupilPhoto} />
              : <Text style={styles.pupilAvTxt}>{pupil.name.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}</Text>
            }
            <View style={styles.pupilDot} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.apodLabel}>Apoderado de</Text>
            <Text style={styles.pupilName}>{pupil.name}</Text>
            <Text style={styles.pupilMeta}>{[pupil.category, pupil.team].filter(Boolean).join(' · ') || 'Sin categoría'}</Text>
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
            <Text style={styles.pillVal}>
              {attMonth && attMonth.total > 0 ? `${Math.round(attMonth.present * 100 / attMonth.total)}%` : '--'}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <View style={[styles.pillDot, { backgroundColor: quotaPending ? '#D97706' : Colors.ok }]} />
            <Text style={styles.pillLbl}>Cuota</Text>
            <Text style={styles.pillVal}>{quotaPending ? 'Pendiente' : 'Al día'}</Text>
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
            <TouchableOpacity
              key={a.id}
              style={styles.qaItem}
              onPress={a.active && a.screen ? () => navigation.navigate(a.screen!) : undefined}
              disabled={!a.active}
              activeOpacity={a.active ? 0.7 : 1}
            >
              <View style={[styles.qaCircle, !a.active && styles.qaCircleOff]}>
                <Ionicons name={a.icon as any} size={19} color={a.active ? BLUE : Colors.gray} />
              </View>
              <Text style={[styles.qaLabel, !a.active && { color: Colors.gray }]}>{a.label}</Text>
              {!a.active && <Text style={styles.qaSoon}>Pronto</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Next match */}
        <View style={styles.section}>
          <Text style={styles.sectionLbl}>PRÓXIMO PARTIDO</Text>
          {nextMatch ? (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('Agenda')}
              activeOpacity={0.85}
            >
              <View style={styles.matchTag}>
                <View style={[styles.tagDot, { backgroundColor: BLUE }]} />
                <Text style={[styles.tagTxt, { color: BLUE }]}>
                  {nextMatch.date.slice(8, 10)}/{nextMatch.date.slice(5, 7)}
                  {nextMatch.time ? ' · ' + nextMatch.time : ''}
                </Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward" size={12} color={Colors.gray} />
              </View>
              <Text style={styles.teamName}>{nextMatch.title}</Text>
              <Text style={styles.matchMeta}>
                📍 {nextMatch.venue ?? nextMatch.location ?? 'Por confirmar'}
                {nextMatch.league ? ' · ' + nextMatch.league : ''}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.card, { paddingVertical: 22, alignItems: 'center' }]}>
              <Ionicons name="calendar-outline" size={28} color={Colors.light} />
              <Text style={{ color: Colors.gray, fontSize: 12, marginTop: 6 }}>Sin partidos próximos</Text>
            </View>
          )}
        </View>

        {/* Attendance */}
        <View style={styles.section}>
          <Text style={styles.sectionLbl}>ASISTENCIA ESTE MES</Text>
          <View style={styles.card}>
            {attMonth ? (
              <View style={styles.attRow}>
                {[
                  { v: String(attMonth.present), l: 'Presentes', color: '#1a7c4a' },
                  { v: String(attMonth.absent),  l: 'Ausencias', color: Colors.red },
                  { v: attMonth.total > 0 ? `${Math.round(attMonth.present * 100 / attMonth.total)}%` : 'N/A', l: '% Total', color: Colors.black },
                ].map((s, i) => {
                  const fillPct = attMonth.total > 0
                    ? (s.l === 'Ausencias'
                        ? Math.round(attMonth.absent  * 100 / attMonth.total)
                        : Math.round(attMonth.present * 100 / attMonth.total))
                    : 0;
                  return (
                    <View key={i} style={styles.attItem}>
                      <Text style={[styles.attVal, { color: s.color }]}>{s.v}</Text>
                      <Text style={styles.attLbl}>{s.l}</Text>
                      <View style={styles.attBar}>
                        <View style={[styles.attFill, { width: `${fillPct}%` as any, backgroundColor: s.color }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                <ActivityIndicator color={BLUE} size="small" />
              </View>
            )}
          </View>
        </View>

        {/* Comunicados */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionLbl}>COMUNICADOS</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Comunicados')}>
              <Text style={{ fontSize: 11, color: BLUE, fontWeight: '600', marginBottom: 6 }}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          {msgs.length === 0 ? (
            <View style={[styles.card, { paddingVertical: 22, alignItems: 'center' }]}>
              <Ionicons name="chatbubble-outline" size={28} color={Colors.light} />
              <Text style={{ color: Colors.gray, fontSize: 12, marginTop: 6 }}>Sin comunicados recientes</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {msgs.map((m, i) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.msgItem, i > 0 && styles.msgBorder]}
                  onPress={() => navigation.navigate('ComunicadoDetalle', { message: m })}
                  activeOpacity={0.75}
                >
                  <View style={styles.msgIc}>
                    <Ionicons
                      name={m.category === 'action' ? 'document-text-outline' : 'chatbubble-outline'}
                      size={13}
                      color={m.category === 'action' ? Colors.red : BLUE}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.msgTitle}>{m.title}</Text>
                    {m.preview ? <Text style={styles.msgSub}>{m.preview}</Text> : null}
                  </View>
                  {!m.read && (
                    <View style={[styles.unreadDot, { backgroundColor: m.category === 'action' ? Colors.red : BLUE }]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Carnet modal del pupilo */}
      <CarnetModal
        visible={carnetVisible}
        onClose={() => setCarnetVisible(false)}
        role="jugador"
        name={pupil.name}
        initials={pupil.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
        licenseId={pupil.rut}
        headerColor={BLUE}
        position={pupil.category ?? 'Jugador'}
        club={pupil.team ?? 'C.D. Santo Domingo'}
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
  pupilAv:    { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  pupilPhoto:  { width: 44, height: 44, borderRadius: 22 },
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
  qaCircleOff: { opacity: 0.45 },
  qaLabel: { fontSize: 9, color: Colors.black, fontWeight: '500', textAlign: 'center', lineHeight: 12 },
  qaSoon: { fontSize: 8, color: Colors.gray, fontStyle: 'italic' },
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
