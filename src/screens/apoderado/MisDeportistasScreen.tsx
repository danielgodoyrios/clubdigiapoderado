import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { Pupil } from '../../api';

const BLUE = Colors.blue;

function calcEdad(birth: string | null | undefined): string | null {
  if (!birth) return null;
  const b = new Date(birth);
  if (isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return `${age} años`;
}

export default function MisDeportistasScreen({ navigation }: any) {
  const { state, setActivePupil } = useAuth();
  const pupils: Pupil[] = state.status === 'authenticated' ? state.pupils : [];
  const activePupil     = state.status === 'authenticated' ? state.activePupil : null;

  const openPerfil = (pupil: Pupil) => {
    setActivePupil(pupil);
    navigation.navigate('PupilPerfil', { pupil });
  };

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
        <View style={styles.headerTitle}>
          <Text style={styles.pageTitle}>Mis Deportistas</Text>
          <Text style={styles.pageSub}>{pupils.length} vinculado{pupils.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {pupils.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={Colors.light} />
            <Text style={styles.emptyTxt}>Sin deportistas vinculados</Text>
            <TouchableOpacity
              style={styles.enrollBtn}
              onPress={() => navigation.navigate('Enrollment')}
            >
              <Text style={styles.enrollTxt}>Agregar deportista</Text>
            </TouchableOpacity>
          </View>
        ) : (
          pupils.map((pupil) => {
            const initials = pupil.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
            const isActive = activePupil?.id === pupil.id;
            const edad     = calcEdad(pupil.birth_date);
            const federado = pupil.federado;

            return (
              <TouchableOpacity
                key={pupil.id}
                style={[styles.card, isActive && styles.cardActive]}
                onPress={() => openPerfil(pupil)}
                activeOpacity={0.85}
              >
                {/* Avatar */}
                <View style={styles.avatarWrap}>
                  {pupil.photo
                    ? <Image source={{ uri: pupil.photo }} style={styles.avatarImg} />
                    : (
                      <View style={[styles.avatarPlaceholder, isActive && { backgroundColor: BLUE }]}>
                        <Text style={[styles.avatarTxt, isActive && { color: '#fff' }]}>{initials}</Text>
                      </View>
                    )
                  }
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: pupil.status === 'active' || pupil.status === 'federado' ? Colors.ok : Colors.amber },
                  ]} />
                </View>

                {/* Info */}
                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{pupil.name}</Text>
                    {isActive && (
                      <View style={styles.activePill}>
                        <Text style={styles.activePillTxt}>Activo</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.meta} numberOfLines={1}>
                    {[pupil.category, pupil.team].filter(Boolean).join(' · ') || 'Sin categoría'}
                  </Text>
                  <View style={styles.tagsRow}>
                    {edad && (
                      <View style={styles.tag}>
                        <Ionicons name="person-outline" size={10} color={Colors.gray} />
                        <Text style={styles.tagTxt}>{edad}</Text>
                      </View>
                    )}
                    {federado !== null && (
                      <View style={[styles.tag, { backgroundColor: federado ? Colors.ok + '18' : Colors.amber + '18' }]}>
                        <Ionicons
                          name={federado ? 'shield-checkmark' : 'shield-outline'}
                          size={10}
                          color={federado ? Colors.ok : Colors.amber}
                        />
                        <Text style={[styles.tagTxt, { color: federado ? Colors.ok : Colors.amber }]}>
                          {federado ? 'Federado' : 'No federado'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.tag}>
                      <Text style={styles.tagTxt}>{pupil.rut}</Text>
                    </View>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={16} color={Colors.light} />
              </TouchableOpacity>
            );
          })
        )}

        {/* Agregar más */}
        {pupils.length > 0 && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('Enrollment')}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={18} color={BLUE} />
            <Text style={styles.addTxt}>Agregar otro deportista</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: Colors.surf },
  topRow:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  logo:               { flexDirection: 'row', alignItems: 'baseline' },
  logoI:              { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:              { fontSize: 14, fontWeight: '800', color: '#fff' },
  ic:                 { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:        { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 4 },
  pageTitle:          { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  pageSub:            { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  body:               { flex: 1, paddingHorizontal: 14, paddingTop: 14 },
  empty:              { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTxt:           { fontSize: 15, fontWeight: '600', color: Colors.gray },
  enrollBtn:          { backgroundColor: BLUE, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28, marginTop: 8 },
  enrollTxt:          { color: '#fff', fontWeight: '700', fontSize: 14 },
  card:               { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.light, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  cardActive:         { borderColor: BLUE + '40', backgroundColor: BLUE + '06' },
  avatarWrap:         { position: 'relative' },
  avatarImg:          { width: 54, height: 54, borderRadius: 27 },
  avatarPlaceholder:  { width: 54, height: 54, borderRadius: 27, backgroundColor: BLUE + '15', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:          { fontSize: 18, fontWeight: '800', color: BLUE },
  statusDot:          { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: Colors.white },
  info:               { flex: 1, gap: 3 },
  nameRow:            { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name:               { fontSize: 15, fontWeight: '700', color: Colors.black, flex: 1 },
  activePill:         { backgroundColor: BLUE, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  activePillTxt:      { fontSize: 9, fontWeight: '700', color: '#fff' },
  meta:               { fontSize: 11, color: Colors.gray },
  tagsRow:            { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 },
  tag:                { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surf, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tagTxt:             { fontSize: 9, fontWeight: '600', color: Colors.gray },
  addBtn:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: BLUE + '40', borderStyle: 'dashed', marginTop: 4 },
  addTxt:             { fontSize: 14, fontWeight: '600', color: BLUE },
});
