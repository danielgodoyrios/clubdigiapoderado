import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Attendance, AttendanceSession } from '../../api';

const BLUE = Colors.blue;

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function AsistenciaDetalleScreen({ navigation, route }: any) {
  const { pupilId, year, month, monthLabel } = route.params ?? {};
  const monthKey = year && month ? `${year}-${String(month).padStart(2, '0')}` : '';

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!pupilId || !monthKey) { setLoading(false); return; }
    Attendance.detail(pupilId, monthKey)
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pupilId, monthKey]);

  const present  = sessions.filter(s => s.status === 'present').length;
  const absent   = sessions.filter(s => s.status === 'absent').length;
  const total    = sessions.length;
  const pct      = total > 0 ? Math.round(present * 100 / total) : 0;

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
          <Text style={styles.pageTitle}>{monthLabel ?? monthKey}</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Presentes', value: present, color: Colors.ok },
            { label: 'Ausencias', value: absent,  color: Colors.red },
            { label: '% Mes',     value: `${pct}%`, color: '#fff' },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Bar */}
        <View style={styles.bigBarTrack}>
          <View style={[styles.bigBarFill, { width: `${pct}%` as any }]} />
        </View>
      </View>

      {/* ── Session list ── */}
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLbl}>SESIONES</Text>

        {loading ? (
          <ActivityIndicator color={BLUE} style={{ marginTop: 40 }} />
        ) : sessions.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Ionicons name="calendar-outline" size={36} color={Colors.light} />
            <Text style={{ color: Colors.gray, fontSize: 13, marginTop: 10 }}>Sin sesiones registradas</Text>
          </View>
        ) : sessions.map((s, i) => {
          const d   = new Date(s.date + 'T12:00:00');
          const day = DAY_NAMES[d.getDay()];
          const isAbsent = s.status === 'absent';
          return (
            <View key={i} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: isAbsent ? Colors.red : Colors.ok }]} />
              <View style={styles.dateBox}>
                <Text style={styles.dateNum}>{s.date.slice(8, 10)}</Text>
                <Text style={styles.datDay}>{day}</Text>
              </View>
              <View style={[styles.typeTag, { backgroundColor: s.session === 'Partido' ? BLUE + '15' : Colors.ok + '15' }]}>
                <Text style={[styles.typeTxt, { color: s.session === 'Partido' ? BLUE : Colors.green }]}>
                  {s.session.toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }} />
              {isAbsent ? (
                <TouchableOpacity
                  style={[styles.statusPill, { backgroundColor: Colors.red + '18' }]}
                  onPress={() => navigation.navigate('Justificativo', { pupilId, date: s.date })}
                >
                  <Ionicons name="create-outline" size={12} color={Colors.red} />
                  <Text style={[styles.statusTxt, { color: Colors.red }]}>Justificar</Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.statusPill, { backgroundColor: Colors.ok + '18' }]}>
                  <Ionicons name="checkmark" size={12} color={Colors.ok} />
                  <Text style={[styles.statusTxt, { color: Colors.ok }]}>
                    {s.status === 'justified' ? 'Justificado' : 'Presente'}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.surf },
  topRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  logo:        { flexDirection: 'row', alignItems: 'baseline' },
  logoI:       { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:       { fontSize: 14, fontWeight: '800', color: '#fff' },
  ic:          { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 10 },
  pageTitle:   { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  statsRow:    { flexDirection: 'row', paddingHorizontal: 18, gap: 20, marginBottom: 10 },
  statItem:    { alignItems: 'center' },
  statVal:     { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLbl:     { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  bigBarTrack: { height: 4, backgroundColor: 'rgba(0,0,0,0.2)', marginHorizontal: 18, marginBottom: 16, borderRadius: 2, overflow: 'hidden' },
  bigBarFill:  { height: '100%', backgroundColor: Colors.ok, borderRadius: 2 },
  body:        { flex: 1, paddingHorizontal: 14 },
  sectionLbl:  { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Colors.gray, marginTop: 14, marginBottom: 8 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white, borderRadius: 10, borderWidth: 1, borderColor: Colors.light, padding: 12, marginBottom: 7 },
  dot:         { width: 8, height: 8, borderRadius: 4 },
  dateBox:     { alignItems: 'center', minWidth: 30 },
  dateNum:     { fontSize: 15, fontWeight: '800', color: Colors.black },
  datDay:      { fontSize: 9, color: Colors.gray, fontWeight: '600' },
  typeTag:     { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  typeTxt:     { fontSize: 9, fontWeight: '700', letterSpacing: 0.7 },
  statusPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  statusTxt:   { fontSize: 10, fontWeight: '700' },
});
