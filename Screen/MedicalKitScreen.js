import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView,
  Platform, StyleSheet, ActivityIndicator, Animated, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const MedicineChatBot = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  const BASE_URL = 'http://192.168.18.37:8000';   // ← Apna IP confirm kar lena

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    addBotMessage(`${greeting()}! 👋\nI'm MediApp AI – your personal medical assistant.\nTell me your symptoms and I'll help you right away.`);
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      await axios.get(`${BASE_URL}/health`);
    } catch (err) {
      addBotMessage('⚠️ Cannot connect to server. Check Wi-Fi & backend.');
    }
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text }]);
  };

  const addBotMessage = (text) => {
    setMessages(prev => [...prev, { id: Date.now(), type: 'bot', text }]);
  };

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    addUserMessage(userText);
    setInputMessage('');
    setLoading(true);
    Keyboard.dismiss();

    try {
      const res = await axios.post(`${BASE_URL}/recommend`, {
        query: userText
      }, { timeout: 20000 });

      const botReply = res.data.reply || "No response from AI.";
      addBotMessage(botReply);

    } catch (err) {
      console.error(err);
      addBotMessage("⚠️ Server error or timeout. Please try again.");
    }

    setLoading(false);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.messageBubble, item.type === 'user' ? styles.userBubble : styles.botBubble]}>
      <Text style={[styles.messageText, item.type === 'user' && styles.userText]}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <LinearGradient colors={['#e0f2fe', '#f0f9ff']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back-ios" size={28} color="#0ea5e9" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>💊 MediApp AI Assistant</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          {/* Typing Indicator */}
          {loading && (
            <View style={styles.typing}>
              <ActivityIndicator color="#0ea5e9" />
              <Text style={styles.typingText}>MediApp AI is thinking...</Text>
            </View>
          )}

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Describe your symptoms..."
              placeholderTextColor="#94a3b8"
              value={inputMessage}
              onChangeText={setInputMessage}
              onSubmitEditing={handleSend}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputMessage.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputMessage.trim()}
            >
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', elevation: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0ea5e9' },
  messageBubble: { maxWidth: '80%', padding: 14, borderRadius: 18, marginVertical: 6 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#0ea5e9' },
  botBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', elevation: 2 },
  messageText: { fontSize: 16, lineHeight: 22 },
  userText: { color: '#fff' },
  typing: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#fff', padding: 12, borderRadius: 18, marginLeft: 16, marginBottom: 10 },
  typingText: { marginLeft: 10, color: '#0ea5e9', fontWeight: '600' },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e2e8f0' },
  textInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 25, paddingHorizontal: 18, paddingVertical: 12, fontSize: 16, maxHeight: 100 },
  sendBtn: { backgroundColor: '#0ea5e9', marginLeft: 10, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25, justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#94a3b8' },
  sendText: { color: '#fff', fontWeight: 'bold' },
});

export default MedicineChatBot;