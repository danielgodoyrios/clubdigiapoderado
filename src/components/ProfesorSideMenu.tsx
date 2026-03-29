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
const GREEN = '#0F7D4B';

const SECTIONS = [
  {
    title: 'Gestión',
    items: [
      { icon: 'people-outline',         label: 'Mis Equipos',    screen: 'MisEquipos',     modulo: null },
      { icon: 'calendar-number-outline', label: 'Programación',   screen: 'Programacion',   modulo: null },
      { icon: 'megaphone-outline',       label: 'Convocatorias',  screen: 'ProfesorAgenda', modulo: 'convocatorias' },
    ],
  },
  {
    title: 'Actividades',
    items: [
      { icon: 'calendar-outline',   label: 'Agenda',           screen: 'ProfesorAgenda',     modulo: 'agenda' },
      { icon: 'add-circle-outline', label: 'Crear Evento',     screen: 'CrearEvento',        modulo: null },
    ],
  },
  {
    title: 'Salud',
    items: [
      { icon: 'medkit-outline',     label: 'Lesiones',         screen: 'LesionesEquipo',     modulo: null },
      { icon: 'add-outline',        label: 'Registrar Lesión', screen: 'RegistroLesion',     modulo: null },
    ],
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}

export default function ProfesorSideMenu({ visible, onClose, navigation }: Props) {
  const { state, logout, isModuloHabilitado, isModuloNuevo, marcarModuloVisto } = useAuth();
  const slideX   = useRef(new Animated.Value(-PANEL_W)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideX,   { toValue: 0,       duration: 260, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1,       duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX,   { toValue: -PANEL_W, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0,        duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const user     = state.status === 'authenticated' ? state.user : null;
  const name     = user?.name ?? 'Profesor';
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  const navigate = (screen: string, params?: object) => {
    onClose();
    setTimeout(() => navigation.navigate(screen, params), 240);
  };

  const handleMenuPress = (screen: string, modulo?: string | null) => {
    if (modulo) marcarModuloVisto(modulo);
    navigate(screen);
  };

  const handleLogout = () => {
    onClose();
    setTimeout(() => logout(), 240);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.panel, { transform: [{ translateX: slideX }] }]}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.panelHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{initials}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.roleBadge}>PROFESOR / COACH</Text>
              <Text style={styles.userName} numberOfLines={1}>{name}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {SECTIONS.map(sec => {
              const visibleItems = sec.items.filter(
                it => it.modulo === null || it.modulo === undefined || isModuloHabilitado(it.modulo),
              );
              if (visibleItems.length === 0) return null;
              return (
                <View key={sec.title} style={styles.section}>
                  <Text style={styles.sectionTitle}>{sec.title.toUpperCase()}</Text>
                  {visibleItems.map(item => {
                    const esNuevo = item.modulo ? isModuloNuevo(item.modulo) : false;
                    return (
                      <TouchableOpacity
                        key={item.screen + item.label}
                        style={styles.menuItem}
                        onPress={() => handleMenuPress(item.screen, item.modulo)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.menuIconWrap}>
                          <Ionicons name={item.icon as any} size={18} color={GREEN} />
                        </View>
                        <Text style={styles.menuLabel}>{item.label}</Text>
                        {esNuevo && (
                          <View style={styles.nuevoBadge}>
                            <Text style={styles.nuevoTxt}>NUEVO</Text>
                          </View>
                        )}
                        <Ionicons name="chevron-forward" size={14} color={Colors.light} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.footerItem}
              onPress={() => { onClose(); setTimeout(() => navigation.replace('RoleSelector'), 240); }}
            >
              <Ionicons name="swap-horizontal-outline" size={18} color={Colors.gray} />
              <Text style={styles.footerTxt}>Cambiar rol</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color={Colors.red} />
              <Text style={[styles.footerTxt, { color: Colors.red }]}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  panel:       { position: 'absolute', left: 0, top: 0, bottom: 0, width: PANEL_W, backgroundColor: '#fff', elevation: 16, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12 },
  panelHeader: { backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 20, paddingBottom: 18 },
  avatar:      { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:   { fontSize: 16, fontWeight: '800', color: '#fff' },
  roleBadge:   { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.8 },
  userName:    { fontSize: 14, fontWeight: '700', color: '#fff', marginTop: 2 },
  section:     { paddingTop: 16, paddingHorizontal: 18, paddingBottom: 4 },
  sectionTitle:{ fontSize: 9, fontWeight: '800', color: Colors.gray, letterSpacing: 1.2, marginBottom: 6 },
  menuItem:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 12 },
  menuIconWrap:{ width: 32, height: 32, borderRadius: 8, backgroundColor: GREEN + '12', alignItems: 'center', justifyContent: 'center' },
  menuLabel:   { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.black },
  nuevoBadge:  { backgroundColor: Colors.red, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 4 },
  nuevoTxt:    { fontSize: 8, fontWeight: '800', color: '#fff' },
  footer:      { borderTopWidth: 1, borderTopColor: Colors.light, paddingHorizontal: 18, paddingVertical: 12, gap: 4 },
  footerItem:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  footerTxt:   { fontSize: 14, fontWeight: '600', color: Colors.gray },
});
