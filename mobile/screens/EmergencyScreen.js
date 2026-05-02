import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';

export default function EmergencyScreen() {

  const callNumber = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Hotline</Text>

      <TouchableOpacity style={styles.button} onPress={() => callNumber('911')}>
        <Text style={styles.buttonText}>Call 911</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => callNumber('09000000000')}>
        <Text style={styles.buttonText}>Barangay Hotline</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => callNumber('09123456789')}>
        <Text style={styles.buttonText}>Police Station</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  button: {
    backgroundColor: '#d9534f',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold'
  }
});