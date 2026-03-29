import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const BLUE    = Colors.blue;
const CODE_LEN = 6;

const RESEND_COOLDOWN = 60; // segundos

export default function OTPScreen({ navigation, route }: any) {
  const { phone } = route.params ?? { phone: '+56 9 XXXX XXXX' };
  const [code, setCode] = useState('');
  const [loading, setLoading]         = useState(false);
  const [resending, setResending]     = useState(false);
  const [cooldown, setCooldown]       = useState(RESEND_COOLDOWN);
  const inputRef = useRef<TextInput>(null);
  const { verifyOTP, requestOTP } = useAuth();

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 300); }, []);

  // Cuenta regresiva para habilitar el reenvío
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const digits  = code.padEnd(CODE_LEN, ' ').split('');
  const complete = code.length === CODE_LEN;

  const apiMsg = (err: any): string => {
    const msg = err?.message ?? err?.error ?? err?.detail ?? err?.errors?.[0];
    if (msg) return msg;
    const raw = JSON.stringify(err);
    return raw !== '{}' ? raw : 'Ocurrió un error. Intenta de nuevo.';
  };

  const handleVerify = async (codeToSend = code) => {
    if (codeToSend.length !== CODE_LEN || loading) return;
    console.log('[OTP Verify] phone:', phone, '| code:', codeToSend);
    setLoading(true);
    try {
      const hasRoles = await verifyOTP(phone, codeToSend);
      if (hasRoles) {
        navigation.replace('RoleSelector');
      } else {
        navigation.replace('Enrollment');
      }
    } catch (err: any) {
      console.error('[OTP Verify Error]', JSON.stringify(err));
      setCode('');
      // Error 500 del servidor: el código puede haberse consumido, pedir uno nuevo
      if (err?.status === 500 || !err?.status) {
        Alert.alert(
          'Error del servidor',
          'Hubo un problema al verificar el código. Solicita un nuevo código e intenta de nuevo.',
          [
            {
              text: 'Reenviar código',
              onPress: async () => {
                try {
                  await requestOTP(phone);
                  setCooldown(RESEND_COOLDOWN);
                  setTimeout(() => inputRef.current?.focus(), 100);
                } catch {
                  Alert.alert('Error', 'No se pudo reenviar el código. Intenta más tarde.');
                }
              },
            },
            { text: 'Cancelar', style: 'cancel', onPress: () => setTimeout(() => inputRef.current?.focus(), 100) },
          ],
        );
      } else {
        Alert.alert('Código inválido', apiMsg(err));
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await requestOTP(phone);
      setCode('');
      setCooldown(RESEND_COOLDOWN);
      setTimeout(() => inputRef.current?.focus(), 100);
      Alert.alert('Código enviado', `Se envió un nuevo código SMS a ${phone}.`);
    } catch (err: any) {
      Alert.alert('Error al reenviar', apiMsg(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.logo}>
            <Text style={styles.logoI}>CLUB</Text>
            <Text style={styles.logoB}>DIGI</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Código de verificación</Text>
          <Text style={styles.sub}>
            Enviamos un SMS a{'\n'}
            <Text style={styles.phone}>{phone}</Text>
          </Text>

          {/* Digit boxes */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
            style={styles.digitsRow}
          >
            {digits.map((d, i) => (
              <View key={i} style={[styles.digitBox, code.length === i && styles.digitBoxActive]}>
                <Text style={styles.digitTxt}>{d.trim()}</Text>
              </View>
            ))}
          </TouchableOpacity>

          {/* Tap hint */}
          <Text style={styles.tapHint}>Toca las casillas e ingresa el código</Text>

          {/* Hidden real input */}
          <TextInput
            ref={inputRef}
            style={styles.hidden}
            value={code}
            onChangeText={t => {
              const clean = t.replace(/\D/g, '').slice(0, CODE_LEN);
              setCode(clean);
              // Auto-submit cuando se completan los 6 dígitos
              if (clean.length === CODE_LEN) {
                handleVerify(clean);
              }
            }}
            keyboardType="number-pad"
            maxLength={CODE_LEN}
            autoFocus
            caretHidden
          />

          <TouchableOpacity
            style={[styles.btn, (!complete || loading) && styles.btnDisabled]}
            onPress={() => void handleVerify()}
            disabled={!complete || loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Verificar</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resend, (cooldown > 0 || resending) && styles.resendDisabled]}
            onPress={() => void handleResend()}
            disabled={cooldown > 0 || resending}
          >
            {resending ? (
              <ActivityIndicator size="small" color={BLUE} />
            ) : (
              <Text style={styles.resendTxt}>
                ¿No llegó el código?{'  '}
                {cooldown > 0
                  ? <Text style={{ color: Colors.gray }}>Reenviar en {cooldown}s</Text>
                  : <Text style={{ color: BLUE, fontWeight: '700' }}>Reenviar</Text>
                }
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.surf },
  header:          { backgroundColor: BLUE, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 18 },
  back:            { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  logo:            { flexDirection: 'row', alignItems: 'baseline' },
  logoI:           { fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:           { fontSize: 16, fontWeight: '800', color: '#fff' },
  body:            { flex: 1, padding: 24, paddingTop: 36, alignItems: 'center' },
  title:           { fontSize: 26, fontWeight: '800', color: Colors.black, letterSpacing: -0.5, marginBottom: 8, alignSelf: 'flex-start' },
  sub:             { fontSize: 13, color: Colors.gray, lineHeight: 19, marginBottom: 36, alignSelf: 'flex-start' },
  phone:           { color: Colors.black, fontWeight: '700' },
  digitsRow:       { flexDirection: 'row', gap: 10, marginBottom: 8 },
  digitBox:        { width: 46, height: 56, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.light, alignItems: 'center', justifyContent: 'center' },
  digitBoxActive:  { borderColor: BLUE },
  digitTxt:        { fontSize: 22, fontWeight: '700', color: Colors.black },
  tapHint:         { fontSize: 11, color: Colors.gray, marginBottom: 28, textAlign: 'center' },
  hidden:          { position: 'absolute', opacity: 0, height: 0 },
  btn:             { backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 8 },
  btnDisabled:     { opacity: 0.4 },
  btnTxt:          { fontSize: 15, fontWeight: '700', color: '#fff' },
  resend:          { marginTop: 20, height: 28, alignItems: 'center', justifyContent: 'center' },
  resendDisabled:  { opacity: 0.5 },
  resendTxt:       { fontSize: 12, color: Colors.gray },
});
