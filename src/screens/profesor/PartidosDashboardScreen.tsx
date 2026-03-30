import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Profesor, ProfesorTeam, ProfesorMatch } from '../../api';

const GREEN = '#0F7D4B';
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAYS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

// Safely parse a date that might be 'YYYY-MM-DD' or a full ISO timestamp
function dateToDay(s: string) {
  return s ? s.slice(0, 10) : '';
}

function fmtDate(s: string) {
  const d = new Date(dateToDay(s) + 'T00:00:00');
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function matchDayTs(m: ProfesorMatch) {
  return startOfDay(new Date(dateToDay(m.date) + 'T00:00:00'));
}

const STATUS_COLORS: Record<string, string> = {
  upcoming:  GREEN,
  scheduled: GREEN,
  played:    Colors.gray,
  finished:  Colors.gray,
  cancelled: Colors.red ?? '#EF4444',
};

const STATUS_LABELS: Record<string, string> = {
  upcoming:  'Próximo',
  scheduled: 'Programado',
  played:    'Jugado',
  finished:  'Jugado',
  cancelled: 'Cancelado',
};

type Section = { title: string; data: ProfesorMatch[] };

function buildSections(matches: ProfesorMatch[], teamFilter: number | null): Section[] {
  const now  = startOfDay(new Date());
  const in7  = now + 7 * 86400000;

  const filtered = teamFilter
    ? matches.filter(m => m.team_id === teamFilter)
    : matches;

  const isUpcoming  = (m: ProfesorMatch) => m.status !== 'cancelled' && m.status !== 'played' && m.status !== 'finished';
  const isCompleted = (m: ProfesorMatch) => m.status === 'played' || m.status === 'finished';

  const today    = filtered.filter(m => matchDayTs(m) === now && isUpcoming(m));
  const thisWeek = filtered.filter(m => { const t = matchDayTs(m); return t > now && t <= in7 && isUpcoming(m); });
  const upcoming = filtered.filter(m => matchDayTs(m) > in7 && isUpcoming(m));
  const recently = filtered.filter(isCompleted)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const sections: Section[] = [];
  if (today.length)    sections.push({ title: 'HOY', data: today });
  if (thisWeek.length) sections.push({ title: 'ESTA SEMANA', data: thisWeek });
  if (upcoming.length) sections.push({ title: 'PRÓXIMOS', data: upcoming });
  if (recently.length) sections.push({ title: 'ÚLTIMOS RESULTADOS', data: recently });
  return sections;
}

function SummaryCard({ icon, label, value, color, sub }: { icon: string; label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: (color ?? GREEN) + '18' }]}>
        <Ionicons name={icon as any} size={18} color={color ?? GREEN} />
      </View>
      <Text style={[styles.summaryVal, { color: color ?? GREEN }]}>{value}</Text>
      <Text style={styles.summaryLbl}>{label}</Text>
      {sub && <Text style={styles.summarySub}>{sub}</Text>}
    </View>
  );
}

