import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Profesor, Lesion, InjuryFollowup } from '../../api';

const GREEN = '#0F7D4B';
const SEV_COLOR: Record<string, string> = {
  leve: '#10B981', moderada: '#F59E0B', grave: '#EF4444',
};
const TRAINING_OPTIONS = [
  { key: 'no_train', label: 'Baja total',  color: '#EF4444' },
  { key: 'partial',  label: 'Parcial',     color: '#F59E0B' },
  { key: 'full',     label: 'Alta médica', color: '#10B981' },
];

function fmtDate(s: string) {
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysSince(s: string) {
  return Math.floor((Date.now() - new Date(s + 'T00:00:00').getTime()) / 86400000);
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={15} color={Colors.gray} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function LesionDetalleScreen({ navigation, route }: any) {
  const initialLesion: Lesion = route.params?.lesion;
  const insets = useSafeAreaInsets();

  const [lesion,     setLesion]     = useState<Lesion>(initialLesion);
  const [followups,  setFollowups]  = useState<InjuryFollowup[]>([]);
  const [loadingFU,  setLoadingFU]  = useState(true);
  const [newNote,    setNewNote]    = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [closing,    setClosing]    = useState(false);
  const [editMode,   setEditMode]   = useState(false);

  // Edit fields
  const [editNotes,    setEditNotes]    = useState(lesion.notes ?? '');
  const [editTraining, setEditTraining] = useState(lesion.training_status ?? '');
  const [editReturn,   setEditReturn]   = useState(lesion.expected_return_date ?? '');
  const [savingEdit,   setSavingEdit]   = useState(false);

  const loadFollowups = useCallback(async () => {
    try {
      const data = await Profesor.injuryFollowups(lesion.id);
      setFollowups(data);
    } catch {
      setFollowups([]);
    } finally {
      setLoadingFU(false);
    }
  }, [lesion.id]);

  useEffect(() => { loadFollowups(); }, [loadFollowups]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const fu = await Profesor.addInjuryFollowup(lesion.id, newNote.trim());
      setFollowups(prev => [...prev, fu]);
      setNewNote('');
    } catch {
      Alert.alert('Error', 'No se pudo guardar la nota.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Dar de alta',
      `¿Confirmas que ${lesion.pupil_name} se recuperó?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Dar de alta', style: 'default', onPress: async () => {
          setClosing(true);
          try {
            const today = new Date().toISOString().slice(0, 10);
            await Profesor.closeInjury(lesion.id, { date_end: today });
            setLesion(prev => ({ ...prev, is_active: false, date_end: today }));
          } catch {
            Alert.alert('Error', 'No se pudo cerrar la lesión.');
          } finally {
            setClosing(false);
          }
        }},
      ]
    );
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const updated = await Profesor.updateInjury(lesion.id, {
        notes: editNotes.trim() || undefined,
        training_status: editTraining || undefined,
        expected_return_date: editReturn || undefined,
      });
      setLesion(prev => ({ ...prev, ...updated }));
      setEditMode(false);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la lesión.');
    } finally {
      setSavingEdit(false);
    }
  };

  const sevColor = SEV_COLOR[lesion.severity] ?? Colors.gray;
  const initials = lesion.pupil_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const days = daysSince(lesion.date_start);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: sevColor }]}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{lesion.pupil_name}</Text>
        <TouchableOpacity style={styles.back} onPress={() => setEditMode(e => !e)}>
          <Ionicons name={editMode ? 'close-outline' : 'pencil-outline'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

          {/* Player + status card */}
          <View style={styles.playerCard}>
            <View style={[styles.avatar, { borderColor: sevColor }]}>
              <Text style={styles.avatarTxt}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.playerName}>{lesion.pupil_name}</Text>
              {lesion.team_name && <Text style={styles.teamName}>{lesion.team_name}</Text>}
            </View>
            <View style={[styles.activeBadge, { backgroundColor: lesion.is_active ? '#FEF2F2' : '#DCFCE7' }]}>
              <View style={[styles.activeDot, { backgroundColor: lesion.is_active ? '#EF4444' : '#16A34A' }]} />
              <Text style={[styles.activeTxt, { color: lesion.is_active ? '#EF4444' : '#16A34A' }]}>
                {lesion.is_active ? `${days}d baja` : 'Alta'}
              </Text>
            </View>
          </View>

          {/* Injury details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diagnóstico</Text>
            <View style={styles.pillRow}>
              <View style={[styles.pill, { backgroundColor: sevColor + '18' }]}>
                <Ionicons name="medical-outline" size={12} color={sevColor} />
                <Text style={[styles.pillTxt, { color: sevColor }]}>
                  {lesion.severity_label ?? (lesion.severity.charAt(0).toUpperCase() + lesion.severity.slice(1))}
                </Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillTxt}>{lesion.type.charAt(0).toUpperCase() + lesion.type.slice(1)}</Text>
              </View>
              {lesion.zone && <View style={styles.pill}><Text style={styles.pillTxt}>{lesion.zone}</Text></View>}
            </View>
            <Row icon="calendar-outline" label="Inicio" value={fmtDate(lesion.date_start)} />
            {lesion.date_end && <Row icon="calendar-outline" label="Alta" value={fmtDate(lesion.date_end)} />}
            {lesion.expected_return_date && !lesion.date_end && (
              <Row icon="time-outline" label="Retorno estimado" value={fmtDate(lesion.expected_return_date)} />
            )}
            {lesion.description && <Row icon="document-text-outline" label="Descripción" value={lesion.description} />}
          </View>

          {/* Edit panel */}
          {editMode && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Editar</Text>

              <Text style={styles.fieldLabel}>Estado de entrenamiento</Text>
              <View style={styles.pillRow}>
                {TRAINING_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.pill, editTraining === opt.key && { backgroundColor: opt.color, borderColor: opt.color }]}
                    onPress={() => setEditTraining(t => t === opt.key ? '' : opt.key)}
                  >
                    <Text style={[styles.pillTxt, editTraining === opt.key && { color: '#fff' }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Fecha retorno estimada</Text>
              <TextInput
                style={styles.input}
                value={editReturn}
                onChangeText={setEditReturn}
                placeholder="YYYY-MM-DD"
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Observaciones</Text>
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Notas médicas u observaciones"
                multiline
              />

              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary, savingEdit && { opacity: 0.6 }]}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.btnTxt}>Guardar cambios</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          {/* Notes section */}
          {lesion.notes && !editMode && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notas</Text>
              <Text style={styles.notesTxt}>{lesion.notes}</Text>
            </View>
          )}

          {/* Training status (display) */}
          {lesion.training_status && !editMode && (
            <View style={styles.trainingBar}>
              {TRAINING_OPTIONS.map(opt => (
                <View key={opt.key} style={[styles.trainingChip, lesion.training_status === opt.key && { backgroundColor: opt.color + '20', borderColor: opt.color }]}>
                  <Text style={[styles.trainingChipTxt, lesion.training_status === opt.key && { color: opt.color, fontWeight: '800' }]}>{opt.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Followups */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seguimiento ({followups.length})</Text>
            {loadingFU ? (
              <ActivityIndicator size="small" color={GREEN} style={{ paddingVertical: 10 }} />
            ) : followups.length === 0 ? (
              <Text style={styles.emptyFu}>Sin notas de seguimiento aún</Text>
            ) : followups.map(fu => (
              <View key={fu.id} style={styles.fuCard}>
                <View style={styles.fuDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fuNotes}>{fu.notes}</Text>
                  <Text style={styles.fuMeta}>
                    {fu.created_by_name ? `${fu.created_by_name} · ` : ''}
                    {new Date(fu.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
              </View>
            ))}

            {/* Add followup input */}
            {lesion.is_active && (
              <View style={styles.fuInputRow}>
                <TextInput
                  style={styles.fuInput}
                  value={newNote}
                  onChangeText={setNewNote}
                  placeholder="Agregar nota de seguimiento…"
                  multiline
                />
                <TouchableOpacity
                  style={[styles.fuBtn, (!newNote.trim() || savingNote) && { opacity: 0.4 }]}
                  onPress={handleAddNote}
                  disabled={!newNote.trim() || savingNote}
                >
                  {savingNote
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="send" size={16} color="#fff" />
                  }
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Actions */}
          {lesion.is_active && !editMode && (
            <TouchableOpacity
              style={[styles.btn, styles.btnGreen, closing && { opacity: 0.6 }]}
              onPress={handleClose}
              disabled={closing}
            >
              {closing
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.btnTxt}>Dar de alta</Text>
                  </>
              }
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.surf },
  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  back:       { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#fff' },

  playerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  avatar:     { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.surf, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  avatarTxt:  { fontSize: 16, fontWeight: '800', color: Colors.gray },
  playerName: { fontSize: 15, fontWeight: '800', color: Colors.black },
  teamName:   { fontSize: 12, color: Colors.gray, marginTop: 2 },
  activeBadge:{ flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  activeDot:  { width: 7, height: 7, borderRadius: 4 },
  activeTxt:  { fontSize: 11, fontWeight: '800' },

  section:     { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  sectionTitle:{ fontSize: 12, fontWeight: '800', color: Colors.gray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },

  pillRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, borderWidth: 1, borderColor: Colors.light, backgroundColor: Colors.surf, paddingHorizontal: 12, paddingVertical: 5 },
  pillTxt:  { fontSize: 12, fontWeight: '700', color: Colors.gray },

  infoRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel:  { fontSize: 12, color: Colors.gray, width: 110 },
  infoValue:  { fontSize: 12, fontWeight: '600', color: Colors.black, flex: 1 },

  trainingBar:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  trainingChip: { borderRadius: 8, borderWidth: 1, borderColor: Colors.light, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.surf },
  trainingChipTxt: { fontSize: 12, color: Colors.gray },

  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:      { borderWidth: 1, borderColor: Colors.light, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.black, backgroundColor: Colors.surf },

  notesTxt:  { fontSize: 13, color: Colors.black, lineHeight: 20 },
  emptyFu:   { fontSize: 13, color: Colors.gray, fontStyle: 'italic' },
  fuCard:    { flexDirection: 'row', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.light },
  fuDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.light, marginTop: 5 },
  fuNotes:   { fontSize: 13, color: Colors.black, lineHeight: 19 },
  fuMeta:    { fontSize: 11, color: Colors.gray, marginTop: 3 },
  fuInputRow:{ flexDirection: 'row', gap: 8, marginTop: 8 },
  fuInput:   { flex: 1, borderWidth: 1, borderColor: Colors.light, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: Colors.black, backgroundColor: Colors.surf, minHeight: 40 },
  fuBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },

  btn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 14 },
  btnPrimary:{ backgroundColor: Colors.blue ?? '#1A3A7C' },
  btnGreen:  { backgroundColor: GREEN },
  btnTxt:    { fontSize: 15, fontWeight: '800', color: '#fff' },
});
