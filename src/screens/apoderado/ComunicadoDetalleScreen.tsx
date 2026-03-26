import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Comunicados, ComunicadoDetail } from '../../api';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue;

export default function ComunicadoDetalleScreen({ navigation, route }: any) {
  const { message } = route.params ?? {};
  const { state } = useAuth();
  const pupilId = state.status === 'authenticated' ? state.activePupil?.id : undefined;

  const [detail,  setDetail]  = useState<ComunicadoDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pupilId || !message?.id) { setLoading(false); return; }
    Comunicados.get(pupilId, message.id)
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pupilId, message?.id]);

  const CAT_COLOR: Record<string, string> = { info: BLUE, action: Colors.red, admin: Colors.amber };
  const category = message?.category ?? 'info';
  const color    = CAT_COLOR[category] ?? BLUE;
  const dateStr  = (detail?.date ?? message?.date ?? '').slice(0, 10);

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
          <Text style={styles.pageTitle}>Comunicado</Text>
          {dateStr.length >= 10 && (
            <Text style={styles.pageSub}>
              {dateStr.slice(8,10)}/{dateStr.slice(5,7)}/{dateStr.slice(0,4)}
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={BLUE} size="large" />
        </View>
      ) : (
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Category badge */}
          <View style={[styles.catBadge, { backgroundColor: color + '18' }]}>
            <View style={[styles.catDot, { backgroundColor: color }]} />
            <Text style={[styles.catTxt, { color }]}>
              {category === 'action' ? 'REQUIERE ACCIÓN' : category === 'admin' ? 'ADMINISTRATIVO' : 'INFORMACIÓN'}
            </Text>
          </View>

          <Text style={styles.title}>{detail?.title ?? message?.title ?? ''}</Text>
          <Text style={styles.sender}>C.D. Santo Domingo · Cuerpo Técnico</Text>

          <View style={styles.divider} />

          {detail?.body ? (
            <Text style={styles.body_text}>{detail.body}</Text>
          ) : message?.preview ? (
            <Text style={styles.body_text}>{message.preview}</Text>
          ) : (
            <Text style={[styles.body_text, { color: Colors.gray }]}>Sin contenido disponible.</Text>
          )}

          {/* Attachments */}
          {detail?.attachments && detail.attachments.length > 0 && (
            <View style={styles.attachSection}>
              <Text style={styles.attachTitle}>ARCHIVOS ADJUNTOS</Text>
              {detail.attachments.map((a, i) => (
                <View key={i} style={styles.attachRow}>
                  <Ionicons name="attach-outline" size={16} color={BLUE} />
                  <Text style={styles.attachName} numberOfLines={1}>{a.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action required */}
          {category === 'action' && (
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.85}>
              <Ionicons name="pencil-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnTxt}>Firmar autorización</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 28 }} />
        </ScrollView>
      )}
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
  body:         { flex: 1, padding: 18 },
  catBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 12 },
  catDot:       { width: 6, height: 6, borderRadius: 3 },
  catTxt:       { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  title:        { fontSize: 20, fontWeight: '800', color: Colors.black, letterSpacing: -0.3, marginBottom: 6 },
  sender:       { fontSize: 12, color: Colors.gray },
  divider:      { height: 1, backgroundColor: Colors.light, marginVertical: 16 },
  body_text:    { fontSize: 14, color: Colors.black, lineHeight: 22 },
  attachSection:{ marginTop: 20 },
  attachTitle:  { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Colors.gray, marginBottom: 8 },
  attachRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.white, borderRadius: 10, borderWidth: 1, borderColor: Colors.light, padding: 12, marginBottom: 6 },
  attachName:   { flex: 1, fontSize: 13, color: Colors.blue, fontWeight: '500' },
  actionBtn:    { backgroundColor: Colors.blue, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  actionBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
