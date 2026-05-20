import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  StyleSheet, StatusBar, Platform, ActivityIndicator,
  KeyboardAvoidingView, ScrollView, Modal, FlatList,
} from 'react-native';
import { Svg, Path, Circle, Rect } from 'react-native-svg';
import { C } from '../constants/colors';
import api_url from '../utils/api';

/* ─── Icons ──────────────────────────────────────────────────── */
const IcUser = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Circle cx="9" cy="7" r="3.2" stroke={C.muted} strokeWidth="1.4"/>
    <Path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={C.muted} strokeWidth="1.4" strokeLinecap="round"/>
  </Svg>
);
const IcMail = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Rect x="2" y="4" width="14" height="10" rx="2.5" stroke={C.muted} strokeWidth="1.4"/>
    <Path d="M2 7l7 4.5L16 7" stroke={C.muted} strokeWidth="1.3" strokeLinecap="round"/>
  </Svg>
);
const IcLock = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Rect x="3.5" y="8" width="11" height="8" rx="2.5" stroke={C.muted} strokeWidth="1.4"/>
    <Path d="M6 8V6a3 3 0 016 0v2" stroke={C.muted} strokeWidth="1.4" strokeLinecap="round"/>
    <Circle cx="9" cy="12" r="1.2" fill={C.muted}/>
  </Svg>
);
const IcPhone = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M4 2.5h-.3A1.7 1.7 0 002 4.2v.3c0 5.8 4.7 10.5 10.5 10.5h.3a1.7 1.7 0 001.7-1.7v-.3a.8.8 0 00-.5-.75L11.2 11a.8.8 0 00-.9.17L9.2 12.3A7 7 0 015.7 8.8l1.05-1.05a.8.8 0 00.17-.9L5.67 3.98A.8.8 0 004.92 3L4 2.5" stroke={C.muted} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcMap = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M9 1.5A5.5 5.5 0 013.5 7C3.5 11 9 16.5 9 16.5S14.5 11 14.5 7A5.5 5.5 0 009 1.5z" stroke={C.muted} strokeWidth="1.4"/>
    <Circle cx="9" cy="7" r="2" stroke={C.muted} strokeWidth="1.3"/>
  </Svg>
);
const IcChevron = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path d="M4 6l4 4 4-4" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcEye = ({ show }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M1.5 9S4 4 9 4s7.5 5 7.5 5S14 14 9 14 1.5 9 1.5 9z" stroke={C.muted} strokeWidth="1.4"/>
    <Circle cx="9" cy="9" r="2.2" stroke={C.muted} strokeWidth="1.4"/>
    {!show && <Path d="M2 2l14 14" stroke={C.muted} strokeWidth="1.4" strokeLinecap="round"/>}
  </Svg>
);
const IcBack = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M11 4L6 9l5 5" stroke={C.text} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcCheck = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path d="M3 8l4 4 6-6" stroke={C.green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

/* ─── Barangays ──────────────────────────────────────────────── */
const BARANGAYS = [
  'Poblacion', 'Igang', 'Lanipe', 'Lucmayan', 'Magamay',
  'Montpiller', 'Oracon Sur', 'Oracon Norte', 'Panobolon',
  'Salvacion', 'San Antonio', 'San Roque', 'Tando', 'Zaragosa',
];

/* ─── Input field ────────────────────────────────────────────── */
function InputField({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, rightElement, editable = true }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[inp.wrap, focused && inp.wrapFocused, !editable && inp.wrapDisabled]}>
      <View style={inp.icon}>{icon}</View>
      <TextInput
        style={inp.input}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {rightElement && <View style={inp.right}>{rightElement}</View>}
    </View>
  );
}
const inp = StyleSheet.create({
  wrap:         { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, height: 52, marginBottom: 12 },
  wrapFocused:  { borderColor: C.green },
  wrapDisabled: { backgroundColor: C.bg },
  icon:         { marginRight: 10 },
  input:        { flex: 1, fontSize: 15, color: C.text },
  right:        { marginLeft: 8 },
});

