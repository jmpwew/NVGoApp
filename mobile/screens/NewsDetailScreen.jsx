import {
  View, Text, Image, StyleSheet, ScrollView,
  StatusBar, TouchableOpacity, Platform,
} from 'react-native';
import { C } from '../constants/colors';
import api_url from '../utils/api';
import { IcBack, IcClock, IcTag} from '../constants/icons';


export default function NewsDetailScreen({ route, navigation }) {
  const { news } = route.params;

  const formattedDate = new Date(news.created_at).toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk}/>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <IcBack/>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>News</Text>
        <View style={{ width: 36 }}/>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        {news.image ? (
          <Image
            source={{ uri: `${api_url}/uploads/${news.image}` }}
            style={s.image}
            resizeMode="cover"
          />
        ) : (
          <View style={s.imagePlaceholder}>
            <Text style={s.imagePlaceholderTxt}>📰</Text>
          </View>
        )}

        {/* Content card */}
        <View style={s.card}>
          {/* Category + Date row */}
          <View style={s.metaRow}>
            {news.category && (
              <View style={s.categoryBadge}>
                <Text style={s.categoryTxt}>{news.category.toUpperCase()}</Text>
              </View>
            )}
            <View style={s.dateBadge}>
              <Text style={s.dateTxt}>{formattedDate}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={s.divider}/>

          {/* Title */}
          <Text style={s.title}>{news.title}</Text>

          {/* Divider */}
          <View style={s.divider}/>

          {/* Content */}
          <Text style={s.content}>{news.content}</Text>
        </View>

        {/* Footer */}
        <Text style={s.footer}>Municipality of Nueva Valencia, Guimaras</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  scroll:      { flex: 1 },
  scrollContent: { paddingBottom: 48 },

  /* Header */
  header:      { backgroundColor: C.greenDk, paddingTop: Platform.OS === 'android' ? 14 : 52,
                 paddingBottom: 14, paddingHorizontal: 16,
                 flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:     { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.15)',
                 alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },

  /* Image */
  image:       { width: '100%', height: 240 },
  imagePlaceholder: { width: '100%', height: 200, backgroundColor: C.greenLt,
                      alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderTxt: { fontSize: 48 },

  /* Card */
  card:        { margin: 16, backgroundColor: C.card, borderRadius: 20,
                 padding: 20, borderWidth: 1, borderColor: C.border,
                 shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },

  /* Meta */
  metaRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 5,
                   backgroundColor: C.skyBg, borderRadius: 8,
                   paddingVertical: 4, paddingHorizontal: 10,
                   borderWidth: 1, borderColor: C.skyDk + '30' },
  categoryTxt: { color: C.skyDk, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  dateBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5,
                 backgroundColor: C.greenLt, borderRadius: 8,
                 paddingVertical: 4, paddingHorizontal: 10,
                 borderWidth: 1, borderColor: C.border },
  dateTxt:     { color: C.muted, fontSize: 10, fontWeight: '600' },

  /* Divider */
  divider:     { height: 1, backgroundColor: C.border, marginVertical: 14 },

  /* Title */
  title:       { fontSize: 20, fontWeight: '800', color: C.text, lineHeight: 28, letterSpacing: -0.3 },

  /* Content */
  content:     { fontSize: 14, color: C.sub, lineHeight: 24 },

  /* Footer */
  footer:      { textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 8, marginBottom: 16 },
});