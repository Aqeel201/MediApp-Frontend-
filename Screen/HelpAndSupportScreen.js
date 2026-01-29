// HelpAndSupportScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
  Alert,
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { wp, hp, fontSize } from "./responsive";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faEnvelope,
  faPhone,
  faGlobe,
  faQuestionCircle,
  faArrowLeft,
  faRobot,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "./ThemeContext";
import Footer from "./Footer";

const HelpAndSupportScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => getStyles(isDarkMode, insets), [isDarkMode, insets]);
  const currentChatStyles = React.useMemo(() => getChatStyles(isDarkMode), [isDarkMode]);

  // Contact action handlers
  const handleEmail = () => Linking.openURL("mailto:support@mediapp.com");
  const handlePhone = () => Linking.openURL("tel:+923499535156");
  const handleWebsite = () => Linking.openURL("https://mediapp.com/support");

  // Chatbot state
  const [isChatModalVisible, setIsChatModalVisible] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Hello! I'm MediBot, your smart assistant for MediApp. How can I help you today?",
      sender: "bot"
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Enhanced QA pairs based on project document
  const chatbotKnowledge = {
    "inventory": "MediApp uses predictive analytics and real-time tracking to optimize inventory levels. The system automatically reorders medications when stock reaches predetermined thresholds.",
    "technology": "MediApp is built with React Native for cross-platform compatibility, Node.js/Express.js backend, and MongoDB for database management.",
    "payment": "Currently we support Stripe payments. Future versions will integrate Easypaisa and JazzCash for local transactions.",
    "recommendation": "The recommendation system analyzes patient history and current symptoms to suggest appropriate medications. Always consult your physician before use.",
    "patient records": "Authorized medical staff can access patient records through the dedicated dashboard with role-based access control.",
    "ordering": "Patients can order medicines through the 'Online Medicine Purchase' section. Orders are processed within 24 hours.",
    "security": "We use JWT authentication, bcrypt password hashing, and SSL encryption to protect all user data.",
    "suppliers": "Suppliers can access inventory data through a dedicated portal to maintain optimal stock levels.",
    "reporting": "The admin dashboard provides real-time reports on inventory levels, sales trends, and patient demographics.",
    "integration": "MediApp follows REST API standards for easy integration with existing healthcare systems.",
    "notifications": "Users receive push notifications for order updates, low stock alerts, and important announcements.",
    "delivery": "We partner with local logistics providers for same-day delivery in urban areas and next-day delivery in rural regions.",
    "prescriptions": "Doctors can upload digital prescriptions directly to patient profiles through the practitioner portal."
  };

  const getBotResponse = (userInput) => {
    const lowerInput = userInput.toLowerCase();
    for (const [key, value] of Object.entries(chatbotKnowledge)) {
      if (lowerInput.includes(key)) return value;
    }
    return "I'm here to help with MediApp-related queries! For complex issues, please contact our support team.";
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "user",
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText("");

    // Simulate AI response
    setIsChatLoading(true);
    setTimeout(() => {
      const botResponse = {
        id: Date.now().toString() + "-bot",
        text: getBotResponse(inputText),
        sender: "bot",
      };
      setMessages(prev => [...prev, botResponse]);
      setIsChatLoading(false);
    }, 1000);
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        currentChatStyles.messageContainer,
        item.sender === "user" ? currentChatStyles.userMessage : currentChatStyles.botMessage,
      ]}
    >
      <Text
        style={[
          currentChatStyles.messageText,
          { color: item.sender === "user" ? "#fff" : isDarkMode ? "#fff" : "#000" },
        ]}
      >
        {item.text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <FontAwesomeIcon
              icon={faArrowLeft}
              size={20}
              color={isDarkMode ? "#fff" : "#2f95dc"}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image
            source={require("../assets/help-support.png")}
            style={styles.heroImage}
          />
          <Text style={styles.heroText}>
            24/7 Support for All MediApp Needs
          </Text>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('FAQScreen')}
          >
            <FontAwesomeIcon
              icon={faQuestionCircle}
              size={24}
              color="#2f95dc"
            />
            <Text style={styles.gridText}>FAQs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={handleEmail}
          >
            <FontAwesomeIcon
              icon={faEnvelope}
              size={24}
              color="#2f95dc"
            />
            <Text style={styles.gridText}>Email Support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => setIsChatModalVisible(true)}
          >
            <FontAwesomeIcon
              icon={faRobot}
              size={24}
              color="#2f95dc"
            />
            <Text style={styles.gridText}>AI Assistant</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={handlePhone}
          >
            <FontAwesomeIcon
              icon={faPhone}
              size={24}
              color="#2f95dc"
            />
            <Text style={styles.gridText}>Call Support</Text>
          </TouchableOpacity>
        </View>

        {/* Knowledge Base Section */}
        <View style={styles.knowledgeSection}>
          <Text style={styles.sectionTitle}>Popular Help Topics</Text>
          {Object.entries(chatbotKnowledge).map(([topic], index) => (
            <TouchableOpacity
              key={index}
              style={styles.topicItem}
              onPress={() => {
                setMessages([{
                  id: Date.now().toString(),
                  text: chatbotKnowledge[topic],
                  sender: "bot"
                }]);
                setIsChatModalVisible(true);
              }}
            >
              <Text style={styles.topicText}>{topic.charAt(0).toUpperCase() + topic.slice(1)}</Text>
              <FontAwesomeIcon
                icon={faArrowLeft}
                size={16}
                color="#2f95dc"
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Chat Modal */}
      <Modal
        visible={isChatModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsChatModalVisible(false)}
      >
        <SafeAreaView style={currentChatStyles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={currentChatStyles.modalContent}
          >
            <View style={currentChatStyles.modalHeader}>
              <View style={currentChatStyles.botTitle}>
                <View style={{ backgroundColor: '#2f95dc', padding: 8, borderRadius: 20 }}>
                  <FontAwesomeIcon icon={faRobot} size={20} color="#fff" />
                </View>
                <Text style={currentChatStyles.modalTitle}>MediBot AI</Text>
              </View>
              <TouchableOpacity onPress={() => setIsChatModalVisible(false)}>
                <Text style={currentChatStyles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={currentChatStyles.chatContent}
              showsVerticalScrollIndicator={false}
            />

            {isChatLoading && (
              <View style={currentChatStyles.loading}>
                <ActivityIndicator size="small" color="#2f95dc" />
                <Text style={currentChatStyles.loadingText}>MediBot is thinking...</Text>
              </View>
            )}

            <View style={currentChatStyles.inputWrapper}>
              <TextInput
                style={currentChatStyles.input}
                placeholder="Ask about medicines, dosage..."
                placeholderTextColor={isDarkMode ? "#aaa" : "#666"}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity
                style={currentChatStyles.sendButton}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isChatLoading}
              >
                <Text style={currentChatStyles.sendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>


    </SafeAreaView>
  );
};

// Updated styling with modern design
const getStyles = (isDarkMode, insets) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? "#121212" : "#f8f9fa",
    },
    mainContainer: {
      flex: 1,
      backgroundColor: isDarkMode ? "#121212" : "#f8f9fa",
    },
    container: {
      flexGrow: 1,
      paddingHorizontal: wp(4),
      paddingBottom: hp(12) + insets.bottom,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#333" : "#e0e0e0",
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: fontSize(22),
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#2d3436",
    },
    heroContainer: {
      alignItems: "center",
      marginVertical: 30,
    },
    heroImage: {
      width: 180,
      height: 180,
      marginBottom: 20,
    },
    heroText: {
      fontSize: fontSize(18),
      fontWeight: "500",
      textAlign: "center",
      color: isDarkMode ? "#fff" : "#2d3436",
      marginHorizontal: 40,
    },
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginVertical: 20,
    },
    gridItem: {
      width: "48%",
      backgroundColor: isDarkMode ? "#252525" : "#fff",
      borderRadius: 12,
      padding: 20,
      alignItems: "center",
      marginBottom: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    gridText: {
      fontSize: fontSize(14),
      marginTop: 10,
      color: isDarkMode ? "#fff" : "#2d3436",
      fontWeight: "500",
    },
    knowledgeSection: {
      marginTop: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#2d3436",
      marginBottom: 15,
    },
    topicItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#252525" : "#fff",
      padding: 16,
      borderRadius: 8,
      marginBottom: 10,
    },
    topicText: {
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#2d3436",
      flex: 1,
      marginRight: 10,
    },
  });

