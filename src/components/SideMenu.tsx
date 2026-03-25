import React, { useEffect, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback,
  StyleSheet, Animated, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';
import { useAuth } from '../context/AuthContext';

const PANEL_W = 285;
const BLUE    = Colors.blue;

const SECTIONS = [
  {
    title: 'Seguimiento',
    items: [
      { icon: 'clipboard-outline',     label: 'Asistencia',  screen: 'Asistencia'  },
      { icon: 'card-outline',          label: 'Pagos',       screen: 'Pagos'       },
    ],
  },
  {
    title: 'Comunicación',
    items: [
      { icon: 'chatbubble-outline',    label: 'Comunicados', screen: 'Comunicados' },
      { icon: 'document-text-outline', label: 'Documentos',  screen: 'Documentos'  },
    ],
  },
  {
    title: 'Mi Cuenta',
    items: [
      { icon: 'person-outline',  label: 'Perfil',        screen: 'Perfil'       },
      { icon: 'settings-outline', label: 'Configuración', screen: 'Configuracion' },
    ],
  },
];

interface Props {
  visible:    boolean;
  onClose:    () => void;
  navigation: any;
}

export default function SideMenu({ visible, onClose, navigation }: Props) {
  const { state, logout } = useAuth();
  const slideX  = useRef(new Animated.Value(-PANEL_W)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideX,   { toValue: 0,        duration: 260, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1,        duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX,   { toValue: -PANEL_W, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0,        duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const user  = state.status === 'authenticated' ? state.user  : null;
  const pupil = state.status === 'authenticated' ? state.activePupil : null;
  const roles = (user?.roles ?? []) as string[];
  const hasMultiRoles = roles.length > 1;

  const initials = (user?.name ?? '')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  const navigate = (screen: string, params?: object) => {
    onClose();
    setTimeout(() => navigation.navigate(screen, params), 240);
  };

  const handleLogout = () => {
    onClose();
    setTimeout(() => logout(), 240);
  };

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
      animationType="none"
    >
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Panel */}
      <Animated.View style={[styles.panel, { transform: [{ translateX: slideX }] }]}>

        {/* User info */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{initials}</Text>
          </View>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.name ?? 'Apoderado'}
          </Text>
          {pupil && (
            <Text style={styles.pupilInfo} numberOfLines={1}>
              {pupil.name} · {pupil.team}
            </Text>
          )}
        </View>

        {/* Menu sections */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {SECTIONS.map(sec => (
            <View key={sec.title} style={styles.section}>
              <Text style={styles.sectionLbl}>{sec.title.toUpperCase()}</Text>
              {sec.items.map((item, i) => (
                <TouchableOpacity
                  key={item.screen}
                  style={[styles.menuItem, i < sec.items.length - 1 && styles.menuBorder]}
                  onPress={() => navigate(item.screen)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIcon}>
                    <Ionicons name={item.icon as any} size={17} color={BLUE} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={13} color={Colors.light} />
                </TouchableOpacity>
              ))}
            </View>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Logout */}
        {hasMultiRoles && (
          <TouchableOpacity
            style={styles.switchRoleBtn}
            onPress={() => navigate('RoleSelector', { fromApp: true })}
            activeOpacity={0.75}
          >
            <Ionicons name="swap-horizontal-outline" size={18} color={BLUE} />
            <Text style={styles.switchRoleTxt}>Cambiar de rol</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
          <Ionicons name="log-out-outline" size={18} color={Colors.red} />
          <Text style={styles.logoutTxt}>Cerrar sesión</Text>
        </TouchableOpacity>

      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.46)' },
  panel:         { position: 'absolute', top: 0, left: 0, bottom: 0, width: PANEL_W, backgroundColor: Colors.white, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 6, height: 0 }, elevation: 14 },
  userSection:   { backgroundColor: BLUE, paddingTop: 58, paddingBottom: 24, paddingHorizontal: 20 },
  avatar:        { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarTxt:     { fontSize: 20, fontWeight: '800', color: '#fff' },
  userName:      { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 4 },
  pupilInfo:     { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  section:       { paddingHorizontal: 18, paddingTop: 20 },
  sectionLbl:    { fontSize: 9, fontWeight: '700', letterSpacing: 1.4, color: Colors.gray, marginBottom: 8 },
  menuItem:      { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12 },
  menuBorder:    { borderBottomWidth: 1, borderBottomColor: Colors.surf },
  menuIcon:      { width: 32, height: 32, borderRadius: 9, backgroundColor: BLUE + '14', alignItems: 'center', justifyContent: 'center' },
  menuLabel:     { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.black },
  switchRoleBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 18, paddingBottom: 0 },
  switchRoleTxt: { fontSize: 14, fontWeight: '700', color: BLUE },
  logoutBtn:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 18, borderTopWidth: 1, borderTopColor: Colors.surf, marginTop: 12 },
  logoutTxt:     { fontSize: 14, fontWeight: '700', color: Colors.red },
});
