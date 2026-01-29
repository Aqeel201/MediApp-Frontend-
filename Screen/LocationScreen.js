import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  Modal,
  Animated,
  ScrollView,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from 'expo-location';
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { wp, hp, fontSize } from "./responsive";
import {
  faArrowLeft,
  faBell,
  faShoppingCart,
  faCreditCard,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { CartContext } from "./CartContext";
import { useTheme } from './ThemeContext';

const OnlineMedicinePurchase = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode, insets);
  const cartContext = useContext(CartContext);

  if (!cartContext) {
    console.warn("CartContext is not provided");
    return (
      <View style={styles.safeArea}>
        <Text style={styles.errorText}>
          CartContext is not available. Please ensure it’s provided in the component tree.
        </Text>
      </View>
    );
  }

  const { cartItems = [], clearCart = () => { } } = cartContext;

  const [formData, setFormData] = useState({
    email: "",
    shippingEmail: "",
    billingEmail: "",
    firstName: "",
    lastName: "",
    streetAddress: "",
    phoneNumber: "",
    sameAsBilling: true,
    shippingMethod: null,
    paymentMethod: null,
    billingFirstName: "",
    billingLastName: "",
    billingStreetAddress: "",
    billingPhoneNumber: "",
    location: null,
  });

  const [showMap, setShowMap] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 35.3247,
    longitude: 75.5510,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const shippingMethods = [
    { id: 1, title: "Standard Delivery", description: "6-8 Hours Delivery", price: "Rs.200.00" },
    { id: 2, title: "Fast Delivery", description: "1-2 Hours Delivery", price: "Rs.300.00" },
  ];
  const paymentMethods = [
    { id: 1, name: "Cash On Delivery" },
    { id: 2, name: "EasyPaisa" },
  ];

  useEffect(() => {
    console.log("CartContext:", cartContext);
    console.log("CartItems:", cartItems);
  }, [cartContext, cartItems]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        let location = await Location.getCurrentPositionAsync({});
        const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
        setFormData(prev => ({ ...prev, location: coords }));
        setMapRegion(prev => ({ ...prev, ...coords }));

        let address = await Location.reverseGeocodeAsync(location.coords);
        if (address && address.length > 0) {
          const { street, city, region, country } = address[0];
          setFormData(prev => ({
            ...prev,
            streetAddress: prev.streetAddress || street || "",
            city: city || region || "",
            country: country || "Pakistan",
            region: region || ""
          }));
        }
      } catch (error) {
        console.error("Location error:", error);
      }
    })();
  }, []);

  const handleMapSelect = (e) => {
    const coords = e.nativeEvent.coordinate;
    setFormData(prev => ({ ...prev, location: coords }));
    setShowMap(false);
    Alert.alert("Success", "Location set from map!");
  };

  useEffect(() => {
    AsyncStorage.getItem("user")
      .then((userData) => {
        if (userData) {
          const user = JSON.parse(userData);
          if (user.email) {
            setFormData((prev) => ({ ...prev, email: user.email }));
          }
        }
      })
      .catch((error) => console.error("AsyncStorage error:", error));
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validatePhoneNumber = (number) => /^03\d{9}$/.test(number);
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const progressLine1Anim = useRef(new Animated.Value(1)).current;
  const progressLine2Anim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      Animated.timing(progressLine2Anim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }, [])
  );

  const handleBackPress = () => {
    Animated.timing(progressLine1Anim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: false,
    }).start(() => navigation.goBack());
  };

  const calculateSubtotal = () =>
    cartItems.reduce((total, item) => total + (item.price * (item.cartQuantity || 1)), 0);

  const shippingFee = formData.shippingMethod === 1 ? 200 : formData.shippingMethod === 2 ? 300 : 0;
  const orderTotal = calculateSubtotal() + shippingFee;

  const handleSubmit = async () => {
    if (!cartItems.length) {
      Alert.alert("Missing Medicines", "Please add medicines to your cart.");
      return;
    }
    const requiredFields = [
      "email",
      "shippingEmail",
      "firstName",
      "lastName",
      "streetAddress",
      "phoneNumber",
      "shippingMethod",
      "paymentMethod",
    ];
    if (requiredFields.some((field) => !formData[field])) {
      Alert.alert("Missing Information", "Please fill all required fields.");
      return;
    }
    if (!validateEmail(formData.email) || !validateEmail(formData.shippingEmail)) {
      Alert.alert("Invalid Email", "Please enter valid email addresses.");
      return;
    }
    if (!validatePhoneNumber(formData.phoneNumber)) {
      Alert.alert("Invalid Phone Number", "Format: 03*********");
      return;
    }
    if (!formData.sameAsBilling) {
      const billingFields = [
        "billingEmail",
        "billingFirstName",
        "billingLastName",
        "billingStreetAddress",
        "billingPhoneNumber",
      ];
      if (billingFields.some((field) => !formData[field])) {
        Alert.alert("Missing Information", "Please fill all billing fields.");
        return;
      }
      if (!validateEmail(formData.billingEmail) || !validatePhoneNumber(formData.billingPhoneNumber)) {
        Alert.alert("Invalid Input", "Please enter valid billing email and phone number.");
        return;
      }
    }

    const shippingAddress = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      streetAddress: formData.streetAddress,
      phoneNumber: formData.phoneNumber,
    };
    const billingAddress = formData.sameAsBilling
      ? shippingAddress
      : {
        firstName: formData.billingFirstName,
        lastName: formData.billingLastName,
        streetAddress: formData.billingStreetAddress,
        phoneNumber: formData.billingPhoneNumber,
      };

    const orderData = {
      userId: formData.email,
      shippingEmail: formData.shippingEmail,
      billingEmail: formData.sameAsBilling ? formData.shippingEmail : formData.billingEmail,
      shippingAddress,
      billingAddress,
      shippingMethod: formData.shippingMethod,
      paymentMethod: formData.paymentMethod === 1 ? "COD" : "EasyPaisa",
      cartItems,
      shippingFee,
      orderTotal,
      location: formData.location || null, // Added live location coordinates
    };

    Animated.timing(progressLine2Anim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(async () => {
      try {
        const response = await fetch("https://dashboard-backend-xrss.vercel.app/api/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to place order");
        clearCart();
        navigation.navigate("Confirmation", { order: data.order, paymentMethod: orderData.paymentMethod });
      } catch (error) {
        console.error("Order submission error:", error);
        Alert.alert("Error", "Failed to place order. Please try again.");
      }
    });
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar
        style={isDarkMode ? "light" : "dark"}
        backgroundColor="transparent"
        translucent={true}
      />
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={handleBackPress} style={styles.iconButton}>
          <FontAwesomeIcon icon={faArrowLeft} size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <TouchableOpacity style={styles.iconButton}>
          <FontAwesomeIcon icon={faBell} size={24} color="#007bff" />
        </TouchableOpacity>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, styles.activeStep]}>
            <FontAwesomeIcon icon={faShoppingCart} size={20} color="#fff" />
          </View>
          <Text style={styles.progressTextActive}>Cart</Text>
        </View>
        <View style={styles.progressLineContainer}>
          <Animated.View
            style={[
              styles.animatedProgressLine,
              { width: progressLine1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 60] }) },
            ]}
          />
        </View>
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, styles.activeStep]}>
            <FontAwesomeIcon icon={faCreditCard} size={20} color="#fff" />
          </View>
          <Text style={styles.progressTextActive}>Checkout</Text>
        </View>
        <View style={styles.progressLineContainer}>
          <Animated.View
            style={[
              styles.animatedProgressLine,
              { width: progressLine2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 60] }) },
            ]}
          />
        </View>
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, styles.inactiveStep]}>
            <FontAwesomeIcon icon={faCheckCircle} size={20} color="#ccc" />
          </View>
          <Text style={styles.progressText}>Confirmation</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDarkMode ? "#333" : "#e9ecef" }]}
            placeholder="Email Address *"
            value={formData.email}
            editable={false}
            placeholderTextColor={isDarkMode ? "#888" : "#999"}
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Shipping Email *"
            value={formData.shippingEmail}
            onChangeText={(text) => handleInputChange("shippingEmail", text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="First Name *"
              value={formData.firstName}
              onChangeText={(text) => handleInputChange("firstName", text)}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Last Name *"
              value={formData.lastName}
              onChangeText={(text) => handleInputChange("lastName", text)}
            />
          </View>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => setShowMap(true)}
          >
            <FontAwesomeIcon icon={faCheckCircle} size={18} color="#fff" />
            <Text style={styles.mapButtonText}> Set Location from Map</Text>
          </TouchableOpacity>

          {formData.location && (
            <Text style={styles.coordinatesText}>
              Selected: {formData.location.latitude.toFixed(4)}, {formData.location.longitude.toFixed(4)}
            </Text>
          )}

          <TextInput
            style={styles.input}
            placeholder="Street Address *"
            placeholderTextColor={isDarkMode ? "#888" : "#999"}
            value={formData.streetAddress}
            onChangeText={(text) => handleInputChange("streetAddress", text)}
          />
          <View style={styles.disabledField}>
            <Text style={styles.disabledText}>{formData.country || "Pakistan"}</Text>
          </View>
          <View style={styles.disabledField}>
            <Text style={styles.disabledText}>{formData.region || "Select Region"}</Text>
          </View>
          <View style={styles.disabledField}>
            <Text style={styles.disabledText}>{formData.city || "Select City"}</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Phone Number *"
            value={formData.phoneNumber}
            onChangeText={(text) => handleInputChange("phoneNumber", text)}
            keyboardType="phone-pad"
            maxLength={11}
          />
          <Text style={styles.note}>Format: 03**********</Text>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => handleInputChange("sameAsBilling", !formData.sameAsBilling)}
          >
            <View style={styles.checkbox}>
              {formData.sameAsBilling && <View style={styles.checkboxInner} />}
            </View>
            <Text style={styles.checkboxLabel}>This address is also my billing address</Text>
          </TouchableOpacity>
        </View>
        {!formData.sameAsBilling && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Billing Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Billing Email *"
              value={formData.billingEmail}
              onChangeText={(text) => handleInputChange("billingEmail", text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="First Name *"
                value={formData.billingFirstName}
                onChangeText={(text) => handleInputChange("billingFirstName", text)}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Last Name *"
                value={formData.billingLastName}
                onChangeText={(text) => handleInputChange("billingLastName", text)}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Street Address *"
              value={formData.billingStreetAddress}
              onChangeText={(text) => handleInputChange("billingStreetAddress", text)}
            />
            <View style={styles.disabledField}>
              <Text style={styles.disabledText}>Region/City Info</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Phone Number *"
              value={formData.billingPhoneNumber}
              onChangeText={(text) => handleInputChange("billingPhoneNumber", text)}
              keyboardType="phone-pad"
              maxLength={11}
            />
            <Text style={styles.note}>Format: 03**********</Text>
          </View>
        )}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Methods</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {shippingMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[styles.methodCard, { marginRight: 10 }]}
                onPress={() => handleInputChange("shippingMethod", method.id)}
              >
                <View style={styles.radioButton}>
                  {formData.shippingMethod === method.id && <View style={styles.radioSelected} />}
                </View>
                <View style={styles.methodDetails}>
                  <Text style={styles.methodTitle}>{method.title}</Text>
                  <Text style={styles.methodDescription}>{method.description}</Text>
                  <Text style={styles.methodPrice}>{method.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={styles.paymentMethod}
              onPress={() => handleInputChange("paymentMethod", method.id)}
            >
              <View style={styles.radioButton}>
                {formData.paymentMethod === method.id && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.paymentMethodText}>{method.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cartItems.length === 0 ? (
            <Text style={styles.summaryText}>Your cart is empty.</Text>
          ) : (
            <>
              {cartItems.map((item) => (
                <View key={item._id || item.id} style={styles.itemContainer}>
                  <Text style={styles.itemName}>
                    {item.name} x {item.cartQuantity || 1}
                  </Text>
                  <Text style={styles.itemPrice}>
                    Rs. {(item.price * (item.cartQuantity || 1)).toFixed(2)}
                  </Text>
                </View>
              ))}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Cart Subtotal</Text>
                <Text style={styles.summaryValue}>Rs. {calculateSubtotal().toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={styles.summaryValue}>Rs. {shippingFee.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Order Total</Text>
                <Text style={styles.totalValue}>Rs. {orderTotal.toFixed(2)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Place Order Button */}
        <TouchableOpacity style={styles.placeOrderButton} onPress={handleSubmit}>
          <Text style={styles.placeOrderText}>Place Order</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Map Modal */}
      <Modal visible={showMap} animationType="slide">
        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            region={mapRegion}
            onPress={handleMapSelect}
            showsUserLocation={true}
          >
            {formData.location && (
              <Marker coordinate={formData.location} title="Delivery Location" />
            )}
          </MapView>
          <TouchableOpacity
            style={styles.closeMapButton}
            onPress={() => setShowMap(false)}
          >
            <Text style={styles.closeMapText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (isDarkMode = false, insets = { top: 0, bottom: 0 }) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: isDarkMode ? "#121212" : "#F9FAFB" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp(5),
    paddingBottom: hp(2),
    backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? "#333" : "#E5E7EB",
    elevation: 2,
  },
  headerTitle: {
    fontSize: fontSize(20),
    fontWeight: "600",
    color: isDarkMode ? "#fff" : "#1F2937"
  },
  iconButton: { padding: 8 },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: wp(5),
    backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? "#333" : "#E5E7EB",
  },
  progressStep: { alignItems: "center", flex: 1 },
  progressCircle: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  activeStep: { backgroundColor: "#007bff" },
  inactiveStep: {
    backgroundColor: isDarkMode ? "#2c2c2c" : "#F3F4F6",
    borderWidth: 2,
    borderColor: isDarkMode ? "#444" : "#E5E7EB"
  },
  progressTextActive: { fontSize: fontSize(12), fontWeight: "500", color: "#007bff" },
  progressText: { fontSize: fontSize(12), color: isDarkMode ? "#888" : "#9CA3AF" },
  progressLineContainer: {
    width: wp(15),
    height: 2,
    backgroundColor: isDarkMode ? "#333" : "#E5E7EB",
    marginHorizontal: 4
  },
  animatedProgressLine: { height: 2, backgroundColor: "#007bff" },
  container: { padding: wp(5) },
  section: {
    backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
    borderRadius: 12,
    padding: wp(4),
    marginBottom: hp(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.2 : 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: fontSize(16),
    fontWeight: "bold",
    color: isDarkMode ? "#fff" : "#333",
    marginBottom: hp(1.5)
  },
  input: {
    backgroundColor: isDarkMode ? "#2c2c2c" : "#fff",
    borderWidth: 1,
    borderColor: isDarkMode ? "#444" : "#ddd",
    borderRadius: 8,
    padding: wp(3.5),
    marginBottom: hp(1.5),
    fontSize: fontSize(14),
    color: isDarkMode ? "#fff" : "#333",
  },
  disabledField: {
    backgroundColor: isDarkMode ? "#252525" : "#f5f5f5",
    borderWidth: 1,
    borderColor: isDarkMode ? "#333" : "#ddd",
    borderRadius: 8,
    padding: wp(3.5),
    marginBottom: hp(1.5),
  },
  disabledText: { color: isDarkMode ? "#aaa" : "#666", fontSize: fontSize(14) },
  mapButton: {
    backgroundColor: "#3b82f6",
    flexDirection: 'row',
    padding: wp(3.5),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.5),
  },
  mapButtonText: { color: "#fff", fontWeight: "600", fontSize: fontSize(14) },
  coordinatesText: {
    fontSize: fontSize(12),
    color: "#3b82f6",
    marginBottom: hp(1.5),
    textAlign: 'center',
    fontWeight: '500'
  },
  closeMapButton: {
    position: 'absolute',
    bottom: hp(5),
    alignSelf: 'center',
    backgroundColor: '#ff4d4f',
    paddingHorizontal: wp(10),
    paddingVertical: hp(1.5),
    borderRadius: 30,
  },
  closeMapText: { color: '#fff', fontWeight: 'bold' },
  placeOrderButton: {
    backgroundColor: "#007bff",
    borderRadius: 12,
    padding: hp(2),
    alignItems: "center",
    marginTop: hp(2),
    marginBottom: hp(5),
  },
  placeOrderText: { color: "#fff", fontSize: fontSize(16), fontWeight: "bold" },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isDarkMode ? "#2c2c2c" : "#fff",
    borderWidth: 1,
    borderColor: isDarkMode ? "#444" : "#ddd",
    borderRadius: 8,
    padding: wp(4),
    marginBottom: hp(1.5),
  },
  methodTitle: { fontSize: fontSize(14), fontWeight: "bold", color: isDarkMode ? "#fff" : "#333" },
  methodDescription: { fontSize: fontSize(12), color: isDarkMode ? "#aaa" : "#666" },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    padding: wp(4),
    backgroundColor: isDarkMode ? "#2c2c2c" : "#fff",
    borderWidth: 1,
    borderColor: isDarkMode ? "#444" : "#ddd",
    borderRadius: 8,
    marginBottom: hp(1.5),
  },
  paymentMethodText: { fontSize: fontSize(14), color: isDarkMode ? "#fff" : "#333", marginLeft: 15 },
  itemName: { fontSize: fontSize(14), color: isDarkMode ? "#ddd" : "#333" },
  itemPrice: { fontSize: fontSize(14), fontWeight: "bold", color: isDarkMode ? "#fff" : "#333" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: hp(1) },
  summaryLabel: { fontSize: fontSize(14), color: isDarkMode ? "#aaa" : "#666" },
  summaryValue: { fontSize: fontSize(14), color: isDarkMode ? "#fff" : "#333" },
  totalLabel: { fontSize: fontSize(16), fontWeight: "bold", color: isDarkMode ? "#fff" : "#333" },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  radioSelected: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#007bff" },
  note: { fontSize: fontSize(12), color: "#666", marginTop: -10, marginBottom: 15 },
});

export default OnlineMedicinePurchase;