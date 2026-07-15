import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  StyleSheet, StatusBar, Platform, ActivityIndicator,
  KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { C } from '../constants/colors';
import api_url from '../utils/api';
import { IcMail } from '../constants/icons';

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

export default function VerifyRegisterOtpScreen({ navigation, route }) {
  const { email } = route.params;
  const [code, setCode]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [resendCd, setResendCd] = useState(0);

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
    if (code.length < 6) {
      Alert.alert('Required', 'Please enter the 6-digit code.');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${api_url}/api/auth/verify-register-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data.message || 'Invalid OTP.');
        return;
      }
      Alert.alert('Account created!', 'You can now sign in.', [
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCd > 0) return;
    try {
      setLoading(true);
      const res = await fetch(`${api_url}/api/auth/resend-register-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data.message || 'Could not resend.');
        return;
      }
      Alert.alert('Sent', 'A new code has been sent to your email.');
      setCode('');
      startCooldown();
    } catch {
      Alert.alert('Error', 'Could not resend. Try again.');
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
            <IcMail s={32} c={C.green} />
          </View>
          <Text style={s.title}>Verify Your Email</Text>
          <Text style={s.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={s.emailHighlight}>{email}</Text>
          </Text>
        </View>

        <View style={s.card}>
          <OtpInput value={code} onChange={setCode} />

          <TouchableOpacity
            style={[s.btn, (loading || code.length < 6) && { opacity: 0.65 }]}
            onPress={handleVerify}
            disabled={loading || code.length < 6}
            activeOpacity={0.88}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.btnTxt}>Verify & Create Account</Text>
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

        <Text style={s.footer}>Municipality of Nueva Valencia, Guimaras</Text>
      </ScrollView>
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
