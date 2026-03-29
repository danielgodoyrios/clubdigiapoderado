import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { Documentos, Documento } from '../../api';
import { Pupil } from '../../api';

const BLUE = Colors.blue;

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  pending_signature: { label: 'Firma pendiente', color: Colors.red,   icon: 'alert-circle-outline'     },
  signed:            { label: 'Firmado',          color: Colors.ok,   icon: 'checkmark-circle-outline'  },
  pending_review:    { label: 'En revisión',      color: Colors.amber, icon: 'time-outline'             },
};

const TYPE_ICON: Record<string, string> = {
  authorization: 'shield-checkmark-outline',
  contract:      'document-text-outline',
  medical:       'medkit-outline',
  regulation:    'book-outline',
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
}

function calcEdad(birth: string | null | undefined): string {
  if (!birth) return '—';
  const b = new Date(birth);
  if (isNaN(b.getTime())) return '—';
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return `${age} años`;
}

export default function PupilPerfilScreen({ route, navigation }: any) {
  const pupil: Pupil & { federado?: boolean } = route.params?.pupil;
  const [docs, setDocs]       = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pupil?.id) return;
    Documentos.list(pupil.id)
      .then(setDocs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pupil?.id]);

  if (!pupil) return null;

  const initials = pupil.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const federado = (pupil as any).federado ?? (pupil.status === 'federado') ?? null;
  const pendingDocs = docs.filter(d => d.status === 'pending_signature').length;

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
            onPress={() => navigation.navigate('EditarPupilo', { pupil })}
          >
            <Ionicons name="create-outline" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* Pupil avatar + name */}
        <View style={styles.heroRow}>
          <View style={styles.avatar}>
            {pupil.photo
              ? <Image source={{ uri: pupil.photo }} style={styles.avatarImg} />
              : <Text style={styles.avatarTxt}>{initials}</Text>
            }
            <View style={[
              styles.avatarDot,
              { backgroundColor: pupil.status === 'active' || pupil.status === 'federado' ? Colors.ok : Colors.amber },
            ]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pupilName}>{pupil.name}</Text>
            <Text style={styles.pupilMeta}>
              {[pupil.category, pupil.team].filter(Boolean).join(' · ') || 'Sin categoría'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

        {/* ── Estado federativo ── */}
        <Text style={styles.sectionLbl}>ESTADO FEDERATIVO</Text>
        <View style={styles.card}>
          <View style={styles.fedRow}>
            <View style={[
              styles.fedBadge,
              { backgroundColor: federado ? Colors.ok + '18' : Colors.amber + '18' },
            ]}>
              <Ionicons
                name={federado ? 'shield-checkmark' : 'shield-outline'}
                size={22}
                color={federado ? Colors.ok : Colors.amber}
              />
              <Text style={[styles.fedLabel, { color: federado ? Colors.ok : Colors.amber }]}>
                {federado === true ? 'Jugador federado' : federado === false ? 'No federado' : 'Sin información'}
              </Text>
            </View>
            <Text style={styles.fedSub}>
              {federado === true
                ? 'Este jugador está inscrito en el registro federativo'
                : federado === false
                ? 'El jugador aún no ha sido federado'
                : 'El backend no entrega este dato aún'}
            </Text>
          </View>
        </View>

        {/* ── Datos personales ── */}
        <Text style={[styles.sectionLbl, { marginTop: 14 }]}>DATOS PERSONALES</Text>
        <View style={styles.card}>
          {[
            { label: 'RUT',              value: pupil.rut },
            { label: 'Fecha nacimiento', value: formatDate(pupil.birth_date) },
            { label: 'Edad',             value: calcEdad(pupil.birth_date) },
            { label: 'Género',           value: pupil.gender === 'M' ? 'Masculino' : pupil.gender === 'F' ? 'Femenino' : pupil.gender ?? '—' },
            { label: 'Categoría',        value: pupil.category ?? '—' },
            { label: 'Equipo',           value: pupil.team ?? '—' },
            { label: 'Estado',           value: pupil.status ?? '—' },
          ].map((r, i) => (
            <View key={i} style={[styles.row, i > 0 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Text style={styles.rowValue}>{r.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Documentos ── */}
        <View style={[styles.sectionHeader, { marginTop: 14 }]}>
          <Text style={styles.sectionLbl}>DOCUMENTOS</Text>
          {pendingDocs > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>{pendingDocs} pendiente{pendingDocs > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>

        {loading ? (
          <ActivityIndicator color={BLUE} style={{ marginVertical: 16 }} />
        ) : docs.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="document-outline" size={28} color={Colors.light} />
            <Text style={styles.emptyTxt}>Sin documentos</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {docs.map((doc, i) => {
              const s = STATUS_MAP[doc.status] ?? { label: doc.status, color: Colors.gray, icon: 'document-outline' };
              return (
                <TouchableOpacity
                  key={doc.id}
                  style={[styles.docRow, i > 0 && styles.rowBorder]}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate('DocumentoFirma', { pupilId: pupil.id, docId: doc.id })}
                >
                  <Ionicons
                    name={(TYPE_ICON[doc.type] ?? 'document-outline') as any}
                    size={18}
                    color={BLUE}
                    style={{ marginRight: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docTitle}>{doc.title}</Text>
                    {doc.due && (
                      <Text style={styles.docDue}>Vence {formatDate(doc.due)}</Text>
                    )}
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: s.color + '18' }]}>
                    <Ionicons name={s.icon as any} size={12} color={s.color} />
                    <Text style={[styles.statusTxt, { color: s.color }]}>{s.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 32 }} />
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
  ic:            { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  heroRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18 },
  avatar:        { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  avatarImg:     { width: 64, height: 64, borderRadius: 32 },
  avatarTxt:     { fontSize: 22, fontWeight: '800', color: '#fff' },
  avatarDot:     { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: BLUE },
  pupilName:     { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  pupilMeta:     { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  body:          { flex: 1, paddingHorizontal: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionLbl:    { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Colors.gray, marginTop: 14, marginBottom: 7 },
  card:          { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.light, overflow: 'hidden', marginBottom: 2 },
  row:           { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14 },
  rowBorder:     { borderTopWidth: 1, borderTopColor: Colors.surf },
  rowLabel:      { fontSize: 12, color: Colors.gray, width: 130 },
  rowValue:      { fontSize: 13, fontWeight: '600', color: Colors.black, flex: 1, textAlign: 'right' },
  fedRow:        { padding: 14 },
  fedBadge:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, marginBottom: 8 },
  fedLabel:      { fontSize: 15, fontWeight: '700' },
  fedSub:        { fontSize: 12, color: Colors.gray, lineHeight: 17 },
  badge:         { backgroundColor: Colors.red + '18', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 7 },
  badgeTxt:      { fontSize: 10, fontWeight: '700', color: Colors.red },
  emptyBox:      { alignItems: 'center', paddingVertical: 20, gap: 6 },
  emptyTxt:      { fontSize: 12, color: Colors.gray },
  docRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
  docTitle:      { fontSize: 13, fontWeight: '600', color: Colors.black },
  docDue:        { fontSize: 10, color: Colors.gray, marginTop: 2 },
  statusPill:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  statusTxt:     { fontSize: 10, fontWeight: '700' },
});
