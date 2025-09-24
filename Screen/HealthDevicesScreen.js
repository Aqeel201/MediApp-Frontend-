import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext'; // Import the useTheme hook

// Generate an array of health devices without images
const createHealthDevices = () => {
  const names = [
    'Blood Pressure Monitor',
    'Thermometer',
    'Pulse Oximeter',
    'Glucose Meter',
    'Fitness Tracker'
  ];
  const descriptions = [
    'Measures blood pressure',
    'Measures body temperature',
    'Measures blood oxygen levels',
    'Monitors blood glucose',
    'Tracks fitness activities'
  ];
  const prices = ['$30', '$15', '$20', '$25', '$50'];

  return Array.from({ length: 50 }, (_, index) => {
    return {
      id: (index + 1).toString(),
      name: names[index % names.length],
      description: descriptions[index % descriptions.length],
      price: prices[index % prices.length],
    };
  });
};

const healthDevices = createHealthDevices();

const HealthDevicesScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const { isDarkMode } = useTheme(); // Access global dark mode state

  const filteredDevices = healthDevices.filter(device =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDevicePress = (device) => {
    navigation.navigate('DeviceDetail', { device });
  };

  const styles = getStyles(isDarkMode); // Get styles based on dark mode

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={20} color={isDarkMode ? '#fff' : '#007bff'} />
      </TouchableOpacity>
      <Text style={styles.title}>Health Devices</Text>
      <TextInput
        style={styles.searchBar}
        placeholder="Search"
        placeholderTextColor={isDarkMode ? "#ccc" : "#333"}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredDevices}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleDevicePress(item)} style={styles.deviceItem}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{item.name}</Text>
              <Text style={styles.devicePrice}>{item.price}</Text>
              <Text style={styles.deviceDescription}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.deviceList}
      />
      <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.button}>
        <Text style={styles.buttonText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#1c1c1c' : '#f0f4ff',
    padding: 10,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 5,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: isDarkMode ? '#fff' : '#007bff',
  },
  searchBar: {
    backgroundColor: isDarkMode ? '#333' : '#fff',
    borderRadius: 20,
    paddingHorizontal: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    fontSize: 14,
    color: isDarkMode ? '#fff' : '#333',
  },
  deviceList: {
    paddingBottom: 20,
  },
  deviceItem: {
    backgroundColor: isDarkMode ? '#333' : '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  deviceInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#333',
  },
  devicePrice: {
    fontSize: 14,
    color: isDarkMode ? '#ccc' : '#666',
  },
  deviceDescription: {
    fontSize: 12,
    color: isDarkMode ? '#aaa' : '#999',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10, 
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default HealthDevicesScreen;
