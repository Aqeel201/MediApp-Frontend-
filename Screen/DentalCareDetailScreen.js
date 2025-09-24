import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext'; // Import the useTheme hook

const DentalCareDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { product } = route.params;
  const { isDarkMode } = useTheme(); // Access global dark mode state

  const styles = getStyles(isDarkMode); // Get styles based on dark mode

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#007bff'} />
      </TouchableOpacity>
      <Text style={styles.title}>{product.name}</Text>
      <Image source={product.image} style={styles.productImage} />
      <Text style={styles.productPrice}>{product.price}</Text>
      <Text style={styles.productDescription}>{product.description}</Text>
      <TouchableOpacity style={styles.buyButton} onPress={() => navigation.navigate('OnlineMedicinePurchase')}>
        <Text style={styles.buyButtonText}>Buy Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#1c1c1c' : '#f0f4ff',
    padding: 20,
    alignItems: 'center',
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
    marginVertical: 20,
    textAlign: 'center',
    color: isDarkMode ? '#fff' : '#007bff',
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
  },
  productPrice: {
    fontSize: 20,
    color: isDarkMode ? '#ccc' : '#333',
    marginBottom: 10,
  },
  productDescription: {
    fontSize: 16,
    color: isDarkMode ? '#aaa' : '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  buyButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default DentalCareDetailScreen;
