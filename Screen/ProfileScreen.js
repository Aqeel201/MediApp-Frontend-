import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "./ThemeContext";
import Footer from "./Footer";
import { wp, hp, fontSize } from "./responsive";

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
  const styles = getStyles(isDarkMode, insets);
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
        style={isDarkMode ? "light" : "dark"}
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

const getStyles = (isDarkMode, insets = { top: 0, bottom: 0 }) => StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingBottom: hp(12) + insets.bottom,
  },
  header: {
    backgroundColor: "transparent",
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(2),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: { fontSize: fontSize(20), fontWeight: "bold" },
  iconButton: { padding: wp(2.5) },
  profileSection: {
    alignItems: "center",
    marginVertical: hp(2.5),
  },
  profilePic: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    backgroundColor: "#eaeaea",
    borderWidth: 2,
    borderColor: isDarkMode ? "#444" : "#eee",
  },
  nameText: {
    marginTop: hp(1.5),
    fontSize: fontSize(18),
    fontWeight: "bold",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: hp(2),
    paddingHorizontal: wp(5),
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  menuText: { flex: 1, marginLeft: wp(5), fontSize: fontSize(16) },
  locationDetail: { fontSize: fontSize(14) },
  separator: {
    height: 1,
    backgroundColor: "#eaeaea",
    marginVertical: hp(1),
  },
  logoutButton: {
    marginBottom: hp(3),
    marginHorizontal: wp(5),
    padding: hp(1.8),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#0d6efd",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  logoutText: { fontSize: fontSize(16), fontWeight: "bold" },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: wp(80),
    borderRadius: 15,
    padding: wp(6),
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: { fontSize: fontSize(20), fontWeight: "bold", marginBottom: hp(2.5) },
  modalItem: {
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    width: "100%",
    alignItems: "center",
  },
  modalItemText: { fontSize: fontSize(16) },
  modalCloseButton: {
    marginTop: hp(2.5),
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(8),
    borderRadius: 10,
  },
  modalCloseButtonText: { color: "white", fontSize: fontSize(16), fontWeight: "600" },
});

export default ProfileScreen;
