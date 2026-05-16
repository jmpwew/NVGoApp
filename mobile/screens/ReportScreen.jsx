import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Image, Alert, StyleSheet,
  StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Svg, Path, Rect, Circle, G } from 'react-native-svg';

import {C} from '../constants/colors';
import api_url from '../utils/api';

  
const IcUser = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Circle cx="9" cy="7" r="3.2" stroke={C.green} strokeWidth="1.4"/>
    <Path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={C.green} strokeWidth="1.4" strokeLinecap="round"/>
  </Svg>
);
const IcPhone = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M4 2.5h-.4A2 2 0 001.5 4.5v.4c0 5.8 4.7 10.5 10.5 10.5h.4a2 2 0 002-2v-.4a.8.8 0 00-.5-.74l-2.8-1.2a.8.8 0 00-.9.16l-1.04 1.04A7.3 7.3 0 015.7 8.8L6.74 7.76a.8.8 0 00.16-.9L5.7 4.06A.8.8 0 004.96 3.6L4 3.6" stroke={C.green} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcDesc = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Rect x="2.5" y="2.5" width="13" height="13" rx="2.5" stroke={C.green} strokeWidth="1.4"/>
    <Path d="M5.5 6.5h7M5.5 9h7M5.5 11.5h4.5" stroke={C.green} strokeWidth="1.3" strokeLinecap="round"/>
  </Svg>
);
const IcPin = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M9 1.5A5 5 0 004 6.5c0 3.5 5 10 5 10s5-6.5 5-10a5 5 0 00-5-5z" stroke={C.green} strokeWidth="1.4"/>
    <Circle cx="9" cy="6.5" r="1.8" stroke={C.green} strokeWidth="1.3"/>
  </Svg>
);
const IcNote = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Rect x="2.5" y="2.5" width="13" height="13" rx="2.5" stroke={C.green} strokeWidth="1.4"/>
    <Path d="M5.5 6.5h7M5.5 9h5" stroke={C.green} strokeWidth="1.3" strokeLinecap="round"/>
    <Path d="M11 13l2-2-1-1-2 2v1h1z" stroke={C.green} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcCamera = () => (
  <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
    <Path d="M3 8.5A2.5 2.5 0 015.5 6H7l1.5-2h5L15 6h1.5A2.5 2.5 0 0119 8.5v7a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 013 15.5v-7z" stroke={C.green} strokeWidth="1.4"/>
    <Circle cx="11" cy="12" r="2.8" stroke={C.green} strokeWidth="1.3"/>
  </Svg>
);
const IcGPS = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Circle cx="9" cy="9" r="6.5" stroke="#fff" strokeWidth="1.4"/>
    <Circle cx="9" cy="9" r="2" fill="#fff"/>
    <Path d="M9 1v2.5M9 14.5V17M1 9h2.5M14.5 9H17" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
  </Svg>
);
const IcTrash = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path d="M2 4h12M5 4V2.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V4M6 7v5M10 7v5" stroke={C.red} strokeWidth="1.3" strokeLinecap="round"/>
    <Path d="M3 4l.8 9.5a.5.5 0 00.5.5h7.4a.5.5 0 00.5-.5L13 4" stroke={C.red} strokeWidth="1.3" strokeLinecap="round"/>
  </Svg>
);
const IcSend = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Path d="M17 3L9 11M17 3l-5 14-3-6-6-3 14-5z" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);


