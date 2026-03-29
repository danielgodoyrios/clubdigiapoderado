import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Profesor, AgendaItem } from '../../api';

const RED   = '#991B1B';
const GREEN = '#0F7D4B';
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAY_FULL = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAY_FULL[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function parseScore(score: string | null) {
  if (!score) return { home: '', away: '' };
  const parts = score.split(':');
  return { home: parts[0] ?? '', away: parts[1] ?? '' };
}

function StatItem({ icon, color, label, value }: { icon: string; color: string; label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function PartidoDetalleScreen({ route, navigation }: any) {
  const item: AgendaItem = route.params?.item;
  const initial = parseScore(item?.score ?? null);

  const [homeGoals, setHomeGoals] = useState(initial.home);
  const [awayGoals, setAwayGoals] = useState(initial.away);
  const [saving,    setSaving]    = useState(false);
  const [openingSession, setOpeningSession] = useState(false);
  const [savedScore, setSavedScore] = useState<string | null>(item?.score ?? null);

  // Split title "Team A vs Team B"
  const titleParts = item?.title?.split(/\s+vs\.?\s+/i) ?? [];
  const homeTeam = titleParts[0]?.trim() || item?.team_name || 'Local';
  const awayTeam = titleParts[1]?.trim() || 'Visita';

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
      Alert.alert('¡Guardado!', `Resultado registrado: ${homeTeam} ${score.replace(':', ' – ')} ${awayTeam}`);
    } catch (e: any) {
      Alert.alert('Error', e?.error ?? 'No se pudo guardar el resultado.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Abrir/navegar a asistencia ── */
  const openAttendance = async () => {
    if (item.session_id) {
      navigation.navigate('AsistenciaProfesor', {
        sessionId: item.session_id,
        title:     item.title,
      });
      return;
    }
    if (!item.team_id) {
      Alert.alert('Sin equipo', 'Este partido no tiene un equipo asignado.');
      return;
    }
    setOpeningSession(true);
    try {
      const session = await Profesor.createAttendanceSession(item.team_id, {
        date:  item.date,
        type:  'match',
        title: item.title,
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

  const statusLabel = (s: string) =>
    s === 'played' ? 'Jugado' : s === 'scheduled' ? 'Programado' : s === 'finished' ? 'Finalizado' : 'Próximo';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de Partido</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* Date / status */}
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.gray} />
            <Text style={styles.dateTxt}>
              {fmtDate(item.date)}{item.time ? ` · ${item.time}` : ''}
              {item.end_time ? ` – ${item.end_time}` : ''}
            </Text>
            <View style={[styles.statusChip, item.status === 'played' || item.status === 'finished' ? styles.statusDone : null]}>
              <Text style={styles.statusTxt}>{statusLabel(item.status)}</Text>
            </View>
          </View>

          {/* Scoreboard */}
          <View style={styles.scoreBoard}>
            <View style={styles.teamCol}>
              <View style={[styles.teamShield, { borderColor: RED }]}>
                <Ionicons name="shield" size={26} color={RED} />
              </View>
              <Text style={styles.teamName} numberOfLines={2}>{homeTeam}</Text>
              <Text style={styles.teamLabel}>LOCAL</Text>
            </View>

            <View style={styles.scoreCenter}>
              {savedScore ? (
                <Text style={styles.scoreDisplay}>{savedScore.replace(':', ' – ')}</Text>
              ) : (
                <Text style={styles.scoreVs}>VS</Text>
              )}
            </View>

            <View style={styles.teamCol}>
              <View style={[styles.teamShield, { borderColor: Colors.light }]}>
                <Ionicons name="shield" size={26} color={Colors.gray} />
              </View>
              <Text style={styles.teamName} numberOfLines={2}>{awayTeam}</Text>
              <Text style={styles.teamLabel}>VISITA</Text>
            </View>
          </View>

          {/* Location / team info */}
          {item.location ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={15} color={Colors.gray} />
              <Text style={styles.infoTxt}>{item.location}</Text>
            </View>
          ) : null}
          {item.team_name ? (
            <View style={styles.infoRow}>
              <Ionicons name="shield-outline" size={15} color={Colors.gray} />
              <Text style={styles.infoTxt}>{item.team_name}</Text>
            </View>
          ) : null}
          {item.subtitle ? (
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={15} color={Colors.gray} />
              <Text style={styles.infoTxt}>{item.subtitle}</Text>
            </View>
          ) : null}

          {/* ── Resultado ── */}
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Resultado</Text>
          <Text style={styles.sectionSub}>
            {savedScore ? `Resultado actual: ${savedScore.replace(':', ' – ')} — puedes actualizarlo.` : 'Ingresa los goles de cada equipo.'}
          </Text>

          <View style={styles.scoreInputRow}>
            <View style={styles.scoreInputBox}>
              <Text style={styles.scoreInputLabel} numberOfLines={1}>{homeTeam}</Text>
              <TextInput
                style={styles.scoreInput}
                keyboardType="number-pad"
                maxLength={2}
                value={homeGoals}
                onChangeText={setHomeGoals}
                placeholder="0"
                placeholderTextColor={Colors.gray}
              />
            </View>
            <Text style={styles.scoreDash}>–</Text>
            <View style={styles.scoreInputBox}>
              <Text style={styles.scoreInputLabel} numberOfLines={1}>{awayTeam}</Text>
              <TextInput
                style={styles.scoreInput}
                keyboardType="number-pad"
                maxLength={2}
                value={awayGoals}
                onChangeText={setAwayGoals}
                placeholder="0"
                placeholderTextColor={Colors.gray}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.saveBtnTxt}>Guardar Resultado</Text>
              </>
            )}
          </TouchableOpacity>

          {/* ── Asistencia ── */}
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Asistencia</Text>

          {item.attendance_stats ? (
            <View style={styles.statsCard}>
              <StatItem icon="checkmark-circle" color={GREEN}      label="Presentes" value={item.attendance_stats.present} />
              <StatItem icon="close-circle"     color={RED}        label="Ausentes"  value={item.attendance_stats.absent} />
              <StatItem icon="people"           color="#2563EB"    label="Total"     value={item.attendance_stats.total} />
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.attendBtn, openingSession && { opacity: 0.6 }]}
            onPress={openAttendance}
            disabled={openingSession}
            activeOpacity={0.8}
          >
            {openingSession ? (
              <ActivityIndicator size="small" color={GREEN} />
            ) : (
              <Ionicons name="clipboard-outline" size={18} color={GREEN} />
            )}
            <Text style={styles.attendBtnTxt}>
              {item.session_id ? 'Ver Asistencia' : 'Abrir Sesión de Asistencia'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={GREEN} />
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.surf },
  header:           { backgroundColor: RED, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:      { flex: 1, fontSize: 16, fontWeight: '800', color: '#fff', textAlign: 'center' },
  scroll:           { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },

  dateRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateTxt:          { flex: 1, fontSize: 12, color: Colors.gray },
  statusChip:       { backgroundColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusDone:       { backgroundColor: GREEN + '20' },
  statusTxt:        { fontSize: 10, fontWeight: '800', color: Colors.gray },

  scoreBoard:       { backgroundColor: '#fff', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.light, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  teamCol:          { flex: 1, alignItems: 'center', gap: 6 },
  teamShield:       { width: 52, height: 52, borderRadius: 26, borderWidth: 2, backgroundColor: Colors.surf, alignItems: 'center', justifyContent: 'center' },
  teamName:         { fontSize: 12, fontWeight: '700', color: Colors.black, textAlign: 'center', maxWidth: 100 },
  teamLabel:        { fontSize: 9, fontWeight: '800', color: Colors.gray, letterSpacing: 0.5 },
  scoreCenter:      { paddingHorizontal: 12, alignItems: 'center' },
  scoreDisplay:     { fontSize: 26, fontWeight: '900', color: Colors.black },
  scoreVs:          { fontSize: 18, fontWeight: '900', color: Colors.gray },

  infoRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoTxt:          { fontSize: 13, color: Colors.gray, flex: 1 },

  divider:          { height: 1, backgroundColor: Colors.light, marginVertical: 4 },
  sectionTitle:     { fontSize: 14, fontWeight: '800', color: Colors.black },
  sectionSub:       { fontSize: 12, color: Colors.gray, marginTop: -4 },

  scoreInputRow:    { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 16 },
  scoreInputBox:    { alignItems: 'center', gap: 6 },
  scoreInputLabel:  { fontSize: 11, color: Colors.gray, fontWeight: '600', maxWidth: 90, textAlign: 'center' },
  scoreInput:       { width: 80, height: 80, borderRadius: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.light, fontSize: 34, fontWeight: '900', color: Colors.black, textAlign: 'center' },
  scoreDash:        { fontSize: 26, fontWeight: '900', color: Colors.gray, paddingBottom: 24 },

  saveBtn:          { backgroundColor: RED, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  saveBtnTxt:       { fontSize: 15, fontWeight: '800', color: '#fff' },

  statsCard:        { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-around', borderWidth: 1, borderColor: Colors.light },
  statItem:         { alignItems: 'center', gap: 4 },
  statValue:        { fontSize: 22, fontWeight: '900', color: Colors.black },
  statLabel:        { fontSize: 10, color: Colors.gray, fontWeight: '600' },

  attendBtn:        { backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderWidth: 1, borderColor: GREEN + '40' },
  attendBtnTxt:     { flex: 1, fontSize: 14, fontWeight: '700', color: GREEN },
});
