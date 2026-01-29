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
import { ArrowLeft, ShoppingCart, Activity } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';
import { CartContext } from './CartContext';
import NetInfo from '@react-native-community/netinfo';
import { wp, hp, fontSize } from './responsive';
import { StatusBar } from 'react-native';

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
        { backgroundColor: isDarkMode ? '#121212' : '#f0f4ff', paddingBottom: hp(5) + insets.bottom },
      ]}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      <View style={[styles.headerContainer, { marginTop: insets.top + hp(1) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <ArrowLeft
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
          <ShoppingCart size={28} color={isDarkMode ? '#007bff' : '#007bff'} />
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
            { backgroundColor: isDarkMode ? '#1e1e1e' : '#d0d8ff' },
          ]}
        >
          <Activity
            size={100}
            color={isDarkMode ? '#3b82f6' : '#007bff'}
          />
        </View>
      )}

      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: isDarkMode ? '#fff' : '#1c1c1c' },
          ]}
        >
          {medicine.name}
        </Text>
        <Text
          style={[
            styles.price,
            { color: isDarkMode ? '#3b82f6' : '#007bff' },
          ]}
        >
          PKR {medicine.price}
        </Text>
      </View>

      <View
        style={[
          styles.section,
          { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' },
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDarkMode ? '#3b82f6' : '#007bff' },
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
              { color: isDarkMode ? '#ddd' : '#1c1c1c' },
            ]}
          >
            {description}
          </Text>
        )}
      </View>

      <View
        style={[
          styles.section,
          { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: isDarkMode ? '#3b82f6' : '#007bff' },
          ]}
        >
          Dosage & Instructions
        </Text>
        <Text
          style={[
            styles.infoText,
            { color: isDarkMode ? '#ddd' : '#1c1c1c' },
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
    padding: wp(5),
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#121212' : '#f0f4ff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: fontSize(18),
    fontWeight: '500',
    color: isDarkMode ? '#fff' : '#1c1c1c',
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
    fontSize: fontSize(22),
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
    height: hp(30),
    borderRadius: wp(4),
    marginBottom: hp(2),
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
    fontSize: fontSize(24),
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  price: {
    fontSize: fontSize(20),
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
    fontSize: fontSize(18),
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: fontSize(14),
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
    fontSize: fontSize(16),
  },
});

export default MedicineDescription;