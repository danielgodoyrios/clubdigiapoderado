import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Profesor, ProfesorTeam, Lesion } from '../../api';

const GREEN = '#0F7D4B';

const SEVERITY_COLOR: Record<string, string> = {
  leve:     '#10B981',
  moderada: '#F59E0B',
  grave:    '#EF4444',
};

const SEVERITY_LABEL: Record<string, string> = {
  leve:     'Leve',
  moderada: 'Moderada',
  grave:    'Grave',
};

export default function LesionesEquipoScreen({ navigation, route }: any) {
  // Can be called with { teamId, teamName } for team view,
  // or { pupilId, pupilName } for single-player view.
  const pupilId:   number | undefined = route.params?.pupilId;
  const pupilName: string | undefined = route.params?.pupilName;
  const initTeamId: number | undefined = route.params?.teamId;

  const [teams,   setTeams]   = useState<ProfesorTeam[]>([]);
  const [teamId,  setTeamId]  = useState<number | undefined>(initTeamId);
  const [lesions, setLesions] = useState<Lesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showClosed, setShowClosed] = useState(false);

  // Load teams if no specific context
  useEffect(() => {
    if (!pupilId && !initTeamId) {
      Profesor.teams()
        .then(ts => { setTeams(ts); if (ts.length === 1) setTeamId(ts[0].id); })
        .catch(() => {});
    }
  }, [pupilId, initTeamId]);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      let data: Lesion[];
      if (pupilId) {
        data = await Profesor.playerInjuries(pupilId);
      } else if (teamId) {
        data = await Profesor.injuries(teamId);
      } else {
        data = [];
      }
      setLesions(data);
    } catch {
      setLesions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pupilId, teamId]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = () => { setRefreshing(true); load(true); };

  const handleClose = (lesion: Lesion) => {
    const today = new Date().toISOString().slice(0, 10);
    Alert.alert(
      'Cerrar lesión',
      `¿Marcar la lesión de ${lesion.pupil_name} como recuperado?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar', style: 'default', onPress: async () => {
          try {
            await Profesor.closeInjury(lesion.id, { date_end: today });
            load();
          } catch {
            Alert.alert('Error', 'No se pudo cerrar la lesión.');
          }
        }},
      ]
    );
  };

  const displayed = lesions.filter(l => showClosed ? true : l.is_active);
  const activeCount  = lesions.filter(l =>  l.is_active).length;
  const closedCount  = lesions.filter(l => !l.is_active).length;

  const screenTitle = pupilId ? pupilName ?? 'Lesiones' : 'Lesiones del Equipo';

  const teamName = teams.find(t => t.id === teamId)?.name;

  // Team selector (if multiple teams, no pupilId, no initTeamId)
  if (!pupilId && !teamId) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lesiones</Text>
          <View style={{ width: 36 }} />
        </View>
        <FlatList
          data={teams}
          keyExtractor={t => String(t.id)}
          contentContainerStyle={{ padding: 14 }}
          renderItem={({ item: t }) => (
            <TouchableOpacity style={styles.teamCard} onPress={() => setTeamId(t.id)}>
              <View style={styles.teamIcon}>
                <Ionicons name="shield-outline" size={18} color={GREEN} />
              </View>
              <Text style={styles.teamName}>{t.name}</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.gray} />
            </TouchableOpacity>
          )}
        />
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
        <View style={{ flex: 1, paddingHorizontal: 8 }}>
          <Text style={styles.headerTitle}>{screenTitle}</Text>
          {teamName && !pupilId && <Text style={styles.headerSub}>{teamName}</Text>}
        </View>
        {/* Only show FAB-style add button for team view */}
        {!pupilId && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('RegistroLesion', { teamId })}
          >
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#EF4444' }]}>{activeCount}</Text>
          <Text style={styles.statLab}>Activas</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: GREEN }]}>{closedCount}</Text>
          <Text style={styles.statLab}>Recuperados</Text>
        </View>
        <View style={{ flex: 1 }} />
        {/* Toggle closed */}
        <TouchableOpacity
          style={[styles.filterChip, showClosed && { backgroundColor: GREEN + '18' }]}
          onPress={() => setShowClosed(p => !p)}
        >
          <Text style={[styles.filterChipTxt, showClosed && { color: GREEN }]}>
            {showClosed ? 'Mostrar activas' : 'Mostrar todas'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading
        ? <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={GREEN} /></View>
        : (
          <FlatList
            data={displayed}
            keyExtractor={l => String(l.id)}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={GREEN} />}
            contentContainerStyle={{ padding: 14 }}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="medkit-outline" size={40} color={Colors.light} />
                <Text style={styles.emptyTxt}>{showClosed ? 'Sin lesiones registradas' : 'Sin lesiones activas'}</Text>
                {!pupilId && (
                  <TouchableOpacity
                    style={[styles.emptyBtn, { backgroundColor: GREEN }]}
                    onPress={() => navigation.navigate('RegistroLesion', { teamId })}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Registrar lesión</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            renderItem={({ item: l }) => (
              <View style={[styles.cardBase, !l.is_active && styles.cardClosed]}>
                {/* Severity strip */}
                <View style={[styles.severityStrip, { backgroundColor: SEVERITY_COLOR[l.severity] }]} />

                <View style={{ flex: 1, padding: 12 }}>
                  {/* Top row: name + badges */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={styles.playerName} numberOfLines={1}>{l.pupil_name}</Text>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      <View style={[styles.chip, { backgroundColor: SEVERITY_COLOR[l.severity] + '18' }]}>
                        <Text style={[styles.chipTxt, { color: SEVERITY_COLOR[l.severity] }]}>{SEVERITY_LABEL[l.severity]}</Text>
                      </View>
                      {l.is_active
                        ? <View style={[styles.chip, { backgroundColor: '#FEE2E2' }]}><Text style={[styles.chipTxt, { color: '#EF4444' }]}>Activa</Text></View>
                        : <View style={[styles.chip, { backgroundColor: '#DCFCE7' }]}><Text style={[styles.chipTxt, { color: GREEN }]}>Alta</Text></View>
                      }
                    </View>
                  </View>

                  {/* Details */}
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    <View style={styles.detail}>
                      <Ionicons name="body-outline" size={12} color={Colors.gray} />
                      <Text style={styles.detailTxt}>{l.zone}</Text>
                    </View>
                    <View style={styles.detail}>
                      <Ionicons name="medical-outline" size={12} color={Colors.gray} />
                      <Text style={styles.detailTxt}>{l.type}</Text>
                    </View>
                    <View style={styles.detail}>
                      <Ionicons name="calendar-outline" size={12} color={Colors.gray} />
                      <Text style={styles.detailTxt}>{l.date_start}{l.date_end ? ` → ${l.date_end}` : ''}</Text>
                    </View>
                  </View>

                  {l.notes ? <Text style={styles.notes} numberOfLines={2}>{l.notes}</Text> : null}

                  {/* Actions */}
                  {l.is_active && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: GREEN + '15' }]}
                        onPress={() => handleClose(l)}
                      >
                        <Ionicons name="checkmark-circle-outline" size={13} color={GREEN} />
                        <Text style={[styles.actionTxt, { color: GREEN }]}>Dar de alta</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}
          />
        )
      }

      {/* FAB */}
      {!pupilId && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('RegistroLesion', { teamId })}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.surf },
  header:       { backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  back:         { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  addBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub:    { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },

  statsBar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.light, gap: 8 },
  statItem:     { alignItems: 'center', minWidth: 50 },
  statNum:      { fontSize: 18, fontWeight: '900' },
  statLab:      { fontSize: 9, fontWeight: '600', color: Colors.gray, textTransform: 'uppercase', marginTop: 1 },
  statDivider:  { width: 1, height: 28, backgroundColor: Colors.light, marginHorizontal: 4 },
  filterChip:   { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.light },
  filterChipTxt:{ fontSize: 11, fontWeight: '700', color: Colors.gray },

  teamCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, gap: 12 },
  teamIcon:     { width: 38, height: 38, borderRadius: 10, backgroundColor: GREEN + '12', alignItems: 'center', justifyContent: 'center' },
  teamName:     { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.black },

  cardBase:     { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardClosed:   { opacity: 0.65 },
  severityStrip:{ width: 4 },

  playerName:   { fontSize: 14, fontWeight: '800', color: Colors.black, flex: 1 },
  chip:         { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  chipTxt:      { fontSize: 10, fontWeight: '800' },
  detail:       { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.surf, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  detailTxt:    { fontSize: 11, color: Colors.gray },
  notes:        { fontSize: 12, color: Colors.gray, fontStyle: 'italic' },

  actionRow:    { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  actionTxt:    { fontSize: 12, fontWeight: '700' },

  fab:          { position: 'absolute', bottom: 24, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', shadowColor: GREEN, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },

  emptyBox:     { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTxt:     { fontSize: 13, color: Colors.gray },
  emptyBtn:     { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
});
