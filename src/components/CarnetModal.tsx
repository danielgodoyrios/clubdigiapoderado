
import React, { useRef, useEffect, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, Animated, Dimensions,
} from 'react-native';
import { Colors, Typography, Radius, Space } from '../theme';

const { height: SH } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  role: 'coach' | 'jugador' | 'arbitro';
  name: string;
  initials: string;
  licenseId: string;
  headerColor: string;
  position?: string;
  club?: string;
  externalToken?: string;
}

const QR_PATTERN = [1,1,1,0,1,1,1,1,0,1,0,1,0,1,1,0,1,1,0,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1,1,0,1,0,1,0,0,1,1,1,0,1,1,1];

export const CarnetModal: React.FC<Props> = ({
  visible, onClose, role, name, initials, licenseId, headerColor, position, club, externalToken,
}) => {
  const slideAnim = useRef(new Animated.Value(SH)).current;
  const [internalToken, setInternalToken] = useState('— — — — —');
  const token = externalToken ?? internalToken;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : SH,
      useNativeDriver: true,
      tension: 65, friction: 11,
    }).start();
  }, [visible]);

  // Genera token interno solo cuando no hay token externo disponible
  useEffect(() => {
    if (!visible || externalToken) return;
    const digits = () => Array.from({length:5}, () => Math.floor(Math.random()*10)).join(' ');
    setInternalToken(digits());
    const t = setInterval(() => setInternalToken(digits()), 300000);
    return () => clearInterval(t);
  }, [visible, externalToken]);

  const roleLabel = { coach: 'COACH', jugador: 'JUGADOR', arbitro: 'ÁRBITRO' }[role];

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity activeOpacity={1}>
            {/* Drag handle */}
            <View style={styles.handle} />

            {/* Card */}
            <View style={[styles.card, { backgroundColor: headerColor }]}>
              {/* Header row */}
              <View style={styles.cardHead}>
                <View style={styles.logoRow}>
                  <Text style={styles.logoI}>IDE</Text>
                  <Text style={styles.logoB}>BASKET</Text>
                </View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleTxt}>{roleLabel}</Text>
                </View>
              </View>

              {/* Avatar + info */}
              <View style={styles.avatarRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTxt}>{initials}</Text>
                </View>
                <View>
                  <Text style={styles.cardName}>{name}</Text>
                  {position && <Text style={styles.cardSub}>{position}</Text>}
                  {club && (
                    <View style={styles.clubPill}>
                      <Text style={styles.clubTxt}>{club}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.divider} />

              {/* QR + Token */}
              <View style={styles.qrRow}>
                {/* QR grid */}
                <View style={styles.qrGrid}>
                  {QR_PATTERN.map((on, i) => (
                    <View key={i} style={[styles.qrPixel, on && styles.qrPixelOn]} />
                  ))}
                </View>

                {/* Token */}
                <View style={styles.tokenWrap}>
                  <Text style={styles.tokenLabel}>Token · renueva c/5 min</Text>
                  <Text style={styles.tokenNum}>{token}</Text>
                  <View style={styles.validRow}>
                    <View style={styles.validDot} />
                    <Text style={styles.validTxt}>Válido</Text>
                  </View>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerLic}>{licenseId}</Text>
                <View style={styles.footerRight}>
                  <View style={styles.footerDot} />
                  <Text style={styles.footerVig}>Vigente 2026</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>Cerrar ↓</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end' },
  sheet: { backgroundColor:Colors.white, borderTopLeftRadius:22, borderTopRightRadius:22, padding:16, paddingBottom:32 },
  handle: { width:32, height:4, backgroundColor:Colors.light, borderRadius:2, alignSelf:'center', marginBottom:14 },
  card: { borderRadius:14, padding:14, overflow:'hidden' },
  cardHead: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  logoRow: { flexDirection:'row', alignItems:'baseline' },
  logoI: { fontSize:11, fontWeight:'800', color:'rgba(255,255,255,0.35)' },
  logoB: { fontSize:11, fontWeight:'800', color:'#fff' },
  roleBadge: { backgroundColor:'rgba(255,255,255,0.16)', borderRadius:7, paddingHorizontal:8, paddingVertical:3 },
  roleTxt: { fontSize:9, fontWeight:'800', color:'#fff', letterSpacing:0.8 },
  avatarRow: { flexDirection:'row', gap:10, alignItems:'center', marginBottom:10 },
  avatar: { width:42, height:42, borderRadius:10, backgroundColor:'rgba(255,255,255,0.12)', borderWidth:1.5, borderColor:'rgba(255,255,255,0.15)', alignItems:'center', justifyContent:'center' },
  avatarTxt: { fontSize:14, fontWeight:'800', color:'#fff' },
  cardName: { fontSize:13, fontWeight:'800', color:'#fff' },
  cardSub: { fontSize:9, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:1, marginTop:2 },
  clubPill: { backgroundColor:'rgba(255,255,255,0.1)', borderRadius:20, paddingHorizontal:7, paddingVertical:1, alignSelf:'flex-start', marginTop:4 },
  clubTxt: { fontSize:9, color:'rgba(255,255,255,0.6)' },
  divider: { height:1, backgroundColor:'rgba(255,255,255,0.08)', marginBottom:10 },
  qrRow: { flexDirection:'row', gap:12, alignItems:'center', marginBottom:10 },
  qrGrid: { width:54, height:54, flexWrap:'wrap', flexDirection:'row', gap:2, padding:5, backgroundColor:'rgba(255,255,255,0.07)', borderRadius:8 },
  qrPixel: { width:5, height:5, borderRadius:1, backgroundColor:'transparent' },
  qrPixelOn: { backgroundColor:'rgba(255,255,255,0.85)' },
  tokenWrap: { flex:1 },
  tokenLabel: { fontSize:9, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 },
  tokenNum: { fontSize:22, color:'#fff', letterSpacing:3, fontVariant:['tabular-nums'] },
  validRow: { flexDirection:'row', alignItems:'center', gap:5, marginTop:4 },
  validDot: { width:6, height:6, borderRadius:3, backgroundColor:Colors.ok },
  validTxt: { fontSize:9, color:'rgba(255,255,255,0.4)' },
  footer: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'rgba(0,0,0,0.15)', borderRadius:8, paddingHorizontal:10, paddingVertical:7 },
  footerLic: { fontSize:10, color:'rgba(255,255,255,0.35)', letterSpacing:0.5 },
  footerRight: { flexDirection:'row', alignItems:'center', gap:5 },
  footerDot: { width:6, height:6, borderRadius:3, backgroundColor:Colors.ok },
  footerVig: { fontSize:10, color:'rgba(255,255,255,0.45)' },
  closeBtn: { alignItems:'center', marginTop:13 },
  closeTxt: { fontSize:12, color:Colors.gray },
});
