import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Platform
} from 'react-native';
import { C } from '../constants/colors';
import { IcBack, IcPermit, IcClock} from '../constants/icons';



export default function MoreFeaturesScreen({ navigation }) {
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <IcBack />
        </TouchableOpacity>
        <View style={s.headerText}>
          <Text style={s.headerTitle}>More Features</Text>
          <Text style={s.headerSub}>All services in one place</Text>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Business Permit */}
        <TouchableOpacity
          style={s.featureCard}
          activeOpacity={0.82}
          onPress={() => {/* future navigation */}}
        >
          <View style={[s.iconWrap, { backgroundColor: C.yellowBg }]}>
            <IcPermit />
          </View>
          <View style={s.featureBody}>
            <Text style={s.featureName}>Business Permit</Text>
            <Text style={s.featureDesc}>Apply and track your business permit online.</Text>
          </View>
        </TouchableOpacity>

        {/* Coming Soon placeholder */}
        <View style={s.comingSoonBox}>
          <IcClock />
          <Text style={s.comingSoonTitle}>More features coming soon</Text>
          <Text style={s.comingSoonSub}>
            We're working on new services to make NVGo even better. Stay tuned! 
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg },

  header:     { backgroundColor: C.greenDk, paddingTop: Platform.OS === 'android' ? 16 : 54,
                paddingHorizontal: 18, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn:    { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  headerText: { flex: 1 },
  headerTitle:{ color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  headerSub:  { color: 'rgba(255,255,255,0.5)', fontSize: 10.5, marginTop: 2 },

  scroll:         { flex: 1 },
  scrollContent:  { padding: 16, paddingBottom: 40, gap: 16 },

  featureCard:    { backgroundColor: C.card, borderRadius: 16, padding: 14,
                    flexDirection: 'row', alignItems: 'center', gap: 13,
                    borderWidth: 1.5, borderColor: C.yellowDk + '25',
                    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  iconWrap:       { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureBody:    { flex: 1 },
  featureName:    { fontSize: 13, fontWeight: '800', color: C.text, marginBottom: 3 },
  featureDesc:    { fontSize: 11, color: C.muted, lineHeight: 15 },

  comingSoonBox:  { backgroundColor: C.card, borderRadius: 16, padding: 28,
                    alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: C.border,
                    borderStyle: 'dashed' },
  comingSoonTitle:{ fontSize: 14, fontWeight: '800', color: C.text, marginTop: 4 },
  comingSoonSub:  { fontSize: 11.5, color: C.muted, textAlign: 'center', lineHeight: 18 },
});