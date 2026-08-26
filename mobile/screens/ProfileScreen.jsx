import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, StatusBar, Platform, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api_url from '../utils/api';
import { getImageUrl } from '../utils/getImageUrl';
import { IcBell2, IcUserEdit, IcReport, IcSupport, IcInfo, IcHelp, IcLogout, IcLogin, IcChevron, IcCamera, IcShield, IcLock, IcTrash, IcDefaultAvatar } from '../constants/icons';

import {C} from '../constants/colors';
import ConfirmModal from '../utils/ConfirmModal';
import AlertModal from '../utils/AlertModal';


const MenuItem = ({ icon, label, iconBg, onPress, danger, last }) => (
  <View>
    <TouchableOpacity style={s.menuItem} onPress={onPress} activeOpacity={0.75}>
      <View style={[s.menuIconWrap, { backgroundColor: iconBg ?? C.greenLt }]}>
        {icon}
      </View>
      <Text style={[s.menuLabel, danger && { color: C.red }]}>{label}</Text>
      <IcChevron/>
    </TouchableOpacity>
    {!last && <View style={s.menuDivider}/>}
  </View>
);


export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const notify = (title, message, tone = 'info') => setAlertInfo({ title, message, tone });

  useEffect(() => {
    loadUser();
    const unsubscribe = navigation.addListener('focus', loadUser);
    return unsubscribe;
  }, []);

  const loadUser = async () => {
    const stored = await AsyncStorage.getItem('user');
    setUser(stored ? JSON.parse(stored) : null);
    setImgFailed(false);
  };

  const requireLogin = (callback) => {
    if (!user) {
      setLoginPrompt(true);
      return;
    }
    callback();
  };

  const handleLogout = () => {
    setConfirmLogout(true);
  };

  const doLogout = async () => {
    setConfirmLogout(false);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    setUser(null);
  };


   


  const imageUrl = getImageUrl(user?.image);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk}/>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* HERO HEADER */}
        <View style={s.hero}>
          <View style={s.orb1}/>
          <View style={s.orb2}/>

          <View style={s.avatarWrap}>
            {imageUrl && !imgFailed ? (
              <Image
                source={{ uri: imageUrl }}
                style={s.avatar}
                onError={(e) => {
                  console.warn('Profile avatar failed to load:', imageUrl, e.nativeEvent?.error);
                  setImgFailed(true);
                }}
              />
            ) : (
              <View style={[s.avatar, s.avatarSvgWrap]}>
                <IcDefaultAvatar size={86}/>
              </View>
            )}
            {user && (
              <TouchableOpacity
                style={s.cameraBtn}
                onPress={() => navigation.navigate('ProfileDetails')}
                activeOpacity={0.85}
              >
                <IcCamera/>
              </TouchableOpacity>
            )}
          </View>

          <Text style={s.heroName}>
            {user ? `${user.firstname} ${user.lastname}` : 'Guest User'}
          </Text>
          <Text style={s.heroSub}>
            {user?.address ? ` ${user.address}` : 'Nueva Valencia, Guimaras'}
          </Text>
        </View>

        {/* GUEST BANNER */}
        {!user && (
          <View style={s.guestBanner}>
            <View>
              <Text style={s.guestTitle}>Not logged in</Text>
              <Text style={s.guestSub}>Login to access all features</Text>
            </View>
            <TouchableOpacity
              style={s.loginNowBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
            >
              <Text style={s.loginNowTxt}>Login</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ACCOUNT SECTION */}
        <Text style={s.secLabel}>ACCOUNT</Text>
        <View style={s.menuCard}>
          <MenuItem
            icon={<IcBell2/>}
            iconBg={C.skyBg}
            label="Notifications"
            onPress={() => requireLogin(() => navigation.navigate('Notifications'))}
          />
          <MenuItem
            icon={<IcUserEdit/>}
            iconBg={C.greenLt}
            label="Profile Details"
            onPress={() => requireLogin(() => navigation.navigate('ProfileDetails'))}
          />
          <MenuItem
            icon={<IcReport/>}
            iconBg={C.yellowBg}
            label="My Reports"
            onPress={() => requireLogin(() => navigation.navigate('MyReports'))}
            last
          />
        </View>

        {/* GENERAL SECTION */}
        <Text style={s.secLabel}>GENERAL</Text>
        <View style={s.menuCard}>
          <MenuItem
            icon={<IcSupport/>}
            iconBg={C.greenLt}
            label="Contact Support"
            onPress={() => navigation.navigate('ContactSupport')}
          />
          <MenuItem
            icon={<IcHelp/>}
            iconBg={C.skyBg}
            label="FAQs / How to Use"
            onPress={() => navigation.navigate('FAQ')}
          />
          <MenuItem
            icon={<IcInfo/>}
            iconBg={C.skyBg}
            label="About NVGo"
            onPress={() => navigation.navigate('About')}
          />
        </View>

        {/* SECURITY SECTION */}
        <Text style={s.secLabel}>SECURITY</Text>
        <View style={s.menuCard}>
          <MenuItem
            icon={<IcLock/>}
            iconBg={C.greenLt}
            label="Change Password"
            onPress={() => requireLogin(() => navigation.navigate('ChangePassword'))}
          />
          <MenuItem
            icon={<IcTrash/>}
            iconBg={C.redBg}
            label="Delete Account"
            onPress={() => requireLogin(() => navigation.navigate('DeleteAccount'))}
            danger
            last
          />
        </View>

        {/* SESSION SECTION */}
        <Text style={s.secLabel}>SESSION</Text>
        <View style={s.menuCard}>
          {user ? (
            <MenuItem
              icon={<IcLogout/>}
              iconBg={C.redBg}
              label="Logout"
              onPress={handleLogout}
              danger
              last
            />
          ) : (
            <MenuItem
              icon={<IcLogin/>}
              iconBg={C.greenLt}
              label="Login"
              onPress={() => navigation.navigate('Login')}
              last
            />
          )}
        </View>

        <Text style={s.version}>NVGo · Nueva Valencia, Guimaras</Text>

      </ScrollView>

      <ConfirmModal
        visible={confirmLogout}
        title="Logout"
        message="Are you sure you want to log out?"
        confirmLabel="Logout"
        tone="danger"
        onConfirm={doLogout}
        onCancel={() => setConfirmLogout(false)}
      />

      <ConfirmModal
        visible={loginPrompt}
        title="Login Required"
        message="Please log in first."
        confirmLabel="Login"
        cancelLabel="Cancel"
        onConfirm={() => {
          setLoginPrompt(false);
          navigation.navigate('Login');
        }}
        onCancel={() => setLoginPrompt(false)}
      />

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
  scrollContent:{ paddingBottom: 50 },

  hero: {
    backgroundColor: C.greenDk,
    alignItems: 'center',
    paddingTop:  Platform.OS === 'android' ? 24 : 58,
    paddingBottom: 28,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  orb1: { position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(245,196,0,0.07)' },
  orb2: { position: 'absolute', bottom: -40, left: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)' },

  avatarWrap:   { position: 'relative', marginBottom: 14 },
  avatar:       { width: 92, height: 92, borderRadius: 28, borderWidth: 3, borderColor: C.yellow },
  avatarSvgWrap:{ alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cameraBtn:    { position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: 9, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.greenDk },

  heroName:     { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  heroSub:      { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 12 },

  guestBanner:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.yellowBg, marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.yellowDk + '30' },
  guestTitle:   { fontSize: 13, fontWeight: '700', color: C.text },
  guestSub:     { fontSize: 11, color: C.muted, marginTop: 2 },
  loginNowBtn:  { backgroundColor: C.green, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  loginNowTxt:  { color: '#fff', fontSize: 12, fontWeight: '800' },

  secLabel:     { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.2, marginTop: 20, marginBottom: 8, marginLeft: 18 },

  menuCard:     { backgroundColor: C.card, marginHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  menuItem:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  menuIconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuLabel:    { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },
  menuDivider:  { height: 1, backgroundColor: C.border, marginLeft: 66 },

  version:      { textAlign: 'center', fontSize: 10, color: C.muted, marginTop: 24, marginBottom: 4 },
});