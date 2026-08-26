import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, Platform, ActivityIndicator,
  KeyboardAvoidingView, ScrollView, Modal, FlatList,
} from 'react-native';
import { C } from '../constants/colors';
import api_url from '../utils/api';
import Svg, { Path } from 'react-native-svg';
import {IcBack, IcUser, IcMail, IcLock, IcPhone, IcMap, IcChevron, IcEye, IcCheck} from '../constants/icons';
import AlertModal from '../utils/AlertModal';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

// Password policy: 8+ chars, at least one letter and one number.
const PASSWORD_RULES = [
  { id: 'len',  label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { id: 'letter', label: 'At least one letter', test: (pw) => /[a-zA-Z]/.test(pw) },
  { id: 'num', label: 'At least one number', test: (pw) => /[0-9]/.test(pw) },
];
const isPasswordValid = (pw) => PASSWORD_RULES.every(r => r.test(pw));




const BARANGAYS = [
  'Cabalagnan', 'Calaya', 'Canhawan', 'Concordia Sur', 'Dolores',
  'Guiwanon', 'Igang', 'Igdarapdap', 'La Paz', 'Lanipe',
  'Lucmayan', 'Magamay', 'Napandong', 'Oracon Sur', 'Pandaraonan',
  'Panobolon', 'Poblacion', 'Salvacion', 'San Antonio', 'San Roque',
  'Santo Domingo', 'Tando',
];

// input fiekds
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
  wrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, height: 52, marginBottom: 12 },
  wrapFocused:  { borderColor: C.green },
  wrapDisabled: { backgroundColor: C.bg },
  icon:   { marginRight: 10 },
  input:   { flex: 1, fontSize: 15, color: C.text },
  right: { marginLeft: 8 },
});

// barangay picker modal
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

// steps
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


export default function RegisterScreen({ navigation }) {
  const [page, setPage] = useState(0); 
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname]= useState('');
  const [contact, setContact]  = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slowNotice, setSlowNotice] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null); 

  const notify = (title, message) => setAlertInfo({ title, message });

  const goNext = () => {
  if (!firstname.trim() || !lastname.trim()) { notify('Required', 'Please enter your full name.'); return; }
  if (!contact.trim()) { notify('Required', 'Please enter your contact number.'); return; }

 
  const phoneRegex = /^(09|\+639)\d{9}$/;
  if (!phoneRegex.test(contact.trim())) {
    notify('Invalid Number', 'Please enter a valid contact number (e.g. 09123456789).');
    return;
  }

  if (!address) { notify('Required', 'Please select your barangay.'); return; }
  setPage(1);
};

  const register = async () => {
  if (!email.trim()) { notify('Required', 'Please enter your email.'); return; }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    notify('Invalid Email', 'Please enter a valid email address (e.g. juan@gmail.com).');
    return;
  }

  if (!isPasswordValid(password)) {
    notify('Weak password', 'Password must be at least 8 characters and include a letter and a number.');
    return;
  }

  try {
    setLoading(true);
    setSlowNotice(false);
    const res = await fetchWithTimeout(
      `${api_url}/api/auth/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstname, lastname, email: email.trim(), password, contact, address }),
      },
      { onSlow: () => setSlowNotice(true) }
    );
    const data = await res.json();
    if (!res.ok) {
      notify('Registration failed', data.message || 'Please try again.');
      return;
    }
    navigation.navigate('VerifyRegisterOtp', { email: email.trim() });
  } catch (err) {
    console.log('REGISTER ERROR:', err);
    notify('Error', err.isTimeout ? err.message : 'Registration failed. Please try again.');
  } finally {
    setLoading(false);
    setSlowNotice(false);
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
          <IcBack stroke={C.text}/>
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
          // page1 
          <View style={s.card}>
            <Text style={s.cardTitle}>Personal Information</Text>
            <Text style={s.cardSub}>Tell us about yourself</Text>
            <View style={{ height: 20 }}/>

            <Text style={s.fieldLabel}>FIRST NAME</Text>
            <InputField icon={<IcUser/>} placeholder="e.g. Juan" value={firstname} onChangeText={setFirstname}/>

            <Text style={s.fieldLabel}>LAST NAME</Text>
            <InputField icon={<IcUser/>} placeholder="e.g. dela Cruz" value={lastname} onChangeText={setLastname}/>


            <Text style={s.fieldLabel}>CONTACT NUBER</Text>
            <InputField 
              icon={<IcPhone/>} 
              placeholder="09XXXXXXXXX" 
              value={contact} 
              onChangeText={setContact} 
              keyboardType="phone-pad"
              maxLength={11}   
            />
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
      //  page 2
          <View style={s.card}>
            <Text style={s.cardTitle}>Account Details</Text>
            <Text style={s.cardSub}>Set your login credentials</Text>
            <View style={{ height: 20 }}/>

            <Text style={s.fieldLabel}>EMAIL ADDRESS</Text>
            <InputField icon={<IcMail/>} placeholder="you@email.com" value={email} onChangeText={setEmail} keyboardType="email-address"/>

            <Text style={s.fieldLabel}>PASSWORD</Text>
            <InputField
              icon={<IcLock/>}
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              rightElement={
                <TouchableOpacity onPress={() => setShowPw(p => !p)} hitSlop={8}>
                  <IcEye show={showPw}/>
                </TouchableOpacity>
              }
            />

          
            <View style={s.pwChecklist}>
              {PASSWORD_RULES.map(rule => {
                const met = rule.test(password);
                return (
                  <View key={rule.id} style={s.pwRuleRow}>
                    <View style={[s.pwDot, met && s.pwDotMet]}>
                      {met && (
                        <Svg width={8} height={8} viewBox="0 0 10 10" fill="none">
                          <Path d="M2 5l2.5 2.5 3.5-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </Svg>
                      )}
                    </View>
                    <Text style={[s.pwRuleTxt, met && s.pwRuleTxtMet]}>{rule.label}</Text>
                  </View>
                );
              })}
            </View>

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

            {slowNotice && (
              <Text style={s.slowTxt}>Still working — the server may be waking up, this can take up to a minute.</Text>
            )}
          </View>
        )}

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.loginLink}>
          <Text style={s.loginLinkTxt}>Already have an account? <Text style={{ color: C.green, fontWeight: '700' }}>Sign In</Text></Text>
        </TouchableOpacity>
      </ScrollView>

      <AlertModal
        visible={!!alertInfo}
        title={alertInfo?.title}
        message={alertInfo?.message}
        tone="error"
        onClose={() => setAlertInfo(null)}
      />
    </KeyboardAvoidingView>
  );
}


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

  /* Password requirements checklist */
  pwChecklist:    { marginTop: -2, marginBottom: 6, gap: 6 },
  pwRuleRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pwDot:          { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  pwDotMet:       { backgroundColor: C.green, borderColor: C.green },
  pwRuleTxt:      { fontSize: 12, color: C.muted },
  pwRuleTxtMet:   { color: C.green, fontWeight: '600' },
  slowTxt:        { textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 12, lineHeight: 17 },

  /* Login link */
  loginLink:      { alignItems: 'center', paddingVertical: 12 },
  loginLinkTxt:   { fontSize: 13, color: C.muted },
});