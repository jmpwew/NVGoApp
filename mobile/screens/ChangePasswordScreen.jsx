import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView,
  StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api_url from '../utils/api';
import { C } from '../constants/colors';
import { IcBack, IcEye, IcCheck, IcLock } from '../constants/icons';
import AlertModal from '../utils/AlertModal';


/* Password field  */
const PwField = ({ label, value, onChangeText, show, onToggle, hint }) => (
  <View style={s.fieldWrap}>
    <Text style={s.fieldLabel}>{label}</Text>
    <View style={s.inputRow}>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={hint ?? label}
        placeholderTextColor={C.muted}
        secureTextEntry={!show}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity onPress={onToggle} style={s.eyeBtn} activeOpacity={0.7}>
        <IcEye show={show}/>
      </TouchableOpacity>
    </View>
  </View>
);

/*  Strength helpers  */
const getStrength = (pw) => {
  if (!pw) return null;
  if (pw.length < 6)  return { level: 1, label: 'Weak',   color: C.red };
  if (pw.length < 8)  return { level: 2, label: 'Fair',   color: C.yellowDk };
  if (pw.length < 10 || !/[0-9]/.test(pw)) return { level: 3, label: 'Good',   color: C.sky };
  return               { level: 4, label: 'Strong', color: C.green };
};

