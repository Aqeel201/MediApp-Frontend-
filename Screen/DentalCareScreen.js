import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';

const createDentalCareProducts = () => {
  const names = ['Toothpaste', 'Toothbrush', 'Mouthwash', 'Dental Floss', 'Teeth Whitening Kit'];
  const descriptions = ['Whitening', 'Soft bristle', 'Anti-cavity', 'Fresh breath', 'Brighten your smile'];
  const prices = ['$3', '$5', '$7', '$4', '$20'];

  return Array.from({ length: 20 }, (_, index) => {
    return {
      id: (index + 1).toString(),
      name: names[index % names.length],
      price: prices[index % prices.length],
      description: descriptions[index % descriptions.length],
    };
  });
};

const dentalCareProducts = createDentalCareProducts();

const DentalCareScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const { isDarkMode } = useTheme();

  const filteredProducts = dentalCareProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={20} color={isDarkMode ? '#fff' : '#007bff'} />
      </TouchableOpacity>
      <Text style={styles.title}>Dental Care</Text>
      <TextInput
        style={styles.searchBar}
        placeholder="Search"
        placeholderTextColor={isDarkMode ? "#ccc" : "#333"}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.productItem}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>{item.price}</Text>
            <Text style={styles.productDescription}>{item.description}</Text>
          </View>
        )}
        contentContainerStyle={styles.productList}
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
    fontSize: 14,
    color: isDarkMode ? '#fff' : '#333',
  },
  productList: {
    paddingBottom: 20,
  },
  productItem: {
    backgroundColor: isDarkMode ? '#333' : '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 5,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#333',
  },
  productPrice: {
    fontSize: 14,
    color: isDarkMode ? '#ccc' : '#666',
  },
  productDescription: {
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

export default DentalCareScreen;