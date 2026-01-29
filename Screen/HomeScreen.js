// HomeScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  PanResponder,
  RefreshControl,
  Modal,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wp, hp, fontSize } from "./responsive";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import {
  faHome,
  faSearch,
  faUser,
  faUsers,
  faCog,
  faPills,
  faUserMd,
  faHeartbeat,
  faLeaf,
  faKitMedical,
  faViruses,
  faThermometer,
  faTint,
  faTooth,
  faClinicMedical,
  faCalendarAlt,
  faBox,
  faBell,
  faShoppingBag,
  faHistory,
  faQuestionCircle,
  faSun,
  faMoon,
  faMapMarkerAlt,
  faCreditCard,
  faStar,
  faComments,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { useTheme } from "./ThemeContext";
import Footer from "./Footer";

const HomeScreen = () => {
  const { width: screenWidth } = useWindowDimensions();
  const navigation = useNavigation();
  const { isDarkMode, setIsDarkMode, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  // State Variables
  const [refreshing, setRefreshing] = useState(false);
  const [clinicStatus, setClinicStatus] = useState("Operational");
  const [userCount, setUserCount] = useState(0);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [userEmail, setUserEmail] = useState(null); // Added userEmail state for fetching pending orders
  const [searchText, setSearchText] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.Value(0)).current;
  const translateX = Animated.add(slideAnim, pan);
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [locationAddress, setLocationAddress] = useState("Locating...");

  // Fetch Live Location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationAddress("Permission Denied");
        return;
      }
      try {
        let location = await Location.getCurrentPositionAsync({});
        let address = await Location.reverseGeocodeAsync(location.coords);
        if (address && address.length > 0) {
          const { city, country, region } = address[0];
          const displayAddress = city || region;
          setLocationAddress(`${displayAddress}, ${country}`);
        }
      } catch (error) {
        setLocationAddress("Location Unavailable");
      }
    })();
  }, []);

  // Data Fetching Functions
  const fetchMedicines = () => {
    axios
      .get("https://dashboard-backend-xrss.vercel.app/medicines")
      .then((res) => {
        setMedicines(res.data);
      })
      .catch((err) => console.error("Error fetching medicines:", err));
  };

  const fetchUserCount = () => {
    axios
      .get("https://auth-backend-three-navy.vercel.app/api/usercount")
      .then((res) => {
        setUserCount(res.data.count);
      })
      .catch((err) => console.error("Error fetching user count:", err));
  };

  const fetchPendingOrders = async (email) => {
    if (!email) return; // Ensure email is available
    try {
      const resp = await fetch(`https://dashboard-backend-xrss.vercel.app/api/order?userId=${email}`);
      const data = await resp.json();
      if (data.orders) {
        const pending = data.orders.filter(o => o.paymentMethod === 'EasyPaisa' && o.status === 'pending');
        setPendingOrderCount(pending.length);
      }
    } catch (e) {
      console.error("Error fetching pending orders:", e);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchMedicines(), fetchUserCount(), fetchPendingOrders(userEmail)]).finally(() => {
      setRefreshing(false);
    });
  };

  useEffect(() => {
    fetchMedicines();
    fetchUserCount();

    // Fetch actual user email from AsyncStorage
    AsyncStorage.getItem("user").then((userData) => {
      if (userData) {
        const user = JSON.parse(userData);
        if (user.email) {
          setUserEmail(user.email);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchPendingOrders(userEmail);
    }
  }, [userEmail]); // Fetch pending orders when userEmail becomes available

  // Search Filtering
  const filteredMedicines = medicines.filter(
    (medicine) =>
      medicine.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (medicine.category &&
        medicine.category.toLowerCase().includes(searchText.toLowerCase()))
  );

  // Banner Slider Setup
  const banners = [
    {
      id: 1,
      image: require("../assets/banner1.png"),
      text: "Buy Medicines Online at Your Fingertips",
    },
    {
      id: 2,
      image: require("../assets/banner2.jpg"),
      text: "Fast Delivery for All Your Medicine Needs",
    },
    {
      id: 3,
      image: require("../assets/banner3.jpg"),
      text: "Quality Medicine at Affordable Prices",
    },
    {
      id: 4,
      image: require("../assets/banner4.jpg"),
      text: "Your Health, Our Priority",
    },
    {
      id: 5,
      image: require("../assets/banner5.jpg"),
      text: "Seamless Online Pharmacy Experience",
    },
  ];

  useEffect(() => {
    pan.setValue(0);
    slideAnim.setValue(screenWidth);
    scaleAnim.setValue(1);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentBannerIndex, slideAnim, scaleAnim, opacityAnim, pan]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        pan.setValue(gestureState.dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const threshold = screenWidth * 0.25;
        if (gestureState.dx < -threshold) {
          setCurrentBannerIndex(
            (prevIndex) => (prevIndex + 1) % banners.length
          );
        } else if (gestureState.dx > threshold) {
          setCurrentBannerIndex((prevIndex) =>
            prevIndex === 0 ? banners.length - 1 : prevIndex - 1
          );
        }
        Animated.spring(pan, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Dashboard Overview Calculations
  const totalMedicineTypes = new Set(medicines.map((med) => med.name)).size;

  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    if (currentHour >= 8 && currentHour < 22) {
      setClinicStatus("Operational");
    } else {
      setClinicStatus("Closed");
    }
  }, []);

  // Arrays for Dashboard Overview
  const topCategories = [
    { icon: faPills, label: "Medicines", screen: "Medicine" },
    { icon: faBell, label: "Medicine Reminder", screen: "MedicineReminder" },
    { icon: faComments, label: "Chat", screen: "Chat" },
  ];

  const features = [
    { icon: faHistory, label: "Order History", screen: "OrderHistory" },
    {
      icon: faCreditCard,
      label: "Transaction History",
      screen: "TransactionHistory",
    },
    { icon: faCog, label: "Settings", screen: "Settings" },
    { icon: faQuestionCircle, label: "Help", screen: "HelpAndSupport" },
  ];

  const styles = React.useMemo(() => getStyles(isDarkMode, screenWidth, insets), [isDarkMode, screenWidth, insets]);

  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        <StatusBar
          style={isDarkMode ? "light" : "dark"}
          backgroundColor="transparent"
          translucent={true}
        />
        {pendingOrderCount > 0 && (
          <TouchableOpacity
            style={styles.notificationTouchable}
            onPress={() => navigation.navigate('OrderHistory')}
          >
            <LinearGradient
              colors={['#FF9800', '#F57C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.pendingNotification}
            >
              <View style={styles.notificationIcon}>
                <FontAwesomeIcon icon={faBell} color="#fff" size={18} />
              </View>
              <Text style={styles.pendingText}>
                You have {pendingOrderCount} pending payment{pendingOrderCount > 1 ? 's' : ''}. {'\n'}
                <Text style={styles.pendingSubText}>Tap to complete your order</Text>
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, { paddingTop: insets.top + hp(1) }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate("Home")}>
              <FontAwesomeIcon icon={faHome} size={22} color="#007bff" />
            </TouchableOpacity>
            <View style={styles.locationContainer}>
              <FontAwesomeIcon
                icon={faMapMarkerAlt}
                size={20}
                color="#007bff"
              />
              <Text style={styles.locationText}> {locationAddress}</Text>
            </View>
            <TouchableOpacity onPress={toggleTheme}>
              <FontAwesomeIcon
                icon={isDarkMode ? faMoon : faSun}
                size={22}
                color="#007bff"
              />
            </TouchableOpacity>
          </View>

          {/* Title & Subtitle */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Simplify Your Medicine Search</Text>
            <Text style={styles.subtitle}>
              Efficiently Find the Right Medications
            </Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <FontAwesomeIcon icon={faSearch} size={20} color="#007bff" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search to find your medicine"
              placeholderTextColor={isDarkMode ? "#aaa" : "#666"}
              value={searchText}
              onChangeText={(text) => setSearchText(text)}
            />
          </View>

          {/* Search Results or Main Dashboard */}
          {searchText.trim() !== "" ? (
            <View style={styles.searchResultsContainer}>
              {filteredMedicines.length > 0 ? (
                filteredMedicines.map((item) => (
                  <TouchableOpacity
                    key={item.id || item._id}
                    style={styles.searchResultItem}
                    onPress={() =>
                      navigation.navigate("MedicineDetail", {
                        medicine: item,
                      })
                    }
                  >
                    <Text style={styles.searchResultName}>{item.name}</Text>
                    <Text style={styles.searchResultCategory}>
                      {item.category}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noResultsText}>No results found.</Text>
              )}
            </View>
          ) : (
            <>
              {/* Dashboard Overview */}
              <Text style={styles.sectionTitle}>Dashboard Overview</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.dashboard}
              >
                <TouchableOpacity
                  style={styles.dashboardItem}
                  onPress={() => setShowClinicModal(true)}
                >
                  <FontAwesomeIcon
                    icon={faClinicMedical}
                    size={30}
                    color="#007bff"
                  />
                  <View style={styles.dashboardTextContainer}>
                    <Text style={styles.dashboardLabel}>Clinic Status</Text>
                    <Text style={styles.dashboardValue}>{clinicStatus}</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.dashboardItem}>
                  <FontAwesomeIcon icon={faUsers} size={30} color="#007bff" />
                  <View style={styles.dashboardTextContainer}>
                    <Text style={styles.dashboardLabel}>
                      Registered Users
                    </Text>
                    <Text style={styles.dashboardValue}>{userCount}</Text>
                  </View>
                </View>
                <View style={styles.dashboardItem}>
                  <FontAwesomeIcon icon={faBox} size={30} color="#007bff" />
                  <View style={styles.dashboardTextContainer}>
                    <Text style={styles.dashboardLabel}>Medicine Types</Text>
                    <Text style={styles.dashboardValue}>
                      {totalMedicineTypes}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Banner Slider */}
              <View style={styles.banner} {...panResponder.panHandlers}>
                <Animated.View
                  style={[
                    styles.bannerImageContainer,
                    {
                      transform: [
                        { translateX: translateX },
                        { scale: scaleAnim },
                      ],
                      opacity: opacityAnim,
                    },
                  ]}
                >
                  <Animated.Image
                    source={
                      typeof banners[currentBannerIndex].image === 'string'
                        ? {
                          uri: banners[currentBannerIndex].image.startsWith('http')
                            ? banners[currentBannerIndex].image
                            : `https://dashboard-backend-xrss.vercel.app${banners[currentBannerIndex].image}`
                        }
                        : banners[currentBannerIndex].image
                    }
                    style={styles.bannerImage}
                    resizeMode="cover"
                  />
                  <Animated.View style={styles.bannerOverlay}>
                    <Text style={styles.bannerText}>
                      {banners[currentBannerIndex].text}
                    </Text>
                  </Animated.View>
                </Animated.View>
              </View>

              {/* Top Categories */}
              <Text style={styles.sectionTitle}>Top Categories</Text>
              <View style={styles.categories}>
                {topCategories.map((category, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.category}
                    onPress={() => navigation.navigate(category.screen)}
                  >
                    <View style={styles.categoryIconContainer}>
                      <FontAwesomeIcon
                        icon={category.icon}
                        size={26}
                        color="#007bff"
                      />
                    </View>
                    <Text style={styles.categoryText}>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Features */}
              <Text style={styles.sectionTitle}>Features</Text>
              <View style={styles.features}>
                {features.map((feature, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.feature}
                    onPress={() => navigation.navigate(feature.screen)}
                  >
                    <View style={styles.featureIconContainer}>
                      <FontAwesomeIcon
                        icon={feature.icon}
                        size={26}
                        color="#007bff"
                      />
                    </View>
                    <Text style={styles.featureText}>{feature.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Online Medicine Purchase */}
              <Text style={styles.sectionTitle}>Order Medicines Online</Text>
              <View style={styles.onlinePurchase}>
                <Text style={styles.onlinePurchaseText}>
                  Order your medicines online and get them delivered right to
                  your doorstep.
                </Text>
                <TouchableOpacity
                  style={styles.orderButton}
                  onPress={() => navigation.navigate("Medicine")}
                >
                  <Text style={styles.orderButtonText}>Order Now</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>

        <Footer />

        {/* Clinic Timing Modal */}
        <Modal
          visible={showClinicModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowClinicModal(false)}
        >
          <View style={modalStyles.modalContainer}>
            <View style={modalStyles.modalContent}>
              <Text style={modalStyles.modalTitle}>Clinic Hours</Text>
              <Text style={modalStyles.modalText}>
                Everyday from 8:00 AM to 10:00 PM
              </Text>
              <TouchableOpacity
                style={modalStyles.modalButton}
                onPress={() => setShowClinicModal(false)}
              >
                <Text style={modalStyles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

const getStyles = (isDarkMode, screenWidth, insets = { top: 0, bottom: 0 }) =>
  StyleSheet.create({
    element: {
      width: screenWidth, // Sets the width to the screen's width
      marginTop: 20,
    },

    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? "#000" : "#f8f9fa",
    },
    mainContainer: {
      flex: 1,
      backgroundColor: isDarkMode ? "#121212" : "#FFFFFF",
    },
    container: {
      flex: 1,
      backgroundColor: "transparent",
    },
    scrollContainer: {
      padding: wp(5),
      paddingBottom: hp(12) + insets.bottom,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: hp(2),
    },
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    locationText: {
      fontSize: fontSize(14),
      color: "#007bff",
      marginLeft: 5,
      fontWeight: "600",
      maxWidth: wp(50),
    },
    titleContainer: {
      alignItems: "center",
      marginBottom: 20,
    },
    title: {
      fontSize: fontSize(24),
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#333",
      textAlign: "center",
    },
    subtitle: {
      fontSize: fontSize(14),
      color: isDarkMode ? "#ccc" : "#555",
      textAlign: "center",
      marginTop: 5,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#333" : "#fff",
      borderRadius: wp(8),
      paddingHorizontal: wp(5),
      paddingVertical: hp(1.5),
      marginBottom: hp(2),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 4,
    },
    searchInput: {
      flex: 1,
      marginLeft: 10,
      fontSize: fontSize(16),
      color: isDarkMode ? "#fff" : "#333",
    },
    searchResultsContainer: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      padding: 15,
      borderRadius: 10,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    searchResultItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#444" : "#eee",
    },
    searchResultName: {
      fontSize: 18,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333",
    },
    searchResultCategory: {
      fontSize: 14,
      color: isDarkMode ? "#ccc" : "#777",
      marginTop: 4,
    },
    noResultsText: {
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#333",
      textAlign: "center",
      marginTop: 20,
    },
    sectionTitle: {
      fontSize: fontSize(18),
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#333",
      marginVertical: hp(1.5),
    },
    dashboard: {
      marginBottom: 20,
    },
    dashboardItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 15,
      padding: 15,
      marginRight: 15,
    },
    dashboardTextContainer: {
      marginLeft: 10,
    },
    dashboardLabel: {
      fontSize: 14,
      color: isDarkMode ? "#ccc" : "#666",
    },
    dashboardValue: {
      fontSize: fontSize(16),
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#333",
    },
    categories: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    category: {
      width: "47%",
      alignItems: "center",
      marginBottom: 15,
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 15,
      padding: 15,
    },
    categoryIconContainer: {
      backgroundColor: isDarkMode ? "#444" : "#e9f0ff",
      borderRadius: 50,
      padding: 15,
      marginBottom: 8,
    },
    categoryText: {
      fontSize: 16,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#333",
      textAlign: "center",
    },
    banner: {
      position: "relative",
      marginBottom: 20,
      borderRadius: 15,
      overflow: "hidden",
    },
    bannerImageContainer: {
      width: "100%",
      height: hp(22),
    },
    bannerImage: {
      width: "100%",
      height: "100%",
    },
    bannerOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.35)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    bannerText: {
      fontSize: fontSize(18),
      fontWeight: "bold",
      color: "#fff",
      textAlign: "center",
    },
    features: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    feature: {
      width: "48%",
      alignItems: "center",
      marginBottom: 20,
    },
    featureIconContainer: {
      backgroundColor: isDarkMode ? "#444" : "#e9f0ff",
      borderRadius: 50,
      padding: 15,
      marginBottom: 8,
    },
    featureText: {
      fontSize: 14,
      color: isDarkMode ? "#fff" : "#333",
      textAlign: "center",
    },
    onlinePurchase: {
      backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
      borderRadius: 15,
      padding: 20,
      marginBottom: 30,
    },
    onlinePurchaseText: {
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 15,
      textAlign: "center",
    },
    orderButton: {
      backgroundColor: "#007bff",
      borderRadius: 30,
      paddingVertical: 12,
      paddingHorizontal: 30,
      alignItems: "center",
      alignSelf: "center",
    },
    orderButtonText: {
      color: "#fff",
      fontSize: fontSize(16),
      fontWeight: "bold",
    },
    notificationTouchable: {
      marginTop: insets.top + hp(1),
      marginHorizontal: wp(5),
      borderRadius: 15,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    pendingNotification: {
      flexDirection: 'row',
      padding: 15,
      alignItems: 'center',
      borderRadius: 15,
    },
    notificationIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    pendingText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: fontSize(14),
      flex: 1,
    },
    pendingSubText: {
      fontSize: fontSize(12),
      fontWeight: "400",
      opacity: 0.9,
    },
  });

const modalStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    width: "100%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#007bff",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  modalButton: {
    backgroundColor: "#007bff",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default HomeScreen;
