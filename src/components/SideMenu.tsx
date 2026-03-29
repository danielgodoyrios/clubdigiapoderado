import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';
import { useAuth } from '../context/AuthContext';

const PANEL_W = 285;
const BLUE = Colors.blue;

const SECTIONS = [
  {
    title: 'Seguimiento',
    items: [
      { icon: 'clipboard-outline', label: 'Asistencia', screen: 'Asistencia', modulo: 'asistencia' },
      { icon: 'card-outline', label: 'Pagos', screen: 'Pagos', modulo: 'pagos' },
    ],
  },
  {
    title: 'Comunicacion',
    items: [
      { icon: 'chatbubble-outline', label: 'Comunicados', screen: 'Comunicados', modulo: 'comunicados' },
      { icon: 'document-text-outline', label: 'Documentos', screen: 'Documentos', modulo: 'documentos' },
    ],
  },
  {
    title: 'Trámites',
    items: [
      { icon: 'document-outline', label: 'Mis Justificativos', screen: 'MisJustificativos', modulo: 'justificativos' },
      { icon: 'ribbon-outline',   label: 'Permiso Deportivo',  screen: 'PermisoDeportivo',  modulo: 'permisos_deportivos' },
      { icon: 'time-outline',     label: 'Horarios',           screen: 'Horarios',           modulo: 'horarios' },
    ],
  },
  {
    title: 'Mis Deportistas',
    items: [
      { icon: 'people-outline', label: 'Mis Deportistas', screen: 'MisDeportistas', modulo: undefined },
    ],
  },
  {
    title: 'Mi Cuenta',
    items: [
      { icon: 'person-outline', label: 'Perfil', screen: 'Perfil', modulo: undefined },
      { icon: 'settings-outline', label: 'Configuracion', screen: 'Configuracion', modulo: undefined },
    ],
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}

export default function SideMenu({ visible, onClose, navigation }: Props) {
  const { state, logout, isModuloHabilitado, isModuloNuevo, marcarModuloVisto } = useAuth();
  const slideX = useRef(new Animated.Value(-PANEL_W)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideX, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, { toValue: -PANEL_W, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const user = state.status === 'authenticated' ? state.user : null;
  const pupil = state.status === 'authenticated' ? state.activePupil : null;
  const roles = (user?.roles ?? []) as string[];
  const hasMultiRoles = roles.length > 1;

  const initials =
    (user?.name ?? '')
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';

  const navigate = (screen: string, params?: object) => {
    onClose();
    setTimeout(() => navigation.navigate(screen, params), 240);
  };

  const handleMenuPress = (screen: string, modulo?: string) => {
    if (modulo) marcarModuloVisto(modulo);
    navigate(screen);
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
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.panel, { transform: [{ translateX: slideX }] }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{initials}</Text>
            </View>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name ?? 'Apoderado'}
            </Text>
            {pupil ? (
              <Text style={styles.pupilInfo} numberOfLines={1}>
                {pupil.name}{pupil.team ? ` - ${pupil.team}` : ''}
              </Text>
            ) : null}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {SECTIONS.map((sec) => {
              const visibleItems = sec.items.filter(
                item => !item.modulo || isModuloHabilitado(item.modulo),
              );
              if (visibleItems.length === 0) return null;
              return (
                <View key={sec.title} style={styles.section}>
                  <Text style={styles.sectionLbl}>{sec.title.toUpperCase()}</Text>
                  {visibleItems.map((item, i) => {
                    const esNuevo = item.modulo ? isModuloNuevo(item.modulo) : false;
                    return (
                      <TouchableOpacity
                        key={item.screen}
                        style={[
                          styles.menuItem,
                          i < visibleItems.length - 1 ? styles.menuBorder : undefined,
                        ]}
                        onPress={() => handleMenuPress(item.screen, item.modulo)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.menuIcon}>
                          <Ionicons name={item.icon as any} size={17} color={BLUE} />
                        </View>
                        <Text style={styles.menuLabel}>{item.label}</Text>
                        {esNuevo && (
                          <View style={styles.nuevoBadge}>
                            <Text style={styles.nuevoText}>NUEVO</Text>
                          </View>
                        )}
                        <Ionicons name="chevron-forward" size={13} color={Colors.light} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
            <View style={styles.scrollPad} />
          </ScrollView>

          {hasMultiRoles ? (
            <TouchableOpacity
              style={styles.switchRoleBtn}
              onPress={() => navigate('RoleSelector', { fromApp: true })}
              activeOpacity={0.75}
            >
              <Ionicons name="swap-horizontal-outline" size={18} color={BLUE} />
              <Text style={styles.switchRoleTxt}>Cambiar de rol</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
            <Ionicons name="log-out-outline" size={18} color={Colors.red} />
            <Text style={styles.logoutTxt}>Cerrar sesion</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.46)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: PANEL_W,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 6, height: 0 },
    elevation: 14,
  },
  safeArea: { flex: 1 },
  userSection: {
    backgroundColor: BLUE,
    paddingTop: 58,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarTxt: { fontSize: 20, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 4 },
  pupilInfo: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  scroll: { flex: 1 },
  scrollPad: { height: 20 },
  section: { paddingHorizontal: 18, paddingTop: 20 },
  sectionLbl: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: Colors.gray,
    marginBottom: 8,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: Colors.surf },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: BLUE + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.black },
  nuevoBadge: {
    backgroundColor: Colors.red,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginRight: 4,
  },
  nuevoText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 18,
    paddingBottom: 0,
  },
  switchRoleTxt: { fontSize: 14, fontWeight: '700', color: BLUE },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.surf,
    marginTop: 12,
  },
  logoutTxt: { fontSize: 14, fontWeight: '700', color: Colors.red },
});