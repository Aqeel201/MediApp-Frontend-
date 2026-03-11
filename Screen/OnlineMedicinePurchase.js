import React, { useContext, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Animated,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Bell, ArrowLeft, Plus, Minus, Trash, ShoppingCart, CreditCard, CheckCircle } from 'lucide-react-native';
import { wp, hp, fontSize } from "./responsive";
import { CartContext } from "./CartContext";
import { useTheme } from "./ThemeContext";
import Footer from "./Footer";

const ProductCartScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { userId, cartItems, removeFromCart, updateQuantity } = useContext(CartContext);

  // Animated value for the progress line between Cart and Checkout
  const progressAnim = useRef(new Animated.Value(0)).current;

  // When this screen regains focus, animate the progress line to unfill (0)
  useFocusEffect(
    React.useCallback(() => {
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }, [])
  );

  const handleQuantityChange = (id, action) => {
    updateQuantity(id, action);
  };

  const handleRemoveItem = (id) => {
    Alert.alert("Remove Item", "Are you sure you want to remove this item?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", onPress: () => removeFromCart(id) },
    ]);
  };

  const calculateSubtotal = () =>
    cartItems.reduce((total, item) => total + item.price * item.cartQuantity, 0);

  const calculateTotal = () => calculateSubtotal();

  const handleCheckout = async () => {
    if (!userId) {
      Alert.alert("Error", "Please login to proceed to checkout");
      return;
    }
    // Animate the progress line from 0 to full before proceeding
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(async () => {
      try {
        const response = await fetch("https://dashboard-backend-xrss.vercel.app/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            cart: cartItems,
          }),
        });
        const data = await response.json();
        navigation.navigate("Location", { cartItems });
      } catch (error) {
        Alert.alert("Error", "Failed to process checkout");
      }
    });
  };

  const styles = getStyles(isDarkMode, insets);

  return (
    <View style={styles.safeArea}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
        animated={true}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: (insets.top || 30) + wp(5) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ArrowLeft size={24} color={isDarkMode ? "#fff" : "#007bff"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Bell size={24} color={isDarkMode ? "#fff" : "#007bff"} />
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {/* Step 1: Cart */}
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, styles.activeStep]}>
            <ShoppingCart size={20} color="#fff" />
          </View>
          <Text style={styles.progressTextActive}>Cart</Text>
        </View>
        {/* Animated Progress Line (between Cart and Checkout) */}
        <View style={styles.progressLineContainer}>
          <Animated.View
            style={[
              styles.animatedProgressLine,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, wp(15)],
                }),
              },
            ]}
          />
        </View>
        {/* Step 2: Checkout */}
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, styles.inactiveStep]}>
            <CreditCard size={20} color={isDarkMode ? "#555" : "#ccc"} />
          </View>
          <Text style={styles.progressText}>Checkout</Text>
        </View>
        {/* Static Progress Line (between Checkout and Confirmation) */}
        <View style={styles.progressLine} />
        {/* Step 3: Confirmation */}
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, styles.inactiveStep]}>
            <CheckCircle size={20} color={isDarkMode ? "#555" : "#ccc"} />
          </View>
          <Text style={styles.progressText}>Confirmation</Text>
        </View>
      </View>

      {/* Cart Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ShoppingCart size={wp(20)} color={isDarkMode ? "#333" : "#e0e0e0"} />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate("Medicine")}
            >
              <Text style={styles.browseButtonText}>Browse Medicines</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Cart Items */}
            {cartItems.map((item) => {
              const imageUrl = item.image && item.image.startsWith("http")
                ? item.image
                : `https://dashboard-backend-xrss.vercel.app${item.image}`;

              return (
                <View key={item._id || item.id} style={styles.card}>
                  {/* Product Image */}
                  {item.image ? (
                    <Image source={{ uri: imageUrl }} style={styles.productImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.placeholderText}>No Image</Text>
                    </View>
                  )}

                  {/* Product Info */}
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.name}</Text>
                    {item.dosage ? (
                      <Text style={styles.productDosage}>{item.dosage}</Text>
                    ) : (
                      <Text style={styles.productDosage}>Dosage not specified</Text>
                    )}

                    {/* Price and Quantity */}
                    <View style={styles.priceQuantityContainer}>
                      <Text style={styles.productPrice}>Rs. {item.price}</Text>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleQuantityChange(item._id || item.id, "decrease")}
                        >
                          <Minus size={16} color="#007bff" />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{item.cartQuantity}</Text>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleQuantityChange(item._id || item.id, "increase")}
                        >
                          <Plus size={16} color="#007bff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Remove Button */}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(item._id || item.id)}
                  >
                    <Trash size={20} color="#ff4d4f" />
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Order Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>

              {/* List of Items in the Order Summary */}
              {cartItems.map((item) => (
                <View style={styles.orderItemRow} key={item._id || item.id}>
                  <Text style={styles.orderItemName}>{item.name}</Text>
                  <Text style={styles.orderItemQuantity}>x {item.cartQuantity}</Text>
                </View>
              ))}

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>Rs. {calculateSubtotal().toFixed(2)}</Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalValue}>Rs. {calculateTotal().toFixed(2)}</Text>
              </View>
            </View>

            {/* Checkout Button */}
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView >
      <Footer />
    </View >
  );
};

