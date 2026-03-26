import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Justificativos } from '../../api';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue;

export default function JustificativoScreen({ navigation, route }: any) {
  const { date } = route.params ?? {};
  const { state } = useAuth();
  const pupilId = state.status === 'authenticated' ? state.activePupil?.id : undefined;

  const [reason,  setReason]  = useState('');
  const [loading, setLoading] = useState(false);

  const dateLabel = date
    ? `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`
    : 'Fecha no especificada';

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Campo requerido', 'Por favor escribe un motivo para la justificación.');
      return;
    }
    if (!pupilId || !date) {
      Alert.alert('Error', 'Datos insuficientes para enviar la justificación.');
      return;
    }
    setLoading(true);
    try {
      await Justificativos.submit(pupilId, { date, reason: reason.trim() });
      Alert.alert(
        'Enviado',
        'La justificación fue enviada correctamente y está pendiente de revisión.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err: any) {
      const msg = err?.message ?? 'No se pudo enviar la justificación. Intenta nuevamente.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.pageTitle}>Justificativo</Text>
          <Text style={styles.pageSub}>Ausencia del {dateLabel}</Text>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={BLUE} />
          <Text style={styles.infoTxt}>
            Completa el formulario para justificar la ausencia del {dateLabel}. El encargado revisará tu solicitud.
          </Text>
        </View>

        {/* Date display */}
        <Text style={styles.label}>FECHA DE AUSENCIA</Text>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={16} color={Colors.gray} />
          <Text style={styles.dateVal}>{dateLabel}</Text>
        </View>

        {/* Reason input */}
        <Text style={styles.label}>MOTIVO DE LA AUSENCIA</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Enfermedad, compromiso familiar, viaje..."
          placeholderTextColor={Colors.gray}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={5}
          maxLength={500}
          textAlignVertical="top"
          editable={!loading}
        />
        <Text style={styles.charCount}>{reason.length}/500</Text>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send-outline" size={16} color="#fff" />
              <Text style={styles.btnTxt}>Enviar justificación</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
  pageSub:     { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  body:        { flex: 1, padding: 16 },
  infoCard:    { flexDirection: 'row', gap: 10, backgroundColor: BLUE + '12', borderRadius: 12, padding: 14, marginBottom: 20, alignItems: 'flex-start' },
  infoTxt:     { flex: 1, fontSize: 12, color: Colors.dark, lineHeight: 18 },
  label:       { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Colors.gray, marginBottom: 8, marginTop: 4 },
  dateRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.white, borderRadius: 10, borderWidth: 1, borderColor: Colors.light, padding: 14, marginBottom: 16 },
  dateVal:     { fontSize: 14, fontWeight: '600', color: Colors.black },
  input:       { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.light, padding: 14, fontSize: 14, color: Colors.black, minHeight: 120 },
  charCount:   { fontSize: 10, color: Colors.gray, textAlign: 'right', marginTop: 4, marginBottom: 20 },
  btn:         { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnTxt:      { color: '#fff', fontSize: 15, fontWeight: '700' },
});
