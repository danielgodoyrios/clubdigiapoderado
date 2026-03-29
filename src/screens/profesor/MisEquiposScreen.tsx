import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, TextInput, Image, RefreshControl, Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Profesor, ProfesorTeam, ProfesorPlayer } from '../../api';

const GREEN = '#0F7D4B';

type StatusFilter = 'todos' | 'active' | 'injured' | 'inactive';

const STATUS_FILTERS: { key: StatusFilter; label: string; color: string }[] = [
  { key: 'todos',    label: 'Todos',     color: Colors.gray },
  { key: 'active',   label: 'Activos',   color: '#10B981' },
  { key: 'injured',  label: 'Lesionados',color: Colors.red },
  { key: 'inactive', label: 'Bajas',     color: '#F59E0B' },
];

export default function MisEquiposScreen({ navigation, route }: any) {
  const initialTeamId: number | undefined = route.params?.teamId;

  const [teams,          setTeams]          = useState<ProfesorTeam[]>([]);
  const [activeTeam,     setActiveTeam]     = useState<ProfesorTeam | null>(null);
  const [allPlayers,     setAllPlayers]     = useState<ProfesorPlayer[]>([]);
  const [search,         setSearch]         = useState('');
  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>('todos');
  const [teamPickerOpen, setTeamPickerOpen] = useState(false);
  const [teamSearch,     setTeamSearch]     = useState('');
  const [loadingTeams,   setLoadingTeams]   = useState(true);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [refreshing,     setRefreshing]     = useState(false);

  const loadTeams = useCallback(async () => {
    try {
      const ts = await Profesor.teams();
      setTeams(ts);
      const initial = initialTeamId ? ts.find(t => t.id === initialTeamId) : ts[0];
      if (initial) setActiveTeam(initial);
    } finally {
      setLoadingTeams(false);
      setRefreshing(false);
    }
  }, [initialTeamId]);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  // Carga jugadores del equipo activo (o todos si activeTeam === null y "Todos")
  const loadPlayers = useCallback((team: ProfesorTeam) => {
    setLoadingPlayers(true);
    setSearch('');
    setStatusFilter('todos');
    Profesor.players(team.id)
      .then(ps => setAllPlayers(ps))
      .catch(() => setAllPlayers([]))
      .finally(() => setLoadingPlayers(false));
  }, []);

  useEffect(() => {
    if (!activeTeam) return;
    loadPlayers(activeTeam);
  }, [activeTeam, loadPlayers]);

  const selectTeam = (team: ProfesorTeam) => {
    setActiveTeam(team);
    setTeamPickerOpen(false);
    setTeamSearch('');
  };

  const onRefresh = () => { setRefreshing(true); loadTeams(); };

  const filtered = useMemo(() => {
    let list = allPlayers;
    if (statusFilter !== 'todos') list = list.filter(p => p.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.position ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [allPlayers, statusFilter, search]);

  const statusColor = (status: string) => {
    if (status === 'injured')  return Colors.red;
    if (status === 'inactive') return '#F59E0B';
    return '#10B981';
  };

  // Equipos agrupados por categoría para el picker
  const teamsByCategory = useMemo(() => {
    const q = teamSearch.toLowerCase();
    const visible = teamSearch ? teams.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.category ?? '').toLowerCase().includes(q),
    ) : teams;
    const map: Record<string, ProfesorTeam[]> = {};
    visible.forEach(t => {
      const cat = t.category ?? 'Sin categoría';
      if (!map[cat]) map[cat] = [];
      map[cat].push(t);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [teams, teamSearch]);

  const activeCount   = allPlayers.filter(p => p.status === 'active').length;
  const injuredCount  = allPlayers.filter(p => p.status === 'injured').length;
  const inactiveCount = allPlayers.filter(p => p.status === 'inactive').length;

  if (loadingTeams) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={GREEN} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Team picker modal */}
      <Modal
        visible={teamPickerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTeamPickerOpen(false)}
      >
        <SafeAreaView style={styles.pickerModal} edges={['top']}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Seleccionar Equipo</Text>
            <TouchableOpacity onPress={() => { setTeamPickerOpen(false); setTeamSearch(''); }}>
              <Ionicons name="close" size={24} color={Colors.black} />
            </TouchableOpacity>
          </View>
          {/* Search teams */}
          <View style={styles.pickerSearch}>
            <Ionicons name="search-outline" size={16} color={Colors.gray} />
            <TextInput
              style={styles.pickerSearchInput}
              placeholder="Buscar equipo o categoría..."
              placeholderTextColor={Colors.gray}
              value={teamSearch}
              onChangeText={setTeamSearch}
              autoFocus
            />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {teamsByCategory.map(([cat, list]) => (
              <View key={cat}>
                <Text style={styles.pickerCatLabel}>{cat.toUpperCase()}</Text>
                {list.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.pickerTeamRow, activeTeam?.id === t.id && styles.pickerTeamRowActive]}
                    onPress={() => selectTeam(t)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.pickerTeamIcon}>
                      <Ionicons name="shield-outline" size={16} color={GREEN} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerTeamName}>{t.name}</Text>
                      {t.sport && <Text style={styles.pickerTeamMeta}>{t.sport}</Text>}
                    </View>
                    <Text style={styles.pickerTeamCount}>{t.player_count} jug.</Text>
                    {activeTeam?.id === t.id && (
                      <Ionicons name="checkmark-circle" size={18} color={GREEN} style={{ marginLeft: 6 }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            {teamsByCategory.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTxt}>Sin resultados para "{teamSearch}"</Text>
              </View>
            )}
            <View style={{ height: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Equipos</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Team selector button */}
      <TouchableOpacity
        style={styles.teamSelectorBtn}
        onPress={() => setTeamPickerOpen(true)}
        activeOpacity={0.8}
      >
        <View style={styles.teamSelectorIcon}>
          <Ionicons name="shield-outline" size={18} color={GREEN} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.teamSelectorName} numberOfLines={1}>
            {activeTeam ? activeTeam.name : 'Seleccionar equipo'}
          </Text>
          {activeTeam?.category && (
            <Text style={styles.teamSelectorCat}>{[activeTeam.category, activeTeam.sport].filter(Boolean).join(' · ')}</Text>
          )}
        </View>
        <View style={styles.teamSelectorBadge}>
          <Text style={styles.teamSelectorBadgeTxt}>{teams.length} equipos</Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={Colors.gray} style={{ marginLeft: 4 }} />
      </TouchableOpacity>

      {/* Stats bar for active team */}
      {activeTeam && !loadingPlayers && (
        <View style={styles.teamInfo}>
          <TouchableOpacity style={styles.teamInfoItem} onPress={() => setStatusFilter('todos')}>
            <Text style={styles.teamInfoVal}>{allPlayers.length}</Text>
            <Text style={styles.teamInfoLbl}>Total</Text>
          </TouchableOpacity>
          <View style={styles.teamInfoDiv} />
          <TouchableOpacity style={styles.teamInfoItem} onPress={() => setStatusFilter('active')}>
            <Text style={[styles.teamInfoVal, { color: '#10B981' }]}>{activeCount}</Text>
            <Text style={styles.teamInfoLbl}>Activos</Text>
          </TouchableOpacity>
          <View style={styles.teamInfoDiv} />
          <TouchableOpacity style={styles.teamInfoItem} onPress={() => setStatusFilter('injured')}>
            <Text style={[styles.teamInfoVal, injuredCount > 0 && { color: Colors.red }]}>{injuredCount}</Text>
            <Text style={styles.teamInfoLbl}>Lesionados</Text>
          </TouchableOpacity>
          <View style={styles.teamInfoDiv} />
          <TouchableOpacity style={styles.teamInfoItem} onPress={() => setStatusFilter('inactive')}>
            <Text style={[styles.teamInfoVal, inactiveCount > 0 && { color: '#F59E0B' }]}>{inactiveCount}</Text>
            <Text style={styles.teamInfoLbl}>Bajas</Text>
          </TouchableOpacity>
          <View style={styles.teamInfoDiv} />
          <View style={styles.teamInfoItem}>
            <Text style={[styles.teamInfoVal, { color: GREEN }]}>{allPlayers.filter(p => p.is_federado).length}</Text>
            <Text style={styles.teamInfoLbl}>Federados</Text>
          </View>
        </View>
      )}

      {/* Status filter chips */}
      {activeTeam && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {STATUS_FILTERS.map(f => {
            const count = f.key === 'todos' ? allPlayers.length
              : allPlayers.filter(p => p.status === f.key).length;
            const active = statusFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, active && { backgroundColor: f.color, borderColor: f.color }]}
                onPress={() => setStatusFilter(f.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipTxt, active && { color: '#fff' }]}>
                  {f.label}
                </Text>
                <View style={[styles.filterChipCount, active && { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                  <Text style={[styles.filterChipCountTxt, active && { color: '#fff' }]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Search */}
      {activeTeam && (
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={Colors.gray} style={{ marginLeft: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar jugador, posición..."
            placeholderTextColor={Colors.gray}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: 10 }}>
              <Ionicons name="close-circle" size={16} color={Colors.gray} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Players list */}
      {loadingPlayers ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="small" color={GREEN} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => String(p.id)}
          contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={36} color={Colors.light} />
              <Text style={styles.emptyTxt}>
                {!activeTeam ? 'Selecciona un equipo' : search || statusFilter !== 'todos' ? 'Sin resultados' : 'Sin jugadores'}
              </Text>
            </View>
          }
          renderItem={({ item: p }) => (
            <TouchableOpacity
              style={styles.playerCard}
              activeOpacity={0.82}
              onPress={() => navigation.navigate('LesionesEquipo', { pupilId: p.id, pupilName: p.name })}
            >
              {/* Status strip */}
              <View style={[styles.statusStrip, { backgroundColor: statusColor(p.status) }]} />

              {/* Avatar */}
              <View style={styles.playerAvBg}>
                {p.photo
                  ? <Image source={{ uri: p.photo }} style={styles.playerPhoto} />
                  : <Text style={styles.playerAvTxt}>
                      {p.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </Text>
                }
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={styles.playerName}>{p.name}</Text>
                <Text style={styles.playerMeta}>
                  {[p.position, p.birth_date ? `${new Date().getFullYear() - parseInt(p.birth_date)} años` : null].filter(Boolean).join(' · ') || 'Sin posición'}
                </Text>
                {p.status === 'injured' && (
                  <Text style={styles.statusLabel}>🚨 Lesionado</Text>
                )}
                {p.status === 'inactive' && (
                  <Text style={[styles.statusLabel, { color: '#D97706' }]}>⚠️ Baja temporal</Text>
                )}
              </View>

              {/* Number */}
              {p.number !== null && (
                <View style={styles.numberBadge}>
                  <Text style={styles.numberTxt}>#{p.number}</Text>
                </View>
              )}

              {/* Federado */}
              {p.is_federado && (
                <Ionicons name="ribbon-outline" size={14} color={GREEN} style={{ marginLeft: 2 }} />
              )}

              {/* Injuries count */}
              {p.injuries_count > 0 && (
                <View style={styles.injBadge}>
                  <Ionicons name="medkit-outline" size={10} color={Colors.red} />
                  <Text style={styles.injTxt}>{p.injuries_count}</Text>
                </View>
              )}

              <Ionicons name="chevron-forward" size={14} color={Colors.light} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.surf },
  header:       { backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  back:         { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#fff' },

  // Team selector button
  teamSelectorBtn:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 12, gap: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  teamSelectorIcon:     { width: 36, height: 36, borderRadius: 8, backgroundColor: GREEN + '12', alignItems: 'center', justifyContent: 'center' },
  teamSelectorName:     { fontSize: 14, fontWeight: '700', color: Colors.black },
  teamSelectorCat:      { fontSize: 11, color: GREEN, fontWeight: '600', marginTop: 1 },
  teamSelectorBadge:    { backgroundColor: GREEN + '15', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  teamSelectorBadgeTxt: { fontSize: 10, fontWeight: '700', color: GREEN },

  // Team picker modal
  pickerModal:        { flex: 1, backgroundColor: Colors.surf },
  pickerHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.light },
  pickerTitle:        { fontSize: 17, fontWeight: '800', color: Colors.black },
  pickerSearch:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.light, paddingHorizontal: 12 },
  pickerSearchInput:  { flex: 1, paddingVertical: 10, fontSize: 14, color: Colors.black },
  pickerCatLabel:     { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: Colors.gray, marginHorizontal: 16, marginTop: 14, marginBottom: 4 },
  pickerTeamRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 6, borderRadius: 12, padding: 12, gap: 10 },
  pickerTeamRowActive:{ borderWidth: 1.5, borderColor: GREEN },
  pickerTeamIcon:     { width: 34, height: 34, borderRadius: 8, backgroundColor: GREEN + '12', alignItems: 'center', justifyContent: 'center' },
  pickerTeamName:     { fontSize: 14, fontWeight: '700', color: Colors.black },
  pickerTeamMeta:     { fontSize: 11, color: Colors.gray, marginTop: 1 },
  pickerTeamCount:    { fontSize: 11, fontWeight: '600', color: Colors.gray },

  // Stats bar
  teamInfo:     { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.light },
  teamInfoItem: { flex: 1, alignItems: 'center' },
  teamInfoVal:  { fontSize: 17, fontWeight: '800', color: Colors.black },
  teamInfoLbl:  { fontSize: 9, color: Colors.gray, fontWeight: '600', marginTop: 1 },
  teamInfoDiv:  { width: 1, height: 28, backgroundColor: Colors.light, alignSelf: 'center' },

  // Filter chips
  filterRow:      { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, borderWidth: 1, borderColor: Colors.light, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#fff' },
  filterChipTxt:  { fontSize: 12, fontWeight: '700', color: Colors.black },
  filterChipCount:{ backgroundColor: Colors.surf, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  filterChipCountTxt: { fontSize: 10, fontWeight: '800', color: Colors.gray },

  searchRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 4, borderRadius: 10, borderWidth: 1, borderColor: Colors.light, gap: 6 },
  searchInput:  { flex: 1, paddingVertical: 9, fontSize: 13, color: Colors.black },

  playerCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 10, marginBottom: 8, gap: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statusStrip:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  playerAvBg:   { width: 44, height: 44, borderRadius: 22, backgroundColor: GREEN + '12', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  playerPhoto:  { width: 44, height: 44 },
  playerAvTxt:  { fontSize: 14, fontWeight: '800', color: GREEN },
  playerName:   { fontSize: 13, fontWeight: '700', color: Colors.black },
  playerMeta:   { fontSize: 11, color: Colors.gray, marginTop: 1 },
  statusLabel:  { fontSize: 10, fontWeight: '600', color: Colors.red, marginTop: 2 },
  numberBadge:  { backgroundColor: Colors.surf, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  numberTxt:    { fontSize: 11, fontWeight: '700', color: Colors.black },
  injBadge:     { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.red + '12', borderRadius: 5, paddingHorizontal: 4, paddingVertical: 2 },
  injTxt:       { fontSize: 9, fontWeight: '800', color: Colors.red },

  emptyBox:     { flex: 1, alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTxt:     { fontSize: 13, color: Colors.gray },
});
