import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image,
  StatusBar,  Platform, RefreshControl, ScrollView
} from 'react-native';
import { Svg, Path, Rect, Circle } from 'react-native-svg';
import api_url from '../utils/api';



/*  Colours */
import {C} from '../constants/colors';

/* Category config  */
const CATS = {
  all:          { label: 'All',          color: C.green,   bg: C.greenLt  },
  announcement: { label: 'Announcement', color: C.skyDk,   bg: C.skyBg    },
  traffic:      { label: 'Traffic',      color: C.yellowDk,bg: C.yellowBg },
  weather:      { label: 'Weather',      color: '#0277BD', bg: '#E3F2FD'  },
  crime:        { label: 'Crime',        color: C.red,     bg: C.redBg    },
};

/* Utility SVG  */
const IcSearch = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Circle cx="7" cy="7" r="4.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.4"/>
    <Path d="M10.5 10.5l3 3" stroke="rgba(255,255,255,0.8)" strokeWidth="1.4" strokeLinecap="round"/>
  </Svg>
);
const IcClock = ({ color = C.muted }) => (
  <Svg width={11} height={11} viewBox="0 0 12 12" fill="none">
    <Circle cx="6" cy="6" r="4.5" stroke={color} strokeWidth="1.2"/>
    <Path d="M6 3.5V6l2 1.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcEye = ({ color = C.muted }) => (
  <Svg width={11} height={11} viewBox="0 0 12 12" fill="none">
    <Path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z" stroke={color} strokeWidth="1.2"/>
    <Circle cx="6" cy="6" r="1.5" stroke={color} strokeWidth="1.2"/>
  </Svg>
);
const IcChevron = () => (
  <Svg width={6} height={10} viewBox="0 0 8 12" fill="none">
    <Path d="M1.5 1.5l5 5-5 5" stroke={C.border} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IcEmpty = () => (
  <Svg width={52} height={52} viewBox="0 0 52 52" fill="none">
    <Rect x="8" y="10" width="36" height="32" rx="5" stroke={C.border} strokeWidth="1.8"/>
    <Path d="M8 18h36" stroke={C.border} strokeWidth="1.6"/>
    <Path d="M16 26h20M16 31h14" stroke={C.border} strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="38" cy="38" r="8" fill={C.bg} stroke={C.border} strokeWidth="1.5"/>
    <Path d="M35 38h6M38 35v6" stroke={C.border} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

/* Format date */
const formatDate = (dateStr) => {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 60000);
  if (diff < 1)    return 'Just now';
  if (diff < 60)   return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/* Featured Card  */
const FeaturedCard = ({ item, onPress, catConfig }) => (
  <TouchableOpacity style={s.featCard} onPress={onPress} activeOpacity={0.9}>
    {item.image
      ? <Image source={{ uri: `${api_url}/uploads/${item.image}` }} style={s.featImg} resizeMode="cover"/>
      : <View style={[s.featImg, { backgroundColor: C.greenDk }]}/>
    }
    <View style={s.featOverlay}/>

    {/*  category  */}
    <View style={s.featTop}>
      <View style={[s.catBadge, { backgroundColor: catConfig.color }]}>
        <Text style={s.catBadgeTxt}>{catConfig.label.toUpperCase()}</Text>
      </View>
      <View style={s.featuredBadge}>
        <Svg width={9} height={9} viewBox="0 0 10 10" fill="none">
          <Path d="M5 1l1 2.1 2.3.3-1.7 1.6.4 2.3L5 6.2l-2 1.1.4-2.3L1.7 3.4 4 3.1 5 1z" fill={C.yellow}/>
        </Svg>
        <Text style={s.featuredBadgeTxt}>FEATURED</Text>
      </View>
    </View>

    {/* bottom */}
    <View style={s.featBottom}>
      <Text style={s.featTitle} numberOfLines={2}>{item.title}</Text>
      <View style={s.metaRow}>
        <IcClock color="rgba(255,255,255,0.5)"/>
        <Text style={s.featMetaTxt}>{formatDate(item.created_at)}</Text>
        {item.views != null && (
          <>
            <Text style={s.dot}>·</Text>
            <IcEye color="rgba(255,255,255,0.5)"/>
            <Text style={s.featMetaTxt}>{item.views} views</Text>
          </>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

/*  News Row Card*/
const NewsCard = ({ item, onPress, catConfig }) => (
  <TouchableOpacity style={s.newsCard} onPress={onPress} activeOpacity={0.82}>
    {/* left: text */}
    <View style={s.newsBody}>
      <View style={[s.catTag, { backgroundColor: catConfig.bg }]}>
        <View style={[s.catDot, { backgroundColor: catConfig.color }]}/>
        <Text style={[s.catTagTxt, { color: catConfig.color }]}>
          {catConfig.label.toUpperCase()}
        </Text>
      </View>
      <Text style={s.newsTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={s.newsExcerpt} numberOfLines={2}>{item.content}</Text>
      <View style={s.metaRow}>
        <IcClock/>
        <Text style={s.newsMetaTxt}>{formatDate(item.created_at)}</Text>
        {item.views != null && (
          <>
            <Text style={s.dot}>·</Text>
            <IcEye/>
            <Text style={s.newsMetaTxt}>{item.views}</Text>
          </>
        )}
      </View>
    </View>

    {/* right: thumb */}
    <View style={s.newsRight}>
      {item.image ? (
        <Image
          source={{ uri: `${api_url}/uploads/${item.image}` }}
          style={s.newsThumb}
          resizeMode="cover"
        />
      ) : (
        <View style={[s.newsThumb, s.newsThumbEmpty, { backgroundColor: catConfig.bg }]}>
          <Text style={[s.newsThumbLetter, { color: catConfig.color }]}>
            {catConfig.label[0]}
          </Text>
        </View>
      )}
      <IcChevron/>
    </View>
  </TouchableOpacity>
);

/*  Empty state*/
const EmptyState = ({ category }) => (
  <View style={s.empty}>
    <IcEmpty/>
    <Text style={s.emptyTitle}>No news yet</Text>
    <Text style={s.emptySub}>
      {category === 'all'
        ? 'Check back later for the latest updates.'
        : `No "${CATS[category]?.label ?? category}" articles found.`}
    </Text>
  </View>
);


export default function NewsScreen({ navigation }) {
  const [news,             setNews]             = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing,       setRefreshing]       = useState(false);
  const [loading,          setLoading]          = useState(true);

  const categories = Object.keys(CATS);

  const fetchNews = useCallback(async (category = 'all') => {
    try {
      const url = category === 'all'
        ? `${api_url}/api/news`
        : `${api_url}/api/news/category/${category}`;
      const res  = await fetch(url);
      const data = await res.json();
      setNews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('News fetch error:', err);
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchNews(selectedCategory);
  }, [selectedCategory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNews(selectedCategory);
    setRefreshing(false);
  }, [selectedCategory]);

  const getCatConfig = (cat) =>
    CATS[cat] ?? { label: cat, color: C.green, bg: C.greenLt };

  const renderItem = ({ item, index }) => {
    const catConfig = getCatConfig(item.category);
    if (index === 0) {
      return (
        <FeaturedCard
          item={item}
          catConfig={catConfig}
          onPress={() => navigation.navigate('NewsDetail', { news: item })}
        />
      );
    }
    return (
      <NewsCard
        item={item}
        catConfig={catConfig}
        onPress={() => navigation.navigate('NewsDetail', { news: item })}
      />
    );
  };

  /* render*/
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk}/>

      {/*  Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerSup}>NUEVA VALENCIA</Text>
            <Text style={s.headerTitle}>News &amp; Updates</Text>
          </View>
          <TouchableOpacity style={s.searchBtn}>
            <IcSearch/>
          </TouchableOpacity>
        </View>

        {/* Text-only category pills */}
        <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={s.catsWrap}
>
  {categories.map((cat) => {
    const active = selectedCategory === cat;

    return (
      <TouchableOpacity
        key={cat}
        style={[
          s.catPill,
          active
            ? {
                backgroundColor: C.yellow,
                borderColor: C.yellow,
              }
            : {
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderColor: 'rgba(255,255,255,0.2)',
              },
        ]}
        onPress={() => setSelectedCategory(cat)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            s.catPillTxt,
            {
              color: active
                ? C.greenDk
                : 'rgba(255,255,255,0.85)',
            },
          ]}
        >
          {CATS[cat].label}
        </Text>
      </TouchableOpacity>
    );
  })}
</ScrollView>
</View>
      {/*  List  */}
      {loading ? (
        <View style={s.loadingWrap}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={i === 0 ? s.skelFeat : s.skelRow}>
              <View style={[s.skelBlock, { opacity: 1 - i * 0.15 }]}/>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={news}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            news.length > 0
              ? () => (
                <Text style={s.resultCount}>
                  {news.length} {news.length === 1 ? 'article' : 'articles'}
                  {selectedCategory !== 'all'
                    ? ` in ${CATS[selectedCategory]?.label ?? selectedCategory}`
                    : ''}
                </Text>
              )
              : null
          }
          ListEmptyComponent={<EmptyState category={selectedCategory}/>}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.green}
              colors={[C.green]}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }}/>}
        />
      )}
    </View>
  );
}