/* ─── Barangay picker modal ──────────────────────────────────── */
function BarangayPicker({ value, onChange }) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[inp.wrap, { marginBottom: 12 }]}
        onPress={() => setVisible(true)}
        activeOpacity={0.85}
      >
        <View style={inp.icon}><IcMap/></View>
        <Text style={[{ flex: 1, fontSize: 15 }, value ? { color: C.text } : { color: C.muted }]}>
          {value || 'Select Barangay'}
        </Text>
        <IcChevron/>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={modal.overlay} activeOpacity={1} onPress={() => setVisible(false)}/>
        <View style={modal.sheet}>
          <View style={modal.handle}/>
          <Text style={modal.title}>Select Barangay</Text>
          <FlatList
            data={BARANGAYS}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={modal.item}
                onPress={() => { onChange(item); setVisible(false); }}
                activeOpacity={0.75}
              >
                <Text style={[modal.itemTxt, item === value && { color: C.green, fontWeight: '700' }]}>
                  {item}
                </Text>
                {item === value && <IcCheck/>}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={modal.sep}/>}
          />
        </View>
      </Modal>
    </>
  );
}
const modal = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet:    { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, maxHeight: '70%' },
  handle:   { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 16 },
  title:    { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 12 },
  item:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  itemTxt:  { fontSize: 15, color: C.text },
  sep:      { height: 1, backgroundColor: C.border },
});

/* ─── Step indicator ─────────────────────────────────────────── */
function StepDot({ active, done }) {
  return (
    <View style={[step.dot,
      done  && { backgroundColor: C.green, borderColor: C.green },
      active && { borderColor: C.green },
    ]}>
      {done && (
        <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
          <Path d="M2 5l2.5 2.5 3.5-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
      )}
    </View>
  );
}
const step = StyleSheet.create({
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
});

