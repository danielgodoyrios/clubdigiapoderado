import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { CarnetIcon } from '../../components/CarnetIcon';
import { CarnetModal } from '../../components/CarnetModal';
import { Events, Event } from '../../api';
import { useAuth } from '../../context/AuthContext';
import SideMenu from '../../components/SideMenu';

const BLUE = Colors.blue;
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS   = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];

function buildWeek(base: Date) {
  const week = [];
  const dow  = base.getDay();
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() - dow + i);
    week.push(d);
  }
  return week;
}

function fmtDate(d: Date) { return d.toISOString().slice(0, 10); }

export default function AgendaScreen() {
  const { state } = useAuth();
  const pupil   = state.status === 'authenticated' ? state.activePupil : null;
  const pupilId = pupil?.id;

  const [carnetVisible, setCarnetVisible] = useState(false);  const [menuVisible,   setMenuVisible]   = useState(false);  const today   = new Date();
  const [base,    setBase]    = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [events,  setEvents]  = useState<Event[]>([]);

  const week    = buildWeek(base);
  const selStr  = fmtDate(selected);
  const todayStr = fmtDate(today);
  const dayEvents = events.filter(e => e.date === selStr);

  useEffect(() => {
    if (!pupilId) return;
    const weekStart = buildWeek(base);
    const from = fmtDate(weekStart[0]);
    const to   = fmtDate(weekStart[6]);
    Events.list(pupilId, from, to).then(setEvents).catch(() => {});
  }, [pupilId, fmtDate(base)]);

  const prevWeek = () => { const d = new Date(base); d.setDate(d.getDate() - 7); setBase(d); };
  const nextWeek = () => { const d = new Date(base); d.setDate(d.getDate() + 7); setBase(d); };

  return (
    <SafeAreaView style={styles.safe}>
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} navigation={navigation} />
      {/* ── Header ── */}
      <View style={{ backgroundColor: BLUE }}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.ic} onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={22} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
          <View style={styles.logo}>
            <Text style={styles.logoI}>CLUB</Text>
            <Text style={styles.logoB}>DIGI</Text>
          </View>
          <View style={styles.hIcons}>
            <TouchableOpacity style={styles.ic}>
              <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
            <CarnetIcon onPress={() => setCarnetVisible(true)} headerColor={BLUE} />
          </View>
        </View>

        {/* Month nav */}
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={prevWeek} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <Text style={styles.monthTxt}>{MONTHS[base.getMonth()]} {base.getFullYear()}</Text>
          <TouchableOpacity onPress={nextWeek} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* Week strip */}
        <View style={styles.weekRow}>
          {week.map((d, i) => {
            const ds      = fmtDate(d);
            const isSel   = ds === selStr;
            const isToday = ds === todayStr;
            const hasEv   = events.some(e => e.date === ds);
            return (
              <TouchableOpacity key={i} style={styles.dayCol} onPress={() => setSelected(new Date(d))}>
                <Text style={[styles.dayShort, isSel && styles.dayShortSel]}>{DAYS[d.getDay()]}</Text>
                <View style={[styles.dayNum, isSel && styles.dayNumSel, isToday && !isSel && styles.dayNumToday]}>
                  <Text style={[styles.dayNumTxt, isSel && { color: BLUE, fontWeight: '800' }]}>{d.getDate()}</Text>
                </View>
                {hasEv && <View style={[styles.evDot, { backgroundColor: isSel ? '#fff' : 'rgba(255,255,255,0.45)' }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLbl}>
          {selStr === todayStr ? 'HOY' : `${selStr.slice(8,10)}/${selStr.slice(5,7)}`}
        </Text>

        {dayEvents.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={34} color={Colors.light} />
            <Text style={styles.emptyTxt}>Sin eventos este día</Text>
          </View>
        ) : dayEvents.map(ev => (
          <View key={ev.id} style={styles.card}>
            <View style={[styles.accent, { backgroundColor: ev.type === 'match' ? BLUE : Colors.ok }]} />
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <View style={[styles.typeTag, { backgroundColor: ev.type === 'match' ? BLUE + '22' : Colors.ok + '22' }]}>
                  <Text style={[styles.typeTxt, { color: ev.type === 'match' ? BLUE : Colors.green }]}>
                    {ev.type === 'match' ? 'PARTIDO' : 'ENTRENAMIENTO'}
                  </Text>
                </View>
                <Text style={styles.cardTime}>{ev.time}</Text>
              </View>
              <Text style={styles.cardTitle}>{ev.title}</Text>
              <Text style={styles.cardMeta}>📍 {ev.venue}{(ev as any).league ? ' · ' + (ev as any).league : ''}</Text>
            </View>
          </View>
        ))}

        {/* Upcoming */}
        <Text style={[styles.sectionLbl, { marginTop: 18 }]}>PRÓXIMOS EVENTOS</Text>
        {events.filter(e => e.date > selStr).slice(0, 4).map(ev => (
          <View key={ev.id} style={styles.card}>
            <View style={[styles.accent, { backgroundColor: ev.type === 'match' ? BLUE : Colors.ok }]} />
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{ev.title}</Text>
                <Text style={styles.cardTime}>{ev.date.slice(8,10)}/{ev.date.slice(5,7)}</Text>
              </View>
              <Text style={styles.cardMeta}>{ev.time} · 📍 {ev.venue}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 28 }} />
      </ScrollView>

      <CarnetModal
        visible={carnetVisible}
        onClose={() => setCarnetVisible(false)}
        role="jugador"
        name={pupil ? pupil.name : ''}
        initials={pupil ? pupil.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : ''}
        licenseId={pupil?.rut ?? ''}
        headerColor={BLUE}
        position={pupil ? pupil.category : ''}
        club={pupil?.team ?? ''}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.surf },
  topRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  logo:        { flexDirection: 'row', alignItems: 'baseline' },
  logoI:       { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:       { fontSize: 14, fontWeight: '800', color: '#fff' },
  hIcons:      { flexDirection: 'row', gap: 4, alignItems: 'center' },
  ic:          { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  monthRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 8 },
  navBtn:      { padding: 4 },
  monthTxt:    { fontSize: 13, fontWeight: '700', color: '#fff' },
  weekRow:     { flexDirection: 'row', paddingHorizontal: 10, paddingBottom: 14, paddingTop: 2 },
  dayCol:      { flex: 1, alignItems: 'center', gap: 4 },
  dayShort:    { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.3 },
  dayShortSel: { color: '#fff' },
  dayNum:      { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dayNumSel:   { backgroundColor: '#fff' },
  dayNumToday: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },
  dayNumTxt:   { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
  evDot:       { width: 4, height: 4, borderRadius: 2 },
  body:        { flex: 1, paddingHorizontal: 14 },
  sectionLbl:  { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Colors.gray, marginTop: 14, marginBottom: 8 },
  card:        { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.light, flexDirection: 'row', overflow: 'hidden', marginBottom: 8 },
  accent:      { width: 4 },
  cardBody:    { flex: 1, padding: 12 },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  typeTag:     { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  typeTxt:     { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  cardTime:    { fontSize: 11, fontWeight: '700', color: Colors.gray },
  cardTitle:   { fontSize: 13, fontWeight: '700', color: Colors.black },
  cardMeta:    { fontSize: 10, color: Colors.gray, marginTop: 3 },
  empty:       { alignItems: 'center', paddingVertical: 44, gap: 8 },
  emptyTxt:    { fontSize: 12, color: Colors.gray },
});
