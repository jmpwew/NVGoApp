import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  StyleSheet, StatusBar, Platform, ActivityIndicator,
  KeyboardAvoidingView, ScrollView, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../constants/colors';
import api_url from '../utils/api';
import { IcMail, IcLock, IcEye} from '../constants/icons';
import { registerPushToken } from '../utils/registerPushToken';




const LogoMark = () => (
  <Image
    source={require('../assets/nvgo-logo.png')}
    style={{ width: 90, height: 90, borderRadius: 22 }}
    resizeMode="cover"
  />
);

// input
function InputField({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, rightElement }) {
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
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {rightElement && <View style={inp.right}>{rightElement}</View>}
    </View>
  );
}
const inp = StyleSheet.create({
  wrap:        { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, height: 52, marginBottom: 14 },
  wrapFocused: { borderColor: C.green },
  icon:        { marginRight: 10 },
  input:       { flex: 1, fontSize: 15, color: C.text },
  right:       { marginLeft: 8 },
});

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${api_url}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Login failed', data.message || 'Invalid credentials.');
        return;
      }
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      await registerPushToken();
      navigation.replace('Main');
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={C.bg}/>
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top decoration */}
        <View style={s.topDecor}>
          <View style={s.decorCircle1}/>
          <View style={s.decorCircle2}/>
        </View>

        {/* Logo + heading */}
        <View style={s.header}>
          <LogoMark/>
     
          <Text style={s.tagline}>Nueva Valencia at your fingertips</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Welcome back</Text>
          <Text style={s.cardSub}>Sign in to your account</Text>

          <View style={{ height: 20 }}/>

          <InputField
            icon={<IcMail/>}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <InputField
            icon={<IcLock/>}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPw}
            rightElement={
              <TouchableOpacity onPress={() => setShowPw(p => !p)} hitSlop={8}>
                <IcEye show={showPw}/>
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            style={[s.loginBtn, loading && { opacity: 0.75 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small"/>
              : <Text style={s.loginBtnTxt}>Sign In</Text>
            }
          </TouchableOpacity>

          <View style={s.dividerRow}>
            <View style={s.dividerLine}/>
            <Text style={s.dividerTxt}>or</Text>
            <View style={s.dividerLine}/>
          </View>

          <TouchableOpacity
            style={s.registerBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={s.registerBtnTxt}>Create an account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={s.footer}>
          Municipality of Nueva Valencia, Guimaras
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  scroll:       { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  /* Decoration */
  topDecor:     { position: 'absolute', top: 0, left: 0, right: 0, height: 260, overflow: 'hidden' },
  decorCircle1: { position: 'absolute', top: -80, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: C.greenLt },
  decorCircle2: { position: 'absolute', top: -40, right: 60, width: 140, height: 140, borderRadius: 70, backgroundColor: C.border },

  /* Header */
  header:       { alignItems: 'center', paddingTop: Platform.OS === 'android' ? 60 : 80, marginBottom: 32 },
  appName:      { fontSize: 28, fontWeight: '800', color: C.greenDk, marginTop: 14, letterSpacing: -0.5 },
  tagline:      { fontSize: 13, color: C.muted, marginTop: 4 },

  /* Card */
  card:         { backgroundColor: C.card, borderRadius: 24, borderWidth: 1, borderColor: C.border, padding: 24, shadowColor: C.green, shadowOpacity: 0.06, shadowRadius: 20, elevation: 3 },
  cardTitle:    { fontSize: 20, fontWeight: '800', color: C.text },
  cardSub:      { fontSize: 13, color: C.muted, marginTop: 2 },

  /* Login button */
  loginBtn:     { backgroundColor: C.green, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: C.green, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  loginBtnTxt:  { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  /* Divider */
  dividerRow:   { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: C.border },
  dividerTxt:   { marginHorizontal: 12, fontSize: 12, color: C.muted, fontWeight: '600' },

  /* Register button */
  registerBtn:  { borderWidth: 1.5, borderColor: C.green, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' },
  registerBtnTxt: { color: C.green, fontSize: 15, fontWeight: '700' },

  /* Footer */
  footer:       { textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 28 },
});