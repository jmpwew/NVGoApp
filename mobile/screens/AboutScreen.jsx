import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, Platform, Linking, Image,
} from 'react-native';
import { C } from '../constants/colors';
import { IcBack, IcPhone, IcMail, IcFB, IcShield, IcInfo, IcCheck } from '../constants/icons';

const APP_VERSION = '1.0.0';

const FEATURES = [
  { title: 'Incident Reporting', desc: 'Submit reports with photos, videos, and your GPS location — with or without an account.' },
  { title: 'Emergency Hotlines', desc: 'One-tap calling for Emergency, Medical, Police, Fire, Health, and General numbers.' },
  { title: 'Announcements', desc: 'Official notices from the LGU, posted directly to your app.' },
  { title: 'Local News', desc: 'Community updates and news relevant to Nueva Valencia.' },
  { title: 'Weather', desc: 'Current local weather conditions.' },
];

function FeatureRow({ title, desc, last }) {
  return (
    <View>
      <View style={s.featureRow}>
        <View style={s.featureIcon}><IcCheck s={14} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.featureTitle}>{title}</Text>
          <Text style={s.featureDesc}>{desc}</Text>
        </View>
      </View>
      {!last && <View style={s.groupDivider} />}
    </View>
  );
}

function ChannelCard({ icon, label, value, onPress, iconBg }) {
  return (
    <TouchableOpacity style={s.channelCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.channelIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={s.channelBody}>
        <Text style={s.channelLabel}>{label}</Text>
        <Text style={s.channelValue}>{value}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AboutScreen({ navigation }) {
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk} />

  
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <IcBack />
        </TouchableOpacity>
        <Text style={s.headerTitle}>About NVGo</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
 
        <View style={s.introCard}>
          <Image
            source={require('../assets/nvgo-logo.png')}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.introTitle}>NVGo</Text>
          <Text style={s.introSubtitle}>Nueva Valencia Go</Text>
          <View style={s.versionPill}>
            <Text style={s.versionTxt}>Version {APP_VERSION}</Text>
          </View>
        </View>

        {/* What is NVGo */}
        <Text style={s.secLabel}>WHAT IS NVGO?</Text>
        <View style={s.textCard}>
          <Text style={s.bodyText}>
            NVGo is the official mobile app of the Local Government Unit of Nueva Valencia, built to make it faster and easier for residents to stay informed and get help when they need it.
          </Text>
        </View>

        {/* Features */}
        <Text style={s.secLabel}>WHAT NVGO CAN DO</Text>
        <View style={s.featureGroup}>
          {FEATURES.map((f, i) => (
            <FeatureRow key={f.title} {...f} last={i === FEATURES.length - 1} />
          ))}
        </View>

        {/* Mission */}
        <Text style={s.secLabel}>OUR MISSION</Text>
        <View style={[s.textCard, s.missionCard]}>
          <Text style={[s.bodyText, { color: '#fff' }]}>
            To bring local government services closer to every resident of Nueva
            Valencia through accessible, reliable, and responsive digital tools.
          </Text>
        </View>

        {/* Data Privacy */}
        <Text style={s.secLabel}>DATA PRIVACY</Text>
        <View style={s.privacyCard}>
          <View style={s.privacyIcon}><IcShield /></View>
          <Text style={s.bodyTextSmall}>
            NVGo collects only the information needed to process your reports and
            provide app services (such as name, contact number, and location when
            you submit a report). Your data is handled in accordance with the Data
            Privacy Act of 2012 (RA 10173) and is not shared with third parties for
            marketing purposes.
          </Text>
        </View>

        {/* Contact */}
        <Text style={s.secLabel}>CONTACT US</Text>
        <View style={s.channelGroup}>
          <ChannelCard
            icon={<IcPhone c={C.green} />}
            label="Municipal Hotline"
            value="(033) 322 0221"
            iconBg={C.greenLt}
            borderColor={C.green}
            onPress={() => Linking.openURL('tel:0333220221')}
          />
          <View style={s.groupDivider} />
          <ChannelCard
            icon={<IcMail c={C.skyDk} />}
            label="Email"
            value="lgunuevavalencia@gmail.com"
            iconBg={C.skyBg}
            borderColor={C.skyDk}
            onPress={() => Linking.openURL('mailto:lgunuevavalencia@gmail.com')}
          />
          <View style={s.groupDivider} />
          <ChannelCard
            icon={<IcFB />}
            label="Facebook Page"
            value="Municipality of Nueva Valencia"
            iconBg="#E8F0FE"
            borderColor="#1877F2"
            onPress={() => Linking.openURL('https://www.facebook.com/MunicipalityOfNuevaValencia')}
          />
        </View>

      
        {/* Legal */}
        <Text style={s.legalTxt}>© NVGo (Nueva Valencia Go). All rights reserved.</Text>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 48, gap: 12 },

  header: {
    backgroundColor: C.greenDk,
    paddingTop: Platform.OS === 'android' ? 14 : 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },

  introCard: {
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16, marginBottom: 4,
  },
  logo: { width: 64, height: 64, marginBottom: 10, borderRadius: 14 },
  introTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  introSubtitle: { fontSize: 13, color: C.muted, marginTop: 2, marginBottom: 10 },
  versionPill: { backgroundColor: C.greenLt, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  versionTxt: { fontSize: 11, fontWeight: '700', color: C.greenDk },

  secLabel: { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.2, marginBottom: 6, marginLeft: 2, marginTop: 4 },

  textCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16 },
  bodyText: { fontSize: 13, color: C.sub, lineHeight: 20 },
  bodyTextSmall: { fontSize: 12, color: C.sub, lineHeight: 19, flex: 1 },

  missionCard: { backgroundColor: C.greenDk, borderColor: C.greenDk },

  featureGroup: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14, paddingHorizontal: 14 },
  featureIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: C.greenLt, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  featureTitle: { fontSize: 13, fontWeight: '800', color: C.text, marginBottom: 2 },
  featureDesc: { fontSize: 12, color: C.muted, lineHeight: 17 },
  groupDivider: { height: 1, backgroundColor: C.border, marginLeft: 14, marginRight: 14 },

  privacyCard: {
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    padding: 16, flexDirection: 'row', gap: 12,
  },
  privacyIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.skyBg, alignItems: 'center', justifyContent: 'center' },

  channelGroup: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  channelCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, gap: 12 },
  channelIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  channelBody: { flex: 1 },
  channelLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.3, marginBottom: 2 },
  channelValue: { fontSize: 13, fontWeight: '700', color: C.text },

  devCard: { alignItems: 'center', paddingVertical: 8, gap: 2 },
  devLabel: { fontSize: 11, color: C.muted },
  devValue: { fontSize: 12, fontWeight: '700', color: C.text },

  legalTxt: { textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 4 },
});