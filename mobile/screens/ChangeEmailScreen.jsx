import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView,
  StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api_url from '../utils/api';
import { C } from '../constants/colors';
import { IcBack, IcCheck, IcMail } from '../constants/icons';
import AlertModal from '../utils/AlertModal';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

// 6 letter otp
function OtpInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split('');

  const handleChange = (text, idx) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned && !digits[idx]) return;
    const arr = [...digits];
    if (cleaned) {
      arr[idx] = cleaned[cleaned.length - 1];
      onChange(arr.join('').slice(0, 6));
      if (idx < 5) inputs.current[idx + 1]?.focus();
    } else {
      arr[idx] = '';
      onChange(arr.join(''));
      if (idx > 0) inputs.current[idx - 1]?.focus();
    }
  };

  const handleKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  return (
    <View style={otp.row}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <TextInput
          key={i}
          ref={r => inputs.current[i] = r}
          style={[otp.box, digits[i] ? otp.boxFilled : null]}
          value={digits[i] || ''}
          onChangeText={t => handleChange(t, i)}
          onKeyPress={e => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}
const otp = StyleSheet.create({
  row:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  box:      { width: 46, height: 54, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg, textAlign: 'center', fontSize: 22, fontWeight: '800', color: C.text },
  boxFilled:{ borderColor: C.green, backgroundColor: C.greenLt },
});

export default function ChangeEmailScreen({ navigation }) {
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail]         = useState('');
  const [otpVal, setOtpVal]             = useState('');
  const [step, setStep]                 = useState('intro'); // 'intro' | 'otp' | 'newEmail'
  const [loading, setLoading]           = useState(false);
  const [slowNotice, setSlowNotice]     = useState(false);
  const [resendCd, setResendCd]         = useState(0);
  const [alertInfo, setAlertInfo]       = useState(null); // { title, message, tone, onOk } | null

  const notify = (title, message, tone = 'error', onOk) =>
    setAlertInfo({ title, message, tone, onOk });

  useEffect(() => { loadEmail(); }, []);

  const loadEmail = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (!stored) return;
      const u = JSON.parse(stored);
      setCurrentEmail(u.email || '');
    } catch (err) {
      console.log('LOAD EMAIL ERROR:', err);
    }
  };

  const startCooldown = () => {
    setResendCd(60);
    const t = setInterval(() => {
      setResendCd(c => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const getToken = () => AsyncStorage.getItem('token');

  // Step 1 -> send OTP to the CURRENT email
  const handleSendOtp = async () => {
    try {
      setLoading(true);
      setSlowNotice(false);
      const token = await getToken();

      const res = await fetchWithTimeout(
        `${api_url}/api/profile/email/send-otp`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } },
        { onSlow: () => setSlowNotice(true) }
      );
      const data = await res.json();

      if (!res.ok) { notify('Error', data.message || 'Could not send code.', 'error'); return; }

      setStep('otp');
      startCooldown();
    } catch (err) {
      console.log('SEND EMAIL OTP ERROR:', err);
      notify('Error', err.isTimeout ? err.message : 'Something went wrong.', 'error');
    } finally {
      setLoading(false);
      setSlowNotice(false);
    }
  };

  const handleResend = async () => {
    if (resendCd > 0) return;
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`${api_url}/api/profile/email/send-otp`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { notify('Error', data.message || 'Could not resend.', 'error'); return; }
      notify('Sent', 'A new code has been sent to your current email.', 'success');
      setOtpVal('');
      startCooldown();
    } catch {
      notify('Error', 'Could not resend. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> verify the OTP that was sent to the current email
  const handleVerify = async () => {
    if (otpVal.length < 6) {
      notify('Required', 'Please enter the 6-digit code.', 'error');
      return;
    }
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`${api_url}/api/profile/email/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ otp: otpVal }),
      });
      const data = await res.json();
      if (!res.ok) { notify('Error', data.message || 'Invalid code.', 'error'); return; }

      setStep('newEmail');
    } catch (err) {
      console.log('VERIFY EMAIL OTP ERROR:', err);
      notify('Error', 'Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 -> submit the new email address
  const handleChangeEmail = async () => {
    const trimmed = newEmail.trim();
    if (!trimmed) {
      notify('Required', 'Please enter your new email address.', 'error');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmed)) {
      notify('Invalid Email', 'Please enter a valid email address.', 'error');
      return;
    }

    try {
      setLoading(true);
      setSlowNotice(false);
      const token = await getToken();

      const res = await fetchWithTimeout(
        `${api_url}/api/profile/email`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ newEmail: trimmed }),
        },
        { onSlow: () => setSlowNotice(true) }
      );
      const data = await res.json();

      if (!res.ok) { notify('Error', data.message || 'Failed to update email.', 'error'); return; }
      if (!data.user) { notify('Error', 'No user data returned.', 'error'); return; }

      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      notify('Success', 'Your email has been updated!', 'success', () => navigation.goBack());
    } catch (err) {
      console.log('CHANGE EMAIL ERROR:', err);
      notify('Error', err.isTimeout ? err.message : 'Something went wrong.', 'error');
    } finally {
      setLoading(false);
      setSlowNotice(false);
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
        <Text style={s.headerTitle}>Change Email</Text>
        <View style={{ width: 34 }}/>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Icon / intro */}
        <View style={s.intro}>
          <View style={s.introIconWrap}>
            <IcMail s={34} c={C.green}/>
          </View>
          {step === 'intro' && (
            <>
              <Text style={s.introTitle}>Update your email</Text>
              <Text style={s.introSub}>
                For your security, we'll send a verification code to your current email before you can set a new one.
              </Text>
            </>
          )}
          {step === 'otp' && (
            <>
              <Text style={s.introTitle}>Enter Code</Text>
              <Text style={s.introSub}>
                We sent a 6-digit code to{'\n'}
                <Text style={s.emailHighlight}>{currentEmail}</Text>
              </Text>
            </>
          )}
          {step === 'newEmail' && (
            <>
              <Text style={s.introTitle}>New Email</Text>
              <Text style={s.introSub}>Enter the new email address for your account.</Text>
            </>
          )}
        </View>

        {step === 'intro' && (
          <>
            <Text style={s.secLabel}>CURRENT EMAIL</Text>
            <View style={s.card}>
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Email</Text>
                <Text style={s.staticValue}>{currentEmail || '—'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[s.saveBtn, loading && { opacity: 0.7 }]}
              onPress={handleSendOtp}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small"/>
                : <Text style={s.saveBtnTxt}>Send Verification Code</Text>
              }
            </TouchableOpacity>
          </>
        )}

        {step === 'otp' && (
          <View style={s.card}>
            <OtpInput value={otpVal} onChange={setOtpVal}/>

            <TouchableOpacity
              style={[s.saveBtn, (loading || otpVal.length < 6) && { opacity: 0.65 }]}
              onPress={handleVerify}
              disabled={loading || otpVal.length < 6}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small"/>
                : <><IcCheck/><Text style={s.saveBtnTxt}>Verify Code</Text></>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.resendBtn, resendCd > 0 && { opacity: 0.5 }]}
              onPress={handleResend}
              disabled={resendCd > 0 || loading}
            >
              <Text style={s.resendTxt}>
                {resendCd > 0 ? `Resend code in ${resendCd}s` : "Didn't receive it? Resend"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'newEmail' && (
          <>
            <Text style={s.secLabel}>NEW EMAIL</Text>
            <View style={s.card}>
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>New Email</Text>
                <TextInput
                  style={s.input}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="Enter new email address"
                  placeholderTextColor={C.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[s.saveBtn, loading && { opacity: 0.7 }]}
              onPress={handleChangeEmail}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small"/>
                : <><IcCheck/><Text style={s.saveBtnTxt}>Update Email</Text></>
              }
            </TouchableOpacity>
          </>
        )}

        {slowNotice && (
          <Text style={s.slowTxt}>Still working — the server may be waking up, this can take up to a minute.</Text>
        )}

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
        onClose={() => {
          const cb = alertInfo?.onOk;
          setAlertInfo(null);
          if (cb) cb();
        }}
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
  emailHighlight:{ fontWeight: '700', color: C.green },

  /* Section label */
  secLabel:     { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.2, marginTop: 8, marginBottom: 6, marginLeft: 2 },

  /* Card */
  card:         { backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: C.border },

  /* Field */
  fieldWrap:    { paddingVertical: 12 },
  fieldLabel:   { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.5, marginBottom: 5 },
  input:        { fontSize: 14, color: C.text, fontWeight: '500', paddingVertical: 0 },
  staticValue:  { fontSize: 14, color: C.text, fontWeight: '600' },

  /* Buttons */
  saveBtn:      { backgroundColor: C.green, borderRadius: 13, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  saveBtnTxt:   { color: '#fff', fontSize: 14, fontWeight: '800' },
  cancelBtn:    { borderRadius: 13, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card, marginTop: 10 },
  cancelBtnTxt: { color: C.muted, fontSize: 14, fontWeight: '600' },
  slowTxt:      { textAlign: 'center', fontSize: 12, color: C.muted, marginTop: 12, marginHorizontal: 20, lineHeight: 17 },

  resendBtn:    { marginTop: 14, alignItems: 'center' },
  resendTxt:    { fontSize: 13, color: C.green, fontWeight: '600' },
});
