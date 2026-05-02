import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ScrollView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function RegisterScreen({ navigation }) {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');

  //  Nueva Valencia Barangays
  const barangays = [
    'Poblacion',
    'Igang',
    'Lanipe',
    'Lucmayan',
    'Magamay',
    'Montpiller',
    'Oracon Sur',
    'Oracon Norte',
    'Panobolon',
    'Salvacion',
    'San Antonio',
    'San Roque',
    'Tando',
    'Zaragosa'
  ];

  const register = async () => {
  try {
    if (!firstname || !lastname || !email || !password || !contact || !address){
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const res = await fetch('http://192.168.254.152:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstname,
        lastname,
        email,
        password,
        contact,
        address
      })
    });

    const text = await res.text();
  

    const data = JSON.parse(text);

    if (!res.ok) {
      Alert.alert('Error', data.message || 'Register failed');
      return;
    }

    Alert.alert('Success', 'Account created!');
    navigation.navigate('Login');

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    Alert.alert('Error', 'Registration failed');
  }
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register</Text>

      {/*  NAME */}
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

      {/* EMAIL */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      {/*  PASSWORD */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/*  CONTACT */}
      <TextInput
        style={styles.input}
        placeholder="Contact Number"
        value={contact}
        onChangeText={setContact}
        keyboardType="phone-pad"
      />

      {/* BARANGAY SELECT */}
      <Text style={styles.label}>Select Barangay</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={address}
          onValueChange={(itemValue) => setAddress(itemValue)}
        >
          <Picker.Item label="-- Select Barangay --" value="" />
          {barangays.map((brgy) => (
            <Picker.Item key={brgy} label={brgy} value={brgy} />
          ))}
        </Picker>
      </View>

      {/*  REGISTER BUTTON */}
      <Button title="Register" onPress={register} />

      {/*  GO TO LOGIN */}
      <Text
        style={styles.link}
        onPress={() => navigation.navigate('Login')}
      >
        Already have an account? Login
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center'
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },

  input: {
    borderWidth: 1,
    marginBottom: 15,
    padding: 10,
    borderRadius: 5
  },

  label: {
    marginBottom: 5,
    fontWeight: 'bold'
  },

  pickerContainer: {
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15
  },

  link: {
    marginTop: 15,
    color: 'blue',
    textAlign: 'center'
  }
});