export default function ChangePasswordScreen({ navigation }) {
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [showCurrent,setShowCurrent]= useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showConfirm,setShowConfirm]= useState(false);
  const [saving,     setSaving]     = useState(false);
  const [alertInfo,  setAlertInfo]  = useState(null); // { title, message, tone } | null

  const notify = (title, message, tone = 'error') => setAlertInfo({ title, message, tone });

  const strength = getStrength(newPw);

  /*  Validation */
  const validate = () => {
    if (!currentPw) {
      notify('Error', 'Please enter your current password.', 'error');
      return false;
    }
    if (newPw.length < 6) {
      notify('Error', 'New password must be at least 6 characters.', 'error');
      return false;
    }
    if (newPw !== confirmPw) {
      notify('Error', 'Passwords do not match.', 'error');
      return false;
    }
    return true;
  };

  /*  Submit */
  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      const stored = await AsyncStorage.getItem('user');
      if (!stored) { notify('Error', 'No user found.', 'error'); return; }

      const user = JSON.parse(stored);

      const res  = await fetch(`${api_url}/api/auth/password/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:         user.id,
          currentPassword: currentPw,
          newPassword:     newPw,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        notify('Error', data.message || 'Failed to change password.', 'error');
        return;
      }

      notify('Success', 'Password changed successfully!', 'success');
      navigation.goBack();
    } catch (err) {
      console.log('CHANGE PW ERROR:', err);
      notify('Error', 'Something went wrong.', 'error');
    } finally {
      setSaving(false);
    }
  };

  /*  RENDER  */
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk}/>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <IcBack/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Change Password</Text>
        <View style={{ width: 34 }}/>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Icon */}
        <View style={s.intro}>
          <View style={s.introIconWrap}>
            <IcLock s={38} c={C.green}/>
          </View>
          <Text style={s.introTitle}>Update your password</Text>
          <Text style={s.introSub}>
            Choose a strong password to keep your account secure.
          </Text>
        </View>

        {/* Current password */}
        <Text style={s.secLabel}>CURRENT PASSWORD</Text>
        <View style={s.card}>
          <PwField
            label="Current Password"
            hint="Enter your current password"
            value={currentPw}
            onChangeText={setCurrentPw}
            show={showCurrent}
            onToggle={() => setShowCurrent(v => !v)}
          />
        </View>

        {/* New password  */}
        <Text style={s.secLabel}>NEW PASSWORD</Text>
        <View style={s.card}>
          <PwField
            label="New Password"
            hint="At least 6 characters"
            value={newPw}
            onChangeText={setNewPw}
            show={showNew}
            onToggle={() => setShowNew(v => !v)}
          />

          {/* Strength bar */}
          {newPw.length > 0 && strength && (
            <View style={s.strengthSection}>
              <View style={s.strengthBars}>
                {[1, 2, 3, 4].map(i => (
                  <View
                    key={i}
                    style={[
                      s.strengthBar,
                      { backgroundColor: i <= strength.level ? strength.color : C.border },
                    ]}
                  />
                ))}
              </View>
              <Text style={[s.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}

          <View style={s.divider}/>

          <PwField
            label="Confirm New Password"
            hint="Re-enter new password"
            value={confirmPw}
            onChangeText={setConfirmPw}
            show={showConfirm}
            onToggle={() => setShowConfirm(v => !v)}
          />

          {/* Match indicator */}
          {confirmPw.length > 0 && (
            <View style={s.matchRow}>
              <View style={[
                s.matchDot,
                { backgroundColor: newPw === confirmPw ? C.green : C.red },
              ]}/>
              <Text style={[
                s.matchTxt,
                { color: newPw === confirmPw ? C.green : C.red },
              ]}>
                {newPw === confirmPw ? 'Passwords match' : 'Passwords do not match'}
              </Text>
            </View>
          )}
        </View>

        {/*  Tips  */}
        <View style={s.tipsCard}>
          <Text style={s.tipsTitle}>Password tips</Text>
          {[
            'Use at least 6 characters',
            'Mix letters and numbers',
            'Add special characters (e.g. @, #, !)',
            'Avoid using your name or birthday',
          ].map((tip, i) => (
            <View key={i} style={s.tipRow}>
              <View style={s.tipDot}/>
              <Text style={s.tipTxt}>{tip}</Text>
            </View>
          ))}
        </View>

        {/*  Save button */}
        <TouchableOpacity
          style={[s.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small"/>
            : <><IcCheck/><Text style={s.saveBtnTxt}>Update Password</Text></>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={s.cancelBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <Text style={s.cancelBtnTxt}>Cancel</Text>
        </TouchableOpacity>

      </ScrollView>

      <AlertModal
        visible={!!alertInfo}
        title={alertInfo?.title}
        message={alertInfo?.message}
        tone={alertInfo?.tone}
        onClose={() => setAlertInfo(null)}
      />
    </View>
  );
}
      

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  scroll:       { flex: 1 },
  scrollContent:{ padding: 16, paddingBottom: 48, gap: 8 },

  /* Header */
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

  /* Intro */
  intro:        { alignItems: 'center', paddingVertical: 24, gap: 8 },
  introIconWrap:{ width: 72, height: 72, borderRadius: 22, backgroundColor: C.greenLt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  introTitle:   { fontSize: 17, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  introSub:     { fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 17, paddingHorizontal: 20 },

  /* Section label */
  secLabel:     { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.2, marginTop: 8, marginBottom: 6, marginLeft: 2 },

  /* Card */
  card:         { backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border },
  divider:      { height: 1, backgroundColor: C.border },

  /* Field */
  fieldWrap:    { paddingVertical: 13 },
  fieldLabel:   { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.5, marginBottom: 6 },
  inputRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input:        { flex: 1, fontSize: 14, color: C.text, fontWeight: '500', paddingVertical: 0 },
  eyeBtn:       { padding: 4 },

  /* Strength */
  strengthSection: { paddingBottom: 10 },
  strengthBars: { flexDirection: 'row', gap: 5, marginBottom: 5 },
  strengthBar:  { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel:{ fontSize: 10, fontWeight: '700' },

  /* Match */
  matchRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 10 },
  matchDot:     { width: 6, height: 6, borderRadius: 3 },
  matchTxt:     { fontSize: 11, fontWeight: '600' },

  /* Tips */
  tipsCard:     { backgroundColor: C.greenLt, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, gap: 8 },
  tipsTitle:    { fontSize: 11, fontWeight: '800', color: C.green, marginBottom: 2 },
  tipRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipDot:       { width: 5, height: 5, borderRadius: 3, backgroundColor: C.green },
  tipTxt:       { fontSize: 11, color: C.sub, lineHeight: 16 },

  /* Buttons */
  saveBtn:      { backgroundColor: C.green, borderRadius: 13, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  saveBtnTxt:   { color: '#fff', fontSize: 14, fontWeight: '800' },
  cancelBtn:    { borderRadius: 13, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card },
  cancelBtnTxt: { color: C.muted, fontSize: 14, fontWeight: '600' },
});