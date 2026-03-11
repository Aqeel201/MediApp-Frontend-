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
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from 'expo-location';
import { wp, hp, fontSize } from "./responsive";
import { MapPin, Bell, ArrowLeft, ShoppingCart, CreditCard, CheckCircle } from 'lucide-react-native';
import { CartContext } from "./CartContext";
import { useTheme } from './ThemeContext';
import PremiumModal from "./PremiumModal";

const LocationScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const cartContext = useContext(CartContext);

  if (!cartContext) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>CartContext is not available.</Text>
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
    shippingMethod: 1,
    paymentMethod: 1,
    billingFirstName: "",
    billingLastName: "",
    billingStreetAddress: "",
    billingPhoneNumber: "",
    location: null,
    city: "",
    region: "",
    country: "Pakistan"
  });

  const [modal, setModal] = useState({ visible: false, title: '', message: '', type: 'info' });
  const [isDetecting, setIsDetecting] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);

  const progressLine1Anim = useRef(new Animated.Value(1)).current;
  const progressLine2Anim = useRef(new Animated.Value(0)).current;

  const shippingMethods = [
    { id: 1, title: "Standard Delivery", description: "6-8 Hours Delivery", price: "Rs.200.00" },
    { id: 2, title: "Fast Delivery", description: "1-2 Hours Delivery", price: "Rs.300.00" },
  ];
  const paymentMethods = [
    { id: 1, name: "Cash On Delivery" },
    { id: 2, name: "EasyPaisa" },
    { id: 3, name: "Credit/Debit Card (Stripe)" },
  ];

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

    // No auto-detect on mount
  }, []);

  const detectLocation = async () => {
    setIsDetecting(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission denied", "We need location permission to help you fill your address.");
        setIsDetecting(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (location && location.coords) {
        const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
        setFormData(prev => ({ ...prev, location: coords }));

        let address = await Location.reverseGeocodeAsync(coords);
        if (address && address.length > 0) {
          const { street, city, region, country } = address[0];

          const displayCity = city || region || "";
          const displayRegion = (region && region !== city) ? region : "";

          setFormData(prev => ({
            ...prev,
            streetAddress: prev.streetAddress || street || "",
            city: displayCity,
            country: country || "Pakistan",
            region: displayRegion
          }));
        }
      }
    } catch (error) {
      console.error("Location error:", error);
    } finally {
      setIsDetecting(false);
    }
  };

  const applyLocation = async (coords) => {
    if (!coords) return;
    setFormData(prev => ({ ...prev, location: coords }));
    try {
      const address = await Location.reverseGeocodeAsync(coords);
      if (address && address.length > 0) {
        const { street, city, region, country } = address[0];
        const displayCity = city || region || "";
        const displayRegion = (region && region !== city) ? region : "";
        setFormData(prev => ({
          ...prev,
          streetAddress: prev.streetAddress || street || "",
          city: displayCity,
          region: displayRegion,
          country: country || "Pakistan",
        }));
      }
    } catch (err) {
      console.warn("Reverse geocode failed:", err?.message || err);
    }
  };

  const leafletHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        html, body, #map { height: 100%; margin: 0; }
        .hint {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.85);
          color: #fff;
          padding: 6px 12px;
          border-radius: 999px;
          font-family: Arial, sans-serif;
          font-size: 12px;
          z-index: 1000;
        }
      </style>
    </head>
    <body>
      <div class="hint">Tap map to set location</div>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        var map = L.map('map').setView([30.3753, 69.3451], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
        var marker;
        function setMarker(lat, lng) {
          if (marker) { map.removeLayer(marker); }
          marker = L.marker([lat, lng]).addTo(map);
        }
        map.on('click', function(e) {
          var lat = e.latlng.lat;
          var lng = e.latlng.lng;
          setMarker(lat, lng);
          window.ReactNativeWebView.postMessage(JSON.stringify({ lat: lat, lng: lng }));
        });
      </script>
    </body>
  </html>
  `;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validatePhoneNumber = (number) => /^03\d{9}$/.test(number);
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const calculateSubtotal = () =>
    cartItems.reduce((total, item) => total + (item.price * (item.cartQuantity || 1)), 0);

  const shippingFee = formData.shippingMethod === 1 ? 200 : formData.shippingMethod === 2 ? 300 : 0;
  const orderTotal = calculateSubtotal() + shippingFee;

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSubmit = async () => {
    if (!cartItems.length) {
      setModal({
        visible: true,
        title: "Cart is Empty",
        message: "Please add some medicines to your cart before proceeding to checkout.",
        type: "error"
      });
      return;
    }
    const requiredFields = [
      "email",
      "shippingEmail",
      "firstName",
      "lastName",
      "streetAddress",
      "phoneNumber",
    ];
    if (requiredFields.some((field) => !formData[field])) {
      setModal({
        visible: true,
        title: "Information Required",
        message: "Please ensure all shipping fields are filled correctly.",
        type: "info"
      });
      return;
    }

    const shippingAddress = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      streetAddress: formData.streetAddress,
      phoneNumber: formData.phoneNumber,
      city: formData.city,
      region: formData.region,
      country: formData.country,
    };

    const orderData = {
      userId: formData.email,
      shippingEmail: formData.shippingEmail,
      billingEmail: formData.sameAsBilling ? formData.shippingEmail : formData.billingEmail,
      shippingAddress,
      billingAddress: formData.sameAsBilling ? shippingAddress : {
        firstName: formData.billingFirstName,
        lastName: formData.billingLastName,
        streetAddress: formData.billingStreetAddress,
        phoneNumber: formData.billingPhoneNumber,
      },
      shippingMethod: formData.shippingMethod,
      paymentMethod: formData.paymentMethod === 1 ? "COD" : formData.paymentMethod === 2 ? "EasyPaisa" : "Stripe",
      cartItems,
      shippingFee,
      orderTotal,
      location: formData.location || null,
    };

    if (formData.paymentMethod === 2) {
      // Navigate to Payment Screen for EasyPaisa
      navigation.navigate("JazzCashPayment", {
        orderData,
        paymentType: "EasyPaisa"
      });
      return;
    }

    if (formData.paymentMethod === 3) {
      // Navigate to Stripe Payment Screen
      navigation.navigate("StripePaymentScreen", {
        orderData
      });
      return;
    }

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
      setModal({
        visible: true,
        title: "Order Failed",
        message: error.message || "Something went wrong while placing your order. Please try again.",
        type: "error"
      });
    }
  };

  const styles = getStyles(isDarkMode, insets);

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <View style={[styles.header, { paddingTop: (insets.top || 50) + 10 }]}>
        <TouchableOpacity onPress={handleBackPress} style={styles.iconButton}>
          <ArrowLeft size={24} color={isDarkMode ? "#fff" : "#007bff"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Bell size={24} color={isDarkMode ? "#fff" : "#007bff"} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDarkMode ? "#333" : "#f1f1f1" }]}
            placeholder="Email Address *"
            value={formData.email}
            editable={false}
            placeholderTextColor={isDarkMode ? "#888" : "#999"}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Location</Text>
          <View style={styles.locationRow}>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={() => setMapVisible(true)}
            >
              <MapPin size={18} color="#fff" />
              <Text style={styles.locationButtonText}>SET LOCATION ON MAP</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.gpsButton, { opacity: isDetecting ? 0.7 : 1 }]}
              onPress={detectLocation}
              disabled={isDetecting}
            >
              {isDetecting ? (
                <ActivityIndicator color="#2563eb" size="small" />
              ) : (
                <Text style={styles.gpsButtonText}>Use GPS</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.note}>
            {formData.location
              ? `Selected: ${formData.location.latitude.toFixed(4)}, ${formData.location.longitude.toFixed(4)}`
              : "No location selected yet."}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Shipping Email *"
            placeholderTextColor={isDarkMode ? "#aaa" : "#555"}
            value={formData.shippingEmail}
            onChangeText={(text) => handleInputChange("shippingEmail", text)}
            keyboardType="email-address"
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="First Name *"
              placeholderTextColor={isDarkMode ? "#aaa" : "#555"}
              value={formData.firstName}
              onChangeText={(text) => handleInputChange("firstName", text)}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Last Name *"
              placeholderTextColor={isDarkMode ? "#aaa" : "#555"}
              value={formData.lastName}
              onChangeText={(text) => handleInputChange("lastName", text)}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Street Address *"
            placeholderTextColor={isDarkMode ? "#aaa" : "#555"}
            value={formData.streetAddress}
            onChangeText={(text) => handleInputChange("streetAddress", text)}
          />
          <View style={styles.row}>
            <View style={[styles.disabledField, styles.halfInput]}>
              <Text style={styles.disabledText}>{formData.city || "City"}</Text>
            </View>
            <View style={[styles.disabledField, styles.halfInput]}>
              <Text style={styles.disabledText}>{formData.region || "Region"}</Text>
            </View>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Phone Number *"
            placeholderTextColor={isDarkMode ? "#aaa" : "#555"}
            value={formData.phoneNumber}
            onChangeText={(text) => handleInputChange("phoneNumber", text)}
            keyboardType="phone-pad"
            maxLength={11}
          />
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => handleInputChange("sameAsBilling", !formData.sameAsBilling)}
          >
            <View style={[styles.checkbox, { borderColor: isDarkMode ? '#007bff' : '#ccc' }]}>
              {formData.sameAsBilling && <View style={styles.checkboxInner} />}
            </View>
            <Text style={[styles.checkboxLabel, { color: isDarkMode ? '#ddd' : '#666' }]}>Billing address is same as shipping</Text>
          </TouchableOpacity>
        </View>

        {!formData.sameAsBilling && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Billing Address</Text>
            {/* Simplified billing for brevity */}
            <TextInput
              style={styles.input}
              placeholder="Billing Street Address *"
              placeholderTextColor={isDarkMode ? "#aaa" : "#555"}
              value={formData.billingStreetAddress}
              onChangeText={(text) => handleInputChange("billingStreetAddress", text)}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Method</Text>
          {shippingMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.methodCard, formData.shippingMethod === method.id && styles.activeMethod]}
              onPress={() => handleInputChange("shippingMethod", method.id)}
            >
              <View style={styles.radioButton}>
                {formData.shippingMethod === method.id && <View style={styles.radioSelected} />}
              </View>
              <View>
                <Text style={styles.methodTitle}>{method.title}</Text>
                <Text style={styles.methodDescription}>{method.description} - {method.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.methodCard, formData.paymentMethod === method.id && styles.activeMethod]}
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
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>Rs. {calculateSubtotal()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>Rs. {shippingFee}</Text>
          </View>
          <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 10 }]}>
            <Text style={[styles.summaryLabel, { fontWeight: 'bold', color: isDarkMode ? '#fff' : '#000' }]}>Total</Text>
            <Text style={[styles.summaryValue, { fontWeight: 'bold', color: '#007bff' }]}>Rs. {orderTotal}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.placeOrderButton} onPress={handleSubmit}>
          <Text style={styles.placeOrderText}>PLACE ORDER</Text>
        </TouchableOpacity>
      </ScrollView>

      <PremiumModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={() => setModal({ ...modal, visible: false })}
      />

      <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}>
        <View style={styles.mapHeader}>
          <TouchableOpacity onPress={() => setMapVisible(false)}>
            <Text style={styles.mapHeaderBtn}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.mapHeaderTitle}>Select Location</Text>
          <TouchableOpacity
            onPress={async () => {
              await applyLocation(selectedCoords);
              setMapVisible(false);
            }}
            disabled={!selectedCoords}
          >
            <Text style={[styles.mapHeaderBtn, !selectedCoords && { opacity: 0.5 }]}>Use</Text>
          </TouchableOpacity>
        </View>
        <WebView
          source={{ html: leafletHtml }}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              setSelectedCoords({ latitude: data.lat, longitude: data.lng });
            } catch (e) {}
          }}
        />
      </Modal>
    </View>
  );
};

const getStyles = (isDarkMode, insets) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: isDarkMode ? "#121212" : "#f8f9fa" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp(5),
    backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? "#333" : "#eee",
  },
  headerTitle: { fontSize: fontSize(20), fontWeight: "bold", color: isDarkMode ? "#fff" : "#000" },
  iconButton: { padding: 5 },
  container: { padding: wp(4), paddingBottom: 50 },
  section: {
    backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 15, color: isDarkMode ? "#fff" : "#333" },
  input: {
    backgroundColor: isDarkMode ? "#2c2c2c" : "#fff",
    borderWidth: 1,
    borderColor: isDarkMode ? "#444" : "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    color: isDarkMode ? "#fff" : "#000",
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  halfInput: { width: "48%" },
  disabledField: {
    backgroundColor: isDarkMode ? "#2c2c2c" : "#f5f5f5",
    borderWidth: 1,
    borderColor: isDarkMode ? "#444" : "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    justifyContent: "center",
  },
  disabledText: { color: isDarkMode ? "#aaa" : "#666" },
  locationButton: {
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 12,
    gap: 8,
    marginBottom: 10,
    flex: 1,
    marginRight: 8,
  },
  locationButtonText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  locationRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  gpsButton: {
    borderWidth: 1,
    borderColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  gpsButtonText: { color: "#2563eb", fontWeight: "700", fontSize: 12 },
  note: { fontSize: 11, color: "#888", textAlign: 'center' },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  mapHeaderTitle: { fontWeight: "700", fontSize: 14 },
  mapHeaderBtn: { color: "#2563eb", fontWeight: "700", fontSize: 13 },
  checkboxContainer: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderRadius: 6, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxInner: { width: 12, height: 12, backgroundColor: '#007bff', borderRadius: 3 },
  checkboxLabel: { fontSize: 14 },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    marginBottom: 10,
  },
  activeMethod: { borderColor: "#007bff", backgroundColor: "rgba(0,123,255,0.05)" },
  methodTitle: { fontWeight: "bold", color: isDarkMode ? "#fff" : "#000" },
  methodDescription: { fontSize: 12, color: "#666" },
  paymentMethodText: { marginLeft: 10, fontWeight: "600", color: isDarkMode ? "#fff" : "#000" },
  radioButton: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#007bff", marginRight: 15, justifyContent: "center", alignItems: "center" },
  radioSelected: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#007bff" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  summaryLabel: { color: "#666" },
  summaryValue: { fontWeight: "500", color: isDarkMode ? "#fff" : "#000" },
  placeOrderButton: {
    backgroundColor: "#10b981",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
  },
  placeOrderText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

export default LocationScreen;
