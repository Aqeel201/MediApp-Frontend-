import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, TextInput } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './ThemeContext'; // Assuming this is your context for theme management

const HomeopathyScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    axios.get('http://192.168.18.224:3000/medicines?category=Homeopathy')
      .then(response => {
        setMedicines(response.data); 
      })
      .catch(error => {
        console.error('Failed to fetch medicines', error);
      });
  }, []);

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Homeopathic Medicines</Text>
      <TextInput
        style={styles.searchBar}
        placeholder="Search"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredMedicines}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('MedicineDetails', { medicine: item })}
            style={styles.medicineItem}
          >
            <Image source={{ uri: item.image || '../assets/fallback.png' }} style={styles.medicineImage} />
            <View style={styles.medicineInfo}>
              <Text style={styles.medicineName}>{item.name}</Text>
              <Text style={styles.medicinePrice}>{item.price}</Text>
              <Text style={styles.medicineDescription}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.medicineList}
      />
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
  backButtonText: {
    fontSize: 20,
    color: isDarkMode ? '#fff' : '#007bff',
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
    color: isDarkMode ? '#fff' : '#000',
  },
  medicineList: {
    paddingBottom: 20,
  },
  medicineItem: {
    flexDirection: 'row',
    backgroundColor: isDarkMode ? '#2c2c2c' : '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    alignItems: 'center',
  },
  medicineImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  medicineInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  medicineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#333',
  },
  medicinePrice: {
    fontSize: 14,
    color: isDarkMode ? '#ddd' : '#666',
  },
  medicineDescription: {
    fontSize: 12,
    color: isDarkMode ? '#bbb' : '#999',
  },
});

export default HomeopathyScreen;