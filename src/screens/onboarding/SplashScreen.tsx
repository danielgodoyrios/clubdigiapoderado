import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../theme';

export default function SplashScreen({ navigation }: any) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.82)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale,   { toValue: 1, tension: 55, friction: 9, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(async () => {
      const seen = await AsyncStorage.getItem('onboarding_seen');
      navigation.replace(seen ? 'Phone' : 'Welcome');
    }, 2400);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.center, { opacity, transform: [{ scale }] }]}>
        <View style={styles.logoRow}>
          <Text style={styles.logoI}>CLUB</Text>
          <Text style={styles.logoB}>DIGI</Text>
        </View>
        <Text style={styles.tag}>Gestión Deportiva Digital</Text>
      </Animated.View>
      <Text style={styles.ver}>v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:    { flex: 1, backgroundColor: Colors.blue, alignItems: 'center', justifyContent: 'center' },
  center:  { alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  logoI:   { fontSize: 44, fontWeight: '800', color: 'rgba(255,255,255,0.32)', letterSpacing: -1 },
  logoB:   { fontSize: 44, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  tag:     { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '500', letterSpacing: 0.8 },
  ver:     { position: 'absolute', bottom: 40, fontSize: 10, color: 'rgba(255,255,255,0.22)', fontWeight: '600' },
});
