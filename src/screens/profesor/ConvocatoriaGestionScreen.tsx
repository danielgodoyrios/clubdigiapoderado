import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, ScrollView, Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Profesor, ProfesorEvent, ConvocadoEstado } from '../../api';

const GREEN = '#0F7D4B';

export default function ConvocatoriaGestionScreen({ navigation, route }: any) {
  const event: ProfesorEvent = route.params?.event ?? null;

  const [convocados, setConvocados] = useState<ConvocadoEstado[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!event) return;
    try {
      const data = await Profesor.convocatoria(event.id);
      setConvocados(data);
    } catch {
      setConvocados([]);
    } finally {
      setLoading(false);
    }
  }, [event]);

  useEffect(() => { load(); }, [load]);

  const toggle = (pupilId: number) => {
    setConvocados(prev =>
      prev.map(c => c.pupil_id === pupilId ? { ...c, convocado: !c.convocado } : c)
    );
  };

  const handleSubmit = async () => {
    const ids = convocados.filter(c => c.convocado).map(c => c.pupil_id);
    setSubmitting(true);
    try {
      await Profesor.updateConvocatoria(event.id, ids);
      Alert.alert('¡Listo!', `Convocatoria actualizada (${ids.length} jugadores).`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la convocatoria. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const convocadoCount = convocados.filter(c => c.convocado).length;

  const statusColor = (s: string) => {
    if (s === 'confirmed') return GREEN;
    if (s === 'declined')  return '#EF4444';
    return '#F59E0B';
  };

  const statusLabel = (s: string) => {
    if (s === 'confirmed') return 'Confirmado';
    if (s === 'declined')  return 'Rechazó';
    return 'Pendiente';
  };

  const eventTitle = event
    ? (event.type === 'match' && event.home_team && event.away_team
        ? `${event.home_team} vs ${event.away_team}`
        : event.title)
    : 'Convocatoria';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, paddingHorizontal: 8 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>Convocatoria</Text>
          {event && <Text style={styles.headerSub} numberOfLines={1}>{eventTitle}</Text>}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Info bar */}
      {event && (
        <View style={styles.infoBar}>
          <Ionicons name="calendar-outline" size={14} color={Colors.gray} />
          <Text style={styles.infoTxt}>{event.date}{event.time ? ` · ${event.time}` : ''}</Text>
          {event.location ? (
            <>
              <Ionicons name="location-outline" size={14} color={Colors.gray} style={{ marginLeft: 8 }} />
              <Text style={styles.infoTxt}>{event.location}</Text>
            </>
          ) : null}
        </View>
      )}

      {/* Counter */}
      <View style={styles.counter}>
        <Text style={styles.counterTxt}>
          Convocados: <Text style={{ color: GREEN, fontWeight: '800' }}>{convocadoCount}</Text>
        </Text>
        <Text style={styles.counterHint}>Activa el switch para convocar</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : (
        <FlatList
          data={convocados}
          keyExtractor={c => String(c.pupil_id)}
          contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10 }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={40} color={Colors.light} />
              <Text style={styles.emptyTxt}>Sin jugadores en el equipo</Text>
            </View>
          }
          renderItem={({ item: c }) => (
            <View style={[styles.row, c.convocado && styles.rowActive]}>
              {/* Avatar placeholder */}
              <View style={[styles.avatar, { backgroundColor: c.convocado ? GREEN + '20' : Colors.surf }]}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: c.convocado ? GREEN : Colors.gray }}>
                  {c.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {c.number != null && (
                    <View style={styles.numBadge}>
                      <Text style={styles.numTxt}>#{c.number}</Text>
                    </View>
                  )}
                  <Text style={styles.playerName}>{c.name}</Text>
                </View>
                {c.position && <Text style={styles.playerPos}>{c.position}</Text>}
                {/* Response status chip */}
                {c.convocado && (
                  <View style={[styles.statusChip, { backgroundColor: statusColor(c.status ?? 'pending') + '18' }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor(c.status ?? 'pending') }]} />
                    <Text style={[styles.statusTxt, { color: statusColor(c.status ?? 'pending') }]}>{statusLabel(c.status ?? 'pending')}</Text>
                  </View>
                )}
              </View>

              <Switch
                value={c.convocado}
                onValueChange={() => toggle(c.pupil_id)}
                trackColor={{ false: Colors.light, true: GREEN + '60' }}
                thumbColor={c.convocado ? GREEN : Colors.gray}
              />
            </View>
          )}
        />
      )}

      {/* Submit button */}
      <View style={styles.submitRow}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting || loading}
        >
          {submitting
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.submitTxt}>Guardar Convocatoria ({convocadoCount})</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.surf },
  header:       { backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  back:         { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub:    { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },

  infoBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.light, gap: 4 },
  infoTxt:      { fontSize: 12, color: Colors.gray },

  counter:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.light },
  counterTxt:   { fontSize: 14, fontWeight: '700', color: Colors.black },
  counterHint:  { fontSize: 11, color: Colors.gray },

  row:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  rowActive:    { borderLeftWidth: 3, borderLeftColor: GREEN },
  avatar:       { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  numBadge:     { backgroundColor: Colors.black + 'DD', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 },
  numTxt:       { fontSize: 9, fontWeight: '800', color: '#fff' },
  playerName:   { fontSize: 13, fontWeight: '700', color: Colors.black },
  playerPos:    { fontSize: 11, color: Colors.gray, marginTop: 2 },
  statusChip:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  statusDot:    { width: 5, height: 5, borderRadius: 3 },
  statusTxt:    { fontSize: 10, fontWeight: '700' },

  submitRow:    { padding: 14, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.light },
  submitBtn:    { backgroundColor: GREEN, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitTxt:    { fontSize: 15, fontWeight: '800', color: '#fff' },

  emptyBox:     { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTxt:     { fontSize: 13, color: Colors.gray },
});
