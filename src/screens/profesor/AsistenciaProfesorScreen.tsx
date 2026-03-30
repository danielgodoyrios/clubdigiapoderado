import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, ScrollView, Alert, TextInput, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Profesor, ProfesorTeam, AsistenciaSession, AsistenciaRegistro, AttendanceIncident, MatchConvocado } from '../../api';

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
  const [incidents,        setIncidents]        = useState<AttendanceIncident[]>([]);
  const [showIncidents,    setShowIncidents]    = useState(false);
  const [incidentModal,    setIncidentModal]    = useState(false);
  const [incidentType,     setIncidentType]     = useState<AttendanceIncident['type']>('behavior');
  const [incidentTitle,    setIncidentTitle]    = useState('');
  const [incidentNotes,    setIncidentNotes]    = useState('');
  const [incidentPlayerIds, setIncidentPlayerIds] = useState<number[]>([]);
  const [incidentPlayerNames, setIncidentPlayerNames] = useState<Map<number, string>>(new Map());
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);

  // Club player search
  const [clubModal, setClubModal] = useState(false);
  const [clubSearch, setClubSearch] = useState('');
  const [clubPlayers, setClubPlayers] = useState<Array<{id: number; name: string; teamName: string}>>([]);
  const [loadingClub, setLoadingClub] = useState(false);
  const [addingClubPlayer, setAddingClubPlayer] = useState<number | null>(null);
  // Injury-specific
  const [injuryZone,     setInjuryZone]     = useState('');
  const [injuryKind,     setInjuryKind]     = useState('');
  const [injurySeverity, setInjurySeverity] = useState<'leve'|'moderada'|'grave'>('leve');
  const [savingIncident,  setSavingIncident]  = useState(false);

  // Submitted / read-only mode
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Nómina read-only (convocados from match)
  const [convocados,    setConvocados]    = useState<MatchConvocado[]>([]);
  const [showNomina,    setShowNomina]    = useState(false);
  const [loadingNomina, setLoadingNomina] = useState(false);

  // Add guest
  const [guestModal,   setGuestModal]   = useState(false);
  const [guestName,    setGuestName]    = useState('');
  const [guestPhone,   setGuestPhone]   = useState('');
  const [savingGuest,  setSavingGuest]  = useState(false);

  // Whether we jumped directly to a session (from Programacion screen)
  const directSessionId: number | undefined = route?.params?.sessionId;
  const directMatchId:   number | undefined = route?.params?.matchId;
  const directTitle: string | undefined = route?.params?.title;

  // Log params on every render to confirm values arriving
  console.log('[AsistenciaProfesor] params -> sessionId:', directSessionId, '| matchId:', directMatchId, '| title:', directTitle);

  // Auto-populate session records from convocados when session is empty
  const [loadingFromNomina, setLoadingFromNomina] = useState(false);

  const loadNominaIntoSession = useCallback(async () => {
    if (!activeSession || isSubmitted || convocados.length === 0) return;
    const convocadoList = convocados.filter(c => c.status !== 'disponible' && c.pupil_id);
    if (convocadoList.length === 0) return;
    setLoadingFromNomina(true);
    try {
      // Add each convocado to the session via the API
      const added: typeof activeSession.records = [];
      for (const c of convocadoList) {
        try {
          const rec = await Profesor.addPlayerToSession(activeSession.id, c.pupil_id);
          const pupilId = rec.pupil_id ?? c.pupil_id;
          added.push({ pupil_id: pupilId, name: rec.name ?? c.name, photo: rec.photo ?? c.photo, present: false, late: false, notes: null });
          setRecords(prev => { const next = new Map(prev); next.set(pupilId, { present: false, late: false }); return next; });
        } catch { /* skip already-added players */ }
      }
      if (added.length > 0) {
        setActiveSession(prev => prev ? { ...prev, records: [...(prev.records ?? []), ...added] } : prev);
      }
    } finally {
      setLoadingFromNomina(false);
    }
  }, [activeSession, isSubmitted, convocados]);

  useEffect(() => {
    if (directSessionId) {
      // Load match convocados concurrently if we arrived from a match
      if (directMatchId) {
        console.log('[AsistenciaProfesor] loading nomina for matchId:', directMatchId);
        setLoadingNomina(true);
        Profesor.matchDetail(directMatchId)
          .then(({ convocados: cv }) => {
            console.log('[AsistenciaProfesor] nomina loaded, count:', cv.length);
            setConvocados(cv);
          })
          .catch(e => console.log('[AsistenciaProfesor] nomina load ERROR:', JSON.stringify(e)))
          .finally(() => setLoadingNomina(false));
      } else {
        console.log('[AsistenciaProfesor] no matchId — nomina section will NOT render');
      }

      // Skip team + session selection, load session directly
      Profesor.attendanceDetail(directSessionId)
        .then(detail => {
          // Dedup records + filter empty names
          const seen = new Set<number>();
          const cleanRecords = (detail.records ?? []).filter(r => {
            if (!r.name?.trim()) return false;
            if (seen.has(r.pupil_id)) return false;
            seen.add(r.pupil_id);
            return true;
          });
          detail.records = cleanRecords;
          setActiveSession(detail);
          const map = new Map<number, { present: boolean; late: boolean }>();
          cleanRecords.forEach(r => map.set(r.pupil_id, { present: r.present, late: r.late }));
          setRecords(map);
          setIsSubmitted(detail.submitted ?? false);
          setStep('attendance');
          // Pre-load incidents silently
          Profesor.sessionIncidents(detail.id).then(setIncidents).catch(() => {});
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
      // Dedup records by pupil_id and filter out entries with empty names
      const seen = new Set<number>();
      const cleanRecords = (detail.records ?? []).filter(r => {
        if (!r.name?.trim()) return false;
        if (seen.has(r.pupil_id)) return false;
        seen.add(r.pupil_id);
        return true;
      });
      detail.records = cleanRecords;
      setActiveSession(detail);
      const map = new Map<number, { present: boolean; late: boolean }>();
      cleanRecords.forEach(r => map.set(r.pupil_id, { present: r.present, late: r.late }));
      setRecords(map);
      setIsSubmitted(detail.submitted ?? false);
      setStep('attendance');
      // Pre-load incidents silently
      Profesor.sessionIncidents(detail.id).then(setIncidents).catch(() => {});
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

  const resetIncidentForm = () => {
    setIncidentTitle(''); setIncidentNotes('');
    setIncidentPlayerIds([]); setIncidentPlayerNames(new Map());
    setInjuryZone(''); setInjuryKind(''); setInjurySeverity('leve');
    setIncidentType('behavior'); setShowPlayerPicker(false);
  };

  const saveIncident = async () => {
    if (!activeSession || !incidentTitle.trim()) return;
    setSavingIncident(true);
    try {
      const payload = {
        type:  incidentType,
        title: incidentTitle.trim(),
        notes: incidentNotes.trim() || undefined,
        ...(incidentType === 'injury' ? {
          injury_type: injuryKind     || undefined,
          injury_zone: injuryZone     ? [injuryZone] : undefined,
          severity:    injurySeverity,
        } : {}),
      };
      if (incidentPlayerIds.length <= 1) {
        const inc = await Profesor.createIncident(activeSession.id, {
          ...payload,
          player_id: incidentPlayerIds[0] ?? undefined,
        });
        setIncidents(prev => [inc, ...prev]);
      } else {
        // Create one incident per selected player
        const created: AttendanceIncident[] = [];
        for (const pid of incidentPlayerIds) {
          const inc = await Profesor.createIncident(activeSession.id, { ...payload, player_id: pid });
          created.push(inc);
        }
        setIncidents(prev => [...created, ...prev]);
      }
      setIncidentModal(false);
      resetIncidentForm();
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
      // Guests are already saved by the API — we only add them to the
      // display list. Use a guaranteed-negative key so they're never
      // included in the submitAttendance payload.
      const guestKey = rec.record_id ? -(rec.record_id) : -(Date.now());
      // Add to records map (display only, filtered out on submit)
      setRecords(prev => {
        const next = new Map(prev);
        next.set(guestKey, { present: true, late: false });
        return next;
      });
      // Also add to the active session records so it appears in the list
      if (activeSession) {
        setActiveSession(prev => prev ? {
          ...prev,
          records: [...(prev.records ?? []), {
            pupil_id: guestKey,
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

  const removeGuest = async (guestKey: number) => {
    if (!activeSession) return;
    // guestKey is negative: -record_id
    const recordId = -guestKey;
    try {
      await Profesor.removeGuestFromSession(activeSession.id, recordId);
    } catch { /* best-effort — remove locally regardless */ }
    setRecords(prev => { const next = new Map(prev); next.delete(guestKey); return next; });
    setActiveSession(prev => prev ? {
      ...prev,
      records: (prev.records ?? []).filter(r => r.pupil_id !== guestKey),
    } : prev);
  };

  const openClubModal = async () => {
    setClubModal(true);
    setClubSearch('');
    setLoadingClub(true);
    try {
      let allTeams = teams.length > 0 ? teams : (activeTeam ? [activeTeam] : []);
      // Si llegamos directo por directSessionId, teams nunca se cargó — buscarlos ahora
      if (allTeams.length === 0) {
        allTeams = await Profesor.teams();
        if (allTeams.length > 0) setTeams(allTeams);
      }
      const results = await Promise.all(
        allTeams.map(t => Profesor.players(t.id).then(ps => ps.map(p => ({ id: p.id, name: p.name, teamName: t.name }))))
      );
      const inSession = new Set<number>(
        (activeSession?.records ?? []).filter(r => r.pupil_id > 0).map(r => r.pupil_id)
      );
      const seen = new Set<number>();
      const merged: Array<{id: number; name: string; teamName: string}> = [];
      for (const arr of results) {
        for (const p of arr) {
          if (!seen.has(p.id) && !inSession.has(p.id)) {
            seen.add(p.id);
            merged.push(p);
          }
        }
      }
      merged.sort((a, b) => a.name.localeCompare(b.name));
      setClubPlayers(merged);
    } catch {
      setClubPlayers([]);
    } finally {
      setLoadingClub(false);
    }
  };

  const addClubPlayer = async (player: {id: number; name: string; teamName: string}) => {
    if (!activeSession) return;
    setAddingClubPlayer(player.id);
    try {
      const rec = await Profesor.addPlayerToSession(activeSession.id, player.id);
      const pupilId = rec.pupil_id ?? player.id;
      setRecords(prev => {
        const next = new Map(prev);
        next.set(pupilId, { present: true, late: false });
        return next;
      });
      setActiveSession(prev => prev ? {
        ...prev,
        records: [...(prev.records ?? []), {
          pupil_id: pupilId,
          name: rec.name ?? player.name,
          photo: rec.photo ?? null,
          present: true,
          late: false,
          notes: null,
        }],
      } : prev);
      setClubPlayers(prev => prev.filter(p => p.id !== player.id));
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? e?.error ?? 'No se pudo agregar el jugador.');
    } finally {
      setAddingClubPlayer(null);
    }
  };


  const handleSubmit = async () => {
    if (!activeSession) return;

    // If the session has no players yet just warn, don't block
    const recs = activeSession.records ?? [];
    if (records.size === 0 && recs.length === 0) {
      Alert.alert(
        'Sin jugadores',
        'La sesión no tiene jugadores cargados aún. Puedes enviarla igualmente o volver más tarde.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Enviar igual', style: 'default', onPress: () => doSubmit([]) },
        ],
      );
      return;
    }
    doSubmit(Array.from(records.entries())
      .filter(([pupil_id]) => pupil_id > 0)
      .map(([pupil_id, r]) => ({ pupil_id, present: r.present, late: r.late, notes: null })));
  };

  const doSubmit = async (list: AsistenciaRegistro[]) => {
    if (!activeSession) return;

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
      setIsSubmitted(true);
      setActiveSession(prev => prev ? { ...prev, submitted: true } : prev);
      Alert.alert('¡Listo!', 'Asistencia registrada correctamente.');
      // Signal SesionesHoy to refresh this session's status on next focus
      navigation.setParams?.({ submittedSessionId: activeSession.id });
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
        {/* Submitted banner */}
        {isSubmitted && (
          <View style={styles.submittedBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.submittedBannerTxt}>
              Asistencia registrada · {presentCount} presentes · {(totalCount || recs.length) - presentCount} ausentes
              {activeSession?.submitted_by_coach_name ? `  ·  ${activeSession.submitted_by_coach_name}` : ''}
            </Text>
          </View>
        )}

        {/* Session code strip */}
        {activeSession && (
          <View style={styles.sessionCodeBar}>
            <Ionicons name="barcode-outline" size={13} color={Colors.gray} />
            <Text style={styles.sessionCodeBarTxt}>
              {activeSession.session_code ?? `SES-${String(activeSession.id).padStart(6, '0')}`}
            </Text>
          </View>
        )}

        {/* Nómina read-only — visible when coming from a match */}
        {directMatchId && (
          <>
            <TouchableOpacity
              style={styles.nominaToggle}
              onPress={() => setShowNomina(v => !v)}
              activeOpacity={0.8}
            >
              <Ionicons name="people-outline" size={15} color={GREEN} />
              <Text style={styles.nominaToggleTxt}>
                Nómina · {convocados.filter(c => c.convocado).length} convocados
              </Text>
              {loadingNomina
                ? <ActivityIndicator size="small" color={GREEN} />
                : <Ionicons name={showNomina ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.gray} />
              }
            </TouchableOpacity>
            {showNomina && (
              <View style={styles.nominaList}>
                {convocados.filter(c => c.convocado).map((c, i) => {
                  const stColor = c.status === 'confirmed' ? GREEN
                                : c.status === 'declined'  ? '#EF4444'
                                : '#F59E0B';
                  const stLabel = c.status === 'confirmed' ? 'Confirmó'
                                : c.status === 'declined'  ? 'No va'
                                : 'Pendiente';
                  return (
                    <View key={String(c.pupil_id ?? i)} style={styles.nominaRow}>
                      <View style={styles.nominaAvatar}>
                        <Text style={styles.nominaAvatarTxt}>
                          {c.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.nominaPlayerName}>{c.name}</Text>
                        {(c.number != null || c.position) && (
                          <Text style={styles.nominaPlayerMeta}>
                            {c.number != null ? `#${c.number}` : ''}{c.number != null && c.position ? ' · ' : ''}{c.position ?? ''}
                          </Text>
                        )}
                      </View>
                      <View style={[styles.nominaBadge, { backgroundColor: stColor + '18' }]}>
                        <Text style={[styles.nominaBadgeTxt, { color: stColor }]}>{stLabel}</Text>
                      </View>
                    </View>
                  );
                })}
                {convocados.filter(c => c.convocado).length === 0 && !loadingNomina && (
                  <Text style={{ fontSize: 12, color: Colors.gray, textAlign: 'center', paddingVertical: 12 }}>Sin convocados registrados</Text>
                )}
              </View>
            )}
          </>
        )}

        {/* Summary bar */}
        <View style={styles.summaryBar}>
          <Text style={styles.summaryTxt}>Presentes: <Text style={{ color: GREEN, fontWeight: '800' }}>{presentCount}</Text> / {totalCount || recs.length}</Text>
          {!isSubmitted && (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {/* Cargar nómina — only when session is empty and convocados are available */}
              {recs.length === 0 && convocados.filter(c => c.convocado).length > 0 && (
                <TouchableOpacity
                  style={[styles.markAllBtn, { backgroundColor: '#3B82F618' }]}
                  onPress={loadNominaIntoSession}
                  disabled={loadingFromNomina}
                >
                  {loadingFromNomina
                    ? <ActivityIndicator size="small" color="#3B82F6" />
                    : <Text style={{ fontSize: 12, fontWeight: '700', color: '#3B82F6' }}>Cargar nómina</Text>
                  }
                </TouchableOpacity>
              )}
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
          )}
        </View>

        <FlatList
          style={{ flex: 1 }}
          data={recs}
          keyExtractor={(r, i) => r.pupil_id != null ? String(r.pupil_id) : `guest-${i}-${r.name}`}
          contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 8 }}
          renderItem={({ item: r }) => {
            const isGuest = r.pupil_id < 0;
            const rec = records.get(r.pupil_id) ?? { present: false, late: false };
            return (
              <View style={[styles.playerRow, isGuest && styles.guestRow]}>
                {isGuest && <View style={styles.guestStripe} />}
                <View style={{ flex: 1 }}>
                  <Text style={styles.playerName}>{r.name}</Text>
                  {isGuest && <Text style={styles.guestBadge}>Visitante</Text>}
                </View>
                {/* Delete guest */}
                {isGuest ? (
                  !isSubmitted && (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => removeGuest(r.pupil_id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.red} />
                    </TouchableOpacity>
                  )
                ) : isSubmitted ? (
                  /* Read-only locked state — clear present/absent/late indicators */
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {rec.late && (
                      <View style={[styles.lateBtn, styles.lateBtnActive]}>
                        <Text style={styles.lateTxtActive}>TARDE</Text>
                      </View>
                    )}
                    <View style={[
                      styles.presentBtn,
                      rec.present ? styles.presentBtnOn : styles.presentBtnAbsent,
                      { opacity: 0.8 },
                    ]}>
                      <Ionicons
                        name={rec.present ? 'checkmark' : 'close'}
                        size={18}
                        color="#fff"
                      />
                    </View>
                  </View>
                ) : (
                  <>
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
                  </>
                )}
              </View>
            );
          }}
        />

        {/* Submit */}
        <View style={[styles.submitRow, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          {/* Extra actions row — hidden when submitted */}
          {!isSubmitted && <View style={styles.extraActions}>
            <TouchableOpacity
              style={styles.extraBtn}
              onPress={() => { setGuestModal(true); }}
            >
              <Ionicons name="person-add-outline" size={16} color={GREEN} />
              <Text style={styles.extraBtnTxt}>Visitante</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.extraBtn}
              onPress={openClubModal}
            >
              <Ionicons name="search-outline" size={16} color="#6366F1" />
              <Text style={[styles.extraBtnTxt, { color: '#6366F1' }]}>Del club</Text>
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
          </View>}

          {isSubmitted ? (
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: Colors.gray }]}
              onPress={() => {
                Alert.alert(
                  'Editar asistencia',
                  '¿Quieres desbloquear esta asistencia para corregir errores?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Desbloquear', style: 'destructive', onPress: () => setIsSubmitted(false) },
                  ]
                );
              }}
            >
              <Ionicons name="pencil-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.submitTxt}>Editar asistencia</Text>
            </TouchableOpacity>
          ) : (
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
          )}
        </View>

        {/* ── MODAL: Buscar jugador del club ── */}
        <Modal visible={clubModal} transparent animationType="slide" onRequestClose={() => setClubModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { maxHeight: '85%' }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Buscar en el club</Text>
                <TouchableOpacity onPress={() => setClubModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={24} color={Colors.gray} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.modalInput, { marginBottom: 10 }]}
                placeholder="Buscar jugador..."
                value={clubSearch}
                onChangeText={setClubSearch}
                autoFocus
              />
              {loadingClub ? (
                <ActivityIndicator size="small" color={GREEN} style={{ paddingVertical: 20 }} />
              ) : (
                <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled">
                  {clubPlayers
                    .filter(p =>
                      p.name.toLowerCase().includes(clubSearch.toLowerCase()) ||
                      p.teamName.toLowerCase().includes(clubSearch.toLowerCase())
                    )
                    .map(p => (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.playerPickerRow, { borderBottomWidth: 1, borderBottomColor: Colors.light }]}
                        onPress={() => addClubPlayer(p)}
                        disabled={addingClubPlayer !== null}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.playerPickerName}>{p.name}</Text>
                          <Text style={{ fontSize: 11, color: Colors.gray }}>{p.teamName}</Text>
                        </View>
                        {addingClubPlayer === p.id
                          ? <ActivityIndicator size="small" color={GREEN} />
                          : <Ionicons name="add-circle-outline" size={20} color={GREEN} />
                        }
                      </TouchableOpacity>
                    ))
                  }
                  {clubPlayers.filter(p =>
                    p.name.toLowerCase().includes(clubSearch.toLowerCase()) ||
                    p.teamName.toLowerCase().includes(clubSearch.toLowerCase())
                  ).length === 0 && (
                    <Text style={{ color: Colors.gray, textAlign: 'center', paddingVertical: 20, fontSize: 13 }}>
                      {clubSearch ? 'No se encontraron jugadores' : 'Sin jugadores disponibles'}
                    </Text>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

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
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Text style={styles.incidentType}>{inc.type.toUpperCase()}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          if (!activeSession) return;
                          Alert.alert(
                            'Eliminar incidencia',
                            '¿Estás seguro de que quieres eliminar esta incidencia?',
                            [
                              { text: 'Cancelar', style: 'cancel' },
                              { text: 'Eliminar', style: 'destructive', onPress: async () => {
                                try {
                                  await Profesor.deleteIncident(activeSession.id, inc.id);
                                } catch { /* best-effort */ }
                                setIncidents(prev => prev.filter(i => i.id !== inc.id));
                              }},
                            ]
                          );
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={15} color={Colors.red} />
                      </TouchableOpacity>
                    </View>
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
        <Modal visible={incidentModal} transparent animationType="slide" onRequestClose={() => { setIncidentModal(false); resetIncidentForm(); }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { maxHeight: '94%' }]}>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* Header */}
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Nueva incidencia</Text>
                  <TouchableOpacity onPress={() => { setIncidentModal(false); resetIncidentForm(); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={24} color={Colors.gray} />
                  </TouchableOpacity>
                </View>

                {/* ── Categoría principal ── */}
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

                {/* Sub-tipo conducta */}
                {incidentType !== 'injury' && (
                  <View style={[styles.subPillRow, { marginBottom: 16 }]}>
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

                {/* ── Jugador(es) ── */}
                <Text style={styles.fieldLabel}>Jugadores involucrados</Text>
                <TouchableOpacity
                  style={styles.playerPickerToggle}
                  onPress={() => setShowPlayerPicker(v => !v)}
                >
                  <Ionicons name="people-outline" size={16} color={incidentPlayerIds.length > 0 ? GREEN : Colors.gray} />
                  <Text style={[styles.playerPickerTxt, incidentPlayerIds.length > 0 && { color: Colors.black }]}>
                    {incidentPlayerIds.length > 0
                      ? incidentPlayerIds.map(pid => incidentPlayerNames.get(pid) ?? '').join(', ')
                      : 'Seleccionar jugador(es) (opcional)'}
                  </Text>
                  <Ionicons name={showPlayerPicker ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.gray} />
                </TouchableOpacity>

                {showPlayerPicker && (
                  <View style={styles.playerPickerList}>
                    {/* Opción: sin jugador */}
                    <TouchableOpacity
                      style={[styles.playerPickerRow, incidentPlayerIds.length === 0 && styles.playerPickerRowActive]}
                      onPress={() => { setIncidentPlayerIds([]); setIncidentPlayerNames(new Map()); }}
                    >
                      <Text style={[styles.playerPickerName, incidentPlayerIds.length === 0 && { color: GREEN }]}>— Sin jugador específico</Text>
                    </TouchableOpacity>
                    {(activeSession?.records ?? []).filter(r => r.pupil_id > 0).map(r => {
                      const selected = incidentPlayerIds.includes(r.pupil_id);
                      return (
                        <TouchableOpacity
                          key={r.pupil_id}
                          style={[styles.playerPickerRow, selected && styles.playerPickerRowActive]}
                          onPress={() => {
                            setIncidentPlayerIds(prev =>
                              prev.includes(r.pupil_id) ? prev.filter(id => id !== r.pupil_id) : [...prev, r.pupil_id]
                            );
                            setIncidentPlayerNames(prev => {
                              const next = new Map(prev);
                              if (next.has(r.pupil_id)) next.delete(r.pupil_id);
                              else next.set(r.pupil_id, r.name);
                              return next;
                            });
                          }}
                        >
                          <Text style={[styles.playerPickerName, selected && { color: GREEN, fontWeight: '700' }]}>{r.name}</Text>
                          {selected && <Ionicons name="checkmark-circle" size={16} color={GREEN} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* ── Descripción ── */}
                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Descripción *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ej: Falta grave en el 2do tiempo"
                  value={incidentTitle}
                  onChangeText={setIncidentTitle}
                  returnKeyType="next"
                />

                {/* ── Campos específicos de lesión ── */}
                {incidentType === 'injury' && (
                  <>
                    <Text style={styles.fieldLabel}>Zona afectada</Text>
                    <View style={styles.subPillRow}>
                      {['Rodilla','Tobillo','Hombro','Muslo','Cadera','Espalda','Pie','Cabeza','Otro'].map(z => (
                        <TouchableOpacity
                          key={z}
                          style={[styles.subPill, injuryZone === z && styles.subPillInjuryActive]}
                          onPress={() => setInjuryZone(z)}
                        >
                          <Text style={[styles.subPillTxt, injuryZone === z && { color: '#fff' }]}>{z}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.fieldLabel}>Tipo de lesión</Text>
                    <View style={styles.subPillRow}>
                      {[['muscular','Muscular'],['contractura','Contractura'],['desgarro','Desgarro'],['esguince','Esguince'],['ligamento','Ligamento'],['fractura','Fractura'],['contusion','Contusión'],['sangrado','Sangrado'],['otro','Otro']].map(([val, lbl]) => (
                        <TouchableOpacity
                          key={val}
                          style={[styles.subPill, injuryKind === val && styles.subPillInjuryActive]}
                          onPress={() => setInjuryKind(val)}
                        >
                          <Text style={[styles.subPillTxt, injuryKind === val && { color: '#fff' }]}>{lbl}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.fieldLabel}>Severidad</Text>
                    <View style={[styles.subPillRow, { marginBottom: 4 }]}>
                      {(['leve','moderada','grave'] as const).map(s => (
                        <TouchableOpacity
                          key={s}
                          style={[styles.subPill, styles.subPillSeverity, injurySeverity === s && (
                            s === 'leve' ? styles.subPillSevLeve : s === 'moderada' ? styles.subPillSevMod : styles.subPillSevGrave
                          )]}
                          onPress={() => setInjurySeverity(s)}
                        >
                          <Text style={[styles.subPillTxt, injurySeverity === s && { color: '#fff' }]}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {/* Notas */}
                <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Notas adicionales</Text>
                <TextInput
                  style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]}
                  placeholder="Opcional"
                  value={incidentNotes}
                  onChangeText={setIncidentNotes}
                  multiline
                />

                <TouchableOpacity
                  style={[styles.submitBtn, { marginTop: 6, marginBottom: 8 }, (!incidentTitle.trim() || savingIncident) && { opacity: 0.5 }]}
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
  sessionCode:  { fontSize: 10, fontWeight: '600', color: Colors.gray, marginTop: 1 },
  markAllBtn:   { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },

  playerRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 8, gap: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1, overflow: 'hidden' },
  playerName:   { fontSize: 13, fontWeight: '600', color: Colors.black },
  guestRow:     { borderWidth: 1, borderColor: '#0D9488' + '40', backgroundColor: '#F0FDFA' },
  guestStripe:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: '#0D9488', borderTopLeftRadius: 10, borderBottomLeftRadius: 10 },
  guestBadge:   { fontSize: 10, fontWeight: '700', color: '#0D9488', marginTop: 1 },
  deleteBtn:    { padding: 4 },
  lateBtn:      { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: Colors.light },
  lateBtnActive:{ backgroundColor: '#FEF3C7' },
  lateTxt:      { fontSize: 9, fontWeight: '800', color: Colors.gray },
  lateTxtActive:{ color: '#D97706' },
  presentBtn:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  presentBtnOn:     { backgroundColor: GREEN },
  presentBtnOff:    { backgroundColor: Colors.surf, borderWidth: 1, borderColor: Colors.light },
  presentBtnAbsent: { backgroundColor: '#EF4444' },

  submittedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: GREEN, paddingVertical: 10 },
  submittedBannerTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },

  submitRow:    { padding: 14, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.light },
  submitBtn:    { backgroundColor: GREEN, borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
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

  fieldLabel:   { fontSize: 11, fontWeight: '700', color: Colors.gray, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },

  playerPickerToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.light, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.surf, marginBottom: 4 },
  playerPickerTxt:    { flex: 1, fontSize: 14, color: Colors.gray },
  playerPickerList:   { borderWidth: 1, borderColor: Colors.light, borderRadius: 10, overflow: 'hidden', marginBottom: 4 },
  playerPickerRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: Colors.light },
  playerPickerRowActive: { backgroundColor: GREEN + '0D' },
  playerPickerName:   { fontSize: 14, color: Colors.black },

  subPillRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  subPill:      { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.light, backgroundColor: Colors.surf },
  subPillActive:      { backgroundColor: '#D97706', borderColor: '#D97706' },
  subPillInjuryActive: { backgroundColor: Colors.red, borderColor: Colors.red },
  subPillSeverity:    {},
  subPillSevLeve:     { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  subPillSevMod:      { backgroundColor: '#D97706', borderColor: '#D97706' },
  subPillSevGrave:    { backgroundColor: Colors.red, borderColor: Colors.red },
  subPillTxt:   { fontSize: 12, fontWeight: '700', color: Colors.gray },

  incidentCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.surf, borderRadius: 10, padding: 12, marginBottom: 8 },
  incidentDot:  { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  incidentTitle: { fontSize: 13, fontWeight: '700', color: Colors.black },
  incidentSub:  { fontSize: 11, color: Colors.gray, marginTop: 1 },
  incidentNotes: { fontSize: 11, color: Colors.gray, marginTop: 3, fontStyle: 'italic' },
  incidentType: { fontSize: 9, fontWeight: '800', color: Colors.gray },

  emptyBox:     { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTxt:     { fontSize: 13, color: Colors.gray },

  sessionCodeBar:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.surf, borderBottomWidth: 1, borderBottomColor: Colors.light },
  sessionCodeBarTxt: { fontSize: 10, fontWeight: '600', color: Colors.gray, letterSpacing: 1 },

  nominaToggle:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: GREEN + '0A', borderBottomWidth: 1, borderBottomColor: Colors.light },
  nominaToggleTxt:  { flex: 1, fontSize: 13, fontWeight: '700', color: GREEN },
  nominaList:       { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.light },
  nominaRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.light },
  nominaAvatar:     { width: 32, height: 32, borderRadius: 16, backgroundColor: GREEN + '12', alignItems: 'center', justifyContent: 'center' },
  nominaAvatarTxt:  { fontSize: 11, fontWeight: '800', color: GREEN },
  nominaPlayerName: { fontSize: 13, fontWeight: '700', color: Colors.black },
  nominaPlayerMeta: { fontSize: 11, color: Colors.gray, marginTop: 1 },
  nominaBadge:      { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  nominaBadgeTxt:   { fontSize: 10, fontWeight: '800' },
});
