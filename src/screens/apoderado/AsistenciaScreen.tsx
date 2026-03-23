import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

const BLUE = Colors.blue;

const MONTHS = [
  { month: 'Marzo 2026',    sessions: 12, present: 11, absent: 1,  pct: 92 },
  { month: 'Febrero 2026',  sessions: 10, present:  9, absent: 1,  pct: 90 },
  { month: 'Enero 2026',    sessions:  8, present:  7, absent: 1,  pct: 88 },
  { month: 'Diciembre 2025',sessions: 14, present: 13, absent: 1,  pct: 93 },
  { month: 'Noviembre 2025',sessions: 12, present: 10, absent: 2,  pct: 83 },
];

function dotColor(pct: number) {
  if (pct >= 90) return Colors.ok;
  if (pct >= 75) return Colors.amber;
  return Colors.red;
}

export default function AsistenciaScreen({ navigation }: any) {
  const overall = Math.round(MONTHS.reduce((a, m) => a + m.pct, 0) / MONTHS.length);

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
          <Text style={styles.pageTitle}>Asistencia</Text>
          <Text style={styles.pageSub}>Carlos Muñoz Jr. · Alevín #8</Text>
        </View>

        {/* Summary pills */}
        <View style={styles.pillsRow}>
          {[
            { label: '% General', value: `${overall}%`, dot: dotColor(overall) },
            { label: 'Este mes',  value: `${MONTHS[0].pct}%`, dot: dotColor(MONTHS[0].pct) },
            { label: 'Ausencias', value: `${MONTHS[0].absent}`, dot: Colors.red },
          ].map((p, i) => (
            <View key={i} style={styles.pill}>
              <View style={[styles.pillDot, { backgroundColor: p.dot }]} />
              <Text style={styles.pillLbl}>{p.label}</Text>
              <Text style={styles.pillVal}>{p.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLbl}>HISTORIAL MENSUAL</Text>

        {MONTHS.map((m, i) => (
          <TouchableOpacity
            key={i}
            style={styles.card}
            onPress={() => navigation.navigate('AsistenciaDetalle', { month: m })}
            activeOpacity={0.85}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.dot, { backgroundColor: dotColor(m.pct) }]} />
              <View>
                <Text style={styles.monthName}>{m.month}</Text>
                <Text style={styles.monthSub}>{m.sessions} sesiones · {m.absent} ausencia{m.absent !== 1 ? 's' : ''}</Text>
              </View>
            </View>

            <View style={styles.cardRight}>
              <Text style={[styles.pctTxt, { color: dotColor(m.pct) }]}>{m.pct}%</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${m.pct}%` as any, backgroundColor: dotColor(m.pct) }]} />
              </View>
              <Ionicons name="chevron-forward" size={14} color={Colors.light} />
            </View>
          </TouchableOpacity>
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
  headerTitle: { paddingHorizontal: 18, paddingBottom: 10, paddingTop: 4 },
  pageTitle:   { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  pageSub:     { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  pillsRow:    { flexDirection: 'row', gap: 6, paddingHorizontal: 18, paddingBottom: 14 },
  pill:        { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  pillDot:     { width: 6, height: 6, borderRadius: 3 },
  pillLbl:     { flex: 1, fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  pillVal:     { fontSize: 9, color: '#fff', fontWeight: '700' },
  body:        { flex: 1, paddingHorizontal: 14 },
  sectionLbl:  { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Colors.gray, marginTop: 14, marginBottom: 8 },
  card:        { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.light, flexDirection: 'row', alignItems: 'center', padding: 13, marginBottom: 8 },
  cardLeft:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot:         { width: 10, height: 10, borderRadius: 5 },
  monthName:   { fontSize: 13, fontWeight: '600', color: Colors.black },
  monthSub:    { fontSize: 10, color: Colors.gray, marginTop: 2 },
  cardRight:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pctTxt:      { fontSize: 14, fontWeight: '800', minWidth: 38, textAlign: 'right' },
  barTrack:    { width: 52, height: 4, backgroundColor: Colors.light, borderRadius: 2, overflow: 'hidden' },
  barFill:     { height: '100%', borderRadius: 2 },
});
