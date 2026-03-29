import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { Horarios, HorarioHijo } from '../../api';

const BLUE = Colors.blue;

const DAY_NAMES: Record<number, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
  4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo',
};

const DAY_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function groupByDia(entries: HorarioHijo[]): Map<string, HorarioHijo[]> {
  const map = new Map<string, HorarioHijo[]>();
  DAY_ORDER.forEach(d => map.set(d, []));
  entries.forEach(e => {
    const list = map.get(e.dia) ?? [];
    list.push(e);
    map.set(e.dia, list);
  });
  return map;
}

function isToday(dia: string): boolean {
  return DAY_NAMES[new Date().getDay()] === dia;
}

export default function HorariosScreen({ navigation }: any) {
  const { state } = useAuth();
  const pupil    = state.status === 'authenticated' ? state.activePupil : null;

  const [schedule,   setSchedule]   = useState<HorarioHijo[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!pupil?.id) { setLoading(false); return; }
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await Horarios.misHorarios(pupil.id);
      setSchedule(data);
    } catch {
      setError('No se pudo cargar el horario. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [pupil?.id]);

  const onRefresh = () => { setRefreshing(true); load(true); };
  const grouped   = groupByDia(schedule);
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
            {pupil?.name ? `${pupil.name}${pupil.category ? ` · ${pupil.category}` : ''}` : 'Programación de entrenamientos'}
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
              {activeDays.map(([dia, entries]) => (
                <View key={dia} style={styles.dayBlock}>
                  <View style={styles.dayHeader}>
                    <Text style={[styles.dayName, isToday(dia) && styles.dayNameToday]}>
                      {dia}
                    </Text>
                    {isToday(dia) && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayTxt}>HOY</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.card}>
                    {entries.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)).map((e, i) => (
                      <View key={e.id} style={[styles.row, i > 0 && styles.rowBorder]}>
                        <View style={styles.typeTag}>
                          <Ionicons name="basketball-outline" size={16} color={BLUE} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.rowType}>{e.categoria}</Text>
                          <View style={styles.rowMeta}>
                            <Ionicons name="time-outline" size={11} color={Colors.gray} />
                            <Text style={styles.rowMetaTxt}>
                              {e.hora_inicio} – {e.hora_fin}
                            </Text>
                          </View>
                          <View style={styles.rowMeta}>
                            <Ionicons name="location-outline" size={11} color={Colors.gray} />
                            <Text style={styles.rowMetaTxt}>{e.lugar}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </>
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