/* ═══════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════ */
export default function RegisterScreen({ navigation }) {
  const [page, setPage] = useState(0); // 0 = personal, 1 = account
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname]   = useState('');
  const [contact, setContact]     = useState('');
  const [address, setAddress]     = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);

  const goNext = () => {
    if (!firstname.trim() || !lastname.trim()) { Alert.alert('Required', 'Please enter your full name.'); return; }
    if (!contact.trim()) { Alert.alert('Required', 'Please enter your contact number.'); return; }
    if (!address) { Alert.alert('Required', 'Please select your barangay.'); return; }
    setPage(1);
  };

  const register = async () => {
    if (!email.trim()) { Alert.alert('Required', 'Please enter your email.'); return; }
    if (!password || password.length < 6) { Alert.alert('Weak password', 'Password must be at least 6 characters.'); return; }

    try {
      setLoading(true);
      const res = await fetch(`${api_url}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstname, lastname, email: email.trim(), password, contact, address }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Registration failed', data.message || 'Please try again.');
        return;
      }
      Alert.alert('Account created!', 'You can now sign in.', [
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      console.log('REGISTER ERROR:', err);
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg}/>

      {/* Header */}
      <View style={s.navBar}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => page === 1 ? setPage(0) : navigation.goBack()}
          hitSlop={8}
        >
          <IcBack/>
        </TouchableOpacity>
        <Text style={s.navTitle}>Create Account</Text>
        <View style={{ width: 34 }}/>
      </View>

      {/* Step indicator */}
      <View style={s.stepRow}>
        <StepDot active={page === 0} done={page > 0}/>
        <View style={[s.stepLine, page > 0 && { backgroundColor: C.green }]}/>
        <StepDot active={page === 1} done={false}/>
        <View style={s.stepLine}/>
        <StepDot active={false} done={false}/>
      </View>
      <View style={s.stepLabels}>
        <Text style={[s.stepLabel, page === 0 && s.stepLabelActive]}>Personal</Text>
        <Text style={[s.stepLabel, page === 1 && s.stepLabelActive]}>Account</Text>
        <Text style={s.stepLabel}>Done</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {page === 0 ? (
          /* ── Page 1: Personal info ── */
          <View style={s.card}>
            <Text style={s.cardTitle}>Personal Information</Text>
            <Text style={s.cardSub}>Tell us about yourself</Text>
            <View style={{ height: 20 }}/>

            <Text style={s.fieldLabel}>FIRST NAME</Text>
            <InputField icon={<IcUser/>} placeholder="e.g. Juan" value={firstname} onChangeText={setFirstname}/>

            <Text style={s.fieldLabel}>LAST NAME</Text>
            <InputField icon={<IcUser/>} placeholder="e.g. dela Cruz" value={lastname} onChangeText={setLastname}/>

            <Text style={s.fieldLabel}>CONTACT NUMBER</Text>
            <InputField icon={<IcPhone/>} placeholder="09XXXXXXXXX" value={contact} onChangeText={setContact} keyboardType="phone-pad"/>

            <Text style={s.fieldLabel}>BARANGAY</Text>
            <BarangayPicker value={address} onChange={setAddress}/>

            <TouchableOpacity style={s.primaryBtn} onPress={goNext} activeOpacity={0.88}>
              <Text style={s.primaryBtnTxt}>Continue</Text>
              <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                <Path d="M7 4l5 5-5 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Page 2: Account credentials ── */
          <View style={s.card}>
            <Text style={s.cardTitle}>Account Details</Text>
            <Text style={s.cardSub}>Set your login credentials</Text>
            <View style={{ height: 20 }}/>

            <Text style={s.fieldLabel}>EMAIL ADDRESS</Text>
            <InputField icon={<IcMail/>} placeholder="you@email.com" value={email} onChangeText={setEmail} keyboardType="email-address"/>

            <Text style={s.fieldLabel}>PASSWORD</Text>
            <InputField
              icon={<IcLock/>}
              placeholder="At least 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              rightElement={
                <TouchableOpacity onPress={() => setShowPw(p => !p)} hitSlop={8}>
                  <IcEye show={showPw}/>
                </TouchableOpacity>
              }
            />

            {/* Password strength hint */}
            {password.length > 0 && (
              <View style={s.pwHint}>
                <View style={[s.pwBar, { flex: Math.min(password.length, 6), backgroundColor: password.length < 6 ? C.yellowDk : C.green }]}/>
                <View style={[s.pwBar, { flex: Math.max(6 - password.length, 0), backgroundColor: C.border }]}/>
                <Text style={[s.pwLabel, { color: password.length < 6 ? C.yellowDk : C.green }]}>
                  {password.length < 6 ? 'Too short' : password.length < 10 ? 'Good' : 'Strong'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.primaryBtn, loading && { opacity: 0.75 }, { marginTop: 20 }]}
              onPress={register}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small"/>
                : <Text style={s.primaryBtnTxt}>Create Account</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.loginLink}>
          <Text style={s.loginLinkTxt}>Already have an account? <Text style={{ color: C.green, fontWeight: '700' }}>Sign In</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.bg },
  scroll:         { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },

  /* Nav */
  navBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'android' ? 14 : 54, paddingBottom: 12, paddingHorizontal: 16 },
  backBtn:        { width: 34, height: 34, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  navTitle:       { fontSize: 16, fontWeight: '800', color: C.text },

  /* Steps */
  stepRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, marginBottom: 4 },
  stepLine:       { flex: 1, height: 2, backgroundColor: C.border },
  stepLabels:     { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  stepLabel:      { fontSize: 11, color: C.muted, fontWeight: '600' },
  stepLabelActive:{ color: C.green },

  /* Card */
  card:           { backgroundColor: C.card, borderRadius: 24, borderWidth: 1, borderColor: C.border, padding: 24, marginBottom: 16 },
  cardTitle:      { fontSize: 19, fontWeight: '800', color: C.text },
  cardSub:        { fontSize: 13, color: C.muted, marginTop: 2 },
  fieldLabel:     { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1, marginBottom: 6, marginLeft: 2 },

  /* Primary button */
  primaryBtn:     { backgroundColor: C.green, borderRadius: 14, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, shadowColor: C.green, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  primaryBtnTxt:  { color: '#fff', fontSize: 16, fontWeight: '800' },

  /* Password strength */
  pwHint:         { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -6, marginBottom: 10, height: 4 },
  pwBar:          { height: 4, borderRadius: 2 },
  pwLabel:        { fontSize: 11, fontWeight: '700', marginLeft: 4 },

  /* Login link */
  loginLink:      { alignItems: 'center', paddingVertical: 12 },
  loginLinkTxt:   { fontSize: 13, color: C.muted },
});