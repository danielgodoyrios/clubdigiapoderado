import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, ScrollView,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme';

const { width } = Dimensions.get('window');
const BLUE = Colors.blue;

const SLIDES = [
  {
    icon:  'shield-checkmark-outline' as const,
    title: 'Bienvenido a\nClubDigi',
    desc:  'Tu portal digital como apoderado. Sigue a tus pupilos desde un solo lugar, en cualquier momento.',
  },
  {
    icon:  'clipboard-outline' as const,
    title: 'Asistencia\ny Pagos',
    desc:  'Consulta la asistencia mensual y el estado de cuotas de cada pupilo en tiempo real.',
  },
  {
    icon:  'chatbubble-ellipses-outline' as const,
    title: 'Comunicación\nDirecta',
    desc:  'Recibe comunicados del club, firma documentos digitales y accede al carnet QR del jugador.',
  },
];

export default function WelcomeScreen({ navigation }: any) {
  const [page, setPage]   = useState(0);
  const scrollRef         = useRef<ScrollView>(null);

  const goNext = async () => {
    if (page < SLIDES.length - 1) {
      const next = page + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setPage(next);
    } else {
      await AsyncStorage.setItem('onboarding_seen', '1');
      navigation.replace('Phone');
    }
  };

  const skip = async () => {
    await AsyncStorage.setItem('onboarding_seen', '1');
    navigation.replace('Phone');
  };

  return (
    <View style={styles.wrap}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />

      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={skip}>
        <Text style={styles.skipTxt}>Saltar</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1, width }}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={styles.slide}>
            <View style={styles.iconWrap}>
              <Ionicons name={s.icon} size={68} color="rgba(255,255,255,0.92)" />
            </View>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.desc}>{s.desc}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      {/* Button */}
      <TouchableOpacity style={styles.btn} onPress={goNext} activeOpacity={0.85}>
        <Text style={styles.btnTxt}>
          {page < SLIDES.length - 1 ? 'Siguiente' : 'Comenzar'}
        </Text>
        <Ionicons name="arrow-forward" size={18} color={BLUE} />
      </TouchableOpacity>

      <View style={{ height: 52 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:     { flex: 1, backgroundColor: BLUE, alignItems: 'center' },
  skipBtn:  { alignSelf: 'flex-end', paddingTop: 56, paddingRight: 24, paddingBottom: 8 },
  skipTxt:  { color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: '600' },
  slide:    { width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, paddingBottom: 60 },
  iconWrap: { width: 148, height: 148, borderRadius: 74, backgroundColor: 'rgba(255,255,255,0.13)', alignItems: 'center', justifyContent: 'center', marginBottom: 44 },
  title:    { fontSize: 30, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5, lineHeight: 37, marginBottom: 16 },
  desc:     { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 23 },
  dots:     { flexDirection: 'row', gap: 6, marginBottom: 28 },
  dot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive:{ width: 22, backgroundColor: '#fff', borderRadius: 3 },
  btn:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 100, paddingVertical: 16, paddingHorizontal: 36 },
  btnTxt:   { fontSize: 15, fontWeight: '800', color: BLUE },
});
