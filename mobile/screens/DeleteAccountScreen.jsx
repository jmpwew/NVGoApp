import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView,
  StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api_url from '../utils/api';
import { C } from '../constants/colors';
import { IcBack, IcTrash, IcEye } from '../constants/icons';
import ConfirmModal from '../utils/ConfirmModal';
import AlertModal from '../utils/AlertModal';

export default function DeleteAccountScreen({ navigation }) {
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [confirmed, setConfirmed]   = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [alertInfo, setAlertInfo]   = useState(null); // { title, message, tone, onOk } | null

  const notify = (title, message, tone = 'error', onOk) =>
    setAlertInfo({ title, message, tone, onOk });

  const handleDelete = () => {
    if (!password) {
      notify('Required', 'Please enter your password to confirm.');
      return;
    }
    if (!confirmed) {
      notify('Required', 'Please check the confirmation box.');
      return;
    }
    setConfirmDelete(true);
  };

  const doDelete = async () => {
    setConfirmDelete(false);
    try {
      setDeleting(true);
      const stored = await AsyncStorage.getItem('user');
      const token  = await AsyncStorage.getItem('token');
      if (!stored || !token) return;

      const user = JSON.parse(stored);

      const res = await fetch(`${api_url}/api/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: user.id, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        notify('Error', data.message || 'Failed to delete account.', 'error');
        return;
      }

      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');

      notify('Account Deleted', 'Your account has been permanently deleted.', 'success', () =>
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
      );
    } catch (err) {
      console.log(err);
      notify('Error', 'Something went wrong. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <IcBack />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Delete Account</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Icon + intro */}
        <View style={s.intro}>
          <View style={s.introIconWrap}>
            <IcTrash c={C.red} />
          </View>
          <Text style={s.introTitle}>Delete your account?</Text>
          <Text style={s.introSub}>
            This action is permanent and cannot be undone.{'\n'}
        
          </Text>
        </View>

        

        {/* Password confirmation */}
        <Text style={s.secLabel}>CONFIRM YOUR IDENTITY</Text>
        <View style={s.card}>
          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>ENTER YOUR PASSWORD</Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Your current password"
                placeholderTextColor={C.muted}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPw(v => !v)} style={s.eyeBtn} activeOpacity={0.7}>
                <IcEye show={showPw} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Checkbox confirmation */}
        <TouchableOpacity
          style={s.checkRow}
          onPress={() => setConfirmed(v => !v)}
          activeOpacity={0.75}
        >
          <View style={[s.checkbox, confirmed && s.checkboxChecked]}>
            {confirmed && <Text style={s.checkmark}>✓</Text>}
          </View>
          <Text style={s.checkLabel}>
            I understand that deleting my account is permanent and cannot be recovered.
          </Text>
        </TouchableOpacity>

        {/* Delete button */}
        <TouchableOpacity
          style={[s.deleteBtn, (!confirmed || !password || deleting) && s.deleteBtnDisabled]}
          onPress={handleDelete}
          disabled={!confirmed || !password || deleting}
          activeOpacity={0.85}
        >
          {deleting
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.deleteBtnTxt}>Delete My Account</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={s.cancelBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <Text style={s.cancelBtnTxt}>Cancel, Keep My Account</Text>
        </TouchableOpacity>

      </ScrollView>

      <ConfirmModal
        visible={confirmDelete}
        title="Final Warning"
        message="This will permanently delete your account and all your data. This cannot be undone."
        confirmLabel="Delete My Account"
        tone="danger"
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(false)}
      />

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

  intro:        { alignItems: 'center', paddingVertical: 24, gap: 8 },
  introIconWrap:{ width: 72, height: 72, borderRadius: 22, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FECACA' },
  introTitle:   { fontSize: 17, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  introSub:     { fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },

  secLabel:     { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.2, marginTop: 8, marginBottom: 6, marginLeft: 2 },

  warningCard:  { backgroundColor: '#FEF2F2', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FECACA', borderLeftWidth: 3.5, borderLeftColor: C.red, gap: 10 },
  warningRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  warningDot:   { fontSize: 11, color: C.red, fontWeight: '800', marginTop: 1 },
  warningTxt:   { flex: 1, fontSize: 12, color: '#7F1D1D', lineHeight: 17 },

  noteCard:     { backgroundColor: C.greenLt, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, gap: 8 },
  tipRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tipDot:       { width: 5, height: 5, borderRadius: 3, backgroundColor: C.green, marginTop: 5 },
  tipTxt:       { flex: 1, fontSize: 11, color: C.sub, lineHeight: 16 },

  card:         { backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border },
  fieldWrap:    { paddingVertical: 13 },
  fieldLabel:   { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.5, marginBottom: 6 },
  inputRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input:        { flex: 1, fontSize: 14, color: C.text, fontWeight: '500', paddingVertical: 0 },
  eyeBtn:       { padding: 4 },

  checkRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, marginTop: 4 },
  checkbox:     { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  checkboxChecked: { backgroundColor: C.red, borderColor: C.red },
  checkmark:    { color: '#fff', fontSize: 12, fontWeight: '800' },
  checkLabel:   { flex: 1, fontSize: 12, color: C.text, lineHeight: 18 },

  deleteBtn:        { backgroundColor: C.red, borderRadius: 13, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  deleteBtnDisabled:{ opacity: 0.4 },
  deleteBtnTxt:     { color: '#fff', fontSize: 14, fontWeight: '800' },
  cancelBtn:        { borderRadius: 13, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card },
  cancelBtnTxt:     { color: C.muted, fontSize: 14, fontWeight: '600' },
});