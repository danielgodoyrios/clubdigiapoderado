import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const BLUE    = Colors.blue;
const CODE_LEN = 6;

export default function OTPScreen({ navigation, route }: any) {
  const { phone } = route.params ?? { phone: '+56 9 XXXX XXXX' };
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { verifyOTP, requestOTP } = useAuth();

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 300); }, []);

  const digits  = code.padEnd(CODE_LEN, ' ').split('');
  const complete = code.length === CODE_LEN;

  const handleVerify = async () => {
    if (!complete) return;
    setLoading(true);
    try {
      const hasRoles = await verifyOTP(phone, code);
      if (hasRoles) {
        navigation.replace('RoleSelector');
      } else {
        navigation.replace('Enrollment');
      }
    } catch (err: any) {
      const msg = err?.error ?? 'Código incorrecto o expirado.';
      Alert.alert('Error', msg);
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await requestOTP(phone);
      setCode('');
      Alert.alert('Enviado', 'Se reenvió el código SMS.');
    } catch {
      Alert.alert('Error', 'No se pudo reenviar el código.');
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
            onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, CODE_LEN))}
            keyboardType="number-pad"
            maxLength={CODE_LEN}
            autoFocus
            caretHidden
          />

          <TouchableOpacity
            style={[styles.btn, (!complete || loading) && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={!complete || loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>Verificar</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resend} onPress={handleResend}>
            <Text style={styles.resendTxt}>
              ¿No llegó el código?{'  '}
              <Text style={{ color: BLUE, fontWeight: '700' }}>Reenviar</Text>
            </Text>
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
  resend:          { marginTop: 20 },
  resendTxt:       { fontSize: 12, color: Colors.gray },
});
