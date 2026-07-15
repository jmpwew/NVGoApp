import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, StatusBar, Dimensions, Platform,
  Linking, Alert,  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { requestLocationPermission } from '../utils/locationPermission';
import { IcReport, IcNews, IcPhone, IcMore, IcBell, IcUser, IcChevron, IcWarn, IcSOS, IcLogout, IcProfile} from '../constants/icons';

  
const { width } = Dimensions.get('window');


import {C} from '../constants/colors';
import api_url from '../utils/api';

// Weather code 
import { weatherInfo} from '../utils/weather.js';


export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [weather, setWeather] = useState(null);
  const [latestNews, setLatestNews] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadUser(); fetchWeather(); fetchLatestNews();

  const unsubscribe = navigation.addListener('focus', loadUser); 
  return unsubscribe;                                            
}, []);

  const loadUser = async () => {
    const stored = await AsyncStorage.getItem('user');
    setUser(stored ? JSON.parse(stored) : null);  
    setUserLoaded(true);
  };
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);

      await Promise.all([
        fetchWeather(),
        fetchLatestNews(),
        loadUser(),
      ]);

    } catch (e) {
      console.log(e);
    } finally {
      setRefreshing(false);
    }
  }, []);
  const fetchWeather = async () => {
    try {
      const granted = await requestLocationPermission();
      if (!granted) return;
      const loc = await Location.getCurrentPositionAsync({});
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.coords.latitude}&longitude=${loc.coords.longitude}&current_weather=true`
      );
      const data = await res.json();
      setWeather(data.current_weather);
    } catch (e) { console.log(e); }
  };

  const fetchLatestNews = async () => {
    try {
      const res  = await fetch(`${api_url}/api/news`);
      const data = await res.json();
      setLatestNews(data.slice(0, 4));
    } catch (e) { console.log(e); }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    setUser(null);
    navigation.replace('Main');
  };

  const wInfo = weather ? weatherInfo(weather.weathercode) : null;
  
  const handleEmergencyCall = () => {
  Alert.alert(
    'Emergency Call',
    'You are about to call 911 emergency services.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Call 911',
        style: 'destructive',
        onPress: () => Linking.openURL('tel:911'),
      },
    ]
  );
};

  //render
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk}/>

      {/*header*/}
      <View style={s.header}>
        {/* Brand row */}
        <View style={s.headerRow}>
          <View style={s.brand}>
            <View>
              <Text style={s.brandName}>NV<Text style={s.brandNameGo}>Go</Text></Text>
              <Text style={s.brandSub}>NUEVA VALENCIA</Text>
            </View>
          </View>

          <View style={s.headerRight}>
            {user && (
              <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Notifications')}>
                <IcBell/>
                <View style={s.notifDot}/>
              </TouchableOpacity>
            )}
            {user ? (
              <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)} activeOpacity={0.85}>
                <Image
                  source={
                    user?.image
                      ? { uri: `${api_url}/uploads/${user.image}` }
                      : require('../assets/default-avatar.png')
                  }
                  style={s.avatar}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Login')}>
                <IcUser c="#fff"/>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Logged-in greeting  */}
        {userLoaded && (user ? (
          <View style={s.greetCard}>
            
            <View style={{ flex: 1 }}>
              <Text style={s.greetHello}>{getGreeting()}</Text>
              <Text style={s.greetName} numberOfLines={1}>
                {user.firstname
                  ? `${user.firstname} ${user.lastname ?? ''}`
                  : user.name ?? 'User'}
              </Text>
              {user.address
                ? <Text style={s.greetAddr} numberOfLines={1}> {user.address}, Nueva Valencia, Guimaras</Text>
                : null}
            </View>
            <View style={s.verifiedBadge}>
              <View style={s.verifiedDot}/>
              <Text style={s.verifiedTxt}>Resident</Text>
            </View>
          </View>
        ) : (
          /* Guest greeting*/
          <View style={s.guestCard}>
            <View style={s.guestTop}>
              <View>
                <Text style={s.guestSub}>Stay informed with NVGo</Text>
              </View>
            </View>
            <View style={s.guestBtns}>
              <TouchableOpacity style={s.createBtn} onPress={() => navigation.navigate('Register')} activeOpacity={0.85}>
                <Text style={s.createBtnTxt}>Create an Account</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.loginOutline} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
                <Text style={s.loginOutlineTxt}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* DROPDOWN  */}
      {menuVisible && (
        <View style={s.dropdown}>
          <TouchableOpacity style={s.dropItem}
            onPress={() => { setMenuVisible(false); navigation.navigate('Profile'); }}>
            <IcProfile/>
            <Text style={[s.dropTxt, { color: C.skyDk }]}>My Profile</Text>
          </TouchableOpacity>
          <View style={s.dropDivider}/>
          <TouchableOpacity style={s.dropItem}
            onPress={() => { setMenuVisible(false); logout(); }}>
            <IcLogout/>
            <Text style={[s.dropTxt, { color: C.red }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SCROLL BODY */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setMenuVisible(false)}
      
         refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      tintColor={C.green}
                      colors={[C.green]}
                    />
                  }
                  >
       

        {/* features  */}
        <Text style={s.secTitle}>Features</Text>
        <View style={s.qaGrid}>
          {[
            { label:'Report Issue',      icon:<IcReport/>,  bg:C.redBg,    bc:C.red+'20',    onPress:()=>navigation.navigate('Report') },
            { label:'View News',         icon:<IcNews/>,    bg:C.skyBg,    bc:C.skyDk+'20',  onPress:()=>navigation.navigate('News') },
            { label:'Emergency Hotline', icon:<IcPhone/>,   bg:C.greenLt,  bc:C.green+'20',  onPress:()=>navigation.navigate('Hotlines') },
            { label:'More',              icon:<IcMore/>,    bg:'#F3EEF9',  bc:'#7B5EA720',   onPress:()=>navigation.navigate('MoreFeatures') },
          ].map((q, i) => (
            <TouchableOpacity key={i} style={[s.qaCard, { borderColor: q.bc }]}
              onPress={q.onPress} activeOpacity={0.82}>
              <View style={[s.qaIcWrap, { backgroundColor: q.bg }]}>{q.icon}</View>
              <Text style={s.qaLbl}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/*  Weather  */}
        {weather && wInfo && (
          <View style={[s.weatherCard, { backgroundColor: wInfo.bg }]}>
            <View style={s.weatherOrb}/>
            <Text style={s.weatherEmoji}>{wInfo.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.weatherTemp}>{weather.temperature}°C</Text>
              <Text style={s.weatherLabel}>{wInfo.label}</Text>
            </View>
            <View style={s.weatherDivider}/>
            <View style={s.weatherMeta}>
              <Text style={s.weatherMetaLbl}>WIND</Text>
              <Text style={s.weatherMetaVal}>{weather.windspeed} km/h</Text>
            </View>
          </View>
        )}

        {/*  Latest news  */}
        {latestNews.length > 0 && (
          <View>
            <View style={s.secHeader}>
              <Text style={s.secTitle}>Latest News</Text>
              <TouchableOpacity onPress={() => navigation.navigate('News')}>
                <Text style={s.secLink}>See all</Text>
              </TouchableOpacity>
            </View>

            {/* Featured */}
            <TouchableOpacity style={s.featured} activeOpacity={0.9}
              onPress={() => navigation.navigate('NewsDetail', { news: latestNews[0] })}>
              {latestNews[0].image
                ? <Image source={{ uri:`${api_url}/uploads/${latestNews[0].image}` }} style={s.featuredImg}/>
                : <View style={[s.featuredImg, { backgroundColor: C.greenDk }]}/>}
              <View style={s.featuredOverlay}/>
              <View style={s.featuredContent}>
                <View style={s.featuredBadge}><Text style={s.featuredBadgeTxt}>FEATURED</Text></View>
                <Text style={s.featuredTitle} numberOfLines={2}>{latestNews[0].title}</Text>
                <Text style={s.featuredDate}>
                  {new Date(latestNews[0].created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}
                </Text>
              </View>
            </TouchableOpacity>

            {/* News rows */}
            {latestNews.slice(1).map(item => (
              <TouchableOpacity key={item.id} style={s.newsRow} activeOpacity={0.8}
                onPress={() => navigation.navigate('NewsDetail', { news: item })}>
                {item.image
                  ? <Image source={{ uri:`${api_url}/uploads/${item.image}` }} style={s.newsThumb}/>
                  : <View style={[s.newsThumb, s.newsThumbEmpty]}><IcNews s={20} c={C.skyDk}/></View>}
                <View style={s.newsBody}>
                  <View style={s.newsTagWrap}><Text style={s.newsTagTxt}>NEWS</Text></View>
                  <Text style={s.newsTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={s.newsDate}>
                    {new Date(item.created_at).toLocaleDateString('en-PH',{month:'short',day:'numeric'})}
                  </Text>
                </View>
                <IcChevron/>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/*  Emergency SOS  */}
        <TouchableOpacity
  style={s.sos}
  activeOpacity={0.9}
  delayLongPress={1200}
  onLongPress={handleEmergencyCall}
>
  <View style={s.sosOrb}/>

  <View style={s.sosIcWrap}>
    <IcSOS/>
  </View>

  <View style={{ flex: 1 }}>
    <Text style={s.sosTitle}>Emergency? Call 911</Text>
    <Text style={s.sosSub}>
      Press and hold for emergency call
    </Text>
  </View>

  <View style={s.sosBtn}>
    <Text style={s.sosBtnTxt}>HOLD</Text>
  </View>
</TouchableOpacity>
</ScrollView>
    </View>
  );
}


const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },

  /* Header */
  header:      { backgroundColor: C.greenDk, paddingTop: Platform.OS === 'android' ? 14 : 50, paddingHorizontal: 20, paddingBottom: 22 },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  brand:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandIc:      { width: 36, height: 36, borderRadius: 10, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center' },
  brandIcTxt:   { color: C.greenDk, fontSize: 12, fontWeight: '800', letterSpacing: -0.5 },
  brandName:    { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  brandNameGo:  { color: C.yellow },
  brandSub:    { color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn:     { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  notifDot:    { position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 4, backgroundColor: C.yellow, borderWidth: 1.5, borderColor: C.greenDk },
  avatar:      { width: 36, height: 36, borderRadius: 11, borderWidth: 2, borderColor: C.yellow },

  /* Logged-in greeting */
  greetCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.11)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  greetAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.yellow },
  greetHello:  { color: 'rgba(255,255,255,0.6)', fontSize: 11.5 },
  greetName:   { color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 1, letterSpacing: -0.3 },
  greetAddr:   { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 3 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(245,196,0,0.25)', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(245,196,0,0.4)' },
  verifiedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.yellow },
  verifiedTxt: { color: C.yellow, fontSize: 9, fontWeight: '700' },

  /* Guest greeting */
  guestCard:   { backgroundColor: 'rgba(255,255,255,0.11)', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', gap: 14 },
  guestTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  guestSub:    { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 3 },
  guestAvIc:   { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245,196,0,0.3)' },
  guestBtns:   { flexDirection: 'row', gap: 10 },
  createBtn:   { flex: 1, backgroundColor: C.yellow, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  createBtnTxt:{ color: C.greenDk, fontSize: 13, fontWeight: '800' },
  loginOutline:{ flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.1)' },
  loginOutlineTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Dropdown 
  dropdown:    { position: 'absolute', top: Platform.OS === 'android' ? 104 : 142, right: 16, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 6, minWidth: 160, zIndex: 999, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 10, borderWidth: 1, borderColor: C.border },
  dropItem:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  dropTxt:     { fontSize: 13, fontWeight: '700' },
  dropDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 12 },

  /* Scroll */
  scroll:      { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 36, gap: 16 },

  /* Alert */
  alert:       { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.yellowBg, borderRadius: 12, padding: 11, paddingHorizontal: 13, borderWidth: 1, borderColor: '#f0e088', borderLeftWidth: 3.5, borderLeftColor: C.yellow },
  alertTxt:    { flex: 1, fontSize: 11, color: '#5a4800', fontWeight: '600', lineHeight: 16 },

  /* Section */
  secHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secTitle:    { fontSize: 13.5, fontWeight: '800', color: C.text, letterSpacing: -0.2, marginBottom: 10 },
  secLink:     { fontSize: 11.5, fontWeight: '700', color: C.skyDk, marginBottom: 10 },

  /* features */
  qaGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  qaCard:      { width: (width - 42) / 2, backgroundColor: C.card, borderRadius: 16, padding: 14, gap: 10, borderWidth: 1.5, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  qaIcWrap:    { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  qaLbl:       { fontSize: 11.5, fontWeight: '800', color: C.text, lineHeight: 15 },

  /* Weather */
  weatherCard: { borderRadius: 18, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden', position: 'relative' },
  weatherOrb:  { position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.1)' },
  weatherEmoji:{ fontSize: 38 },
  weatherTemp: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -1, lineHeight: 32 },
  weatherLabel:{ color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
  weatherDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.25)' },
  weatherMeta: { alignItems: 'center', gap: 4 },
  weatherMetaLbl: { color: 'rgba(255,255,255,0.55)', fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  weatherMetaVal: { color: '#fff', fontSize: 13, fontWeight: '700' },

  /* Featured news */
  featured:    { borderRadius: 18, overflow: 'hidden', height: 185, marginBottom: 10, backgroundColor: C.greenDk },
  featuredImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  featuredOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,35,18,0.6)' },
  featuredContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  featuredBadge:   { backgroundColor: C.yellow, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'flex-start', marginBottom: 7 },
  featuredBadgeTxt:{ color: C.greenDk, fontSize: 8.5, fontWeight: '800', letterSpacing: 0.5 },
  featuredTitle:   { color: '#fff', fontSize: 15, fontWeight: '700', lineHeight: 21, marginBottom: 5 },
  featuredDate:    { color: 'rgba(255,255,255,0.5)', fontSize: 10 },

  /* News rows */
  newsRow:     { backgroundColor: C.card, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#e5ede9', marginBottom: 8 },
  newsThumb:   { width: 60, height: 60, borderRadius: 12, flexShrink: 0 },
  newsThumbEmpty: { backgroundColor: C.skyBg, alignItems: 'center', justifyContent: 'center' },
  newsBody:    { flex: 1 },
  newsTagWrap: { backgroundColor: C.skyBg, borderRadius: 5, paddingVertical: 2, paddingHorizontal: 7, alignSelf: 'flex-start', marginBottom: 5 },
  newsTagTxt:  { color: C.skyDk, fontSize: 8, fontWeight: '800', letterSpacing: 0.3 },
  newsTitle:   { fontSize: 12, fontWeight: '700', color: C.text, lineHeight: 17, marginBottom: 4 },
  newsDate:    { fontSize: 10, color: C.muted },

  /* SOS */
  sos:         { backgroundColor: C.red, borderRadius: 16, padding: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 13, overflow: 'hidden' },
  sosOrb:      { position: 'absolute', top: -20, right: 60, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.07)' },
  sosIcWrap:   { width: 46, height: 46, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  sosTitle:    { color: '#fff', fontSize: 14, fontWeight: '800' },
  sosSub:      { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 },
  sosBtn:      { backgroundColor: '#fff', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
  sosBtnTxt:   { color: C.red, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
});