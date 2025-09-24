import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './ThemeContext'; // Import the useTheme hook

// Sample data for medical kits without images
const kitsData = [
  { id: '1', name: 'First Aid Kit', description: 'Basic first aid supplies for emergencies.' },
  { id: '2', name: 'Advanced Medical Kit', description: 'Comprehensive kit with advanced medical supplies.' },
  { id: '3', name: 'Home Care Kit', description: 'Essential items for home care and minor injuries.' },
  // Add more kits as needed
];

const KitsScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme(); // Access global dark mode state

  const renderItem = ({ item }) => (
    <View style={[styles.itemContainer, isDarkMode && styles.itemContainerDark]}>
      <View style={styles.itemDetails}>
        <Text style={[styles.itemName, isDarkMode && styles.itemNameDark]}>
          {item.name}
        </Text>
        <Text style={[styles.itemDescription, isDarkMode && styles.itemDescriptionDark]}>
          {item.description}
        </Text>
        <TouchableOpacity
          style={[styles.detailsButton, isDarkMode && styles.detailsButtonDark]}
          onPress={() => navigation.navigate('KitDetails', { kitId: item.id })}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Text style={[styles.title, isDarkMode && styles.titleDark]}>
        Available Medical Kits
      </Text>
      <FlatList
        data={kitsData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    padding: 20,
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00796b',
    marginBottom: 20,
    textAlign: 'center',
  },
  titleDark: {
    color: '#ffffff',
  },
  list: {
    flexGrow: 1,
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  itemContainerDark: {
    backgroundColor: '#1f1f1f',
    shadowColor: '#ffffff',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00796b',
    marginBottom: 5,
  },
  itemNameDark: {
    color: '#ffffff',
  },
  itemDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  itemDescriptionDark: {
    color: '#aaaaaa',
  },
  detailsButton: {
    backgroundColor: '#00796b',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  detailsButtonDark: {
    backgroundColor: '#bb86fc',
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default KitsScreen;
