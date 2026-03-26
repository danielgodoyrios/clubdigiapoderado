import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

const BLUE = Colors.blue;

// QR-like decoration
const QR_SMALL = [1,1,1,0,1,1,1,0,1,0,1,0,1,0,1,1,1];

export default function CarnetEnrolarScreen({ navigation }: any) {
  const [code, setCode] = useState('');
  const [enrolled, setEnrolled] = useState(false);
  const valid = code.trim().length >= 6;

  const handleEnroll = () => {
    if (!valid) return;
    Alert.alert(
      'Confirmar enrolamiento',
      `¿Enrolar a Carlos Muñoz Jr. con el código "${code.trim().toUpperCase()}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Enrolar',  style: 'default', onPress: () => setEnrolled(true) },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
            <Text style={styles.pageTitle}>Enrolar en Liga</Text>
            <Text style={styles.pageSub}>Carlos Muñoz Jr.</Text>
          </View>
        </View>

        <View style={styles.body}>
          {enrolled ? (
            /* ── Success state ── */
            <View style={styles.successWrap}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={52} color={Colors.ok} />
              </View>
              <Text style={styles.successTitle}>¡Enrolado!</Text>
              <Text style={styles.successSub}>Carlos Muñoz Jr. fue enrolado exitosamente con el código {code.trim().toUpperCase()}.</Text>
              <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
                <Text style={styles.doneBtnTxt}>Volver al carnet</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* QR illustration */}
              <View style={styles.qrBox}>
                <View style={styles.qrMini}>
                  {QR_SMALL.map((on, i) => (
                    <View key={i} style={[styles.qrPx, on ? styles.qrPxOn : undefined]} />
                  ))}
                </View>
                <Text style={styles.qrLabel}>Escanea el QR del club</Text>
                <Text style={styles.qrSub}>o ingresa el código manualmente</Text>
              </View>

              {/* Manual code */}
              <Text style={styles.inputLabel}>CÓDIGO DE LIGA</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: LIGA2026"
                placeholderTextColor={Colors.gray}
                value={code}
                onChangeText={t => setCode(t.toUpperCase())}
                autoCapitalize="characters"
                returnKeyType="done"
              />

              <TouchableOpacity
                style={[styles.enrollBtn, !valid && styles.enrollBtnDisabled]}
                onPress={handleEnroll}
                disabled={!valid}
                activeOpacity={0.85}
              >
                <Ionicons name="qr-code-outline" size={17} color="#fff" />
                <Text style={styles.enrollBtnTxt}>Enrolar pupilo</Text>
              </TouchableOpacity>

              <Text style={styles.hint}>
                El código lo entrega el administrador de la liga o está en el flyer del torneo.
              </Text>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.surf },
  topRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  logo:           { flexDirection: 'row', alignItems: 'baseline' },
  logoI:          { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:          { fontSize: 14, fontWeight: '800', color: '#fff' },
  ic:             { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 16 },
  pageTitle:      { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  pageSub:        { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  body:           { flex: 1, padding: 24 },
  qrBox:          { alignItems: 'center', paddingVertical: 28, gap: 8 },
  qrMini:         { width: 80, flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginBottom: 4 },
  qrPx:           { width: 16, height: 16, borderRadius: 2, backgroundColor: Colors.light },
  qrPxOn:         { backgroundColor: BLUE },
  qrLabel:        { fontSize: 14, fontWeight: '700', color: Colors.black },
  qrSub:          { fontSize: 11, color: Colors.gray },
  inputLabel:     { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Colors.gray, marginBottom: 6 },
  input:          { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.light, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, fontWeight: '700', color: Colors.black, letterSpacing: 2, marginBottom: 14 },
  enrollBtn:      { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 },
  enrollBtnDisabled: { opacity: 0.4 },
  enrollBtnTxt:   { fontSize: 15, fontWeight: '700', color: '#fff' },
  hint:           { fontSize: 11, color: Colors.gray, textAlign: 'center', lineHeight: 16 },
  successWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  successIcon:    {},
  successTitle:   { fontSize: 28, fontWeight: '800', color: Colors.black, letterSpacing: -0.5 },
  successSub:     { fontSize: 13, color: Colors.gray, textAlign: 'center', lineHeight: 19 },
  doneBtn:        { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginTop: 8 },
  doneBtnTxt:     { fontSize: 14, fontWeight: '700', color: '#fff' },
});
