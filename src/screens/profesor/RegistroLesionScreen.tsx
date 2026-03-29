import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Profesor, ProfesorTeam, ProfesorPlayer } from '../../api';

const GREEN = '#0F7D4B';

const LESION_TYPES  = ['Muscular', 'Ligamento', 'Fractura', 'Contusión', 'Tendinitis', 'Otro'];
const LESION_ZONES  = ['Rodilla', 'Tobillo', 'Hombro', 'Cadera', 'Espalda', 'Muslo', 'Gemelo', 'Pie', 'Otro'];
const SEVERITIES    = ['leve', 'moderada', 'grave'] as const;
const SEVERITY_LABEL: Record<string, string> = { leve: 'Leve', moderada: 'Moderada', grave: 'Grave' };
const SEVERITY_COLOR: Record<string, string> = { leve: '#10B981', moderada: '#F59E0B', grave: '#EF4444' };

export default function RegistroLesionScreen({ navigation, route }: any) {
  const initTeamId: number | undefined = route.params?.teamId;
  const initPupilId: number | undefined = route.params?.pupilId;

  const [teams,    setTeams]   = useState<ProfesorTeam[]>([]);
  const [players,  setPlayers] = useState<ProfesorPlayer[]>([]);
  const [teamId,   setTeamId]  = useState<number | undefined>(initTeamId);
  const [pupilId,  setPupilId] = useState<number | undefined>(initPupilId);
  const [type,     setType]    = useState('Muscular');
  const [zone,     setZone]    = useState('Rodilla');
  const [severity, setSeverity]= useState<'leve' | 'moderada' | 'grave'>('leve');
  const [dateStart,setDateStart]=useState(new Date().toISOString().slice(0, 10));
  const [notes,    setNotes]   = useState('');
  const [loadingTeams,   setLoadingTeams]   = useState(true);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Profesor.teams()
      .then(ts => {
        setTeams(ts);
        if (!initTeamId && ts.length === 1) setTeamId(ts[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingTeams(false));
  }, [initTeamId]);

  useEffect(() => {
    if (!teamId) return;
    setLoadingPlayers(true);
    Profesor.players(teamId)
      .then(ps => { setPlayers(ps); if (!initPupilId) setPupilId(undefined); })
      .catch(() => setPlayers([]))
      .finally(() => setLoadingPlayers(false));
  }, [teamId, initPupilId]);

  const canSubmit = !!pupilId && !!type && !!zone && !!severity && !!dateStart;

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert('Datos incompletos', 'Elige jugador, tipo, zona y gravedad.');
      return;
    }
    setSubmitting(true);
    try {
      await Profesor.createInjury({
        pupil_id:   pupilId,
        team_id:    teamId,
        type:       type.toLowerCase(),
        zone:       zone.toLowerCase(),
        severity,
        date_start: dateStart,
        notes:      notes.trim() || undefined,
      });
      Alert.alert('¡Listo!', 'Lesión registrada correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo registrar la lesión. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPlayer = players.find(p => p.id === pupilId);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrar Lesión</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>

        {/* Team selector */}
        {teams.length > 1 && (
          <View style={styles.field}>
            <Text style={styles.label}>Equipo</Text>
            <View style={styles.chipRow}>
              {teams.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.chip, teamId === t.id && styles.chipActive]}
                  onPress={() => { setTeamId(t.id); setPupilId(undefined); }}
                >
                  <Text style={[styles.chipTxt, teamId === t.id && styles.chipTxtActive]}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Player selector */}
        <View style={styles.field}>
          <Text style={styles.label}>Jugador *</Text>
          {loadingPlayers
            ? <ActivityIndicator size="small" color={GREEN} style={{ alignSelf: 'flex-start' }} />
            : players.length === 0
              ? <Text style={styles.hint}>{teamId ? 'Sin jugadores en el equipo' : 'Selecciona un equipo primero'}</Text>
              : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {players.map(p => (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.playerChip, pupilId === p.id && styles.playerChipActive]}
                        onPress={() => setPupilId(p.id)}
                      >
                        <View style={styles.avatarMini}>
                          <Text style={styles.avatarTxt}>{p.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</Text>
                        </View>
                        <Text style={[styles.playerChipName, pupilId === p.id && { color: GREEN }]} numberOfLines={1}>{p.name.split(' ')[0]}</Text>
                        {p.number != null && <Text style={styles.playerNum}>#{p.number}</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )
          }
          {selectedPlayer && (
            <View style={styles.selectedBadge}>
              <Ionicons name="person-circle-outline" size={14} color={GREEN} />
              <Text style={styles.selectedTxt}>{selectedPlayer.name}</Text>
            </View>
          )}
        </View>

        {/* Type */}
        <View style={styles.field}>
          <Text style={styles.label}>Tipo de lesión *</Text>
          <View style={styles.chipRow}>
            {LESION_TYPES.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, type === t && styles.chipActive]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.chipTxt, type === t && styles.chipTxtActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Zone */}
        <View style={styles.field}>
          <Text style={styles.label}>Zona *</Text>
          <View style={styles.chipRow}>
            {LESION_ZONES.map(z => (
              <TouchableOpacity
                key={z}
                style={[styles.chip, zone === z && styles.chipActive]}
                onPress={() => setZone(z)}
              >
                <Text style={[styles.chipTxt, zone === z && styles.chipTxtActive]}>{z}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Severity */}
        <View style={styles.field}>
          <Text style={styles.label}>Gravedad *</Text>
          <View style={styles.chipRow}>
            {SEVERITIES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, severity === s && { backgroundColor: SEVERITY_COLOR[s], borderColor: SEVERITY_COLOR[s] }]}
                onPress={() => setSeverity(s)}
              >
                <Text style={[styles.chipTxt, severity === s && { color: '#fff' }]}>{SEVERITY_LABEL[s]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date */}
        <View style={styles.field}>
          <Text style={styles.label}>Fecha de inicio *</Text>
          <TextInput
            style={styles.input}
            value={dateStart}
            onChangeText={setDateStart}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={Colors.light}
            keyboardType="numeric"
          />
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text style={styles.label}>Observaciones</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Descripción, tratamiento, observaciones..."
            placeholderTextColor={Colors.light}
            multiline
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (!canSubmit || submitting) && { opacity: 0.55 }]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting
            ? <ActivityIndicator size="small" color="#fff" />
            : <>
                <Ionicons name="medkit-outline" size={16} color="#fff" />
                <Text style={styles.submitTxt}>Registrar Lesión</Text>
              </>
          }
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.surf },
  header:       { backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  back:         { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#fff' },

  field:        { backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  label:        { fontSize: 12, fontWeight: '800', color: Colors.black, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  hint:         { fontSize: 13, color: Colors.gray },

  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.surf, borderWidth: 1, borderColor: Colors.light },
  chipActive:   { backgroundColor: GREEN + '15', borderColor: GREEN },
  chipTxt:      { fontSize: 13, color: Colors.gray, fontWeight: '600' },
  chipTxtActive:{ color: GREEN, fontWeight: '700' },

  playerChip:     { alignItems: 'center', padding: 8, borderRadius: 10, backgroundColor: Colors.surf, borderWidth: 1, borderColor: Colors.light, minWidth: 64 },
  playerChipActive:{ borderColor: GREEN, backgroundColor: GREEN + '10' },
  playerChipName: { fontSize: 11, fontWeight: '700', color: Colors.black, marginTop: 4 },
  playerNum:      { fontSize: 9, color: Colors.gray },
  avatarMini:     { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.light, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:      { fontSize: 11, fontWeight: '800', color: Colors.gray },

  selectedBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: GREEN + '12', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  selectedTxt:    { fontSize: 12, fontWeight: '700', color: GREEN },

  input:        { backgroundColor: Colors.surf, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.black, borderWidth: 1, borderColor: Colors.light },

  submitBtn:    { backgroundColor: GREEN, borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  submitTxt:    { fontSize: 15, fontWeight: '800', color: '#fff' },
});
