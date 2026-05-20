import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Alert, StatusBar,
  Platform, ActivityIndicator, Linking,
} from 'react-native';
import { Svg, Path, Circle, Rect } from 'react-native-svg';
import { C } from '../constants/colors';
import api_url from '../utils/api';

/* ─── Icons ──────────────────────────────────────────────────── */
const IcBack = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M11 4L6 9l5 5" stroke="#fff" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcPhone = ({ c = C.green }) => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Path d="M4.5 3h-.4A2 2 0 002 5v.4c0 6.5 5.2 11.7 11.7 11.7h.4a2 2 0 002-2v-.4a.9.9 0 00-.56-.83l-3.1-1.33a.9.9 0 00-1 .18L10.3 13.7A8 8 0 016.3 9.7l1.18-1.16a.9.9 0 00.18-1L6.33 4.4A.9.9 0 005.5 3.84L4.5 3.84"
      stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcMail = ({ c = C.skyDk }) => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Rect x="2" y="4" width="16" height="12" rx="2.5" stroke={c} strokeWidth="1.5"/>
    <Path d="M2 7l8 5 8-5" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
  </Svg>
);
const IcFB = ({ c = '#1877F2' }) => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Circle cx="10" cy="10" r="8" stroke={c} strokeWidth="1.5"/>
    <Path d="M11.5 7H10a.5.5 0 00-.5.5V9H11l-.3 2H9.5v5" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcUser = ({ c = C.green }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Circle cx="9" cy="7" r="3.2" stroke={c} strokeWidth="1.4"/>
    <Path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
  </Svg>
);
const IcMsg = ({ c = C.green }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Rect x="1.5" y="2.5" width="15" height="11" rx="2.5" stroke={c} strokeWidth="1.4"/>
    <Path d="M5 13.5l2 3 2-3" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M5 7h8M5 10h5" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
  </Svg>
);
const IcSend = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M15.5 2.5L8.5 9.5M15.5 2.5l-4.5 13-3-5.5-5.5-3 13-4.5z"
      stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

