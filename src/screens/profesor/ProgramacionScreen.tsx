import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Profesor, ProfesorEvent } from '../../api';

const GREEN = '#0F7D4B';

const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Lun…Sáb…Dom
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_FULL  = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS    = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function dayOfWeek(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').getDay();
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export default function ProgramacionScreen({ navigation }: any) {
  const [events,     setEvents]     = useState<ProfesorEvent[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating,   setCreating]   = useState<number | null>(null);

  const now      = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const todayDow = now.getDay();

  const daysSinceMonday = (todayDow + 6) % 7;
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - daysSinceMonday);
  const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 13);
  const fromStr = weekStart.toISOString().slice(0, 10);
  const toStr   = weekEnd.toISOString().slice(0, 10);

  const load = useCallback(async (refresh = false) => {
    if (!refresh) setLoading(true); else setRefreshing(true);
    try {
      const evs = await Profesor.allEvents(fromStr, toStr);
      setEvents(evs);
    } catch {
      // silence
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const openSession = async (ev: ProfesorEvent) => {
    if (!ev.team_id) {
      Alert.alert('Sin equipo', 'Este evento no tiene un equipo asignado.');
      return;
    }
    setCreating(ev.id);
    try {
      const session = await Profesor.createAttendanceSession(ev.team_id, {
        date:  ev.date,
        type:  ev.type,
        title: ev.title,
      });
      navigation.navigate('AsistenciaProfesor', {
        sessionId: session.id,
        title:     session.title ?? ev.title,
      });
    } catch (e: any) {
      Alert.alert('Error', e?.error ?? 'No se pudo abrir la sesión de asistencia.');
    } finally {
      setCreating(null);
    }
  };

  const byDate = new Map<string, ProfesorEvent[]>();
  events.forEach(ev => {
    const arr = byDate.get(ev.date) ?? [];
    arr.push(ev);
    byDate.set(ev.date, arr);
  });
  const sortedDates = Array.from(byDate.keys()).sort();

  const typeColor = (type: string) => type === 'match' ? Colors.blue : GREEN;
  const typeLabel = (type: string) =>
    type === 'match' ? 'PARTIDO' : type === 'training' ? 'ENTREN.' : 'EVENTO';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Programación</Text>
          <Text style={styles.headerSub}>{fromStr !== toStr ? `${fmtDate(fromStr)} – ${fmtDate(toStr)}` : fmtDate(fromStr)}</Text>
        </View>
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
          {sortedDates.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={52} color={Colors.light} />
              <Text style={styles.emptyTitle}>Sin eventos programados</Text>
              <Text style={styles.emptySub}>
                No hay actividades registradas para las próximas dos semanas.
              </Text>
            </View>
          )}

          {sortedDates.map(dateStr => {
            const dow     = dayOfWeek(dateStr);
            const isToday = dateStr === todayStr;
            const dayEvs  = byDate.get(dateStr)!;

            return (
              <View key={dateStr} style={[styles.daySection, isToday && styles.daySectionToday]}>
                <View style={styles.dayHeader}>
                  <View style={[styles.dayBadge, isToday && styles.dayBadgeToday]}>
                    <Text style={[styles.dayBadgeTxt, isToday && styles.dayBadgeTxtToday]}>
                      {isToday ? 'HOY' : DAY_SHORT[dow]}
                    </Text>
                  </View>
                  <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                    {DAY_FULL[dow]} {fmtDate(dateStr)}
                  </Text>
                </View>

                {dayEvs.map(ev => {
                  const canTakeList = ev.type === 'training' || ev.type === 'match';
                  const isBusy      = creating === ev.id;

                  return (
                    <View key={ev.id} style={styles.eventCard}>
                      <View style={[styles.eventStrip, { backgroundColor: typeColor(ev.type) }]} />
                      <View style={styles.eventBody}>
                        <View style={styles.eventTopRow}>
                          <View style={[styles.typeChip, { backgroundColor: typeColor(ev.type) + '18' }]}>
                            <Text style={[styles.typeChipTxt, { color: typeColor(ev.type) }]}>
                              {typeLabel(ev.type)}
                            </Text>
                          </View>
                          {ev.time && <Text style={styles.eventTime}>{ev.time}</Text>}
                        </View>

                        <Text style={styles.eventTitle} numberOfLines={2}>{ev.title}</Text>

                        {ev.team_name && (
                          <View style={styles.metaRow}>
                            <Ionicons name="shield-outline" size={11} color={Colors.gray} />
                            <Text style={styles.metaTxt}>{ev.team_name}</Text>
                          </View>
                        )}

                        {(ev.location || ev.venue) && (
                          <View style={styles.metaRow}>
                            <Ionicons name="location-outline" size={11} color={Colors.gray} />
                            <Text style={styles.metaTxt}>
                              {typeof ev.venue === 'string' ? ev.venue : ev.location}
                            </Text>
                          </View>
                        )}

                        {ev.type === 'match' && (ev.convocados > 0 || ev.confirmados > 0) && (
                          <Text style={styles.convMeta}>
                            {ev.convocados} convocados · {ev.confirmados} confirmados
                          </Text>
                        )}
                      </View>

                      {canTakeList && (
                        <TouchableOpacity
                          style={[
                            styles.listBtn,
                            isToday ? styles.listBtnSolid : styles.listBtnGhost,
                            isBusy && { opacity: 0.6 },
                          ]}
                          onPress={() => openSession(ev)}
                          disabled={isBusy}
                          activeOpacity={0.8}
                        >
                          {isBusy ? (
                            <ActivityIndicator size="small" color={isToday ? '#fff' : GREEN} />
                          ) : (
                            <>
                              <Ionicons name="clipboard-outline" size={14} color={isToday ? '#fff' : GREEN} />
                              <Text style={[styles.listBtnTxt, !isToday && { color: GREEN }]}>Lista</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.surf },
  header:           { backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:      { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub:        { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  daySection:       { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: Colors.light },
  daySectionToday:  { borderColor: GREEN + '60', shadowColor: GREEN, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 },
  dayHeader:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 },
  dayBadge:         { backgroundColor: Colors.light, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  dayBadgeToday:    { backgroundColor: GREEN },
  dayBadgeTxt:      { fontSize: 10, fontWeight: '800', color: Colors.gray },
  dayBadgeTxtToday: { color: '#fff' },
  dayName:          { fontSize: 13, fontWeight: '700', color: Colors.black },
  dayNameToday:     { color: GREEN },
  eventCard:        { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.surf, overflow: 'hidden' },
  eventStrip:       { width: 4, alignSelf: 'stretch', minHeight: 60 },
  eventBody:        { flex: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  eventTopRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  typeChip:         { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  typeChipTxt:      { fontSize: 9, fontWeight: '800' },
  eventTime:        { fontSize: 11, fontWeight: '700', color: Colors.black },
  eventTitle:       { fontSize: 13, fontWeight: '700', color: Colors.black, lineHeight: 17 },
  metaRow:          { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt:          { fontSize: 11, color: Colors.gray },
  convMeta:         { fontSize: 10, color: Colors.gray, fontStyle: 'italic' },
  listBtn:          { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginRight: 10 },
  listBtnSolid:     { backgroundColor: GREEN },
  listBtnGhost:     { backgroundColor: GREEN + '15', borderWidth: 1, borderColor: GREEN + '40' },
  listBtnTxt:       { fontSize: 11, fontWeight: '800', color: '#fff' },
  emptyBox:         { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle:       { fontSize: 16, fontWeight: '700', color: Colors.black },
  emptySub:         { fontSize: 13, color: Colors.gray, textAlign: 'center', maxWidth: 260 },
});