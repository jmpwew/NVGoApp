import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Image, ScrollView,
  StatusBar, Platform, ActivityIndicator, Modal, Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

import api_url from '../utils/api';
import { getImageUrl } from '../utils/getImageUrl';
import { IcBack, IcCamera, IcSave, IcLock, IcMail, IcChevron, IcDefaultAvatar, IcTrash, IcImage} from '../constants/icons';
import AlertModal from '../utils/AlertModal';


import {C} from '../constants/colors';



const BARANGAYS = [
  'Cabalagnan', 'Calaya', 'Canhawan', 'Concordia Sur', 'Dolores',
  'Guiwanon', 'Igang', 'Igdarapdap', 'La Paz', 'Lanipe',
  'Lucmayan', 'Magamay', 'Napandong', 'Oracon Sur', 'Pandaraonan',
  'Panobolon', 'Poblacion', 'Salvacion', 'San Antonio', 'San Roque',
  'Santo Domingo', 'Tando',
];

/*Fields*/
const Field = ({ label, value, onChangeText, keyboardType, autoCapitalize }) => (
  <View style={s.fieldWrap}>
    <Text style={s.fieldLabel}>{label}</Text>
    <TextInput
      style={s.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={label}
      placeholderTextColor={C.muted}
      keyboardType={keyboardType ?? 'default'}
      autoCapitalize={autoCapitalize ?? 'words'}
    />
  </View>
);


export default function EditProfileScreen({ navigation }) {
  const [userId, setUserId] = useState(null);
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [image, setImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null); // { title, message, tone } | null

  const notify = (title, message, tone = 'error') => setAlertInfo({ title, message, tone });
 

  useEffect(() => {
    loadUser();
    const unsubscribe = navigation.addListener('focus', loadUser);
    return unsubscribe;
  }, [navigation]);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (!stored) return;
      const u = JSON.parse(stored);
      setUserId(u.id);
      setFirstname(u.firstname || '');
      setLastname(u.lastname || '');
      setEmail(u.email || '');
      setContact(u.contact || '');
      setAddress(u.address || '');
      setCurrentImage(u.image || null);
      setImage(null);
      setRemoveImage(false);
      setImgFailed(false);
  

    } catch (err) {
      console.log('LOAD USER ERROR:', err);
    }
  };

  const pickImage = async () => {
    setPhotoMenuVisible(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
      setRemoveImage(false);
      setImgFailed(false);
    }
  };

  const removePhoto = () => {
    setPhotoMenuVisible(false);
    setImage(null);
    setCurrentImage(null);
    setRemoveImage(true);
  };

  const saveProfile = async () => {
  if (!userId) { notify('Error', 'User ID missing.', 'error'); return; }
  try {
    setSaving(true);

    const token = await AsyncStorage.getItem('token');

    const formData = new FormData();
    formData.append('firstname', firstname);
    formData.append('lastname', lastname);
    formData.append('email', email);
    formData.append('contact', contact);
    formData.append('address', address);
    formData.append('user_id', userId);

    if (image) {
      formData.append('image', {
        uri:  image.uri,
        name: `profile_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
    } else if (removeImage) {
      formData.append('remove_image', 'true');
    }

    const res = await fetch(`${api_url}/api/profile`, {
      method: 'PUT',
     
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
      const data = await res.json();

      if (!res.ok) { notify('Error', data.message || 'Update failed.', 'error'); return; }
      if (!data.user) { notify('Error', 'No user data returned.', 'error'); return; }

      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      setImage(null);
      setRemoveImage(false);
      setCurrentImage(data.user.image || null);
      setImgFailed(false);
      notify('Success', 'Profile updated!', 'success');
      navigation.goBack();
    } catch (err) {
      console.log('UPDATE ERROR:', err);
      notify('Error', 'Update failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const avatarSource = image
    ? { uri: image.uri }
    : currentImage
      ? { uri: getImageUrl(currentImage) }
      : null;

  /* rednerr */
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk}/>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <IcBack/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Profile</Text>
        <View style={{ width: 34 }}/>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/*avatar */}
        <View style={s.avatarSection}>
          <View style={s.avatarWrap}>
            {avatarSource && !imgFailed ? (
              <Image
                source={avatarSource}
                style={s.avatar}
                onError={(e) => {
                  console.warn('Edit profile avatar failed to load:', avatarSource?.uri, e.nativeEvent?.error);
                  setImgFailed(true);
                }}
              />
            ) : (
              <View style={[s.avatar, s.avatarSvgWrap]}>
                <IcDefaultAvatar size={84}/>
              </View>
            )}
            <TouchableOpacity style={s.cameraBtn} onPress={() => setPhotoMenuVisible(true)} activeOpacity={0.85}>
              <IcCamera/>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setPhotoMenuVisible(true)}>
            <Text style={s.changePicTxt}>Tap to change photo</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={photoMenuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPhotoMenuVisible(false)}
        >
          <Pressable style={s.menuOverlay} onPress={() => setPhotoMenuVisible(false)}>
            <Pressable style={s.menuCard} onPress={() => {}}>
              <Text style={s.menuTitle}>Profile Photo</Text>

              <TouchableOpacity style={s.menuItem} onPress={pickImage} activeOpacity={0.75}>
                <IcImage/>
                <Text style={s.menuItemTxt}>Choose Photo</Text>
              </TouchableOpacity>

              {avatarSource && (
                <>
                  <View style={s.menuDivider}/>
                  <TouchableOpacity style={s.menuItem} onPress={removePhoto} activeOpacity={0.75}>
                    <IcTrash/>
                    <Text style={[s.menuItemTxt, { color: C.red }]}>Remove Photo</Text>
                  </TouchableOpacity>
                </>
              )}

              <View style={s.menuDivider}/>
              <TouchableOpacity style={s.menuItem} onPress={() => setPhotoMenuVisible(false)} activeOpacity={0.75}>
                <Text style={[s.menuItemTxt, { color: C.muted }]}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/*  Personal info  */}
        <Text style={s.secLabel}>PERSONAL INFO</Text>
        <View style={s.card}>
          <Field label="First Name" value={firstname} onChangeText={setFirstname}/>
          <View style={s.divider}/>
          <Field label="Last Name"  value={lastname}  onChangeText={setLastname}/>
        </View>

        {/*contact*/}
        <Text style={s.secLabel}>CONTACT</Text>

        {/* Email — display only, navigate to change screen */}
        <TouchableOpacity
          style={s.card}
          onPress={() => navigation.navigate('ChangeEmail')}
          activeOpacity={0.75}
        >
          <View style={s.pwRow}>
            <View style={s.pwLeft}>
              <Text style={s.fieldLabel}>Email</Text>
              <Text style={s.emailTxt}>{email || '—'}</Text>
            </View>
            <View style={s.pwRight}>
              <IcMail/>
              <Text style={s.pwChangeTxt}>Change</Text>
              <IcChevron/>
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ height: 8 }}/>

        <View style={s.card}>
          <Field
            label="Contact Number"
            value={contact}
            onChangeText={setContact}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
        </View>

        {/* abrangay */}
        <Text style={s.secLabel}>BARANGAY</Text>
        <View style={s.card}>
          <Text style={s.fieldLabel}>Address</Text>
          <View style={s.pickerWrap}>
            <Picker
              selectedValue={address}
              onValueChange={setAddress}
              style={s.picker}
              dropdownIconColor={C.green}
            >
              {BARANGAYS.map((b, i) => (
                <Picker.Item key={i} label={b} value={b} color={C.text}/>
              ))}
            </Picker>
          </View>
        </View>

        {/* ── Password — display only, navigate to change screen ── */}
        <Text style={s.secLabel}>PASSWORD</Text>
        <TouchableOpacity
          style={s.card}
          onPress={() => navigation.navigate('ChangePassword')}
          activeOpacity={0.75}
        >
          <View style={s.pwRow}>
            <View style={s.pwLeft}>
              <Text style={s.fieldLabel}>Password</Text>
              <Text style={s.pwDots}>••••••••
              </Text>
            </View>
            <View style={s.pwRight}>
              <IcLock/>
              <Text style={s.pwChangeTxt}>Change</Text>
              <IcChevron/>
            </View>
          </View>
        </TouchableOpacity>

        {/* Buttons  */}
        <TouchableOpacity
          style={[s.saveBtn, saving && { opacity: 0.7 }]}
          onPress={saveProfile}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small"/>
            : <><IcSave/><Text style={s.saveBtnTxt}>Save Changes</Text></>
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

/* Styles  */
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

  /* Avatar */
  avatarSection:{ alignItems: 'center', paddingVertical: 20 },
  avatarWrap:   { position: 'relative' },
  avatar:       { width: 90, height: 90, borderRadius: 26, borderWidth: 3, borderColor: C.yellow },
  avatarSvgWrap:{ alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cameraBtn:    { position: 'absolute', bottom: -4, right: -4, width: 30, height: 30, borderRadius: 10, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.greenDk },
  changePicTxt: { marginTop: 10, fontSize: 12, color: C.muted },

  /* Photo options menu */
  menuOverlay:  { flex: 1, backgroundColor: 'rgba(13,33,22,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  menuCard:     { width: '100%', maxWidth: 320, backgroundColor: C.card, borderRadius: 16, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  menuTitle:    { fontSize: 12, fontWeight: '800', color: C.muted, letterSpacing: 0.5, textAlign: 'center', paddingVertical: 12 },
  menuItem:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 18 },
  menuItemTxt:  { fontSize: 14, fontWeight: '700', color: C.text },
  menuDivider:  { height: 1, backgroundColor: C.border, marginHorizontal: 10 },

  /* Section label */
  secLabel:     { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.2, marginTop: 8, marginBottom: 6, marginLeft: 2 },

  /* Card */
  card:         { backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border },
  divider:      { height: 1, backgroundColor: C.border },

  /* Field */
  fieldWrap:    { paddingVertical: 12 },
  fieldLabel:   { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.5, marginBottom: 5 },
  input:        { fontSize: 14, color: C.text, fontWeight: '500', paddingVertical: 0 },

  /* Picker */
  pickerWrap:   { marginTop: -6, marginBottom: -4 },
  picker:       { color: C.text, marginLeft: -8 },

  /* Password display row */
  pwRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  pwLeft:       { flex: 1 },
  pwDots:       { fontSize: 16, color: C.text, letterSpacing: 3, marginTop: 2 },
  emailTxt:     { fontSize: 14, color: C.text, fontWeight: '600', marginTop: 2 },
  pwRight:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pwChangeTxt:  { fontSize: 13, fontWeight: '700', color: C.green },

  /* Buttons */
  saveBtn:      { backgroundColor: C.green, borderRadius: 13, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  saveBtnTxt:   { color: '#fff', fontSize: 14, fontWeight: '800' },
  cancelBtn:    { borderRadius: 13, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card },
  cancelBtnTxt: { color: C.muted, fontSize: 14, fontWeight: '600' },
});