
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';
import { CarnetIcon } from './CarnetIcon';

interface Props {
  backgroundColor: string;
  onMenu: () => void;
  onNotification: () => void;
  onCarnet: () => void;
  showCarnet?: boolean;
  showColor?: boolean;
  onColor?: () => void;
}

export const AppHeader: React.FC<Props> = ({
  backgroundColor, onMenu, onNotification, onCarnet,
  showCarnet = true, showColor = false, onColor,
}) => (
  <View style={[styles.wrap, { backgroundColor }]}>
    <StatusBar barStyle="light-content" />
    <View style={styles.row}>
      {/* Hamburger */}
      <TouchableOpacity onPress={onMenu} style={styles.ic}>
        <Ionicons name="menu" size={22} color="rgba(255,255,255,0.65)" />
      </TouchableOpacity>

      {/* Logo */}
      <View style={styles.logo}>
        <Text style={styles.logoI}>IDE</Text>
        <Text style={styles.logoB}>BASKET</Text>
      </View>

      {/* Right icons */}
      <View style={styles.icons}>
        {showColor && (
          <TouchableOpacity onPress={onColor} style={styles.ic}>
            <Ionicons name="color-palette-outline" size={20} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.ic} onPress={() => {}}>
          <Ionicons name="swap-vertical-outline" size={20} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onNotification} style={styles.ic}>
          <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.5)" />
          <View style={styles.notifDot} />
        </TouchableOpacity>
        {showCarnet && (
          <CarnetIcon onPress={onCarnet} headerColor={backgroundColor} />
        )}
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  logo: { flexDirection: 'row', alignItems: 'baseline' },
  logoI: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.35)' },
  logoB: { fontSize: 14, fontWeight: '800', color: '#fff' },
  icons: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ic: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notifDot: {
    position: 'absolute', top: 1, right: 1,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: Colors.red,
  },
});
