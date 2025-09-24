import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView,
  Platform, StyleSheet, ActivityIndicator, Animated, SafeAreaView, Keyboard, TouchableWithoutFeedback
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './ThemeContext';
import { CartContext } from './CartContext';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const MedicineChatBot = ({ navigation }) => {
  const theme = useTheme(); // Get the full theme object
  const isDarkMode = theme?.isDarkMode ?? false; // Fallback to false if undefined
  // console.log('Theme context:', theme); // Removed debug log to reduce console clutter

  const { cartItems } = useContext(CartContext);
  const cartCount = cartItems ? cartItems.length : 0;
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [allMedicines, setAllMedicines] = useState([]);
  const [showChatHistory, setShowChatHistory] = useState(false); // State for chat history overlay
  const [showImageUpload, setShowImageUpload] = useState(false); // State for image upload overlay
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  // Base URL for backend
  const BASE_URL = 'http://192.168.18.24:5000';

  // Determine time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Load auth token
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          setAuthToken(token);
        } else {
          console.error('No authToken found, user might not be logged in.');
          addBotMessage('⚠ Please log in to access medicine recommendations.');
        }
      } catch (err) {
        console.error('Error loading auth token:', err);
        addBotMessage('⚠ Error loading authentication. Please try again.');
      }
    };
    loadToken();
  }, []);

  // Fetch all medicines
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const config = authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {};
        const response = await axios.get(`${BASE_URL}/medicines`, config);
        setAllMedicines(response.data.medicines || []); // Ensure response.data.medicines is an array
        console.log('✅ Fetched medicines:', response.data.medicines.length);
      } catch (err) {
        console.error('Failed to fetch medicines:', err.message);
        addBotMessage('⚠ Unable to fetch medicine list. Please check your network.');
      }
    };
    if (authToken) {
      fetchMedicines();
    }
  }, [authToken]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    addBotMessage(`${getTimeBasedGreeting()}! Welcome to MediApp AI! I'm here to answer your medical questions or suggest medicines. Describe your condition or symptoms (e.g., 'headache', 'fever') or ask a question like 'What is diabetes?'.`);
    checkBackend();

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const checkBackend = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Backend health check:', res.data);
      addBotMessage('✅ System is online and ready to assist you!');
    } catch (err) {
      console.error('❌ Backend health check failed:', err.message);
      addBotMessage('⚠ Unable to connect to the server. Please ensure the backend is running.');
    }
  };

  const addUserMessage = (text) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { from: 'user', text, timestamp }]);
  };

  const addBotMessage = (text, confidence = 0, medicines = []) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { from: 'bot', text, timestamp, confidence, medicines }]);
  };

  const handleSend = async () => {
    if (!inputMessage.trim()) return;
    const userText = inputMessage.trim();
    addUserMessage(userText);
    setInputMessage('');
    Keyboard.dismiss();
    setLoading(true);
    setTyping(true);

    try {
      const res = await axios.post(`${BASE_URL}/chat`, { message: userText });
      console.log('📩 Backend response:', res.data);

      const medicineRegex = /\*\*([^\*]+)\*\*: ([^\(]+)\(([^\)]+)\)/g;
      const medicineNames = [];
      let match;
      while ((match = medicineRegex.exec(res.data.reply)) !== null) {
        medicineNames.push(match[1].trim());
      }

      const medicines = medicineNames
        .map(name => allMedicines.find(med => med.name.toLowerCase() === name.toLowerCase()))
        .filter(med => med);

      if (res.data.reply.includes('No medicines found')) {
        console.warn('⚠ No medicines found for input:', userText);
        addBotMessage(res.data.reply, res.data.confidence, medicines);
      } else if (res.data.reply.includes('error')) {
        console.error('❌ Backend error response:', res.data.reply);
        addBotMessage(res.data.reply, res.data.confidence, medicines);
      } else {
        addBotMessage(res.data.reply, res.data.confidence, medicines);
      }
    } catch (err) {
      console.error('❌ Error sending message:', err.message);
      let errorMessage = '⚠ Error connecting to server. Please check your network or try again later.';
      if (err.code === 'ECONNREFUSED') {
        errorMessage = '⚠ Server is offline. Please ensure the backend services are running.';
      } else if (err.response) {
        errorMessage = `⚠ Server error: ${err.response.data.error || err.message}`;
      }
      addBotMessage(errorMessage, 0);
    }
    setLoading(false);
    setTyping(false);
  };

  const renderMessageText = (item) => {
    // Always wrap all message content in a parent <Text> to avoid RN error
    if (item.from !== 'bot' || !item.medicines || item.medicines.length === 0) {
      return (
        <Text style={[styles.messageText, item.from === 'user' && styles.userMessageText]}>
          {item.text}
        </Text>
      );
    }

    // For bot messages with medicines, split and wrap all parts in <Text>
    const parts = [];
    let lastIndex = 0;
    const medicineRegex = /\*\*([^\*]+)\*\*: ([^\(]+)\(([^\)]+)\)/g;
    let match;

    while ((match = medicineRegex.exec(item.text)) !== null) {
      const [fullMatch, name] = match;
      const index = match.index;

      if (index > lastIndex) {
        parts.push(
          <Text key={`text-${lastIndex}`} style={styles.messageText}>
            {item.text.slice(lastIndex, index)}
          </Text>
        );
      }

      parts.push(
        <Text
          key={`medicine-${name}-${index}`}
          style={[styles.messageText, styles.clickableMedicine]}
          onPress={() => {
            const medicine = item.medicines.find(m => m.name.toLowerCase() === name.toLowerCase());
            if (medicine) {
              navigation.navigate('MedicineDetail', { medicine });
            }
          }}
        >
          {name}
        </Text>
      );

      lastIndex = index + fullMatch.length;
    }

    if (lastIndex < item.text.length) {
      parts.push(
        <Text key={`text-${lastIndex}-end`} style={styles.messageText}>
          {item.text.slice(lastIndex)}
        </Text>
      );
    }

    // Wrap all parts in a parent <Text> to avoid RN error
    return (
      <Text style={styles.messageText}>
        {parts}
      </Text>
    );
  };

  const renderItem = ({ item }) => (
    <Animated.View
      style={[
        styles.messageContainer,
        item.from === 'user' ? styles.userMessage : styles.botMessage,
        { opacity: fadeAnim }
      ]}
    >
      {renderMessageText(item)}
      {item.confidence && (
        <Text style={styles.confidenceText}>
          Confidence: {item.confidence.toFixed(1)}%
        </Text>
      )}
      <Text style={styles.timestamp}>{item.timestamp}</Text>
    </Animated.View>
  );

  return (
    <LinearGradient
      colors={isDarkMode ? ['#121212', '#1c1c1c'] : ['#f8fafc', '#ffffff']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 20}
        >
          <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
            <View style={styles.headerContainer}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <MaterialIcons name="arrow-back" size={28} color={isDarkMode ? '#fff' : '#3b82f6'} />
              </TouchableOpacity>
              <Text style={styles.header}>💊 MediApp AI ChatBot</Text>
              <TouchableOpacity
                style={styles.cartButton}
                onPress={() => setShowChatHistory(true)}
              >
                <Ionicons name="chatbubble-outline" size={28} color={isDarkMode ? '#fff' : '#3b82f6'} />
              </TouchableOpacity>
              <View style={styles.headerDivider} />
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.chatArea}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {loading && <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#3b82f6'} />}
            {typing && (
              <View style={styles.typingContainer}>
                <Text style={styles.typingIndicator}>MediApp AI is analyzing...</Text>
              </View>
            )}

            <View style={styles.inputArea}>
              <TextInput
                style={styles.input}
                placeholder="Enter your condition or question..."
                placeholderTextColor={isDarkMode ? '#94a3b8' : '#64748b'}
                value={inputMessage}
                onChangeText={setInputMessage}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                multiline
                maxHeight={100}
                maxLength={500}
              />
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => setShowImageUpload(true)}
              >
                <Ionicons name="camera" size={28} color={isDarkMode ? '#fff' : '#3b82f6'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendButton, !inputMessage.trim() && styles.disabledButton]}
                onPress={handleSend}
                disabled={!inputMessage.trim()}
              >
                <Text style={styles.sendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Chat History Overlay */}
          {showChatHistory && (
            <TouchableWithoutFeedback onPress={() => setShowChatHistory(false)}>
              <View style={styles.overlay}>
                <View style={styles.overlayContent}>
                  <Text style={styles.overlayText}>
                    Chat history is not available yet. It will be available in the future.
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowChatHistory(false)}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          )}

          {/* Image Upload Overlay */}
          {showImageUpload && (
            <TouchableWithoutFeedback onPress={() => setShowImageUpload(false)}>
              <View style={styles.overlay}>
                <View style={styles.overlayContent}>
                  <Text style={styles.overlayText}>
                    Image upload is not available yet. It will be available in the future.
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowImageUpload(false)}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    padding: 5,
  },
  cartButton: {
    padding: 5,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'red',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  chatArea: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 15,
    borderRadius: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 5,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#37474f',
  },
  userMessageText: {
    color: '#ffffff',
  },
  clickableMedicine: {
    color: '#3b82f6',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  confidenceText: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 8,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 12,
    color: '#78909c',
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  typingContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 15,
    marginVertical: 8,
  },
  typingIndicator: {
    fontSize: 14,
    color: '#3b82f6',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    padding: 15,
    borderWidth: 1,
    borderColor: '#b0bec5',
    borderRadius: 25,
    backgroundColor: '#fff',
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#b0bec5',
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cameraButton: {
    padding: 10,
    marginRight: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  overlayText: {
    fontSize: 16,
    color: '#37474f',
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default MedicineChatBot;