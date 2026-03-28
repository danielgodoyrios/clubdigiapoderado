import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../theme';
import { Justificativos } from '../../api';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue;

const TIPOS = [
  { id: 'enfermedad', label: 'Enfermedad',  icon: 'thermometer-outline',  valid: true,  desc: 'Requiere certificado médico' },
  { id: 'lesion',     label: 'Lesión',       icon: 'medkit-outline',       valid: true,  desc: 'Requiere informe médico' },
  { id: 'otro',       label: 'Otro motivo',  icon: 'close-circle-outline', valid: false, desc: 'No válido para el club' },
] as const;

type TipoId = 'enfermedad' | 'lesion';

export default function JustificativoScreen({ navigation, route }: any) {
  const { date: routeDate } = route.params ?? {};
  const { state } = useAuth();
  const pupilId = state.status === 'authenticated' ? state.activePupil?.id : undefined;

  const [tipo,    setTipo]    = useState<TipoId | null>(null);
  const [reason,  setReason]  = useState('');
  const [days,    setDays]    = useState('');
  const [file,    setFile]    = useState<{ uri: string; name: string; base64: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Campos de fecha manual (solo cuando no viene de AsistenciaDetalle)
  const today = new Date();
  const [manDay,   setManDay]   = useState(String(today.getDate()).padStart(2, '0'));
  const [manMonth, setManMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'));
  const [manYear,  setManYear]  = useState(String(today.getFullYear()));

  // Fecha efectiva usada al enviar
  const date: string | undefined = routeDate
    ? routeDate
    : (manDay && manMonth && manYear && manDay.length <= 2 && manMonth.length <= 2 && manYear.length === 4)
      ? `${manYear}-${manMonth.padStart(2, '0')}-${manDay.padStart(2, '0')}`
      : undefined;

  const dateLabel = routeDate
    ? `${routeDate.slice(8, 10)}/${routeDate.slice(5, 7)}/${routeDate.slice(0, 4)}`
    : 'Fecha no especificada';

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para adjuntar el certificado.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const ext   = asset.uri.split('.').pop() ?? 'jpg';
      setFile({
        uri:    asset.uri,
        name:   `certificado_${date ?? 'sin_fecha'}.${ext}`,
        base64: asset.base64 ?? '',
      });
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFile({
        uri:    asset.uri,
        name:   `certificado_${date ?? 'sin_fecha'}.jpg`,
        base64: asset.base64 ?? '',
      });
    }
  };

  const showAttachOptions = () => {
    Alert.alert('Adjuntar certificado', 'Elige una opción', [
      { text: 'Tomar foto',       onPress: takePhoto },
      { text: 'Galería',          onPress: pickImage },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    if (!tipo) {
      Alert.alert('Tipo requerido', 'Selecciona el tipo de ausencia.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Campo requerido', 'Describe brevemente el motivo.');
      return;
    }
    if (!days || isNaN(Number(days)) || Number(days) < 1) {
      Alert.alert('Días requeridos', 'Indica los días de licencia médica (mínimo 1).');
      return;
    }
    if (!pupilId || !date) {
      Alert.alert('Error', !date ? 'Ingresa una fecha válida (DD/MM/AAAA).' : 'Datos insuficientes para enviar la justificación.');
      return;
    }
    setLoading(true);
    try {
      await Justificativos.submit(pupilId, {
        date,
        type:        tipo,
        reason:      reason.trim(),
        days:        Number(days),
        file_base64: file?.base64,
        file_name:   file?.name,
      });
      Alert.alert(
        'Enviado',
        'Tu justificativo médico fue enviado y está pendiente de revisión.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err: any) {
      const msg = err?.message ?? 'No se pudo enviar. Intenta nuevamente.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
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

        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={18} color={BLUE} />
          <Text style={styles.infoTxt}>
            <Text style={{ fontWeight: '700' }}>Solo motivos médicos son válidos</Text>{' '}
            para el club. Otros motivos quedan registrados pero no cuentan como justificado.
          </Text>
        </View>

        <Text style={styles.label}>FECHA DE AUSENCIA</Text>
        {routeDate ? (
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.gray} />
            <Text style={styles.dateVal}>{dateLabel}</Text>
          </View>
        ) : (
          <View style={styles.dateInputRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateFieldLabel}>Día</Text>
              <TextInput
                style={styles.dateFieldInput}
                value={manDay}
                onChangeText={v => setManDay(v.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="numeric"
                maxLength={2}
                placeholder="DD"
                placeholderTextColor={Colors.gray}
                editable={!loading}
              />
            </View>
            <Text style={styles.dateSep}>/</Text>
            <View style={styles.dateField}>
              <Text style={styles.dateFieldLabel}>Mes</Text>
              <TextInput
                style={styles.dateFieldInput}
                value={manMonth}
                onChangeText={v => setManMonth(v.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="numeric"
                maxLength={2}
                placeholder="MM"
                placeholderTextColor={Colors.gray}
                editable={!loading}
              />
            </View>
            <Text style={styles.dateSep}>/</Text>
            <View style={[styles.dateField, { flex: 2 }]}>
              <Text style={styles.dateFieldLabel}>Año</Text>
              <TextInput
                style={styles.dateFieldInput}
                value={manYear}
                onChangeText={v => setManYear(v.replace(/[^0-9]/g, '').slice(0, 4))}
                keyboardType="numeric"
                maxLength={4}
                placeholder="AAAA"
                placeholderTextColor={Colors.gray}
                editable={!loading}
              />
            </View>
          </View>
        )}

        <Text style={styles.label}>TIPO DE AUSENCIA</Text>
        <View style={styles.tiposRow}>
          {TIPOS.map(t => {
            const isSelected = tipo === t.id;
            const isDisabled = !t.valid;
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.tipoCard,
                  isSelected && styles.tipoCardSelected,
                  isDisabled && styles.tipoCardDisabled,
                ]}
                onPress={isDisabled ? undefined : () => setTipo(t.id as TipoId)}
                disabled={isDisabled}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={t.icon as any}
                  size={22}
                  color={isDisabled ? Colors.gray : isSelected ? BLUE : Colors.dark}
                />
                <Text style={[styles.tipoLabel, isDisabled && { color: Colors.gray }]}>{t.label}</Text>
                <Text style={[styles.tipoDesc,  isDisabled && { color: Colors.gray }]}>{t.desc}</Text>
                {!t.valid && (
                  <View style={styles.tipoInvalidBadge}>
                    <Text style={styles.tipoInvalidTxt}>No válido</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>DÍAS DE LICENCIA MÉDICA</Text>
        <View style={styles.daysRow}>
          <Ionicons name="time-outline" size={16} color={Colors.gray} />
          <TextInput
            style={styles.daysInput}
            placeholder="Ej: 3"
            placeholderTextColor={Colors.gray}
            value={days}
            onChangeText={v => setDays(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            maxLength={3}
            editable={!loading}
          />
          <Text style={styles.daysSuffix}>día(s)</Text>
        </View>

        <Text style={styles.label}>DESCRIPCIÓN</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe brevemente el motivo médico..."
          placeholderTextColor={Colors.gray}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
          editable={!loading}
        />
        <Text style={styles.charCount}>{reason.length}/500</Text>

        <Text style={styles.label}>CERTIFICADO MÉDICO</Text>
        {file ? (
          <View style={styles.fileCard}>
            <Image source={{ uri: file.uri }} style={styles.fileThumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              <Text style={styles.fileHint}>Toca para cambiar</Text>
            </View>
            <TouchableOpacity onPress={showAttachOptions} style={styles.fileEditBtn}>
              <Ionicons name="create-outline" size={16} color={BLUE} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFile(null)} style={styles.fileEditBtn}>
              <Ionicons name="trash-outline" size={16} color={Colors.red} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.attachBtn} onPress={showAttachOptions} activeOpacity={0.8}>
            <Ionicons name="camera-outline" size={20} color={BLUE} />
            <Text style={styles.attachTxt}>Adjuntar certificado o foto</Text>
            <Text style={styles.attachHint}>(opcional pero recomendado)</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.btn, (loading || !tipo) && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading || !tipo}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send-outline" size={16} color="#fff" />
              <Text style={styles.btnTxt}>Enviar justificativo</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.surf },
  topRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  logo:             { flexDirection: 'row', alignItems: 'baseline' },
  logoI:            { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:            { fontSize: 14, fontWeight: '800', color: '#fff' },
  ic:               { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  headerTitle:      { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 16 },
  pageTitle:        { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  pageSub:          { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  body:             { flex: 1, padding: 16 },
  infoCard:         { flexDirection: 'row', gap: 10, backgroundColor: '#1A3A7C12', borderRadius: 12, padding: 14, marginBottom: 20, alignItems: 'flex-start' },
  infoTxt:          { flex: 1, fontSize: 12, color: '#222', lineHeight: 18 },
  label:            { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: '#888', marginBottom: 8, marginTop: 4 },
  dateRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#eee', padding: 14, marginBottom: 16 },
  dateVal:          { fontSize: 14, fontWeight: '600', color: '#111' },
  dateInputRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#eee', paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, gap: 6 },
  dateField:        { flex: 1, alignItems: 'center' },
  dateFieldLabel:   { fontSize: 9, fontWeight: '700', color: '#888', letterSpacing: 0.8, marginBottom: 2 },
  dateFieldInput:   { fontSize: 16, fontWeight: '700', color: '#111', textAlign: 'center', padding: 0, minWidth: 36 },
  dateSep:          { fontSize: 18, fontWeight: '300', color: '#ccc', marginTop: 12 },
  tiposRow:         { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tipoCard:         { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#eee', padding: 12, alignItems: 'center', gap: 4 },
  tipoCardSelected: { borderColor: '#1A3A7C', backgroundColor: '#1A3A7C08' },
  tipoCardDisabled: { backgroundColor: '#f8f8f8', opacity: 0.6 },
  tipoLabel:        { fontSize: 11, fontWeight: '700', color: '#111', textAlign: 'center' },
  tipoDesc:         { fontSize: 9,  color: '#888', textAlign: 'center', lineHeight: 12 },
  tipoInvalidBadge: { backgroundColor: '#FF000018', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  tipoInvalidTxt:   { fontSize: 8,  color: '#e00', fontWeight: '700' },
  daysRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#eee', padding: 12, marginBottom: 16 },
  daysInput:        { flex: 1, fontSize: 16, fontWeight: '700', color: '#111' },
  daysSuffix:       { fontSize: 13, color: '#888' },
  input:            { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee', padding: 14, fontSize: 14, color: '#111', minHeight: 100 },
  charCount:        { fontSize: 10, color: '#888', textAlign: 'right', marginTop: 4, marginBottom: 20 },
  attachBtn:        { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: '#1A3A7C40', borderStyle: 'dashed', padding: 18, alignItems: 'center', gap: 6, marginBottom: 24 },
  attachTxt:        { fontSize: 13, fontWeight: '600', color: '#1A3A7C' },
  attachHint:       { fontSize: 10, color: '#888' },
  fileCard:         { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, marginBottom: 24 },
  fileThumb:        { width: 52, height: 52, borderRadius: 8, backgroundColor: '#eee' },
  fileName:         { fontSize: 12, fontWeight: '600', color: '#111' },
  fileHint:         { fontSize: 10, color: '#888', marginTop: 2 },
  fileEditBtn:      { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  btn:              { backgroundColor: '#1A3A7C', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  btnTxt:           { color: '#fff', fontSize: 15, fontWeight: '700' },
});
