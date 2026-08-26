import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { C } from '../constants/colors';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const height = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOffline = state.isConnected === false || state.isInternetReachable === false;
      setOffline(isOffline);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    Animated.timing(height, {
      toValue: offline ? 30 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [offline]);

  return (
    <Animated.View style={[s.wrap, { height }]}>
      <View style={s.inner}>
        <Text style={s.text}>No internet connection</Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: C.red },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
});
