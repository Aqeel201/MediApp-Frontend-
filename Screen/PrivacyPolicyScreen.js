// PrivacyPolicyScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "./ThemeContext";

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();

  const styles = getStyles(isDarkMode);

  const sections = [
    {
      title: "Effective Date: January 1, 2023",
      content: ``,
    },
    {
      title: "1. Information We Collect",
      content: `We collect the information you provide directly to us, including:
• Your name, email address, phone number, and shipping address when you register or place an order.
• Payment information when you make a purchase.
• Non-personal information such as device details, usage data, and, if permitted, your location.`,
    },
    {
      title: "2. How We Use Your Information",
      content: `We use your information to:
• Process and fulfill your orders.
• Personalize your experience and improve our services.
• Communicate with you about your orders, updates, and promotions.
• Enhance the security of our application and prevent fraud.`,
    },
    {
      title: "3. Sharing of Information",
      content: `We do not sell your personal information to third parties. We may share your information with trusted service providers who help us operate MediApp under strict confidentiality agreements. Your data is only shared for purposes described in this Privacy Policy.`,
    },
    {
      title: "4. Data Security",
      content: `We implement industry-standard security measures to protect your data from unauthorized access, alteration, disclosure, or destruction. However, please note that no method of transmission or storage is 100% secure.`,
    },
    {
      title: "5. Your Rights and Choices",
      content: `You have the right to access, correct, or delete your personal data. You may update your profile information directly in the app or contact our support team for assistance. You may also disable location services through your device settings; however, this may affect your app experience.`,
    },
    {
      title: "6. Changes to This Privacy Policy",
      content: `We may update this Privacy Policy from time to time. When significant changes occur, we will update the effective date and notify you by revising the policy within the app. Your continued use of MediApp signifies your acceptance of the updated policy.`,
    },
    {
      title: "7. Contact Us",
      content: `If you have any questions or concerns about this Privacy Policy or our practices, please contact us at support@mediapp.com.`,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon={faArrowLeft} size={24} color={styles.iconColor.color} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Privacy Policy</Text>
      </View>

      {/* Privacy Policy Content */}
      <ScrollView style={styles.scrollView}>
        {sections.map((section, index) => (
          <View key={index} style={styles.sectionContainer}>
            {section.title && (
              <Text style={index === 0 ? styles.effectiveDate : styles.sectionTitle}>
                {section.title}
              </Text>
            )}
            {section.content ? (
              <Text style={styles.contentText}>{section.content}</Text>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const getStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#1c1c1c" : "#FFFFFF",
    },
    header: {
      backgroundColor: "transparent",
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "ios" ? 50 : 20,
      paddingBottom: 10,
      flexDirection: "row",
      alignItems: "center",
    },
    headerText: {
      color: isDarkMode ? "#FFFFFF" : "#007bff",
      fontSize: 22,
      fontWeight: "bold",
      marginLeft: 10,
    },
    iconButton: {
      padding: 10,
    },
    iconColor: {
      color: isDarkMode ? "#FFFFFF" : "#007bff",
    },
    scrollView: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    sectionContainer: {
      marginBottom: 20,
    },
    effectiveDate: {
      fontSize: 16,
      color: isDarkMode ? "#AAAAAA" : "#666666",
      textAlign: "center",
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDarkMode ? "#FFFFFF" : "#007bff",
      marginBottom: 10,
    },
    contentText: {
      fontSize: 16,
      lineHeight: 24,
      color: isDarkMode ? "#DDDDDD" : "#333333",
      textAlign: "justify",
    },
  });

export default PrivacyPolicyScreen;
