import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wp, hp, fontSize } from './responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE = 'https://dashboard-backend-xrss.vercel.app';
const AI_RESPOND_ENDPOINT = `${API_BASE}/api/ai/respond`;

const WELCOME_MESSAGE =
  "Assalam-o-Alaikum! I'm MediApp AI. I can only answer medical and health-related questions. " +
  "For emergencies, contact a doctor or local emergency services immediately.";

const MediAppAISimple = () => {
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'assistant', content: WELCOME_MESSAGE },
  ]);
  const [authToken, setAuthToken] = useState('');
  const [activeSessionId, setActiveSessionId] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        setAuthToken(token || '');
      } catch (err) {
        setAuthToken('');
      }
    };
    loadAuth();
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    if (!authToken) {
      Alert.alert('Login Required', 'Please log in to use MediApp AI.');
      return;
    }

    const userMessage = { id: `u_${Date.now()}`, role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const resp = await axios.post(
        AI_RESPOND_ENDPOINT,
        { sessionId: activeSessionId, message: text },
        { headers: { Authorization: `Bearer ${authToken}` }, timeout: 20000 }
      );
      const content = resp?.data?.response || 'No response received.';
      const sessionId = resp?.data?.sessionId || activeSessionId;
      setActiveSessionId(sessionId);
      setMessages((prev) => [
        ...prev,
        { id: `a_${Date.now() + 1}`, role: 'assistant', content },
      ]);
    } catch (err) {
      const detail =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Unknown error';
      setMessages((prev) => [
        ...prev,
        { id: `a_${Date.now() + 2}`, role: 'assistant', content: `Error: ${detail}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MediApp AI</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}
        style={styles.body}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
              <Text style={[styles.bubbleText, item.role === 'user' ? styles.userText : styles.assistantText]}>
                {item.content}
              </Text>
            </View>
          )}
        />

        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask a medical question..."
            placeholderTextColor="#6b7280"
            style={styles.input}
            multiline
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendBtn} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    paddingTop: hp(6),
    paddingBottom: hp(2),
    paddingHorizontal: wp(5),
    backgroundColor: '#1d4ed8',
  },
  headerTitle: {
    color: '#fff',
    fontSize: fontSize(18),
    fontWeight: '700',
  },
  body: { flex: 1 },
  list: {
    padding: wp(5),
    paddingBottom: hp(2),
  },
  bubble: {
    maxWidth: '88%',
    marginBottom: hp(1.5),
    padding: wp(4),
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1d4ed8',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bubbleText: {
    fontSize: fontSize(14),
    lineHeight: 20,
  },
  userText: { color: '#fff', fontWeight: '600' },
  assistantText: { color: '#111827' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: wp(4),
    paddingBottom: hp(1.5),
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    color: '#111827',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: hp(6),
    maxHeight: hp(16),
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sendBtn: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default MediAppAISimple;
