// HelpAndSupportScreen.js
import React, { useState, useMemo } from "react";
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
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { wp, hp, fontSize } from "./responsive";
import { Mail, Phone, Globe, MessageCircleQuestion, ArrowLeft, Bot, ExternalLink, ChevronRight, Send } from 'lucide-react-native';
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "./ThemeContext";
import Footer from "./Footer";

const HelpAndSupportScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = useMemo(() => getStyles(isDarkMode, insets), [isDarkMode, insets]);
  const currentChatStyles = useMemo(() => getChatStyles(isDarkMode), [isDarkMode]);

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

  // Enhanced QA pairs
  const chatbotKnowledge = {
    "inventory": "MediApp uses predictive analytics and real-time tracking to optimize inventory levels.",
    "technology": "MediApp is built with React Native, Node.js, and MongoDB.",
    "payment": "We support Stripe, Easypaisa, and JazzCash for secure transactions.",
    "recommendation": "Our system analyzes history to suggest medications. Always consult a doctor.",
    "ordering": "Orders are processed via the 'Online Medicine Purchase' section within 24 hours.",
    "security": "We use JWT, bcrypt, and SSL encryption to protect your data.",
  };

  const getBotResponse = (userInput) => {
    const lowerInput = userInput.toLowerCase();
    for (const [key, value] of Object.entries(chatbotKnowledge)) {
      if (lowerInput.includes(key)) return value;
    }
    return "I'm here to help with MediApp! For complex issues, please contact our support team.";
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    const userMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: "user",
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText("");

    setIsChatLoading(true);
    setTimeout(() => {
      const botResponse = {
        id: Date.now().toString() + "-bot",
        text: getBotResponse(messageText),
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
          { color: item.sender === "user" ? "#fff" : isDarkMode ? "#fff" : "#333" },
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
            <ArrowLeft size={24} color={isDarkMode ? "#fff" : "#2f95dc"} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image
            source={require("../assets/help-support.png")}
            style={styles.heroImage}
            resizeMode="contain"
          />
          <Text style={styles.heroText}>
            24/7 Support for All MediApp Needs
          </Text>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('FAQScreen')}>
            <MessageCircleQuestion size={32} color="#2f95dc" />
            <Text style={styles.gridText}>FAQs</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={handleEmail}>
            <Mail size={32} color="#2f95dc" />
            <Text style={styles.gridText}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => setIsChatModalVisible(true)}>
            <Bot size={32} color="#2f95dc" />
            <Text style={styles.gridText}>AI Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={handlePhone}>
            <Phone size={32} color="#2f95dc" />
            <Text style={styles.gridText}>Call</Text>
          </TouchableOpacity>
        </View>

        {/* Knowledge Base */}
        <View style={styles.knowledgeSection}>
          <Text style={styles.sectionTitle}>Help Topics</Text>
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
              <ChevronRight size={20} color="#2f95dc" />
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
                  <Bot size={20} color="#fff" />
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
                <Text style={currentChatStyles.loadingText}>Thinking...</Text>
              </View>
            )}

            <View style={currentChatStyles.inputWrapper}>
              <TextInput
                style={currentChatStyles.input}
                placeholder="Ask me anything..."
                placeholderTextColor={isDarkMode ? "#aaa" : "#666"}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity
                style={[currentChatStyles.sendButton, { opacity: !inputText.trim() ? 0.5 : 1 }]}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isChatLoading}
              >
                <Send size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
      <Footer />
    </SafeAreaView>
  );
};

const getStyles = (isDarkMode, insets) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDarkMode ? "#121212" : "#f8f9fa" },
    container: { flexGrow: 1, paddingHorizontal: wp(5), paddingBottom: hp(12) },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#333" : "#eee",
    },
    backButton: { padding: 8, marginRight: 10 },
    headerTitle: { fontSize: 22, fontWeight: "700", color: isDarkMode ? "#fff" : "#2d3436" },
    heroContainer: { alignItems: "center", marginVertical: 30 },
    heroImage: { width: 140, height: 140, marginBottom: 15 },
    heroText: { fontSize: 18, fontWeight: "600", textAlign: "center", color: isDarkMode ? "#fff" : "#2d3436", paddingHorizontal: 20 },
    gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginVertical: 20 },
    gridItem: {
      width: "48%",
      backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      marginBottom: 15,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    gridText: { fontSize: 14, marginTop: 10, color: isDarkMode ? "#fff" : "#636e72", fontWeight: "600" },
    knowledgeSection: { marginTop: 10 },
    sectionTitle: { fontSize: 20, fontWeight: "700", color: isDarkMode ? "#fff" : "#2d3436", marginBottom: 15 },
    topicItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
      padding: 16,
      borderRadius: 12,
      marginBottom: 10,
      elevation: 2,
    },
    topicText: { fontSize: 16, color: isDarkMode ? "#fff" : "#2d3436", fontWeight: "500" },
  });

const getChatStyles = (isDarkMode) =>
  StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalContent: { height: "90%", backgroundColor: isDarkMode ? "#121212" : "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: isDarkMode ? "#333" : "#eee" },
    botTitle: { flexDirection: "row", alignItems: "center", gap: 12 },
    modalTitle: { fontSize: 20, fontWeight: "700", color: isDarkMode ? "#fff" : "#000" },
    closeButton: { fontSize: 16, fontWeight: "600", color: "#2f95dc" },
    chatContent: { paddingVertical: 20, flexGrow: 1 },
    messageContainer: { maxWidth: "80%", borderRadius: 20, padding: 14, marginVertical: 8 },
    userMessage: { backgroundColor: "#2f95dc", alignSelf: "flex-end", borderBottomRightRadius: 5 },
    botMessage: { backgroundColor: isDarkMode ? "#1e1e1e" : "#f1f2f6", alignSelf: "flex-start", borderBottomLeftRadius: 5 },
    messageText: { fontSize: 16, lineHeight: 22 },
    inputWrapper: { flexDirection: "row", alignItems: "center", marginTop: 20, gap: 10 },
    input: { flex: 1, backgroundColor: isDarkMode ? "#1e1e1e" : "#f1f2f6", color: isDarkMode ? "#fff" : "#000", borderRadius: 25, paddingHorizontal: 20, paddingVertical: 12, fontSize: 16 },
    sendButton: { backgroundColor: "#2f95dc", width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
    loading: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, paddingLeft: 10 },
    loadingText: { fontSize: 14, fontStyle: "italic", color: isDarkMode ? "#aaa" : "#636e72" },
  });

export default HelpAndSupportScreen;