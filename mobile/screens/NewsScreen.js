import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image
} from 'react-native';

export default function NewsScreen({ navigation }) {
  const [news, setNews] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'traffic', 'weather', 'crime', 'announcement'];

  const fetchNews = async (category = 'all') => {
    try {
      let url = 'http://192.168.254.152:5000/api/news';

      if (category !== 'all') {
        url = `http://192.168.254.152:5000/api/news/category/${category}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setNews(data);

    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchNews(selectedCategory);
  }, [selectedCategory]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>News</Text>

      {/*  CATEGORY FILTER */}
      <View style={styles.categoryContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryButton,
              selectedCategory === cat && styles.activeCategory
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={styles.categoryText}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 📰 NEWS LIST */}
      <FlatList
        data={news}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('NewsDetail', { news: item })}
          >
            <View style={styles.card}>
              
              {/* CATEGORY */}
              <Text style={styles.category}>{item.category}</Text>

              {/* TITLE */}
              <Text style={styles.newsTitle}>{item.title}</Text>

              {/* DATE */}
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>

              {/* IMAGE */}
              {item.image && (
                <Image
                  source={{
                    uri: `http://192.168.254.152:5000/uploads/${item.image}`
                  }}
                  style={styles.image}
                />
              )}

              {/* CONTENT (preview) */}
              <Text numberOfLines={2}>{item.content}</Text>

            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10
  },

  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10
  },

  categoryButton: {
    backgroundColor: '#ddd',
    padding: 8,
    marginRight: 5,
    marginBottom: 5,
    borderRadius: 5
  },

  activeCategory: {
    backgroundColor: '#0275d8'
  },

  categoryText: {
    color: '#000'
  },

  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8
  },

  newsTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5
  },

  category: {
    color: '#0275d8',
    fontSize: 12,
    marginBottom: 5
  },

  date: {
    fontSize: 12,
    color: 'gray',
    marginBottom: 8
  },

  image: {
    width: '100%',
    height: 200,
    marginVertical: 10,
    borderRadius: 8
  }
});