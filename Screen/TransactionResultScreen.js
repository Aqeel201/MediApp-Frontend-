// Screen/TransactionResultScreen.js
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Image,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

const TransactionResult = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Get transaction details from route params
  const { transaction, cartItems, transactionTime } = route.params || {};
  const isAccepted = transaction?.status === "Accepted";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
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

          {isAccepted ? (
            <>
              <View style={styles.successIconContainer}>
                <Text style={styles.successIcon}>✅</Text>
              </View>
              <Text style={styles.overlayTitle}>Transaction Successful!</Text>
              <Text style={styles.overlayMessage}>
                Your transaction has been successfully completed.
              </Text>
            </>
          ) : (
            <>
              <View style={styles.failedIconContainer}>
                <Text style={styles.failedIcon}>❌</Text>
              </View>
              <Text style={styles.overlayTitle}>Transaction Rejected</Text>
              <Text style={styles.overlayMessage}>
                Your transaction has been rejected—likely due to incomplete or incorrect information.
                Please check your details.
              </Text>
            </>
          )}

          {/* Purchased Products (only shown if accepted) */}
          {isAccepted && (
            <>
              <Text style={styles.purchaseTitle}>Purchased Products:</Text>
              <View style={styles.productDetailsBox}>
                {cartItems &&
                  cartItems.map((item) => (
                    <View key={item.id} style={styles.productItem}>
                      <Text style={styles.productName}>
                        {item.name} x {item.quantity}
                      </Text>
                      <Text style={styles.productPrice}>
                        {(item.price * item.quantity).toLocaleString()} RS
                      </Text>
                    </View>
                  ))}
              </View>
            </>
          )}

          {/* Payment Slip */}
          <View style={styles.slip}>
            <Text style={styles.slipTitle}>Payment Slip</Text>
            <Text style={styles.slipText}>Amount: {transaction.depositAmount} PKR</Text>
            <Text style={styles.slipText}>Wallet Number: {transaction.walletNumber}</Text>
            <Text style={styles.slipText}>Wallet Name: {transaction.walletName}</Text>
            <Text style={styles.slipText}>Transaction ID: {transaction.transactionID}</Text>
            {transactionTime && (
              <>
                <Text style={styles.slipText}>
                  Date: {new Date(transactionTime).toLocaleDateString()}
                </Text>
                <Text style={styles.slipText}>
                  Time: {new Date(transactionTime).toLocaleTimeString()}
                </Text>
              </>
            )}
          </View>

          {isAccepted && (
            <Text style={styles.additionalNote}>
              Your product(s) will arrive at your destination within 1-2 hours. Please wait for that.
            </Text>
          )}

          <TouchableOpacity
            style={styles.returnButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.returnButtonText}>Return to Home</Text>
          </TouchableOpacity>

          {!isAccepted && (
            <TouchableOpacity
              style={styles.returnButton}
              onPress={() => navigation.navigate("HelpAndSupport")}
            >
              <Text style={styles.returnButtonText}>Contact Us</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ffffff" },
  scrollContent: { paddingVertical: 20, paddingHorizontal: 15, alignItems: "center" },
  container: { backgroundColor: "#fff", paddingVertical: 20, paddingHorizontal: 15, borderRadius: 12, alignItems: "center", width: "100%" },
  logoContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  logoOverlay: { width: 50, height: 50 },
  separatorOverlay: { fontSize: 24, color: "#007bff", marginHorizontal: 5, fontWeight: "200" },
  successIconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: "green", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  successIcon: { fontSize: 30, color: "#fff" },
  failedIconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: "red", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  failedIcon: { fontSize: 30, color: "#fff" },
  overlayTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10, color: "#333", textAlign: "center" },
  overlayMessage: { fontSize: 14, color: "#555", marginBottom: 15, textAlign: "center" },
  purchaseTitle: { fontSize: 16, fontWeight: "700", color: "#007bff", marginTop: 10, textAlign: "center" },
  productDetailsBox: { borderWidth: 1, borderColor: "#007bff", borderRadius: 8, padding: 8, marginVertical: 10, backgroundColor: "#f8f9fa", width: "100%" },
  productItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: "#e9ecef" },
  productName: { fontSize: 14, color: "#495057" },
  productPrice: { fontSize: 14, color: "#495057", fontWeight: "600" },
  slip: { borderWidth: 1, borderColor: "#007bff", padding: 12, borderRadius: 8, backgroundColor: "#f8f9fa", marginVertical: 10, width: "100%", alignItems: "center" },
  slipTitle: { fontSize: 16, fontWeight: "700", color: "#007bff", marginBottom: 8, textAlign: "center" },
  slipText: { fontSize: 14, color: "#495057", marginBottom: 4 },
  additionalNote: { fontSize: 14, color: "#555", textAlign: "center", marginVertical: 10 },
  returnButton: { backgroundColor: "#007bff", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20, marginTop: 15 },
  returnButtonText: { fontSize: 16, color: "#ffffff", fontWeight: "600", textAlign: "center" },
});

export default TransactionResult;
