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
  ScrollView,
  Animated,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowLeft,
  faBell,
  faShoppingCart,
  faCreditCard,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { CartContext } from "./CartContext";

const OnlineMedicinePurchase = () => {
  const navigation = useNavigation();
  const cartContext = useContext(CartContext);

  if (!cartContext) {
    console.warn("CartContext is not provided");
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>
          CartContext is not available. Please ensure it’s provided in the component tree.
        </Text>
      </SafeAreaView>
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.header}>
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
            style={[styles.input, { backgroundColor: "#e9ecef" }]}
            placeholder="Email Address *"
            value={formData.email}
            editable={false}
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
          <TextInput
            style={styles.input}
            placeholder="Street Address *"
            value={formData.streetAddress}
            onChangeText={(text) => handleInputChange("streetAddress", text)}
          />
          <View style={styles.disabledField}>
            <Text style={styles.disabledText}>Pakistan</Text>
          </View>
          <View style={styles.disabledField}>
            <Text style={styles.disabledText}>Skardu</Text>
          </View>
          <View style={styles.disabledField}>
            <Text style={styles.disabledText}>Skardu</Text>
          </View>
          <Text style={styles.note}>
            Currently <Text style={styles.bold}>Mediapp</Text> is only available in the Skardu region.
          </Text>
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
              <Text style={styles.disabledText}>Skardu</Text>
            </View>
            <View style={styles.disabledField}>
              <Text style={styles.disabledText}>Skardu</Text>
            </View>
            <Text style={styles.note}>
              Currently <Text style={styles.bold}>Mediapp</Text> is only available in the Skardu region.
            </Text>
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
        <TouchableOpacity style={styles.placeOrderButton} onPress={handleSubmit}>
          <Text style={styles.placeOrderText}>Place Order</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  errorText: { fontSize: 16, color: "red", textAlign: "center", marginTop: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: { fontSize: 22, fontWeight: "600", color: "#1F2937", letterSpacing: 0.5 },
  iconButton: { padding: 8 },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  progressStep: { alignItems: "center", flex: 1 },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  activeStep: { backgroundColor: "#007bff" },
  inactiveStep: { backgroundColor: "#F3F4F6", borderWidth: 2, borderColor: "#E5E7EB" },
  progressTextActive: { fontSize: 14, fontWeight: "500", color: "#007bff" },
  progressText: { fontSize: 14, color: "#9CA3AF" },
  progressLineContainer: { width: 60, height: 2, backgroundColor: "#E5E7EB", marginHorizontal: 4 },
  animatedProgressLine: { height: 2, backgroundColor: "#007bff" },
  container: { padding: 20 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 15 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  halfInput: { width: "48%" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
    color: "#333",
  },
  disabledField: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  disabledText: { color: "#666", fontSize: 14 },
  note: { fontSize: 12, color: "#666", marginTop: -10, marginBottom: 15 },
  bold: { fontWeight: "bold" },
  checkboxContainer: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#007bff",
    borderRadius: 4,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxInner: { width: 12, height: 12, backgroundColor: "#007bff", borderRadius: 2 },
  checkboxLabel: { color: "#333", fontSize: 14 },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
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
  methodDetails: { flex: 1 },
  methodTitle: { fontSize: 14, fontWeight: "bold", color: "#333", marginBottom: 5 },
  methodDescription: { fontSize: 12, color: "#666", marginBottom: 3 },
  methodPrice: { fontSize: 14, color: "#007bff", fontWeight: "bold" },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
  },
  paymentMethodText: { fontSize: 14, color: "#333", marginLeft: 15 },
  summaryText: { fontSize: 14, color: "#666", marginBottom: 15 },
  itemContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  itemName: { fontSize: 14, color: "#333" },
  itemPrice: { fontSize: 14, fontWeight: "bold", color: "#333" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: "#666" },
  summaryValue: { fontSize: 14, color: "#333" },
  totalRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#eee" },
  totalLabel: { fontSize: 16, fontWeight: "bold", color: "#333" },
  totalValue: { fontSize: 16, fontWeight: "bold", color: "#007bff" },
  placeOrderButton: {
    backgroundColor: "#007bff",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginVertical: 10,
  },
  placeOrderText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default OnlineMedicinePurchase;