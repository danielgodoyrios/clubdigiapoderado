import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Profesor, ScheduleSlot, ProfesorTeam } from '../../api';

const GREEN = '#0F7D4B';

// Display order Mon → Sun → then check today
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_FULL  = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function ProgramacionScreen({ navigation }: any) {
  const [slots,      setSlots]      = useState<ScheduleSlot[]>([]);
  const [teams,      setTeams]      = useState<ProfesorTeam[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating,   setCreating]   = useState<number | null>(null); // slotId being processed

  const todayDow = new Date().getDay();  // 0=Sunday … 6=Saturday
  const todayStr = new Date().toISOString().slice(0, 10);

  const load = useCallback(async (refresh = false) => {
    if (!refresh) setLoading(true); else setRefreshing(true);
    try {
      const [slotsRes, teamsRes] = await Promise.all([
        Profesor.schedule(),
        Profesor.teams(),
      ]);
      setSlots(slotsRes);
      setTeams(teamsRes);
    } catch {
      // silent — no schedule or API unavailable
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  // ── Open / create session ──────────────────────────────────
  const openSession = async (slot: ScheduleSlot, teamId?: number) => {
    setCreating(slot.id);
    try {
      const result = await Profesor.createScheduleSession(slot.id, {
        date: todayStr,
        ...(teamId !== undefined ? { team_id: teamId } : {}),
      });
      navigation.navigate('AsistenciaProfesor', {
        sessionId: result.session_id,
        title:     result.title,
      });
    } catch (e: any) {
      Alert.alert('Error', e?.error ?? 'No se pudo abrir la sesión. Intenta nuevamente.');
    } finally {
      setCreating(null);
    }
  };

  const handlePassList = (slot: ScheduleSlot) => {
    if (slot.scope_type === 'team' && slot.target_ids.length > 1) {
      // Multiple teams → ask which one
      const options = slot.target_ids.map(id => ({
        id,
        name: teams.find(t => t.id === id)?.name ?? `Equipo #${id}`,
      }));
      Alert.alert(
        'Seleccionar equipo',
        '¿Para qué equipo es esta sesión?',
        [
          ...options.map(o => ({
            text: o.name,
            onPress: () => openSession(slot, o.id),
          })),
          { text: 'Cancelar', style: 'cancel' as const },
        ],
      );
    } else {
      const teamId = slot.scope_type === 'team' ? slot.target_ids[0] : undefined;
      openSession(slot, teamId);
    }
  };

  // ── Group slots by day, in DISPLAY_ORDER ─────────────────
  const grouped = DISPLAY_ORDER
    .map(dow => ({ dow, daySlots: slots.filter(s => s.day_of_week === dow) }))
    .filter(g => g.daySlots.length > 0);

  // ── Render ────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Programación</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 14, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={GREEN} />
          }
        >
          {grouped.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={52} color={Colors.light} />
              <Text style={styles.emptyTitle}>Sin programación</Text>
              <Text style={styles.emptySub}>
                El administrador del club aún no configuró el horario recurrente.
              </Text>
            </View>
          )}

          {grouped.map(({ dow, daySlots }) => {
            const isToday = dow === todayDow;
            return (
              <View key={dow} style={[styles.daySection, isToday && styles.daySectionToday]}>
                {/* Day label */}
                <View style={styles.dayHeader}>
                  <View style={[styles.dayBadge, isToday && styles.dayBadgeToday]}>
                    <Text style={[styles.dayBadgeTxt, isToday && styles.dayBadgeTxtToday]}>
                      {isToday ? 'HOY' : DAY_SHORT[dow]}
                    </Text>
                  </View>
                  <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                    {DAY_FULL[dow]}
                  </Text>
                </View>

                {/* Slot cards */}
                {daySlots.map(slot => (
                  <View key={slot.id} style={styles.slotCard}>
                    {/* Time column */}
                    <View style={styles.timeCol}>
                      <Text style={styles.timeStart}>{slot.start_time}</Text>
                      <View style={styles.timeLine} />
                      <Text style={styles.timeEnd}>{slot.end_time}</Text>
                    </View>

                    {/* Content */}
                    <View style={styles.slotBody}>
                      <Text style={styles.slotTitle}>{slot.title}</Text>

                      {(slot.venue?.name || slot.location) && (
                        <View style={styles.metaRow}>
                          <Ionicons name="location-outline" size={11} color={Colors.gray} />
                          <Text style={styles.metaTxt}>
                            {slot.venue?.name ?? slot.location}
                          </Text>
                        </View>
                      )}

                      {slot.coach && (
                        <View style={styles.metaRow}>
                          <Ionicons name="person-outline" size={11} color={Colors.gray} />
                          <Text style={styles.metaTxt}>{slot.coach.name}</Text>
                        </View>
                      )}
                    </View>

                    {/* Pass list button — solid for today, ghost for other days */}
                    {slot.is_mine && (
                      <TouchableOpacity
                        style={[
                          styles.listBtn,
                          isToday ? styles.listBtnSolid : styles.listBtnGhost,
                          creating === slot.id && { opacity: 0.6 },
                        ]}
                        onPress={() => handlePassList(slot)}
                        disabled={creating === slot.id}
                        activeOpacity={0.8}
                      >
                        {creating === slot.id ? (
                          <ActivityIndicator size="small" color={isToday ? '#fff' : GREEN} />
                        ) : (
                          <>
                            <Ionicons
                              name="clipboard-outline"
                              size={13}
                              color={isToday ? '#fff' : GREEN}
                            />
                            <Text style={[styles.listBtnTxt, !isToday && { color: GREEN }]}>
                              Lista
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.surf },

  // Header
  header:         { backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#fff' },

  // Day section
  daySection:     { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: Colors.light },
  daySectionToday:{ borderColor: GREEN + '60', shadowColor: GREEN, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 },

  dayHeader:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 },
  dayBadge:       { backgroundColor: Colors.light, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  dayBadgeToday:  { backgroundColor: GREEN },
  dayBadgeTxt:    { fontSize: 10, fontWeight: '800', color: Colors.gray },
  dayBadgeTxtToday: { color: '#fff' },
  dayName:        { fontSize: 13, fontWeight: '700', color: Colors.black },
  dayNameToday:   { color: GREEN },

  // Slot card
  slotCard:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 12, borderTopWidth: 1, borderTopColor: Colors.surf },

  timeCol:        { alignItems: 'center', minWidth: 42 },
  timeStart:      { fontSize: 11, fontWeight: '700', color: Colors.black },
  timeLine:       { width: 1, height: 12, backgroundColor: Colors.light, marginVertical: 2 },
  timeEnd:        { fontSize: 11, color: Colors.gray },

  slotBody:       { flex: 1, gap: 3 },
  slotTitle:      { fontSize: 13, fontWeight: '700', color: Colors.black },
  metaRow:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt:        { fontSize: 11, color: Colors.gray },

  // "Lista" button
  listBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  listBtnSolid:   { backgroundColor: GREEN },
  listBtnGhost:   { backgroundColor: GREEN + '15', borderWidth: 1, borderColor: GREEN + '40' },
  listBtnTxt:     { fontSize: 11, fontWeight: '800', color: '#fff' },

  // Empty
  emptyBox:       { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle:     { fontSize: 16, fontWeight: '700', color: Colors.black },
  emptySub:       { fontSize: 13, color: Colors.gray, textAlign: 'center', maxWidth: 260 },
});
