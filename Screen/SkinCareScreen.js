import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from './ThemeContext';

const SkincareScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();

  // Products without images
  const products = [
    { id: 1, name: 'Product 1', price: '$20', rating: 4.5 },
    { id: 2, name: 'Product 2', price: '$25', rating: 4.0 },
    // Add more products as needed
  ];

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon={faArrowLeft} size={24} color={isDarkMode ? 'white' : 'blue'} />
        </TouchableOpacity>
        <Text style={[styles.headerText, isDarkMode && styles.darkHeaderText]}>
          Skincare
        </Text>
      </View>
      
      {/* Removed hero image */}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>
          Featured Products
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {products.map(product => (
            <View key={product.id} style={styles.productCard}>
              <Text style={[styles.productName, isDarkMode && styles.darkProductName]}>
                {product.name}
              </Text>
              <Text style={[styles.productPrice, isDarkMode && styles.darkProductPrice]}>
                {product.price}
              </Text>
              <TouchableOpacity style={styles.buyButton}>
                <Text style={styles.buyButtonText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>
          Special Offers
        </Text>
        <View style={[styles.offerCard, isDarkMode && styles.darkOfferCard]}>
          {/* Removed offer image */}
          <Text style={[styles.offerTitle, isDarkMode && styles.darkOfferTitle]}>
            Limited Time Offer!
          </Text>
          <Text style={[styles.offerDescription, isDarkMode && styles.darkOfferDescription]}>
            Get 30% off on all skincare products. Shop now and save big!
          </Text>
          <TouchableOpacity style={styles.offerButton}>
            <Text style={styles.offerButtonText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  darkHeader: {
    backgroundColor: '#333',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    left: -100, // Adjusted for layout; you can change as needed
  },
  darkHeaderText: {
    color: '#fff',
  },
  section: {
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  darkSectionTitle: {
    color: '#fff',
  },
  productCard: {
    width: 150,
    marginRight: 20,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  productName: {
    marginVertical: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  darkProductName: {
    color: '#fff',
  },
  productPrice: {
    fontSize: 16,
    color: '#777',
  },
  darkProductPrice: {
    color: '#bbb',
  },
  buyButton: {
    marginTop: 10,
    backgroundColor: '#ff6347',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  offerCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  darkOfferCard: {
    backgroundColor: '#444',
    borderColor: '#666',
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  darkOfferTitle: {
    color: '#fff',
  },
  offerDescription: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  darkOfferDescription: {
    color: '#ccc',
  },
  offerButton: {
    marginTop: 10,
    backgroundColor: '#ff6347',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  offerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SkincareScreen;
