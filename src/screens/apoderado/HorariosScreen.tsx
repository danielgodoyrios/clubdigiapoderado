import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { Schedule } from '../../api';

const BLUE = Colors.blue;

const DAY_NAMES: Record<number, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
  4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo',
};

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  training: { label: 'Entrenamiento', color: BLUE,         icon: 'basketball-outline' },
  match:    { label: 'Partido',       color: Colors.red,   icon: 'trophy-outline'     },
  practice: { label: 'Práctica',     color: Colors.green, icon: 'body-outline'       },
  other:    { label: 'Actividad',    color: Colors.amber, icon: 'star-outline'       },
};

type ScheduleEntry = {
  id: string;
  day_of_week: number;   // 0=Dom, 1=Lun, ..., 6=Sáb
  time_start: string;    // "18:00"
  time_end:   string;    // "20:00"
  type:       string;
  venue:      string;
  notes?:     string;
};

function groupByDay(entries: ScheduleEntry[]): Map<number, ScheduleEntry[]> {
  const map = new Map<number, ScheduleEntry[]>();
  const order = [1, 2, 3, 4, 5, 6, 0];
  order.forEach(d => map.set(d, []));
  entries.forEach(e => {
    const list = map.get(e.day_of_week) ?? [];
    list.push(e);
    map.set(e.day_of_week, list);
  });
  return map;
}

function isToday(dayOfWeek: number): boolean {
  return new Date().getDay() === dayOfWeek;
}

export default function HorariosScreen({ navigation }: any) {
  const { state } = useAuth();
  const pupil    = state.status === 'authenticated' ? state.activePupil : null;
  const clubId   = state.status === 'authenticated' ? state.user?.club_id : undefined;

  const [schedule,   setSchedule]   = useState<ScheduleEntry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!clubId) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await Schedule.list(clubId, pupil?.category ?? undefined);
      setSchedule(data);
    } catch {
      setError('No se pudo cargar el horario. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [clubId, pupil?.category]);

  const onRefresh = () => { setRefreshing(true); load(true); };
  const grouped   = groupByDay(schedule);
  const activeDays = [...grouped.entries()].filter(([, v]) => v.length > 0);

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={{ backgroundColor: BLUE }}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.ic}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.logo}>
            <Text style={styles.logoI}>CLUB</Text>
            <Text style={styles.logoB}>DIGI</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.headerTitle}>
          <Text style={styles.pageTitle}>Horarios</Text>
          <Text style={styles.pageSub}>
            {pupil?.category ? `Categoría ${pupil.category}` : 'Programación de entrenamientos'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BLUE} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="wifi-outline" size={48} color={Colors.light} />
          <Text style={styles.errorTxt}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryTxt}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
        >
          {/* Aviso informativo */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={16} color={BLUE} />
            <Text style={styles.infoTxt}>
              Horarios regulares de la temporada. Los comunicados del club informarán cambios o suspensiones.
            </Text>
          </View>

          {activeDays.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="calendar-outline" size={52} color={Colors.light} />
              <Text style={styles.emptyTitle}>Sin horarios publicados</Text>
              <Text style={styles.emptyTxt}>
                El club aún no ha publicado el horario de esta temporada.{'\n'}Revisa los comunicados para más información.
              </Text>
            </View>
          ) : (
            <>
              {activeDays.map(([day, entries]) => (
                <View key={day} style={styles.dayBlock}>
                  <View style={styles.dayHeader}>
                    <Text style={[styles.dayName, isToday(day) && styles.dayNameToday]}>
                      {DAY_NAMES[day]}
                    </Text>
                    {isToday(day) && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayTxt}>HOY</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.card}>
                    {entries.sort((a, b) => a.time_start.localeCompare(b.time_start)).map((e, i) => {
                      const cfg = TYPE_CONFIG[e.type] ?? TYPE_CONFIG.other;
                      return (
                        <View key={e.id} style={[styles.row, i > 0 && styles.rowBorder]}>
                          <View style={[styles.typeTag, { borderLeftColor: cfg.color }]}>
                            <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.rowType}>{cfg.label}</Text>
                            <View style={styles.rowMeta}>
                              <Ionicons name="time-outline" size={11} color={Colors.gray} />
                              <Text style={styles.rowMetaTxt}>
                                {e.time_start} – {e.time_end}
                              </Text>
                            </View>
                            <View style={styles.rowMeta}>
                              <Ionicons name="location-outline" size={11} color={Colors.gray} />
                              <Text style={styles.rowMetaTxt}>{e.venue}</Text>
                            </View>
                            {!!e.notes && (
                              <Text style={styles.rowNotes}>{e.notes}</Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Leyenda */}
          {activeDays.length > 0 && (
            <View style={styles.legend}>
              {Object.values(TYPE_CONFIG).slice(0, 3).map(c => (
                <View key={c.label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                  <Text style={styles.legendTxt}>{c.label}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.surf },
  topRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  logo:          { flexDirection: 'row', alignItems: 'baseline' },
  logoI:         { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:         { fontSize: 14, fontWeight: '800', color: '#fff' },
  ic:            { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 16 },
  pageTitle:     { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  pageSub:       { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  body:          { flex: 1 },
  infoCard:      { flexDirection: 'row', gap: 8, backgroundColor: BLUE + '10', borderRadius: 12, margin: 14, padding: 12, alignItems: 'flex-start' },
  infoTxt:       { flex: 1, fontSize: 11, color: Colors.dark, lineHeight: 17 },
  emptyWrap:     { alignItems: 'center', padding: 48 },
  emptyTitle:    { fontSize: 16, fontWeight: '700', color: Colors.dark, marginTop: 16, marginBottom: 8 },
  emptyTxt:      { fontSize: 13, color: Colors.gray, textAlign: 'center', lineHeight: 20 },
  errorTxt:      { fontSize: 13, color: Colors.dark, textAlign: 'center', marginTop: 12 },
  retryBtn:      { marginTop: 16, backgroundColor: BLUE, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryTxt:      { color: '#fff', fontWeight: '700', fontSize: 13 },
  dayBlock:      { paddingHorizontal: 14, marginBottom: 14 },
  dayHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  dayName:       { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, color: Colors.gray, textTransform: 'uppercase' },
  dayNameToday:  { color: BLUE },
  todayBadge:    { backgroundColor: BLUE, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  todayTxt:      { fontSize: 8, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  card:          { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.light, overflow: 'hidden' },
  row:           { flexDirection: 'row', alignItems: 'flex-start', padding: 13, gap: 10 },
  rowBorder:     { borderTopWidth: 1, borderTopColor: Colors.surf },
  typeTag:       { width: 32, alignItems: 'center', paddingTop: 2, borderLeftWidth: 3, borderLeftColor: BLUE, paddingLeft: 4 },
  rowType:       { fontSize: 13, fontWeight: '700', color: Colors.black, marginBottom: 4 },
  rowMeta:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rowMetaTxt:    { fontSize: 11, color: Colors.gray },
  rowNotes:      { fontSize: 10, color: Colors.gray, marginTop: 4, fontStyle: 'italic' },
  legend:        { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 4, marginBottom: 8 },
  legendItem:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:     { width: 8, height: 8, borderRadius: 4 },
  legendTxt:     { fontSize: 10, color: Colors.gray },
});
