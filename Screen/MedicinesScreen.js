import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { CartContext } from './CartContext';

const MedicineScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { cartItems } = useContext(CartContext);
  const cartCount = cartItems ? cartItems.length : 0;

  // Local state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(true); // New state for page loading
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [authToken, setAuthToken] = useState(null);

  // Load token from AsyncStorage
  const loadToken = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        setAuthToken(token);
      } else {
        console.error('No authToken found, user might not be logged in.');
      }
    } catch (err) {
      console.error('Error loading auth token:', err);
    }
  }, []);

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  // Fetch medicines from the API
  const fetchMedicines = async () => {
    try {
      const config = authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {};
      const response = await axios.get('http://192.168.18.24:2000/medicines', config);
      setMedicines(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch medicines:', err);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch categories from the API
  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://192.168.18.24:2000/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    // Fetch medicines and categories once the authToken is loaded
    const fetchData = async () => {
      await Promise.all([fetchMedicines(), fetchCategories()]);
      // Simulate a 2.5-second loading delay for the entire page
      setTimeout(() => {
        setIsPageLoading(false);
      }, 1000);
    };
    fetchData();
  }, [authToken]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMedicines();
    fetchCategories();
  };

  // Handle search end editing
  const handleSearchEndEditing = () => {
    if (searchQuery.trim().length === 0) return;
    const match = categories.find(
      cat => cat.name.toLowerCase() === searchQuery.trim().toLowerCase()
    );
    if (match) {
      setSelectedCategory(match.name);
      setSearchQuery('');
    }
  };

  // Combined tab data
  const tabData = [{ name: 'All' }, { name: 'Favorites' }, ...categories];

  // Filter medicines
  const filteredMedicines = medicines.filter((med) => {
    const matchesSearch =
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'All') return matchesSearch;
    if (selectedCategory === 'Favorites') return med.liked && matchesSearch;
    return med.category.toLowerCase() === selectedCategory.toLowerCase() && matchesSearch;
  });

  const handleMedicinePress = (medicine) => {
    navigation.navigate('MedicineDetail', { medicine });
  };

  // Get stock status
  const getStockStatus = (quantity) => {
    if (quantity === 0) {
      return { status: 'Out of Stock', color: '#ef4444' };
    } else if (quantity < 10) {
      return { status: 'Low Stock', color: '#f59e0b' };
    }
    return { status: 'In Stock', color: '#10b981' };
  };

  // Toggle like status
  const handleLikeToggle = async (medicineId) => {
    try {
      if (!authToken) {
        console.error('No authToken found, user might not be logged in.');
        return;
      }
      setMedicines((prevMedicines) =>
        prevMedicines.map((med) =>
          (med._id === medicineId || med.id === medicineId)
            ? { ...med, liked: !med.liked }
            : med
        )
      );
      await axios.post(
        `http://192.168.18.24:2000/medicines/${medicineId}/like`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
    } catch (error) {
      console.error('Error toggling like: ', error);
    }
  };

  // Render tab item
  const renderTabItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryTab, selectedCategory === item.name && styles.categoryTabActive]}
      onPress={() => setSelectedCategory(item.name)}
    >
      <Text style={[styles.categoryTabText, selectedCategory === item.name && styles.categoryTabTextActive]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const styles = getStyles(isDarkMode);

  // Show loading spinner while the page is loading
  if (isPageLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#3b82f6'} />
        <Text style={[styles.loadingText, { color: isDarkMode ? '#fff' : '#1e293b' }]}>
          Loading Medicines...
        </Text>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#3b82f6'} />
      </View>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={isDarkMode ? ['#121212', '#1c1c1c'] : ['#f8fafc', '#ffffff']}
        style={styles.errorContainer}
      >
        <Ionicons name="sad-outline" size={64} color="#3b82f6" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchMedicines} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={isDarkMode ? ['#121212', '#1c1c1c'] : ['#f8fafc', '#ffffff']}
      style={styles.container}
    >
      {/* Fixed Header */}
      <View style={[styles.header, { marginTop: 20 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color={isDarkMode ? '#fff' : '#3b82f6'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medicines</Text>
        
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('OnlineMedicinePurchase')}
        >
          <Ionicons name="cart-outline" size={28} color={isDarkMode ? '#fff' : '#3b82f6'} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color={isDarkMode ? '#94a3b8' : '#64748b'} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medicines or categories..."
          placeholderTextColor={isDarkMode ? '#94a3b8' : '#64748b'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onEndEditing={handleSearchEndEditing}
        />
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <FlatList
          data={tabData}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={renderTabItem}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.dynamicTabs}
        />
      </View>

      {/* Medicine List */}
      <FlatList
        data={filteredMedicines}
        keyExtractor={(item) => (item._id || item.id).toString()}
        renderItem={({ item }) => {
          const { status, color } = getStockStatus(item.quantity);
          const imageUrl = item.image?.startsWith('http')
            ? item.image
            : `http://192.168.18.24:2000${item.image}`;
          return (
            <TouchableOpacity style={styles.medicineCard} onPress={() => handleMedicinePress(item)} activeOpacity={0.9}>
              <View style={styles.cardContent}>
                {item.image ? (
                  <Image source={{ uri: imageUrl }} style={styles.medicineImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialIcons name="medication" size={32} color={isDarkMode ? '#374151' : '#cbd5e1'} />
                  </View>
                )}
                <View style={styles.medicineInfo}>
                  <View style={styles.infoHeader}>
                    <Text style={styles.medicineName} numberOfLines={1}>{item.name}</Text>
                    <TouchableOpacity style={styles.favoriteButton} onPress={() => handleLikeToggle(item._id || item.id)}>
                      <Ionicons
                        name={item.liked ? 'heart' : 'heart-outline'}
                        size={20}
                        color={item.liked ? '#e0245e' : isDarkMode ? '#94a3b8' : '#64748b'}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.medicineDosage} numberOfLines={1}>{item.dosage}</Text>
                  <View style={styles.metaContainer}>
                    <View style={styles.stockContainer}>
                      <Ionicons name="checkmark-circle" size={16} color={color} />
                      <Text style={[styles.stockStatus, { color }]}>{status}</Text>
                    </View>
                    <Text style={styles.medicinePrice}>₨{item.price}</Text>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{item.category}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.medicineList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            progressBackgroundColor={isDarkMode ? '#1c1c1c' : '#fff'}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
};

const getStyles = (isDarkMode) =>
  StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#121212' : '#f8fafc',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 18,
      fontWeight: '500',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: isDarkMode ? '#121212' : '#f8fafc',
    },
    errorText: {
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#64748b',
      textAlign: 'center',
      marginVertical: 16,
    },
    retryButton: {
      backgroundColor: '#3b82f6',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      marginTop: 8,
    },
    retryButtonText: { color: '#fff', fontSize: 14 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#2d2d2d' : '#e2e8f0',
      backgroundColor: isDarkMode ? '#1c1c1c' : '#fff',
    },
    backButton: { marginRight: 8 },
    headerTitle: { fontSize: 28, fontWeight: '700', color: isDarkMode ? '#fff' : '#1e293b' },
    cartButton: {
      marginLeft: 8,
      position: 'relative',
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
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#2d2d2d' : '#fff',
      borderRadius: 16,
      marginHorizontal: 24,
      marginVertical: 16,
      paddingHorizontal: 20,
      height: 56,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    searchIcon: {},
    searchInput: {
      flex: 1,
      height: '100%',
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#1e293b',
      marginHorizontal: 12,
    },
    tabBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 8,
      backgroundColor: isDarkMode ? '#1c1c1c' : '#fff',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#2d2d2d' : '#e2e8f0',
    },
    categoryTab: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: isDarkMode ? '#2d2d2d' : '#f1f5f9',
    },
    categoryTabActive: { backgroundColor: '#3b82f6' },
    categoryTabText: { fontSize: 14, color: isDarkMode ? '#fff' : '#64748b' },
    categoryTabTextActive: { color: '#fff', fontWeight: '600' },
    dynamicTabs: { paddingVertical: 4 },
    medicineList: {
      paddingBottom: 24,
      paddingTop: 16,
      paddingHorizontal: 24,
    },
    medicineCard: {
      borderRadius: 20,
      marginBottom: 16,
      padding: 16,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 3,
      borderWidth: 1,
      borderColor: isDarkMode ? '#2a2a2a' : '#f0f0f0',
    },
    cardContent: { flexDirection: 'row', alignItems: 'center' },
    medicineImage: { width: 80, height: 80, borderRadius: 12, marginRight: 16 },
    imagePlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#2d2d2d' : '#f1f5f9',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    medicineInfo: { flex: 1 },
    infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    medicineName: { fontSize: 18, fontWeight: '600', color: isDarkMode ? '#fff' : '#1e293b', flex: 1 },
    medicineDosage: { fontSize: 14, color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: 12 },
    metaContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    stockContainer: { flexDirection: 'row', alignItems: 'center' },
    stockStatus: { fontSize: 13, marginLeft: 6 },
    medicinePrice: { fontSize: 18, fontWeight: '700', color: '#3b82f6' },
    categoryBadge: {
      alignSelf: 'flex-start',
      backgroundColor: isDarkMode ? '#3b82f622' : '#3b82f611',
      borderRadius: 8,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    categoryBadgeText: { fontSize: 14, color: isDarkMode ? '#fff' : '#1e293b' },
    favoriteButton: { padding: 4, marginLeft: 8 },
  });

export default MedicineScreen;