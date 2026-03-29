import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, TextInput, Image, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Profesor, ProfesorTeam, ProfesorPlayer } from '../../api';

const GREEN = '#0F7D4B';

export default function MisEquiposScreen({ navigation, route }: any) {
  const initialTeamId: number | undefined = route.params?.teamId;

  const [teams,        setTeams]        = useState<ProfesorTeam[]>([]);
  const [activeTeam,   setActiveTeam]   = useState<ProfesorTeam | null>(null);
  const [players,      setPlayers]      = useState<ProfesorPlayer[]>([]);
  const [search,       setSearch]       = useState('');
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);

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

  useEffect(() => {
    if (!activeTeam) return;
    setLoadingPlayers(true);
    setSearch('');
    Profesor.players(activeTeam.id)
      .then(setPlayers)
      .catch(() => setPlayers([]))
      .finally(() => setLoadingPlayers(false));
  }, [activeTeam]);

  const onRefresh = () => { setRefreshing(true); loadTeams(); };

  const filtered = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.position ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const statusColor = (status: string) => {
    if (status === 'injured')  return Colors.red;
    if (status === 'inactive') return Colors.gray;
    return '#10B981';
  };

  if (loadingTeams) {
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
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Equipos</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Team selector tabs */}
      {teams.length > 0 && (
        <View style={styles.teamTabs}>
          {teams.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.teamTab, activeTeam?.id === t.id && styles.teamTabActive]}
              onPress={() => setActiveTeam(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.teamTabTxt, activeTeam?.id === t.id && styles.teamTabTxtActive]}>
                {t.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {activeTeam && (
        <>
          {/* Team stats bar */}
          <View style={styles.teamInfo}>
            <View style={styles.teamInfoItem}>
              <Text style={styles.teamInfoVal}>{activeTeam.player_count}</Text>
              <Text style={styles.teamInfoLbl}>Jugadores</Text>
            </View>
            <View style={styles.teamInfoDiv} />
            <View style={styles.teamInfoItem}>
              <Text style={styles.teamInfoVal}>{players.filter(p => p.status === 'active').length}</Text>
              <Text style={styles.teamInfoLbl}>Activos</Text>
            </View>
            <View style={styles.teamInfoDiv} />
            <View style={styles.teamInfoItem}>
              <Text style={[styles.teamInfoVal, players.some(p => p.status === 'injured') && { color: Colors.red }]}>
                {players.filter(p => p.status === 'injured').length}
              </Text>
              <Text style={styles.teamInfoLbl}>Lesionados</Text>
            </View>
            <View style={styles.teamInfoDiv} />
            <View style={styles.teamInfoItem}>
              <Text style={styles.teamInfoVal}>{players.filter(p => p.is_federado).length}</Text>
              <Text style={styles.teamInfoLbl}>Federados</Text>
            </View>
          </View>

          {/* Search */}
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={16} color={Colors.gray} style={{ marginLeft: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar jugador..."
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
        </>
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
              <Text style={styles.emptyTxt}>{search ? 'Sin resultados' : 'Sin jugadores en este equipo'}</Text>
            </View>
          }
          renderItem={({ item: p }) => (
            <TouchableOpacity
              style={styles.playerCard}
              activeOpacity={0.82}
              onPress={() => navigation.navigate('LesionesEquipo', { pupilId: p.id, pupilName: p.name })}
            >
              {/* Avatar */}
              <View style={styles.playerAvBg}>
                {p.photo
                  ? <Image source={{ uri: p.photo }} style={styles.playerPhoto} />
                  : <Text style={styles.playerAvTxt}>
                      {p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </Text>
                }
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={styles.playerName}>{p.name}</Text>
                <Text style={styles.playerMeta}>
                  {[p.position, p.birth_date ? `${new Date().getFullYear() - parseInt(p.birth_date)} años` : null].filter(Boolean).join(' · ') || 'Sin posición'}
                </Text>
              </View>

              {/* Number */}
              {p.number !== null && (
                <View style={styles.numberBadge}>
                  <Text style={styles.numberTxt}>#{p.number}</Text>
                </View>
              )}

              {/* Status dot */}
              <View style={[styles.statusDot, { backgroundColor: statusColor(p.status) }]} />

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

  teamTabs:     { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.light, paddingHorizontal: 12 },
  teamTab:      { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  teamTabActive:{ borderBottomColor: GREEN },
  teamTabTxt:   { fontSize: 12, fontWeight: '600', color: Colors.gray },
  teamTabTxtActive: { color: GREEN },

  teamInfo:     { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 10, marginBottom: 4 },
  teamInfoItem: { flex: 1, alignItems: 'center' },
  teamInfoVal:  { fontSize: 18, fontWeight: '800', color: Colors.black },
  teamInfoLbl:  { fontSize: 9, color: Colors.gray, fontWeight: '600', marginTop: 1 },
  teamInfoDiv:  { width: 1, height: 30, backgroundColor: Colors.light, alignSelf: 'center' },

  searchRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 14, marginVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: Colors.light, gap: 6 },
  searchInput:  { flex: 1, paddingVertical: 9, fontSize: 13, color: Colors.black },

  playerCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 10, marginBottom: 8, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  playerAvBg:   { width: 44, height: 44, borderRadius: 22, backgroundColor: GREEN + '12', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  playerPhoto:  { width: 44, height: 44 },
  playerAvTxt:  { fontSize: 14, fontWeight: '800', color: GREEN },
  playerName:   { fontSize: 13, fontWeight: '700', color: Colors.black },
  playerMeta:   { fontSize: 11, color: Colors.gray, marginTop: 1 },
  numberBadge:  { backgroundColor: Colors.surf, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  numberTxt:    { fontSize: 11, fontWeight: '700', color: Colors.black },
  statusDot:    { width: 8, height: 8, borderRadius: 4 },
  injBadge:     { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.red + '12', borderRadius: 5, paddingHorizontal: 4, paddingVertical: 2 },
  injTxt:       { fontSize: 9, fontWeight: '800', color: Colors.red },

  emptyBox:     { flex: 1, alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTxt:     { fontSize: 13, color: Colors.gray },
});
