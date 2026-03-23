import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

const BLUE  = Colors.blue;
const AMBER = Colors.amber;

const PENDING = [
  { id: 'p1', concept: 'Cuota Abril 2026', amount: '$25.000', due: '2026-04-05', status: 'pending' },
];

const HISTORY = [
  { id: 'h1', concept: 'Cuota Marzo 2026',    amount: '$25.000', date: '2026-03-03', status: 'paid' },
  { id: 'h2', concept: 'Cuota Febrero 2026',  amount: '$25.000', date: '2026-02-04', status: 'paid' },
  { id: 'h3', concept: 'Inscripción 2026',    amount: '$60.000', date: '2026-01-10', status: 'paid' },
  { id: 'h4', concept: 'Cuota Enero 2026',    amount: '$25.000', date: '2026-01-05', status: 'paid' },
  { id: 'h5', concept: 'Cuota Diciembre 2025',amount: '$25.000', date: '2025-12-03', status: 'paid' },
];

export default function PagosScreen({ navigation }: any) {
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
          <Text style={styles.pageTitle}>Pagos</Text>
          <Text style={styles.pageSub}>Carlos Muñoz Jr. · Alevín #8</Text>
        </View>

        {/* Status pills */}
        <View style={styles.pillsRow}>
          <View style={styles.pill}>
            <View style={[styles.pillDot, { backgroundColor: AMBER }]} />
            <Text style={styles.pillLbl}>Pendientes</Text>
            <Text style={styles.pillVal}>{PENDING.length}</Text>
          </View>
          <View style={styles.pill}>
            <View style={[styles.pillDot, { backgroundColor: Colors.ok }]} />
            <Text style={styles.pillLbl}>Al día</Text>
            <Text style={styles.pillVal}>{HISTORY.length} pagados</Text>
          </View>
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Pending */}
        {PENDING.length > 0 && (
          <>
            <Text style={styles.sectionLbl}>PENDIENTES</Text>
            {PENDING.map(p => (
              <View key={p.id} style={[styles.card, styles.cardPending]}>
                <View style={styles.cardRow}>
                  <View style={[styles.dotBig, { backgroundColor: AMBER }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.concept}>{p.concept}</Text>
                    <Text style={styles.meta}>Vence {p.due.slice(8,10)}/{p.due.slice(5,7)}/{p.due.slice(0,4)}</Text>
                  </View>
                  <Text style={styles.amount}>{p.amount}</Text>
                </View>
                <TouchableOpacity
                  style={styles.payBtn}
                  onPress={() => navigation.navigate('PagoDetalle', { payment: p })}
                  activeOpacity={0.85}
                >
                  <Ionicons name="card-outline" size={15} color="#fff" />
                  <Text style={styles.payBtnTxt}>Pagar ahora</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* History */}
        <Text style={[styles.sectionLbl, { marginTop: 16 }]}>HISTORIAL</Text>
        <View style={styles.histCard}>
          {HISTORY.map((h, i) => (
            <TouchableOpacity
              key={h.id}
              style={[styles.histRow, i > 0 && styles.histBorder]}
              onPress={() => navigation.navigate('PagoDetalle', { payment: h })}
              activeOpacity={0.7}
            >
              <View style={[styles.dotBig, { backgroundColor: Colors.ok }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.concept}>{h.concept}</Text>
                <Text style={styles.meta}>{h.date.slice(8,10)}/{h.date.slice(5,7)}/{h.date.slice(0,4)}</Text>
              </View>
              <Text style={[styles.amount, { color: Colors.ok }]}>{h.amount}</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.light} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          ))}
        </View>

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
  pillsRow:    { flexDirection: 'row', gap: 6, paddingHorizontal: 18, paddingBottom: 14 },
  pill:        { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  pillDot:     { width: 6, height: 6, borderRadius: 3 },
  pillLbl:     { flex: 1, fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  pillVal:     { fontSize: 9, color: '#fff', fontWeight: '700' },
  body:        { flex: 1, paddingHorizontal: 14 },
  sectionLbl:  { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Colors.gray, marginTop: 14, marginBottom: 8 },
  card:        { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.light, padding: 13, marginBottom: 8 },
  cardPending: { borderColor: AMBER + '55' },
  cardRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  dotBig:      { width: 10, height: 10, borderRadius: 5 },
  concept:     { fontSize: 13, fontWeight: '600', color: Colors.black },
  meta:        { fontSize: 10, color: Colors.gray, marginTop: 2 },
  amount:      { fontSize: 15, fontWeight: '800', color: Colors.black },
  payBtn:      { backgroundColor: BLUE, borderRadius: 10, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  payBtnTxt:   { fontSize: 13, fontWeight: '700', color: '#fff' },
  histCard:    { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.light, overflow: 'hidden' },
  histRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13 },
  histBorder:  { borderTopWidth: 1, borderTopColor: Colors.surf },
});
