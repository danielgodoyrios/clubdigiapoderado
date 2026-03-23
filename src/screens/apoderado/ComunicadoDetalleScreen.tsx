import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

const BLUE = Colors.blue;

export default function ComunicadoDetalleScreen({ navigation, route }: any) {
  const { message } = route.params ?? {
    message: {
      id: 'm1',
      title: 'Cambio de horario martes',
      preview: 'Estimados apoderados, a partir de la próxima semana el entrenamiento del martes pasa a las 18:30.',
      date: '2026-03-22',
      unread: true,
      category: 'info',
    },
  };

  const CAT_COLOR: Record<string, string> = { info: BLUE, action: Colors.red, admin: Colors.amber };
  const color = CAT_COLOR[message.category] ?? BLUE;

  const fullText = `Estimados apoderados de ${message.category === 'action' ? 'Carlos Muñoz Jr.' : 'C.D. Santo Domingo'}:

${message.preview}

Les informamos que cualquier consulta puede ser enviada directamente al cuerpo técnico a través de este sistema de comunicados o en los entrenamientos.

Saludos cordiales,
Cuerpo Técnico C.D. Santo Domingo`;

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
          <Text style={styles.pageTitle}>Comunicado</Text>
          <Text style={styles.pageSub}>{message.date.slice(8,10)}/{message.date.slice(5,7)}/{message.date.slice(0,4)}</Text>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Category badge */}
        <View style={[styles.catBadge, { backgroundColor: color + '18' }]}>
          <View style={[styles.catDot, { backgroundColor: color }]} />
          <Text style={[styles.catTxt, { color }]}>
            {message.category === 'action' ? 'REQUIERE ACCIÓN' : message.category === 'admin' ? 'ADMINISTRATIVO' : 'INFORMACIÓN'}
          </Text>
        </View>

        <Text style={styles.title}>{message.title}</Text>
        <Text style={styles.sender}>C.D. Santo Domingo · Cuerpo Técnico</Text>

        <View style={styles.divider} />

        <Text style={styles.body_text}>{fullText}</Text>

        {/* Action required */}
        {message.category === 'action' && (
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.85}>
            <Ionicons name="pencil-outline" size={16} color="#fff" />
            <Text style={styles.actionBtnTxt}>Firmar autorización</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.surf },
  topRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  logo:       { flexDirection: 'row', alignItems: 'baseline' },
  logoI:      { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:      { fontSize: 14, fontWeight: '800', color: '#fff' },
  ic:         { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 16 },
  pageTitle:  { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  pageSub:    { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  body:       { flex: 1, padding: 18 },
  catBadge:   { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 12 },
  catDot:     { width: 6, height: 6, borderRadius: 3 },
  catTxt:     { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  title:      { fontSize: 20, fontWeight: '800', color: Colors.black, letterSpacing: -0.3, marginBottom: 6 },
  sender:     { fontSize: 12, color: Colors.gray },
  divider:    { height: 1, backgroundColor: Colors.light, marginVertical: 16 },
  body_text:  { fontSize: 14, color: Colors.black, lineHeight: 22 },
  actionBtn:  { backgroundColor: Colors.blue, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  actionBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
