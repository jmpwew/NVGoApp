import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, Platform, ActivityIndicator,
  KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { C } from '../constants/colors';
import api_url from '../utils/api';
import { IcLock, IcEye } from '../constants/icons';
import AlertModal from '../utils/AlertModal';

// 6 individual OTP digit boxes
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
      {[0,1,2,3,4,5].map(i => (
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
  row:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  box:      { width: 46, height: 54, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg, textAlign: 'center', fontSize: 22, fontWeight: '800', color: C.text },
  boxFilled:{ borderColor: C.green, backgroundColor: C.greenLt },
});

function PasswordField({ placeholder, value, onChangeText }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow]       = useState(false);
  return (
    <View style={[pf.wrap, focused && pf.focused]}>
      <View style={pf.icon}><IcLock /></View>
      <TextInput
        style={pf.input}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!show}
        autoCapitalize="none"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <TouchableOpacity onPress={() => setShow(p => !p)} hitSlop={8}>
        <IcEye show={show} />
      </TouchableOpacity>
    </View>
  );
}
const pf = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, height: 52, marginBottom: 14 },
  focused: { borderColor: C.green },
  icon:    { marginRight: 10 },
  input:   { flex: 1, fontSize: 15, color: C.text },
});

export default function VerifyOtpScreen({ navigation, route }) {
  const { email } = route.params;
  const [otp, setOtp]             = useState('');
  const [newPassword, setNew]     = useState('');
  const [confirmPw, setConfirm]   = useState('');
  const [step, setStep]           = useState('otp'); // 'otp' | 'reset'
  const [loading, setLoading]     = useState(false);
  const [resendCd, setResendCd]   = useState(0);
  const [alertInfo, setAlertInfo] = useState(null); // { title, message, tone, onOk } | null

  const notify = (title, message, tone = 'error', onOk) =>
    setAlertInfo({ title, message, tone, onOk });

  // Resend cooldown timer
  const startCooldown = () => {
    setResendCd(60);
    const t = setInterval(() => {
      setResendCd(c => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleVerify = async () => {
    if (otp.length < 6) {
      notify('Required', 'Please enter the 6-digit code.', 'error');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${api_url}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify('Error', data.message || 'Invalid OTP.', 'error');
        return;
      }
      setStep('reset');
    } catch {
      notify('Error', 'Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!newPassword.trim()) {
      notify('Required', 'Please enter a new password.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      notify('Too short', 'Password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPw) {
      notify('Mismatch', 'Passwords do not match.', 'error');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${api_url}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify('Error', data.message || 'Failed to reset password.', 'error');
        return;
      }
      notify('Success', 'Your password has been reset. Please sign in.', 'success', () =>
        navigation.navigate('Login')
      );
    } catch {
      notify('Error', 'Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCd > 0) return;
    try {
      setLoading(true);
      await fetch(`${api_url}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      notify('Sent', 'A new code has been sent to your email.', 'success');
      setOtp('');
      startCooldown();
    } catch {
      notify('Error', 'Could not resend. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnTxt}>← Back</Text>
        </TouchableOpacity>

        <View style={s.topDecor}>
          <View style={s.decorCircle1} />
          <View style={s.decorCircle2} />
        </View>

        <View style={s.header}>
          <View style={s.iconCircle}>
            <IcLock size={32} color={C.green} />
          </View>
          {step === 'otp' ? (
            <>
              <Text style={s.title}>Enter Code</Text>
              <Text style={s.subtitle}>
                We sent a 6-digit code to{'\n'}
                <Text style={s.emailHighlight}>{email}</Text>
              </Text>
            </>
          ) : (
            <>
              <Text style={s.title}>New Password</Text>
              <Text style={s.subtitle}>Create a strong new password for your account.</Text>
            </>
          )}
        </View>

        <View style={s.card}>
          {step === 'otp' ? (
            <>
              <OtpInput value={otp} onChange={setOtp} />

              <TouchableOpacity
                style={[s.btn, (loading || otp.length < 6) && { opacity: 0.65 }]}
                onPress={handleVerify}
                disabled={loading || otp.length < 6}
                activeOpacity={0.88}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.btnTxt}>Verify Code</Text>
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
            </>
          ) : (
            <>
              <PasswordField
                placeholder="New password"
                value={newPassword}
                onChangeText={setNew}
              />
              <PasswordField
                placeholder="Confirm new password"
                value={confirmPw}
                onChangeText={setConfirm}
              />

              <TouchableOpacity
                style={[s.btn, loading && { opacity: 0.75 }]}
                onPress={handleReset}
                disabled={loading}
                activeOpacity={0.88}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.btnTxt}>Reset Password</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={s.footer}>Municipality of Nueva Valencia, Guimaras</Text>
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
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.bg },
  scroll:         { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  backBtn:        { marginTop: Platform.OS === 'android' ? 16 : 8, marginBottom: 8, alignSelf: 'flex-start' },
  backBtnTxt:     { fontSize: 15, color: C.green, fontWeight: '600' },

  topDecor:       { position: 'absolute', top: 0, left: 0, right: 0, height: 260, overflow: 'hidden' },
  decorCircle1:   { position: 'absolute', top: -80, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: C.greenLt },
  decorCircle2:   { position: 'absolute', top: -40, right: 60, width: 140, height: 140, borderRadius: 70, backgroundColor: C.border },

  header:         { alignItems: 'center', paddingTop: 60, marginBottom: 32 },
  iconCircle:     { width: 72, height: 72, borderRadius: 36, backgroundColor: C.greenLt, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title:          { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 10 },
  subtitle:       { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20 },
  emailHighlight: { fontWeight: '700', color: C.green },

  card:           { backgroundColor: C.card, borderRadius: 24, borderWidth: 1, borderColor: C.border, padding: 24, shadowColor: C.green, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 },

  btn:            { backgroundColor: C.green, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: C.green, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  btnTxt:         { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  resendBtn:      { marginTop: 16, alignItems: 'center' },
  resendTxt:      { fontSize: 14, color: C.green, fontWeight: '600' },

  footer:         { textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 28 },
});