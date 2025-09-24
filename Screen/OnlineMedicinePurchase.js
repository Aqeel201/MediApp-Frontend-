import React, { useContext, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  Animated,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faBell,
  faArrowLeft,
  faPlus,
  faMinus,
  faTrash,
  faShoppingCart,
  faCreditCard,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { CartContext } from "./CartContext";

const ProductCartScreen = () => {
  const navigation = useNavigation();
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
        const response = await fetch("http://192.168.18.24:2000/api/cart", {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <FontAwesomeIcon icon={faArrowLeft} size={24} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <TouchableOpacity style={styles.iconButton}>
          <FontAwesomeIcon icon={faBell} size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {/* Step 1: Cart */}
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, styles.activeStep]}>
            <FontAwesomeIcon icon={faShoppingCart} size={20} color="#fff" />
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
                  outputRange: [0, 60],
                }),
              },
            ]}
          />
        </View>
        {/* Step 2: Checkout */}
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, styles.inactiveStep]}>
            <FontAwesomeIcon icon={faCreditCard} size={20} color="#ccc" />
          </View>
          <Text style={styles.progressText}>Checkout</Text>
        </View>
        {/* Static Progress Line (between Checkout and Confirmation) */}
        <View style={styles.progressLine} />
        {/* Step 3: Confirmation */}
        <View style={styles.progressStep}>
          <View style={[styles.progressCircle, styles.inactiveStep]}>
            <FontAwesomeIcon icon={faCheckCircle} size={20} color="#ccc" />
          </View>
          <Text style={styles.progressText}>Confirmation</Text>
        </View>
      </View>

      {/* Cart Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesomeIcon icon={faShoppingCart} size={80} color="#e0e0e0" />
            <Text style={styles.emptyText}>Your cart is empty</Text>
          </View>
        ) : (
          <>
            {/* Cart Items */}
            {cartItems.map((item) => {
              const imageUrl = item.image?.startsWith("http")
                ? item.image
                : `http://192.168.18.24:2000${item.image}`;

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
                          <FontAwesomeIcon icon={faMinus} size={16} color="#007bff" />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{item.cartQuantity}</Text>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleQuantityChange(item._id || item.id, "increase")}
                        >
                          <FontAwesomeIcon icon={faPlus} size={16} color="#007bff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Remove Button */}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(item._id || item.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} size={20} color="#ff4d4f" />
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
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
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1F2937",
    letterSpacing: 0.5,
  },
  iconButton: {
    padding: 8,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  progressStep: {
    alignItems: "center",
    flex: 1,
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  activeStep: {
    backgroundColor: "#007bff",
  },
  inactiveStep: {
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  progressTextActive: {
    fontSize: 14,
    fontWeight: "500",
    color: "#007bff",
  },
  progressText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  progressLineContainer: {
    width: 60,
    height: 2,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 4,
  },
  animatedProgressLine: {
    height: 2,
    backgroundColor: "#007bff",
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 4,
  },
  scrollContainer: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    color: "#6B7280",
    marginTop: 20,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  placeholderText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  productDosage: {
    fontSize: 14,
    color: "#6B7280",
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
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    marginHorizontal: 12,
  },
  removeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 4,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  orderItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 16,
    color: "#1F2937",
  },
  orderItemQuantity: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
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