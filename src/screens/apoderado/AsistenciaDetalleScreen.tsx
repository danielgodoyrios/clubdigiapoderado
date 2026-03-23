import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

const BLUE = Colors.blue;

const SESSIONS = [
  { date: '2026-03-24', day: 'Mar',  type: 'training', present: true  },
  { date: '2026-03-22', day: 'Dom',  type: 'match',    present: true  },
  { date: '2026-03-19', day: 'Jue',  type: 'training', present: false },
  { date: '2026-03-17', day: 'Mar',  type: 'training', present: true  },
  { date: '2026-03-15', day: 'Dom',  type: 'match',    present: true  },
  { date: '2026-03-12', day: 'Jue',  type: 'training', present: true  },
  { date: '2026-03-10', day: 'Mar',  type: 'training', present: true  },
  { date: '2026-03-08', day: 'Dom',  type: 'match',    present: true  },
  { date: '2026-03-05', day: 'Jue',  type: 'training', present: true  },
  { date: '2026-03-03', day: 'Mar',  type: 'training', present: true  },
  { date: '2026-03-01', day: 'Dom',  type: 'match',    present: true  },
  { date: '2026-02-26', day: 'Jue',  type: 'training', present: true  },
];

export default function AsistenciaDetalleScreen({ navigation, route }: any) {
  const { month } = route.params ?? { month: { month: 'Marzo 2026', sessions: 12, present: 11, absent: 1, pct: 92 } };

  const present = SESSIONS.filter(s => s.present).length;
  const absent  = SESSIONS.filter(s => !s.present).length;

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
          <Text style={styles.pageTitle}>{month.month}</Text>
          <Text style={styles.pageSub}>Carlos Muñoz Jr.</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Presentes', value: present, color: Colors.ok },
            { label: 'Ausencias', value: absent,  color: Colors.red },
            { label: '% Mes',     value: `${month.pct}%`, color: '#fff' },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Bar */}
        <View style={styles.bigBarTrack}>
          <View style={[styles.bigBarFill, { width: `${month.pct}%` as any }]} />
        </View>
      </View>

      {/* ── Session list ── */}
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLbl}>SESIONES</Text>
        {SESSIONS.map((s, i) => (
          <View key={i} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: s.present ? Colors.ok : Colors.red }]} />
            <View style={styles.dateBox}>
              <Text style={styles.dateNum}>{s.date.slice(8, 10)}</Text>
              <Text style={styles.datDay}>{s.day}</Text>
            </View>
            <View style={[styles.typeTag, { backgroundColor: s.type === 'match' ? BLUE + '15' : Colors.ok + '15' }]}>
              <Text style={[styles.typeTxt, { color: s.type === 'match' ? BLUE : Colors.green }]}>
                {s.type === 'match' ? 'PARTIDO' : 'ENTRENAMIENTO'}
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            <View style={[styles.statusPill, { backgroundColor: s.present ? Colors.ok + '18' : Colors.red + '18' }]}>
              <Ionicons name={s.present ? 'checkmark' : 'close'} size={12} color={s.present ? Colors.ok : Colors.red} />
              <Text style={[styles.statusTxt, { color: s.present ? Colors.ok : Colors.red }]}>
                {s.present ? 'Presente' : 'Ausente'}
              </Text>
            </View>
          </View>
        ))}
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
  pageSub:     { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
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
