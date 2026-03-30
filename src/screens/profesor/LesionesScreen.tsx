import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SectionList, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../theme';
import { Profesor, Lesion } from '../../api';

const GREEN = '#0F7D4B';

const SEV_COLOR: Record<string, string> = {
  leve: '#10B981', moderada: '#F59E0B', grave: '#EF4444',
};
const SEV_LABEL: Record<string, string> = {
  leve: 'Leve', moderada: 'Moderada', grave: 'Grave',
};
const TRAINING_LABEL: Record<string, string> = {
  no_train: 'Baja total',
  partial:  'Parcial',
  full:     'Alta médica',
};

function daysSince(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

type Section = { title: string; teamId: number | null; data: Lesion[] };

export default function LesionesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [lesions,    setLesions]    = useState<Lesion[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await Profesor.allInjuries(activeOnly);
      setLesions(data);
    } catch {
      setLesions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeOnly]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sections: Section[] = useMemo(() => {
    const byTeam = new Map<string, Lesion[]>();
    for (const l of lesions) {
      const key = l.team_name ?? 'Sin equipo';
      if (!byTeam.has(key)) byTeam.set(key, []);
      byTeam.get(key)!.push(l);
    }
    return Array.from(byTeam.entries()).map(([title, data]) => ({
      title,
      teamId: data[0]?.team_id ?? null,
      data,
    }));
  }, [lesions]);

  const activeCount = lesions.filter(l => l.is_active).length;

  const handleClose = (lesion: Lesion) => {
    Alert.alert(
      'Dar de alta',
      `¿Marcar a ${lesion.pupil_name} como recuperado?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Dar de alta', style: 'default', onPress: async () => {
          try {
            await Profesor.closeInjury(lesion.id, { date_end: new Date().toISOString().slice(0, 10) });
            load(true);
          } catch {
            Alert.alert('Error', 'No se pudo cerrar la lesión. Intenta nuevamente.');
          }
        }},
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lesiones</Text>
        <TouchableOpacity
          style={styles.back}
          onPress={() => navigation.navigate('RegistroLesion')}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Summary + filter bar */}
      <View style={styles.filterBar}>
        <View style={styles.summaryChip}>
          <View style={[styles.dot, { backgroundColor: activeCount > 0 ? '#EF4444' : '#10B981' }]} />
          <Text style={styles.summaryTxt}>
            {activeCount} activa{activeCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, activeOnly && styles.toggleBtnOn]}
            onPress={() => setActiveOnly(true)}
          >
            <Text style={[styles.toggleTxt, activeOnly && styles.toggleTxtOn]}>Activas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !activeOnly && styles.toggleBtnOn]}
            onPress={() => setActiveOnly(false)}
          >
            <Text style={[styles.toggleTxt, !activeOnly && styles.toggleTxtOn]}>Todas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : lesions.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="medkit-outline" size={52} color={Colors.light} />
          <Text style={styles.emptyTitle}>
            {activeOnly ? 'Sin lesiones activas' : 'Sin lesiones registradas'}
          </Text>
          <Text style={styles.emptySub}>Puedes registrar una nueva con el botón +</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={GREEN} />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-outline" size={13} color={Colors.gray} />
              <Text style={styles.sectionTxt}>{section.title}</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeTxt}>{section.data.length}</Text>
              </View>
            </View>
          )}
          renderItem={({ item: l }) => {
            const days = daysSince(l.date_start);
            const sevColor = SEV_COLOR[l.severity] ?? Colors.gray;
            const initials = l.pupil_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <TouchableOpacity
                style={[styles.card, !l.is_active && styles.cardClosed]}
                onPress={() => navigation.navigate('LesionDetalle', { lesion: l })}
                activeOpacity={0.82}
              >
                {/* Severity stripe */}
                <View style={[styles.sevStripe, { backgroundColor: sevColor }]} />

                {/* Avatar */}
                <View style={[styles.avatar, { borderColor: sevColor + '60' }]}>
                  <Text style={styles.avatarTxt}>{initials}</Text>
                </View>

                {/* Info */}
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.playerName} numberOfLines={1}>{l.pupil_name}</Text>
                  <Text style={styles.injuryType}>
                    {l.type.charAt(0).toUpperCase() + l.type.slice(1)}
                    {l.zone ? ` · ${l.zone}` : ''}
                  </Text>
                  {l.training_status && (
                    <Text style={[styles.trainingStatus, { color: l.training_status === 'no_train' ? '#EF4444' : l.training_status === 'partial' ? '#F59E0B' : '#10B981' }]}>
                      {TRAINING_LABEL[l.training_status] ?? l.training_status}
                    </Text>
                  )}
                </View>

                {/* Right side */}
                <View style={styles.cardRight}>
                  <View style={[styles.sevBadge, { backgroundColor: sevColor + '18' }]}>
                    <Text style={[styles.sevBadgeTxt, { color: sevColor }]}>
                      {l.severity_label ?? SEV_LABEL[l.severity] ?? l.severity}
                    </Text>
                  </View>
                  {l.is_active ? (
                    <Text style={styles.daysTxt}>{days}d</Text>
                  ) : (
                    <View style={styles.recoveredBadge}>
                      <Text style={styles.recoveredTxt}>Alta</Text>
                    </View>
                  )}
                </View>

                <Ionicons name="chevron-forward" size={15} color={Colors.light} />
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 20) }]}
        onPress={() => navigation.navigate('RegistroLesion')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color="#fff" />
        <Text style={styles.fabTxt}>Registrar lesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.surf },
  header:     { backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  back:       { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#fff' },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray, marginTop: 8 },
  emptySub:   { fontSize: 13, color: Colors.light, textAlign: 'center', paddingHorizontal: 40 },

  filterBar:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.light },
  summaryChip:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  summaryTxt: { fontSize: 13, fontWeight: '700', color: Colors.black },
  toggle:     { flexDirection: 'row', backgroundColor: Colors.surf, borderRadius: 8, padding: 2, gap: 2 },
  toggleBtn:  { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  toggleBtnOn:{ backgroundColor: GREEN },
  toggleTxt:  { fontSize: 12, fontWeight: '700', color: Colors.gray },
  toggleTxtOn:{ color: '#fff' },

  sectionHeader:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  sectionTxt:       { fontSize: 11, fontWeight: '800', color: Colors.gray, flex: 1, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionBadge:     { backgroundColor: Colors.light, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  sectionBadgeTxt:  { fontSize: 11, fontWeight: '800', color: Colors.gray },

  card:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 14, marginBottom: 8, borderRadius: 12, padding: 12, gap: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardClosed: { opacity: 0.6 },
  sevStripe:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  avatar:     { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.surf, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  avatarTxt:  { fontSize: 14, fontWeight: '800', color: Colors.gray },
  playerName: { fontSize: 14, fontWeight: '700', color: Colors.black },
  injuryType: { fontSize: 12, color: Colors.gray },
  trainingStatus: { fontSize: 11, fontWeight: '700' },
  cardRight:  { alignItems: 'flex-end', gap: 4 },
  sevBadge:   { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  sevBadgeTxt:{ fontSize: 10, fontWeight: '800' },
  daysTxt:    { fontSize: 11, color: Colors.gray, fontWeight: '600' },
  recoveredBadge: { backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  recoveredTxt:   { fontSize: 10, fontWeight: '800', color: '#16A34A' },

  fab:        { position: 'absolute', right: 20, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GREEN, borderRadius: 28, paddingHorizontal: 20, paddingVertical: 14, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  fabTxt:     { fontSize: 14, fontWeight: '800', color: '#fff' },
});
