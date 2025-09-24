import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from './ThemeContext'; // Import the useTheme hook

// Sample data for demonstration purposes
const sampleKit = {
  id: '1',
  name: 'Advanced Medical Kit',
  description: 'A comprehensive medical kit with advanced supplies for various emergencies. Includes bandages, antiseptics, medications, and more.',
  contents: [
    'First Aid Manual',
    'Antiseptic Wipes',
    'Adhesive Bandages',
    'Gauze Pads',
    'Medical Tape',
    'Scissors',
    'Tweezers',
    'Pain Relievers',
    'Thermometer',
  ],
};

const KitDetails = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { kitId } = route.params;
  const { isDarkMode } = useTheme(); // Access global dark mode state

  // Fetch the actual kit details based on kitId
  const kit = sampleKit; // Replace with actual data fetching logic

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.content, isDarkMode && styles.contentDark]}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>{kit.name}</Text>
        <Text style={[styles.description, isDarkMode && styles.descriptionDark]}>{kit.description}</Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>Contents:</Text>
        <View style={styles.contents}>
          {kit.contents.map((item, index) => (
            <Text key={index} style={[styles.contentItem, isDarkMode && styles.contentItemDark]}>{item}</Text>
          ))}
        </View>
        <TouchableOpacity 
          style={[styles.purchaseButton, isDarkMode && styles.purchaseButtonDark]} 
          onPress={() => navigation.navigate('OnlineMedicinePurchase', { kitId })}
        >
          <Text style={styles.purchaseButtonText}>Purchase Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  content: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  contentDark: {
    backgroundColor: '#1f1f1f',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00796b',
    marginBottom: 10,
  },
  titleDark: {
    color: '#bb86fc',
  },
  description: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  descriptionDark: {
    color: '#cccccc',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00796b',
    marginBottom: 10,
  },
  subtitleDark: {
    color: '#bb86fc',
  },
  contents: {
    marginBottom: 20,
  },
  contentItem: {
    fontSize: 14,
    color: '#333',
    paddingVertical: 5,
  },
  contentItemDark: {
    color: '#cccccc',
  },
  purchaseButton: {
    backgroundColor: '#00796b',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  purchaseButtonDark: {
    backgroundColor: '#bb86fc',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default KitDetails;
