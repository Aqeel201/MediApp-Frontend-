import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "./ThemeContext";
import Footer from "./Footer";

import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faAngleRight,
  faBell,
  faGear,
  faInfo,
  faLocation,
  faLock,
  faPager,
  faUser,
  faHome,
  faShoppingBag,
  faBars,
  faComment,
} from "@fortawesome/free-solid-svg-icons";
import ToggleSwitch from "toggle-switch-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const cities = ["Karachi", "Lahore", "Islamabad", "Quetta", "Peshawar", "Skardu"];

const ProfileScreen = () => {
  const { isDarkMode } = useTheme();
  const [isNotificationOn, setIsNotificationOn] = useState(false);
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Skardu");
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Function to load user details from AsyncStorage
  const loadUserData = useCallback(async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (userString) {
        setUserData(JSON.parse(userString));
      }
    } catch (error) {
      console.error("Error loading user data", error);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setIsCityModalVisible(false);
  };

  // Logout: clear login data from AsyncStorage and navigate to Login screen
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("user");
      navigation.navigate("Login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#1c1c1c" : "white", paddingTop: insets.top }]}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
        animated={true}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton}>
            <FontAwesomeIcon icon={faBars} size={24} color={isDarkMode ? "white" : "#0d6efd"} />
          </TouchableOpacity>
          <Text style={[styles.headerText, { color: isDarkMode ? "white" : "#0d6efd" }]}>Profile</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate("NotificationPage")}>
            <FontAwesomeIcon icon={faBell} size={24} color={isDarkMode ? "white" : "#0d6efd"} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          {loadingUser ? (
            <ActivityIndicator size="large" color={isDarkMode ? "white" : "#0d6efd"} />
          ) : (
            <>
              <TouchableOpacity onPress={() => navigation.navigate("PersonalData")}>
                <Image
                  source={
                    userData && userData.profileImage
                      ? { uri: userData.profileImage }
                      : require("../assets/default-profile.png")
                  }
                  style={styles.profilePic}
                />
              </TouchableOpacity>
              <Text style={[styles.nameText, { color: isDarkMode ? "white" : "black" }]}>
                {userData ? `${userData.firstName}${userData.lastName}` : "Guest"}
              </Text>
            </>
          )}
        </View>

        {/* Other menu items */}
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("PersonalData")}>
          <FontAwesomeIcon icon={faUser} size={15} color={isDarkMode ? "white" : "#0d6efd"} />
          <Text style={[styles.menuText, { color: isDarkMode ? "white" : "black" }]}>Personal Data</Text>
          <FontAwesomeIcon icon={faAngleRight} size={15} color={isDarkMode ? "white" : "#0d6efd"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Settings")}>
          <FontAwesomeIcon icon={faGear} size={15} color={isDarkMode ? "white" : "#0d6efd"} />
          <Text style={[styles.menuText, { color: isDarkMode ? "white" : "black" }]}>Settings</Text>
          <FontAwesomeIcon icon={faAngleRight} size={15} color={isDarkMode ? "white" : "#0d6efd"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => setIsCityModalVisible(true)}>
          <FontAwesomeIcon icon={faLocation} size={15} color={isDarkMode ? "white" : "#0d6efd"} />
          <Text style={[styles.menuText, { color: isDarkMode ? "white" : "black" }]}>Location</Text>
          <Text style={[styles.locationDetail, { color: isDarkMode ? "white" : "gray" }]}>{selectedCity}</Text>
          <FontAwesomeIcon icon={faAngleRight} size={15} color={isDarkMode ? "white" : "#0d6efd"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("NotificationPage")}>
          <FontAwesomeIcon icon={faBell} size={15} color={isDarkMode ? "white" : "#0d6efd"} />
          <Text style={[styles.menuText, { color: isDarkMode ? "white" : "black" }]}>Notification settings</Text>
          <ToggleSwitch
            isOn={isNotificationOn}
            onColor="green"
            offColor="red"
            labelStyle={{ color: isDarkMode ? "white" : "black" }}
            size="medium"
            onToggle={(isOn) => {
              setIsNotificationOn(isOn);
              console.log("changed to: ", isOn);
            }}
          />
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("PrivacyPolicy")}>
          <FontAwesomeIcon icon={faLock} size={15} color={isDarkMode ? "white" : "#0d6efd"} />
          <Text style={[styles.menuText, { color: isDarkMode ? "white" : "black" }]}>Privacy Policy</Text>
          <FontAwesomeIcon icon={faAngleRight} size={15} color={isDarkMode ? "white" : "#0d6efd"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("TermsAndConditionsScreen")}>
          <FontAwesomeIcon icon={faPager} size={15} color={isDarkMode ? "white" : "#0d6efd"} />
          <Text style={[styles.menuText, { color: isDarkMode ? "white" : "black" }]}>Terms & Conditions</Text>
          <FontAwesomeIcon icon={faAngleRight} size={15} color={isDarkMode ? "white" : "#0d6efd"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("HelpAndSupport")}>
          <FontAwesomeIcon icon={faInfo} size={15} color={isDarkMode ? "white" : "#0d6efd"} />
          <Text style={[styles.menuText, { color: isDarkMode ? "white" : "black" }]}>Help & Support</Text>
          <FontAwesomeIcon icon={faAngleRight} size={15} color={isDarkMode ? "white" : "#0d6efd"} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { marginBottom: 20 }]} onPress={() => navigation.navigate("Feedback")}>
          <FontAwesomeIcon icon={faComment} size={15} color={isDarkMode ? "white" : "#0d6efd"} />
          <Text style={[styles.menuText, { color: isDarkMode ? "white" : "black" }]}>Feedback</Text>
          <FontAwesomeIcon icon={faAngleRight} size={15} color={isDarkMode ? "white" : "#0d6efd"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={[styles.logoutText, { color: isDarkMode ? "white" : "#0d6efd" }]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        transparent={true}
        animationType="slide"
        visible={isCityModalVisible}
        onRequestClose={() => setIsCityModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? "#333" : "white" }]}>
            <Text style={[styles.modalTitle, { color: isDarkMode ? "white" : "black" }]}>Select City</Text>
            <FlatList
              data={cities}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleCitySelect(item)}>
                  <Text style={[styles.modalItemText, { color: isDarkMode ? "white" : "black" }]}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: isDarkMode ? "gray" : "#0d6efd" }]}
              onPress={() => setIsCityModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingBottom: 90, // Space for the Footer
  },
  header: {
    backgroundColor: "transparent",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: { fontSize: 20, fontWeight: "bold" },
  iconButton: { padding: 10 },
  profileSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eaeaea",
  },
  nameText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  menuText: { flex: 1, marginLeft: 20, fontSize: 16 },
  locationDetail: { fontSize: 14 },
  separator: {
    height: 1,
    backgroundColor: "#eaeaea",
    marginVertical: 10,
  },
  logoutButton: {
    marginBottom: 20,
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#0d6efd",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  logoutText: { fontSize: 16, fontWeight: "bold" },
  footer: {
    backgroundColor: "transparent",
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  footerContainer: {
    flexDirection: "row",
    backgroundColor: "#0d6efd",
    borderRadius: 50,
    padding: 10,
    paddingHorizontal: 20,
    justifyContent: "space-around",
    width: "90%",
  },
  footerItem: { alignItems: "center", padding: 10 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  modalItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    width: "100%",
    alignItems: "center",
  },
  modalItemText: { fontSize: 16 },
  modalCloseButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  modalCloseButtonText: { color: "white", fontSize: 16 },
});

export default ProfileScreen;
