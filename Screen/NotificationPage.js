// NotificationPage.js
import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { 
  faArrowLeft, 
  faBell, 
  faHome, 
  faShoppingBag, 
  faUser 
} from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "./ThemeContext";
import Footer from "./Footer"; // Import the reusable Footer component

const notifications = [
  {
    id: 1,
    title: "New Arrival",
    message: "New batch of Paracetamol has arrived at the medical store.",
  },
  {
    id: 2,
    title: "Discount Offer",
    message: "20% off on all herbal medicines this week.",
  },
  {
    id: 3,
    title: "Vaccine Availability",
    message: "COVID-19 vaccines are now available at our store.",
  },
];

const NotificationPage = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();

  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesomeIcon 
            icon={faArrowLeft} 
            size={24} 
            color={isDarkMode ? "white" : "#0d6efd"} 
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>Notifications</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {notifications.map((notification) => (
          <TouchableOpacity 
            key={notification.id} 
            style={styles.notificationItem}
          >
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationMessage}>{notification.message}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Reusable Modern Footer */}
      <Footer />
    </View>
  );
};

const getStyles = (isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? "#1c1c1c" : "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? "#444" : "#eaeaea",
  },
  headerText: {
    marginLeft: 10,
    fontSize: 20,
    fontWeight: "bold",
    color: isDarkMode ? "white" : "#0d6efd",
  },
  scrollView: {
    padding: 20,
    marginBottom: 70, // leave space for the footer
  },
  notificationItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? "#444" : "#eaeaea",
    marginBottom: 10,
    backgroundColor: isDarkMode ? "#333" : "white",
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: isDarkMode ? "white" : "black",
  },
  notificationMessage: {
    marginTop: 5,
    fontSize: 14,
    color: isDarkMode ? "#ccc" : "#666",
  },
});

export default NotificationPage;
