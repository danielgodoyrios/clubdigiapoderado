import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

const BLUE  = Colors.blue;
const AMBER = Colors.amber;

export default function PagoDetalleScreen({ navigation, route }: any) {
  const { payment } = route.params ?? {
    payment: { id: 'p1', concept: 'Cuota Abril 2026', amount: '$25.000', due: '2026-04-05', status: 'pending' },
  };
  const isPending = payment.status === 'pending';
  const [paid, setPaid] = useState(false);

  const handlePay = () => {
    Alert.alert(
      'Confirmar pago',
      `¿Pagar ${payment.amount} por "${payment.concept}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Pagar', style: 'default', onPress: () => setPaid(true) },
      ],
    );
  };

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
          <Text style={styles.pageTitle}>Detalle de Pago</Text>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Main card */}
        <View style={styles.mainCard}>
          <View style={[styles.statusBadge, { backgroundColor: (paid || !isPending) ? Colors.ok + '18' : AMBER + '18' }]}>
            <View style={[styles.badgeDot, { backgroundColor: (paid || !isPending) ? Colors.ok : AMBER }]} />
            <Text style={[styles.badgeTxt, { color: (paid || !isPending) ? Colors.green : AMBER }]}>
              {(paid || !isPending) ? 'PAGADO' : 'PENDIENTE'}
            </Text>
          </View>

          <Text style={styles.conceptTxt}>{payment.concept}</Text>
          <Text style={styles.amountTxt}>{payment.amount}</Text>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLbl}>Club</Text>
            <Text style={styles.detailVal}>C.D. Santo Domingo</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLbl}>Pupilo</Text>
            <Text style={styles.detailVal}>Carlos Muñoz Jr.</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLbl}>Categoría</Text>
            <Text style={styles.detailVal}>Alevín · #8</Text>
          </View>
          {isPending && !paid ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLbl}>Vence</Text>
              <Text style={[styles.detailVal, { color: AMBER, fontWeight: '700' }]}>
                {(payment.due ?? '').slice(8,10)}/{(payment.due ?? '').slice(5,7)}/{(payment.due ?? '').slice(0,4)}
              </Text>
            </View>
          ) : (
            <View style={styles.detailRow}>
              <Text style={styles.detailLbl}>Fecha de pago</Text>
              <Text style={styles.detailVal}>
                {(payment.date ?? new Date().toISOString().slice(0,10)).slice(8,10)}/{(payment.date ?? new Date().toISOString().slice(0,10)).slice(5,7)}/{(payment.date ?? new Date().toISOString().slice(0,10)).slice(0,4)}
              </Text>
            </View>
          )}
        </View>

        {/* Receipt */}
        {(!isPending || paid) && (
          <View style={styles.receiptCard}>
            <Ionicons name="receipt-outline" size={20} color={BLUE} />
            <View style={{ flex: 1 }}>
              <Text style={styles.receiptTitle}>Recibo disponible</Text>
              <Text style={styles.receiptSub}>Toca para descargar el comprobante de pago.</Text>
            </View>
            <Ionicons name="download-outline" size={18} color={BLUE} />
          </View>
        )}

        {/* Pay button */}
        {isPending && !paid && (
          <TouchableOpacity style={styles.payBtn} onPress={handlePay} activeOpacity={0.85}>
            <Ionicons name="card-outline" size={18} color="#fff" />
            <Text style={styles.payBtnTxt}>Pagar {payment.amount}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.surf },
  topRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  logo:         { flexDirection: 'row', alignItems: 'baseline' },
  logoI:        { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:        { fontSize: 14, fontWeight: '800', color: '#fff' },
  ic:           { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 16 },
  pageTitle:    { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  body:         { flex: 1, padding: 14 },
  mainCard:     { backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: Colors.light, padding: 18, marginBottom: 12 },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 14 },
  badgeDot:     { width: 7, height: 7, borderRadius: 4 },
  badgeTxt:     { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  conceptTxt:   { fontSize: 17, fontWeight: '700', color: Colors.black, marginBottom: 4 },
  amountTxt:    { fontSize: 32, fontWeight: '800', color: Colors.black, letterSpacing: -0.5, marginBottom: 16 },
  divider:      { height: 1, backgroundColor: Colors.light, marginBottom: 14 },
  detailRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailLbl:    { fontSize: 12, color: Colors.gray },
  detailVal:    { fontSize: 12, fontWeight: '600', color: Colors.black },
  receiptCard:  { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: BLUE + '40', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 12 },
  receiptTitle: { fontSize: 13, fontWeight: '600', color: Colors.black },
  receiptSub:   { fontSize: 10, color: Colors.gray, marginTop: 2 },
  payBtn:       { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  payBtnTxt:    { fontSize: 15, fontWeight: '700', color: '#fff' },
});
