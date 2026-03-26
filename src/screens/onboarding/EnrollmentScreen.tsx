import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

const BLUE = Colors.blue;

type RoleType = 'apoderado' | 'profesor' | 'admin';

interface RoleOption {
  key:   RoleType;
  icon:  string;
  label: string;
  sub:   string;
  color: string;
  codePlaceholder: string;
  codeHint: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    key:             'apoderado',
    icon:            'people-outline',
    label:           'Apoderado',
    sub:             'Soy tutor o padre de un deportista del club',
    color:           BLUE,
    codePlaceholder: 'Ej: APO-2026-XXXX',
    codeHint:        'El club entregó este código al registrar a tu pupilo.',
  },
  {
    key:             'profesor',
    icon:            'school-outline',
    label:           'Profesor / Coach',
    sub:             'Soy entrenador o asistente técnico del club',
    color:           '#0F7D4B',
    codePlaceholder: 'Ej: PROF-INV-XXXX',
    codeHint:        'Código de invitación enviado por el administrador del club.',
  },
  {
    key:             'admin',
    icon:            'shield-checkmark-outline',
    label:           'Administrador',
    sub:             'Gestiono el club o la asociación deportiva',
    color:           '#7C1A3A',
    codePlaceholder: 'Ej: ADM-XXXX-XXXX',
    codeHint:        'Código de activación provisto por ClubDigi al contratar el plan.',
  },
];

export default function EnrollmentScreen({ navigation }: any) {
  const [step, setStep]           = useState<'role' | 'code'>('role');
  const [selected, setSelected]   = useState<RoleOption | null>(null);
  const [code, setCode]           = useState('');
  const [loading, setLoading]     = useState(false);

  function handleRoleSelect(opt: RoleOption) {
    setSelected(opt);
    setCode('');
    setStep('code');
  }

  function handleBack() {
    if (step === 'code') { setStep('role'); return; }
    navigation.goBack();
  }

  function handleSubmit() {
    if (code.trim().length < 6) {
      Alert.alert('Código inválido', 'Ingresa el código completo.');
      return;
    }
    setLoading(true);
    // Simular validación — reemplazar con llamada real a POST /auth/enroll
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        '¡Enrolamiento exitoso!',
        `Tu rol de ${selected?.label} fue activado correctamente.`,
        [
          {
            text: 'Continuar',
            onPress: () => {
              // En producción: el backend actualiza roles[], luego navegamos a RoleSelector
              const navTarget =
                selected?.key === 'apoderado' ? 'PupilSelector' :
                selected?.key === 'profesor'  ? 'ProfesorHome'  :
                                                'AdminHome';
              navigation.replace(navTarget);
            },
          },
        ],
      );
    }, 1200);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.logo}>
          <Text style={styles.logoI}>CLUB</Text>
          <Text style={styles.logoB}>DIGI</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        {step === 'role' ? (
          <>
            <Text style={styles.title}>¿Cuál es tu rol{'\n'}en el club?</Text>
            <Text style={styles.sub}>
              Selecciona el rol que deseas activar. Puedes tener más de uno.
            </Text>

            <View style={{ gap: 12, marginTop: 24 }}>
              {ROLE_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={styles.card}
                  onPress={() => handleRoleSelect(opt)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.iconBox, { backgroundColor: opt.color + '15' }]}>
                    <Ionicons name={opt.icon as any} size={26} color={opt.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleLabel}>{opt.label}</Text>
                    <Text style={styles.roleSub}>{opt.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.gray} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Badge rol seleccionado */}
            <View style={[styles.roleBadge, { backgroundColor: selected!.color + '12' }]}>
              <Ionicons name={selected!.icon as any} size={18} color={selected!.color} />
              <Text style={[styles.roleBadgeTxt, { color: selected!.color }]}>
                {selected!.label}
              </Text>
            </View>

            <Text style={styles.title}>Ingresa tu{'\n'}código de acceso</Text>
            <Text style={styles.sub}>{selected!.codeHint}</Text>

            <View style={styles.inputWrap}>
              <Ionicons name="key-outline" size={18} color={Colors.gray} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder={selected!.codePlaceholder}
                placeholderTextColor={Colors.gray}
                value={code}
                onChangeText={t => setCode(t.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>

            <Text style={styles.hint}>
              ¿No tienes un código? Contacta al administrador de tu club.
            </Text>

            <TouchableOpacity
              style={[styles.btn, (code.trim().length < 6 || loading) && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={code.trim().length < 6 || loading}
              activeOpacity={0.85}
            >
              <Text style={styles.btnTxt}>
                {loading ? 'Verificando...' : 'Activar rol'}
              </Text>
              {!loading && <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.surf },
  header: {
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  backBtn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  logo:      { flexDirection: 'row', alignItems: 'baseline' },
  logoI:     { fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB:     { fontSize: 16, fontWeight: '800', color: '#fff' },
  body:      { flex: 1, padding: 24, paddingTop: 28 },
  title:     { fontSize: 26, fontWeight: '800', color: Colors.black, letterSpacing: -0.5, marginBottom: 8 },
  sub:       { fontSize: 13, color: Colors.gray, lineHeight: 18 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox:      { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  roleLabel:    { fontSize: 15, fontWeight: '700', color: Colors.black, marginBottom: 2 },
  roleSub:      { fontSize: 12, color: Colors.gray, lineHeight: 16 },
  roleBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 20 },
  roleBadgeTxt: { fontSize: 13, fontWeight: '700' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 24,
  },
  input:  { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.black, letterSpacing: 1.5 },
  hint:   { fontSize: 12, color: Colors.gray, marginTop: 10, textAlign: 'center' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 28,
  },
  btnDisabled: { opacity: 0.45 },
  btnTxt:      { fontSize: 15, fontWeight: '700', color: '#fff' },
});
