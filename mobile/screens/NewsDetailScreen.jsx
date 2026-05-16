import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import api_url from '../utils/api';

export default function NewsDetailScreen({ route }) {
  const { news } = route.params;

  return (
    <ScrollView style={styles.container}>
      
      <Text style={styles.title}>{news.title}</Text>

      <Text style={styles.category}>{news.category}</Text>

      
      <Text style={styles.date}>
        {new Date(news.created_at).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </Text>

      {news.image && (
        <Image
          source={{
            uri: `${api_url}/uploads/${news.image}`
          }}
          style={styles.image}
        />
      )}

      <Text style={styles.content}>{news.content}</Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10
  },

  category: {
    color: '#0275d8',
    marginBottom: 5
  },

  date: {
    fontSize: 12,
    color: 'gray',
    marginBottom: 15
  },

  image: {
    width: '100%',
    height: 250,
    marginBottom: 15,
    borderRadius: 8
  },

  content: {
    fontSize: 16
  }
});