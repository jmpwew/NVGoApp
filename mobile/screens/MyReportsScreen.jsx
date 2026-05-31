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
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import api_url from '../utils/api';

const STATUS_STYLE = {
  pending:  { bg: '#FFF3CD', text: '#856404', label: 'Pending' },
  resolved: { bg: '#D1E7DD', text: '#0A3622', label: 'Resolved' },
};

export default function MyReportsScreen({ navigation }) {
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGuest, setIsGuest]   = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    try {
      setError(null);
      const userData = await AsyncStorage.getItem('user');

      if (!userData) {
        setIsGuest(true);
        return;
      }

      const user  = JSON.parse(userData);
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        setIsGuest(true);
        return;
      }

      const res = await fetch(`${api_url}/api/reports/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setError(`Server error: ${res.status}`);
        return;
      }

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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReports();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0B7A75" />
      </View>
    );
  }

  if (isGuest) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>My Reports</Text>
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

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>My Reports</Text>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadReports}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Reports</Text>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0B7A75']} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.empty}>No reports yet</Text>
          </View>
        }
        renderItem={({ item }) => {
          const s = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;
          return (
            <View style={styles.card}>

              {/* Status badge */}
              <View style={styles.cardHeader}>
              
                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
                </View>
              </View>

              <Text style={styles.desc}>{item.description}</Text>

              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleString()}
              </Text>

              {item.images && item.images.length > 0 && (
                <FlatList
                  horizontal
                  data={item.images}
                  keyExtractor={(img, index) => index.toString()}
                  renderItem={({ item: img }) => (
                    <Image
                      source={{ uri: `${api_url}/uploads/${img}` }}
                      style={styles.image}
                    />
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
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportId: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  desc: {
    fontSize: 15,
    color: '#222',
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#777',
    marginBottom: 10,
  },
  image: {
    width: 110,
    height: 110,
    borderRadius: 10,
    marginRight: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    fontSize: 16,
    color: '#888',
  },
  errorText: {
    fontSize: 14,
    color: '#cc0000',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#0B7A75',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
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
    color: '#222',
    textAlign: 'center',
    marginBottom: 10,
  },
  guestSub: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loginBtn: {
    backgroundColor: '#0B7A75',
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