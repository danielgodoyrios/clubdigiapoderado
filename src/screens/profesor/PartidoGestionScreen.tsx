import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, Alert, TextInput, Linking, ScrollView,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Profesor, ProfesorMatch, MatchConvocado } from '../../api';

const GREEN = '#0F7D4B';
const BLUE  = '#1D4ED8';
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAYS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function fmtDate(s: string) {
  const d = new Date(s + 'T00:00:00');
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const STATUS_CONF: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: 'Confirmado', color: GREEN,    bg: '#DCFCE7' },
  pending:   { label: 'Pendiente',  color: '#F59E0B', bg: '#FEF3C7' },
  declined:  { label: 'No va',      color: '#EF4444', bg: '#FEF2F2' },
};

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarTxt, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

export default function PartidoGestionScreen({ navigation, route }: any) {
  const initMatch: ProfesorMatch = route.params?.match;
  const teamName: string = route.params?.teamName ?? 'Mi Equipo';
  const insets = useSafeAreaInsets();

  const [match,     setMatch]     = useState<ProfesorMatch>(initMatch);
  const [players,   setPlayers]   = useState<MatchConvocado[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [sharing,   setSharing]   = useState(false);
  const [search,    setSearch]    = useState('');
  const [homeGoals, setHomeGoals] = useState(initMatch.score?.split(':')[0] ?? '');
  const [awayGoals, setAwayGoals] = useState(initMatch.score?.split(':')[1] ?? '');
  const [savingScore, setSavingScore] = useState(false);

  const load = useCallback(async () => {
    try {
      const { match: m, convocados } = await Profesor.matchDetail(match.id);
      setMatch(m);
      setPlayers(convocados);
    } catch {
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [match.id]);

  useEffect(() => { load(); }, [load]);

  const toggle = (pupilId: number) => {
    setPlayers(prev => prev.map(p =>
      p.pupil_id === pupilId ? { ...p, convocado: !p.convocado } : p
    ));
  };

  const selectAll = () => setPlayers(prev => prev.map(p => ({ ...p, convocado: true })));
  const clearAll  = () => setPlayers(prev => prev.map(p => ({ ...p, convocado: false })));

  const handleSave = async () => {
    const ids = players.filter(p => p.convocado).map(p => p.pupil_id);
    setSaving(true);
    try {
      await Profesor.updateMatchConvocatoria(match.id, ids);
      setMatch(prev => ({ ...prev, convocados_count: ids.length }));
      Alert.alert('¡Listo!', `Convocatoria guardada (${ids.length} jugadores).`);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la convocatoria.');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const link = await Profesor.matchShareLink(match.id);
      // Try WhatsApp deep link first, fall back to system Share
      const opened = await Linking.canOpenURL(link.whatsapp_url);
      if (opened) {
        await Linking.openURL(link.whatsapp_url);
      } else {
        await Share.share({ message: link.message });
      }
    } catch {
      Alert.alert('Error', 'No se pudo obtener el link de compartir.');
    } finally {
      setSharing(false);
    }
  };

  const handleSaveScore = async () => {
    if (homeGoals === '' || awayGoals === '') {
      Alert.alert('Resultado incompleto', 'Ingresa los goles de ambos equipos.');
      return;
    }
    setSavingScore(true);
    try {
      await Profesor.updateMatchResult(match.id, `${homeGoals}:${awayGoals}`);
      setMatch(prev => ({ ...prev, score: `${homeGoals}:${awayGoals}`, status: 'played' }));
      Alert.alert('Resultado guardado', `${match.home_team ?? teamName} ${homeGoals} – ${awayGoals} ${match.away_team ?? 'Rival'}`);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el resultado.');
    } finally {
      setSavingScore(false);
    }
  };

  const convocadoCount = players.filter(p => p.convocado).length;
  const confirmedCount = players.filter(p => p.convocado && p.status === 'confirmed').length;
  const pending        = players.filter(p => p.convocado && p.status !== 'confirmed' && p.status !== 'declined').length;
  const declined       = players.filter(p => p.convocado && p.status === 'declined').length;
  const isPlayed       = match.status === 'played' || match.status === 'finished';
  const homeTeam       = match.home_team ?? teamName;
  const awayTeam       = match.away_team ?? 'Rival';

  const filteredPlayers = search
    ? players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : players;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {homeTeam} vs {awayTeam}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={filteredPlayers}
        keyExtractor={p => String(p.pupil_id)}
        contentContainerStyle={{ paddingBottom: 160 }}
        ListHeaderComponent={() => (
          <View style={{ gap: 12, padding: 14 }}>
            {/* Match info card */}
            <View style={styles.infoCard}>
              <View style={styles.teamsRow}>
                <View style={styles.teamBlock}>
                  <Avatar name={homeTeam} size={44} />
                  <Text style={styles.teamBlockName} numberOfLines={2}>{homeTeam}</Text>
                  <Text style={styles.teamBlockSub}>Local</Text>
                </View>
                <View style={styles.vsBlock}>
                  {isPlayed && match.score ? (
                    <Text style={styles.scoreDisplay}>{match.score.replace(':', ' – ')}</Text>
                  ) : (
                    <Text style={styles.vsTxt}>VS</Text>
                  )}
                  {match.competition && <Text style={styles.compTxt}>{match.competition}</Text>}
                </View>
                <View style={styles.teamBlock}>
                  <Avatar name={awayTeam} size={44} />
                  <Text style={styles.teamBlockName} numberOfLines={2}>{awayTeam}</Text>
                  <Text style={styles.teamBlockSub}>Visita</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={14} color={Colors.gray} />
                <Text style={styles.infoTxt}>{fmtDate(match.date)}{match.time ? ` – ${match.time}` : ''}</Text>
              </View>
              {match.location && (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={14} color={Colors.gray} />
                  <Text style={styles.infoTxt}>{match.location}</Text>
                </View>
              )}
            </View>

            {/* Score entry (for finished/played) */}
            {(isPlayed || true) && (
              <View style={styles.scoreCard}>
                <Text style={styles.sectionLbl}>Resultado</Text>
                <View style={styles.scoreRow}>
                  <View style={styles.scoreTeam}>
                    <Text style={styles.scoreTeamName} numberOfLines={1}>{homeTeam}</Text>
                    <TextInput
                      style={styles.scoreInput}
                      value={homeGoals}
                      onChangeText={v => setHomeGoals(v.replace(/\D/g, '').slice(0, 2))}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="0"
                    />
                  </View>
                  <Text style={styles.scoreDash}>–</Text>
                  <View style={styles.scoreTeam}>
                    <Text style={styles.scoreTeamName} numberOfLines={1}>{awayTeam}</Text>
                    <TextInput
                      style={styles.scoreInput}
                      value={awayGoals}
                      onChangeText={v => setAwayGoals(v.replace(/\D/g, '').slice(0, 2))}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="0"
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.saveScoreBtn, savingScore && { opacity: 0.6 }]}
                    onPress={handleSaveScore}
                    disabled={savingScore}
                  >
                    {savingScore
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Ionicons name="checkmark" size={18} color="#fff" />
                    }
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Convocatoria stats */}
            <View style={styles.statsCard}>
              <Text style={styles.sectionLbl}>Convocatoria · {convocadoCount} jugadores</Text>
              <View style={styles.statsRow}>
                {[
                  { label: 'Confirmados', value: confirmedCount, color: GREEN },
                  { label: 'Pendientes',  value: pending,        color: '#F59E0B' },
                  { label: 'No van',      value: declined,       color: '#EF4444' },
                ].map(s => (
                  <View key={s.label} style={styles.statItem}>
                    <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
                    <Text style={styles.statLbl}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Player list header */}
            <View style={styles.listHeader}>
              <Text style={styles.sectionLbl}>Nómina ({players.length})</Text>
              <View style={styles.listActions}>
                <TouchableOpacity onPress={selectAll}><Text style={styles.linkAction}>Todos</Text></TouchableOpacity>
                <Text style={{ color: Colors.light }}>·</Text>
                <TouchableOpacity onPress={clearAll}><Text style={styles.linkAction}>Ninguno</Text></TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar jugador…"
              placeholderTextColor={Colors.gray}
              clearButtonMode="while-editing"
            />
          </View>
        )}
        renderItem={({ item: p }) => {
          const st = p.status ? STATUS_CONF[p.status] : null;
          return (
            <TouchableOpacity
              style={[styles.playerRow, p.convocado && styles.playerRowOn]}
              onPress={() => toggle(p.pupil_id)}
              activeOpacity={0.75}
            >
              <View style={[styles.checkBox, p.convocado && styles.checkBoxOn]}>
                {p.convocado && <Ionicons name="checkmark" size={15} color="#fff" />}
              </View>
              <Avatar name={p.name} size={38} />
              <View style={{ flex: 1 }}>
                <Text style={styles.playerName}>{p.name}</Text>
                {(p.number || p.position) && (
                  <Text style={styles.playerMeta}>
                    {p.number ? `#${p.number}` : ''}
                    {p.number && p.position ? ' · ' : ''}
                    {p.position ?? ''}
                  </Text>
                )}
              </View>
              {p.convocado && st && (
                <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                  <Text style={[styles.statusBadgeTxt, { color: st.color }]}>{st.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.light, marginHorizontal: 14 }} />}
      />

      {/* Bottom action bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        {loading && <ActivityIndicator size="small" color={GREEN} style={{ marginBottom: 8 }} />}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.savedBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <Ionicons name="save-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnTxt}>Guardar ({convocadoCount})</Text>
                </>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.shareBtn, sharing && { opacity: 0.6 }]}
            onPress={handleShare}
            disabled={sharing}
          >
            {sharing
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                  <Text style={styles.actionBtnTxt}>Compartir</Text>
                </>
            }
          </TouchableOpacity>
        </View>
        {match.session_id && (
          <TouchableOpacity
            style={styles.attendanceBtn}
            onPress={() => navigation.navigate('AsistenciaProfesor', {
              sessionId: match.session_id,
              title: `Asistencia – ${homeTeam} vs ${awayTeam}`,
            })}
          >
            <Ionicons name="clipboard-outline" size={15} color={GREEN} />
            <Text style={styles.attendanceBtnTxt}>Pasar asistencia</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.surf },
  header:     { backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  back:       { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#fff' },

  avatar:     { backgroundColor: Colors.light, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { fontWeight: '800', color: Colors.gray },

  infoCard:   { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  teamsRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamBlock:  { flex: 1, alignItems: 'center', gap: 6 },
  teamBlockName: { fontSize: 13, fontWeight: '700', color: Colors.black, textAlign: 'center' },
  teamBlockSub:  { fontSize: 10, fontWeight: '600', color: Colors.gray },
  vsBlock:    { alignItems: 'center', gap: 4 },
  vsTxt:      { fontSize: 18, fontWeight: '900', color: Colors.gray },
  scoreDisplay: { fontSize: 22, fontWeight: '900', color: Colors.black },
  compTxt:    { fontSize: 10, fontWeight: '700', color: Colors.gray, textAlign: 'center' },
  infoRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoTxt:    { fontSize: 13, color: Colors.gray },

  scoreCard:  { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  scoreRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreTeam:  { flex: 1, alignItems: 'center', gap: 6 },
  scoreTeamName: { fontSize: 11, fontWeight: '700', color: Colors.gray, textAlign: 'center' },
  scoreInput: { borderWidth: 2, borderColor: Colors.light, borderRadius: 10, width: '100%', paddingVertical: 10, fontSize: 26, fontWeight: '900', color: Colors.black, textAlign: 'center' },
  scoreDash:  { fontSize: 22, fontWeight: '700', color: Colors.gray },
  saveScoreBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },

  statsCard:  { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  sectionLbl: { fontSize: 11, fontWeight: '800', color: Colors.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  statsRow:   { flexDirection: 'row', justifyContent: 'space-around' },
  statItem:   { alignItems: 'center', gap: 2 },
  statNum:    { fontSize: 22, fontWeight: '900' },
  statLbl:    { fontSize: 11, fontWeight: '600', color: Colors.gray },

  listHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listActions:  { flexDirection: 'row', gap: 8, alignItems: 'center' },
  linkAction:   { fontSize: 12, fontWeight: '700', color: GREEN },
  searchInput:  { borderWidth: 1, borderColor: Colors.light, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.black, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },

  playerRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12, backgroundColor: '#fff' },
  playerRowOn:  { backgroundColor: GREEN + '06' },
  checkBox:     { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.light, alignItems: 'center', justifyContent: 'center' },
  checkBoxOn:   { backgroundColor: GREEN, borderColor: GREEN },
  playerName:   { fontSize: 14, fontWeight: '700', color: Colors.black },
  playerMeta:   { fontSize: 12, color: Colors.gray, marginTop: 1 },
  statusBadge:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeTxt: { fontSize: 10, fontWeight: '800' },

  bottomBar:  { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.light, padding: 14, gap: 10 },
  actionRow:  { flexDirection: 'row', gap: 10 },
  actionBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 13 },
  savedBtn:   { backgroundColor: GREEN },
  shareBtn:   { backgroundColor: '#25D366' },
  actionBtnTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
  attendanceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: GREEN + '40', backgroundColor: GREEN + '08' },
  attendanceBtnTxt: { fontSize: 13, fontWeight: '700', color: GREEN },
});
