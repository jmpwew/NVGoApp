import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, StatusBar, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api_url from '../utils/api';
import { getImageUrl } from '../utils/getImageUrl';
import { IcEdit, IcBack} from '../constants/icons';


import {C} from '../constants/colors';




const InfoRow = ({ label, value }) => (
  <View style={s.row}>
    <Text style={s.rowLabel}>{label}</Text>
    <Text style={s.rowValue}>{value || '—'}</Text>
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
    if (stored) setUser(JSON.parse(stored));
  };

  const imageUrl = getImageUrl(user?.image);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk}/>

      {/*Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <IcBack/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Profile</Text>
        <View style={{ width: 34 }}/>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {user ? (
          <>
            {/* Avatar  */}
            <View style={s.avatarSection}>
              <Image
                source={
                  imageUrl
                    ? { uri: imageUrl }
                    : require('../assets/default-avatar.png')
                }
                style={s.avatar}
              />
              <Text style={s.name}>{user.firstname} {user.lastname}</Text>
              <View style={s.roleBadge}>
                <Text style={s.roleText}>{user.role ?? 'Resident'}</Text>
              </View>
            </View>

            {/* Info card  */}
            <View style={s.card}>
              <InfoRow label="Email"    value={user.email}   />
              <View style={s.divider}/>
              <InfoRow label="Contact"  value={user.contact} />
              <View style={s.divider}/>
              <InfoRow label="Address"  value={`${user.address}, Nueva Valencia, Guimaras`} />
            </View>

            {/*Edit button */}
            <TouchableOpacity
              style={s.editBtn}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.85}
            >
              <IcEdit/>
              <Text style={s.editBtnTxt}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={s.empty}>
            <Text style={s.emptyTxt}>No user data found.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}


const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  scroll:       { flex: 1 },
  scrollContent:{ padding: 20, paddingBottom: 48 },

  /* Header */
  header:       {
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

  /* Avatar section */
  avatarSection:{ alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  avatar:       { width: 90, height: 90, borderRadius: 26, borderWidth: 3, borderColor: C.yellow, marginBottom: 12 },
  name:         { fontSize: 19, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  roleBadge:    { marginTop: 6, backgroundColor: C.greenLt, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 12, borderWidth: 1, borderColor: C.border },
  roleText:     { fontSize: 11, fontWeight: '700', color: C.green, textTransform: 'capitalize' },

  /* Info card */
  card:         { backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  row:          { paddingVertical: 14 },
  rowLabel:     { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 0.4, marginBottom: 3 },
  rowValue:     { fontSize: 14, fontWeight: '600', color: C.text },
  divider:      { height: 1, backgroundColor: C.border },

  /* Edit button */
  editBtn:      { backgroundColor: C.green, borderRadius: 13, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  editBtnTxt:   { color: '#fff', fontSize: 14, fontWeight: '800' },

  /* Empty */
  empty:        { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyTxt:     { fontSize: 14, color: C.muted },
});