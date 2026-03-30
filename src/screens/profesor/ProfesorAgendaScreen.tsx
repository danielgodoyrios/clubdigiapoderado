import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Profesor, ProfesorTeam, ProfesorEvent } from '../../api';
import { useAuth } from '../../context/AuthContext';

const GREEN = '#0F7D4B';
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAYS   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

function fmtDate(date: string) {
  const d = new Date(date + 'T00:00:00');
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const TYPE_CONFIG = {
  match:    { label: 'PARTIDO',     color: Colors.blue,   bg: Colors.blue + '18' },
  training: { label: 'ENTREN.',     color: GREEN,         bg: GREEN + '18' },
  event:    { label: 'EVENTO',      color: '#F59E0B',     bg: '#FEF3C7' },
};

function isArchived(ev: ProfesorEvent, todayStr: string): boolean {
  return ev.status === 'finished' || !!ev.submitted || ev.date < todayStr;
}

export default function ProfesorAgendaScreen({ navigation, route }: any) {
  const { isModuloHabilitado } = useAuth();
  const [teams,       setTeams]       = useState<ProfesorTeam[]>([]);
  const [teamId,      setTeamId]      = useState<number | 'all'>('all');
  const [filter,      setFilter]      = useState<'all' | 'match' | 'training'>('all');
  const [events,      setEvents]      = useState<ProfesorEvent[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const load = useCallback(async () => {
    try {
      const now  = new Date();
      const from = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
      const to   = new Date(now.getTime() + 60 * 86400000).toISOString().slice(0, 10);

      const [ts, evs] = await Promise.all([
        Profesor.teams(),
        teamId === 'all'
          ? Profesor.allEvents(from, to)
          : Profesor.events(teamId, from, to),
      ]);
      setTeams(ts);
      setEvents(evs);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teamId]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const todayStr = new Date().toISOString().slice(0, 10);
  const filtered = events.filter(e => filter === 'all' || e.type === filter);
  const activeEvents   = filtered.filter(e => !isArchived(e, todayStr));
  const archivedEvents = filtered.filter(e =>  isArchived(e, todayStr));

  const renderEventCard = (ev: ProfesorEvent, archived = false) => {
    const cfg = TYPE_CONFIG[ev.type] ?? TYPE_CONFIG.event;
    const isMatch = ev.type === 'match';
    const canPassList = !archived && !!ev.session_id && !ev.submitted && ev.status !== 'finished';

    return (
      <TouchableOpacity
        key={String(ev.id)}
        style={[styles.eventCard, archived && styles.eventCardArchived]}
        activeOpacity={0.82}
        onPress={() => isModuloHabilitado('convocatorias') && isMatch
          ? navigation.navigate('ConvocatoriaGestion', { event: ev })
          : undefined
        }
      >
        {/* Left accent */}
        <View style={[styles.accent, { backgroundColor: archived ? Colors.light : cfg.color }]} />

        {/* Date badge */}
        <View style={styles.dateBadge}>
          <Text style={[styles.dateBadgeDay, archived && { color: Colors.gray }]}>
            {new Date(ev.date + 'T00:00:00').getDate()}
          </Text>
          <Text style={styles.dateBadgeMon}>
            {MONTHS[new Date(ev.date + 'T00:00:00').getMonth()]}
          </Text>
        </View>

        {/* Content */}
        <View style={{ flex: 1, paddingRight: 8, paddingVertical: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <View style={[styles.typeChip, { backgroundColor: archived ? Colors.light : cfg.bg }]}>
              <Text style={[styles.typeChipTxt, { color: archived ? Colors.gray : cfg.color }]}>{cfg.label}</Text>
            </View>
            {ev.team_name && (
              <Text style={{ fontSize: 10, color: Colors.gray }}>{ev.team_name}</Text>
            )}
            {archived && (ev.status === 'finished' || ev.submitted) && (
              <View style={styles.doneBadge}>
                <Ionicons name="checkmark-circle" size={11} color={GREEN} />
                <Text style={styles.doneBadgeTxt}>Lista tomada</Text>
              </View>
            )}
          </View>

          <Text style={[styles.eventTitle, archived && { color: Colors.gray }]} numberOfLines={1}>
            {isMatch && ev.home_team && ev.away_team
              ? `${ev.home_team} vs ${ev.away_team}`
              : ev.title
            }
          </Text>
          <Text style={styles.eventMeta}>{fmtDate(ev.date)}{ev.time ? ` · ${ev.time}` : ''}</Text>
          {ev.location && (
            <Text style={styles.eventMeta}><Ionicons name="location-outline" size={10} /> {ev.location}</Text>
          )}
          {isMatch && (
            <Text style={{ fontSize: 11, color: archived ? Colors.gray : GREEN, fontWeight: '600', marginTop: 2 }}>
              {ev.convocados} convocados · {ev.confirmados} confirmaron
            </Text>
          )}

          {/* Pasar lista button — only on active non-match events with a session */}
          {canPassList && (
            <TouchableOpacity
              style={styles.pasarListaBtn}
              onPress={() => navigation.navigate('AsistenciaProfesor', {
                sessionId: ev.session_id,
                title: ev.title,
              })}
            >
              <Ionicons name="clipboard-outline" size={13} color="#fff" />
              <Text style={styles.pasarListaTxt}>Pasar lista</Text>
            </TouchableOpacity>
          )}
        </View>

        {isMatch && !archived && isModuloHabilitado('convocatorias') && (
          <Ionicons name="chevron-forward" size={16} color={Colors.light} style={{ marginRight: 8 }} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agenda</Text>
        {isModuloHabilitado('agenda') && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('CrearEvento', { teams })}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Team filter */}
      {teams.length > 1 && (
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, teamId === 'all' && styles.chipActive]}
            onPress={() => setTeamId('all')}
          >
            <Text style={[styles.chipTxt, teamId === 'all' && styles.chipTxtActive]}>Todos</Text>
          </TouchableOpacity>
          {teams.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.chip, teamId === t.id && styles.chipActive]}
              onPress={() => setTeamId(t.id)}
            >
              <Text style={[styles.chipTxt, teamId === t.id && styles.chipTxtActive]}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Type filter */}
      <View style={styles.typeFilterRow}>
        {([['all','Todos'],['match','Partidos'],['training','Entrenamientos']] as const).map(([k,l]) => (
          <TouchableOpacity
            key={k}
            style={[styles.typeFilter, filter === k && styles.typeFilterActive]}
            onPress={() => setFilter(k as any)}
          >
            <Text style={[styles.typeFilterTxt, filter === k && styles.typeFilterTxtActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : (
        <FlatList
          data={activeEvents}
          keyExtractor={e => String(e.id)}
          contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={40} color={Colors.light} />
              <Text style={styles.emptyTxt}>Sin eventos próximos</Text>
              {isModuloHabilitado('agenda') && (
                <TouchableOpacity
                  style={styles.createBtn}
                  onPress={() => navigation.navigate('CrearEvento', { teams })}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.createBtnTxt}>Crear evento</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item: ev }) => renderEventCard(ev, false)}
          ListFooterComponent={archivedEvents.length > 0 ? (
            <View style={{ marginTop: 6 }}>
              <TouchableOpacity
                style={styles.archiveToggle}
                onPress={() => setShowArchive(v => !v)}
              >
                <Ionicons
                  name={showArchive ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={Colors.gray}
                />
                <Text style={styles.archiveTxt}>
                  Archivados ({archivedEvents.length})
                </Text>
              </TouchableOpacity>
              {showArchive && archivedEvents.map(ev => renderEventCard(ev, true))}
            </View>
          ) : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.surf },
  header:         { backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  back:           { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#fff' },
  addBtn:         { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  chipRow:        { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.light },
  chip:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.light },
  chipActive:     { backgroundColor: GREEN, borderColor: GREEN },
  chipTxt:        { fontSize: 11, fontWeight: '600', color: Colors.gray },
  chipTxtActive:  { color: '#fff' },

  typeFilterRow:      { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: Colors.light },
  typeFilter:         { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  typeFilterActive:   { backgroundColor: Colors.surf },
  typeFilterTxt:      { fontSize: 11, fontWeight: '600', color: Colors.gray },
  typeFilterTxtActive:{ color: Colors.black },

  eventCard:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  eventCardArchived:  { opacity: 0.7 },
  accent:             { width: 4, alignSelf: 'stretch' },
  dateBadge:          { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 12 },
  dateBadgeDay:       { fontSize: 22, fontWeight: '800', color: Colors.black, lineHeight: 24 },
  dateBadgeMon:       { fontSize: 10, fontWeight: '600', color: Colors.gray },
  typeChip:           { borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  typeChipTxt:        { fontSize: 9, fontWeight: '800' },
  eventTitle:         { fontSize: 13, fontWeight: '700', color: Colors.black },
  eventMeta:          { fontSize: 11, color: Colors.gray, marginTop: 1 },

  doneBadge:          { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: GREEN + '18', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  doneBadgeTxt:       { fontSize: 9, fontWeight: '700', color: GREEN },

  pasarListaBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: GREEN, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start', marginTop: 8 },
  pasarListaTxt:      { fontSize: 12, fontWeight: '700', color: '#fff' },

  archiveToggle:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 4, marginBottom: 6 },
  archiveTxt:         { fontSize: 12, fontWeight: '600', color: Colors.gray },

  emptyBox:           { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTxt:           { fontSize: 14, color: Colors.gray, fontWeight: '600' },
  createBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GREEN, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18, marginTop: 8 },
  createBtnTxt:       { fontSize: 13, fontWeight: '700', color: '#fff' },
});