const getChatStyles = (isDarkMode) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      height: "85%",
      backgroundColor: isDarkMode ? "#1c1c1c" : "#fff",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#333" : "#eee",
    },
    botTitle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: isDarkMode ? "#fff" : "#000",
    },
    closeButton: {
      fontSize: 16,
      fontWeight: "500",
      color: "#2f95dc",
    },
    chatContent: {
      paddingVertical: 16,
      flexGrow: 1, // Ensure content can grow
    },
    messageContainer: {
      maxWidth: "80%",
      borderRadius: 12,
      padding: 12,
      marginVertical: 6,
    },
    userMessage: {
      backgroundColor: "#2f95dc",
      alignSelf: "flex-end",
    },
    botMessage: {
      backgroundColor: isDarkMode ? "#2d3436" : "#e9ecef",
      alignSelf: "flex-start",
    },
    messageText: {
      fontSize: 16,
      lineHeight: 22,
      color: isDarkMode ? "#fff" : "#000",
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 16,
      gap: 8,
    },
    input: {
      flex: 1,
      backgroundColor: isDarkMode ? "#2d3436" : "#f8f9fa",
      color: isDarkMode ? "#fff" : "#000",
      borderRadius: 25,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
    },
    sendButton: {
      backgroundColor: "#2f95dc",
      borderRadius: 25,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    sendText: {
      color: "#fff",
      fontWeight: "500",
    },
    loading: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 12,
      paddingLeft: 8,
    },
    loadingText: {
      fontSize: 14,
      fontStyle: "italic",
      color: isDarkMode ? "#aaa" : "#666",
    },
  });

export default HelpAndSupportScreen;