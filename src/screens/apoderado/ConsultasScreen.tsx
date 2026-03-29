import React, { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, RefreshControl,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../theme';
import { Consultas, Consulta } from '../../api';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue;

const ESTADO_COLOR: Record<string, string> = {
  enviado:     Colors.amber,
  leido:       BLUE,
  respondido:  Colors.green,
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ConsultasScreen({ navigation }: any) {
  const { state } = useAuth();
  const clubId = state.status === 'authenticated' ? state.user.club_id : 0;
  const hijoId = state.status === 'authenticated' ? state.activePupil?.id ?? 0 : 0;

  const [historial, setHistorial]   = useState<Consulta[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enviando, setEnviando]     = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const [asunto, setAsunto]     = useState('');
  const [mensaje, setMensaje]   = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await Consultas.historial(clubId);
      setHistorial(data);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clubId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleEnviar = async () => {
    if (!asunto.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el asunto de tu consulta.');
      return;
    }
    if (!mensaje.trim()) {
      Alert.alert('Campo requerido', 'Escribe tu mensaje.');
      return;
    }
    setEnviando(true);
    try {
      await Consultas.enviar(clubId, { asunto: asunto.trim(), mensaje: mensaje.trim(), hijo_id: hijoId });
      setAsunto('');
      setMensaje('');
      setMostrarForm(false);
      await load();
      Alert.alert('Consulta enviada', 'El club recibirá tu consulta y te responderá a la brevedad.');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo enviar la consulta.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.headerRow, { backgroundColor: BLUE }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.ic}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consultas al club</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => setMostrarForm(v => !v)} style={styles.ic}>
          <Ionicons name={mostrarForm ? 'close' : 'add-circle-outline'} size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Formulario nueva consulta */}
      {mostrarForm && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.form}>
            <Text style={styles.formTitle}>Nueva consulta</Text>
            <TextInput
              style={styles.input}
              placeholder="Asunto"
              placeholderTextColor={Colors.gray}
              value={asunto}
              onChangeText={setAsunto}
              maxLength={120}
            />
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Escribe tu mensaje..."
              placeholderTextColor={Colors.gray}
              value={mensaje}
              onChangeText={setMensaje}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={1000}
            />
            <TouchableOpacity style={styles.enviarBtn} onPress={handleEnviar} disabled={enviando}>
              {enviando
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.enviarTxt}>Enviar consulta</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={BLUE} />
      ) : (
        <FlatList
          data={historial}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={BLUE} />}
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>Historial de consultas</Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={40} color={Colors.gray} />
              <Text style={styles.emptyTxt}>Aún no has enviado consultas</Text>
              <Text style={styles.emptySub}>Usa el botón + para enviar tu primera consulta</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.asunto} numberOfLines={1}>{item.asunto}</Text>
                <View style={[styles.estadoBadge, { backgroundColor: (ESTADO_COLOR[item.estado] ?? Colors.gray) + '20' }]}>
                  <Text style={[styles.estadoTxt, { color: ESTADO_COLOR[item.estado] ?? Colors.gray }]}>
                    {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={styles.mensaje} numberOfLines={3}>{item.mensaje}</Text>
              <Text style={styles.fecha}>{fmtDate(item.created_at)}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.surf },
  headerRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14 },
  ic:           { padding: 6 },
  headerTitle:  { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 6 },
  form:         { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.light },
  formTitle:    { fontSize: 14, fontWeight: '700', color: Colors.dark, marginBottom: 10 },
  input:        { borderWidth: 1, borderColor: Colors.light, borderRadius: 8, padding: 10, fontSize: 13, color: Colors.dark, marginBottom: 10 },
  inputMulti:   { minHeight: 80, textAlignVertical: 'top' },
  enviarBtn:    { backgroundColor: BLUE, borderRadius: 10, padding: 14, alignItems: 'center' },
  enviarTxt:    { color: '#fff', fontSize: 14, fontWeight: '700' },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: Colors.gray, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },
  card:         { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1 },
  cardTop:      { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  asunto:       { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.dark },
  estadoBadge:  { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 },
  estadoTxt:    { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  mensaje:      { fontSize: 12, color: Colors.mid, lineHeight: 18, marginBottom: 6 },
  fecha:        { fontSize: 11, color: Colors.gray },
  empty:        { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTxt:     { color: Colors.gray, fontSize: 14 },
  emptySub:     { color: Colors.gray, fontSize: 12 },
});
