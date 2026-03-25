import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue;

export default function PerfilScreen({ navigation }: any) {
  const { state } = useAuth();
  const user   = state.status === 'authenticated' ? state.user : null;
  const pupils = state.status === 'authenticated' ? state.pupils : [];
  if (!user) return null;

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

        {/* Apoderado avatar */}
        <View style={styles.apodRow}>
          <View style={styles.apodAvatar}>
            <Text style={styles.apodAvatarTxt}>{user.initials}</Text>
          </View>
          <View>
            <Text style={styles.apodName}>{user.name}</Text>
            <Text style={styles.apodMeta}>Apoderado · {user.rut}</Text>
            <Text style={styles.apodPhone}>{user.phone}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Apoderado data */}
        <Text style={styles.sectionLbl}>MIS DATOS</Text>
        <View style={styles.card}>
          {[
            { label: 'Nombre',   value: user.name },
            { label: 'RUT',      value: user.rut },
            { label: 'Teléfono', value: user.phone },
            { label: 'Email',    value: user.email },
          ].map((r, i) => (
            <View key={i} style={[styles.row, i > 0 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.rowValue}>{r.value}</Text>
            </View>
          ))}
        </View>

        {/* Pupilos */}
        <Text style={[styles.sectionLbl, { marginTop: 16 }]}>MIS PUPILOS</Text>
        {pupils.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={styles.pupilCard}
            onPress={() => navigation.navigate('EditarPupilo', { pupil: p })}
            activeOpacity={0.85}
          >
            <View style={styles.pupilAvatar}>
              <Text style={styles.pupilAvatarTxt}>{p.initials}</Text>
              <View style={styles.pupilDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pupilName}>{p.name}</Text>
              <Text style={styles.pupilMeta}>{p.category} · #{p.number} · {p.club}</Text>
              <Text style={styles.pupilLic}>{p.license_id}</Text>
            </View>
            <Ionicons name="create-outline" size={16} color={BLUE} />
          </TouchableOpacity>
        ))}

        {/* Config shortcut */}
        <Text style={[styles.sectionLbl, { marginTop: 16 }]}>CUENTA</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('Configuracion')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={16} color={Colors.gray} style={{ marginRight: 4 }} />
            <Text style={[styles.rowLabel, { flex: 1 }]}>Configuración</Text>
            <Ionicons name="chevron-forward" size={15} color={Colors.light} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 28 }} />
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
  ic:             { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  apodRow:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingBottom: 16, paddingTop: 10 },
  apodAvatar:     { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  apodAvatarTxt:  { fontSize: 18, fontWeight: '800', color: '#fff' },
  apodName:       { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  apodMeta:       { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  apodPhone:      { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  body:           { flex: 1, paddingHorizontal: 14 },
  sectionLbl:     { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Colors.gray, marginTop: 14, marginBottom: 7 },
  card:           { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.light, overflow: 'hidden' },
  row:            { flexDirection: 'row', alignItems: 'center', padding: 13 },
  rowBorder:      { borderTopWidth: 1, borderTopColor: Colors.surf },
  rowLabel:       { fontSize: 12, color: Colors.gray, minWidth: 80 },
  rowValue:       { fontSize: 13, fontWeight: '600', color: Colors.black },
  pupilCard:      { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.light, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, marginBottom: 8 },
  pupilAvatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: BLUE + '15', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  pupilAvatarTxt: { fontSize: 14, fontWeight: '800', color: BLUE },
  pupilDot:       { position: 'absolute', bottom: -1, right: -1, width: 11, height: 11, borderRadius: 6, backgroundColor: Colors.ok, borderWidth: 2, borderColor: Colors.white },
  pupilName:      { fontSize: 14, fontWeight: '700', color: Colors.black },
  pupilMeta:      { fontSize: 10, color: Colors.gray, marginTop: 2 },
  pupilLic:       { fontSize: 9, color: Colors.gray, marginTop: 2, fontWeight: '600' },
});
