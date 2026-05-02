import { ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  Image,
  TouchableOpacity
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ReportScreen() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [locationNote, setLocationNote] = useState('');
  const [image, setImage] = useState(null);
  

  // 📍 Get Location
  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location is required');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getLocation();
    loadUserData();
  }, []);


//auto put nanme and contact number
  const loadUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem('user');

    if (userData) {
      const user = JSON.parse(userData);

      setName(user.name || '');
      setContact(user.contact || '');
    }
  } catch (err) {
    console.log(err);
  }
};

  // 📸 Pick Image
  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission required', 'Allow access to photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (err) {
      console.log(err);
    }
  };

  //  Submit Report
  const submitReport = async () => {
    try {
      if (!location) {
        Alert.alert('Error', 'Location not ready');
        return;
      }

      const formData = new FormData();

      formData.append('name', name);
      formData.append('contact', contact);
      formData.append('description', description);
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);
      formData.append('location_note', locationNote);

      if (image) {
        formData.append('image', {
          uri: image,
          name: 'report.jpg',
          type: 'image/jpeg'
        });
      }

      const response = await fetch('http://192.168.254.152:5000/api/reports', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      Alert.alert('Success', 'Report submitted!');
      console.log(data);

      // Reset fields
      setName('');
      setContact('');
      setDescription('');
      setImage(null);

    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to submit report');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Submit Report</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Contact Number"
        value={contact}
        onChangeText={setContact}
      />

      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Button title="Get Location" onPress={getLocation} />

      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={location} title="You are here" />
        </MapView>
      )}
      <TextInput
  style={styles.input}
  placeholder="Location description (e.g. near barangay hall)"
  value={locationNote}
  onChangeText={setLocationNote}
/> 

      {/*  Image Picker */}
      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        <Text style={styles.imageButtonText}>Select Image</Text>
      </TouchableOpacity>

      {/*  Preview */}
      {image && (
        <Image source={{ uri: image }} style={styles.preview} />
      )}

      <Button title="Submit Report" onPress={submitReport} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
  flexGrow: 1,
  padding: 20
},
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold'
  },
  input: {
    borderWidth: 1,
    marginBottom: 15,
    padding: 10,
    borderRadius: 5
  },
  map: {
    width: '100%',
    height: 200,
    marginBottom: 15
  },
  imageButton: {
    backgroundColor: '#0275d8',
    padding: 12,
    borderRadius: 5,
    marginBottom: 10
  },
  imageButtonText: {
    color: '#fff',
    textAlign: 'center'
  },
  preview: {
    width: '100%',
    height: 200,
    marginBottom: 15
  }
});