import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, Platform, ActivityIndicator,
  KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { C } from '../constants/colors';
import api_url from '../utils/api';
import { IcMail } from '../constants/icons';
import AlertModal from '../utils/AlertModal';

function InputField({ icon, placeholder, value, onChangeText, keyboardType }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[inp.wrap, focused && inp.wrapFocused]}>
      <View style={inp.icon}>{icon}</View>
      <TextInput
        style={inp.input}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}
const inp = StyleSheet.create({
  wrap:        { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, height: 52, marginBottom: 14 },
  wrapFocused: { borderColor: C.green },
  icon:        { marginRight: 10 },
  input:       { flex: 1, fontSize: 15, color: C.text },
});

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null); // { title, message } | null

  const notify = (title, message) => setAlertInfo({ title, message });

  const handleSendOtp = async () => {
    if (!email.trim()) {
      notify('Required', 'Please enter your email address.');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${api_url}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify('Error', data.message || 'Failed to send OTP.');
        return;
      }
      navigation.navigate('VerifyOtp', { email: email.trim() });
    } catch (err) {
      notify('Error', 'Something went wrong. Please try again.');
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
        {/* Back button */}
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnTxt}>← Back</Text>
        </TouchableOpacity>

        {/* Top decoration */}
        <View style={s.topDecor}>
          <View style={s.decorCircle1} />
          <View style={s.decorCircle2} />
        </View>

        {/* Header */}
        <View style={s.header}>
          <View style={s.iconCircle}>
            <IcMail size={32} color={C.green} />
          </View>
          <Text style={s.title}>Forgot Password?</Text>
          <Text style={s.subtitle}>
            Enter your email address and we'll send you a 6-digit code to reset your password.
          </Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <InputField
            icon={<IcMail />}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.75 }]}
            onPress={handleSendOtp}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.btnTxt}>Send Code</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>Municipality of Nueva Valencia, Guimaras</Text>
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
  root:         { flex: 1, backgroundColor: C.bg },
  scroll:       { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  backBtn:      { marginTop: Platform.OS === 'android' ? 16 : 8, marginBottom: 8, alignSelf: 'flex-start' },
  backBtnTxt:   { fontSize: 15, color: C.green, fontWeight: '600' },

  topDecor:     { position: 'absolute', top: 0, left: 0, right: 0, height: 260, overflow: 'hidden' },
  decorCircle1: { position: 'absolute', top: -80, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: C.greenLt },
  decorCircle2: { position: 'absolute', top: -40, right: 60, width: 140, height: 140, borderRadius: 70, backgroundColor: C.border },

  header:       { alignItems: 'center', paddingTop: 60, marginBottom: 32 },
  iconCircle:   { width: 72, height: 72, borderRadius: 36, backgroundColor: C.greenLt, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title:        { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 10 },
  subtitle:     { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 12 },

  card:         { backgroundColor: C.card, borderRadius: 24, borderWidth: 1, borderColor: C.border, padding: 24, shadowColor: C.green, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 },

  btn:          { backgroundColor: C.green, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: C.green, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  btnTxt:       { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  footer:       { textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 28 },
});