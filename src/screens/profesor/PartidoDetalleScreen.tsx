import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Profesor, AgendaItem, ConvocadoEstado } from '../../api';

const RED    = '#991B1B';
const RED_BG = '#FEF2F2';
const GREEN  = '#0F7D4B';
const BLUE   = '#1D4ED8';

const MONTHS   = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAY_FULL = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAY_FULL[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function parseScore(score: string | null) {
  if (!score) return { home: '', away: '' };
  const parts = score.split(':');
  return { home: parts[0] ?? '', away: parts[1] ?? '' };
}

function statusConfig(s: string) {
  if (s === 'played' || s === 'finished') return { label: 'Finalizado', color: GREEN, bg: '#DCFCE7' };
  if (s === 'scheduled')                  return { label: 'Programado', color: BLUE,  bg: '#EFF6FF' };
  if (s === 'pending')                    return { label: 'Pendiente',  color: '#92400E', bg: '#FEF3C7' };
  return                                         { label: 'Próximo',    color: '#6B7280', bg: '#F3F4F6' };
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={15} color={Colors.gray} />
      <Text style={styles.infoTxt}>{text}</Text>
    </View>
  );
}

export default function PartidoDetalleScreen({ route, navigation }: any) {
  const item: AgendaItem = route.params?.item;
  const initial = parseScore(item?.score ?? null);

  const [homeGoals,      setHomeGoals]      = useState(initial.home);
  const [awayGoals,      setAwayGoals]      = useState(initial.away);
  const [saving,         setSaving]         = useState(false);
  const [openingSession, setOpeningSession] = useState(false);
  const [savedScore,     setSavedScore]     = useState<string | null>(item?.score ?? null);
  const [roster,         setRoster]         = useState<ConvocadoEstado[]>([]);
  const [rosterLoading,  setRosterLoading]  = useState(false);

  useEffect(() => {
    const eventId = item?.club_event_id;
    if (!eventId) return;
    setRosterLoading(true);
    Profesor.convocatoria(eventId)
      .then(setRoster)
      .catch(() => {})
      .finally(() => setRosterLoading(false));
  }, []);

  const titleParts = item?.title?.split(/\s+vs\.?\s+/i) ?? [];
  const homeTeam = titleParts[0]?.trim() || item?.team_name || 'Local';
  const awayTeam = titleParts[1]?.trim() || 'Visita';

  const status = statusConfig(item?.status ?? '');

  const convocados = roster.filter(p => p.convocado);
  const confirmed  = convocados.filter(p => p.status === 'confirmed');
  const pending    = convocados.filter(p => p.status === 'pending' || (!p.status && p.status !== 'declined'));
  const declined   = convocados.filter(p => p.status === 'declined');

  /* ── Guardar resultado ── */
  const handleSave = async () => {
    if (homeGoals === '' || awayGoals === '') {
      Alert.alert('Resultado incompleto', 'Ingresa los goles de ambos equipos.');
      return;
    }
    if (!item?.match_id && !item?.session_id) {
      Alert.alert('Sin partido', 'Este evento no tiene un partido asociado.');
      return;
    }
    setSaving(true);
    try {
      const score = `${homeGoals}:${awayGoals}`;
      if (item.match_id) {
        await Profesor.updateMatchResult(item.match_id, score);
      }
      setSavedScore(score);
      Alert.alert('¡Guardado!', `${homeTeam} ${homeGoals} – ${awayGoals} ${awayTeam}`);
    } catch (e: any) {
      Alert.alert('Error', e?.error ?? 'No se pudo guardar el resultado.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Abrir asistencia ── */
  const openAttendance = async () => {
    if (item.session_id) {
      navigation.navigate('AsistenciaProfesor', { sessionId: item.session_id, title: item.title });
      return;
    }
    if (!item.team_id) {
      Alert.alert('Sin equipo', 'Este partido no tiene un equipo asignado.');
      return;
    }
    setOpeningSession(true);
    try {
      const session = await Profesor.createAttendanceSession(item.team_id, {
        date:     item.date,
        type:     'match',
        title:    item.title,
        match_id: item.match_id ?? undefined,
      });
      navigation.navigate('AsistenciaProfesor', {
        sessionId: session.id,
        title:     session.title ?? item.title,
      });
    } catch (e: any) {
      Alert.alert('Error', e?.error ?? 'No se pudo abrir la sesión de asistencia.');
    } finally {
      setOpeningSession(false);
    }
  };

  const headerTitle = item?.title && item.title.length > 28
    ? item.title.slice(0, 26) + '…'
    : (item?.title ?? 'Partido');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Hero card ── */}
          <View style={styles.heroCard}>
            {/* Status + date */}
            <View style={styles.heroTopRow}>
              <View style={[styles.statusChip, { backgroundColor: status.bg }]}>
                <Text style={[styles.statusTxt, { color: status.color }]}>{status.label}</Text>
              </View>
              <Text style={styles.heroDate}>
                {fmtDate(item.date)}{item.time ? ` · ${item.time}` : ''}
              </Text>
            </View>

            {/* Scoreboard */}
            <View style={styles.scoreboard}>
              <View style={styles.teamBlock}>
                <View style={[styles.teamShield, { borderColor: RED, backgroundColor: RED_BG }]}>
                  <Ionicons name="shield" size={28} color={RED} />
                </View>
                <Text style={styles.teamName} numberOfLines={3}>{homeTeam}</Text>
                <View style={[styles.localBadge, { backgroundColor: RED_BG }]}>
                  <Text style={[styles.localTxt, { color: RED }]}>LOCAL</Text>
                </View>
              </View>

              <View style={styles.scoreCenter}>
                {savedScore ? (
                  <>
                    <Text style={styles.scoreNum}>{savedScore.split(':')[0]}</Text>
                    <Text style={styles.scoreSep}>–</Text>
                    <Text style={styles.scoreNum}>{savedScore.split(':')[1]}</Text>
                  </>
                ) : (
                  <Text style={styles.vsText}>VS</Text>
                )}
              </View>

              <View style={styles.teamBlock}>
                <View style={[styles.teamShield, { borderColor: '#9CA3AF', backgroundColor: '#F9FAFB' }]}>
                  <Ionicons name="shield" size={28} color="#9CA3AF" />
                </View>
                <Text style={styles.teamName} numberOfLines={3}>{awayTeam}</Text>
                <View style={[styles.localBadge, { backgroundColor: '#F3F4F6' }]}>
                  <Text style={[styles.localTxt, { color: '#6B7280' }]}>VISITA</Text>
                </View>
              </View>
            </View>

            {/* Location / competition rows inside card */}
            {(item.location || item.subtitle || (item.team_name && item.team_name !== homeTeam)) ? (
              <View style={styles.heroInfo}>
                {item.location ? <InfoRow icon="location-outline" text={item.location} /> : null}
                {item.subtitle ? <InfoRow icon="trophy-outline" text={item.subtitle} /> : null}
                {item.team_name && item.team_name !== homeTeam
                  ? <InfoRow icon="people-outline" text={item.team_name} />
                  : null}
              </View>
            ) : null}
          </View>

          {/* ── Resultado ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="stats-chart" size={16} color={RED} />
              <Text style={styles.sectionTitle}>Resultado del partido</Text>
            </View>
            <Text style={styles.sectionSub}>
              {savedScore
                ? `Marcador actual: ${savedScore.replace(':', ' – ')} — toca para actualizar.`
                : 'Registra el marcador final del partido.'}
            </Text>

            <View style={styles.scoreInputRow}>
              <View style={styles.scoreInputBlock}>
                <Text style={styles.scoreInputTeam} numberOfLines={2}>{homeTeam}</Text>
                <TextInput
                  style={[styles.scoreInput, homeGoals !== '' && styles.scoreInputActive]}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={homeGoals}
                  onChangeText={setHomeGoals}
                  placeholder="0"
                  placeholderTextColor="#D1D5DB"
                />
              </View>
              <View style={styles.scoreDashBlock}>
                <Text style={styles.scoreDash}>–</Text>
              </View>
              <View style={styles.scoreInputBlock}>
                <Text style={styles.scoreInputTeam} numberOfLines={2}>{awayTeam}</Text>
                <TextInput
                  style={[styles.scoreInput, awayGoals !== '' && styles.scoreInputActive]}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={awayGoals}
                  onChangeText={setAwayGoals}
                  placeholder="0"
                  placeholderTextColor="#D1D5DB"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.saveBtnTxt}>
                      {savedScore ? 'Actualizar Resultado' : 'Guardar Resultado'}
                    </Text>
                  </>
              }
            </TouchableOpacity>
          </View>

          {/* ── Nómina ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={16} color={BLUE} />
              <Text style={styles.sectionTitle}>
                {'Nómina'}
                {convocados.length > 0
                  ? <Text style={styles.sectionBadge}> {convocados.length}</Text>
                  : null}
              </Text>
            </View>

            {rosterLoading ? (
              <View style={styles.emptyBox}>
                <ActivityIndicator color={RED} />
                <Text style={styles.emptyTxt}>Cargando nómina…</Text>
              </View>
            ) : convocados.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="people-outline" size={32} color="#D1D5DB" />
                <Text style={styles.emptyTxt}>Sin nómina registrada para este partido</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {confirmed.length > 0 && (
                  <RosterGroup
                    label={`Confirmados · ${confirmed.length}`}
                    color={GREEN}
                    icon="checkmark-circle"
                    players={confirmed}
                  />
                )}
                {pending.length > 0 && (
                  <RosterGroup
                    label={`Pendiente · ${pending.length}`}
                    color="#92400E"
                    icon="time-outline"
                    players={pending}
                  />
                )}
                {declined.length > 0 && (
                  <RosterGroup
                    label={`No asiste · ${declined.length}`}
                    color={RED}
                    icon="close-circle"
                    players={declined}
                  />
                )}
              </View>
            )}
          </View>

          {/* ── Asistencia ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="clipboard" size={16} color={GREEN} />
              <Text style={styles.sectionTitle}>Asistencia</Text>
            </View>

            {item.attendance_stats ? (
              <View style={styles.statsRow}>
                <StatBadge value={item.attendance_stats.present} label="Presentes" color={GREEN} bg="#DCFCE7" />
                <StatBadge value={item.attendance_stats.absent}  label="Ausentes"  color={RED}   bg={RED_BG} />
                <StatBadge value={item.attendance_stats.total}   label="Total"     color={BLUE}  bg="#EFF6FF" />
              </View>
            ) : (
              <Text style={styles.sectionSub}>Aún no hay registros de asistencia para este partido.</Text>
            )}

            <TouchableOpacity
              style={[styles.attendBtn, openingSession && { opacity: 0.6 }]}
              onPress={openAttendance}
              disabled={openingSession}
              activeOpacity={0.8}
            >
              <View style={styles.attendIcon}>
                {openingSession
                  ? <ActivityIndicator size="small" color={GREEN} />
                  : <Ionicons name="clipboard-outline" size={20} color={GREEN} />
                }
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.attendBtnTitle}>
                  {item.session_id ? 'Ver Asistencia' : 'Abrir Sesión de Asistencia'}
                </Text>
                <Text style={styles.attendBtnSub}>
                  {item.session_id
                    ? 'Sesión ya iniciada — ver registros'
                    : 'Crea una sesión y marca asistentes'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={GREEN} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 16 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ── Sub-components ───────────────────────────────────────── */

function RosterGroup({ label, color, icon, players }: {
  label: string; color: string; icon: string; players: ConvocadoEstado[];
}) {
  return (
    <View style={rg.wrap}>
      <View style={rg.header}>
        <Ionicons name={icon as any} size={13} color={color} />
        <Text style={[rg.label, { color }]}>{label}</Text>
      </View>
      {players.map(p => (
        <View key={p.pupil_id} style={rg.row}>
          <View style={[rg.numBadge, { backgroundColor: color + '20' }]}>
            <Text style={[rg.numTxt, { color }]}>{p.number ?? '—'}</Text>
          </View>
          <Text style={rg.name} numberOfLines={1}>{p.name}</Text>
          {p.position ? <Text style={rg.pos}>{p.position}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function StatBadge({ value, label, color, bg }: {
  value: number; label: string; color: string; bg: string;
}) {
  return (
    <View style={[sb.box, { backgroundColor: bg }]}>
      <Text style={[sb.num, { color }]}>{value}</Text>
      <Text style={[sb.lbl, { color }]}>{label}</Text>
    </View>
  );
}

/* ── Styles ───────────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F1F5F9' },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },

  /* Header */
  header:      { backgroundColor: RED, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: '#fff', textAlign: 'center' },

  /* Hero card */
  heroCard:    { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 3, gap: 16 },
  heroTopRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusChip:  { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  statusTxt:   { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  heroDate:    { fontSize: 12, color: Colors.gray, fontWeight: '500' },

  scoreboard:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamBlock:   { flex: 1, alignItems: 'center', gap: 8 },
  teamShield:  { width: 60, height: 60, borderRadius: 30, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  teamName:    { fontSize: 13, fontWeight: '800', color: Colors.black, textAlign: 'center', lineHeight: 18 },
  localBadge:  { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  localTxt:    { fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  scoreCenter: { alignItems: 'center', paddingHorizontal: 8 },
  scoreNum:    { fontSize: 42, fontWeight: '900', color: Colors.black, lineHeight: 46 },
  scoreSep:    { fontSize: 20, fontWeight: '400', color: Colors.gray, lineHeight: 24 },
  vsText:      { fontSize: 22, fontWeight: '900', color: '#D1D5DB' },

  heroInfo:    { gap: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoTxt:     { fontSize: 13, color: Colors.gray, flex: 1 },

  /* Section */
  section:       { backgroundColor: '#fff', borderRadius: 16, padding: 18, gap: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle:  { fontSize: 15, fontWeight: '800', color: Colors.black },
  sectionBadge:  { fontSize: 15, fontWeight: '400', color: Colors.gray },
  sectionSub:    { fontSize: 12, color: Colors.gray, lineHeight: 18, marginTop: -6 },

  /* Score inputs */
  scoreInputRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  scoreInputBlock: { flex: 1, alignItems: 'center', gap: 8 },
  scoreInputTeam:  { fontSize: 12, fontWeight: '700', color: Colors.gray, textAlign: 'center', lineHeight: 16 },
  scoreInput:      { width: '100%', height: 88, borderRadius: 16, backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#E5E7EB', fontSize: 40, fontWeight: '900', color: Colors.black, textAlign: 'center' },
  scoreInputActive: { borderColor: RED, backgroundColor: RED_BG },
  scoreDashBlock:  { paddingBottom: 20 },
  scoreDash:       { fontSize: 30, fontWeight: '300', color: '#D1D5DB' },

  saveBtn:    { backgroundColor: RED, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  saveBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },

  /* Stats */
  statsRow: { flexDirection: 'row', gap: 10 },

  /* Attend button */
  attendBtn:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: GREEN + '50', borderRadius: 14, padding: 14 },
  attendIcon:     { width: 40, height: 40, borderRadius: 20, backgroundColor: GREEN + '15', alignItems: 'center', justifyContent: 'center' },
  attendBtnTitle: { fontSize: 14, fontWeight: '800', color: GREEN },
  attendBtnSub:   { fontSize: 11, color: Colors.gray, marginTop: 1 },

  /* Empty */
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  emptyTxt: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
});

const rg = StyleSheet.create({
  wrap:     { gap: 6 },
  header:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  label:    { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  numBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  numTxt:   { fontSize: 12, fontWeight: '900' },
  name:     { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.black },
  pos:      { fontSize: 11, color: Colors.gray },
});

const sb = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 12, gap: 4 },
  num: { fontSize: 26, fontWeight: '900' },
  lbl: { fontSize: 10, fontWeight: '700' },
});


