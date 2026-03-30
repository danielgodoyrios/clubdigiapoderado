import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, ScrollView, Alert, TextInput, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Profesor, ProfesorTeam, AsistenciaSession, AsistenciaRegistro, AttendanceIncident } from '../../api';

const GREEN = '#0F7D4B';

export default function AsistenciaProfesorScreen({ navigation, route }: any) {
  const [teams,       setTeams]       = useState<ProfesorTeam[]>([]);
  const [activeTeam,  setActiveTeam]  = useState<ProfesorTeam | null>(null);
  const [sessions,    setSessions]    = useState<AsistenciaSession[]>([]);
  const [activeSession, setActiveSession] = useState<AsistenciaSession | null>(null);
  const [records,     setRecords]     = useState<Map<number, { present: boolean; late: boolean }>>(new Map());
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [step,        setStep]        = useState<'team' | 'session' | 'attendance'>('team');

  // Incidents
  const [incidents,       setIncidents]       = useState<AttendanceIncident[]>([]);
  const [showIncidents,   setShowIncidents]   = useState(false);
  const [incidentModal,   setIncidentModal]   = useState(false);
  const [incidentType,    setIncidentType]    = useState<AttendanceIncident['type']>('behavior');
  const [incidentTitle,   setIncidentTitle]   = useState('');
  const [incidentNotes,   setIncidentNotes]   = useState('');
  const [incidentPlayer,  setIncidentPlayer]  = useState('');
  const [savingIncident,  setSavingIncident]  = useState(false);

  // Add guest
  const [guestModal,   setGuestModal]   = useState(false);
  const [guestName,    setGuestName]    = useState('');
  const [guestPhone,   setGuestPhone]   = useState('');
  const [savingGuest,  setSavingGuest]  = useState(false);

  // Whether we jumped directly to a session (from Programacion screen)
  const directSessionId: number | undefined = route?.params?.sessionId;
  const directTitle: string | undefined = route?.params?.title;

  useEffect(() => {
    if (directSessionId) {
      // Skip team + session selection, load session directly
      Profesor.attendanceDetail(directSessionId)
        .then(detail => {
          setActiveSession(detail);
          const map = new Map<number, { present: boolean; late: boolean }>();
          (detail.records ?? []).forEach(r => map.set(r.pupil_id, { present: r.present, late: r.late }));
          setRecords(map);
          setStep('attendance');
        })
        .catch(() => {
          Alert.alert('Error', 'No se pudo cargar la sesión.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        })
        .finally(() => setLoading(false));
      return;
    }

    Profesor.teams()
      .then(ts => {
        setTeams(ts);
        // Si solo hay un equipo, saltamos directamente a la selección de sesión
        if (ts.length === 1) {
          setActiveTeam(ts[0]);
          return Profesor.attendanceSessions(ts[0].id)
            .then(ss => { setSessions(ss); setStep('session'); })
            .catch(() => { setSessions([]); setStep('session'); });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadSessions = useCallback(async (team: ProfesorTeam) => {
    setLoading(true);
    try {
      const ss = await Profesor.attendanceSessions(team.id);
      setSessions(ss);
      setStep('session');
    } catch {
      setSessions([]);
      setStep('session');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSession = useCallback(async (session: AsistenciaSession) => {
    setLoading(true);
    try {
      const detail = await Profesor.attendanceDetail(session.id);
      setActiveSession(detail);
      const map = new Map<number, { present: boolean; late: boolean }>();
      detail.records.forEach(r => map.set(r.pupil_id, { present: r.present, late: r.late }));
      setRecords(map);
      setStep('attendance');
    } catch {
      // fallback: usar session sin detalle
      setActiveSession(session);
      setStep('attendance');
    } finally {
      setLoading(false);
    }
  }, []);

  const createAndLoadSession = async () => {
    if (!activeTeam) return;
    const today = new Date().toISOString().slice(0, 10);
    Alert.alert('Nueva sesión', `Crear sesión de entrenamiento para hoy (${today})?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Crear', style: 'default', onPress: async () => {
        setLoading(true);
        try {
          const s = await Profesor.createAttendanceSession(activeTeam.id, { date: today, type: 'training', title: 'Entrenamiento' });
          await loadSession(s);
        } catch {
          Alert.alert('Error', 'No se pudo crear la sesión. Intenta nuevamente.');
        } finally {
          setLoading(false);
        }
      }},
    ]);
  };

  const togglePresent = (pupilId: number) => {
    setRecords(prev => {
      const cur = prev.get(pupilId) ?? { present: false, late: false };
      const next = new Map(prev);
      next.set(pupilId, { present: !cur.present, late: !cur.present ? false : cur.late });
      return next;
    });
  };

  const toggleLate = (pupilId: number) => {
    setRecords(prev => {
      const cur = prev.get(pupilId) ?? { present: false, late: false };
      const next = new Map(prev);
      next.set(pupilId, { present: true, late: !cur.late });
      return next;
    });
  };

  const loadIncidents = useCallback(async () => {
    if (!activeSession) return;
    try {
      const list = await Profesor.sessionIncidents(activeSession.id);
      setIncidents(list);
    } catch { /* silent */ }
  }, [activeSession]);

  const saveIncident = async () => {
    if (!activeSession || !incidentTitle.trim()) return;
    // Look up player_id by name from session roster
    const nameQuery = incidentPlayer.trim().toLowerCase();
    const matchedRecord = nameQuery
      ? activeSession.records.find(r => r.name.toLowerCase().includes(nameQuery))
      : undefined;
    setSavingIncident(true);
    try {
      const inc = await Profesor.createIncident(activeSession.id, {
        type:      incidentType,
        title:     incidentTitle.trim(),
        notes:     incidentNotes.trim() || undefined,
        player_id: matchedRecord?.pupil_id,
      });
      setIncidents(prev => [inc, ...prev]);
      setIncidentModal(false);
      setIncidentTitle(''); setIncidentNotes(''); setIncidentPlayer(''); setIncidentType('behavior');
      Alert.alert(
        incidentType === 'injury' ? 'Lesión registrada' : 'Incidencia guardada',
        incidentType === 'injury' ? 'La lesión ha quedado registrada.' : 'La incidencia ha sido guardada.',
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? e?.error ?? 'No se pudo registrar la incidencia.');
    } finally {
      setSavingIncident(false);
    }
  };

  const saveGuest = async () => {
    if (!activeSession || !guestName.trim()) return;
    setSavingGuest(true);
    try {
      const rec = await Profesor.addGuestToSession(activeSession.id, {
        guest_name:  guestName.trim(),
        guest_phone: guestPhone.trim() || undefined,
        status:      'present',
      });
      // Add to records map with a negative key to distinguish guests
      setRecords(prev => {
        const next = new Map(prev);
        next.set(-(rec.record_id), { present: true, late: false });
        return next;
      });
      // Also add to the active session records so it appears in the list
      if (activeSession) {
        setActiveSession(prev => prev ? {
          ...prev,
          records: [...(prev.records ?? []), {
            pupil_id: -(rec.record_id),
            name:     rec.name + ' (Visitante)',
            photo:    null,
            present:  true,
            late:     false,
            notes:    null,
          }],
        } : prev);
      }
      setGuestModal(false);
      setGuestName(''); setGuestPhone('');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? e?.error ?? 'No se pudo agregar el visitante.');
    } finally {
      setSavingGuest(false);
    }
  };

  const handleSubmit = async () => {
    if (!activeSession) return;

    // If the session has no players yet (backend didn't return records),
    // we can still submit an empty list — but warn the user first.
    const recs = activeSession.records ?? [];
    if (records.size === 0 && recs.length === 0) {
      Alert.alert(
        'Sin jugadores',
        'Esta sesión no tiene jugadores cargados. El backend aún no vinculó la nómina del equipo. Intenta volver y abrir la sesión nuevamente.',
      );
      return;
    }

    const list: AsistenciaRegistro[] = Array.from(records.entries()).map(([pupil_id, r]) => ({
      pupil_id,
      present: r.present,
      late: r.late,
      notes: null,
    }));

    // ── DEBUG LOG ─────────────────────────────────────────────
    console.log('[AsistenciaProfesor] ========== SUBMIT ==========');
    console.log('[AsistenciaProfesor] session_id :', activeSession.id);
    console.log('[AsistenciaProfesor] session date:', activeSession.date);
    console.log('[AsistenciaProfesor] session type:', activeSession.type);
    console.log('[AsistenciaProfesor] session title:', activeSession.title);
    console.log('[AsistenciaProfesor] records count:', list.length);
    console.log('[AsistenciaProfesor] payload body :', JSON.stringify({ records: list }, null, 2));
    // ─────────────────────────────────────────────────────────

    setSubmitting(true);
    try {
      const result = await Profesor.submitAttendance(activeSession.id, list);
      console.log('[AsistenciaProfesor] submit OK:', JSON.stringify(result));
      Alert.alert('¡Listo!', 'Asistencia registrada correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      console.log('[AsistenciaProfesor] submit ERROR raw:', JSON.stringify(e));
      console.log('[AsistenciaProfesor] error.status  :', e?.status);
      console.log('[AsistenciaProfesor] error.message :', e?.message);
      console.log('[AsistenciaProfesor] error.error   :', e?.error);
      console.log('[AsistenciaProfesor] error.errors  :', JSON.stringify(e?.errors));
      const msg = e?.message ?? e?.error ?? e?.errors?.[0] ?? 'No se pudo guardar la asistencia. Intenta nuevamente.';
      Alert.alert('Error', String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const insets = useSafeAreaInsets();
  const presentCount = Array.from(records.values()).filter(r => r.present).length;
  const totalCount   = records.size;

  // ── STEP: Select team ──────────────────────────────────────
  const renderTeamStep = () => (
    <FlatList
      data={teams}
      keyExtractor={t => String(t.id)}
      contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12 }}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Ionicons name="people-outline" size={40} color={Colors.light} />
          <Text style={styles.emptyTxt}>Sin equipos asignados</Text>
        </View>
      }
      renderItem={({ item: t }) => (
        <TouchableOpacity
          style={styles.selectCard}
          onPress={() => { setActiveTeam(t); loadSessions(t); }}
          activeOpacity={0.82}
        >
          <View style={styles.selectIcon}>
            <Ionicons name="shield-outline" size={20} color={GREEN} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectTitle}>{t.name}</Text>
            <Text style={styles.selectSub}>{t.player_count} jugadores{t.category ? ` · ${t.category}` : ''}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.light} />
        </TouchableOpacity>
      )}
    />
  );

  // ── STEP: Select session ───────────────────────────────────
  const renderSessionStep = () => (
    <FlatList
      data={sessions}
      keyExtractor={s => String(s.id)}
      contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12 }}
      ListHeaderComponent={
        <TouchableOpacity style={styles.createSessionBtn} onPress={createAndLoadSession}>
          <Ionicons name="add-circle-outline" size={18} color={GREEN} />
          <Text style={styles.createSessionTxt}>Crear sesión para hoy</Text>
        </TouchableOpacity>
      }
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-outline" size={40} color={Colors.light} />
          <Text style={styles.emptyTxt}>Sin sesiones recientes</Text>
        </View>
      }
      renderItem={({ item: s }) => (
        <TouchableOpacity
          style={styles.selectCard}
          onPress={() => loadSession(s)}
          activeOpacity={0.82}
        >
          <View style={[styles.selectIcon, s.submitted && { backgroundColor: GREEN + '20' }]}>
            <Ionicons name={s.submitted ? 'checkmark-circle-outline' : 'time-outline'} size={20} color={GREEN} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectTitle}>{s.title ?? s.type === 'match' ? 'Partido' : 'Entrenamiento'}</Text>
            <Text style={styles.selectSub}>{s.date}{s.submitted ? ` · ✓ Enviado (${s.present_count}/${s.total})` : ' · Pendiente'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.light} />
        </TouchableOpacity>
      )}
    />
  );

  // ── STEP: Take attendance ──────────────────────────────────
  const renderAttendanceStep = () => {
    const recs = activeSession?.records ?? [];
    return (
      <View style={{ flex: 1 }}>
        {/* Summary bar */}
        <View style={styles.summaryBar}>
          <Text style={styles.summaryTxt}>Presentes: <Text style={{ color: GREEN, fontWeight: '800' }}>{presentCount}</Text> / {totalCount || recs.length}</Text>
          <TouchableOpacity
            style={[styles.markAllBtn, { backgroundColor: GREEN + '18' }]}
            onPress={() => {
              const next = new Map<number, { present: boolean; late: boolean }>();
              recs.forEach(r => next.set(r.pupil_id, { present: true, late: false }));
              setRecords(next);
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: GREEN }}>Marcar todos presentes</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          style={{ flex: 1 }}
          data={recs}
          keyExtractor={r => String(r.pupil_id)}
          contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 8 }}
          renderItem={({ item: r }) => {
            const rec = records.get(r.pupil_id) ?? { present: false, late: false };
            return (
              <View style={styles.playerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.playerName}>{r.name}</Text>
                </View>
                {/* Tarde button */}
                <TouchableOpacity
                  style={[styles.lateBtn, rec.late && styles.lateBtnActive]}
                  onPress={() => toggleLate(r.pupil_id)}
                >
                  <Text style={[styles.lateTxt, rec.late && styles.lateTxtActive]}>TARDE</Text>
                </TouchableOpacity>
                {/* Present toggle */}
                <TouchableOpacity
                  style={[styles.presentBtn, rec.present ? styles.presentBtnOn : styles.presentBtnOff]}
                  onPress={() => togglePresent(r.pupil_id)}
                >
                  <Ionicons
                    name={rec.present ? 'checkmark' : 'close'}
                    size={18}
                    color={rec.present ? '#fff' : Colors.gray}
                  />
                </TouchableOpacity>
              </View>
            );
          }}
        />

        {/* Submit */}
        <View style={[styles.submitRow, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          {/* Extra actions row */}
          <View style={styles.extraActions}>
            <TouchableOpacity
              style={styles.extraBtn}
              onPress={() => { setGuestModal(true); }}
            >
              <Ionicons name="person-add-outline" size={16} color={GREEN} />
              <Text style={styles.extraBtnTxt}>Visitante</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.extraBtn}
              onPress={() => { loadIncidents(); setShowIncidents(true); }}
            >
              <Ionicons name="warning-outline" size={16} color="#F59E0B" />
              <Text style={[styles.extraBtnTxt, { color: '#F59E0B' }]}>
                Incidencias{incidents.length > 0 ? ` (${incidents.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.submitTxt}>Guardar Asistencia</Text>
            }
          </TouchableOpacity>
        </View>

        {/* ── MODAL: Agregar visitante ── */}
        <Modal visible={guestModal} transparent animationType="slide" onRequestClose={() => setGuestModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Agregar visitante</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nombre completo *"
                value={guestName}
                onChangeText={setGuestName}
                autoFocus
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Teléfono (opcional)"
                value={guestPhone}
                onChangeText={setGuestPhone}
                keyboardType="phone-pad"
              />
              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setGuestModal(false)}>
                  <Text style={styles.modalCancelTxt}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirm, (!guestName.trim() || savingGuest) && { opacity: 0.5 }]}
                  onPress={saveGuest}
                  disabled={!guestName.trim() || savingGuest}
                >
                  {savingGuest
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.modalConfirmTxt}>Agregar</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ── MODAL: Incidencias ── */}
        <Modal visible={showIncidents} transparent animationType="slide" onRequestClose={() => setShowIncidents(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { maxHeight: '80%' }]}>

              {/* Header: título + cerrar */}
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Incidencias</Text>
                <TouchableOpacity onPress={() => setShowIncidents(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={24} color={Colors.gray} />
                </TouchableOpacity>
              </View>

              {/* Lista */}
              <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 4 }}>
                {incidents.length === 0 ? (
                  <Text style={{ color: Colors.gray, textAlign: 'center', paddingVertical: 20 }}>Sin incidencias registradas</Text>
                ) : incidents.map(inc => (
                  <View key={inc.id} style={styles.incidentCard}>
                    <View style={[styles.incidentDot, {
                      backgroundColor: inc.type === 'injury'    ? Colors.red
                        : inc.type === 'expulsion' ? '#7C3AED'
                        : inc.type === 'behavior'  ? '#F59E0B'
                        : Colors.gray,
                    }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.incidentTitle}>{inc.title}</Text>
                      {inc.player_name && <Text style={styles.incidentSub}>{inc.player_name}</Text>}
                      {inc.notes && <Text style={styles.incidentNotes}>{inc.notes}</Text>}
                    </View>
                    <Text style={styles.incidentType}>{inc.type.toUpperCase()}</Text>
                  </View>
                ))}
              </ScrollView>

              {/* Acción nueva incidencia */}
              <TouchableOpacity
                style={[styles.submitBtn, { marginTop: 14 }]}
                onPress={() => { setShowIncidents(false); setIncidentModal(true); }}
              >
                <Text style={styles.submitTxt}>+ Nueva incidencia</Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>

        {/* ── MODAL: Nueva incidencia ── */}
        <Modal visible={incidentModal} transparent animationType="slide" onRequestClose={() => setIncidentModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { maxHeight: '92%' }]}>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* Header */}
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Nueva incidencia</Text>
                  <TouchableOpacity onPress={() => setIncidentModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={24} color={Colors.gray} />
                  </TouchableOpacity>
                </View>

                {/* Categoría principal */}
                <View style={styles.catRow}>
                  <TouchableOpacity
                    style={[styles.catCard, incidentType === 'injury' && styles.catCardInjuryActive]}
                    onPress={() => setIncidentType('injury')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.catEmoji}>🤕</Text>
                    <Text style={[styles.catLabel, incidentType === 'injury' && { color: Colors.red }]}>Lesión</Text>
                    <Text style={styles.catSub}>Física / médica</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.catCard, incidentType !== 'injury' && styles.catCardIncidentActive]}
                    onPress={() => { if (incidentType === 'injury') setIncidentType('behavior'); }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.catEmoji}>⚡</Text>
                    <Text style={[styles.catLabel, incidentType !== 'injury' && { color: '#D97706' }]}>Incidencia</Text>
                    <Text style={styles.catSub}>Conducta / disciplina</Text>
                  </TouchableOpacity>
                </View>

                {/* Sub-tipo (solo para Incidencia) */}
                {incidentType !== 'injury' && (
                  <View style={styles.subPillRow}>
                    {(['behavior','expulsion','medical','other'] as const).map(t => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.subPill, incidentType === t && styles.subPillActive]}
                        onPress={() => setIncidentType(t)}
                      >
                        <Text style={[styles.subPillTxt, incidentType === t && { color: '#fff' }]}>
                          {t === 'behavior' ? 'Conducta' : t === 'expulsion' ? 'Expulsión' : t === 'medical' ? 'Médico' : 'Otro'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <TextInput
                  style={styles.modalInput}
                  placeholder="Descripción breve *"
                  value={incidentTitle}
                  onChangeText={setIncidentTitle}
                  returnKeyType="next"
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Jugador involucrado (nombre, opcional)"
                  value={incidentPlayer}
                  onChangeText={setIncidentPlayer}
                  returnKeyType="next"
                />
                <TextInput
                  style={[styles.modalInput, { height: 64, textAlignVertical: 'top' }]}
                  placeholder="Notas adicionales (opcional)"
                  value={incidentNotes}
                  onChangeText={setIncidentNotes}
                  multiline
                />

                <TouchableOpacity
                  style={[styles.submitBtn, { marginTop: 4, marginBottom: 6 }, (!incidentTitle.trim() || savingIncident) && { opacity: 0.5 }]}
                  onPress={saveIncident}
                  disabled={!incidentTitle.trim() || savingIncident}
                >
                  {savingIncident
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.submitTxt}>Guardar incidencia</Text>
                  }
                </TouchableOpacity>

              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  };

  const backStep = () => {
    if (directSessionId) { navigation.goBack(); return; }
    if (step === 'attendance') { setStep('session'); setActiveSession(null); }
    else if (step === 'session') { setStep('team'); setActiveTeam(null); }
    else navigation.goBack();
  };

  const stepTitle = directTitle ?? (
    step === 'team' ? 'Elegir Equipo' :
    step === 'session' ? activeTeam?.name ?? 'Elegir Sesión' :
    activeSession?.title ?? 'Pasar Asistencia'
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={backStep}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{stepTitle}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Step indicator — hidden when jumping directly via schedule */}
      {!directSessionId && (
        <View style={styles.stepRow}>
          {['Equipo','Sesión','Asistencia'].map((s, i) => {
            const idx = ['team','session','attendance'].indexOf(step);
            return (
              <React.Fragment key={s}>
                <View style={[styles.stepDot, i <= idx && { backgroundColor: GREEN }]}>
                  <Text style={[styles.stepDotTxt, i <= idx && { color: '#fff' }]}>{i + 1}</Text>
                </View>
                {i < 2 && <View style={[styles.stepLine, i < idx && { backgroundColor: GREEN }]} />}
              </React.Fragment>
            );
          })}
        </View>
      )}

      {loading
        ? <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={GREEN} /></View>
        : step === 'team'       ? renderTeamStep()
        : step === 'session'    ? renderSessionStep()
        : renderAttendanceStep()
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.surf },
  header:       { backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  back:         { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#fff' },

  stepRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.light, gap: 0 },
  stepDot:      { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.light, alignItems: 'center', justifyContent: 'center' },
  stepDotTxt:   { fontSize: 11, fontWeight: '800', color: Colors.gray },
  stepLine:     { width: 40, height: 2, backgroundColor: Colors.light },

  selectCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  selectIcon:   { width: 42, height: 42, borderRadius: 10, backgroundColor: GREEN + '12', alignItems: 'center', justifyContent: 'center' },
  selectTitle:  { fontSize: 14, fontWeight: '700', color: Colors.black },
  selectSub:    { fontSize: 12, color: Colors.gray, marginTop: 2 },

  createSessionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GREEN + '12', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: GREEN + '30', borderStyle: 'dashed' },
  createSessionTxt: { fontSize: 14, fontWeight: '700', color: GREEN },

  summaryBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.light },
  summaryTxt:   { fontSize: 13, fontWeight: '600', color: Colors.black },
  markAllBtn:   { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },

  playerRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 8, gap: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  playerName:   { fontSize: 13, fontWeight: '600', color: Colors.black },
  lateBtn:      { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: Colors.light },
  lateBtnActive:{ backgroundColor: '#FEF3C7' },
  lateTxt:      { fontSize: 9, fontWeight: '800', color: Colors.gray },
  lateTxtActive:{ color: '#D97706' },
  presentBtn:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  presentBtnOn: { backgroundColor: GREEN },
  presentBtnOff:{ backgroundColor: Colors.surf, borderWidth: 1, borderColor: Colors.light },

  submitRow:    { padding: 14, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.light },
  submitBtn:    { backgroundColor: GREEN, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitTxt:    { fontSize: 15, fontWeight: '800', color: '#fff' },

  extraActions: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  extraBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 9, borderWidth: 1, borderColor: Colors.light, backgroundColor: '#fff' },
  extraBtnTxt:  { fontSize: 12, fontWeight: '700', color: GREEN },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, paddingBottom: 30 },
  modalTitle:   { fontSize: 16, fontWeight: '800', color: Colors.black, marginBottom: 14 },
  modalLabel:   { fontSize: 12, fontWeight: '700', color: Colors.gray, marginBottom: 6 },
  modalInput:   { borderWidth: 1, borderColor: Colors.light, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.black, backgroundColor: Colors.surf, marginBottom: 10 },
  modalBtns:    { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalCancel:  { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.light },
  modalCancelTxt: { fontSize: 14, fontWeight: '600', color: Colors.gray },
  modalConfirm: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', backgroundColor: GREEN },
  modalConfirmTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },

  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },

  catRow:           { flexDirection: 'row', gap: 10, marginBottom: 14 },
  catCard:          { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, borderRadius: 14, borderWidth: 2, borderColor: Colors.light, backgroundColor: Colors.surf, gap: 4 },
  catCardInjuryActive:   { borderColor: Colors.red, backgroundColor: '#FEF2F2' },
  catCardIncidentActive: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  catEmoji:         { fontSize: 28 },
  catLabel:         { fontSize: 14, fontWeight: '800', color: Colors.gray },
  catSub:           { fontSize: 10, color: Colors.gray, textAlign: 'center' },

  subPillRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  subPill:      { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.light, backgroundColor: Colors.surf },
  subPillActive: { backgroundColor: '#D97706', borderColor: '#D97706' },
  subPillTxt:   { fontSize: 12, fontWeight: '700', color: Colors.gray },

  incidentCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.surf, borderRadius: 10, padding: 12, marginBottom: 8 },
  incidentDot:  { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  incidentTitle: { fontSize: 13, fontWeight: '700', color: Colors.black },
  incidentSub:  { fontSize: 11, color: Colors.gray, marginTop: 1 },
  incidentNotes: { fontSize: 11, color: Colors.gray, marginTop: 3, fontStyle: 'italic' },
  incidentType: { fontSize: 9, fontWeight: '800', color: Colors.gray },

  emptyBox:     { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTxt:     { fontSize: 13, color: Colors.gray },
});
