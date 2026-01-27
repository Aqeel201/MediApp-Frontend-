import React, { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  Animated,
  Modal,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import Header from "./Header"; // Adjust path as needed

const DepositScreen = () => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const route = useRoute();
  const { orderData } = route.params || {};
  const cartItems = orderData?.cartItems || [];
  const depositAmount =
    orderData && typeof orderData.orderTotal === "number"
      ? orderData.orderTotal.toFixed(2)
      : "0.00";
  const shippingFee =
    orderData && typeof orderData.shippingFee === "number" && orderData.shippingFee > 0
      ? orderData.shippingFee.toFixed(2)
      : orderData && orderData.orderTotal && typeof orderData.orderTotal === "number" && cartItems.length > 0
        ? (orderData.orderTotal - cartItems.reduce((total, item) => total + (item.price * (item.cartQuantity || item.quantity)), 0)).toFixed(2)
        : "0.00";
  const shippingMethod =
    orderData && orderData.shippingMethod && typeof orderData.shippingMethod === "string"
      ? orderData.shippingMethod.toLowerCase() === "fast"
        ? "Fast Delivery"
        : orderData.shippingMethod.toLowerCase() === "standard"
          ? "Standard Delivery"
          : orderData.shippingMethod
      : "";
  const subtotal =
    orderData && typeof orderData.orderTotal === "number" && typeof orderData.shippingFee === "number"
      ? (orderData.orderTotal - orderData.shippingFee).toFixed(2)
      : cartItems.reduce((total, item) => total + (item.price * (item.cartQuantity || item.quantity)), 0).toFixed(2);

  // Payment form state
  const [walletNumber, setWalletNumber] = useState("");
  const [walletName, setWalletName] = useState("");
  const [transactionID, setTransactionID] = useState("");
  const [submittedTransaction, setSubmittedTransaction] = useState(null);
  const [transactionTime, setTransactionTime] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userId, setUserId] = useState("");
  const [timeLeft, setTimeLeft] = useState("");

  // Fetch user data from AsyncStorage to get userId (using email as identifier)
  useEffect(() => {
    AsyncStorage.getItem("user").then((userData) => {
      if (userData) {
        const user = JSON.parse(userData);
        if (user.email) {
          setUserId(user.email);
        }
      }
    });
  }, []);

  // Animated crossfade logos for pending overlay.
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  // Timer for pending transaction overlay.
  useEffect(() => {
    let timer;
    if (submittedTransaction && submittedTransaction.status === "Pending") {
      timer = setInterval(() => {
        const createdTime = new Date(submittedTransaction.createdAt);
        const now = new Date();
        const diff = 20 * 60 * 1000 - (now - createdTime);
        if (diff > 0) {
          const minutes = Math.floor(diff / (60 * 1000));
          const seconds = Math.floor((diff % (60 * 1000)) / 1000);
          setTimeLeft(`${minutes}m ${seconds}s remaining`);
        } else {
          setTimeLeft("Expired");
          clearInterval(timer);
        }
      }, 1000);
    } else {
      setTimeLeft("");
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [submittedTransaction]);

  // Submit the transaction to the backend.
  const onConfirm = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 250) {
      Alert.alert("Invalid Amount", "Minimum deposit amount is 250 PKR");
      return;
    }
    try {
      // Ensure orderData includes an orderId for linking the transaction to an order.
      const response = await axios.post("https://dashboard-backend-xrss.vercel.app/api/transactions", {
        userId,
        walletNumber,
        walletName,
        transactionID,
        depositAmount,
        orderData, // orderData must include orderId
      });
      console.log("Transaction submitted:", response.data);
      Alert.alert("Success", "Transaction submitted successfully!");
      setTransactionTime(new Date());
      setSubmittedTransaction(response.data);
      setWalletNumber("");
      setWalletName("");
      setTransactionID("");
      setShowConfirmModal(false);
    } catch (error) {
      console.error("Error submitting transaction:", error);
      Alert.alert("Error", "Error submitting transaction");
    }
  };

  // Poll the backend every second for updated transaction status.
  useEffect(() => {
    let interval;
    if (submittedTransaction) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get("https://dashboard-backend-xrss.vercel.app/api/transactions", {
            params: { userId },
          });
          const updatedTxn = res.data.find(
            (txn) => txn._id === submittedTransaction._id
          );
          if (updatedTxn && updatedTxn.status !== submittedTransaction.status) {
            setSubmittedTransaction(updatedTxn);
          }
        } catch (error) {
          console.error("Error polling transaction:", error);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [submittedTransaction, userId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Container */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/easypaisa_logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.separator}>|</Text>
          <Image
            source={require("../assets/LogoBGR.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>MediApp Payment Method</Text>
          <Text style={styles.instructionText}>
            You are purchasing the following products:
          </Text>

          {/* Purchasing Items Box */}
          <View style={styles.productDetailsBox}>
            {cartItems.map((item) => (
              <View key={item._id || item.id} style={styles.productItem}>
                <Text style={styles.productName}>
                  {item.name} x {item.cartQuantity || item.quantity}
                </Text>
                <Text style={styles.productPrice}>
                  {(item.price * (item.cartQuantity || item.quantity)).toLocaleString()} RS
                </Text>
              </View>
            ))}
          </View>

          {/* Subtotal and Shipping Fee with Shipping Method */}
          <View style={styles.shippingFeeContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.shippingFeeLabel}>Subtotal:</Text>
              <Text style={styles.shippingFeeValue}>
                {parseFloat(subtotal).toLocaleString()} RS
              </Text>
            </View>
            <Text style={styles.divider}>........................................</Text>
            <View style={styles.shippingFeeRow}>
              <Text style={styles.shippingFeeLabel}>Shipping Fee:</Text>
              <Text style={styles.shippingFeeValue}>
                {parseFloat(shippingFee).toLocaleString()} RS
                {shippingMethod ? ` (${shippingMethod})` : ""}
              </Text>
            </View>
          </View>

          {/* Total Amount Box */}
          <View style={styles.totalAmountBox}>
            <Text style={styles.totalAmountLabel}>Total Amount:</Text>
            <Text style={styles.totalAmountText}>
              {parseFloat(depositAmount).toLocaleString()} RS
            </Text>
          </View>

          {/* Note */}
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              Please pay exactly the amount shown above to the EasyPaisa account.
              Do not pay less or more, or your transaction will not be accepted.
            </Text>
          </View>

          <Text style={styles.instructionText}>
            Then, please enter your wallet number, wallet name, and transaction ID below:
          </Text>

          {/* Payment Details Card */}
          <View style={styles.detailCard}>
            <Text style={styles.detailText}>
              ایزی پیسہ والیٹ کا نام / Easypaisa Account Name:{" "}
              <Text style={styles.boldText}>Shakeel Ahmad</Text>
            </Text>
            <Text style={styles.detailText}>
              ایزی پیسہ کا والٹ نمبر / EasyPaisa Wallet Number:{" "}
              <Text style={styles.boldText}>03499535156</Text>
            </Text>
          </View>

          {/* Form Inputs */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>:ایزی پیسہ والیٹ نمبر / EasyPaisa Wallet Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter wallet number"
              keyboardType="numeric"
              maxLength={11}
              value={walletNumber}
              onChangeText={setWalletNumber}
            />
            <Text style={styles.inputLabel}>:ایزی پیسہ والیٹ کا نام / EasyPaisa Wallet Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter wallet name"
              value={walletName}
              onChangeText={setWalletName}
            />
            <Text style={styles.inputLabel}>Transaction ID (UTR, Reference No):</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter Transaction ID"
              value={transactionID}
              onChangeText={setTransactionID}
            />
          </View>

          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ It is forbidden to send money via Jazzcash or Bank Transfer to the EasyPaisa account.
              If conditions aren't met, the company isn't responsible for your funds.
            </Text>
            <Text style={styles.warningText}>
              ⚠️ ایزی پیسہ اکاؤنٹ میں جیز کیش یا بینک ٹرانسفر کے ذریعے رقم بھیجنا منع ہے، اگر شرائط پوری نہیں ہوتیں، تو کمپنی آپ کے فنڈز کے لیے ذمہ دار نہیں ہے۔
            </Text>
          </View>

          {/* Confirm Payment Button */}
          <TouchableOpacity style={styles.confirmButton} onPress={() => setShowConfirmModal(true)}>
            <Text style={styles.confirmText}>Confirm Payment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showConfirmModal}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.acceptedOverlayContent}>
            <Text style={styles.overlayTitle}>Confirm Your Payment</Text>
            <ScrollView>
              <Text style={styles.detailText}>
                <Text style={styles.boldText}>Payment Amount: </Text>
                {parseFloat(depositAmount).toLocaleString()} RS
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.boldText}>Wallet Number: </Text>
                {walletNumber || "Not provided"}
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.boldText}>Wallet Name: </Text>
                {walletName || "Not provided"}
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.boldText}>Transaction ID: </Text>
                {transactionID || "Not provided"}
              </Text>
              <Text style={[styles.noteText, { marginTop: 20 }]}>
                You are confirming your payment. Please check your details carefully; any incorrect data may result in money loss and the company is not responsible.
              </Text>
            </ScrollView>
            <View style={{ flexDirection: "row", marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: "#dc3545", marginRight: 10 }]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.confirmText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                <Text style={styles.confirmText}>Confirm Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pending Transaction Overlay with Timer */}
      {submittedTransaction && submittedTransaction.status === "Pending" && (
        <View style={styles.overlay}>
          <View style={styles.acceptedOverlayContent}>
            <View style={styles.logoAnimationContainer}>
              <Animated.Image
                source={require("../assets/LogoBGR.png")}
                style={[styles.logoAnimation, { opacity: fadeAnim }]}
                resizeMode="contain"
              />
              <Animated.Image
                source={require("../assets/easypaisa_logo.png")}
                style={[
                  styles.logoAnimation,
                  {
                    opacity: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    }),
                  },
                ]}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.overlayTitle}>Transaction Pending</Text>
            <Text style={styles.overlayMessage}>
              Your transaction is processing. It will be completed within 10–20 minutes.
            </Text>
            {timeLeft !== "" && (
              <Text style={styles.timerText}>Time Remaining: {timeLeft}</Text>
            )}
          </View>
        </View>
      )}

      {/* Accepted Transaction Overlay */}
      {submittedTransaction && submittedTransaction.status === "Accepted" && (
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.acceptedOverlayContentScroll}>
            <View style={styles.acceptedOverlayContent}>
              <View style={styles.logoContainerOverlay}>
                <Image
                  source={require("../assets/easypaisa_logo.png")}
                  style={styles.logoOverlay}
                  resizeMode="contain"
                />
                <Text style={styles.separatorOverlay}>|</Text>
                <Image
                  source={require("../assets/LogoBGR.png")}
                  style={styles.logoOverlay}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.successIconContainer}>
                <Text style={styles.successIcon}>✅</Text>
              </View>
              <Text style={styles.overlayTitle}>Transaction Successful!</Text>
              <Text style={styles.overlayMessage}>
                Your transaction has been successfully completed.
              </Text>
              <Text style={styles.purchaseTitle}>Purchased Products:</Text>
              <View style={styles.productDetailsBox}>
                {cartItems.map((item) => (
                  <View key={item._id || item.id} style={styles.productItem}>
                    <Text style={styles.productName}>
                      {item.name} x {item.cartQuantity || item.quantity}
                    </Text>
                    <Text style={styles.productPrice}>
                      {(item.price * (item.cartQuantity || item.quantity)).toLocaleString()} RS
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.slip}>
                <Text style={styles.slipTitle}>Payment Slip</Text>
                <Text style={styles.slipText}>Amount: {submittedTransaction.depositAmount} PKR</Text>
                <Text style={styles.slipText}>Wallet Number: {submittedTransaction.walletNumber}</Text>
                <Text style={styles.slipText}>Wallet Name: {submittedTransaction.walletName}</Text>
                <Text style={styles.slipText}>Transaction ID: {submittedTransaction.transactionID}</Text>
                {transactionTime && (
                  <>
                    <Text style={styles.slipText}>
                      Date: {transactionTime.toLocaleDateString()}
                    </Text>
                    <Text style={styles.slipText}>
                      Time: {transactionTime.toLocaleTimeString()}
                    </Text>
                  </>
                )}
              </View>
              <Text style={styles.additionalNote}>
                Your product(s) will arrive at your destination within 1-2 hours. Please wait for that.
              </Text>
              <TouchableOpacity style={styles.returnButton} onPress={() => navigation.navigate("Home")}>
                <Text style={styles.returnButtonText}>Return to Home</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Rejected Transaction Overlay */}
      {submittedTransaction && submittedTransaction.status === "Rejected" && (
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.acceptedOverlayContentScroll}>
            <View style={styles.acceptedOverlayContent}>
              <View style={styles.failedIconContainer}>
                <Text style={styles.failedIcon}>❌</Text>
              </View>
              <Text style={styles.overlayTitle}>Transaction Rejected</Text>
              <Text style={styles.overlayMessage}>
                Your transaction has been rejected—likely due to incomplete or incorrect information.
                Please check your details.
              </Text>
              <TouchableOpacity style={styles.returnButton} onPress={() => navigation.navigate("HelpAndSupport")}>
                <Text style={styles.returnButtonText}>Contact Us</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContent: { paddingTop: 70, paddingBottom: 30 },
  contentContainer: { paddingHorizontal: 20 },
  logoContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 25 },
  logo: { width: 120, height: 120 },
  separator: { fontSize: 28, color: "#007bff", marginHorizontal: 10, fontWeight: "200" },
  title: { fontSize: 22, fontWeight: "700", color: "#007bff", textAlign: "center", marginBottom: 15 },
  instructionText: { fontSize: 15, color: "#6c757d", textAlign: "center", lineHeight: 22, marginBottom: 15 },
  productDetailsBox: { borderWidth: 1, borderColor: "#007bff", borderRadius: 8, padding: 8, marginBottom: 15, backgroundColor: "#f8f9fa" },
  productItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: "#e9ecef" },
  productName: { fontSize: 14, color: "#495057" },
  productPrice: { fontSize: 14, color: "#495057", fontWeight: "bold" },
  shippingFeeContainer: { marginBottom: 15, alignItems: "center" },
  divider: { fontSize: 18, color: "#007bff", marginVertical: 5 },
  shippingFeeRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", paddingHorizontal: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", paddingHorizontal: 10 },
  shippingFeeLabel: { fontSize: 16, color: "#495057" },
  shippingFeeValue: { fontSize: 16, color: "#495057", fontWeight: "bold" },
  totalAmountBox: { backgroundColor: "#007bff", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 8, marginBottom: 15, alignItems: "center" },
  totalAmountLabel: { fontSize: 14, color: "#ffffff", marginBottom: 3 },
  totalAmountText: { fontSize: 20, fontWeight: "700", color: "#ffffff" },
  noteBox: { borderWidth: 1, borderColor: "#dc3545", borderRadius: 8, padding: 8, marginBottom: 15, backgroundColor: "#fff5f5" },
  noteText: { fontSize: 12, color: "#dc3545", textAlign: "center", lineHeight: 18 },
  detailCard: { backgroundColor: "#f8f9fa", borderRadius: 12, padding: 12, marginBottom: 15, elevation: 2 },
  detailText: { fontSize: 14, color: "#495057", marginBottom: 5 },
  boldText: { fontWeight: "600", color: "#212529" },
  inputContainer: { marginBottom: 15 },
  inputLabel: { fontSize: 14, color: "#495057", marginBottom: 5, fontWeight: "500" },
  textInput: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#dee2e6", borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 14, color: "#333" },
  warningBox: { backgroundColor: "#fff3cd", borderRadius: 8, padding: 12, marginBottom: 15 },
  warningText: { fontSize: 12, color: "#856404", lineHeight: 16, marginBottom: 5, textAlign: "center" },
  confirmButton: { backgroundColor: "#28a745", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20, alignItems: "center", elevation: 2, marginBottom: 20 },
  confirmText: { fontSize: 16, fontWeight: "600", color: "#ffffff" },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", zIndex: 999 },
  acceptedOverlayContent: { backgroundColor: "#fff", paddingVertical: 20, paddingHorizontal: 15, borderRadius: 12, alignItems: "center", width: "90%", maxHeight: "90%", justifyContent: "center" },
  acceptedOverlayContentScroll: { paddingVertical: 20, paddingHorizontal: 15, alignItems: "center" },
  overlayTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#333", textAlign: "center" },
  overlayMessage: { fontSize: 14, color: "#555", marginBottom: 15, textAlign: "center" },
  timerText: { fontSize: 18, fontWeight: "bold", color: "#007bff", marginTop: 10 },
  contactLink: { color: "#007bff", textDecorationLine: "underline" },
  logoContainerOverlay: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  logoOverlay: { width: 50, height: 50 },
  separatorOverlay: { fontSize: 24, color: "#007bff", marginHorizontal: 5, fontWeight: "200" },
  successIconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: "green", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  successIcon: { fontSize: 30, color: "#fff" },
  failedIconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: "red", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  failedIcon: { fontSize: 30, color: "#fff" },
  slip: { borderWidth: 1, borderColor: "#007bff", padding: 12, borderRadius: 8, backgroundColor: "#f8f9fa", marginVertical: 10, width: "100%", alignItems: "center" },
  slipTitle: { fontSize: 16, fontWeight: "700", color: "#007bff", marginBottom: 8, textAlign: "center" },
  slipText: { fontSize: 14, color: "#495057", marginBottom: 4 },
  purchaseTitle: { fontSize: 16, fontWeight: "700", color: "#007bff", marginTop: 10, textAlign: "center" },
  additionalNote: { fontSize: 14, color: "#555", textAlign: "center", marginVertical: 10 },
  returnButton: { backgroundColor: "#007bff", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20, marginTop: 15 },
  returnButtonText: { fontSize: 16, color: "#ffffff", fontWeight: "600", textAlign: "center" },
  spinner: { width: 60, height: 60, marginBottom: 10 },
  logoAnimationContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  logoAnimation: { width: 80, height: 80, borderRadius: 40, marginHorizontal: 10 },
});

export default DepositScreen;