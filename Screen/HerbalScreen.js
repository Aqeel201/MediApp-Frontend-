// HerbalScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, TextInput } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './ThemeContext';

const HerbalScreen = () => {
  const navigation = useNavigation();
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { isDarkMode } = useTheme();

  useEffect(() => {
    axios.get('http://192.168.137.1:3000/medicines?category=Herbal')
      .then(response => {
        setMedicines(response.data); // Assuming the API returns an array of medicines
      })
      .catch(error => console.error('Failed to fetch medicines', error));
  }, []);

  const handlePress = (item) => {
    navigation.navigate('MedicineDetails', { medicine: item });
  };

  const styles = getStyles(isDarkMode);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <TextInput
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20 }}
        placeholder="Search for medicines"
        value={searchQuery}
        onChangeText={text => setSearchQuery(text)}
      />
      <FlatList
        data={medicines.filter(medicine => medicine.name.toLowerCase().includes(searchQuery.toLowerCase()))}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handlePress(item)}>
            <View style={{ flexDirection: 'row', padding: 10, backgroundColor: '#fff', marginBottom: 10 }}>
              <Image source={{ uri: item.image || 'https://via.placeholder.com/150' }} style={{ width: 50, height: 50, marginRight: 10 }} />
              <View>
                <Text>{item.name}</Text>
                <Text>{item.price}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
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
  searchBar: {
    backgroundColor: isDarkMode ? '#333' : '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    color: isDarkMode ? '#fff' : '#000',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#333',
  },
  medicinePrice: {
    fontSize: 16,
    color: isDarkMode ? '#ddd' : '#666',
  },
});

export default HerbalScreen;