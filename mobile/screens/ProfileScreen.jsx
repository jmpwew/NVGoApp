import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Alert, StatusBar, Platform, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Svg, Path, Rect, Circle } from 'react-native-svg';
import api_url from '../utils/api';

/*  Colors */
import {C} from '../constants/colors';
/* SVG Icons  */
const IcBell = ({ c = C.skyDk }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M9 1a5 5 0 00-5 5v3.5L2.5 12h13L14 9.5V6A5 5 0 009 1z" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
    <Path d="M7 14a2 2 0 004 0" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
  </Svg>
);
const IcUserEdit = ({ c = C.green }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Circle cx="8" cy="7" r="3" stroke={c} strokeWidth="1.4"/>
    <Path d="M2 16c0-3.3 2.7-6 6-6" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    <Path d="M12 13l2-2 1.5 1.5-2 2H12v-1.5z" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcReport = ({ c = C.yellowDk }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Rect x="3" y="2" width="12" height="14" rx="2.5" stroke={c} strokeWidth="1.4"/>
    <Path d="M6 6.5h6M6 9h6M6 11.5h4" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    <Circle cx="13" cy="13" r="3" fill={c}/>
    <Path d="M11.8 13l.9.9 1.8-1.8" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcSupport = ({ c = C.green }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Circle cx="9" cy="9" r="7" stroke={c} strokeWidth="1.4"/>
    <Path d="M6.5 6.5A2.5 2.5 0 019 4a2.5 2.5 0 012.5 2.5c0 1.4-.9 2-1.8 2.6-.5.3-.7.7-.7 1.2" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    <Circle cx="9" cy="13" r="1" fill={c}/>
  </Svg>
);
const IcInfo = ({ c = C.skyDk }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Circle cx="9" cy="9" r="7" stroke={c} strokeWidth="1.4"/>
    <Path d="M9 8v5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="9" cy="5.5" r="1" fill={c}/>
  </Svg>
);
const IcLogout = ({ c = C.red }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M7 3H4.5A1.5 1.5 0 003 4.5v9A1.5 1.5 0 004.5 15H7" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    <Path d="M12 6l3 3-3 3M15 9H7" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcLogin = ({ c = C.green }) => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M11 3h2.5A1.5 1.5 0 0115 4.5v9A1.5 1.5 0 0113.5 15H11" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    <Path d="M6 12l3-3-3-3M9 9H3" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcChevron = () => (
  <Svg width={7} height={12} viewBox="0 0 8 12" fill="none">
    <Path d="M1.5 1.5l5 5-5 5" stroke={C.border} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcCamera = () => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Path d="M2 5A1.5 1.5 0 013.5 3.5H4.5L5.5 2h3l1 1.5H10.5A1.5 1.5 0 0112 5v5.5A1.5 1.5 0 0110.5 12h-7A1.5 1.5 0 012 10.5V5z" stroke="#fff" strokeWidth="1.2"/>
    <Circle cx="7" cy="7.5" r="1.8" stroke="#fff" strokeWidth="1.1"/>
  </Svg>
);
const IcShield = () => (
  <Svg width={12} height={12} viewBox="0 0 14 14" fill="none">
    <Path d="M7 1L2 3v4c0 3.5 2.3 5.5 5 6.5 2.7-1 5-3 5-6.5V3L7 1z" fill={C.green} stroke={C.greenDk} strokeWidth="0.8"/>
    <Path d="M4.5 7l2 2 3-3" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

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

  useEffect(() => {
    loadUser();
    const unsubscribe = navigation.addListener('focus', loadUser);
    return unsubscribe;
  }, []);

 
  const loadUser = async () => {
    const stored = await AsyncStorage.getItem('user');
    setUser(stored ? JSON.parse(stored) : null);
  };

 
  const requireLogin = (callback) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in first.');
      navigation.navigate('Login');
      return;
    }
    callback();
  };

  /* Logout */
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('user');
          setUser(null);
        },
      },
    ]);
  };

  const imageUrl = user?.image
    ? `${api_url}/uploads/${user.image}`
    : null;

  /* RENDER  */
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk}/>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* HERO HEADER  */}
        <View style={s.hero}>
          <View style={s.orb1}/>
          <View style={s.orb2}/>

          {/* Avatar */}
          <View style={s.avatarWrap}>
            <Image
              source={
                imageUrl
                  ? { uri: imageUrl }
                  : require('../assets/default-avatar.png')
              }
              style={s.avatar}
            />
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

          {/* Name & address */}
          <Text style={s.heroName}>
            {user ? `${user.firstname} ${user.lastname}` : 'Guest User'}
          </Text>
          <Text style={s.heroSub}>
            {user?.address ? ` ${user.address}` : 'Nueva Valencia, Guimaras'}
          </Text>

          {/* Verified badge */}
          {user && (
            <View style={s.verifiedBadge}>
              <IcShield/>
              <Text style={s.verifiedTxt}>Verified Resident</Text>
            </View>
          )}

         
        </View>

        {/*  GUEST BANNER */}
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

        {/*  ACCOUNT SECTION  */}
        <Text style={s.secLabel}>ACCOUNT</Text>
        <View style={s.menuCard}>
          <MenuItem
            icon={<IcBell/>}
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
            icon={<IcInfo/>}
            iconBg={C.skyBg}
            label="About NVGo"
            onPress={() => console.log('About')}
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
    </View>
  );
}

 
const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  scroll:       { flex: 1 },
  scrollContent:{ paddingBottom: 50 },

  /* Hero */
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

  /* Avatar */
  avatarWrap:   { position: 'relative', marginBottom: 14 },
  avatar:       { width: 92, height: 92, borderRadius: 28, borderWidth: 3, borderColor: C.yellow },
  cameraBtn:    { position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: 9, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.greenDk },

  /* Hero text */
  heroName:     { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  heroSub:      { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 12 },

  /* Verified */
  verifiedBadge:{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 18 },
  verifiedTxt:  { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '700' },

  /* Stats */
  statsRow:     { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', width: '100%' },
  statItem:     { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statBorder:   { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.12)' },
  statVal:      { color: '#fff', fontSize: 14, fontWeight: '800' },
  statLabel:    { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '600', marginTop: 2, letterSpacing: 0.3 },

  /* Guest banner */
  guestBanner:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.yellowBg, marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.yellowDk + '30', borderLeftWidth: 3.5, borderLeftColor: C.yellowDk },
  guestTitle:   { fontSize: 13, fontWeight: '700', color: C.text },
  guestSub:     { fontSize: 11, color: C.muted, marginTop: 2 },
  loginNowBtn:  { backgroundColor: C.green, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  loginNowTxt:  { color: '#fff', fontSize: 12, fontWeight: '800' },

  /* Section label */
  secLabel:     { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.2, marginTop: 20, marginBottom: 8, marginLeft: 18 },

  /* Menu card */
  menuCard:     { backgroundColor: C.card, marginHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  menuItem:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  menuIconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuLabel:    { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },
  menuDivider:  { height: 1, backgroundColor: C.border, marginLeft: 66 },


  version:      { textAlign: 'center', fontSize: 10, color: C.muted, marginTop: 24, marginBottom: 4 },
});