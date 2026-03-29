import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, Image,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../theme';
import { Club, ClubInstitucional } from '../../api';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue;

function Avatar({ uri, nombre, size = 48 }: { uri: string | null; nombre: string; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  const initials = nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: BLUE + '22', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.35, fontWeight: '700', color: BLUE }}>{initials}</Text>
    </View>
  );
}

function MiembroCard({ nombre, cargo, foto_url, extra }: { nombre: string; cargo: string; foto_url: string | null; extra?: string }) {
  return (
    <View style={styles.miembroCard}>
      <Avatar uri={foto_url} nombre={nombre} size={44} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.miembroNombre}>{nombre}</Text>
        <Text style={styles.miembroCargo}>{cargo}</Text>
        {extra && <Text style={styles.miembroExtra}>{extra}</Text>}
      </View>
    </View>
  );
}

export default function InfoInstitucionalScreen({ navigation }: any) {
  const { state } = useAuth();
  const clubId = state.status === 'authenticated' ? state.user.club_id : 0;

  const [info, setInfo]       = useState<ClubInstitucional | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await Club.institucional(clubId);
      setInfo(data);
    } catch {}
    finally {
      setLoading(false);
    }
  }, [clubId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.headerRow, { backgroundColor: BLUE }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.ic}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>El Club</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={BLUE} />
      ) : !info ? (
        <View style={styles.empty}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.gray} />
          <Text style={styles.emptyTxt}>No se pudo cargar la información institucional</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* Logo + descripcion */}
          {info.logo_url && (
            <Image source={{ uri: info.logo_url }} style={styles.clubLogo} resizeMode="contain" />
          )}
          {!!info.descripcion && (
            <Text style={styles.descripcion}>{info.descripcion}</Text>
          )}
          {!!info.historia && (
            <>
              <Text style={styles.seccionTitulo}>Historia</Text>
              <Text style={styles.historiaText}>{info.historia}</Text>
            </>
          )}

          {/* Directiva */}
          {info.directiva.length > 0 && (
            <>
              <Text style={styles.seccionTitulo}>Directiva</Text>
              {info.directiva.map((m, i) => (
                <MiembroCard key={i} nombre={m.nombre} cargo={m.cargo} foto_url={m.foto_url} />
              ))}
            </>
          )}

          {/* Coaches */}
          {info.coaches.length > 0 && (
            <>
              <Text style={styles.seccionTitulo}>Cuerpo técnico</Text>
              {info.coaches.map((c, i) => (
                <MiembroCard
                  key={i}
                  nombre={c.nombre}
                  cargo={c.cargo}
                  foto_url={c.foto_url}
                  extra={c.certificacion ?? undefined}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.surf },
  headerRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14 },
  ic:            { padding: 6, marginRight: 8 },
  headerTitle:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  clubLogo:      { width: 100, height: 100, alignSelf: 'center', marginBottom: 12 },
  descripcion:   { fontSize: 14, color: Colors.mid, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  seccionTitulo: { fontSize: 11, fontWeight: '700', color: Colors.gray, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 20, marginBottom: 10 },
  historiaText:  { fontSize: 13, color: Colors.mid, lineHeight: 20, marginBottom: 8 },
  miembroCard:   { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  miembroNombre: { fontSize: 14, fontWeight: '700', color: Colors.dark },
  miembroCargo:  { fontSize: 12, color: BLUE, marginTop: 1 },
  miembroExtra:  { fontSize: 11, color: Colors.gray, marginTop: 2 },
  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTxt:      { color: Colors.gray, fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
});
