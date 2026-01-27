import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';
import { CartContext } from './CartContext';
import NetInfo from '@react-native-community/netinfo';

const MedicineDescription = ({ route, navigation }) => {
  const { medicine } = route.params;
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { addToCart, cartItems } = useContext(CartContext);
  const cartCount = cartItems ? cartItems.length : 0;

  const [description, setDescription] = useState('');
  const [loadingDescription, setLoadingDescription] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const imageUrl = medicine.image
    ? medicine.image.startsWith('http')
      ? medicine.image.startsWith('http') ? medicine.image : `https://dashboard-backend-xrss.vercel.app${medicine.image}`
      : `https://dashboard-backend-xrss.vercel.app${medicine.image}`
    : null;

  useEffect(() => {
    // Check network connectivity
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    // Initial check
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Simulate a 2-3 second loading delay for the entire page
    const timer = setTimeout(() => {
      setDescription(medicine.description || 'No description available for this medicine.');
      setLoadingDescription(false);
      setIsPageLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [medicine.description]);

  const handleAddToCart = () => {
    if (medicine.quantity === 0) {
      Alert.alert('Not Available', 'This product is currently not available.');
      return;
    }
    addToCart(medicine);
    Alert.alert('Success', 'Medicine added to cart');
  };

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  // Show loading spinner while the page is loading
  if (isPageLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={[styles.loadingText, { color: isDarkMode ? '#1c1c1c' : '#1c1c1c' }]}>
          Loading Medicine Details...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: isDarkMode ? '#f0f4ff' : '#f0f4ff' },
      ]}
    >
      <View style={[styles.headerContainer, { marginTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <MaterialIcons
            name="arrow-back"
            size={28}
            color={isDarkMode ? '#007bff' : '#007bff'}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.pageTitle,
            { color: isDarkMode ? '#007bff' : '#007bff' },
          ]}
        >
          Medicine Details
        </Text>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('OnlineMedicinePurchase')}
        >
          <Ionicons name="cart-outline" size={28} color={isDarkMode ? '#007bff' : '#007bff'} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View
          style={[
            styles.noImagePlaceholder,
            { backgroundColor: isDarkMode ? '#d0d8ff' : '#d0d8ff' },
          ]}
        >
          <FontAwesome5
            name="pills"
            size={100}
            color={isDarkMode ? '#007bff' : '#007bff'}
          />
        </View>
      )}

      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: isDarkMode ? '#1c1c1c' : '#1c1c1c' },
          ]}
        >
          {medicine.name}
        </Text>
        <Text
          style={[
            styles.price,
            { color: isDarkMode ? '#1c1c1c' : '#1c1c1c' },
          ]}
        >
          PKR {medicine.price}
        </Text>
      </View>

      <View
        style={[
          styles.section,
          { backgroundColor: isDarkMode ? '#fff' : '#fff' },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDarkMode ? '#007bff' : '#007bff' },
            ]}
          >
            Description
          </Text>
        </View>
        {loadingDescription ? (
          <ActivityIndicator size="small" color="#007bff" />
        ) : (
          <Text
            style={[
              styles.infoText,
              { color: isDarkMode ? '#1c1c1c' : '#1c1c1c' },
            ]}
          >
            {description}
          </Text>
        )}
      </View>

      <View
        style={[
          styles.section,
          { backgroundColor: isDarkMode ? '#fff' : '#fff' },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: isDarkMode ? '#007bff' : '#007bff' },
          ]}
        >
          Dosage & Instructions
        </Text>
        <Text
          style={[
            styles.infoText,
            { color: isDarkMode ? '#1c1c1c' : '#1c1c1c' },
          ]}
        >
          {medicine.dosage || 'Dosage information not available.'}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.buyNowButton,
          medicine.quantity === 0 && styles.disabledButton,
        ]}
        onPress={handleAddToCart}
        disabled={medicine.quantity === 0}
      >
        <Text style={styles.buyNowText}>
          {medicine.quantity === 0 ? 'Not Available' : 'Add to Cart'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '500',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  backButton: {
    padding: 5,
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  cartButton: {
    padding: 5,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'red',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 15,
    marginBottom: 20,
    resizeMode: 'contain',
    backgroundColor: '#fff',
  },
  noImagePlaceholder: {
    width: '100%',
    height: 250,
    borderRadius: 15,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  price: {
    fontSize: 24,
    fontWeight: '600',
  },
  section: {
    width: '100%',
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'justify',
  },
  buyNowButton: {
    backgroundColor: '#007bff',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 35,
    alignSelf: 'center',
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  disabledButton: {
    backgroundColor: 'gray',
  },
  buyNowText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default MedicineDescription;