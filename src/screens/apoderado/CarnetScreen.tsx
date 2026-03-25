import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue;

const QR_PATTERN = [
  1,1,1,1,1,1,1,
  1,0,0,0,0,0,1,
  1,0,1,1,1,0,1,
  1,0,1,0,1,0,1,
  1,0,1,1,1,0,1,
  1,0,0,0,0,0,1,
  1,1,1,1,1,1,1,
];

export default function CarnetScreen({ navigation }: any) {
  const { state } = useAuth();
  const pupil    = state.status === 'authenticated' ? state.activePupil : null;
  const pupilName = pupil?.name ?? '';
  const initials  = pupilName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const category  = pupil?.category ?? '';
  const club      = pupil?.team ?? '';
  const licenseId = pupil?.rut ?? '';

  const [token, setToken] = useState('7 4 3 2 1');
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const digits = () => Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)).join(' ');
    setToken(digits());
    const t = setInterval(() => setToken(digits()), 300000); // 5 min
    return () => clearInterval(t);
  }, []);

  // Pulse animation on valid dot
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

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
          <TouchableOpacity
            style={styles.ic}
            onPress={() => navigation.navigate('CarnetEnrolar')}
          >
            <Ionicons name="qr-code-outline" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerTitle}>
          <Text style={styles.pageTitle}>Carnet Digital</Text>
          <Text style={styles.pageSub}>{pupilName}</Text>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {/* Carnet card */}
        <View style={[styles.card, { backgroundColor: BLUE }]}>
          {/* Card header */}
          <View style={styles.cardHead}>
            <View style={styles.cardLogo}>
              <Text style={styles.cardLogoI}>CLUB</Text>
              <Text style={styles.cardLogoB}>DIGI</Text>
            </View>
            <View style={styles.rolePill}>
              <Text style={styles.roleTxt}>JUGADOR</Text>
            </View>
          </View>

          {/* Avatar + info */}
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>CM</Text>
              <View style={styles.avatarDot} />
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{pupilName}</Text>
              <Text style={styles.playerSub}>{category}</Text>
              <View style={styles.clubPill}>
                <Text style={styles.clubTxt}>{club}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* QR + Token */}
          <View style={styles.qrRow}>
            <View style={styles.qrGrid}>
              {QR_PATTERN.map((on, i) => (
              <View key={i} style={[styles.qrPixel, on ? styles.qrPixelOn : undefined]} />
              ))}
            </View>
            <View style={styles.tokenSection}>
              <Text style={styles.tokenLabel}>TOKEN · renueva c/5 min</Text>
              <Text style={styles.tokenNum}>{token}</Text>
              <View style={styles.validRow}>
                <Animated.View style={[styles.validDot, { transform: [{ scale: pulse }] }]} />
                <Text style={styles.validTxt}>Válido</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.licenseId}>{licenseId}</Text>
            <View style={styles.footerRight}>
              <View style={styles.footerDot} />
              <Text style={styles.footerVig}>Vigente 2026</Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={16} color={BLUE} />
          <Text style={styles.infoTxt}>
            Muestra este carnet en el ingreso a canchas y gimnasios. El token se renueva automáticamente cada 5 minutos.
          </Text>
        </View>

        {/* Enrolar CTA */}
        <TouchableOpacity
          style={styles.enrolarBtn}
          onPress={() => navigation.navigate('CarnetEnrolar')}
          activeOpacity={0.85}
        >
          <Ionicons name="qr-code-outline" size={18} color={BLUE} />
          <Text style={styles.enrolarTxt}>Enrolar en nueva liga</Text>
          <Ionicons name="chevron-forward" size={16} color={BLUE} />
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.surf },
  topRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  logo:         { flexDirection: 'row', alignItems: 'baseline' },
  logoI:        { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:        { fontSize: 14, fontWeight: '800', color: '#fff' },
  ic:           { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 16 },
  pageTitle:    { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  pageSub:      { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  body:         { flex: 1 },
  bodyContent:  { padding: 16 },
  card:         { borderRadius: 20, padding: 18, marginBottom: 14 },
  cardHead:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardLogo:     { flexDirection: 'row', alignItems: 'baseline' },
  cardLogoI:    { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  cardLogoB:    { fontSize: 11, fontWeight: '800', color: '#fff' },
  rolePill:     { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  roleTxt:      { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  avatarRow:    { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar:       { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarTxt:    { fontSize: 20, fontWeight: '800', color: '#fff' },
  avatarDot:    { position: 'absolute', bottom: -1, right: -1, width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.ok, borderWidth: 2, borderColor: BLUE },
  playerInfo:   {},
  playerName:   { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  playerSub:    { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  clubPill:     { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 5 },
  clubTxt:      { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  divider:      { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 14 },
  qrRow:        { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 },
  qrGrid:       { width: 70, flexDirection: 'row', flexWrap: 'wrap', gap: 1 },
  qrPixel:      { width: 9, height: 9, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  qrPixelOn:    { backgroundColor: '#fff' },
  tokenSection: { flex: 1 },
  tokenLabel:   { fontSize: 8, color: 'rgba(255,255,255,0.45)', fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  tokenNum:     { fontSize: 26, fontWeight: '500', color: '#fff', letterSpacing: 4 },
  validRow:     { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  validDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.ok },
  validTxt:     { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  cardFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  licenseId:    { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  footerRight:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerDot:    { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.ok },
  footerVig:    { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  infoCard:     { backgroundColor: BLUE + '12', borderRadius: 10, flexDirection: 'row', gap: 8, padding: 12, marginBottom: 12 },
  infoTxt:      { flex: 1, fontSize: 11, color: BLUE, lineHeight: 16 },
  enrolarBtn:   { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: BLUE + '30', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  enrolarTxt:   { flex: 1, fontSize: 13, fontWeight: '600', color: BLUE },
});
