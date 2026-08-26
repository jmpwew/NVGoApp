import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, StatusBar, Platform, RefreshControl, ActivityIndicator, Linking,
} from 'react-native';
import api_url from '../utils/api';
import { getImageUrl } from '../utils/getImageUrl';
import { C } from '../constants/colors';
import {
  IcBack, IcCoin, IcBuilding, IcCheck, IcEmpty, IcClock, IcNote, IcInfo,
} from '../constants/icons';

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

function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[chipS.chip, active ? chipS.chipActive : chipS.chipInactive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[chipS.chipTxt, active && chipS.chipTxtActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function TransparencyBoardScreen({ navigation }) {
  const [board, setBoard] = useState(null);
  const [funds, setFunds] = useState([]);
  const [infrastructure, setInfrastructure] = useState([]);
  const [accomplishments, setAccomplishments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notPublished, setNotPublished] = useState(false);
  const [error, setError] = useState(false);

  const [infraStatusFilter, setInfraStatusFilter] = useState('all');
  const [infraCategoryFilter, setInfraCategoryFilter] = useState('all');
  const [accompCategoryFilter, setAccompCategoryFilter] = useState('all');

  function openDetail(item, type) {
    navigation.navigate('TransparencyDetail', { item, type });
  }

  const fetchBoard = useCallback(async () => {
    try {
      const res = await fetch(`${api_url}/api/transparency`);
      if (res.status === 404) {
        setNotPublished(true);
        setBoard(null);
        return;
      }
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setBoard(data.board || null);
      setFunds(Array.isArray(data.funds) ? data.funds : []);
      setInfrastructure(Array.isArray(data.infrastructure) ? data.infrastructure : []);
      setAccomplishments(Array.isArray(data.accomplishments) ? data.accomplishments : []);
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
      setSections(Array.isArray(data.sections) ? data.sections : []);
      setNotPublished(false);
      setError(false);
    } catch (err) {
      console.log('Transparency board fetch error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchBoard();
  }, [fetchBoard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBoard();
    setRefreshing(false);
  }, [fetchBoard]);

  const fundTotals = funds.reduce((acc, f) => ({
    allocated: acc.allocated + Number(f.allocated || 0),
    spent: acc.spent + Number(f.spent || 0),
    remaining: acc.remaining + Number(f.remaining || 0),
  }), { allocated: 0, spent: 0, remaining: 0 });

  const infraCategories = [...new Set(infrastructure.map(i => i.category).filter(Boolean))];
  const accompCategories = [...new Set(accomplishments.map(a => a.category).filter(Boolean))];

  const filteredInfrastructure = infrastructure.filter(item => {
    if (infraStatusFilter !== 'all' && item.status !== infraStatusFilter) return false;
    if (infraCategoryFilter !== 'all' && item.category !== infraCategoryFilter) return false;
    return true;
  });

  const filteredAccomplishments = accomplishments.filter(item => {
    if (accompCategoryFilter !== 'all' && item.category !== accompCategoryFilter) return false;
    return true;
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.greenDk} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <IcBack />
        </TouchableOpacity>
        <View style={s.headerText}>
          <Text style={s.headerTitle}>Transparency Board</Text>
          <Text style={s.headerSub}>
            {board?.lgu_name || 'Open budget & accomplishments report'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.green]} />}
      >
        {loading ? (
          <View style={s.centerBox}>
            <ActivityIndicator color={C.green} size="large" />
          </View>
        ) : notPublished ? (
          <View style={s.comingSoonBox}>
            <IcClock />
            <Text style={s.comingSoonTitle}>Not available yet</Text>
            <Text style={s.comingSoonSub}>
              The transparency board hasn't been published by the LGU yet. Check back soon.
            </Text>
          </View>
        ) : error ? (
          <View style={s.comingSoonBox}>
            <IcEmpty />
            <Text style={s.comingSoonTitle}>Couldn't load the board</Text>
            <Text style={s.comingSoonSub}>Pull down to try again.</Text>
          </View>
        ) : (
          <>
            {/* Period + last updated */}
            <View style={s.metaRow}>
              {!!board?.reporting_period && (
                <View style={s.periodBadge}>
                  <Text style={s.periodBadgeTxt}>{board.reporting_period}</Text>
                </View>
              )}
              {!!board?.updated_at && (
                <Text style={s.updatedTxt}>Updated {formatDate(board.updated_at)}</Text>
              )}
            </View>

            {/* Accountable official + data source */}
            {(board?.official_name || board?.source_note || board?.data_as_of) && (
              <View style={s.officialCard}>
                <IcInfo s={16} c={C.skyDk} />
                <View style={{ flex: 1 }}>
                  {!!board?.official_name && (
                    <Text style={s.officialName}>
                      {board.official_name}{board.official_position ? ` · ${board.official_position}` : ''}
                    </Text>
                  )}
                  {!!board?.source_note && <Text style={s.officialNote}>{board.source_note}</Text>}
                  {!!board?.data_as_of && (
                    <Text style={s.officialNote}>Data as of {formatDate(board.data_as_of)}</Text>
                  )}
                </View>
              </View>
            )}

            {/* Fund breakdown */}
            {funds.length > 0 && (
              <View style={s.card}>
                <View style={s.cardHeadRow}>
                  <View style={[s.iconWrap, { backgroundColor: C.yellowBg }]}>
                    <IcCoin />
                  </View>
                  <Text style={s.cardTitle}>Budget by Fund</Text>
                </View>

                {funds.map(fund => {
                  const pct = Number(fund.allocated) > 0
                    ? Math.min(100, Math.round((Number(fund.spent) / Number(fund.allocated)) * 100))
                    : 0;
                  return (
                    <View key={fund.fund_type} style={s.fundRow}>
                      <View style={s.fundHeadRow}>
                        <Text style={s.fundLabel}>{fund.label}</Text>
                        <Text style={s.fundPct}>{pct}% used</Text>
                      </View>
                      <View style={s.progressTrack}>
                        <View style={[s.progressFill, { width: `${pct}%` }]} />
                      </View>
                      <View style={s.fundValuesRow}>
                        <Text style={s.fundValueTxt}>Allocated: {formatCurrency(fund.allocated)}</Text>
                        <Text style={s.fundValueTxt}>Spent: {formatCurrency(fund.spent)}</Text>
                      </View>
                    </View>
                  );
                })}

                <View style={s.fundTotalsRow}>
                  <View style={s.fundTotalItem}>
                    <Text style={s.fundTotalLabel}>Total Allocated</Text>
                    <Text style={s.fundTotalValue}>{formatCurrency(fundTotals.allocated)}</Text>
                  </View>
                  <View style={s.fundTotalItem}>
                    <Text style={s.fundTotalLabel}>Total Spent</Text>
                    <Text style={[s.fundTotalValue, { color: C.red }]}>{formatCurrency(fundTotals.spent)}</Text>
                  </View>
                  <View style={s.fundTotalItem}>
                    <Text style={s.fundTotalLabel}>Total Remaining</Text>
                    <Text style={[s.fundTotalValue, { color: C.green }]}>{formatCurrency(fundTotals.remaining)}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Documents */}
            {documents.length > 0 && (
              <>
                <Text style={s.sectionTitle}>Official Documents</Text>
                <View style={s.card}>
                  {documents.map((doc, idx) => (
                    <TouchableOpacity
                      key={doc.id}
                      style={[s.docRow, idx < documents.length - 1 && s.docRowBorder]}
                      onPress={() => Linking.openURL(getImageUrl(doc.file_url))}
                      activeOpacity={0.75}
                    >
                      <IcNote c={C.green} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.docTitle}>{doc.title}</Text>
                        <Text style={s.docMeta}>Tap to view · {formatDate(doc.uploaded_at)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Infrastructure */}
            <Text style={s.sectionTitle}>Infrastructure Projects</Text>
            {infrastructure.length > 0 && (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={chipS.row}>
                  <Chip label="All" active={infraStatusFilter === 'all'} onPress={() => setInfraStatusFilter('all')} />
                  <Chip label="Ongoing" active={infraStatusFilter === 'ongoing'} onPress={() => setInfraStatusFilter('ongoing')} />
                  <Chip label="Completed" active={infraStatusFilter === 'completed'} onPress={() => setInfraStatusFilter('completed')} />
                </ScrollView>
                {infraCategories.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={chipS.row}>
                    <Chip label="All Categories" active={infraCategoryFilter === 'all'} onPress={() => setInfraCategoryFilter('all')} />
                    {infraCategories.map(cat => (
                      <Chip key={cat} label={cat} active={infraCategoryFilter === cat} onPress={() => setInfraCategoryFilter(cat)} />
                    ))}
                  </ScrollView>
                )}
              </>
            )}
            {filteredInfrastructure.length === 0 ? (
              <View style={s.emptySection}>
                <Text style={s.emptySectionTxt}>No infrastructure projects match this filter.</Text>
              </View>
            ) : (
              filteredInfrastructure.map(item => {
                const metaBits = [item.barangay, item.progress_percent != null ? `${item.progress_percent}% complete` : null].filter(Boolean);
                return (
                  <TouchableOpacity
                    style={s.itemCard}
                    key={`infra-${item.id}`}
                    activeOpacity={0.8}
                    onPress={() => openDetail(item, 'infrastructure')}
                  >
                    {item.image ? (
                      <Image source={{ uri: getImageUrl(item.image) }} style={s.itemImg} resizeMode="cover" />
                    ) : (
                      <View style={[s.itemImg, s.itemImgEmpty]}>
                        <IcBuilding s={22} c={C.green} />
                      </View>
                    )}
                    <View style={s.itemBody}>
                      <View style={s.badgeRow}>
                        <View style={[
                          s.statusBadge,
                          item.status === 'completed' ? s.statusDone : s.statusOngoing,
                        ]}>
                          <Text style={[
                            s.statusBadgeTxt,
                            { color: item.status === 'completed' ? C.green : C.yellowDk },
                          ]}>
                            {item.status === 'completed' ? 'Completed' : 'Ongoing'}
                          </Text>
                        </View>
                        {!!item.category && (
                          <View style={s.categoryBadge}>
                            <Text style={s.categoryBadgeTxt}>{item.category}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.itemName} numberOfLines={2}>{item.name}</Text>
                      {metaBits.length > 0 && (
                        <Text style={s.itemSub} numberOfLines={1}>{metaBits.join(' · ')}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            {/* Accomplishments */}
            <Text style={s.sectionTitle}>Accomplishments</Text>
            {accompCategories.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={chipS.row}>
                <Chip label="All Categories" active={accompCategoryFilter === 'all'} onPress={() => setAccompCategoryFilter('all')} />
                {accompCategories.map(cat => (
                  <Chip key={cat} label={cat} active={accompCategoryFilter === cat} onPress={() => setAccompCategoryFilter(cat)} />
                ))}
              </ScrollView>
            )}
            {filteredAccomplishments.length === 0 ? (
              <View style={s.emptySection}>
                <Text style={s.emptySectionTxt}>No accomplishments match this filter.</Text>
              </View>
            ) : (
              filteredAccomplishments.map(item => (
                <TouchableOpacity
                  style={s.itemCard}
                  key={`accomp-${item.id}`}
                  activeOpacity={0.8}
                  onPress={() => openDetail(item, 'accomplishment')}
                >
                  {item.image ? (
                    <Image source={{ uri: getImageUrl(item.image) }} style={s.itemImg} resizeMode="cover" />
                  ) : (
                    <View style={[s.itemImg, s.itemImgEmpty]}>
                      <IcCheck s={22} c={C.green} />
                    </View>
                  )}
                  <View style={s.itemBody}>
                    <View style={s.badgeRow}>
                      {!!item.category && (
                        <View style={s.categoryBadge}>
                          <Text style={s.categoryBadgeTxt}>{item.category}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.itemName} numberOfLines={2}>{item.title}</Text>
                    {!!item.description && (
                      <Text style={s.itemSub} numberOfLines={1}>{item.description}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}

            {/* More (custom sections) */}
            {sections.length > 0 && (
              <>
                <Text style={s.sectionTitle}>More</Text>
                {sections.map(item => (
                  <TouchableOpacity
                    style={s.itemCard}
                    key={`section-${item.id}`}
                    activeOpacity={0.8}
                    onPress={() => openDetail(item, 'section')}
                  >
                    {item.image ? (
                      <Image source={{ uri: getImageUrl(item.image) }} style={s.itemImg} resizeMode="cover" />
                    ) : (
                      <View style={[s.itemImg, s.itemImgEmpty]}>
                        <IcNote c={C.green} />
                      </View>
                    )}
                    <View style={s.itemBody}>
                      <Text style={s.itemName} numberOfLines={2}>{item.title}</Text>
                      {!!item.content && (
                        <Text style={s.itemSub} numberOfLines={1}>{item.content}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Report an issue */}
            <TouchableOpacity
              style={s.reportRow}
              onPress={() => navigation.navigate('ContactSupport')}
              activeOpacity={0.8}
            >
              <Text style={s.reportTxt}>Notice something wrong with this data? Report an issue</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const chipS = StyleSheet.create({
  row: { gap: 8, paddingBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.3 },
  chipActive: { backgroundColor: C.green, borderColor: C.green },
  chipInactive: { backgroundColor: C.card, borderColor: C.border },
  chipTxt: { fontSize: 11.5, fontWeight: '700', color: C.sub },
  chipTxtActive: { color: '#fff' },
});

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
  headerText: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 10.5, marginTop: 2 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 14 },

  centerBox: { paddingTop: 60, alignItems: 'center' },

  comingSoonBox: {
    backgroundColor: C.card, borderRadius: 16, padding: 28, marginTop: 20,
    alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed',
  },
  comingSoonTitle: { fontSize: 14, fontWeight: '800', color: C.text, marginTop: 4 },
  comingSoonSub: { fontSize: 11.5, color: C.muted, textAlign: 'center', lineHeight: 18 },

  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  periodBadge: { backgroundColor: C.greenLt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  periodBadgeTxt: { fontSize: 11, fontWeight: '800', color: C.green },
  updatedTxt: { fontSize: 10.5, color: C.muted },

  officialCard: {
    flexDirection: 'row', gap: 10, backgroundColor: C.skyBg, borderRadius: 12, padding: 12,
    alignItems: 'flex-start',
  },
  officialName: { fontSize: 12, fontWeight: '800', color: C.text, marginBottom: 2 },
  officialNote: { fontSize: 10.5, color: C.sub, lineHeight: 15 },

  card: {
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: C.yellowDk + '25',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: C.text },

  fundRow: { marginBottom: 14 },
  fundHeadRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  fundLabel: { fontSize: 11.5, fontWeight: '700', color: C.text, flex: 1 },
  fundPct: { fontSize: 10.5, fontWeight: '700', color: C.muted },
  fundValuesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  fundValueTxt: { fontSize: 10, color: C.muted },

  progressTrack: { height: 6, borderRadius: 3, backgroundColor: C.bg, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: C.yellow },

  fundTotalsRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  fundTotalItem: { gap: 2 },
  fundTotalLabel: { fontSize: 9, fontWeight: '700', color: C.muted, textTransform: 'uppercase' },
  fundTotalValue: { fontSize: 12.5, fontWeight: '800', color: C.text },

  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  docRowBorder: { borderBottomWidth: 1, borderBottomColor: C.bg },
  docTitle: { fontSize: 12, fontWeight: '700', color: C.text },
  docMeta: { fontSize: 10, color: C.muted, marginTop: 1 },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: C.text, marginTop: 6, marginLeft: 2 },

  emptySection: {
    backgroundColor: C.card, borderRadius: 14, padding: 18,
    borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed', alignItems: 'center',
  },
  emptySectionTxt: { fontSize: 11.5, color: C.muted },

  itemCard: {
    backgroundColor: C.card, borderRadius: 14, flexDirection: 'row', overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  itemImg: { width: 84, height: '100%', minHeight: 84 },
  itemImgEmpty: { backgroundColor: C.greenLt, alignItems: 'center', justifyContent: 'center' },
  itemBody: { flex: 1, padding: 10, gap: 4, justifyContent: 'center' },
  itemName: { fontSize: 12.5, fontWeight: '800', color: C.text },
  itemSub: { fontSize: 10.5, color: C.muted },

  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 2, flexWrap: 'wrap', minHeight: 20 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusDone: { backgroundColor: C.greenLt },
  statusOngoing: { backgroundColor: C.yellowBg },
  statusBadgeTxt: { fontSize: 9.5, fontWeight: '800' },

  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: C.skyBg },
  categoryBadgeTxt: { fontSize: 9.5, fontWeight: '800', color: C.skyDk },

  reportRow: {
    marginTop: 6, paddingVertical: 14, alignItems: 'center', backgroundColor: C.card,
    borderRadius: 12, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed',
  },
  reportTxt: { fontSize: 11.5, color: C.skyDk, fontWeight: '700' },
});
