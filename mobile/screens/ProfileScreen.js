  import { useEffect, useState } from 'react';
  import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert
  } from 'react-native';
  import AsyncStorage from '@react-native-async-storage/async-storage';

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
      } else {
        setUser(null);
      }
    };

    const requireLogin = (callback) => {
      if (!user) {
        Alert.alert('Login Required', 'Please log in first');
        navigation.navigate('Login');
        return;
      }
      callback();
    };

    const handleLogout = async () => {
      await AsyncStorage.removeItem('user');
      setUser(null);
    };

    const imageUrl = user?.image
      ? `http://192.168.254.152:5000/uploads/${user.image}`
      : null;

    return (
      <View style={styles.container}>
        
        {/* 🔹 Header */}
        <View style={styles.header}>
          <Image
            source={
              imageUrl
                ? { uri: imageUrl }
                : require('../assets/default-avatar.png')
            }
            style={styles.avatar}
          />

          <Text style={styles.name}>
             {user ? `${user.firstname} ${user.lastname}` : 'Guest User'}
          </Text>

          <Text style={styles.info}>
            {user ? user.address : 'Please log in'}
          </Text>
        </View>

        {/* 🔹 Menu */}
        <View style={styles.menu}>
          
          <MenuItem title="Notifications" onPress={() =>
            requireLogin(() => console.log('Notifications'))
          } />

          <MenuItem title="Profile Details" onPress={() =>
            requireLogin(() => navigation.navigate('ProfileDetails'))
          } />

          <MenuItem title="Report List" onPress={() =>
            requireLogin(() => console.log('Reports'))
          } />

          <MenuItem title="Contact Support" onPress={() =>
            console.log('Support')
          } />

          <MenuItem title="About NVGo" onPress={() =>
            console.log('About')
          } />

          {/* 🔹 Login / Logout */}
          {user ? (
            <MenuItem title="Logout" onPress={handleLogout} danger />
          ) : (
            <MenuItem title="Login" onPress={() => navigation.navigate('Login')} />
          )}
        </View>
      </View>
    );
  }

  /* 🔹 Reusable Menu Button */
  const MenuItem = ({ title, onPress, danger }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Text style={[styles.itemText, danger && { color: 'red' }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  /* 🔹 Styles */
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5'
    },

    header: {
      alignItems: 'center',
      padding: 20,
      backgroundColor: '#0275d8'
    },

    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 10
    },

    name: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#fff'
    },

    info: {
      color: '#eee'
    },

    menu: {
      marginTop: 20
    },

    item: {
      backgroundColor: '#fff',
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#ddd'
    },

    itemText: {
      fontSize: 16
    }
  });