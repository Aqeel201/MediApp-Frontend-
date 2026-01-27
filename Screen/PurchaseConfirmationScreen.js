import React from "react";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faBell } from "@fortawesome/free-solid-svg-icons";
import FontAwesome from "react-native-vector-icons/FontAwesome";

const Payment = () => {
  const navigation = useNavigation();
  const currentStep = 3; // Set to 3 for the Confirmation Step

  // Dummy payment data
  const paymentDetails = {
    amount: "$50.00",
    method: "Credit Card",
    cardNumber: "**** **** **** 1234",
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Confirmation</Text>
        <TouchableOpacity>
          <FontAwesomeIcon icon={faBell} size={20} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* Multi-Step Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStepContainer}>
          <FontAwesome name="list" size={24} color={currentStep >= 1 ? "#007BFF" : "#ccc"} />
          <Text style={styles.progressText}>Products List</Text>
        </View>
        <View style={[styles.progressLine, { backgroundColor: currentStep >= 2 ? "#007BFF" : "#ccc" }]} />
        <View style={styles.progressStepContainer}>
          <FontAwesome name="map-marker" size={24} color={currentStep >= 2 ? "#007BFF" : "#ccc"} />
          <Text style={styles.progressText}>Location</Text>
        </View>
        <View style={[styles.progressLine, { backgroundColor: currentStep >= 3 ? "#007BFF" : "#ccc" }]} />
        <View style={styles.progressStepContainer}>
          <FontAwesome name="credit-card" size={24} color={currentStep >= 3 ? "#007BFF" : "#ccc"} />
          <Text style={styles.progressText}>Confirmation</Text>
        </View>
      </View>

      {/* Payment Details */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.paymentDetailContainer}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <Text style={styles.detailValue}>{paymentDetails.amount}</Text>

          <Text style={styles.detailLabel}>Payment Method:</Text>
          <Text style={styles.detailValue}>{paymentDetails.method}</Text>

          <Text style={styles.detailLabel}>Card Number:</Text>
          <Text style={styles.detailValue}>{paymentDetails.cardNumber}</Text>
        </View>

        {/* Confirm Payment Button */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => {
            // Logic to handle payment confirmation
            alert("Payment Confirmed!");
            navigation.navigate("Success"); // Navigate to a success screen
          }}
        >
          <Text style={styles.confirmButtonText}>Confirm Payment</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007bff",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#f8f9fa",
  },
  progressStepContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  progressText: {
    fontSize: 12,
    color: "#333",
  },
  progressLine: {
    height: 2,
    width: 50,
    backgroundColor: "#ccc",
  },
  scrollContainer: {
    padding: 15,
  },
  paymentDetailContainer: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  detailValue: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
  },
  confirmButton: {
    backgroundColor: "#007bff",
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default Payment;
