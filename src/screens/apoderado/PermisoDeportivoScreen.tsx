import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, RefreshControl, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Events, Event, PermisoDeportivos, PermisoDeportivo } from '../../api';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue;

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:  { label: 'Pendiente',  color: Colors.amber, bg: Colors.amber + '20', icon: 'time-outline'           },
  approved: { label: 'Aprobado',   color: Colors.green, bg: Colors.green + '20', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Rechazado',  color: Colors.red,   bg: Colors.red   + '20', icon: 'close-circle-outline'   },
};

const GRADES = [
  'Pre-Kínder', 'Kínder',
  '1° Básico', '2° Básico', '3° Básico', '4° Básico',
  '5° Básico', '6° Básico', '7° Básico', '8° Básico',
  '1° Medio', '2° Medio', '3° Medio', '4° Medio',
  'Otro',
];

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function futureStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString().split('T')[0];
}

// ── Permit card ───────────────────────────────────────────────
function PermitCard({ item }: { item: PermisoDeportivo }) {
  const s = STATUS_MAP[item.status] ?? { label: item.status, color: Colors.gray, bg: Colors.light, icon: 'help-circle-outline' };
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={[styles.typeIcon, { backgroundColor: BLUE + '15' }]}>
          <Ionicons name="ribbon-outline" size={18} color={BLUE} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.event_title}</Text>
          <Text style={styles.cardSub}>{formatDate(item.event_date)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: s.bg }]}>
          <Text style={[styles.badgeTxt, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="school-outline" size={13} color={Colors.gray} />
        <Text style={styles.metaTxt}>{item.school_name} · {item.grade}</Text>
      </View>
      {item.status === 'approved' && item.certificate_url && (
        <View style={[styles.metaRow, { marginTop: 6 }]}>
          <Ionicons name="document-outline" size={13} color={BLUE} />
          <Text style={[styles.metaTxt, { color: BLUE }]}>Certificado disponible</Text>
        </View>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────
export default function PermisoDeportivoScreen({ navigation }: any) {
  const { state } = useAuth();
  const pupil   = state.status === 'authenticated' ? state.activePupil : null;
  const pupilId = pupil?.id;

  const [events,    setEvents]    = useState<Event[]>([]);
  const [permits,   setPermits]   = useState<PermisoDeportivo[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formOpen,  setFormOpen]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [grade, setGrade] = useState('');
  const [notes, setNotes] = useState('');
  const [gradeOpen, setGradeOpen] = useState(false);

  const load = async (silent = false) => {
    if (!pupilId) return;
    if (!silent) setLoading(true);
    try {
      const [evts, perms] = await Promise.allSettled([
        Events.list(pupilId, todayStr(), futureStr(), 'match'),
        PermisoDeportivos.list(pupilId),
      ]);
      if (evts.status === 'fulfilled')  setEvents(evts.value);
      if (perms.status === 'fulfilled') setPermits(perms.value);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [pupilId]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const handleSubmit = async () => {
    if (!pupilId) return;
    if (!selectedEventId) {
      Alert.alert('Selecciona un evento', 'Elige el partido o torneo para el que necesitas el permiso.');
      return;
    }
    if (!schoolName.trim()) {
      Alert.alert('Falta información', 'Ingresa el nombre del establecimiento educacional.');
      return;
    }
    if (!grade) {
      Alert.alert('Falta información', 'Selecciona el curso del alumno.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await PermisoDeportivos.submit(pupilId, {
        event_id:    selectedEventId,
        school_name: schoolName.trim(),
        grade,
        notes:       notes.trim() || undefined,
      });
      setPermits(prev => [result, ...prev]);
      // Reset form
      setSelectedEventId(null);
      setSchoolName('');
      setGrade('');
      setNotes('');
      setFormOpen(false);
      Alert.alert('¡Solicitud enviada!', 'El club procesará tu permiso. Te avisaremos cuando esté listo.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo enviar la solicitud. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedEventId(null);
    setSchoolName('');
    setGrade('');
    setNotes('');
    setFormOpen(false);
    setGradeOpen(false);
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

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
        <View style={styles.headerInfo}>
          <Text style={styles.pageTitle}>Permiso Deportivo</Text>
          {!!pupil?.name && <Text style={styles.pageSub}>{pupil.name}</Text>}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
      >
        {/* ── Info card ── */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="information-circle-outline" size={22} color={BLUE} />
          </View>
          <Text style={styles.infoTxt}>
            El <Text style={{ fontWeight: '700' }}>Permiso Deportivo</Text> certifica la participación
            en una actividad deportiva oficial. El establecimiento educacional debe autorizar la ausencia
            al presentarlo, conforme a la normativa vigente.
          </Text>
        </View>

        {/* ── Nueva solicitud ── */}
        {!formOpen ? (
          <TouchableOpacity style={styles.newBtn} onPress={() => setFormOpen(true)} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={19} color={BLUE} />
            <Text style={styles.newBtnTxt}>Solicitar nuevo permiso</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Nueva solicitud</Text>
              <TouchableOpacity onPress={resetForm}>
                <Ionicons name="close" size={20} color={Colors.gray} />
              </TouchableOpacity>
            </View>

            {/* Event selector */}
            <Text style={styles.fieldLabel}>Evento deportivo *</Text>
            {loading ? (
              <ActivityIndicator size="small" color={BLUE} style={{ marginBottom: 12 }} />
            ) : events.length === 0 ? (
              <View style={styles.noEventsBox}>
                <Ionicons name="calendar-outline" size={18} color={Colors.gray} />
                <Text style={styles.noEventsTxt}>No hay eventos próximos disponibles.</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={styles.eventRow}>
                  {events.map(ev => (
                    <TouchableOpacity
                      key={ev.id}
                      style={[styles.eventPill, selectedEventId === ev.id && styles.eventPillSel]}
                      onPress={() => setSelectedEventId(ev.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.eventPillTxt, selectedEventId === ev.id && styles.eventPillTxtSel]}>
                        {formatDate(ev.date)} · {ev.title ?? ev.venue ?? 'Evento'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            {/* School name */}
            <Text style={styles.fieldLabel}>Establecimiento educacional *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Liceo Politécnico A-54"
              placeholderTextColor={Colors.gray}
              value={schoolName}
              onChangeText={setSchoolName}
              autoCapitalize="words"
            />

            {/* Grade selector */}
            <Text style={styles.fieldLabel}>Curso *</Text>
            <TouchableOpacity style={styles.gradeSelector} onPress={() => setGradeOpen(o => !o)} activeOpacity={0.8}>
              <Text style={[styles.gradeTxt, !grade && { color: Colors.gray }]}>
                {grade || 'Seleccionar curso'}
              </Text>
              <Ionicons name={gradeOpen ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.gray} />
            </TouchableOpacity>
            {gradeOpen && (
              <View style={styles.gradeDropdown}>
                {GRADES.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.gradeOption, grade === g && styles.gradeOptionSel]}
                    onPress={() => { setGrade(g); setGradeOpen(false); }}
                  >
                    <Text style={[styles.gradeOptionTxt, grade === g && { color: BLUE, fontWeight: '700' }]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Notes */}
            <Text style={styles.fieldLabel}>Observaciones (opcional)</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Fecha exacta de ausencia, nombre del torneo, etc."
              placeholderTextColor={Colors.gray}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.submitTxt}>Enviar solicitud</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* ── Mis permisos ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLbl}>MIS PERMISOS</Text>
          {loading ? (
            <ActivityIndicator color={BLUE} style={{ marginTop: 24 }} />
          ) : permits.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="ribbon-outline" size={40} color={Colors.light} />
              <Text style={styles.emptyTitle}>Sin permisos registrados</Text>
              <Text style={styles.emptyTxt}>
                Solicita un permiso deportivo para ausentarte al colegio durante un evento oficial.
              </Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {permits.map(p => <PermitCard key={p.id} item={p} />)}
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.surf },
  topRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  logo:           { flexDirection: 'row', alignItems: 'baseline' },
  logoI:          { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:          { fontSize: 14, fontWeight: '800', color: '#fff' },
  ic:             { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerInfo:     { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 18 },
  pageTitle:      { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  pageSub:        { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3 },

  infoCard:       { margin: 16, marginBottom: 8, backgroundColor: BLUE + '10', borderRadius: 12, padding: 14, flexDirection: 'row', gap: 10 },
  infoIconWrap:   { paddingTop: 1 },
  infoTxt:        { flex: 1, fontSize: 12, color: Colors.mid, lineHeight: 18 },

  newBtn:         { margin: 16, marginTop: 8, backgroundColor: Colors.white, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: BLUE + '30', borderStyle: 'dashed' },
  newBtnTxt:      { fontSize: 14, fontWeight: '700', color: BLUE },

  formCard:       { margin: 16, marginTop: 8, backgroundColor: Colors.white, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  formHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  formTitle:      { fontSize: 15, fontWeight: '800', color: Colors.dark },
  fieldLabel:     { fontSize: 11, fontWeight: '700', color: Colors.gray, letterSpacing: 0.5, marginBottom: 6, marginTop: 8, textTransform: 'uppercase' },
  input:          { backgroundColor: Colors.surf, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.dark, borderWidth: 1, borderColor: Colors.light, marginBottom: 4 },
  inputMulti:     { minHeight: 72, paddingTop: 12 },

  eventRow:       { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  eventPill:      { backgroundColor: Colors.surf, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.light },
  eventPillSel:   { backgroundColor: BLUE, borderColor: BLUE },
  eventPillTxt:   { fontSize: 12, fontWeight: '600', color: Colors.mid },
  eventPillTxtSel:{ color: '#fff' },

  gradeSelector:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surf, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: Colors.light, marginBottom: 4 },
  gradeTxt:       { fontSize: 14, color: Colors.dark },
  gradeDropdown:  { backgroundColor: Colors.white, borderRadius: 10, borderWidth: 1, borderColor: Colors.light, marginBottom: 8, overflow: 'hidden' },
  gradeOption:    { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: Colors.surf },
  gradeOptionSel: { backgroundColor: BLUE + '0D' },
  gradeOptionTxt: { fontSize: 13, color: Colors.dark },

  noEventsBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surf, borderRadius: 10, padding: 12, marginBottom: 8 },
  noEventsTxt:    { fontSize: 12, color: Colors.gray },

  submitBtn:      { backgroundColor: BLUE, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  submitTxt:      { color: '#fff', fontWeight: '800', fontSize: 14 },

  section:        { paddingHorizontal: 16, marginTop: 8 },
  sectionLbl:     { fontSize: 10, fontWeight: '700', color: Colors.gray, letterSpacing: 1.2, marginBottom: 10 },
  cardList:       { gap: 10 },

  card:           { backgroundColor: Colors.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  typeIcon:       { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardTitle:      { fontSize: 14, fontWeight: '700', color: Colors.dark },
  cardSub:        { fontSize: 11, color: Colors.gray, marginTop: 1 },
  badge:          { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt:       { fontSize: 10, fontWeight: '700' },
  metaRow:        { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaTxt:        { fontSize: 11, color: Colors.gray },

  emptyBox:       { alignItems: 'center', paddingVertical: 32 },
  emptyTitle:     { fontSize: 15, fontWeight: '700', color: Colors.dark, marginTop: 14, marginBottom: 6 },
  emptyTxt:       { fontSize: 12, color: Colors.gray, textAlign: 'center', lineHeight: 18 },
});
