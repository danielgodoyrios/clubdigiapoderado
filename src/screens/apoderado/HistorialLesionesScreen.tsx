import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Justificativos, Justificativo } from '../../api';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue;

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  enfermedad: { label: 'Enfermedad', icon: 'thermometer-outline', color: Colors.amber },
  lesion:     { label: 'Lesión',     icon: 'medkit-outline',       color: Colors.red   },
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Pendiente', color: Colors.amber,  bg: Colors.amber  + '20' },
  approved: { label: 'Aprobado',  color: Colors.green,  bg: Colors.green  + '20' },
  rejected: { label: 'Rechazado', color: Colors.red,    bg: Colors.red    + '20' },
};

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function JustItem({ item }: { item: Justificativo }) {
  const typeInfo   = TYPE_LABELS[item.type]   ?? { label: item.type, icon: 'help-circle-outline', color: Colors.gray };
  const statusInfo = STATUS_LABELS[item.status] ?? { label: item.status, color: Colors.gray, bg: Colors.light };

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '18' }]}>
          <Ionicons name={typeInfo.icon as any} size={18} color={typeInfo.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.typeLabel}>{typeInfo.label}</Text>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.statusTxt, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>
      </View>

      {!!item.days && (
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={13} color={Colors.gray} />
          <Text style={styles.metaTxt}>{item.days} día{item.days !== 1 ? 's' : ''} de licencia</Text>
        </View>
      )}

      {!!item.reason && (
        <Text style={styles.reason} numberOfLines={2}>{item.reason}</Text>
      )}

      {!!item.file_url && (
        <View style={styles.metaRow}>
          <Ionicons name="attach-outline" size={13} color={Colors.blue} />
          <Text style={[styles.metaTxt, { color: Colors.blue }]}>Certificado adjunto</Text>
        </View>
      )}
    </View>
  );
}

export default function HistorialLesionesScreen({ navigation }: any) {
  const { state } = useAuth();
  const pupilId = state.status === 'authenticated' ? state.activePupil?.id : undefined;
  const pupilName = state.status === 'authenticated' ? state.activePupil?.name : '';

  const [items,     setItems]     = useState<Justificativo[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!pupilId) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await Justificativos.list(pupilId);
      // Solo mostrar los de tipo médico
      const medical = data.filter(j => j.type === 'enfermedad' || j.type === 'lesion');
      setItems(medical.sort((a, b) => b.date.localeCompare(a.date)));
    } catch {
      setError('No se pudo cargar el historial. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [pupilId]);

  const onRefresh = () => { setRefreshing(true); load(true); };

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
          <Text style={styles.pageTitle}>Historial médico</Text>
          {!!pupilName && <Text style={styles.pageSub}>{pupilName}</Text>}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BLUE} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.red} />
          <Text style={styles.errorTxt}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryTxt}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => String(i.id)}
          renderItem={({ item }) => <JustItem item={item} />}
          contentContainerStyle={items.length === 0 ? styles.emptyWrap : { padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="medkit-outline" size={48} color={Colors.light} />
              <Text style={styles.emptyTitle}>Sin historial médico</Text>
              <Text style={styles.emptyTxt}>
                Aquí aparecerán las lesiones y enfermedades registradas con justificativo médico.
              </Text>
            </View>
          }
        />
      )}
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
  pageSub:      { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: Colors.dark, marginTop: 16, marginBottom: 8 },
  emptyTxt:     { fontSize: 13, color: Colors.gray, textAlign: 'center', lineHeight: 20 },
  errorTxt:     { fontSize: 13, color: Colors.dark, textAlign: 'center', marginTop: 12 },
  retryBtn:     { marginTop: 16, backgroundColor: BLUE, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryTxt:     { color: '#fff', fontWeight: '700', fontSize: 13 },
  card:         { backgroundColor: Colors.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  typeIcon:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  typeLabel:    { fontSize: 14, fontWeight: '700', color: Colors.dark },
  dateText:     { fontSize: 11, color: Colors.gray, marginTop: 1 },
  statusBadge:  { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusTxt:    { fontSize: 10, fontWeight: '700' },
  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  metaTxt:      { fontSize: 11, color: Colors.gray },
  reason:       { fontSize: 12, color: Colors.mid, marginTop: 6, lineHeight: 18 },
});
