import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, StatusBar, Platform,
} from 'react-native';
import { getImageUrl } from '../utils/getImageUrl';
import { C } from '../constants/colors';
import { IcBack, IcBuilding, IcCheck, IcNote } from '../constants/icons';

function formatCurrency(value) {
  const num = Number(value || 0);
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

const HEADER_TITLES = {
  infrastructure: 'Infrastructure Project',
  accomplishment: 'Accomplishment',
  section: 'More',
};

export default function TransparencyDetailScreen({ navigation, route }) {
  const { type, item } = route.params || {};

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk} />

      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <IcBack />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{HEADER_TITLES[type] || 'Details'}</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {item?.image ? (
          <Image source={{ uri: getImageUrl(item.image) }} style={s.img} resizeMode="cover" />
        ) : (
          <View style={[s.img, s.imgEmpty]}>
            {type === 'infrastructure' && <IcBuilding s={36} c={C.green} />}
            {type === 'accomplishment' && <IcCheck s={36} c={C.green} />}
            {type === 'section' && <IcNote c={C.green} />}
          </View>
        )}

        <View style={s.body}>
          {type === 'infrastructure' && item && (
            <>
              <View style={s.badgeRow}>
                <View style={[s.statusBadge, item.status === 'completed' ? s.statusDone : s.statusOngoing]}>
                  <Text style={[s.statusBadgeTxt, { color: item.status === 'completed' ? C.green : C.yellowDk }]}>
                    {item.status === 'completed' ? 'Completed' : 'Ongoing'}
                  </Text>
                </View>
                {!!item.category && (
                  <View style={s.categoryBadge}>
                    <Text style={s.categoryBadgeTxt}>{item.category}</Text>
                  </View>
                )}
              </View>

              <Text style={s.title}>{item.name}</Text>
              {!!item.barangay && <Text style={s.meta}>{item.barangay}</Text>}

              {item.progress_percent != null && (
                <View style={{ marginTop: 14 }}>
                  <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width: `${item.progress_percent}%` }]} />
                  </View>
                  <Text style={s.meta}>{item.progress_percent}% complete</Text>
                </View>
              )}
              {!!item.target_completion_date && (
                <Text style={s.meta}>Target completion: {formatDate(item.target_completion_date)}</Text>
              )}
              {item.cost != null && item.cost !== '' && (
                <Text style={s.cost}>{formatCurrency(item.cost)}</Text>
              )}
            </>
          )}

          {type === 'accomplishment' && item && (
            <>
              {!!item.category && (
                <View style={s.badgeRow}>
                  <View style={s.categoryBadge}>
                    <Text style={s.categoryBadgeTxt}>{item.category}</Text>
                  </View>
                </View>
              )}
              <Text style={s.title}>{item.title}</Text>
              {!!item.description && <Text style={s.text}>{item.description}</Text>}
            </>
          )}

          {type === 'section' && item && (
            <>
              <Text style={s.title}>{item.title}</Text>
              {!!item.content && <Text style={s.text}>{item.content}</Text>}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    backgroundColor: C.greenDk, paddingTop: Platform.OS === 'android' ? 16 : 54,
    paddingHorizontal: 18, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  img: { width: '100%', height: 220 },
  imgEmpty: { backgroundColor: C.greenLt, alignItems: 'center', justifyContent: 'center' },

  body: { padding: 20 },

  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6 },
  statusDone: { backgroundColor: C.greenLt },
  statusOngoing: { backgroundColor: C.yellowBg },
  statusBadgeTxt: { fontSize: 10.5, fontWeight: '800' },

  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6, backgroundColor: C.skyBg },
  categoryBadgeTxt: { fontSize: 10.5, fontWeight: '800', color: C.skyDk },

  title: { fontSize: 19, fontWeight: '800', color: C.text, marginTop: 2 },
  meta: { fontSize: 12.5, color: C.muted, marginTop: 6 },
  cost: { fontSize: 15, fontWeight: '800', color: C.green, marginTop: 12 },
  text: { fontSize: 13.5, color: C.sub, lineHeight: 21, marginTop: 10 },

  progressTrack: { height: 7, borderRadius: 4, backgroundColor: C.bg, overflow: 'hidden' },
  progressFill: { height: 7, borderRadius: 4, backgroundColor: C.green },
});
