
import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';

interface Props {
  onPress: () => void;
  headerColor?: string;
}

/** Carnet quick-access — solo icono + punto verde. Sin texto. */
export const CarnetIcon: React.FC<Props> = ({ onPress, headerColor = Colors.black }) => (
  <TouchableOpacity onPress={onPress} style={styles.wrap}>
    <View style={styles.box}>
      <Ionicons name="card-outline" size={20} color="rgba(255,255,255,0.78)" />
      <View style={[styles.dot, { borderColor: headerColor }]} />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrap: { padding: 2 },
  box: {
    width: 38, height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  dot: {
    position: 'absolute', bottom: -2, right: -2,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.ok,
    borderWidth: 2,
  },
});