/* Styles */
const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },

  /* Header */
  header:      { backgroundColor: C.greenDk, paddingTop: Platform.OS === 'android' ? 14 : 50, paddingBottom: 14 },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 14 },
  headerSup:   { color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginTop: 1 },
  searchBtn:   { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },

  /* Category pills */
  catsWrap: {
  paddingHorizontal: 16,
  gap: 7,
},
  catPill:     { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1 },
  catPillTxt:  { fontSize: 12, fontWeight: '700' },

  /* List */
  listContent: { padding: 14, paddingBottom: 40 },
  resultCount: { fontSize: 11, color: C.muted, fontWeight: '600', marginBottom: 12, marginTop: 2 },

  /* Featured */
  featCard:        { borderRadius: 18, overflow: 'hidden', height: 220, backgroundColor: C.greenDk },
  featImg:         { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  featOverlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,30,16,0.62)' },
  featTop:         { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featBottom:      { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  featTitle:       { color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 22, marginBottom: 8, letterSpacing: -0.3 },
  featMetaTxt:     { color: 'rgba(255,255,255,0.55)', fontSize: 10 },

  /* Category badge on featured */
  catBadge:        { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  catBadgeTxt:     { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },

  /* Featured star badge */
  featuredBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,196,0,0.2)', borderRadius: 7, paddingVertical: 4, paddingHorizontal: 8, borderWidth: 1, borderColor: 'rgba(245,196,0,0.4)' },
  featuredBadgeTxt:{ color: C.yellow, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  /* News row card */
  newsCard:    { backgroundColor: C.card, borderRadius: 16, padding: 13, flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e5ede9', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  newsBody:    { flex: 1, gap: 5 },
  newsTitle:   { fontSize: 13, fontWeight: '700', color: C.text, lineHeight: 18, letterSpacing: -0.2 },
  newsExcerpt: { fontSize: 11, color: C.muted, lineHeight: 16 },
  newsRight:   { alignItems: 'center', gap: 8, flexShrink: 0 },
  newsThumb:   { width: 76, height: 76, borderRadius: 12 },
  newsThumbEmpty:  { alignItems: 'center', justifyContent: 'center' },
  newsThumbLetter: { fontSize: 26, fontWeight: '800' },

  /* Category tag on row */
  catTag:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, alignSelf: 'flex-start' },
  catDot:    { width: 5, height: 5, borderRadius: 3 },
  catTagTxt: { fontSize: 8, fontWeight: '800', letterSpacing: 0.4 },

  /* Meta */
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot:         { color: C.muted, fontSize: 10 },
  newsMetaTxt: { fontSize: 10, color: C.muted, fontWeight: '500' },

  /* Empty */
  empty:      { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: C.sub },
  emptySub:   { fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 18, paddingHorizontal: 30 },

  /* Skeleton */
  loadingWrap: { padding: 14, gap: 10 },
  skelFeat:    { height: 220, borderRadius: 18, overflow: 'hidden' },
  skelRow:     { height: 100, borderRadius: 16, overflow: 'hidden' },
  skelBlock:   { flex: 1, backgroundColor: '#d8e8df', borderRadius: 16 },
});