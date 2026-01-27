// Footer.js
import React, { useState, useEffect, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faHome,
  faBell,
  faShoppingBag,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "./ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CartContext } from "./CartContext";

const Footer = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const [userData, setUserData] = useState(null);

  // Use CartContext to get cart items.
  const { cartItems } = useContext(CartContext);
  const cartCount = cartItems ? cartItems.length : 0;

  const styles = getStyles(isDarkMode);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (userString) {
          setUserData(JSON.parse(userString));
        }
      } catch (error) {
        console.error("Error loading user data", error);
      }
    };

    loadUserData();

    // Add navigation listener to refresh user data when screen is focused
    const unsubscribe = navigation.addListener("focus", () => {
      loadUserData();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.footer}>
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate("Home")}
        >
          <FontAwesomeIcon icon={faHome} size={24} style={styles.icon} />
          <Text style={styles.footerLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate("NotificationPage")}
        >
          <FontAwesomeIcon icon={faBell} size={24} style={styles.icon} />
          <Text style={styles.footerLabel}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate("OnlineMedicinePurchase")}
        >
          <View style={styles.iconContainer}>
            <FontAwesomeIcon icon={faShoppingBag} size={24} style={styles.icon} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.footerLabel}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate("Profile")}
        >
          {userData && userData.profileImage ? (
            <Image
              source={{
                uri: userData.profileImage,
              }}
              style={styles.profilePic}
            />
          ) : (
            <Image
              source={require("../assets/default-profile.png")}
              style={styles.profilePic}
            />
          )}
          <Text style={styles.footerLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getStyles = (isDarkMode) =>
  StyleSheet.create({
    footer: {
      backgroundColor: isDarkMode ? "#1E1E1E" : "#FFFFFF",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingVertical: 10,
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDarkMode ? "#303030" : "#E5E5E5",
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
    },
    footerContainer: {
      flexDirection: "row",
      width: "100%",
      justifyContent: "space-around",
      paddingHorizontal: 10,
    },
    footerItem: {
      alignItems: "center",
      flex: 1,
    },
    iconContainer: {
      position: "relative",
    },
    icon: {
      color: isDarkMode ? "#FFFFFF" : "#007bff",
      marginBottom: 4,
    },
    footerLabel: {
      fontSize: 12,
      color: isDarkMode ? "#FFFFFF" : "#007bff",
      fontWeight: "500",
    },
    profilePic: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginBottom: 4,
      borderWidth: 1,
      borderColor: isDarkMode ? "#FFFFFF" : "#007bff",
    },
    cartBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      backgroundColor: "red",
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 2,
      justifyContent: "center",
      alignItems: "center",
    },
    cartBadgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "bold",
    },
  });

export default Footer;
