import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Events, Event, RosterPlayer } from '../../api';
import { useAuth } from '../../context/AuthContext';

const BLUE  = Colors.blue;
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fmtDateLong(dateStr: string): string {
  const [, mm, dd] = dateStr.split('-');
  return `${parseInt(dd)} ${MONTHS_SHORT[parseInt(mm) - 1]}`;
}

function getTypeLabel(type: string) {
  if (type === 'match')    return 'PARTIDO';
  if (type === 'training') return 'ENTRENAMIENTO';
  return 'EVENTO';
}

function getTypeColor(type: string) {
  if (type === 'match')    return BLUE;
  if (type === 'training') return Colors.green;
  return Colors.amber;
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  const cfg: Record<string, { label: string; bg: string; color: string; icon: string }> = {
    confirmed: { label: 'Confirmado',  bg: Colors.ok + '22',    color: Colors.green, icon: 'checkmark-circle' },
    pending:   { label: 'Pendiente',   bg: Colors.amber + '22', color: Colors.amber, icon: 'time-outline' },
    declined:  { label: 'No asistirá', bg: Colors.red + '22',   color: Colors.red,   icon: 'close-circle' },
  };
  const c = cfg[status] ?? cfg.pending;
  return (
    <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
      <Ionicons name={c.icon as any} size={14} color={c.color} />
      <Text style={[styles.statusLbl, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

function PlayerRow({ player }: { player: RosterPlayer }) {
  const initials = player.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const statusColor = player.status === 'confirmed' ? Colors.ok
    : player.status === 'declined' ? Colors.red : Colors.amber;

  return (
    <View style={styles.playerRow}>
      <View style={styles.avatarWrap}>
        {player.photo ? (
          <Image source={{ uri: player.photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
        {player.position && (
          <Text style={styles.playerMeta}>{player.position}</Text>
        )}
      </View>
      {player.number != null && (
        <View style={styles.numberBadge}>
          <Text style={styles.numberTxt}>#{player.number}</Text>
        </View>
      )}
      <StatusBadge status={player.status} />
    </View>
  );
}

export default function EventoDetalleScreen({ route, navigation }: any) {
  const { event: eventParam, pupilId: paramPupilId } = route.params as { event: Event; pupilId?: number };
  const { state } = useAuth();
  const pupil = state.status === 'authenticated' ? state.activePupil : null;
  const pupilId = paramPupilId ?? pupil?.id;

  const [event,   setEvent]   = useState<Event>(eventParam);
  const [roster,  setRoster]  = useState<RosterPlayer[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [responding,    setResponding]    = useState(false);
  const [myStatus, setMyStatus] = useState<'confirmed' | 'pending' | 'declined' | null>(
    eventParam.my_status ?? null,
  );

  const typeColor = getTypeColor(event.type);
  const isMatch = event.type === 'match';

  useEffect(() => {
    if (!pupilId) return;
    // Refresh event detail
    Events.detail(pupilId, event.id)
      .then(ev => { setEvent(ev); setMyStatus(ev.my_status ?? null); })
      .catch(() => {});

    // Load roster
    setLoadingRoster(true);
    Events.roster(event.id)
      .then(r => setRoster(r))
      .catch(() => setRoster([]))
      .finally(() => setLoadingRoster(false));
  }, [event.id, pupilId]);

  const respond = useCallback(async (status: 'confirmed' | 'declined') => {
    if (!pupilId) return;
    setResponding(true);
    try {
      await Events.respond(event.id, pupilId, status);
      setMyStatus(status);
      setRoster(prev => prev.map(p => p.id === pupilId ? { ...p, status } : p));
    } catch {
      Alert.alert('Error', 'No se pudo registrar tu respuesta. Intenta de nuevo.');
    } finally {
      setResponding(false);
    }
  }, [event.id, pupilId]);

  const confirmed = roster.filter(p => p.status === 'confirmed');
  const pending   = roster.filter(p => p.status === 'pending');
  const declined  = roster.filter(p => p.status === 'declined');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header azul ── */}
      <View style={[styles.header, { backgroundColor: typeColor }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Tipo badge */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeTxt}>{getTypeLabel(event.type)}</Text>
        </View>

        {/* Fecha y hora */}
        <Text style={styles.headerDate}>
          {event.date ? fmtDateLong(event.date) : '—'}
          {event.time ? `  ·  ${event.time}` : ''}
        </Text>

        {/* VS / Título */}
        {isMatch && event.home_team && event.away_team ? (
          <View style={styles.vsRow}>
            <Text style={styles.teamTxt} numberOfLines={2}>{event.home_team}</Text>
            <View style={styles.vsBubble}><Text style={styles.vsTxt}>VS</Text></View>
            <Text style={styles.teamTxt} numberOfLines={2}>{event.away_team}</Text>
          </View>
        ) : (
          <Text style={styles.eventTitle}>{event.title}</Text>
        )}

        {/* Venue */}
        {(event.venue ?? event.location) && (
          <View style={styles.venueRow}>
            <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.7)" />
            <Text style={styles.venueTxt}>{event.venue ?? event.location}</Text>
          </View>
        )}
        {event.league && (
          <View style={styles.venueRow}>
            <Ionicons name="trophy-outline" size={13} color="rgba(255,255,255,0.7)" />
            <Text style={styles.venueTxt}>{event.league}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

        {/* ── Convocatoria ── */}
        {myStatus !== null && (
          <View style={styles.section}>
            <Text style={styles.sectionLbl}>MI CONVOCATORIA</Text>
            <View style={styles.card}>
              <View style={styles.convRow}>
                <View style={styles.convLeft}>
                  <Ionicons
                    name={myStatus === 'confirmed' ? 'checkmark-circle' : myStatus === 'declined' ? 'close-circle' : 'time-outline'}
                    size={28}
                    color={myStatus === 'confirmed' ? Colors.ok : myStatus === 'declined' ? Colors.red : Colors.amber}
                  />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.convTitle}>
                      {myStatus === 'confirmed' ? '¡Estás convocado/a!' : myStatus === 'declined' ? 'Declinaste la convocatoria' : 'Convocatoria pendiente'}
                    </Text>
                    <Text style={styles.convSub}>
                      {myStatus === 'confirmed' ? 'Has confirmado tu asistencia' : myStatus === 'declined' ? 'No asistirás a este evento' : 'Confirma si podrás asistir'}
                    </Text>
                  </View>
                </View>
              </View>

              {(myStatus === 'pending' || myStatus === 'confirmed' || myStatus === 'declined') && (
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.respondBtn, styles.confirmBtn, myStatus === 'confirmed' && styles.btnActive]}
                    onPress={() => respond('confirmed')}
                    disabled={responding || myStatus === 'confirmed'}
                    activeOpacity={0.8}
                  >
                    {responding && myStatus !== 'confirmed' ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-outline" size={16} color="#fff" />
                        <Text style={styles.btnTxt}>Confirmar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.respondBtn, styles.declineBtn, myStatus === 'declined' && styles.btnActiveRed]}
                    onPress={() => respond('declined')}
                    disabled={responding || myStatus === 'declined'}
                    activeOpacity={0.8}
                  >
                    {responding && myStatus !== 'declined' ? (
                      <ActivityIndicator size="small" color={Colors.red} />
                    ) : (
                      <>
                        <Ionicons name="close-outline" size={16} color={myStatus === 'declined' ? '#fff' : Colors.red} />
                        <Text style={[styles.btnTxt, { color: myStatus === 'declined' ? '#fff' : Colors.red }]}>No puedo</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Nómina ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLbl}>NÓMINA</Text>
            {roster.length > 0 && (
              <Text style={styles.rosterCount}>{confirmed.length}/{roster.length} confirmados</Text>
            )}
          </View>

          {loadingRoster ? (
            <View style={styles.center}>
              <ActivityIndicator color={BLUE} />
            </View>
          ) : roster.length === 0 ? (
            <View style={[styles.card, styles.center, { paddingVertical: 28 }]}>
              <Ionicons name="people-outline" size={30} color={Colors.light} />
              <Text style={styles.emptyTxt}>Nómina no disponible</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {confirmed.length > 0 && (
                <>
                  <View style={styles.groupHeader}>
                    <View style={[styles.groupDot, { backgroundColor: Colors.ok }]} />
                    <Text style={styles.groupLbl}>Confirmados ({confirmed.length})</Text>
                  </View>
                  {confirmed.map(p => <PlayerRow key={p.id} player={p} />)}
                </>
              )}
              {pending.length > 0 && (
                <>
                  <View style={[styles.groupHeader, { marginTop: confirmed.length > 0 ? 12 : 0 }]}>
                    <View style={[styles.groupDot, { backgroundColor: Colors.amber }]} />
                    <Text style={styles.groupLbl}>Pendientes ({pending.length})</Text>
                  </View>
                  {pending.map(p => <PlayerRow key={p.id} player={p} />)}
                </>
              )}
              {declined.length > 0 && (
                <>
                  <View style={[styles.groupHeader, { marginTop: (confirmed.length + pending.length) > 0 ? 12 : 0 }]}>
                    <View style={[styles.groupDot, { backgroundColor: Colors.red }]} />
                    <Text style={styles.groupLbl}>No asisten ({declined.length})</Text>
                  </View>
                  {declined.map(p => <PlayerRow key={p.id} player={p} />)}
                </>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.surf },
  header:       { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: -8, marginBottom: 8 },
  typeBadge:    { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 8 },
  typeTxt:      { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 1.2 },
  headerDate:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginBottom: 14 },
  vsRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  teamTxt:      { flex: 1, fontSize: 16, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 22 },
  vsBubble:     { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  vsTxt:        { fontSize: 11, fontWeight: '900', color: '#fff' },
  eventTitle:   { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 14, lineHeight: 24 },
  venueRow:     { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  venueTxt:     { fontSize: 12, color: 'rgba(255,255,255,0.7)', flex: 1 },

  body:         { flex: 1 },
  section:      { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionLbl:   { fontSize: 10, fontWeight: '800', color: Colors.gray, letterSpacing: 1.2 },
  rosterCount:  { fontSize: 11, fontWeight: '700', color: Colors.green },
  card:         { backgroundColor: Colors.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  center:       { alignItems: 'center', justifyContent: 'center' },
  emptyTxt:     { marginTop: 8, color: Colors.gray, fontSize: 13 },

  // Convocatoria
  convRow:      { flexDirection: 'row', alignItems: 'center' },
  convLeft:     { flexDirection: 'row', alignItems: 'center', flex: 1 },
  convTitle:    { fontSize: 14, fontWeight: '700', color: Colors.black },
  convSub:      { fontSize: 12, color: Colors.gray, marginTop: 2 },
  btnRow:       { flexDirection: 'row', gap: 10, marginTop: 14 },
  respondBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 11 },
  confirmBtn:   { backgroundColor: Colors.ok },
  declineBtn:   { backgroundColor: Colors.red + '15', borderWidth: 1.5, borderColor: Colors.red },
  btnActive:    { opacity: 0.7 },
  btnActiveRed: { backgroundColor: Colors.red },
  btnTxt:       { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Status badge
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  statusLbl:    { fontSize: 10, fontWeight: '700' },

  // Player row
  playerRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: Colors.light },
  avatarWrap:   { position: 'relative', marginRight: 10 },
  avatar:       { width: 38, height: 38, borderRadius: 19 },
  avatarFallback: { backgroundColor: Colors.blue + '22', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 13, fontWeight: '800', color: Colors.blue },
  statusDot:    { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: Colors.white },
  playerInfo:   { flex: 1 },
  playerName:   { fontSize: 13, fontWeight: '700', color: Colors.black },
  playerMeta:   { fontSize: 11, color: Colors.gray, marginTop: 1 },
  numberBadge:  { backgroundColor: Colors.surf, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 },
  numberTxt:    { fontSize: 11, fontWeight: '700', color: Colors.mid },

  // Roster groups
  groupHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  groupDot:     { width: 7, height: 7, borderRadius: 4 },
  groupLbl:     { fontSize: 11, fontWeight: '700', color: Colors.gray },
});
