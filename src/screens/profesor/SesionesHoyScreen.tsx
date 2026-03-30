import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../theme';
import { Profesor, ProfesorTeam, AsistenciaSession } from '../../api';
import { getCachedSessions, CachedSession } from '../../context/recentSessions';

const GREEN  = '#0F7D4B';
const ORANGE = '#F59E0B';
const DAYS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const TODAY = new Date().toISOString().slice(0, 10);

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

type SessionWithTeam = AsistenciaSession & { team_name: string; team_id: number };

export default function SesionesHoyScreen({ navigation }: any) {
  const [sessions,   setSessions]   = useState<SessionWithTeam[]>([]);
  const [dismissed,  setDismissed]  = useState<Set<number>>(new Set());
  const [tab,        setTab]        = useState<'pending' | 'sent'>('pending');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    try {
      const teams: ProfesorTeam[] = await Profesor.teams();

      // Mostrar sesiones de los últimos 60 días
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 60);
      const cutoffStr = cutoff.toISOString().slice(0, 10);

      const results = await Promise.allSettled(
        teams.map(async (t: ProfesorTeam) => {
          const ss = await Profesor.attendanceSessions(t.id);
          return ss
            .filter(s => s.date >= cutoffStr)
            .map(s => ({ ...s, team_name: t.name, team_id: t.id } as SessionWithTeam));
        })
      );

      const all: SessionWithTeam[] = [];
      const seen = new Set<number>();
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          r.value.forEach(s => { all.push(s); seen.add(s.id); });
        }
      });

      // Merge in-memory cached sessions (from schedule slots, category-scoped, etc.)
      const cached = getCachedSessions();
      cached.forEach((c: CachedSession) => {
        if (!seen.has(c.id) && c.date >= cutoffStr) {
          all.push({
            id:            c.id,
            session_code:  null,
            date:          c.date,
            title:         c.title,
            type:          c.type,
            team_id:       c.team_id ?? 0,
            team_name:     c.team_name,
            submitted:     c.submitted,
            total:         c.total,
            present_count: c.present_count,
            absent_count:  c.absent_count,
            records:       [],
          } as SessionWithTeam);
        }
      });

      // Pending primero, luego por fecha descendente
      all.sort((a, b) => {
        if (a.submitted !== b.submitted) return a.submitted ? 1 : -1;
        return b.date.localeCompare(a.date);
      });

      setSessions(all);
    } catch {
      // fallo silencioso — mostrar vacío
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Reload when screen comes back into focus (e.g. after going back from AsistenciaProfesor)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const archive = (id: number) => {
    Alert.alert('Archivar sesión', '¿Ocultar esta sesión de la lista?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Archivar', style: 'destructive', onPress: () =>
          setDismissed(prev => new Set([...prev, id]))
      },
    ]);
  };

  const visible = sessions.filter(s => !dismissed.has(s.id));
  const pendingList = visible.filter(s => !s.submitted);
  const sentList    = visible.filter(s => s.submitted);
  const tabData     = tab === 'pending' ? pendingList : sentList;

  const renderItem = ({ item: s }: { item: SessionWithTeam }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.82}
      onPress={() => navigation.navigate('AsistenciaProfesor', {
        sessionId: s.id,
        title:     s.title ?? (s.type === 'match' ? 'Partido' : 'Entrenamiento'),
      })}
    >
      {/* Barra lateral de color según estado */}
      <View style={[styles.statusBar, { backgroundColor: s.submitted ? GREEN : ORANGE }]} />

      <View style={{ flex: 1, gap: 2 }}>
        {/* Fecha */}
        <View style={styles.dateRow}>
          <Text style={[styles.dateTxt, s.date === TODAY && { color: GREEN, fontWeight: '800' }]}>
            {fmtDate(s.date)}
          </Text>
          {s.date === TODAY && <View style={styles.todayDot} />}
        </View>

        {/* Título */}
        <Text style={styles.cardTitle} numberOfLines={1}>
          {s.title ?? (s.type === 'match' ? 'Partido' : 'Entrenamiento')}
        </Text>

        {/* Equipo + código */}
        <Text style={styles.cardSub}>{s.team_name}</Text>
        <Text style={styles.cardCode}>{s.session_code ?? `SES-${String(s.id).padStart(6, '0')}`}</Text>

        {/* Stats si ya fue enviada */}
        {s.submitted && s.total > 0 && (
          <Text style={styles.cardStats}>
            {s.present_count} presentes · {s.absent_count} ausentes · {s.total} total
          </Text>
        )}
      </View>

      <View style={styles.cardRight}>
        {/* Badge estado */}
        <View style={[styles.badge, { backgroundColor: s.submitted ? GREEN + '18' : ORANGE + '18' }]}>
          <Text style={[styles.badgeTxt, { color: s.submitted ? GREEN : ORANGE }]}>
            {s.submitted ? 'ENVIADA' : 'PENDIENTE'}
          </Text>
        </View>

        <View style={styles.cardActions}>
          {/* Botón archivar */}
          <TouchableOpacity
            onPress={() => archive(s.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.archiveBtn}
          >
            <Ionicons name="archive-outline" size={16} color={Colors.gray} />
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={16} color={Colors.light} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const pendingCount = pendingList.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Sesiones</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Strip resumen */}
      {!loading && pendingCount > 0 && (
        <View style={styles.pendingStrip}>
          <Ionicons name="alert-circle-outline" size={15} color={ORANGE} />
          <Text style={styles.pendingStripTxt}>
            {pendingCount} sesión{pendingCount !== 1 ? 'es' : ''} pendiente{pendingCount !== 1 ? 's' : ''} de enviar
          </Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'pending' && styles.tabBtnActive]}
          onPress={() => setTab('pending')}
        >
          <Text style={[styles.tabTxt, tab === 'pending' && styles.tabTxtActive]}>
            Pendientes{pendingCount > 0 ? ` (${pendingCount})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'sent' && styles.tabBtnActive]}
          onPress={() => setTab('sent')}
        >
          <Text style={[styles.tabTxt, tab === 'sent' && styles.tabTxtActive]}>
            Enviadas{sentList.length > 0 ? ` (${sentList.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : (
        <FlatList
          data={tabData}
          keyExtractor={s => String(s.id)}
          style={{ flex: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} />}
          contentContainerStyle={{ padding: 14, paddingBottom: Math.max(insets.bottom, 20) }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="clipboard-outline" size={48} color={Colors.light} />
              <Text style={styles.emptyTitle}>
                {tab === 'pending' ? 'Sin sesiones pendientes' : 'Sin sesiones enviadas'}
              </Text>
              <Text style={styles.emptyTxt}>
                {tab === 'pending'
                  ? 'Todas las sesiones recientes han sido enviadas.'
                  : 'Aún no has enviado ninguna asistencia en los últimos 60 días.'}
              </Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.surf },
  header:      { backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  back:        { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#fff' },

  pendingStrip:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ORANGE + '18', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: ORANGE + '30' },
  pendingStripTxt: { fontSize: 12, fontWeight: '700', color: ORANGE },

  tabBar:     { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.light },
  tabBtn:     { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: GREEN },
  tabTxt:     { fontSize: 13, fontWeight: '600', color: Colors.gray },
  tabTxtActive: { color: GREEN, fontWeight: '800' },

  infoStrip:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.light },
  infoTxt:         { flex: 1, fontSize: 11, color: Colors.gray },

  card:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, paddingRight: 12, paddingVertical: 12, gap: 10 },
  statusBar:  { width: 4, alignSelf: 'stretch' },
  dateRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateTxt:    { fontSize: 11, fontWeight: '600', color: Colors.gray },
  todayDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
  cardTitle:  { fontSize: 14, fontWeight: '700', color: Colors.black },
  cardSub:    { fontSize: 12, color: Colors.gray },
  cardStats:  { fontSize: 11, color: GREEN, fontWeight: '600', marginTop: 2 },
  cardCode:   { fontSize: 10, fontWeight: '700', color: Colors.gray, letterSpacing: 0.5 },
  cardRight:  { alignItems: 'flex-end', gap: 8 },
  badge:      { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  badgeTxt:   { fontSize: 9, fontWeight: '800' },
  cardActions:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  archiveBtn: { padding: 2 },

  emptyBox:   { alignItems: 'center', paddingVertical: 70, paddingHorizontal: 32, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.black },
  emptyTxt:   { fontSize: 13, color: Colors.gray, textAlign: 'center', lineHeight: 20 },
});
