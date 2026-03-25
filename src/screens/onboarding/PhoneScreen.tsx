import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const BLUE = Colors.blue;

export default function PhoneScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestOTP } = useAuth();
  const valid = phone.replace(/\D/g, '').length >= 9;

  const handleContinue = async () => {
    if (!valid) return;
    const normalized = '+56' + phone.replace(/\D/g, '').replace(/^56/, '');
    setLoading(true);
    try {
      await requestOTP(normalized);
      navigation.navigate('OTP', { phone: normalized });
    } catch (err: any) {
      const status  = err?.status ?? 'sin respuesta';
      const detail  = err?.detail ?? err?.message ?? 'sin detalle';
      const errName = err?.name ?? '';
      console.error('[OTP Request Error]', JSON.stringify(err));
      Alert.alert(
        'Error al enviar código',
        `Status: ${status}\nTipo: ${errName}\nDetalle: ${detail}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoI}>CLUB</Text>
            <Text style={styles.logoB}>DIGI</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Ingresa tu número</Text>
          <Text style={styles.sub}>Te enviaremos un código de verificación por SMS.</Text>

          <View style={styles.inputRow}>
            <View style={styles.prefix}>
              <Text style={styles.prefixTxt}>🇨🇱  +56</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="9 8765 4321"
              placeholderTextColor={Colors.gray}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={12}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, (!valid || loading) && styles.btnDisabled]}
            onPress={handleContinue}
            disabled={!valid || loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <>
              <Text style={styles.btnTxt}>Continuar</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </>}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Al continuar, aceptas los Términos de Uso y la Política de Privacidad de ClubDigi.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.surf },
  header:      { backgroundColor: BLUE, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 22 },
  logo:        { flexDirection: 'row', alignItems: 'baseline' },
  logoI:       { fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:       { fontSize: 16, fontWeight: '800', color: '#fff' },
  body:        { flex: 1, padding: 24, paddingTop: 36 },
  title:       { fontSize: 26, fontWeight: '800', color: Colors.black, letterSpacing: -0.5, marginBottom: 8 },
  sub:         { fontSize: 13, color: Colors.gray, lineHeight: 19, marginBottom: 32 },
  inputRow:    { flexDirection: 'row', gap: 8, marginBottom: 16 },
  prefix:      { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.light, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' },
  prefixTxt:   { fontSize: 14, fontWeight: '600', color: Colors.black },
  input:       { flex: 1, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.light, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, fontWeight: '600', color: Colors.black, letterSpacing: 1 },
  btn:         { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  btnDisabled: { opacity: 0.4 },
  btnTxt:      { fontSize: 15, fontWeight: '700', color: '#fff' },
  disclaimer:  { fontSize: 10, color: Colors.gray, textAlign: 'center', marginTop: 20, lineHeight: 15 },
});
