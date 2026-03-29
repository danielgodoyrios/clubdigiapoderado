import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../theme';
import {
  Encuestas, EncuestaResumen, EncuestaDetalle, Pregunta, RespuestaItem,
} from '../../api';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue;

// ─────────────────────────────── Pregunta component ──────────
function PreguntaInput({
  pregunta,
  valor,
  onChange,
}: {
  pregunta: Pregunta;
  valor: string | number | undefined;
  onChange: (v: string | number) => void;
}) {
  if (pregunta.tipo === 'texto_libre') {
    return (
      <TextInput
        style={styles.textInput}
        multiline
        value={valor as string ?? ''}
        onChangeText={onChange}
        placeholder="Tu respuesta..."
        placeholderTextColor={Colors.gray}
      />
    );
  }

  if (pregunta.tipo === 'escala') {
    const escala = [1, 2, 3, 4, 5];
    return (
      <View style={styles.scaleRow}>
        {escala.map(n => (
          <TouchableOpacity
            key={n}
            style={[styles.scaleBtn, valor === n && styles.scaleBtnActive]}
            onPress={() => onChange(n)}
          >
            <Text style={[styles.scaleTxt, valor === n && styles.scaleTxtActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // opcion_multiple
  return (
    <>
      {(pregunta.opciones ?? []).map(op => (
        <TouchableOpacity
          key={op}
          style={styles.optionRow}
          onPress={() => onChange(op)}
        >
          <View style={[styles.radio, valor === op && styles.radioActive]}>
            {valor === op && <View style={styles.radioDot} />}
          </View>
          <Text style={styles.optionTxt}>{op}</Text>
        </TouchableOpacity>
      ))}
    </>
  );
}

// ─────────────────────────────── Detalle / formulario ────────
function DetalleView({
  encuesta,
  onSubmitted,
  onBack,
}: {
  encuesta: EncuestaDetalle;
  onSubmitted: () => void;
  onBack: () => void;
}) {
  const [respuestas, setRespuestas] = useState<Record<number, string | number>>({});
  const [loading, setLoading] = useState(false);

  const setRespuesta = (preguntaId: number, valor: string | number) => {
    setRespuestas(prev => ({ ...prev, [preguntaId]: valor }));
  };

  const handleSubmit = async () => {
    // Validar preguntas requeridas
    const missing = encuesta.preguntas.filter(
      p => p.requerida && respuestas[p.id] === undefined,
    );
    if (missing.length > 0) {
      Alert.alert('Faltan respuestas', `Por favor responde: ${missing.map(p => `"${p.texto}"`).join(', ')}`);
      return;
    }

    if (encuesta.estado === 'cerrada') {
      Alert.alert('Encuesta cerrada', 'Esta encuesta ya no acepta respuestas.');
      return;
    }

    setLoading(true);
    try {
      const items: RespuestaItem[] = Object.entries(respuestas).map(([id, valor]) => ({
        pregunta_id: Number(id),
        valor: valor as string | number,
      }));
      await Encuestas.submit(encuesta.id, items);
      Alert.alert('¡Listo!', 'Tu respuesta fue enviada.', [
        { text: 'OK', onPress: onSubmitted },
      ]);
    } catch (err: any) {
      const msg = err?.message ?? 'No se pudo enviar. Intenta nuevamente.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.surf }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={styles.detalleTitle}>{encuesta.titulo}</Text>
      {encuesta.estado === 'cerrada' && (
        <View style={styles.cerradaBanner}>
          <Ionicons name="lock-closed-outline" size={14} color={Colors.amber} />
          <Text style={styles.cerradaTxt}>Encuesta cerrada</Text>
        </View>
      )}
      {encuesta.preguntas.map((p, idx) => (
        <View key={p.id} style={styles.preguntaCard}>
          <Text style={styles.preguntaTxt}>{idx + 1}. {p.texto}{p.requerida ? ' *' : ''}</Text>
          <PreguntaInput
            pregunta={p}
            valor={respuestas[p.id]}
            onChange={v => setRespuesta(p.id, v)}
          />
        </View>
      ))}

      {encuesta.estado === 'abierta' && (
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitTxt}>Enviar respuestas</Text>
          }
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ─────────────────────────────── Lista de encuestas ──────────
export default function EncuestasScreen({ navigation }: any) {
  const { state } = useAuth();
  const clubId   = state.status === 'authenticated' ? state.user.club_id : 0;
  const hijoId   = state.status === 'authenticated' ? state.activePupil?.id ?? 0 : 0;

  const [list, setList]           = useState<EncuestaResumen[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected]   = useState<EncuestaDetalle | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await Encuestas.list(clubId, hijoId);
      setList(data);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clubId, hijoId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openEncuesta = async (resumen: EncuestaResumen) => {
    setLoadingDetalle(true);
    try {
      const detalle = await Encuestas.get(resumen.id);
      setSelected(detalle);
    } catch {
      Alert.alert('Error', 'No se pudo cargar la encuesta.');
    } finally {
      setLoadingDetalle(false);
    }
  };

  if (selected) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surf }}>
        <View style={[styles.headerRow, { backgroundColor: BLUE }]}>
          <TouchableOpacity onPress={() => setSelected(null)} style={styles.ic}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Encuesta</Text>
        </View>
        <DetalleView
          encuesta={selected}
          onSubmitted={() => { setSelected(null); load(); }}
          onBack={() => setSelected(null)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.headerRow, { backgroundColor: BLUE }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.ic}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Encuestas</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={BLUE} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={BLUE} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={40} color={Colors.gray} />
              <Text style={styles.emptyTxt}>No hay encuestas disponibles</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openEncuesta(item)}>
              <View style={styles.cardRow}>
                <View style={[styles.badge, { backgroundColor: item.estado === 'abierta' ? Colors.ok + '20' : Colors.light }]}>
                  <Text style={[styles.badgeTxt, { color: item.estado === 'abierta' ? Colors.green : Colors.gray }]}>
                    {item.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                  </Text>
                </View>
                {item.respondida && (
                  <Ionicons name="checkmark-circle" size={16} color={Colors.ok} style={{ marginLeft: 6 }} />
                )}
              </View>
              <Text style={styles.cardTitle}>{item.titulo}</Text>
              {item.fecha_cierre && (
                <Text style={styles.cardSub}>
                  Cierre: {new Date(item.fecha_cierre).toLocaleDateString('es-CL')}
                </Text>
              )}
              <Ionicons name="chevron-forward" size={16} color={Colors.gray} style={styles.chevron} />
            </TouchableOpacity>
          )}
        />
      )}

      {loadingDetalle && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={BLUE} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.surf },
  headerRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14 },
  ic:             { padding: 6, marginRight: 8 },
  headerTitle:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  card:           { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 1 },
  cardRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  badge:          { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 },
  badgeTxt:       { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  cardTitle:      { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 2 },
  cardSub:        { fontSize: 12, color: Colors.gray },
  chevron:        { position: 'absolute', right: 14, top: '50%' },
  empty:          { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTxt:       { color: Colors.gray, fontSize: 14 },
  overlay:        { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },

  // Detalle
  detalleTitle:   { fontSize: 18, fontWeight: '800', color: Colors.dark, marginBottom: 12 },
  cerradaBanner:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.amber + '18', padding: 8, borderRadius: 8, marginBottom: 12 },
  cerradaTxt:     { color: Colors.amber, fontSize: 12, fontWeight: '600' },
  preguntaCard:   { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 },
  preguntaTxt:    { fontSize: 14, fontWeight: '600', color: Colors.dark, marginBottom: 10 },
  textInput:      { borderWidth: 1, borderColor: Colors.light, borderRadius: 8, padding: 10, fontSize: 13, color: Colors.dark, minHeight: 70, textAlignVertical: 'top' },
  scaleRow:       { flexDirection: 'row', gap: 8 },
  scaleBtn:       { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.light, alignItems: 'center', justifyContent: 'center' },
  scaleBtnActive: { backgroundColor: BLUE, borderColor: BLUE },
  scaleTxt:       { fontSize: 14, fontWeight: '600', color: Colors.dark },
  scaleTxtActive: { color: '#fff' },
  optionRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  radio:          { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.light, alignItems: 'center', justifyContent: 'center' },
  radioActive:    { borderColor: BLUE },
  radioDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: BLUE },
  optionTxt:      { fontSize: 13, color: Colors.dark },
  submitBtn:      { backgroundColor: BLUE, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  submitTxt:      { color: '#fff', fontSize: 15, fontWeight: '700' },
});
