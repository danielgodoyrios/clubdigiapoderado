import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Comunicados, Comunicado } from '../../api';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue;

const CAT_COLOR: Record<string, string> = {
  info:   BLUE,
  action: Colors.red,
  admin:  Colors.amber,
};

export default function ComunicadosScreen({ navigation }: any) {
  const { state } = useAuth();
  const pupilId   = state.status === 'authenticated' ? state.activePupil?.id : undefined;

  const [messages, setMessages] = useState<Comunicado[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!pupilId) return;
    Comunicados.list(pupilId)
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pupilId]);

  const unread = messages.filter(m => !m.read).length;

  const handleOpen = async (m: Comunicado) => {
    navigation.navigate('ComunicadoDetalle', { message: m });
    if (!m.read) {
      await Comunicados.markRead(m.id).catch(() => {});
      setMessages(prev => prev.map(x => x.id === m.id ? { ...x, read: true } : x));
    }
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
          <Text style={styles.pageTitle}>Comunicados</Text>
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadTxt}>{unread} sin leer</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── List ── */}
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLbl}>TODOS LOS MENSAJES</Text>

        {loading ? (
          <ActivityIndicator color={BLUE} style={{ marginTop: 40 }} />
        ) : messages.map((m) => {
          const dateStr = m.date.slice(0, 10);
          return (
            <TouchableOpacity
              key={m.id}
              style={[styles.card, !m.read && styles.cardUnread]}
              onPress={() => handleOpen(m)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconWrap, { backgroundColor: CAT_COLOR[m.category] + '18' }]}>
                <Ionicons
                  name={m.category === 'action' ? 'document-text-outline' : 'chatbubble-outline'}
                  size={16}
                  color={CAT_COLOR[m.category]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.msgTitle, !m.read && styles.msgTitleUnread]}>{m.title}</Text>
                <Text style={styles.msgPreview} numberOfLines={1}>{m.preview}</Text>
                <Text style={styles.msgDate}>{dateStr.slice(8,10)}/{dateStr.slice(5,7)}/{dateStr.slice(0,4)}</Text>
              </View>
              {!m.read && <View style={[styles.unreadDot, { backgroundColor: CAT_COLOR[m.category] }]} />}
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 28 }} />
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
  headerTitle:  { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  pageTitle:    { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  unreadBadge:  { backgroundColor: Colors.red, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  unreadTxt:    { fontSize: 10, fontWeight: '700', color: '#fff' },
  body:         { flex: 1, paddingHorizontal: 14 },
  sectionLbl:   { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Colors.gray, marginTop: 14, marginBottom: 8 },
  card:         { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.light, flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 13, marginBottom: 8 },
  cardUnread:   { borderColor: BLUE + '40' },
  iconWrap:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  msgTitle:     { fontSize: 13, fontWeight: '500', color: Colors.gray, marginBottom: 3 },
  msgTitleUnread: { fontWeight: '700', color: Colors.black },
  msgPreview:   { fontSize: 11, color: Colors.gray, lineHeight: 15, marginBottom: 4 },
  msgDate:      { fontSize: 9, color: Colors.gray, fontWeight: '600' },
  unreadDot:    { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
