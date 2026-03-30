import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, Alert, Modal,
  TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../theme';
import { Profesor, ProfesorTeam, ProfesorMatch } from '../../api';

const GREEN = '#0F7D4B';
const BLUE  = '#1D4ED8';
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAYS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function fmtDate(s: string) {
  const d = new Date(s + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function statusConfig(s: string) {
  if (s === 'played' || s === 'finished') return { label: 'Finalizado', color: GREEN,   bg: '#DCFCE7' };
  if (s === 'cancelled')                  return { label: 'Cancelado',  color: '#6B7280', bg: '#F3F4F6' };
  return                                         { label: 'Próximo',    color: BLUE,    bg: '#EFF6FF' };
}

export default function PartidosEquipoScreen({ navigation, route }: any) {
  const initTeamId: number | undefined = route.params?.teamId;
  const initTeamName: string = route.params?.teamName ?? 'Mi Equipo';
  const insets = useSafeAreaInsets();

  const [teams,      setTeams]      = useState<ProfesorTeam[]>([]);
  const [teamId,     setTeamId]     = useState<number | undefined>(initTeamId);
  const [teamName,   setTeamName]   = useState(initTeamName);
  const [matches,    setMatches]    = useState<ProfesorMatch[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab,        setTab]        = useState<'upcoming' | 'past'>('upcoming');

  // Create match modal state
  const [creating,  setCreating]  = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [cDate,     setCDate]     = useState(new Date().toISOString().slice(0, 10));
  const [cTime,     setCTime]     = useState('15:00');
  const [cRival,    setCRival]    = useState('');
  const [cLocation, setCLocation] = useState('');
  const [cComp,     setCComp]     = useState('');
  const [cIsHome,   setCIsHome]   = useState(true);

  const loadTeams = useCallback(async () => {
    try {
      const ts = await Profesor.teams();
      setTeams(ts);
      if (!initTeamId && ts.length === 1) {
        setTeamId(ts[0].id);
        setTeamName(ts[0].name);
      }
    } catch { /* silent */ }
  }, [initTeamId]);

  const load = useCallback(async (quiet = false) => {
    if (!teamId) { setLoading(false); return; }
    if (!quiet) setLoading(true);
    try {
      const data = await Profesor.teamMatches(teamId);
      setMatches(data);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teamId]);

  useFocusEffect(useCallback(() => {
    if (!initTeamId) loadTeams();
    load();
  }, [load, loadTeams, initTeamId]));

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = useMemo(() => matches.filter(m => m.date >= todayStr).sort((a,b) => a.date.localeCompare(b.date)), [matches, todayStr]);
  const past     = useMemo(() => matches.filter(m => m.date < todayStr).sort((a,b) => b.date.localeCompare(a.date)), [matches, todayStr]);
  const tabData  = tab === 'upcoming' ? upcoming : past;

  const handleCreate = async () => {
    if (!teamId || !cRival.trim() || !cDate) {
      Alert.alert('Datos incompletos', 'Elige fecha y rival mínimo.');
      return;
    }
    setCreating(true);
    try {
      const newMatch = await Profesor.createMatch(teamId, {
        date:      cDate,
        time:      cTime || undefined,
        location:  cLocation.trim() || undefined,
        competition: cComp.trim() || undefined,
        home_team:  cIsHome ? teamName : cRival.trim(),
        away_team:  cIsHome ? cRival.trim() : teamName,
        title: `${cIsHome ? teamName : cRival.trim()} vs ${cIsHome ? cRival.trim() : teamName}`,
      });
      setMatches(prev => [newMatch, ...prev]);
      setShowModal(false);
      // Reset form
      setCRival(''); setCLocation(''); setCComp('');
      setCDate(new Date().toISOString().slice(0, 10)); setCTime('15:00'); setCIsHome(true);
      // Navigate straight to gestion
      navigation.navigate('PartidoGestion', { match: newMatch, teamName });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo crear el partido.');
    } finally {
      setCreating(false);
    }
  };

  // Team picker if no team assigned
  if (!teamId && teams.length > 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Partidos</Text>
          <View style={{ width: 36 }} />
        </View>
        <FlatList
          data={teams}
          keyExtractor={t => String(t.id)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListHeaderComponent={<Text style={styles.pickLabel}>Elige un equipo</Text>}
          renderItem={({ item: t }) => (
            <TouchableOpacity
              style={styles.teamCard}
              onPress={() => { setTeamId(t.id); setTeamName(t.name); }}
            >
              <View style={styles.teamIcon}><Ionicons name="shield-outline" size={20} color={GREEN} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.teamCardName}>{t.name}</Text>
                {t.category && <Text style={styles.teamCardSub}>{t.category}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={15} color={Colors.light} />
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{teamName} — Partidos</Text>
        <TouchableOpacity style={styles.back} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['upcoming', 'past'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnOn]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabTxt, tab === t && styles.tabTxtOn]}>
              {t === 'upcoming' ? `Próximos (${upcoming.length})` : `Pasados (${past.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={GREEN} /></View>
      ) : (
        <FlatList
          data={tabData}
          keyExtractor={m => String(m.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={GREEN} />}
          contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="football-outline" size={48} color={Colors.light} />
              <Text style={styles.emptyTxt}>
                {tab === 'upcoming' ? 'Sin partidos próximos' : 'Sin partidos pasados'}
              </Text>
              {tab === 'upcoming' && (
                <TouchableOpacity style={styles.createBtn} onPress={() => setShowModal(true)}>
                  <Text style={styles.createBtnTxt}>+ Crear partido</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item: m }) => {
            const st = statusConfig(m.status);
            const isHome = m.home_team === teamName;
            return (
              <TouchableOpacity
                style={styles.matchCard}
                onPress={() => navigation.navigate('PartidoGestion', { match: m, teamName })}
                activeOpacity={0.82}
              >
                <View style={[styles.statusBar, { backgroundColor: st.color }]} />
                <View style={{ flex: 1, gap: 4 }}>
                  {/* Match code */}
                  <Text style={styles.matchCode}>ID-{String(m.id).padStart(6, '0')}</Text>
                  {/* Teams */}
                  <Text style={styles.matchTitle} numberOfLines={1}>
                    {m.home_team ?? teamName} vs {m.away_team ?? 'Rival'}
                  </Text>
                  {/* Date + competition */}
                  <View style={styles.matchMeta}>
                    <Ionicons name="calendar-outline" size={12} color={Colors.gray} />
                    <Text style={styles.matchMetaTxt}>{fmtDate(m.date)}{m.time ? ` · ${m.time}` : ''}</Text>
                    {m.competition && <>
                      <Text style={{ color: Colors.light }}>·</Text>
                      <Text style={styles.matchMetaTxt}>{m.competition}</Text>
                    </>}
                  </View>
                  {m.location && (
                    <View style={styles.matchMeta}>
                      <Ionicons name="location-outline" size={12} color={Colors.gray} />
                      <Text style={styles.matchMetaTxt}>{m.location}</Text>
                    </View>
                  )}
                  {/* Convocatoria stats */}
                  <View style={styles.matchMeta}>
                    <Ionicons name="people-outline" size={12} color={Colors.gray} />
                    <Text style={styles.matchMetaTxt}>
                      {m.convocados_count} convocados · {m.confirmed_count} confirmados
                    </Text>
                  </View>
                </View>
                <View style={styles.matchRight}>
                  {m.score ? (
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreTxt}>{m.score}</Text>
                    </View>
                  ) : (
                    <View style={[styles.stBadge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.stBadgeTxt, { color: st.color }]}>{st.label}</Text>
                    </View>
                  )}
                  <View style={[styles.locPill, { backgroundColor: isHome ? GREEN + '18' : BLUE + '18' }]}>
                    <Text style={[styles.locPillTxt, { color: isHome ? GREEN : BLUE }]}>
                      {isHome ? 'Local' : 'Visita'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color={Colors.light} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 20) }]}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.fabTxt}>Crear partido</Text>
      </TouchableOpacity>

      {/* Create match modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <ScrollView style={styles.sheet} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Nuevo partido</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={Colors.gray} />
              </TouchableOpacity>
            </View>

            {/* Local / Visita */}
            <Text style={styles.fieldLabel}>Condición</Text>
            <View style={styles.condRow}>
              <TouchableOpacity
                style={[styles.condBtn, cIsHome && styles.condBtnOn]}
                onPress={() => setCIsHome(true)}
              >
                <Ionicons name="home-outline" size={16} color={cIsHome ? '#fff' : Colors.gray} />
                <Text style={[styles.condTxt, cIsHome && { color: '#fff' }]}>Local</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.condBtn, !cIsHome && { backgroundColor: BLUE, borderColor: BLUE }]}
                onPress={() => setCIsHome(false)}
              >
                <Ionicons name="airplane-outline" size={16} color={!cIsHome ? '#fff' : Colors.gray} />
                <Text style={[styles.condTxt, !cIsHome && { color: '#fff' }]}>Visita</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Rival *</Text>
            <TextInput style={styles.input} value={cRival} onChangeText={setCRival} placeholder="Nombre del equipo rival" />

            <Text style={styles.fieldLabel}>Fecha *</Text>
            <TextInput style={styles.input} value={cDate} onChangeText={setCDate} placeholder="YYYY-MM-DD" keyboardType="numeric" />

            <Text style={styles.fieldLabel}>Hora</Text>
            <TextInput style={styles.input} value={cTime} onChangeText={setCTime} placeholder="HH:MM" keyboardType="numeric" />

            <Text style={styles.fieldLabel}>Lugar</Text>
            <TextInput style={styles.input} value={cLocation} onChangeText={setCLocation} placeholder="Estadio / cancha" />

            <Text style={styles.fieldLabel}>Competencia / Liga</Text>
            <TextInput style={styles.input} value={cComp} onChangeText={setCComp} placeholder="Ej: Liga Regional 2026" />

            <View style={{ height: 16 }} />
            <TouchableOpacity
              style={[styles.createMatchBtn, (!cRival.trim() || !cDate || creating) && { opacity: 0.5 }]}
              onPress={handleCreate}
              disabled={!cRival.trim() || !cDate || creating}
            >
              {creating
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.createMatchBtnTxt}>Crear partido</Text>
              }
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.surf },
  header:   { backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  back:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#fff' },
  center:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  emptyTxt: { fontSize: 14, color: Colors.gray, fontWeight: '600' },

  tabBar:   { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.light },
  tabBtn:   { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnOn: { borderBottomWidth: 2, borderBottomColor: GREEN },
  tabTxt:   { fontSize: 13, fontWeight: '600', color: Colors.gray },
  tabTxtOn: { color: GREEN, fontWeight: '800' },

  pickLabel:    { fontSize: 13, fontWeight: '700', color: Colors.gray, marginBottom: 8 },
  teamCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  teamIcon:     { width: 40, height: 40, borderRadius: 10, backgroundColor: GREEN + '12', alignItems: 'center', justifyContent: 'center' },
  teamCardName: { fontSize: 14, fontWeight: '700', color: Colors.black },
  teamCardSub:  { fontSize: 12, color: Colors.gray },

  matchCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statusBar:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  matchTitle: { fontSize: 14, fontWeight: '700', color: Colors.black },
  matchCode:   { fontSize: 9, fontWeight: '700', color: Colors.gray, letterSpacing: 0.8 },
  matchMeta:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  matchMetaTxt: { fontSize: 12, color: Colors.gray },
  matchRight: { alignItems: 'flex-end', gap: 6 },
  scoreBadge: { backgroundColor: Colors.black, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  scoreTxt:   { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  stBadge:    { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  stBadgeTxt: { fontSize: 10, fontWeight: '800' },
  locPill:    { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  locPillTxt: { fontSize: 10, fontWeight: '700' },

  createBtn:    { marginTop: 12, backgroundColor: GREEN + '18', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  createBtnTxt: { fontSize: 13, fontWeight: '700', color: GREEN },

  fab:    { position: 'absolute', right: 20, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GREEN, borderRadius: 28, paddingHorizontal: 20, paddingVertical: 14, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  fabTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },

  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, maxHeight: '90%' },
  sheetHandle:  { width: 40, height: 4, backgroundColor: Colors.light, borderRadius: 2, alignSelf: 'center', marginVertical: 10 },
  sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  sheetTitle:   { fontSize: 18, fontWeight: '800', color: Colors.black },
  fieldLabel:   { fontSize: 11, fontWeight: '700', color: Colors.gray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 10 },
  input:        { borderWidth: 1, borderColor: Colors.light, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.black, backgroundColor: Colors.surf, marginBottom: 2 },
  condRow:      { flexDirection: 'row', gap: 10 },
  condBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 10, borderWidth: 1.5, borderColor: Colors.light, backgroundColor: Colors.surf },
  condBtnOn:    { backgroundColor: GREEN, borderColor: GREEN },
  condTxt:      { fontSize: 13, fontWeight: '700', color: Colors.gray },
  createMatchBtn:    { backgroundColor: GREEN, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  createMatchBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
