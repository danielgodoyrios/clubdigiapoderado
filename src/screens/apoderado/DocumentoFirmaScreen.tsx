import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

const BLUE = Colors.blue;

export default function DocumentoFirmaScreen({ navigation, route }: any) {
  const { doc } = route.params ?? {
    doc: {
      id: 'd1',
      title: 'Autorización torneo regional',
      type: 'authorization',
      status: 'pending_signature',
      date: '2026-03-20',
      due: '2026-04-05',
    },
  };

  const [signed, setSigned] = useState(doc.status === 'signed');
  const pending = doc.status === 'pending_signature' && !signed;

  const handleSign = () => {
    Alert.alert(
      'Confirmar firma',
      `¿Deseas firmar digitalmente "${doc.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Firmar',   style: 'default', onPress: () => setSigned(true) },
      ],
    );
  };

  const DOC_TEXT = `AUTORIZACIÓN DE PARTICIPACIÓN\n\nYo, Carlos Muñoz, en mi calidad de apoderado de Carlos Muñoz Jr., autorizo la participación de mi pupilo en las actividades deportivas organizadas por el C.D. Santo Domingo en el marco del torneo regional, incluyendo el traslado en bus institucional.\n\nMe comprometo a mantener actualizados los datos de contacto y a cumplir con los reglamentos del club y de la liga.\n\nFecha de emisión: 20/03/2026\nVencimiento: 05/04/2026\n\nC.D. Santo Domingo — Liga Regional Valparaíso`;

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
          <Text style={styles.pageTitle}>Documento</Text>
          <Text style={styles.pageSub}>C.D. Santo Domingo</Text>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={[styles.statusCard, { borderColor: (signed || !pending) ? Colors.ok + '40' : Colors.red + '40' }]}>
          <Ionicons
            name={(signed || !pending) ? 'checkmark-circle' : 'alert-circle-outline'}
            size={22}
            color={(signed || !pending) ? Colors.ok : Colors.red}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.docTitle}>{doc.title}</Text>
            <Text style={[styles.statusTxt, { color: (signed || !pending) ? Colors.ok : Colors.red }]}>
              {(signed || !pending) ? 'Firmado digitalmente' : `Firma requerida · vence ${(doc.due ?? '').slice(8,10)}/${(doc.due ?? '').slice(5,7)}`}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.docCard}>
          <Text style={styles.docBody}>{DOC_TEXT}</Text>
        </View>

        {/* Signature area */}
        {(signed || !pending) ? (
          <View style={styles.signedBox}>
            <Ionicons name="checkmark-circle" size={28} color={Colors.ok} />
            <Text style={styles.signedTitle}>Firmado</Text>
            <Text style={styles.signedSub}>Carlos Muñoz · Apoderado</Text>
            <Text style={styles.signedDate}>{new Date().toLocaleDateString('es-CL')}</Text>
          </View>
        ) : (
          <>
            <View style={styles.signArea}>
              <Text style={styles.signAreaTxt}>Zona de firma digital</Text>
              <Ionicons name="pencil-outline" size={18} color={Colors.gray} />
            </View>
            <TouchableOpacity style={styles.signBtn} onPress={handleSign} activeOpacity={0.85}>
              <Ionicons name="pencil-outline" size={17} color="#fff" />
              <Text style={styles.signBtnTxt}>Firmar documento</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 36 }} />
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
  headerTitle: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 16 },
  pageTitle:   { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  pageSub:     { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  body:        { flex: 1, padding: 14 },
  statusCard:  { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1.5, flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, marginBottom: 12 },
  docTitle:    { fontSize: 14, fontWeight: '700', color: Colors.black, marginBottom: 3 },
  statusTxt:   { fontSize: 11, fontWeight: '600' },
  docCard:     { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.light, padding: 16, marginBottom: 14 },
  docBody:     { fontSize: 13, color: Colors.black, lineHeight: 21 },
  signArea:    { backgroundColor: Colors.light, borderRadius: 12, borderWidth: 2, borderColor: Colors.gray, borderStyle: 'dashed', height: 90, alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12, flexDirection: 'row' },
  signAreaTxt: { fontSize: 12, color: Colors.gray },
  signBtn:     { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  signBtnTxt:  { fontSize: 15, fontWeight: '700', color: '#fff' },
  signedBox:   { backgroundColor: Colors.ok + '10', borderRadius: 12, borderWidth: 1, borderColor: Colors.ok + '40', alignItems: 'center', padding: 24, gap: 4 },
  signedTitle: { fontSize: 18, fontWeight: '800', color: Colors.ok },
  signedSub:   { fontSize: 12, color: Colors.gray },
  signedDate:  { fontSize: 11, color: Colors.gray },
});
