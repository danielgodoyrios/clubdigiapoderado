import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue;

export default function PupilSelectorScreen({ navigation }: any) {
  const { state, setActivePupil } = useAuth();
  const [selected, setSelected] = useState<number | null>(null);

  const pupils = state.status === 'authenticated' ? state.pupils : [];
  const userName = state.status === 'authenticated' ? state.user.name : '';

  const handleEnter = () => {
    const pupil = pupils.find(p => p.id === selected);
    if (pupil) {
      setActivePupil(pupil);
      navigation.replace('AppTabs');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoI}>CLUB</Text>
          <Text style={styles.logoB}>DIGI</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.greeting}>Hola, {userName}</Text>
        <Text style={styles.title}>¿Quién veremos hoy?</Text>
        <Text style={styles.sub}>Selecciona un pupilo para continuar.</Text>

        <FlatList
          data={pupils}
          keyExtractor={p => String(p.id)}
          contentContainerStyle={{ gap: 10, marginTop: 20 }}
          renderItem={({ item }) => {
            const sel = selected === item.id;
            return (
              <TouchableOpacity
                style={[styles.card, sel && styles.cardSel]}
                onPress={() => setSelected(item.id)}
                activeOpacity={0.85}
              >
                <View style={[styles.avatar, sel && styles.avatarSel]}>
                  <Text style={[styles.avatarTxt, sel && { color: BLUE }]}>
                    {item.name.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}
                  </Text>
                  <View style={styles.dot} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>{item.category} · {item.team}</Text>
                </View>
                <View style={[styles.check, sel && styles.checkSel]}>
                  {sel && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        <TouchableOpacity
          style={[styles.btn, !selected && styles.btnDisabled]}
          onPress={handleEnter}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <Text style={styles.btnTxt}>Entrar</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.surf },
  header:     { backgroundColor: BLUE, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 22 },
  logo:       { flexDirection: 'row', alignItems: 'baseline' },
  logoI:      { fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:      { fontSize: 16, fontWeight: '800', color: '#fff' },
  body:       { flex: 1, padding: 24, paddingTop: 30 },
  greeting:   { fontSize: 13, color: Colors.gray, marginBottom: 4 },
  title:      { fontSize: 26, fontWeight: '800', color: Colors.black, letterSpacing: -0.5, marginBottom: 6 },
  sub:        { fontSize: 13, color: Colors.gray },
  card:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 2, borderColor: Colors.light },
  cardSel:    { borderColor: BLUE },
  avatar:     { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.light, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarSel:  { backgroundColor: BLUE + '18' },
  avatarTxt:  { fontSize: 16, fontWeight: '800', color: Colors.black },
  dot:        { position: 'absolute', bottom: -1, right: -1, width: 13, height: 13, borderRadius: 7, backgroundColor: Colors.ok, borderWidth: 2, borderColor: Colors.white },
  name:       { fontSize: 15, fontWeight: '700', color: Colors.black },
  meta:       { fontSize: 11, color: Colors.gray, marginTop: 2 },
  check:      { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.light, alignItems: 'center', justifyContent: 'center' },
  checkSel:   { backgroundColor: BLUE, borderColor: BLUE },
  btn:        { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  btnDisabled:{ opacity: 0.4 },
  btnTxt:     { fontSize: 15, fontWeight: '700', color: '#fff' },
});
