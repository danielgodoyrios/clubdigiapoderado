import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../theme';
import { Convocatorias, Convocatoria, ConvocatoriaRespuesta } from '../../api';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue;

const ESTADO_MAP: Record<ConvocatoriaRespuesta, { label: string; color: string; icon: string }> = {
  si:            { label: '¡Asisto!',       color: Colors.green, icon: 'checkmark-circle' },
  no:            { label: 'No asisto',       color: Colors.red,   icon: 'close-circle'    },
  sin_respuesta: { label: 'Sin respuesta',   color: Colors.gray,  icon: 'help-circle-outline' },
};

function isEditable(cv: Convocatoria): boolean {
  return new Date(cv.fecha_limite) > new Date();
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function ConvCard({ item, onResponder }: { item: Convocatoria; onResponder: (id: number, r: 'si' | 'no') => void }) {
  const editable = isEditable(item);
  const estado   = ESTADO_MAP[item.respuesta];

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.evento}>{item.evento}</Text>
          <Text style={styles.fecha}>{fmtDate(item.fecha)}</Text>
          <Text style={styles.limite}>
            Límite: {fmtDate(item.fecha_limite)}
            {!editable && '  · Plazo vencido'}
          </Text>
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: estado.color + '18' }]}>
          <Ionicons name={estado.icon as any} size={14} color={estado.color} />
          <Text style={[styles.estadoTxt, { color: estado.color }]}>{estado.label}</Text>
        </View>
      </View>

      {editable && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.green }]}
            onPress={() => onResponder(item.id, 'si')}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.actionTxt}>Asisto</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.red }]}
            onPress={() => onResponder(item.id, 'no')}
          >
            <Ionicons name="close" size={16} color="#fff" />
            <Text style={styles.actionTxt}>No asisto</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function ConvocatoriasScreen({ navigation }: any) {
  const { state } = useAuth();
  const hijoId   = state.status === 'authenticated' ? state.activePupil?.id ?? 0 : 0;

  const [list, setList]           = useState<Convocatoria[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await Convocatorias.list(hijoId);
      setList(data);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hijoId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleResponder = async (id: number, respuesta: 'si' | 'no') => {
    const cv = list.find(c => c.id === id);
    if (!cv || !isEditable(cv)) {
      Alert.alert('Plazo vencido', 'No puedes modificar esta convocatoria.');
      return;
    }
    try {
      await Convocatorias.responder(id, respuesta);
      setList(prev => prev.map(c => c.id === id ? { ...c, respuesta } : c));
    } catch (err: any) {
      if (err?.status === 403) {
        Alert.alert('Plazo vencido', 'El plazo de respuesta ya expiró.');
      } else {
        Alert.alert('Error', 'No se pudo registrar tu respuesta.');
      }
    }
  };

  const pendientes = list.filter(c => c.respuesta === 'sin_respuesta' && isEditable(c));
  const resto      = list.filter(c => !(c.respuesta === 'sin_respuesta' && isEditable(c)));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.headerRow, { backgroundColor: BLUE }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.ic}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Convocatorias</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={BLUE} />
      ) : (
        <FlatList
          data={[...pendientes, ...resto]}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={BLUE} />}
          ListHeaderComponent={pendientes.length > 0 ? (
            <View style={styles.alertBanner}>
              <Ionicons name="notifications-outline" size={16} color={Colors.amber} />
              <Text style={styles.alertTxt}>{pendientes.length} convocatoria{pendientes.length > 1 ? 's' : ''} pendiente{pendientes.length > 1 ? 's' : ''}</Text>
            </View>
          ) : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={40} color={Colors.gray} />
              <Text style={styles.emptyTxt}>No hay convocatorias disponibles</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ConvCard item={item} onResponder={handleResponder} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.surf },
  headerRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14 },
  ic:           { padding: 6, marginRight: 8 },
  headerTitle:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  alertBanner:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.amber + '18', padding: 10, borderRadius: 10, marginBottom: 12 },
  alertTxt:     { color: Colors.amber, fontWeight: '700', fontSize: 13 },
  card:         { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 1 },
  cardTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  evento:       { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 2 },
  fecha:        { fontSize: 13, color: Colors.mid, marginBottom: 2 },
  limite:       { fontSize: 11, color: Colors.gray },
  estadoBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 4 },
  estadoTxt:    { fontSize: 11, fontWeight: '700' },
  actionRow:    { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 8, paddingVertical: 10 },
  actionTxt:    { color: '#fff', fontSize: 13, fontWeight: '700' },
  empty:        { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTxt:     { color: Colors.gray, fontSize: 14 },
});
