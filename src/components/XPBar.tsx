
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  rightLabel: string;
  progress: number; // 0-1
}

export const XPBar: React.FC<Props> = ({ label, rightLabel, progress }) => (
  <View>
    <View style={styles.row}>
      <Text style={styles.lbl}>{label}</Text>
      <Text style={styles.lbl}>{rightLabel}</Text>
    </View>
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` as any }]} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection:'row', justifyContent:'space-between', marginBottom: 4 },
  lbl: { fontSize: 10, color: 'rgba(255,255,255,0.45)' },
  track: { height: 4, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 2, overflow: 'hidden', marginBottom: 11 },
  fill: { height: '100%', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 2 },
});
