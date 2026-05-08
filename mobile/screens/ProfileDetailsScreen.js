import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api_url from '../utils/api';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
    const unsubscribe = navigation.addListener('focus', loadUser);
    return unsubscribe;
  }, []);

  const loadUser = async () => {
    const storedUser = await AsyncStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  const imageUrl = user?.image
    ? `${api_url}/uploads/${user.image}`
    : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>

      {user ? (
        <>
          <Image
            source={
              imageUrl
                ? { uri: imageUrl }
                : require('../assets/default-avatar.png')
            }
            style={styles.avatar}
          />

          <Text>Name: {user.firstname} {user.lastname}</Text>
          <Text>Email: {user.email}</Text>
          <Text>Contact: {user.contact}</Text>
          <Text>Address: {user.address}</Text>

          <Button
            title="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
          />
        </>
      ) : (
        <Text>No user data</Text>
      )}

      <Button title="Back" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 15
  }
});