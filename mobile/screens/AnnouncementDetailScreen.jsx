import {
  View, Text, Image, StyleSheet, ScrollView,
  StatusBar, TouchableOpacity, Platform,
} from 'react-native';
import { C } from '../constants/colors';
import { getImageUrl } from '../utils/getImageUrl';
import { IcBack } from '../constants/icons';

const URGENCY_META = {
  info: { label: 'INFO',  color: C.skyDk, bg: C.skyBg },
  warning: { label: 'WARNING', color: '#935e00', bg: '#FFF6DC' },
  emergency: { label: 'EMERGENCY', color: '#fff', bg: C.red },
};

export default function AnnouncementDetailScreen({ route, navigation }) {
  const { announcement } = route.params;
  const um = URGENCY_META[announcement.urgency] || URGENCY_META.info;

  const formattedDate = new Date(announcement.created_at).toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk}/>

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <IcBack/>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>Announcement</Text>
        <View style={{ width: 36 }}/>
      </View>

      <ScrollView
        style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}
      >
        {announcement.image ? (
          <Image
            source={{ uri: getImageUrl(announcement.image) }}
            style={s.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[s.imagePlaceholder, { backgroundColor: um.bg }]}/>
        )}

        <View style={s.card}>
          <View style={s.metaRow}>
            <View style={[s.urgencyBadge, { backgroundColor: um.bg }]}>
              <Text style={[s.urgencyTxt, { color: um.color }]}>
                {um.label}
              </Text>
            </View>
            <View style={s.dateBadge}>
              <Text style={s.dateTxt}>{formattedDate}</Text>
            </View>
          </View>

          <View style={s.divider}/>

          <Text style={s.title}>{announcement.title}</Text>

          <View style={s.divider}/>

          <Text style={s.content}>{announcement.message}</Text>
        </View>

        <Text style={s.footer}>Municipality of Nueva Valencia, Guimaras</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  scroll:      { flex: 1 },
  scrollContent: { paddingBottom: 48 },

  header:      { backgroundColor: C.greenDk, paddingTop: Platform.OS === 'android' ? 14 : 52,
                 paddingBottom: 14, paddingHorizontal: 16,
                 flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:     { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.15)',
                 alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },

  image:       { width: '100%', height: 240 },
  imagePlaceholder: { width: '100%', height: 200, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderTxt: { fontSize: 48 },

  card:        { margin: 16, backgroundColor: C.card, borderRadius: 20,
                 padding: 20, borderWidth: 1, borderColor: C.border,
                 shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },

  metaRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  urgencyBadge: { flexDirection: 'row', alignItems: 'center', gap: 5,
                   borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  urgencyTxt:  { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  dateBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5,
                 backgroundColor: C.greenLt, borderRadius: 8,
                 paddingVertical: 4, paddingHorizontal: 10,
                 borderWidth: 1, borderColor: C.border },
  dateTxt:     { color: C.muted, fontSize: 10, fontWeight: '600' },

  divider:     { height: 1, backgroundColor: C.border, marginVertical: 14 },

  title:       { fontSize: 20, fontWeight: '800', color: C.text, lineHeight: 28, letterSpacing: -0.3 },

  content:     { fontSize: 14, color: C.sub, lineHeight: 24 },

  footer:      { textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 8, marginBottom: 16 },
});