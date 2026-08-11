import {
  View, Text, Image, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, Platform,
} from 'react-native';
import { C } from '../constants/colors';
import { IcBack, IcAlert, IcCheck, IcInfo, IcBell, IcClock } from '../constants/icons';
import { getImageUrl } from '../utils/getImageUrl';

const TYPE = {
  alert: { icon: <IcAlert s={22} />, bg: '#FFFBE6', border: C.yellowDk, label: 'Alert' },
  update: { icon: <IcCheck s={22} />, bg: C.greenLt, border: C.green, label: 'Update' },
  info: { icon: <IcInfo s={22} />, bg: C.skyBg, border: C.skyDk, label: 'Info' },
  report: { icon: <IcBell c={C.skyDk} s={22} />, bg: C.skyBg, border: C.skyDk, label: 'Report' },
};

function formatFullDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function NotificationDetailScreen({ route, navigation }) {
  const { notification } = route.params;
  const cfg = TYPE[notification.type] ?? TYPE.info;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <IcBack />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>Notification</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notification.image ? (
          <Image
            source={{ uri: getImageUrl(notification.image) }}
            style={s.image}
            resizeMode="cover"
          />
        ) : null}

        <View style={s.card}>
          {/* Type + icon */}
          <View style={s.topRow}>
            <View style={[s.iconWrap, { backgroundColor: cfg.bg, borderColor: cfg.border + '40' }]}>
              {cfg.icon}
            </View>
            <View style={[s.typeBadge, { backgroundColor: cfg.bg, borderColor: cfg.border + '30' }]}>
              <Text style={[s.typeTxt, { color: cfg.border }]}>{cfg.label.toUpperCase()}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={s.divider} />

          {/* Title */}
          <Text style={s.title}>{notification.title}</Text>

          {/* Timestamp */}
          <View style={s.timeRow}>
            <IcClock />
            <Text style={s.timeTxt}>{formatFullDate(notification.created_at)}</Text>
          </View>

          {/* Divider */}
          <View style={s.divider} />

          {/* Body */}
          <Text style={s.body}>{notification.body}</Text>
        </View>

        {/* Footer */}
        <Text style={s.footer}>Municipality of Nueva Valencia, Guimaras</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 48 },

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
  backBtn: {
    width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },

  image: {
    width: '100%', height: 220, marginTop: 16, borderRadius: 16,
    alignSelf: 'center', maxWidth: '92%',
  },

  /* Card */
  card: {
    margin: 16, backgroundColor: C.card, borderRadius: 20,
    padding: 20, borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconWrap: { width: 46, height: 46, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  typeBadge: { borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10, borderWidth: 1 },
  typeTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  divider: { height: 1, backgroundColor: C.border, marginVertical: 14 },

  title: { fontSize: 20, fontWeight: '800', color: C.text, lineHeight: 28, letterSpacing: -0.3 },

  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  timeTxt: { fontSize: 12, color: C.muted, fontWeight: '600' },

  body: { fontSize: 14, color: C.sub, lineHeight: 24 },

  footer: { textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 8, marginBottom: 16 },
});