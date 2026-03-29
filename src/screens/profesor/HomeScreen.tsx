import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Image, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { Profesor, ProfesorTeam, ProfesorEvent, Lesion } from '../../api';

const GREEN = '#0F7D4B';
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAYS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function fmtEventDate(date: string, time: string | null) {
  const d = new Date(date + 'T00:00:00');
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}${time ? ' · ' + time : ''}`;
}

const ACTIONS = [
  { id: 'asistencia',    icon: 'clipboard-outline',  label: 'Asistencia',     screen: 'AsistenciaProfesor', modulo: 'asistencia' },
  { id: 'agenda',        icon: 'calendar-outline',   label: 'Agenda',         screen: 'ProfesorAgenda',     modulo: 'agenda' },
  { id: 'equipos',       icon: 'people-outline',     label: 'Mis Equipos',    screen: 'MisEquipos',         modulo: null },
  { id: 'convocatoria',  icon: 'megaphone-outline',  label: 'Convocar',       screen: 'ProfesorAgenda',     modulo: 'convocatorias' },
  { id: 'lesiones',      icon: 'medkit-outline',     label: 'Lesiones',       screen: 'LesionesEquipo',     modulo: null },
];

export default function ProfesorHomeScreen({ navigation }: any) {
  const { state, isModuloHabilitado, isModuloNuevo, marcarModuloVisto } = useAuth();
  const user  = state.status === 'authenticated' ? state.user : null;
  const name  = user?.name ?? 'Profesor';
  const clubs = user?.profesor_info?.teams ?? [];
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const [teams,       setTeams]       = useState<ProfesorTeam[]>([]);
  const [nextEvents,  setNextEvents]  = useState<ProfesorEvent[]>([]);
  const [lesiones,    setLesiones]    = useState<Lesion[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  const load = useCallback(async () => {
    try {
      const now  = new Date();
      const from = now.toISOString().slice(0, 10);
      const to   = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);
      const [ts, evs] = await Promise.allSettled([
        Profesor.teams(),
        Profesor.allEvents(from, to),
      ]);
      if (ts.status === 'fulfilled') setTeams(ts.value);
      if (evs.status === 'fulfilled') setNextEvents(evs.value.slice(0, 5));

      // Lesiones de todos los equipos (primer equipo si hay varios)
      if (ts.status === 'fulfilled' && ts.value.length > 0) {
        const lesRes = await Profesor.injuries(ts.value[0].id).catch(() => []);
        setLesiones(lesRes.filter(l => l.is_active));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const navigate = (screen: string, params?: object, modulo?: string | null) => {
    if (modulo) marcarModuloVisto(modulo);
    navigation.navigate(screen, params);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={GREEN} />
      </SafeAreaView>
    );
  }

  const upcomingMatches = nextEvents.filter(e => e.type === 'match');
  const upcomingTrainings = nextEvents.filter(e => e.type === 'training');

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
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

        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rolePill}>PROFESOR / COACH</Text>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userMeta}>
              {teams.length > 0 ? teams.map(t => t.name).join(' · ') : 'Sin equipos asignados'}
            </Text>
          </View>
        </View>

        {/* Stat pills */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statNum}>{teams.length}</Text>
            <Text style={styles.statLbl}>Equipos</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statPill}>
            <Text style={styles.statNum}>{teams.reduce((s, t) => s + t.player_count, 0)}</Text>
            <Text style={styles.statLbl}>Jugadores</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statPill}>
            <Text style={[styles.statNum, lesiones.length > 0 && { color: '#FBBF24' }]}>{lesiones.length}</Text>
            <Text style={styles.statLbl}>Lesionados</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statPill}>
            <Text style={styles.statNum}>{upcomingMatches.length}</Text>
            <Text style={styles.statLbl}>Partidos</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
      >
        {/* Acciones rápidas */}
        <Text style={[styles.sectionLbl, { marginHorizontal: 16, marginTop: 18, marginBottom: 10 }]}>ACCESOS RÁPIDOS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {ACTIONS.filter(a => !a.modulo || isModuloHabilitado(a.modulo)).map(a => {
            const esNuevo = a.modulo ? isModuloNuevo(a.modulo) : false;
            return (
              <TouchableOpacity
                key={a.id}
                style={styles.actionItem}
                onPress={() => navigate(a.screen, undefined, a.modulo)}
                activeOpacity={0.75}
              >
                <View style={styles.actionCircle}>
                  <Ionicons name={a.icon as any} size={20} color={GREEN} />
                  {esNuevo && <View style={styles.actionNuevoDot} />}
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
                {esNuevo && <Text style={styles.actionNuevoTag}>NUEVO</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Próximos eventos */}
        {isModuloHabilitado('agenda') && nextEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLbl}>PRÓXIMOS EVENTOS</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ProfesorAgenda')}>
                <Text style={styles.sectionLink}>Ver todos →</Text>
              </TouchableOpacity>
            </View>
            {nextEvents.slice(0, 3).map(ev => (
              <TouchableOpacity
                key={ev.id}
                style={styles.eventCard}
                onPress={() => navigation.navigate('ProfesorAgenda', { highlightId: ev.id })}
                activeOpacity={0.82}
              >
                <View style={[styles.eventTypeDot, { backgroundColor: ev.type === 'match' ? Colors.blue : GREEN }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle} numberOfLines={1}>{ev.title}</Text>
                  <Text style={styles.eventMeta}>{fmtEventDate(ev.date, ev.time)}{ev.team_name ? ` · ${ev.team_name}` : ''}</Text>
                  {ev.type === 'match' && (
                    <Text style={styles.eventMeta}>
                      {ev.convocados} convocados · {ev.confirmados} confirmados
                    </Text>
                  )}
                </View>
                <View style={[styles.typeChip, { backgroundColor: ev.type === 'match' ? Colors.blue + '18' : GREEN + '18' }]}>
                  <Text style={[styles.typeChipTxt, { color: ev.type === 'match' ? Colors.blue : GREEN }]}>
                    {ev.type === 'match' ? 'PARTIDO' : ev.type === 'training' ? 'ENTREN.' : 'EVENTO'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Mis Equipos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLbl}>MIS EQUIPOS</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MisEquipos')}>
              <Text style={styles.sectionLink}>Ver equipos →</Text>
            </TouchableOpacity>
          </View>
          {teams.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={28} color={Colors.light} />
              <Text style={styles.emptyTxt}>Sin equipos asignados</Text>
            </View>
          ) : (
            teams.map(team => (
              <TouchableOpacity
                key={team.id}
                style={styles.teamCard}
                onPress={() => navigation.navigate('MisEquipos', { teamId: team.id })}
                activeOpacity={0.82}
              >
                <View style={styles.teamAvatar}>
                  <Ionicons name="shield-outline" size={20} color={GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  <Text style={styles.teamMeta}>
                    {[team.category, team.sport].filter(Boolean).join(' · ') || 'Sin categoría'}
                  </Text>
                </View>
                <View style={styles.teamCountBadge}>
                  <Ionicons name="person-outline" size={11} color={GREEN} />
                  <Text style={styles.teamCountTxt}>{team.player_count}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Lesiones activas */}
        {lesiones.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLbl}>LESIONES ACTIVAS</Text>
              <TouchableOpacity onPress={() => navigation.navigate('LesionesEquipo')}>
                <Text style={styles.sectionLink}>Ver todas →</Text>
              </TouchableOpacity>
            </View>
            {lesiones.slice(0, 3).map(l => (
              <View key={l.id} style={styles.lesionCard}>
                <View style={[styles.lesionSeverity, {
                  backgroundColor: l.severity === 'grave' ? Colors.red : l.severity === 'moderada' ? '#F59E0B' : '#10B981',
                }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.lesionName}>{l.pupil_name}</Text>
                  <Text style={styles.lesionMeta}>{l.type} · {l.zone}</Text>
                </View>
                <View style={[styles.severityBadge, {
                  backgroundColor: l.severity === 'grave' ? Colors.red + '15' : l.severity === 'moderada' ? '#FEF3C7' : '#D1FAE5',
                }]}>
                  <Text style={[styles.severityTxt, {
                    color: l.severity === 'grave' ? Colors.red : l.severity === 'moderada' ? '#D97706' : '#059669',
                  }]}>{l.severity.toUpperCase()}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.surf },
  topRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  logo:       { flexDirection: 'row', alignItems: 'baseline' },
  logoI:      { fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:      { fontSize: 16, fontWeight: '800', color: '#fff' },
  switchRole: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  switchTxt:  { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  avatar:     { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { fontSize: 17, fontWeight: '800', color: '#fff' },
  rolePill:   { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 2 },
  userName:   { fontSize: 16, fontWeight: '800', color: '#fff' },
  userMeta:   { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  statsRow:   { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },
  statPill:   { flex: 1, alignItems: 'center' },
  statNum:    { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLbl:    { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 1 },
  statDiv:    { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center' },
  body:       { flex: 1 },
  sectionLbl: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Colors.gray },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionLink: { fontSize: 10, fontWeight: '700', color: GREEN },
  section:    { paddingHorizontal: 16, marginBottom: 6, marginTop: 16 },

  // Acciones
  actionItem:    { alignItems: 'center', gap: 5, width: 62, marginBottom: 4 },
  actionCircle:  { width: 50, height: 50, borderRadius: 25, backgroundColor: GREEN + '14', alignItems: 'center', justifyContent: 'center' },
  actionNuevoDot:{ position: 'absolute', top: 2, right: 2, width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.red, borderWidth: 1.5, borderColor: Colors.white },
  actionLabel:   { fontSize: 9, color: Colors.black, fontWeight: '500', textAlign: 'center', lineHeight: 12 },
  actionNuevoTag:{ fontSize: 8, fontWeight: '800', color: Colors.red },

  // Eventos
  eventCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  eventTypeDot: { width: 4, height: 36, borderRadius: 2 },
  eventTitle:   { fontSize: 13, fontWeight: '700', color: Colors.black },
  eventMeta:    { fontSize: 11, color: Colors.gray, marginTop: 1 },
  typeChip:     { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  typeChipTxt:  { fontSize: 9, fontWeight: '800' },

  // Equipos
  teamCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  teamAvatar:     { width: 40, height: 40, borderRadius: 10, backgroundColor: GREEN + '12', alignItems: 'center', justifyContent: 'center' },
  teamName:       { fontSize: 14, fontWeight: '700', color: Colors.black },
  teamMeta:       { fontSize: 11, color: Colors.gray, marginTop: 1 },
  teamCountBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: GREEN + '12', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  teamCountTxt:   { fontSize: 11, fontWeight: '700', color: GREEN },

  // Lesiones
  lesionCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  lesionSeverity:{ width: 4, height: 32, borderRadius: 2 },
  lesionName:    { fontSize: 13, fontWeight: '700', color: Colors.black },
  lesionMeta:    { fontSize: 11, color: Colors.gray, marginTop: 1, textTransform: 'capitalize' },
  severityBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  severityTxt:   { fontSize: 9, fontWeight: '800' },

  emptyBox:  { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyTxt:  { fontSize: 13, color: Colors.gray },
});

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
