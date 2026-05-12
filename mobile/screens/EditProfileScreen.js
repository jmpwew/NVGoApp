import { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Image
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import api_url from '../utils/api';

export default function EditProfileScreen({ navigation }) {
  const [userId, setUserId] = useState(null);

  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [image, setImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);

  const barangays = [
    "Poblacion","Cabalagnan","Calaya","Canhawan","Concordia Sur","Dolores",
    "Guiwanon","Igang","Igdarapdap","La Paz","Lanipe","Lucmayan",
    "Magamay","Napandong","Oracon Sur","Pandaraonan","Panobolon",
    "Salvacion","San Antonio","San Roque","Santo Domingo","Tando"
  ];

  useEffect(() => {
    loadUser();
  }, []);

  // asyncc
  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) return;

      const parsed = JSON.parse(storedUser);

      setUserId(parsed.id);
      setFirstname(parsed.firstname || '');
      setLastname(parsed.lastname || '');
      setEmail(parsed.email || '');
      setContact(parsed.contact || '');
      setAddress(parsed.address || '');
      setCurrentImage(parsed.image || null);

    } catch (err) {
      console.log("LOAD USER ERROR:", err);
    }
  };

  //  Pick image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  //  Save profile
  const saveProfile = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID missing');
      return;
    }

    try {
      const formData = new FormData();

      formData.append('firstname', firstname);
      formData.append('lastname', lastname);
      formData.append('email', email);
      formData.append('contact', contact);
      formData.append('address', address);
      formData.append('user_id', userId);

      if (image) {
        formData.append('image', {
          uri: image.uri,
          name: `profile_${Date.now()}.jpg`, 
          type: 'image/jpeg',
        });
      }

      const res = await fetch(`${api_url}/api/profile`, {
        method: 'PUT',
        body: formData
      });

      const data = await res.json();

      

      if (!res.ok) {
        Alert.alert('Error', data.message || 'Update failed');
        return;
      }

      
      if (!data.user) {
        Alert.alert('Error', 'User data not returned from server');
        return;
      }

      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      Alert.alert('Success', 'Profile updated!');

      navigation.goBack();

    } catch (err) {
      console.log("UPDATE ERROR:", err);
      Alert.alert('Error', 'Update failed');
    }
  };

  return (
    <View style={styles.container}>

      {/*  Profile Image */}
      <Image
        source={
          image
            ? { uri: image.uri }
            : currentImage
            ? {
                uri: `${api_url}/uploads/${currentImage}?t=${Date.now()}`
              }
            : require('../assets/default-avatar.png')
        }
        style={styles.avatar}
      />

      <Button title="Change Picture" onPress={pickImage} />

      {/* Inputs */}
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstname}
        onChangeText={setFirstname}
      />

      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastname}
        onChangeText={setLastname}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Contact"
        value={contact}
        onChangeText={setContact}
      />

      {/*  Barangay */}
      <Picker selectedValue={address} onValueChange={setAddress}>
        {barangays.map((b, i) => (
          <Picker.Item key={i} label={b} value={b} />
        ))}
      </Picker>

      {/*  Buttons */}
      <Button title="Save" onPress={saveProfile} />
      <Button title="Cancel" onPress={() => navigation.goBack()} />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 10
  },

  input: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 10
  }
});