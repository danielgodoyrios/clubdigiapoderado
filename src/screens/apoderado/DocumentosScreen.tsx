import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Documentos, Documento } from '../../api';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue;

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  pending_signature: { label: 'Firma pendiente', color: Colors.red,   icon: 'alert-circle-outline'    },
  signed:            { label: 'Firmado',          color: Colors.ok,   icon: 'checkmark-circle-outline' },
  pending_review:    { label: 'En revisión',      color: Colors.amber, icon: 'time-outline'            },
};

const TYPE_ICON: Record<string, string> = {
  authorization: 'shield-checkmark-outline',
  contract:      'document-text-outline',
  medical:       'medkit-outline',
  regulation:    'book-outline',
};

export default function DocumentosScreen({ navigation }: any) {
  const { state } = useAuth();
  const pupilId   = state.status === 'authenticated' ? state.activePupil?.id : undefined;
  const pupilName = state.status === 'authenticated' && state.activePupil
    ? `${state.activePupil.name}${state.activePupil.category ? ` · ${state.activePupil.category}` : ''}`
    : '';

  const [docs, setDocs]     = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pupilId) return;
    Documentos.list(pupilId)
      .then(setDocs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pupilId]);

  const pending = docs.filter(d => d.status === 'pending_signature').length;

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
          <Text style={styles.pageTitle}>Documentos</Text>
          <Text style={styles.pageSub}>{pupilName}</Text>
        </View>

        {pending > 0 && (
          <View style={styles.alertBanner}>
            <Ionicons name="alert-circle-outline" size={14} color={Colors.red} />
            <Text style={styles.alertTxt}>{pending} documento{pending > 1 ? 's' : ''} requiere{pending > 1 ? 'n' : ''} firma</Text>
          </View>
        )}
      </View>

      {/* ── List ── */}
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={BLUE} style={{ marginTop: 40 }} />
        ) : <>
          {/* Pending first */}
          {docs.filter(d => d.status !== 'signed').length > 0 && (
            <>
              <Text style={styles.sectionLbl}>ACCIÓN REQUERIDA</Text>
              {docs.filter(d => d.status !== 'signed').map(doc => {
                const st = STATUS_MAP[doc.status];
                return (
                  <TouchableOpacity
                    key={doc.id}
                    style={[styles.card, styles.cardAction]}
                    onPress={() => navigation.navigate('DocumentoFirma', { doc })}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.docIcon, { backgroundColor: Colors.red + '15' }]}>
                      <Ionicons name={TYPE_ICON[doc.type] as any} size={18} color={Colors.red} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docTitle}>{doc.title}</Text>
                      {doc.due && <Text style={styles.docMeta}>Vence {doc.due.slice(8,10)}/{doc.due.slice(5,7)}</Text>}
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: Colors.red + '15' }]}>
                      <Text style={[styles.statusTxt, { color: Colors.red }]}>{st.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={Colors.light} />
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* Signed */}
          <Text style={[styles.sectionLbl, { marginTop: 16 }]}>FIRMADOS</Text>
          <View style={styles.groupCard}>
            {docs.filter(d => d.status === 'signed').map((doc, i) => (
              <TouchableOpacity
                key={doc.id}
                style={[styles.groupRow, i > 0 && styles.groupBorder]}
                onPress={() => navigation.navigate('DocumentoFirma', { doc })}
                activeOpacity={0.7}
              >
                <View style={[styles.docIcon, { backgroundColor: Colors.ok + '15' }]}>
                  <Ionicons name={TYPE_ICON[doc.type] as any} size={16} color={Colors.ok} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <Text style={styles.docMeta}>Firmado {doc.date.slice(8,10)}/{doc.date.slice(5,7)}/{doc.date.slice(0,4)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={Colors.light} />
              </TouchableOpacity>
            ))}
          </View>
        </>}
        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.surf },
  topRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  logo:        { flexDirection: 'row', alignItems: 'baseline' },
  logoI:       { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:       { fontSize: 14, fontWeight: '800', color: '#fff' },
  ic:          { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 8 },
  pageTitle:   { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  pageSub:     { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.red + '20', marginHorizontal: 18, marginBottom: 14, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  alertTxt:    { fontSize: 11, color: Colors.red, fontWeight: '600' },
  body:        { flex: 1, paddingHorizontal: 14 },
  sectionLbl:  { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Colors.gray, marginTop: 14, marginBottom: 8 },
  card:        { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.light, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, marginBottom: 8 },
  cardAction:  { borderColor: Colors.red + '40' },
  docIcon:     { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  docTitle:    { fontSize: 13, fontWeight: '600', color: Colors.black },
  docMeta:     { fontSize: 10, color: Colors.gray, marginTop: 2 },
  statusPill:  { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  statusTxt:   { fontSize: 9, fontWeight: '700' },
  groupCard:   { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.light, overflow: 'hidden' },
  groupRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13 },
  groupBorder: { borderTopWidth: 1, borderTopColor: Colors.surf },
});
