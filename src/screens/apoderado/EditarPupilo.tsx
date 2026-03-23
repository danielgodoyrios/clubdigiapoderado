import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

const BLUE = Colors.blue;

export default function EditarPupilo({ navigation, route }: any) {
  const { pupil } = route.params ?? {
    pupil: { id: 'pup_001', name: 'Carlos Muñoz Jr.', initials: 'CM', number: 8, category: 'Alevín', club: 'C.D. Santo Domingo', licenseId: 'LIC-2026-0892' },
  };

  const [name,     setName]     = useState(pupil.name);
  const [number,   setNumber]   = useState(String(pupil.number));
  const [category, setCategory] = useState(pupil.category);

  const handleSave = () => {
    Alert.alert('Guardado', 'Los datos del pupilo fueron actualizados.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
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
          <Text style={styles.pageTitle}>Editar Pupilo</Text>
          <Text style={styles.pageSub}>{pupil.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{pupil.initials}</Text>
            <View style={styles.avatarDot} />
          </View>
          <Text style={styles.licenseId}>{pupil.licenseId}</Text>
        </View>

        {/* Form */}
        <Text style={styles.sectionLbl}>DATOS DEL PUPILO</Text>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nombre completo</Text>
            <TextInput
              style={styles.fieldInput}
              value={name}
              onChangeText={setName}
              placeholder="Nombre completo"
              placeholderTextColor={Colors.gray}
            />
          </View>
          <View style={[styles.field, styles.fieldBorder]}>
            <Text style={styles.fieldLabel}>Número de camiseta</Text>
            <TextInput
              style={styles.fieldInput}
              value={number}
              onChangeText={setNumber}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
          <View style={[styles.field, styles.fieldBorder]}>
            <Text style={styles.fieldLabel}>Categoría</Text>
            <TextInput
              style={styles.fieldInput}
              value={category}
              onChangeText={setCategory}
            />
          </View>
          <View style={[styles.field, styles.fieldBorder]}>
            <Text style={styles.fieldLabel}>Club</Text>
            <Text style={styles.fieldReadOnly}>{pupil.club}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Ionicons name="checkmark-outline" size={18} color="#fff" />
          <Text style={styles.saveBtnTxt}>Guardar cambios</Text>
        </TouchableOpacity>

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.surf },
  topRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  logo:          { flexDirection: 'row', alignItems: 'baseline' },
  logoI:         { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:         { fontSize: 14, fontWeight: '800', color: '#fff' },
  ic:            { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 16 },
  pageTitle:     { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  pageSub:       { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  body:          { flex: 1, paddingHorizontal: 14 },
  avatarWrap:    { alignItems: 'center', paddingVertical: 20, gap: 6 },
  avatar:        { width: 68, height: 68, borderRadius: 34, backgroundColor: BLUE + '18', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarTxt:     { fontSize: 22, fontWeight: '800', color: BLUE },
  avatarDot:     { position: 'absolute', bottom: -1, right: -1, width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.ok, borderWidth: 2, borderColor: Colors.surf },
  licenseId:     { fontSize: 10, color: Colors.gray, fontWeight: '600', letterSpacing: 0.5 },
  sectionLbl:    { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Colors.gray, marginBottom: 7 },
  card:          { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.light, overflow: 'hidden', marginBottom: 14 },
  field:         { padding: 13 },
  fieldBorder:   { borderTopWidth: 1, borderTopColor: Colors.surf },
  fieldLabel:    { fontSize: 10, color: Colors.gray, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  fieldInput:    { fontSize: 15, fontWeight: '600', color: Colors.black },
  fieldReadOnly: { fontSize: 15, fontWeight: '600', color: Colors.gray },
  saveBtn:       { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnTxt:    { fontSize: 15, fontWeight: '700', color: '#fff' },
});
