// NotificationPage.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, ArrowLeft, Home, ShoppingBag, User } from 'lucide-react-native';
import { wp, hp, fontSize } from "./responsive";
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
  const insets = useSafeAreaInsets();

  const styles = getStyles(isDarkMode, insets);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
        animated={true}
      />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + wp(5) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
          <ArrowLeft
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

const getStyles = (isDarkMode, insets = { top: 0, bottom: 0 }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? "#1c1c1c" : "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: wp(5),
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? "#444" : "#eaeaea",
  },
  headerText: {
    marginLeft: 10,
    fontSize: fontSize(20),
    fontWeight: "bold",
    color: isDarkMode ? "white" : "#0d6efd",
  },
  scrollView: {
    padding: wp(5),
    marginBottom: hp(10), // leave space for the footer
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
