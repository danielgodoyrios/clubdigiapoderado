
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
  { id: 'att',   icon: 'clipboard-outline',    label: 'Asistencia',   screen: 'Asistencia',  modulo: 'asistencia'   },
  { id: 'pay',   icon: 'card-outline',          label: 'Pagos',        screen: 'Pagos',       modulo: 'pagos'        },
  { id: 'msg',   icon: 'chatbubble-outline',    label: 'Comunicados',  screen: 'Comunicados', modulo: 'comunicados'  },
  { id: 'doc',   icon: 'document-text-outline', label: 'Documentos',   screen: 'Documentos',  modulo: 'documentos'   },
  { id: 'hor',   icon: 'time-outline',           label: 'Horarios',     screen: 'Horarios',    modulo: 'horarios'     },
  { id: 'con',   icon: 'megaphone-outline',      label: 'Convocatorias',screen: 'Convocatorias', modulo: 'convocatorias' },
];

export const ApoderadoHomeScreen: React.FC<any> = ({ navigation }) => {
  const [carnetVisible, setCarnetVisible] = useState(false);
  const [menuVisible,  setMenuVisible]  = useState(false);
  const { state, setActivePupil, logout, isModuloHabilitado, isModuloNuevo, marcarModuloVisto } = useAuth();

  const [nextMatch,    setNextMatch]    = useState<Event | null>(null);
  const [attMonth,     setAttMonth]     = useState<AttendanceMonth | null>(null);
  const [msgs,         setMsgs]         = useState<Comunicado[]>([]);
  const [quotaPending, setQuotaPending] = useState(false);

  // Usar datos reales del AuthContext
  const pupils = state.status === 'authenticated' ? state.pupils : [];
  // Derivar el índice desde activePupil para que sea consistente con otras pantallas
  const activePupil = state.status === 'authenticated' ? state.activePupil : null;
  const pupilIdx = Math.max(0, pupils.findIndex(p => p.id === activePupil?.id));
  const pupil  = pupils[pupilIdx] ?? null;

  const cyclePupil = () => {
    const nextIdx = (pupilIdx + 1) % pupils.length;
    setActivePupil(pupils[nextIdx]);
  };

  useEffect(() => {
    if (!pupil?.id) return;
    const id  = pupil.id;
    const now = new Date();
    const from = now.toISOString().slice(0, 10);
    const to   = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);

    Events.list(id, from, to, 'match')
      .then(evs => { console.log('[Home] events:', JSON.stringify(evs)); setNextMatch(evs[0] ?? null); })
      .catch(err => console.warn('[Home] Events error:', JSON.stringify(err)));

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
            <TouchableOpacity style={styles.ic} onPress={() => navigation.navigate('Notificaciones')}>
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
          {QUICK_ACTIONS.filter(a => isModuloHabilitado(a.modulo)).map(a => {
            const esNuevo = isModuloNuevo(a.modulo);
            return (
              <TouchableOpacity
                key={a.id}
                style={styles.qaItem}
                onPress={() => { marcarModuloVisto(a.modulo); navigation.navigate(a.screen); }}
                activeOpacity={0.7}
              >
                <View style={styles.qaCircle}>
                  <Ionicons name={a.icon as any} size={19} color={BLUE} />
                  {esNuevo && <View style={styles.qaNuevoDot} />}
                </View>
                <Text style={styles.qaLabel}>{a.label}</Text>
                {esNuevo && <Text style={styles.qaNuevoTag}>NUEVO</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Next match */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={styles.sectionLbl}>PRÓXIMO PARTIDO</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Agenda')}>
              <Text style={{ fontSize: 10, color: BLUE, fontWeight: '700' }}>Ver agenda →</Text>
            </TouchableOpacity>
          </View>
          {nextMatch ? (
            <TouchableOpacity
              style={styles.matchCard}
              onPress={() => navigation.navigate('EventoDetalle', { event: nextMatch, pupilId: pupil?.id })}
              activeOpacity={0.88}
            >
              {/* Franja izquierda de color */}
              <View style={styles.matchAccent} />
              <View style={{ flex: 1, paddingLeft: 12 }}>
                {/* Fecha + hora */}
                <View style={styles.matchTopRow}>
                  <View style={styles.matchDateBadge}>
                    <Text style={styles.matchDateDay}>{nextMatch.date.slice(8, 10)}</Text>
                    <Text style={styles.matchDateMon}>
                      {['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'][parseInt(nextMatch.date.slice(5,7)) - 1]}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    {/* Día en palabras arriba */}
                    {nextMatch.date && (() => {
                      const [y, m, d] = nextMatch.date.split('-').map(Number);
                      const dow = new Date(y, m - 1, d).getDay();
                      const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
                      return <Text style={styles.matchDayName}>{dias[dow]}</Text>;
                    })()}
                    {nextMatch.home_team && nextMatch.away_team ? (
                      <View style={styles.vsInline}>
                        <Text style={styles.matchTeamTxt} numberOfLines={1}>{nextMatch.home_team}</Text>
                        <View style={styles.vsChip}><Text style={styles.vsChipTxt}>VS</Text></View>
                        <Text style={styles.matchTeamTxt} numberOfLines={1}>{nextMatch.away_team}</Text>
                      </View>
                    ) : (
                      <Text style={styles.matchTitleTxt} numberOfLines={2}>{nextMatch.title}</Text>
                    )}
                    {nextMatch.time && (
                      <View style={styles.matchTimeRow}>
                        <Ionicons name="time-outline" size={11} color={Colors.gray} />
                        <Text style={styles.matchTimeTxt}>{nextMatch.time} hrs</Text>
                      </View>
                    )}
                  </View>
                  {nextMatch.my_status && (
                    <View style={[styles.convPill, {
                      backgroundColor: nextMatch.my_status === 'confirmed' ? Colors.ok + '22' :
                        nextMatch.my_status === 'declined' ? Colors.red + '15' : Colors.amber + '22'
                    }]}>
                      <Ionicons
                        name={nextMatch.my_status === 'confirmed' ? 'checkmark-circle' : nextMatch.my_status === 'declined' ? 'close-circle' : 'time-outline'}
                        size={12}
                        color={nextMatch.my_status === 'confirmed' ? Colors.green : nextMatch.my_status === 'declined' ? Colors.red : Colors.amber}
                      />
                    </View>
                  )}
                </View>
                {(nextMatch.venue ?? nextMatch.location) && (
                  <View style={styles.matchMeta}>
                    <Ionicons name="location-outline" size={11} color={Colors.gray} />
                    <Text style={styles.matchMetaTxt} numberOfLines={1}>{nextMatch.venue ?? nextMatch.location}</Text>
                  </View>
                )}
                {nextMatch.league && (
                  <View style={styles.matchMeta}>
                    <Ionicons name="trophy-outline" size={11} color={Colors.gray} />
                    <Text style={styles.matchMetaTxt}>{nextMatch.league}</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.light} style={{ alignSelf: 'center', marginLeft: 4 }} />
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
  qaItem: { alignItems: 'center', gap: 5, width: 60, marginBottom: 4 },
  qaCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.light, alignItems: 'center', justifyContent: 'center' },
  qaNuevoDot: { position: 'absolute', top: 2, right: 2, width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.red, borderWidth: 1.5, borderColor: Colors.white },
  qaLabel: { fontSize: 9, color: Colors.black, fontWeight: '500', textAlign: 'center', lineHeight: 12 },
  qaNuevoTag: { fontSize: 8, fontWeight: '800', color: Colors.red, letterSpacing: 0.4 },
  section: { paddingHorizontal: 14, marginBottom: 8, marginTop: 4 },
  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 11, borderWidth: 1, borderColor: Colors.light },
  // Match card
  matchCard:      { backgroundColor: Colors.white, borderRadius: 14, flexDirection: 'row', alignItems: 'stretch', padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  matchAccent:    { width: 4, borderRadius: 2, backgroundColor: BLUE },
  matchTopRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  matchDateBadge: { width: 40, alignItems: 'center', backgroundColor: BLUE + '12', borderRadius: 8, paddingVertical: 5 },
  matchDateDay:   { fontSize: 18, fontWeight: '900', color: BLUE, lineHeight: 22 },
  matchDateMon:   { fontSize: 8, fontWeight: '700', color: BLUE, letterSpacing: 0.5 },
  matchDayName:   { fontSize: 10, fontWeight: '700', color: Colors.amber, letterSpacing: 0.3, marginBottom: 3 },
  vsInline:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  matchTeamTxt:   { flex: 1, fontSize: 12, fontWeight: '800', color: Colors.black },
  vsChip:         { backgroundColor: Colors.surf, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  vsChipTxt:      { fontSize: 9, fontWeight: '900', color: Colors.gray },
  matchTitleTxt:  { fontSize: 13, fontWeight: '800', color: Colors.black, lineHeight: 18 },
  matchTimeRow:   { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  matchTimeTxt:   { fontSize: 11, color: Colors.gray },
  matchMeta:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  matchMetaTxt:   { fontSize: 11, color: Colors.gray, flex: 1 },
  convPill:       { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  teamName:       { fontSize: 12, fontWeight: '700', color: Colors.black },
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
