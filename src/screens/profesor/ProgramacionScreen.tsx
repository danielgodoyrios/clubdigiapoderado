import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Profesor, AgendaItem, ScheduleSlot } from '../../api';

const GREEN = '#0F7D4B';
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

const ITEM_COLOR: Record<string, string> = {
  training:         '#2563EB',
  match_session:    '#DC2626',
  event_session:    '#EA580C',
  match:            '#991B1B',
  club_event:       GREEN,
  pending_schedule: '#D97706',
};

const ITEM_LABEL: Record<string, string> = {
  training:         'ENTREN.',
  match_session:    'PARTIDO',
  event_session:    'EVENTO',
  match:            'PARTIDO',
  club_event:       'CLUB',
  pending_schedule: 'PENDIENTE',
};

type Tab = 'agenda' | 'semanal';

export default function ProgramacionScreen({ navigation }: any) {
  const [tab, setTab] = useState<Tab>('agenda');

  // ── Agenda ──────────────────────────────────────────────────────
  const [agendaItems,      setAgendaItems]      = useState<AgendaItem[]>([]);
  const [agendaLoading,    setAgendaLoading]    = useState(true);
  const [agendaRefreshing, setAgendaRefreshing] = useState(false);
  const [creating,         setCreating]         = useState<string | null>(null);

  const now      = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const todayDow = now.getDay();

  const daysSinceMonday = (todayDow + 6) % 7;
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - daysSinceMonday);
  const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 13);
  const fromStr = weekStart.toISOString().slice(0, 10);
  const toStr   = weekEnd.toISOString().slice(0, 10);

  const loadAgenda = useCallback(async (refresh = false) => {
    if (!refresh) setAgendaLoading(true); else setAgendaRefreshing(true);
    try {
      const items = await Profesor.agenda(fromStr, toStr);
      setAgendaItems(items);
    } catch {
      // silence
    } finally {
      setAgendaLoading(false);
      setAgendaRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAgenda(); }, []);

  // ── Semanal ───────────────────────────────────────────────
  const [slots,         setSlots]         = useState<ScheduleSlot[]>([]);
  const [semanalLoading, setSemanalLoading] = useState(false);
  const [semanalLoaded,  setSemanalLoaded]  = useState(false);

  const loadSemanal = useCallback(async () => {
    setSemanalLoading(true);
    try {
      const s = await Profesor.schedule();
      setSlots(s);
    } catch {
      // silence
    } finally {
      setSemanalLoading(false);
      setSemanalLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (tab === 'semanal' && !semanalLoaded) loadSemanal();
  }, [tab]);

  // ── Actions ──────────────────────────────────────────────────
  const openSession = async (item: AgendaItem, idx: number) => {
    const key = `${item.item_type}-${item.session_id ?? item.schedule_id ?? idx}`;
    setCreating(key);
    try {
      if (item.session_id) {
        navigation.navigate('AsistenciaProfesor', { sessionId: item.session_id, title: item.title });
      } else if (item.schedule_id) {
        const result = await Profesor.createScheduleSession(item.schedule_id, { date: item.date });
        navigation.navigate('AsistenciaProfesor', { sessionId: result.session_id, title: result.title ?? item.title });
      }
    } catch (e: any) {
      Alert.alert('Error', e?.error ?? 'No se pudo abrir la sesión.');
    } finally {
      setCreating(null);
    }
  };

  // ── Group agenda by date ─────────────────────────────────────
  const byDate = new Map<string, AgendaItem[]>();
  agendaItems.forEach(item => {
    const arr = byDate.get(item.date) ?? [];
    arr.push(item);
    byDate.set(item.date, arr);
  });
  const sortedDates = Array.from(byDate.keys()).sort();

  // ── Group semanal by day Mon→Sun ──────────────────────────
  const SEMANAL_ORDER = [1, 2, 3, 4, 5, 6, 0];
  const slotsByDay = new Map<number, ScheduleSlot[]>();
  slots.forEach(s => {
    const arr = slotsByDay.get(s.day_of_week) ?? [];
    arr.push(s);
    slotsByDay.set(s.day_of_week, arr);
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Programación</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['agenda', 'semanal'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnTxt, tab === t && styles.tabBtnTxtActive]}>
              {t === 'agenda' ? 'Agenda' : 'Semanal'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Content area (fills remaining space) ── */}
      <View style={{ flex: 1 }}>

      {/* ── TAB: AGENDA ── */}
      {tab === 'agenda' && (
        agendaLoading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={GREEN} /></View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={agendaRefreshing} onRefresh={() => loadAgenda(true)} tintColor={GREEN} />
            }
          >
            {sortedDates.length === 0 && (
              <View style={styles.emptyBox}>
                <Ionicons name="calendar-outline" size={52} color={Colors.light} />
                <Text style={styles.emptyTitle}>Sin eventos en la agenda</Text>
                <Text style={styles.emptySub}>No hay actividades para las próximas dos semanas.</Text>
              </View>
            )}

            {sortedDates.map(dateStr => {
              const dow      = dayOfWeek(dateStr);
              const isToday  = dateStr === todayStr;
              const dayItems = byDate.get(dateStr)!;
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

                  {dayItems.map((item, idx) => {
                    const color     = ITEM_COLOR[item.item_type] ?? GREEN;
                    const label     = ITEM_LABEL[item.item_type] ?? item.item_type.toUpperCase();
                    const canAct    = item.can_take_attendance || item.item_type === 'pending_schedule';
                    const itemKey   = `${item.item_type}-${item.session_id ?? item.schedule_id ?? idx}`;
                    const isBusy    = creating === itemKey;
                    const isPending = item.item_type === 'pending_schedule';
                    return (
                      <View key={itemKey} style={[styles.eventCard, idx === 0 && { borderTopWidth: 0 }]}>
                        <View style={[styles.eventStrip, { backgroundColor: color }]} />
                        <View style={styles.eventBody}>
                          <View style={styles.eventTopRow}>
                            <View style={[styles.typeChip, { backgroundColor: color + '20' }]}>
                              <Text style={[styles.typeChipTxt, { color }]}>{label}</Text>
                            </View>
                            {item.time && <Text style={styles.eventTime}>{item.time}</Text>}
                            {item.end_time && <Text style={styles.eventTimeSep}>–</Text>}
                            {item.end_time && <Text style={styles.eventTime}>{item.end_time}</Text>}
                          </View>
                          <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
                          {item.subtitle ? (
                            <Text style={styles.eventSub} numberOfLines={1}>{item.subtitle}</Text>
                          ) : null}
                          {item.location ? (
                            <View style={styles.metaRow}>
                              <Ionicons name="location-outline" size={11} color={Colors.gray} />
                              <Text style={styles.metaTxt}>{item.location}</Text>
                            </View>
                          ) : null}
                          {item.team_name ? (
                            <View style={styles.metaRow}>
                              <Ionicons name="shield-outline" size={11} color={Colors.gray} />
                              <Text style={styles.metaTxt}>{item.team_name}</Text>
                            </View>
                          ) : null}
                          {item.attendance_stats ? (
                            <View style={styles.statsRow}>
                              <Ionicons name="checkmark-circle-outline" size={12} color={GREEN} />
                              <Text style={styles.statsTxt}>
                                {item.attendance_stats.present}/{item.attendance_stats.total} presentes
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        {canAct && (
                          <TouchableOpacity
                            style={[
                              styles.listBtn,
                              isPending ? styles.listBtnPending : styles.listBtnSolid,
                              isBusy && { opacity: 0.6 },
                            ]}
                            onPress={() => openSession(item, idx)}
                            disabled={isBusy}
                            activeOpacity={0.8}
                          >
                            {isBusy ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <>
                                <Ionicons
                                  name={isPending ? 'flash-outline' : 'clipboard-outline'}
                                  size={14} color="#fff"
                                />
                                <Text style={styles.listBtnTxt}>{isPending ? 'Iniciar' : 'Lista'}</Text>
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
        )
      )}

      {/* ── TAB: SEMANAL ── */}
      {tab === 'semanal' && (
        semanalLoading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={GREEN} /></View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => { setSemanalLoaded(false); loadSemanal(); }}
                tintColor={GREEN}
              />
            }
          >
            {slots.length === 0 && (
              <View style={styles.emptyBox}>
                <Ionicons name="time-outline" size={52} color={Colors.light} />
                <Text style={styles.emptyTitle}>Sin horario definido</Text>
                <Text style={styles.emptySub}>
                  El club aún no ha configurado la programación semanal.
                </Text>
              </View>
            )}
            {SEMANAL_ORDER.filter(dow => slotsByDay.has(dow)).map(dow => {
              const isToday  = dow === todayDow;
              const daySlots = slotsByDay.get(dow)!;
              return (
                <View key={dow} style={[styles.daySection, isToday && styles.daySectionToday]}>
                  <View style={styles.dayHeader}>
                    <View style={[styles.dayBadge, isToday && styles.dayBadgeToday]}>
                      <Text style={[styles.dayBadgeTxt, isToday && styles.dayBadgeTxtToday]}>
                        {isToday ? 'HOY' : DAY_SHORT[dow]}
                      </Text>
                    </View>
                    <Text style={[styles.dayName, isToday && styles.dayNameToday]}>{DAY_FULL[dow]}</Text>
                  </View>
                  {daySlots.map((slot, idx) => (
                    <View key={slot.id} style={[styles.slotCard, idx === 0 && { borderTopWidth: 0 }]}>
                      <View style={[styles.eventStrip, { backgroundColor: GREEN }]} />
                      <View style={styles.eventBody}>
                        <View style={styles.eventTopRow}>
                          <Text style={styles.eventTime}>{slot.start_time}</Text>
                          {slot.end_time ? <Text style={styles.eventTimeSep}>–</Text> : null}
                          {slot.end_time ? <Text style={styles.eventTime}>{slot.end_time}</Text> : null}
                        </View>
                        <Text style={styles.eventTitle} numberOfLines={1}>{slot.title}</Text>
                        {(slot.location || slot.venue?.name) ? (
                          <View style={styles.metaRow}>
                            <Ionicons name="location-outline" size={11} color={Colors.gray} />
                            <Text style={styles.metaTxt}>{slot.venue?.name ?? slot.location}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </ScrollView>
        )
      )}

      </View>{/* end content area */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.surf },
  header:           { backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:      { flex: 1, fontSize: 16, fontWeight: '800', color: '#fff', textAlign: 'center' },
  tabBar:           { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.light },
  tabBtn:           { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive:     { borderBottomWidth: 2, borderBottomColor: GREEN },
  tabBtnTxt:        { fontSize: 13, fontWeight: '600', color: Colors.gray },
  tabBtnTxtActive:  { color: GREEN, fontWeight: '800' },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent:    { paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
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
  slotCard:         { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.surf, overflow: 'hidden' },
  eventStrip:       { width: 4, alignSelf: 'stretch', minHeight: 60 },
  eventBody:        { flex: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 3 },
  eventTopRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  typeChip:         { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  typeChipTxt:      { fontSize: 9, fontWeight: '800' },
  eventTime:        { fontSize: 11, fontWeight: '700', color: Colors.black },
  eventTimeSep:     { fontSize: 11, color: Colors.gray },
  eventTitle:       { fontSize: 13, fontWeight: '700', color: Colors.black, lineHeight: 17 },
  eventSub:         { fontSize: 11, color: Colors.gray, fontStyle: 'italic' },
  metaRow:          { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt:          { fontSize: 11, color: Colors.gray },
  statsRow:         { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statsTxt:         { fontSize: 11, color: GREEN, fontWeight: '600' },
  listBtn:          { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginRight: 10 },
  listBtnSolid:     { backgroundColor: GREEN },
  listBtnPending:   { backgroundColor: '#D97706' },
  listBtnTxt:       { fontSize: 11, fontWeight: '800', color: '#fff' },
  emptyBox:         { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle:       { fontSize: 16, fontWeight: '700', color: Colors.black },
  emptySub:         { fontSize: 13, color: Colors.gray, textAlign: 'center', maxWidth: 260 },
});
