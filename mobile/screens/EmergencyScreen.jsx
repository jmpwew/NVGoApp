import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Platform, Linking, Alert, RefreshControl, ActivityIndicator
} from 'react-native';
import { C } from '../constants/colors';
import api_url from '../utils/api';
import { IcPhone} from '../constants/icons';



const categoryStyle = {
  Emergency: { bg: C.greenLt, ic: C.green, label: 'Emergency' },
  Medical:{ bg: C.greenLt, ic: C.green, label: 'Medical' },
  Police: {bg: C.greenLt, ic: C.green, label: 'Police' },
  Fire: { bg: C.greenLt, ic: C.green, label: 'Fire'},
  Health:{bg: C.greenLt, ic: C.green, label: 'Health' },
  General: { bg: C.greenLt, ic: C.green, label: 'General' },
};

export default function EmergencyScreen({ navigation }) {
  const [hotlines, setHotlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHotlines = async () => {
    try {
      const res  = await fetch(`${api_url}/api/hotlines`);
      const data = await res.json();
      setHotlines(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHotlines(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHotlines();
    setRefreshing(false);
  }, []);

  const handleCall = (name, number) => {
    Alert.alert(
      `Call ${name}`,
      `You are about to call ${number}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', style: 'destructive', onPress: () => Linking.openURL(`tel:${number}`) },
      ]
    );
  };
  /* group by category */
  const grouped = hotlines.reduce((acc, h) => {
    const cat = h.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(h);
    return acc;
  }, {});

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.green} />

      {/* Header */}
      <View style={s.header}>
        
        <View style={s.headerText}>
          <Text style={s.headerTitle}>Emergency Hotlines</Text>
          <Text style={s.headerSub}>Nueva Valencia, Guimaras</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.loadWrap}>
          <ActivityIndicator size="large" color={C.green} />
          <Text style={s.loadTxt}>Loading hotlines...</Text>
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor={C.green} colors={[C.green]} />
          }
        >
          {Object.entries(grouped).map(([category, items]) => {
            const cs = categoryStyle[category] || categoryStyle.General;
            return (
              <View key={category}>
                <Text style={s.catLabel}>{cs.label.toUpperCase()}</Text>
                {items.map((h) => (
                  <TouchableOpacity
                    key={h.id}
                    style={s.card}
                    activeOpacity={0.82}
                    onPress={() => handleCall(h.name, h.number)}
                  >
                    <View style={[s.iconWrap, { backgroundColor: cs.bg }]}>
                      <IcPhone c={cs.ic} s={20} />
                    </View>
                    <View style={s.cardBody}>
                      <Text style={s.cardName}>{h.name}</Text>
                      <Text style={s.cardNum}>{h.number}</Text>
                    </View>
                    <View style={[s.callBtn, { backgroundColor: cs.ic }]}>
                      <IcPhone c="#fff" s={16} />
                      <Text style={s.callBtnTxt}>Call</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}

          <Text style={s.footer}>Keep these numbers handy — every second counts.</Text>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg },

  /* Header */
  header:     { backgroundColor: C.green, paddingTop: Platform.OS === 'android' ? 16 : 54,
                paddingHorizontal: 18, paddingBottom: 18,
                flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn:    { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  headerText: { flex: 1 },
  headerTitle:{ color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  headerSub:  { color: 'rgba(255,255,255,0.55)', fontSize: 10.5, marginTop: 2 },

  /* Scroll */
  scroll:         { flex: 1 },
  scrollContent:  { padding: 16, paddingTop: 12, paddingBottom: 40, gap: 4 },

  catLabel:   { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.2,
                marginTop: 14, marginBottom: 8 },

  /* Card */
  card:       { backgroundColor: '#fff', borderRadius: 14, padding: 12,
                flexDirection: 'row', alignItems: 'center', gap: 12,
                borderWidth: 1, borderColor: C.border, marginBottom: 8,
                shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  iconWrap:   { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody:   { flex: 1 },
  cardName:   { fontSize: 13, fontWeight: '800', color: C.text },
  cardNum:    { fontSize: 12, color: C.muted, marginTop: 2, fontWeight: '600' },
  callBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10,
                paddingVertical: 8, paddingHorizontal: 12, flexShrink: 0 },
  callBtnTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },

  /* Loading */
  loadWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadTxt:    { color: C.muted, fontSize: 13 },

  footer:     { textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 12, lineHeight: 17 },
});