import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Profesor, ProfesorTeam } from '../../api';

const GREEN = '#0F7D4B';

const EVENT_TYPES = [
  { id: 'training', label: 'Entrenamiento', icon: 'fitness-outline' },
  { id: 'match',    label: 'Partido',       icon: 'football-outline'  },
  { id: 'event',    label: 'Evento',        icon: 'calendar-outline'  },
] as const;

export default function CrearEventoScreen({ navigation, route }: any) {
  const initTeamId: number | undefined = route.params?.teamId;

  const [teams,       setTeams]       = useState<ProfesorTeam[]>([]);
  const [teamId,      setTeamId]      = useState<number | undefined>(initTeamId);
  const [type,        setType]        = useState<'training' | 'match' | 'event'>('training');
  const [title,       setTitle]       = useState('');
  const [date,        setDate]        = useState(new Date().toISOString().slice(0, 10));
  const [time,        setTime]        = useState('');
  const [location,    setLocation]    = useState('');
  const [homeTeam,    setHomeTeam]    = useState('');
  const [awayTeam,    setAwayTeam]    = useState('');
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [submitting,   setSubmitting]   = useState(false);

  useEffect(() => {
    Profesor.teams()
      .then(ts => {
        setTeams(ts);
        if (!initTeamId && ts.length === 1) setTeamId(ts[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingTeams(false));
  }, [initTeamId]);

  const canSubmit = !!teamId && !!date && (type !== 'training' ? !!title : true);

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert('Datos incompletos', 'Selecciona equipo y fecha.');
      return;
    }
    const autoTitle = type === 'training' ? 'Entrenamiento'
      : type === 'match'    ? `${homeTeam || 'Local'} vs ${awayTeam || 'Visitante'}`
      : title;

    setSubmitting(true);
    try {
      await Profesor.createEvent({
        team_id:   teamId!,
        type,
        title:     title || autoTitle,
        date,
        time:      time || undefined,
        location:  location || undefined,
        home_team: type === 'match' ? homeTeam || undefined : undefined,
        away_team: type === 'match' ? awayTeam || undefined : undefined,
      });
      Alert.alert('¡Listo!', 'Evento creado correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo crear el evento. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear Evento</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>

        {/* Event type */}
        <View style={styles.card}>
          <Text style={styles.label}>Tipo de evento *</Text>
          <View style={styles.typeRow}>
            {EVENT_TYPES.map(et => (
              <TouchableOpacity
                key={et.id}
                style={[styles.typeBtn, type === et.id && styles.typeBtnActive]}
                onPress={() => setType(et.id)}
              >
                <Ionicons name={et.icon as any} size={20} color={type === et.id ? '#fff' : Colors.gray} />
                <Text style={[styles.typeTxt, type === et.id && styles.typeTxtActive]}>{et.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Team */}
        <View style={styles.card}>
          <Text style={styles.label}>Equipo *</Text>
          {loadingTeams
            ? <ActivityIndicator size="small" color={GREEN} style={{ alignSelf: 'flex-start' }} />
            : (
              <View style={styles.chipRow}>
                {teams.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.chip, teamId === t.id && styles.chipActive]}
                    onPress={() => setTeamId(t.id)}
                  >
                    <Text style={[styles.chipTxt, teamId === t.id && styles.chipTxtActive]}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )
          }
        </View>

        {/* Title (for match auto-built, for event required) */}
        {type !== 'training' && (
          <View style={styles.card}>
            <Text style={styles.label}>{type === 'match' ? 'Título (opcional)' : 'Título *'}</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={type === 'match' ? 'Se genera automáticamente' : 'Ej: Torneo de verano'}
              placeholderTextColor={Colors.light}
            />
          </View>
        )}

        {/* Match teams */}
        {type === 'match' && (
          <View style={styles.card}>
            <Text style={styles.label}>Equipos</Text>
            <View style={styles.matchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>Local</Text>
                <TextInput
                  style={styles.input}
                  value={homeTeam}
                  onChangeText={setHomeTeam}
                  placeholder="Equipo local"
                  placeholderTextColor={Colors.light}
                />
              </View>
              <View style={styles.vsBox}>
                <Text style={styles.vsTxt}>VS</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>Visitante</Text>
                <TextInput
                  style={styles.input}
                  value={awayTeam}
                  onChangeText={setAwayTeam}
                  placeholder="Equipo visitante"
                  placeholderTextColor={Colors.light}
                />
              </View>
            </View>
          </View>
        )}

        {/* Date and Time */}
        <View style={styles.card}>
          <Text style={styles.label}>Fecha *</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={Colors.light}
            keyboardType="numeric"
          />
          <Text style={[styles.label, { marginTop: 12 }]}>Hora</Text>
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            placeholder="HH:MM (opcional)"
            placeholderTextColor={Colors.light}
            keyboardType="numeric"
          />
        </View>

        {/* Location */}
        <View style={styles.card}>
          <Text style={styles.label}>Lugar</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Cancha, estadio, dirección..."
            placeholderTextColor={Colors.light}
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
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={styles.submitTxt}>Crear Evento</Text>
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

  card:         { backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  label:        { fontSize: 11, fontWeight: '800', color: Colors.black, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  subLabel:     { fontSize: 11, color: Colors.gray, marginBottom: 4 },

  typeRow:      { flexDirection: 'row', gap: 8 },
  typeBtn:      { flex: 1, alignItems: 'center', padding: 12, borderRadius: 10, backgroundColor: Colors.surf, borderWidth: 1, borderColor: Colors.light, gap: 4 },
  typeBtnActive:{ backgroundColor: GREEN, borderColor: GREEN },
  typeTxt:      { fontSize: 11, fontWeight: '700', color: Colors.gray },
  typeTxtActive:{ color: '#fff' },

  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: Colors.surf, borderWidth: 1, borderColor: Colors.light },
  chipActive:   { backgroundColor: GREEN + '15', borderColor: GREEN },
  chipTxt:      { fontSize: 13, color: Colors.gray, fontWeight: '600' },
  chipTxtActive:{ color: GREEN, fontWeight: '700' },

  matchRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vsBox:        { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.black, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  vsTxt:        { fontSize: 10, fontWeight: '900', color: '#fff' },

  input:        { backgroundColor: Colors.surf, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.black, borderWidth: 1, borderColor: Colors.light },

  submitBtn:    { backgroundColor: GREEN, borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  submitTxt:    { fontSize: 15, fontWeight: '800', color: '#fff' },
});
