import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, RefreshControl, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { Profesor, ProfesorTeam, ProfesorEvent, Lesion, ProfesorHome, LeagueCarouselItem, CategoryCarouselItem } from '../../api';
import ProfesorSideMenu from '../../components/ProfesorSideMenu';

const GREEN = '#0F7D4B';
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAYS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function fmtEventDate(date: string, time: string | null) {
  const d = new Date(date + 'T00:00:00');
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}${time ? ' · ' + time : ''}`;
}

export default function ProfesorHomeScreen({ navigation }: any) {
  const { state, isModuloHabilitado, isModuloNuevo, marcarModuloVisto } = useAuth();
  const user     = state.status === 'authenticated' ? state.user : null;
  const name     = user?.name ?? 'Profesor';
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const [menuVisible,  setMenuVisible]  = useState(false);
  const [teams,        setTeams]        = useState<ProfesorTeam[]>([]);
  const [nextEvents,   setNextEvents]   = useState<ProfesorEvent[]>([]);
  const [lesiones,     setLesiones]     = useState<Lesion[]>([]);
  const [homeData,     setHomeData]     = useState<ProfesorHome | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  const load = useCallback(async () => {
    try {
      const now  = new Date();
      const from = now.toISOString().slice(0, 10);
      const to   = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);
      const [ts, evs, homeRes] = await Promise.allSettled([
        Profesor.teams(),
        Profesor.allEvents(from, to),
        Profesor.getHome(),
      ]);
      if (ts.status === 'fulfilled') setTeams(ts.value);
      if (evs.status === 'fulfilled') setNextEvents(evs.value.slice(0, 5));
      if (homeRes.status === 'fulfilled') {
        setHomeData(homeRes.value);
      }

      // Lesiones: preferir allInjuries (global), fallback a equipo
      const injRes = await Profesor.allInjuries(true).catch(async () => {
        if (ts.status === 'fulfilled' && ts.value.length > 0) {
          return Profesor.injuries(ts.value[0].id).catch(() => []);
        }
        return [];
      });
      setLesiones(injRes.filter((l: Lesion) => l.is_active));
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

  const totalPlayers     = teams.reduce((s, t) => s + t.player_count, 0);
  const upcomingMatches  = nextEvents.filter(e => e.type === 'match');
  const activeLesiones   = homeData?.active_injuries_count ?? lesiones.length;
  const leagueCarousel   = homeData?.leagues_carousel ?? [];
  const catCarousel      = homeData?.categories_carousel ?? [];

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={GREEN} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ProfesorSideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={navigation}
      />

      {/* HEADER */}
      <View style={{ backgroundColor: GREEN }}>
        <View style={styles.topRow}>
          {/* Hamburger */}
          <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu-outline" size={22} color="#fff" />
          </TouchableOpacity>
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
              {teams.length > 0
                ? `${teams.length} equipo${teams.length !== 1 ? 's' : ''} · ${totalPlayers} jugadores`
                : 'Sin equipos asignados'}
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
            <Text style={styles.statNum}>{totalPlayers}</Text>
            <Text style={styles.statLbl}>Jugadores</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statPill}>
            <Text style={[styles.statNum, activeLesiones > 0 && { color: '#FBBF24' }]}>
              {activeLesiones}
            </Text>
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
        {/* Pasar Asistencia — CTA prominente siempre visible */}
        <TouchableOpacity
          style={styles.ctaAsistencia}
          onPress={() => navigate('SesionesHoy')}
          activeOpacity={0.85}
        >
          <View style={styles.ctaIconWrap}>
            <Ionicons name="clipboard-outline" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Pasar Asistencia</Text>
            <Text style={styles.ctaSub}>Ver y gestionar sesiones activas</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Acciones rápidas */}
        <Text style={[styles.sectionLbl, { marginHorizontal: 16, marginTop: 20, marginBottom: 10 }]}>
          ACCIONES RÁPIDAS
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {[
            { id: 'programacion', icon: 'calendar-number-outline', label: 'Programación',screen: 'Programacion',    modulo: null },
            { id: 'agenda',       icon: 'calendar-outline',   label: 'Agenda',       screen: 'ProfesorAgenda', modulo: 'agenda' },
            { id: 'equipos',      icon: 'people-outline',     label: 'Mis Equipos',  screen: 'MisEquipos',     modulo: null },
            { id: 'convocatoria', icon: 'megaphone-outline',  label: 'Convocar',     screen: 'ProfesorAgenda', modulo: 'convocatorias' },
            { id: 'lesiones',     icon: 'medkit-outline',     label: 'Lesiones',     screen: 'Lesiones',       modulo: null },
            { id: 'partidos',     icon: 'football-outline',   label: 'Partidos',     screen: 'PartidosEquipo', modulo: null },
            { id: 'crearEvento',  icon: 'add-circle-outline', label: 'Crear Evento', screen: 'CrearEvento',    modulo: null },
          ].filter(a => !a.modulo || isModuloHabilitado(a.modulo)).map(a => {
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

        {/* Ligas y competencias — carousel */}
        {leagueCarousel.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <View style={[styles.sectionHeader, { paddingHorizontal: 16, marginBottom: 10 }]}>
              <Text style={styles.sectionLbl}>LIGAS Y COMPETENCIAS</Text>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={leagueCarousel}
              keyExtractor={it => String(it.team_id)}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
              renderItem={({ item }: { item: LeagueCarouselItem }) => (
                <TouchableOpacity
                  style={styles.leagueCard}
                  onPress={() => navigation.navigate('PartidosEquipo', { teamId: item.team_id, teamName: item.team_name })}
                  activeOpacity={0.85}
                >
                  <View style={styles.leagueCardHeader}>
                    <Text style={styles.leagueTeam} numberOfLines={1}>{item.team_name}</Text>
                    {item.competition && (
                      <View style={styles.compChip}>
                        <Text style={styles.compChipTxt} numberOfLines={1}>{item.competition}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.leagueRecord}>
                    {[['G', item.wins, '#10B981'], ['E', item.draws, '#F59E0B'], ['P', item.losses, '#EF4444'], ['Pts', item.points, GREEN]].map(([label, val, color]) => (
                      <View key={String(label)} style={styles.recordItem}>
                        <Text style={[styles.recordVal, { color: color as string }]}>{String(val)}</Text>
                        <Text style={styles.recordLbl}>{String(label)}</Text>
                      </View>
                    ))}
                  </View>
                  {item.next_match_date && (
                    <Text style={styles.nextMatchTxt}>
                      Próx: {new Date(item.next_match_date + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                      {item.next_match_rival ? ` vs ${item.next_match_rival}` : ''}
                    </Text>
                  )}
                  <View style={styles.leagueArrow}>
                    <Ionicons name="chevron-forward" size={12} color={GREEN} />
                    <Text style={styles.leagueArrowTxt}>Ver partidos</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Categorías — carousel */}
        {catCarousel.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <View style={[styles.sectionHeader, { paddingHorizontal: 16, marginBottom: 10 }]}>
              <Text style={styles.sectionLbl}>MIS CATEGORÍAS</Text>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={catCarousel}
              keyExtractor={it => String(it.team_id)}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
              renderItem={({ item }: { item: CategoryCarouselItem }) => (
                <TouchableOpacity
                  style={styles.catCard}
                  onPress={() => navigation.navigate('MisEquipos', { teamId: item.team_id })}
                  activeOpacity={0.85}
                >
                  <Text style={styles.catTeam} numberOfLines={1}>{item.team_name}</Text>
                  {item.category && <Text style={styles.catSub}>{item.category}</Text>}
                  <View style={styles.catStats}>
                    <View style={styles.catStat}>
                      <Ionicons name="people-outline" size={13} color={GREEN} />
                      <Text style={styles.catStatTxt}>{item.player_count}</Text>
                    </View>
                    {item.active_injuries > 0 && (
                      <View style={[styles.catStat, { backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 5 }]}>
                        <Ionicons name="medkit-outline" size={11} color="#D97706" />
                        <Text style={[styles.catStatTxt, { color: '#D97706' }]}>{item.active_injuries}</Text>
                      </View>
                    )}
                  </View>
                  {item.next_event_title && (
                    <Text style={styles.catNextTxt} numberOfLines={1}>{item.next_event_title}</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        )}

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
                  <Text style={styles.eventMeta}>
                    {fmtEventDate(ev.date, ev.time)}{ev.team_name ? ` · ${ev.team_name}` : ''}
                  </Text>
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

        {/* Mis Equipos — carrusel horizontal */}
        <View style={{ marginTop: 20 }}>
          <View style={[styles.sectionHeader, { paddingHorizontal: 16, marginBottom: 10 }]}>
            <Text style={styles.sectionLbl}>MIS EQUIPOS</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MisEquipos')}>
              <Text style={styles.sectionLink}>Ver todos →</Text>
            </TouchableOpacity>
          </View>
          {teams.length === 0 ? (
            <View style={[styles.emptyBox, { marginHorizontal: 16 }]}>
              <Ionicons name="people-outline" size={28} color={Colors.light} />
              <Text style={styles.emptyTxt}>Sin equipos asignados</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={teams}
              keyExtractor={t => String(t.id)}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
              renderItem={({ item: team }) => (
                <TouchableOpacity
                  style={styles.teamCard}
                  onPress={() => navigation.navigate('MisEquipos', { teamId: team.id })}
                  activeOpacity={0.82}
                >
                  <View style={styles.teamCardIcon}>
                    <Ionicons name="shield-outline" size={20} color={GREEN} />
                  </View>
                  <Text style={styles.teamCardName} numberOfLines={2}>{team.name}</Text>
                  {(team.category || team.sport) && (
                    <Text style={styles.teamCardCat} numberOfLines={1}>
                      {[team.category, team.sport].filter(Boolean).join(' · ')}
                    </Text>
                  )}
                  <View style={styles.teamCardRow}>
                    <Ionicons name="person-outline" size={11} color={Colors.gray} />
                    <Text style={styles.teamCardCount}>{team.player_count} jug.</Text>
                  </View>
                  {team.next_event_date && (
                    <Text style={styles.teamCardNext}>
                      {new Date(team.next_event_date + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                    </Text>
                  )}
                  <View style={styles.teamCardFooter}>
                    <Ionicons name="chevron-forward" size={11} color={GREEN} />
                    <Text style={styles.teamCardFooterTxt}>Ver equipo</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Lesiones activas */}
        {lesiones.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLbl}>LESIONES ACTIVAS</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Lesiones')}>
                <Text style={styles.sectionLink}>Ver todas →</Text>
              </TouchableOpacity>
            </View>
            {lesiones.slice(0, 3).map(l => {
              const daysSince = l.date_start
                ? Math.floor((Date.now() - new Date(l.date_start + 'T00:00:00').getTime()) / 86400000)
                : null;
              return (
                <TouchableOpacity
                  key={l.id}
                  style={styles.lesionCard}
                  onPress={() => navigation.navigate('LesionDetalle', { lesion: l })}
                  activeOpacity={0.82}
                >
                  <View style={[styles.lesionSeverity, {
                    backgroundColor: l.severity === 'grave' ? Colors.red : l.severity === 'moderada' ? '#F59E0B' : '#10B981',
                  }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lesionName}>{l.pupil_name}</Text>
                    {l.team_name && (
                      <Text style={styles.lesionTeam}>{l.team_name}</Text>
                    )}
                    <Text style={styles.lesionMeta}>
                      {[l.zone_label ?? l.zone, l.type].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <View style={[styles.severityBadge, {
                      backgroundColor: l.severity === 'grave' ? Colors.red + '15' : l.severity === 'moderada' ? '#FEF3C7' : '#D1FAE5',
                    }]}>
                      <Text style={[styles.severityTxt, {
                        color: l.severity === 'grave' ? Colors.red : l.severity === 'moderada' ? '#D97706' : '#059669',
                      }]}>{(l.severity_label ?? l.severity).toUpperCase()}</Text>
                    </View>
                    {daysSince !== null && (
                      <Text style={styles.lesionDays}>{daysSince}d</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.surf },
  topRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 4 },
  menuBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
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

  // CTA Asistencia
  ctaAsistencia: { flexDirection: 'row', alignItems: 'center', backgroundColor: GREEN, marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 14, gap: 12, shadowColor: GREEN, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 },
  ctaIconWrap:   { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  ctaTitle:      { fontSize: 15, fontWeight: '800', color: '#fff' },
  ctaSub:        { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },

  sectionLbl:    { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Colors.gray },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionLink:   { fontSize: 10, fontWeight: '700', color: GREEN },
  section:       { paddingHorizontal: 16, marginBottom: 6, marginTop: 20 },

  // Acciones
  actionItem:    { alignItems: 'center', gap: 5, width: 64, marginBottom: 4 },
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

  // Teams carousel
  teamCard:       { width: 140, backgroundColor: '#fff', borderRadius: 16, padding: 13, gap: 5, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  teamCardIcon:   { width: 38, height: 38, borderRadius: 10, backgroundColor: GREEN + '12', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  teamCardName:   { fontSize: 13, fontWeight: '800', color: Colors.black, lineHeight: 17 },
  teamCardCat:    { fontSize: 10, color: GREEN, fontWeight: '700' },
  teamCardRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  teamCardCount:  { fontSize: 11, fontWeight: '600', color: Colors.gray },
  teamCardNext:   { fontSize: 9, color: Colors.gray },
  teamCardFooter: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  teamCardFooterTxt: { fontSize: 10, fontWeight: '700', color: GREEN },

  // Lesiones
  lesionCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  lesionSeverity:{ width: 4, height: 36, borderRadius: 2 },
  lesionName:    { fontSize: 13, fontWeight: '700', color: Colors.black },
  lesionTeam:    { fontSize: 10, fontWeight: '700', color: GREEN, marginTop: 1 },
  lesionMeta:    { fontSize: 11, color: Colors.gray, marginTop: 1, textTransform: 'capitalize' },
  lesionDays:    { fontSize: 10, fontWeight: '600', color: Colors.gray },
  severityBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  severityTxt:   { fontSize: 9, fontWeight: '800' },

  emptyBox:  { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyTxt:  { fontSize: 13, color: Colors.gray },

  // Leagues carousel
  leagueCard:   { width: 170, backgroundColor: '#fff', borderRadius: 14, padding: 13, gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  leagueCardHeader: { gap: 4 },
  leagueTeam:   { fontSize: 13, fontWeight: '800', color: Colors.black },
  compChip:     { backgroundColor: GREEN + '14', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  compChipTxt:  { fontSize: 9, fontWeight: '700', color: GREEN },
  leagueRecord: { flexDirection: 'row', justifyContent: 'space-between' },
  recordItem:   { alignItems: 'center', gap: 1 },
  recordVal:    { fontSize: 16, fontWeight: '900' },
  recordLbl:    { fontSize: 9, fontWeight: '600', color: Colors.gray },
  nextMatchTxt: { fontSize: 10, color: Colors.gray },
  leagueArrow:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  leagueArrowTxt: { fontSize: 10, fontWeight: '700', color: GREEN },

  // Categories carousel
  catCard:    { width: 140, backgroundColor: '#fff', borderRadius: 14, padding: 13, gap: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  catTeam:    { fontSize: 13, fontWeight: '800', color: Colors.black },
  catSub:     { fontSize: 10, color: GREEN, fontWeight: '600' },
  catStats:   { flexDirection: 'row', gap: 6, alignItems: 'center' },
  catStat:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  catStatTxt: { fontSize: 12, fontWeight: '700', color: Colors.gray },
  catNextTxt: { fontSize: 9, color: Colors.gray },
});
