import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import api_url from '../utils/api';

export default function MyReportsScreen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const user = JSON.parse(userData);

      const res = await fetch(
        `${api_url}/api/reports/user/${user.id}`
      );

      const data = await res.json();

      setReports(data);

    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0B7A75" />
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
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.empty}>No reports yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
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
                    source={{
                      uri: `${api_url}/uploads/${img}`,
                    }}
                    style={styles.image}
                  />
                )}
              />
            )}
          </View>
        )}
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
});