function MatchCard({ match, onPress }: { match: ProfesorMatch; onPress: () => void }) {
  const isPlayed    = match.status === 'played' || match.status === 'finished';
  const isCancelled = match.status === 'cancelled';
  const isToday     = matchDayTs(match) === startOfDay(new Date());
  const stripColor  = isToday ? '#F59E0B' : (STATUS_COLORS[match.status] ?? Colors.gray);
  const pendingConf = match.convocados_count > 0
    ? match.convocados_count - match.confirmed_count
    : 0;

  return (
    <TouchableOpacity style={styles.matchCard} onPress={onPress} activeOpacity={0.82}>
      {/* Left severity strip */}
      <View style={[styles.matchStrip, { backgroundColor: stripColor }]} />

      <View style={{ flex: 1, gap: 6, padding: 12 }}>
        {/* Teams row */}
        <View style={styles.matchTeamsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.matchTitle} numberOfLines={2}>
              {match.home_team ?? match.title} vs {match.away_team ?? ''}
            </Text>
            {match.team_name && (
              <Text style={styles.matchTeamChip}>{match.team_name}</Text>
            )}
          </View>
          {isPlayed && match.score ? (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreTxt}>{match.score.replace(':', ' – ')}</Text>
            </View>
          ) : isCancelled ? (
            <View style={[styles.statusBadge, { backgroundColor: '#FEF2F2' }]}>
              <Text style={[styles.statusBadgeTxt, { color: '#EF4444' }]}>CANCELADO</Text>
            </View>
          ) : null}
        </View>

        {/* Meta row */}
        <View style={styles.matchMeta}>
          <Ionicons name="calendar-outline" size={12} color={Colors.gray} />
          <Text style={styles.matchMetaTxt}>{fmtDate(match.date)}{match.time ? ` · ${match.time}` : ''}</Text>
          {match.location && (
            <>
              <View style={styles.metaDot} />
              <Ionicons name="location-outline" size={12} color={Colors.gray} />
              <Text style={styles.matchMetaTxt} numberOfLines={1}>{match.location}</Text>
            </>
          )}
        </View>

        {/* Footer chips */}
        <View style={styles.matchFooter}>
          {match.competition && (
            <View style={styles.compChip}>
              <Text style={styles.compChipTxt} numberOfLines={1}>{match.competition}</Text>
            </View>
          )}
          {!isPlayed && match.convocados_count > 0 && (
            <View style={[styles.convChip, pendingConf > 0 && styles.convChipWarn]}>
              <Ionicons
                name="people-outline"
                size={11}
                color={pendingConf > 0 ? '#D97706' : GREEN}
              />
              <Text style={[styles.convChipTxt, pendingConf > 0 && { color: '#D97706' }]}>
                {match.confirmed_count}/{match.convocados_count}
              </Text>
              {pendingConf > 0 && (
                <Text style={styles.convChipWarnTxt}>{pendingConf} pend.</Text>
              )}
            </View>
          )}
          {!isPlayed && match.convocados_count === 0 && (
            <View style={[styles.convChip, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="alert-circle-outline" size={11} color={Colors.gray} />
              <Text style={[styles.convChipTxt, { color: Colors.gray }]}>Sin convocar</Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={Colors.light} style={{ marginRight: 12 }} />
    </TouchableOpacity>
  );
}

export default function PartidosDashboardScreen({ navigation }: any) {
  const [teams,       setTeams]       = useState<ProfesorTeam[]>([]);
  const [allMatches,  setAllMatches]  = useState<ProfesorMatch[]>([]);
  const [teamFilter,  setTeamFilter]  = useState<number | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  const load = useCallback(async () => {
    try {
      const ts = await Profesor.teams();
      setTeams(ts);
      const results = await Promise.allSettled(
        ts.map(t => Profesor.teamMatches(t.id)),
      );
      const combined: ProfesorMatch[] = [];
      results.forEach(r => {
        if (r.status === 'fulfilled') combined.push(...r.value);
      });
      // Deduplicate by id, sort by date asc
      const seen = new Set<number>();
      const unique = combined.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
      unique.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''));
      setAllMatches(unique);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const now  = startOfDay(new Date());
  const in7  = now + 7 * 86400000;

  // Apply team filter to stats too (consistent with sections)
  const filteredMatches = teamFilter ? allMatches.filter(m => m.team_id === teamFilter) : allMatches;

  const upcoming   = filteredMatches.filter(m => {
    const t = matchDayTs(m);
    return t >= now && m.status !== 'played' && m.status !== 'finished' && m.status !== 'cancelled';
  });
  const thisWeek   = upcoming.filter(m => matchDayTs(m) <= in7);
  const pendingConv = filteredMatches.filter(m =>
    m.convocados_count > 0 && m.confirmed_count < m.convocados_count &&
    m.status !== 'played' && m.status !== 'finished' && m.status !== 'cancelled' &&
    matchDayTs(m) >= now,
  );
  const withoutConv = upcoming.filter(m => m.convocados_count === 0).length;

  const sections = buildSections(allMatches, teamFilter);

  const goToMatch = (m: ProfesorMatch) => {
    const team = teams.find(t => t.id === m.team_id);
    navigation.navigate('PartidoGestion', { match: m, teamName: team?.name ?? m.team_name ?? '' });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={GREEN} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Partidos</Text>
          <Text style={styles.headerSub}>{teams.length} equipos · {allMatches.length} partidos</Text>
        </View>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('PartidosEquipo', { teamName: 'Mis Equipos' })}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[]}
        keyExtractor={() => 'x'}
        renderItem={null}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
        ListHeaderComponent={() => (
          <View style={{ paddingBottom: 20 }}>
            {/* Summary strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.summaryRow}
            >
              <SummaryCard
                icon="calendar-outline"
                label="Esta semana"
                value={thisWeek.length}
                color={thisWeek.length > 0 ? GREEN : Colors.gray}
              />
              <SummaryCard
                icon="megaphone-outline"
                label="Sin convocar"
                value={withoutConv}
                color={withoutConv > 0 ? '#EF4444' : Colors.gray}
                sub={withoutConv > 0 ? 'requieren atención' : '¡Al día!'}
              />
              <SummaryCard
                icon="people-outline"
                label="Pend. confirmar"
                value={pendingConv.length}
                color={pendingConv.length > 0 ? '#F59E0B' : Colors.gray}
              />
              <SummaryCard
                icon="football-outline"
                label="Próximos"
                value={upcoming.length}
                color={GREEN}
              />
            </ScrollView>

            {/* Team filter pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              <TouchableOpacity
                style={[styles.filterPill, teamFilter === null && styles.filterPillOn]}
                onPress={() => setTeamFilter(null)}
              >
                <Text style={[styles.filterPillTxt, teamFilter === null && styles.filterPillOnTxt]}>
                  Todos ({allMatches.length})
                </Text>
              </TouchableOpacity>
              {teams.map(t => {
                const count = allMatches.filter(m => m.team_id === t.id).length;
                const on    = teamFilter === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.filterPill, on && styles.filterPillOn]}
                    onPress={() => setTeamFilter(on ? null : t.id)}
                  >
                    <Text style={[styles.filterPillTxt, on && styles.filterPillOnTxt]}>
                      {t.name} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Sections */}
            {sections.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="football-outline" size={40} color={Colors.light} />
                <Text style={styles.emptyTitle}>Sin partidos</Text>
                <Text style={styles.emptyTxt}>Crea un partido desde la pantalla del equipo</Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => navigation.navigate('PartidosEquipo', {})}
                >
                  <Ionicons name="add-circle-outline" size={16} color="#fff" />
                  <Text style={styles.emptyBtnTxt}>Crear partido</Text>
                </TouchableOpacity>
              </View>
            ) : (
              sections.map(sec => (
                <View key={sec.title} style={{ marginTop: 20 }}>
                  {/* Section header */}
                  <View style={styles.secHeader}>
                    <View style={styles.secLblWrap}>
                      <Text style={[styles.secLbl, sec.title === 'HOY' && { color: '#D97706' }]}>
                        {sec.title}
                      </Text>
                      <View style={[styles.secCount, sec.title === 'HOY' && { backgroundColor: '#FEF3C7' }]}>
                        <Text style={[styles.secCountTxt, sec.title === 'HOY' && { color: '#D97706' }]}>
                          {sec.data.length}
                        </Text>
                      </View>
                    </View>
                    {sec.title === 'ESTA SEMANA' || sec.title === 'PRÓXIMOS' ? (
                      <TouchableOpacity
                        onPress={() => {
                          const teamId   = teamFilter ?? teams[0]?.id;
                          const teamName = teams.find(t => t.id === teamId)?.name ?? 'Mis Equipos';
                          navigation.navigate('PartidosEquipo', { teamId, teamName });
                        }}
                      >
                        <Text style={styles.secLink}>+ Crear partido</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Match cards */}
                  {sec.data.map(m => (
                    <MatchCard key={m.id} match={m} onPress={() => goToMatch(m)} />
                  ))}
                </View>
              ))
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.surf },
  header:  { backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  headerBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  // Summary
  summaryRow:  { paddingHorizontal: 14, paddingTop: 16, gap: 10 },
  summaryCard: { width: 110, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  summaryIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  summaryVal:  { fontSize: 26, fontWeight: '900' },
  summaryLbl:  { fontSize: 10, fontWeight: '700', color: Colors.gray, textAlign: 'center' },
  summarySub:  { fontSize: 9, color: Colors.gray, textAlign: 'center' },

  // Filters
  filterRow:  { paddingHorizontal: 14, paddingTop: 14, gap: 8 },
  filterPill: { borderRadius: 20, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.light },
  filterPillOn: { backgroundColor: GREEN, borderColor: GREEN },
  filterPillTxt: { fontSize: 12, fontWeight: '700', color: Colors.gray },
  filterPillOnTxt: { color: '#fff' },

  // Section
  secHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },
  secLblWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secLbl:      { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: Colors.gray },
  secCount:    { backgroundColor: GREEN + '20', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  secCountTxt: { fontSize: 10, fontWeight: '800', color: GREEN },
  secLink:     { fontSize: 11, fontWeight: '700', color: GREEN },

  // Match card
  matchCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 14, marginBottom: 8, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  matchStrip:    { width: 4, alignSelf: 'stretch' },
  matchTeamsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  matchTitle:    { fontSize: 14, fontWeight: '800', color: Colors.black, lineHeight: 19, flex: 1 },
  matchTeamChip: { fontSize: 10, fontWeight: '700', color: GREEN, marginTop: 2 },
  matchMeta:     { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  matchMetaTxt:  { fontSize: 11, color: Colors.gray },
  metaDot:       { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.light },
  matchFooter:   { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  // card inner padding via gap
  matchCard2:    { padding: 12 }, // merged into matchCard via explicit padding

  scoreBadge:    { backgroundColor: '#F0FDF4', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: GREEN + '30' },
  scoreTxt:      { fontSize: 16, fontWeight: '900', color: GREEN },
  statusBadge:   { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgeTxt:{ fontSize: 9, fontWeight: '800' },

  compChip:      { backgroundColor: Colors.surf, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  compChipTxt:   { fontSize: 9, fontWeight: '700', color: Colors.gray },
  convChip:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: GREEN + '10', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  convChipWarn:  { backgroundColor: '#FEF3C7' },
  convChipTxt:   { fontSize: 10, fontWeight: '700', color: GREEN },
  convChipWarnTxt: { fontSize: 9, fontWeight: '700', color: '#D97706' },

  // Empty
  emptyBox:   { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.black },
  emptyTxt:   { fontSize: 13, color: Colors.gray, textAlign: 'center' },
  emptyBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GREEN, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, marginTop: 8 },
  emptyBtnTxt:{ fontSize: 13, fontWeight: '800', color: '#fff' },
});
