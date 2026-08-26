import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, Platform, LayoutAnimation, UIManager,
} from 'react-native';
import { C } from '../constants/colors';
import { IcBack, IcChevron, IcInfo } from '../constants/icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_GROUPS = [
  {
    heading: 'GETTING STARTED',
    items: [
      {
        q: 'What is NVGo?',
        a: 'NVGo is the official mobile app of the Local Government Unit of Nueva Valencia. It lets you report incidents, view emergency hotlines, and stay updated on announcements, news, and weather.',
      },
      {
        q: 'Do I need an account to use NVGo?',
        a: 'No. You can submit incident reports as a guest. Creating an account lets you track your report status, receive notifications, and save your details for faster reporting next time.',
      },
      {
        q: 'How do I create an account?',
        a: 'Tap Register, enter your name and email, then verify your email with the 6-digit code (OTP) sent to you.',
      },
      {
        q: "I didn't receive my OTP code. What do I do?",
        a: 'Check your spam or junk folder and make sure you have a stable internet connection. If it still doesn\u2019t arrive, use the Resend option on the verification screen.',
      },
    ],
  },
  {
    heading: 'INCIDENT REPORTING',
    items: [
      {
        q: 'How do I submit a report?',
        a: 'Go to the Report tab, describe the incident, attach photos or videos if you have them, and confirm your GPS location (or add a location note if GPS is unavailable).',
      },
      {
        q: 'Can I report an incident without signing in?',
        a: 'Yes. Guest reports are supported \u2014 just enter your name and contact number so responders can reach you.',
      },
      {
        q: 'How do I check the status of my report?',
        a: 'Go to Profile > My Reports (this requires an account) to see whether your reports are Pending or Resolved.',
      },
      {
        q: 'What happens after I submit a report?',
        a: 'Your report is routed to the relevant LGU office or verifier for review, and updated as it\u2019s acted on.',
      },
    ],
  },
  {
    heading: 'EMERGENCY HOTLINES',
    items: [
      {
        q: 'How do I call a hotline?',
        a: 'Open the Emergency tab, tap a category (Emergency, Medical, Police, Fire, Health, General), and confirm to place the call.',
      },
      {
        q: 'Will hotline numbers still work if I don\u2019t have internet?',
        a: 'Yes. NVGo saves the last-loaded hotline list on your device so it\u2019s available even when you\u2019re offline.',
      },
    ],
  },
  {
    heading: 'ANNOUNCEMENTS & NEWS',
    items: [
      {
        q: 'Where do official notices show up?',
        a: 'Official LGU announcements appear on your Home screen as soon as they\u2019re posted.',
      },
      {
        q: 'What\u2019s the difference between News and Announcements?',
        a: 'Announcements are official notices from the LGU. News covers broader community updates relevant to Nueva Valencia.',
      },
    ],
  },
  {
    heading: 'NOTIFICATIONS',
    items: [
      {
        q: 'Why am I not receiving notifications?',
        a: 'Make sure notifications are enabled for NVGo in your phone\u2019s settings, that you\u2019re logged in, and that you have an internet connection.',
      },
    ],
  },
  {
    heading: 'ACCOUNT & PROFILE',
    items: [
      {
        q: 'How do I change my email or password?',
        a: 'Go to Profile > Security, then choose Change Email or Change Password.',
      },
      {
        q: 'I forgot my password. What now?',
        a: 'Tap Forgot Password on the login screen. You\u2019ll receive a reset code by email to set a new one.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Profile > Delete Account and confirm with your password. This action is permanent and cannot be undone.',
      },
    ],
  },
  {
    heading: 'PRIVACY & DATA',
    items: [
      {
        q: 'What personal data does NVGo collect?',
        a: 'Only what\u2019s needed to process your reports and provide app services \u2014 such as your name, contact number, and location when you submit a report. Your data is handled in accordance with the Data Privacy Act of 2012 (RA 10173) and is never shared with third parties for marketing.',
      },
    ],
  },
  {
    heading: 'STILL NEED HELP?',
    items: [
      {
        q: 'Who do I contact for other concerns?',
        a: 'Use Contact Support from your Profile, or reach the LGU directly through the phone number, email, or Facebook page listed under About NVGo.',
      },
    ],
  },
];

function FAQItem({ q, a, expanded, onToggle, last }) {
  return (
    <View>
      <TouchableOpacity style={s.qRow} activeOpacity={0.7} onPress={onToggle}>
        <Text style={s.qText}>{q}</Text>
        <View style={[s.chevWrap, expanded && s.chevWrapOpen]}>
          <IcChevron s={7} c={C.muted} />
        </View>
      </TouchableOpacity>
      {expanded && (
        <View style={s.aWrap}>
          <Text style={s.aText}>{a}</Text>
        </View>
      )}
      {!last && <View style={s.groupDivider} />}
    </View>
  );
}

export default function FAQScreen({ navigation }) {
  const [openKey, setOpenKey] = useState(null);

  const toggle = (key) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenKey(openKey === key ? null : key);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk} />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <IcBack />
        </TouchableOpacity>
        <Text style={s.headerTitle}>FAQs / How to Use</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.introCard}>
          <View style={s.introIcon}><IcInfo s={20} /></View>
          <Text style={s.introText}>
            Answers to common questions about using NVGo. Tap a question to expand it.
          </Text>
        </View>

        {FAQ_GROUPS.map((group, gi) => (
          <View key={group.heading}>
            <Text style={s.secLabel}>{group.heading}</Text>
            <View style={s.group}>
              {group.items.map((item, ii) => {
                const key = `${gi}-${ii}`;
                return (
                  <FAQItem
                    key={key}
                    q={item.q}
                    a={item.a}
                    expanded={openKey === key}
                    onToggle={() => toggle(key)}
                    last={ii === group.items.length - 1}
                  />
                );
              })}
            </View>
          </View>
        ))}

        <Text style={s.legalTxt}>Can you find what you're looking for? Contact Support from your Profile.</Text>
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
    padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 4,
  },
  introIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.skyBg, alignItems: 'center', justifyContent: 'center' },
  introText: { flex: 1, fontSize: 12, color: C.sub, lineHeight: 18 },

  secLabel: { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.2, marginBottom: 6, marginLeft: 2, marginTop: 4 },

  group: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },

  qRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14 },
  qText: { flex: 1, fontSize: 13, fontWeight: '700', color: C.text, lineHeight: 18 },
  chevWrap: { transform: [{ rotate: '90deg' }] },
  chevWrapOpen: { transform: [{ rotate: '-90deg' }] },

  aWrap: { paddingHorizontal: 14, paddingBottom: 16, paddingTop: 2 },
  aText: { fontSize: 12, color: C.sub, lineHeight: 19 },

  groupDivider: { height: 1, backgroundColor: C.border, marginLeft: 14, marginRight: 14 },

  legalTxt: { textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 4 },
});
