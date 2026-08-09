import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../constants/colors';
import api_url from '../utils/api';
import { getImageUrl } from '../utils/getImageUrl';
import { IcVideo, IcPlay } from '../constants/icons';

const STATUS_STYLE = {
  pending: { bg: '#FFF3CD', text: '#856404', label: 'Pending' },
  resolved: { bg: '#D1E7DD', text: '#0A3622', label: 'Resolved' },
};

const TABS = ['All', 'Pending', 'Resolved'];

export default function MyReportsScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    try {
      setError(null);
      const userData = await AsyncStorage.getItem('user');
      if (!userData) { setIsGuest(true); return; }
      const user  = JSON.parse(userData);
      const token = await AsyncStorage.getItem('token');
      if (!token)   { setIsGuest(true); return; }

      const res = await fetch(`${api_url}/api/reports/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setError(`Server error: ${res.status}`); return; }
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err);
      setError('Could not load reports. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadReports(); }, []);

  const filteredReports = reports.filter((r) => {
    if (activeTab === 'All') return true;
    return r.status?.toLowerCase() === activeTab.toLowerCase();
  });

  /* ── Loading ── */
  if (loading) {
    return (
      <View style={styles.fullCenter}>
        <ActivityIndicator size="large" color={C.green} />
      </View>
    );
  }

  /* ── Guest ── */
  if (isGuest) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.green} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Reports</Text>
          <Text style={styles.headerSub}>Track all your submitted reports</Text>
        </View>
        <View style={styles.guestBox}>
          <Text style={styles.guestIcon}>📋</Text>
          <Text style={styles.guestTitle}>Login to view your reports</Text>
          <Text style={styles.guestSub}>
            Guest reports are anonymous and cannot be tracked.{'\n'}
            Create an account to see all your submitted reports here.
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>Login / Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={C.green} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Reports</Text>
          <Text style={styles.headerSub}>Track all your submitted reports</Text>
        </View>
        <View style={styles.fullCenter}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadReports}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ── Main ── */
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.green} />

      {/* Green Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>My Reports</Text>
          {reports.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{reports.length} submitted</Text>
            </View>
          )}
        </View>
        <Text style={styles.headerSub}>Track all your submitted reports</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.green]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              {activeTab === 'All' ? 'No reports yet' : `No ${activeTab.toLowerCase()} reports`}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const s = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;
          return (
            <View style={styles.card}>

              {/* Card header — ID + badge */}
              <View style={styles.cardHeader}>
                
                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
                </View>
              </View>

              {/* Description */}
              <Text style={styles.desc}>{item.description}</Text>

              {/* Date */}
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleString()}
              </Text>

              {/* Images */}
              {item.images && item.images.length > 0 && (
                <FlatList
                  horizontal
                  data={item.images}
                  keyExtractor={(img, index) => index.toString()}
                  showsHorizontalScrollIndicator={false}
                  style={styles.imageList}
                  renderItem={({ item: img }) => (
                    <Image
                      source={{ uri: getImageUrl(img) }}
                      style={styles.image}
                    />
                  )}
                />
              )}

              {/* Videos */}
              {item.videos && item.videos.length > 0 && (
                <FlatList
                  horizontal
                  data={item.videos}
                  keyExtractor={(vid, index) => index.toString()}
                  showsHorizontalScrollIndicator={false}
                  style={styles.imageList}
                  renderItem={({ item: vid, index }) => (
                    <TouchableOpacity
                      style={styles.videoChip}
                      activeOpacity={0.85}
                      onPress={() => Linking.openURL(getImageUrl(vid))}
                    >
                      <IcVideo s={16} c="#fff" />
                      <Text style={styles.videoChipText}>Video {index + 1}</Text>
                      <IcPlay s={16} />
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  /* Header */
  header: {
    backgroundColor: C.green,
    paddingTop: Platform.OS === 'android' ? 16 : 54,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  countText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Tabs */
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: C.green,
    borderColor: C.green,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.muted,
  },
  tabTextActive: {
    color: '#fff',
  },

  /* List */
  listContent: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },

  /* Card */
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportId: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 0.4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  desc: {
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  date: {
    fontSize: 11,
    color: C.muted,
    marginBottom: 10,
  },
  imageList: {
    marginTop: 4,
  },
  image: {
    width: 100,
    height: 90,
    borderRadius: 10,
    marginRight: 8,
  },
  videoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1b1b1b',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  videoChipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  /* States */
  fullCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: C.muted,
  },
  errorText: {
    fontSize: 14,
    color: '#cc0000',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  retryBtn: {
    backgroundColor: C.green,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },

  /* Guest */
  guestBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  guestIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  guestSub: {
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loginBtn: {
    backgroundColor: C.green,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});