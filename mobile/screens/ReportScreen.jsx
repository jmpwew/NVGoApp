import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Image, StyleSheet,
  StatusBar, Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {IcPhone, IcUser, IcDesc, IcNote, IcCamera, IcGPS, IcTrash, IcSend, IcEdit, IcVideo, IcPlay} from '../constants/icons';

import {C} from '../constants/colors';
import api_url from '../utils/api';
import ConfirmModal from '../utils/ConfirmModal';
import AlertModal from '../utils/AlertModal';

export default function ReportScreen() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [locationNote, setLocationNote] = useState('');
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null); // { title, message, tone, onOk } | null

  const notify = (title, message, tone = 'error', onOk) =>
    setAlertInfo({ title, message, tone, onOk });

  useEffect(() => {
    getLocation();
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.id);
        const fullName =
          user.firstname && user.lastname
            ? `${user.firstname} ${user.lastname}`
            : user.name || '';
        setName(fullName);
        setContact(user.contact || '');
      }
    } catch (err) { console.log(err); }
  };

  const getLocation = async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        notify('Permission denied', 'Location is required to submit a report.', 'error');
        return;
      }
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) setLocation(lastKnown.coords);
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(loc.coords);
    } catch (err) { console.log(err); }
    finally { setLocLoading(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([getLocation(), loadUserData()]);
    setRefreshing(false);
  };

  const pickMedia = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        notify('Permission required', 'Allow access to your photos and videos.', 'error');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        quality: 0.7,
        videoMaxDuration: 60,
      });
      if (!result.canceled) {
        const pickedImages = result.assets.filter(a => a.type !== 'video').map(a => a.uri);
        const pickedVideos = result.assets.filter(a => a.type === 'video').map(a => a.uri);

        if (pickedImages.length) {
          setImages(prev => [...prev, ...pickedImages].slice(0, 5));
        }
        if (pickedVideos.length) {
          setVideos(prev => [...prev, ...pickedVideos].slice(0, 2));
        }
      }
    } catch (err) { console.log(err); }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  const submitReport = () => {
    if (!location) {
      notify('Error', 'Location not ready. Tap Get My Location first.', 'error');
      return;
    }
    if (!name.trim()) {
      notify('Error', 'Please enter your full name.', 'error');
      return;
    }
    if (!contact.trim()) {
      notify('Error', 'Please enter your contact number.', 'error');
      return;
    }
    if (!description.trim()) {
      notify('Error', 'Please add a description.', 'error');
      return;
    }
    setConfirmSubmit(true);
  };

  const doSubmit = async () => {
    setConfirmSubmit(false);
    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      if (userId) formData.append('user_id', userId);
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
      videos.forEach((vid, i) => {
        const ext = vid.split('.').pop()?.split('?')[0] || 'mp4';
        formData.append('videos', {
          uri: vid,
          name: `report_video_${i}.${ext}`,
          type: `video/${ext === 'mov' ? 'quicktime' : ext}`,
        });
      });

      const res = await fetch(`${api_url}/api/reports`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      let data = null;
      try { data = await res.json(); } catch (e) { console.log(e); }

      if (!res.ok) {
        notify('Error', data?.message || 'Failed to submit report. Please try again.', 'error');
        return;
      }

      notify('Success', 'Report submitted successfully!', 'success');
      setDescription('');
      setLocationNote('');
      setImages([]);
      setVideos([]);
      setEditingName(false);
      setEditingContact(false);
      if (!userId) { setName(''); setContact(''); }

    } catch (err) {
      console.log(err);
      notify('Error', 'Failed to submit report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const mapHtml = location ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>html,body,#map{margin:0;padding:0;height:100%;width:100%;} .leaflet-control-attribution{pointer-events:none;}</style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false, dragging: false, scrollWheelZoom: false })
          .setView([${location.latitude}, ${location.longitude}], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.marker([${location.latitude}, ${location.longitude}]).addTo(map)
          .bindPopup('Incident location').openPopup();
      </script>
    </body>
    </html>
  ` : '';

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk}/>

      <View style={s.header}>
        <Text style={s.headerTitle}>Submit a Report</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.green}
            colors={[C.green]}
          />
        }
      >
        {!userId && (
          <View style={s.guestBanner}>
            <Text style={s.guestBannerText}>
              You're reporting as a guest. Please fill in your name and contact number below.
            </Text>
          </View>
        )}

        <Text style={s.secLabel}>YOUR INFORMATION</Text>
        <View style={s.card}>
          <Field
            icon={<IcUser/>}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            editable={!userId || editingName}
            rightAction={userId && (
              <TouchableOpacity
                style={s.fieldEditBtn}
                onPress={() => setEditingName(v => !v)}
                activeOpacity={0.8}
              >
                <IcEdit c={editingName ? C.green : C.muted}/>
              </TouchableOpacity>
            )}
          />
          <View style={s.divider}/>
          <Field
            icon={<IcPhone/>}
            placeholder="Contact Number"
            value={contact}
            onChangeText={setContact}
            keyboardType="phone-pad"
            editable={!userId || editingContact}
            rightAction={userId && (
              <TouchableOpacity
                style={s.fieldEditBtn}
                onPress={() => setEditingContact(v => !v)}
                activeOpacity={0.8}
              >
                <IcEdit c={editingContact ? C.green : C.muted}/>
              </TouchableOpacity>
            )}
          />
        </View>

        <Text style={s.secLabel}>INCIDENT DETAILS</Text>
        <View style={s.card}>
          <Field icon={<IcDesc/>} placeholder="Describe what happened..." value={description} onChangeText={setDescription} multiline minHeight={90}/>
        </View>

        <Text style={s.secLabel}>LOCATION</Text>
        <View style={s.card}>
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

          {location && (
            <WebView
              style={s.map}
              source={{ html: mapHtml }}
              scrollEnabled={false}
              javaScriptEnabled={true}
            />
          )}
        </View>

        <Text style={s.secLabel}>LANDMARK (optional)</Text>
        <View style={s.card}>
          <Field icon={<IcNote/>} placeholder="e.g. near barangay hall" value={locationNote} onChangeText={setLocationNote}/>
        </View>

        <Text style={s.secLabel}>PHOTOS & VIDEOS (optional)</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.photoBtn} onPress={pickMedia} activeOpacity={0.8}>
            <View style={s.photoBtnIcon}><IcCamera/></View>
            <View>
              <Text style={s.photoBtnTitle}>Select Photos or Videos</Text>
              <Text style={s.photoBtnSub}>Up to 5 images and 2 videos (max 60s each)</Text>
            </View>
          </TouchableOpacity>

          {(images.length > 0 || videos.length > 0) && (
            <View style={s.imgGrid}>
              {images.map((img, i) => (
                <View key={`img-${i}`} style={s.imgWrap}>
                  <Image source={{ uri: img }} style={s.imgThumb} resizeMode="cover"/>
                  <TouchableOpacity style={s.imgDel} onPress={() => removeImage(i)}>
                    <IcTrash/>
                  </TouchableOpacity>
                </View>
              ))}
              {videos.map((vid, i) => (
                <View key={`vid-${i}`} style={s.imgWrap}>
                  <View style={[s.imgThumb, s.videoThumb]}>
                    <IcVideo s={22} c="#fff"/>
                    <Text style={s.videoThumbLabel}>Video {i + 1}</Text>
                  </View>
                  <View style={s.videoBadge} pointerEvents="none">
                    <IcPlay s={20}/>
                  </View>
                  <TouchableOpacity style={s.imgDel} onPress={() => removeVideo(i)}>
                    <IcTrash/>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

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
              <IcSend/>
              <Text style={s.submitTxt}>Submit Report</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={s.disclaimer}>
          Your report will be reviewed by the municipal office.
          All information is kept confidential.
        </Text>
      </ScrollView>

      <ConfirmModal
        visible={confirmSubmit}
        title="Submit this report?"
        message="Please make sure the details and location are accurate before sending."
        confirmLabel="Submit"
        onConfirm={doSubmit}
        onCancel={() => setConfirmSubmit(false)}
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

function Field({ icon, placeholder, value, onChangeText, multiline, keyboardType, minHeight, editable = true, rightAction }) {
  return (
    <View style={[fs.wrap, multiline && { alignItems: 'flex-start' }]}>
      <View style={[fs.icon, multiline && { marginTop: 3 }]}>{icon}</View>
      <TextInput
        style={[
          fs.input,
          multiline && { minHeight: minHeight ?? 80, textAlignVertical: 'top' },
          !editable && { color: C.muted },
        ]}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        editable={editable}
      />
      {rightAction}
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
  header:       { backgroundColor: C.greenDk, paddingTop: Platform.OS === 'android' ? 16 : 52, paddingHorizontal: 20, paddingBottom: 20 },
  headerSup:    { color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 2 },
  headerTitle:  { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  headerSub:    { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 3 },
  scroll:       { flex: 1 },
  scrollContent:{ padding: 16, paddingBottom: 48, gap: 8 },
  guestBanner:  { backgroundColor: '#FFF8E1', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#F9A825', padding: 12, marginBottom: 4 },
  guestBannerText: { fontSize: 12, color: '#7B6000', lineHeight: 18 },
  secLabel:     { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.2, marginTop: 10, marginBottom: 6, marginLeft: 2 },
  fieldEditBtn: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: C.greenLt, flexShrink: 0 },
  card:         { backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  divider:      { height: 1, backgroundColor: C.border, marginLeft: 34 },
  gpsBtn:       { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.muted, borderRadius: 12, padding: 13, marginVertical: 6 },
  gpsBtnActive: { backgroundColor: C.green },
  gpsBtnTxt:    { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },
  map:          { width: '100%', height: 170, borderRadius: 12, marginVertical: 10, overflow: 'hidden' },
  photoBtn:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  photoBtnIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.greenLt, alignItems: 'center', justifyContent: 'center' },
  photoBtnTitle:{ fontSize: 13, fontWeight: '700', color: C.text },
  photoBtnSub:  { fontSize: 11, color: C.muted, marginTop: 1 },
  imgGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 6 },
  imgWrap:      { position: 'relative' },
  imgThumb:     { width: 90, height: 90, borderRadius: 10 },
  videoThumb:   { backgroundColor: '#1b1b1b', alignItems: 'center', justifyContent: 'center', gap: 4 },
  videoThumbLabel: { color: '#fff', fontSize: 9, fontWeight: '700' },
  videoBadge:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  imgDel:       { position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  submitBtn:    { backgroundColor: C.green, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14, shadowColor: C.green, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4 },
  submitTxt:    { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
  disclaimer:   { fontSize: 10.5, color: C.muted, textAlign: 'center', lineHeight: 15, marginTop: 10, paddingHorizontal: 20 },
});