/* ─── Contact channel card ────────────────────────────────────── */
function ChannelCard({ icon, label, value, onPress, iconBg, borderColor }) {
  return (
    <TouchableOpacity style={[s.channelCard, { borderLeftColor: borderColor }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.channelIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={s.channelBody}>
        <Text style={s.channelLabel}>{label}</Text>
        <Text style={s.channelValue}>{value}</Text>
      </View>
      <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
        <Path d="M1.5 1.5l5 5-5 5" stroke={C.border} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
    </TouchableOpacity>
  );
}

/* ─── Form field ─────────────────────────────────────────────── */
function Field({ icon, label, value, onChangeText, multiline, keyboardType, placeholder }) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <View style={[f.inputRow, multiline && { alignItems: 'flex-start' }]}>
        <View style={[f.iconBox, multiline && { marginTop: 4 }]}>{icon}</View>
        <TextInput
          style={[f.input, multiline && { minHeight: 90, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.muted}
          multiline={multiline}
          keyboardType={keyboardType ?? 'default'}
        />
      </View>
    </View>
  );
}
const f = StyleSheet.create({
  wrap:     { marginBottom: 14 },
  label:    { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.5, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 4, gap: 10 },
  iconBox:  { width: 22, alignItems: 'center' },
  input:    { flex: 1, fontSize: 14, color: C.text, paddingVertical: 10 },
});

/* ═══════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════ */
export default function ContactSupportScreen({ navigation }) {
  const [senderName, setSenderName] = useState('');
  const [message, setMessage]       = useState('');
  const [sending, setSending]       = useState(false);
  const [sent, setSent]             = useState(false);

  const handleSend = async () => {
    if (!senderName.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Required', 'Please enter a message.');
      return;
    }

    try {
      setSending(true);

      const res = await fetch(`${api_url}/api/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: senderName.trim(), message: message.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send');
      }

      setSent(true);
      setSenderName('');
      setMessage('');
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk}/>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <IcBack/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Contact Support</Text>
        <View style={{ width: 34 }}/>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro */}
        <View style={s.introCard}>
          <Text style={s.introTitle}>We're here to help</Text>
          <Text style={s.introSub}>
            Reach us through any of the channels below, or send a message directly and we'll get back to you.
          </Text>
        </View>

        {/* Contact channels */}
        <Text style={s.secLabel}>REACH US DIRECTLY</Text>
        <View style={s.channelGroup}>
          <ChannelCard
            icon={<IcPhone c={C.green}/>}
            label="Municipal Hotline"
            value="(033) 581-0002"
            iconBg={C.greenLt}
            borderColor={C.green}
            onPress={() => Linking.openURL('tel:033581002')}
          />
          <View style={s.groupDivider}/>
          <ChannelCard
            icon={<IcPhone c={C.green}/>}
            label="MDRRMO Emergency"
            value="0917-123-4567"
            iconBg={C.greenLt}
            borderColor={C.green}
            onPress={() => Linking.openURL('tel:09171234567')}
          />
          <View style={s.groupDivider}/>
          <ChannelCard
            icon={<IcMail c={C.skyDk}/>}
            label="Email"
            value="nuevavalencia.lgu@gmail.com"
            iconBg={C.skyBg}
            borderColor={C.skyDk}
            onPress={() => Linking.openURL('mailto:nuevavalencia.lgu@gmail.com')}
          />
          <View style={s.groupDivider}/>
          <ChannelCard
            icon={<IcFB/>}
            label="Facebook Page"
            value="LGU Nueva Valencia Official"
            iconBg="#E8F0FE"
            borderColor="#1877F2"
            onPress={() => Linking.openURL('https://www.facebook.com')}
          />
        </View>

        {/* Message form */}
        <Text style={s.secLabel}>SEND A MESSAGE</Text>
        <View style={s.formCard}>
          {sent ? (
            <View style={s.successBox}>
              <View style={s.successIcon}>
                <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
                  <Circle cx="16" cy="16" r="14" stroke={C.green} strokeWidth="2"/>
                  <Path d="M9 16l5 5 9-9" stroke={C.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              </View>
              <Text style={s.successTitle}>Message sent!</Text>
              <Text style={s.successSub}>
                Thank you for reaching out. The municipal office will respond within 1–2 business days.
              </Text>
              <TouchableOpacity style={s.sendAnotherBtn} onPress={() => setSent(false)} activeOpacity={0.85}>
                <Text style={s.sendAnotherTxt}>Send another message</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Field
                icon={<IcUser/>}
                label="YOUR NAME"
                placeholder="Full name"
                value={senderName}
                onChangeText={setSenderName}
              />
              <Field
                icon={<IcMsg/>}
                label="MESSAGE"
                placeholder="Describe your concern or question..."
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <TouchableOpacity
                style={[s.sendBtn, sending && { opacity: 0.7 }]}
                onPress={handleSend}
                disabled={sending}
                activeOpacity={0.88}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" size="small"/>
                ) : (
                  <>
                    <IcSend/>
                    <Text style={s.sendBtnTxt}>Send Message</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Office hours note */}
        <View style={s.hoursCard}>
          <Text style={s.hoursTitle}>Office Hours</Text>
          <Text style={s.hoursRow}>Monday – Friday: 8:00 AM – 5:00 PM</Text>
          <Text style={s.hoursRow}>Saturday: 8:00 AM – 12:00 PM</Text>
          <Text style={s.hoursRow}>Sunday & Holidays: Closed</Text>
        </View>

      </ScrollView>
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  scroll:       { flex: 1 },
  scrollContent:{ padding: 16, paddingBottom: 48, gap: 12 },

  header: {
    backgroundColor: C.greenDk,
    paddingTop: Platform.OS === 'android' ? 14 : 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn:      { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { color: '#fff', fontSize: 16, fontWeight: '700' },

  introCard:    { backgroundColor: C.greenDk, borderRadius: 16, padding: 18, marginBottom: 4 },
  introTitle:   { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  introSub:     { color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 18 },

  secLabel:     { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.2, marginBottom: 6, marginLeft: 2, marginTop: 4 },

  channelGroup: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  channelCard:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, gap: 12, borderLeftWidth: 4 },
  channelIcon:  { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  channelBody:  { flex: 1 },
  channelLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.3, marginBottom: 2 },
  channelValue: { fontSize: 13, fontWeight: '700', color: C.text },
  groupDivider: { height: 1, backgroundColor: C.border, marginLeft: 66 },

  formCard:     { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16 },

  sendBtn:      { backgroundColor: C.green, borderRadius: 13, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, shadowColor: C.green, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  sendBtnTxt:   { color: '#fff', fontSize: 14, fontWeight: '800' },

  successBox:   { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 12 },
  successIcon:  { width: 68, height: 68, borderRadius: 20, backgroundColor: C.greenLt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  successTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 8 },
  successSub:   { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 19, marginBottom: 20 },
  sendAnotherBtn: { borderWidth: 1.5, borderColor: C.green, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24 },
  sendAnotherTxt: { color: C.green, fontSize: 13, fontWeight: '800' },

  hoursCard:    { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, borderLeftWidth: 4, borderLeftColor: C.skyDk },
  hoursTitle:   { fontSize: 13, fontWeight: '800', color: C.text, marginBottom: 8 },
  hoursRow:     { fontSize: 12, color: C.sub, marginBottom: 4, lineHeight: 18 },
});