export default function ReportScreen() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [locationNote, setLocationNote] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  useEffect(() => {
    getLocation();
    loadUserData();
  }, []);

  /* Auto-fill*/
  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);

        const fullName =
          user.firstname && user.lastname
            ? `${user.firstname} ${user.lastname}`
            : user.name || '';

            setName(fullName);

        
        setContact(user.contact || '');
      }
    } catch (err) { console.log(err); }
  };

  /* Get GPS  */
  const getLocation = async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location is required to submit a report.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    } catch (err) { console.log(err); }
    finally { setLocLoading(false); }
  };

  /* Pick images  */
  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Allow access to your photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
      });
      if (!result.canceled) {
        setImages(result.assets.map(a => a.uri));
      }
    } catch (err) { console.log(err); }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  /* Submit */
  const submitReport = async () => {
  if (!location) {
    Alert.alert('Error', 'Location not ready. Tap Get My Location first.');
    return;
  }

  if (!description.trim()) {
    Alert.alert('Error', 'Please add a description.');
    return;
  }

  try {
    setSubmitting(true);

    // GET LOGGED IN USER
    const userData = await AsyncStorage.getItem('user');
    const user = JSON.parse(userData);

    const formData = new FormData();

    formData.append('user_id', user.id);
    formData.append('name', name);
    formData.append('contact', contact);
    formData.append('description', description);
    formData.append('latitude', location.latitude);
    formData.append('longitude', location.longitude);
    formData.append('location_note', locationNote);

    images.forEach((img, i) => {
      formData.append('images', {
        uri: img,
        name: `report_${i}.jpg`,
        type: 'image/jpeg',
      });
    });

    const res = await fetch(`${api_url}/api/reports`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    Alert.alert('Success', 'Report submitted successfully');

    setDescription('');
    setLocationNote('');
    setImages([]);

  } catch (err) {
    console.log(err);
    Alert.alert('Error', 'Failed to submit report');
  } finally {
    setSubmitting(false);
  }
};

  /* RENDER */
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk}/>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerSup}>COMMUNITY</Text>
        <Text style={s.headerTitle}>Submit a Report</Text>
        <Text style={s.headerSub}>Report your concern</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Section Your Info*/}
        <Text style={s.secLabel}>YOUR INFORMATION</Text>
        <View style={s.card}>
          <Field
            icon={<IcUser/>}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
          />
          <View style={s.divider}/>
          <Field
            icon={<IcPhone/>}
            placeholder="Contact Number"
            value={contact}
            onChangeText={setContact}
            keyboardType="phone-pad"
          />
        </View>

        {/* Incident  */}
        <Text style={s.secLabel}>INCIDENT DETAILS</Text>
        <View style={s.card}>
          <Field
            icon={<IcDesc/>}
            placeholder="Describe what happened..."
            value={description}
            onChangeText={setDescription}
            multiline
            minHeight={90}
          />
        </View>

        {/*  Section: Location */}
        <Text style={s.secLabel}>LOCATION</Text>
        <View style={s.card}>

          {/* GPS button */}
          <TouchableOpacity
            style={[s.gpsBtn, location && s.gpsBtnActive]}
            onPress={getLocation}
            activeOpacity={0.85}
          >
            {locLoading ? (
              <ActivityIndicator size="small" color="#fff"/>
            ) : (
              <IcGPS/>
            )}
            <Text style={s.gpsBtnTxt}>
              {locLoading
                ? 'Getting location…'
                : location
                  ? ` ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                  : 'Get My Location'}
            </Text>
          </TouchableOpacity>

          {/* Map preview */}
          {location && (
            <MapView
              style={s.map}
              initialRegion={{
                latitude:      location.latitude,
                longitude:     location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta:0.01,
              }}
              scrollEnabled={false}
            >
              <Marker coordinate={location} title="Incident location"/>
            </MapView>
          )}

          <View style={s.divider}/>

          {/* Location note */}
          <Field
            icon={<IcNote/>}
            placeholder="Landmark or description (e.g. near barangay hall)"
            value={locationNote}
            onChangeText={setLocationNote}
          />
        </View>

        {/* Section: Photos  */}
        <Text style={s.secLabel}>PHOTOS (optional)</Text>
        <View style={s.card}>

          <TouchableOpacity style={s.photoBtn} onPress={pickImage} activeOpacity={0.8}>
            <View style={s.photoBtnIcon}>
              <IcCamera/>
            </View>
            <View>
              <Text style={s.photoBtnTitle}>Select Photos</Text>
              <Text style={s.photoBtnSub}>Up to 5 images</Text>
            </View>
          </TouchableOpacity>

          {images.length > 0 && (
            <View style={s.imgGrid}>
              {images.map((img, i) => (
                <View key={i} style={s.imgWrap}>
                  <Image source={{ uri: img }} style={s.imgThumb} resizeMode="cover"/>
                  <TouchableOpacity style={s.imgDel} onPress={() => removeImage(i)}>
                    <IcTrash/>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Submit button */}
        <TouchableOpacity
          style={[s.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={submitReport}
          disabled={submitting}
          activeOpacity={0.88}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small"/>
          ) : (
            <>
              
              <Text style={s.submitTxt}>Submit Report</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={s.disclaimer}>
          Your report will be reviewed by the municipal office.
          All information is kept confidential.
        </Text>

      </ScrollView>
    </View>
  );
}

/*Reusable field */
function Field({ icon, placeholder, value, onChangeText, multiline, keyboardType, minHeight }) {
  return (
    <View style={[fs.wrap, multiline && { alignItems: 'flex-start' }]}>
      <View style={[fs.icon, multiline && { marginTop: 3 }]}>{icon}</View>
      <TextInput
        style={[fs.input, multiline && { minHeight: minHeight ?? 80, textAlignVertical: 'top' }]}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}
const fs = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  icon:  { width: 24, alignItems: 'center' },
  input: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 10 },
});


const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },

  /* Header */
  header:       { backgroundColor: C.greenDk, paddingTop: Platform.OS === 'android' ? 16 : 52, paddingHorizontal: 20, paddingBottom: 20 },
  headerSup:    { color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 2 },
  headerTitle:  { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  headerSub:    { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 3 },

  /* Scroll */
  scroll:       { flex: 1 },
  scrollContent:{ padding: 16, paddingBottom: 48, gap: 8 },

  /* Section label */
  secLabel:     { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.2, marginTop: 10, marginBottom: 6, marginLeft: 2 },

  /* Card */
  card:         { backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  divider:      { height: 1, backgroundColor: C.border, marginLeft: 34 },

  /* GPS button */
  gpsBtn:       { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.muted, borderRadius: 12, padding: 13, marginVertical: 6 },
  gpsBtnActive: { backgroundColor: C.green },
  gpsBtnTxt:    { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },

  /* Map */
  map:          { width: '100%', height: 170, borderRadius: 12, marginVertical: 10, overflow: 'hidden' },

  /* Photo picker */
  photoBtn:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  photoBtnIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.greenLt, alignItems: 'center', justifyContent: 'center' },
  photoBtnTitle:{ fontSize: 13, fontWeight: '700', color: C.text },
  photoBtnSub:  { fontSize: 11, color: C.muted, marginTop: 1 },

  /* Image grid */
  imgGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 6 },
  imgWrap:      { position: 'relative' },
  imgThumb:     { width: 90, height: 90, borderRadius: 10 },
  imgDel:       { position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },

  /* Submit */
  submitBtn:    { backgroundColor: C.green, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14, shadowColor: C.green, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4 },
  submitTxt:    { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
  disclaimer:   { fontSize: 10.5, color: C.muted, textAlign: 'center', lineHeight: 15, marginTop: 10, paddingHorizontal: 20 },
});