const getStyles = (isDarkMode, insets) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: isDarkMode ? "#121212" : "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? "#333" : "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: isDarkMode ? 0.2 : 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: {
    fontSize: fontSize(20),
    fontWeight: "600",
    color: isDarkMode ? "#fff" : "#1F2937",
    letterSpacing: 0.5,
  },
  iconButton: {
    padding: 8,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: wp(5),
    backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? "#333" : "#E5E7EB",
  },
  progressStep: {
    alignItems: "center",
    flex: 1,
  },
  progressCircle: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  activeStep: {
    backgroundColor: "#007bff",
  },
  inactiveStep: {
    backgroundColor: isDarkMode ? "#2c2c2c" : "#F3F4F6",
    borderWidth: 2,
    borderColor: isDarkMode ? "#444" : "#E5E7EB",
  },
  progressTextActive: {
    fontSize: fontSize(12),
    fontWeight: "500",
    color: "#007bff",
  },
  progressText: {
    fontSize: fontSize(12),
    color: isDarkMode ? "#888" : "#9CA3AF",
  },
  progressLineContainer: {
    width: wp(15),
    height: 2,
    backgroundColor: isDarkMode ? "#333" : "#E5E7EB",
    marginHorizontal: 4,
  },
  animatedProgressLine: {
    height: 2,
    backgroundColor: "#007bff",
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: isDarkMode ? "#333" : "#E5E7EB",
    marginHorizontal: 4,
  },
  scrollContainer: {
    padding: wp(4.5),
    paddingBottom: hp(18) + insets.bottom,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    color: isDarkMode ? "#aaa" : "#6B7280",
    marginTop: 20,
    fontWeight: "500",
  },
  browseButton: {
    marginTop: 16,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  browseButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  card: {
    backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: isDarkMode ? 0.2 : 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  productImage: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(2),
    marginRight: 16,
  },
  imagePlaceholder: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(2),
    backgroundColor: isDarkMode ? "#2c2c2c" : "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  placeholderText: {
    color: isDarkMode ? "#888" : "#9CA3AF",
    fontSize: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: isDarkMode ? "#fff" : "#1F2937",
    marginBottom: 4,
  },
  productDosage: {
    fontSize: 14,
    color: isDarkMode ? "#aaa" : "#6B7280",
    marginBottom: 8,
  },
  priceQuantityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007bff",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isDarkMode ? "#2c2c2c" : "#F3F4F6",
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: isDarkMode ? "#3d3d3d" : "#E5E7EB",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "500",
    color: isDarkMode ? "#fff" : "#1F2937",
    marginHorizontal: 12,
  },
  removeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 4,
  },
  summaryCard: {
    backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: isDarkMode ? 0.2 : 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: isDarkMode ? "#fff" : "#1F2937",
    marginBottom: 16,
  },
  orderItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 16,
    color: isDarkMode ? "#ddd" : "#1F2937",
  },
  orderItemQuantity: {
    fontSize: 16,
    color: isDarkMode ? "#fff" : "#1F2937",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: isDarkMode ? "#333" : "#E5E7EB",
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: isDarkMode ? "#aaa" : "#6B7280",
  },
  summaryValue: {
    fontSize: 16,
    color: isDarkMode ? "#fff" : "#1F2937",
    fontWeight: "500",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: isDarkMode ? "#fff" : "#1F2937",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#007bff",
  },
  checkoutButton: {
    backgroundColor: "#007bff",
    borderRadius: 12,
    padding: 18,
    marginTop: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 30,
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.5,
  },
});


export default ProductCartScreen;
