import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  useWindowDimensions,
  Modal,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPaperPlane, faShieldAlt, faStethoscope, faHistory, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { wp, hp, fontSize } from './responsive';
import { useTheme } from './ThemeContext';

const API_BASE = 'https://dashboard-backend-xrss.vercel.app';
const AI_RESPOND_ENDPOINT = `${API_BASE}/api/ai/respond`;
const AI_CHATS_ENDPOINT = `${API_BASE}/api/ai/chats`;
const AI_APPEND_ENDPOINT = `${API_BASE}/api/ai/append`;
const GROQ_DIRECT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_MODEL = process.env.EXPO_PUBLIC_GROQ_MODEL || 'llama-3.1-8b-instant';

const CHAT_FONT = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const CHAT_FONT_BOLD = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

const WELCOME_MESSAGE =
  "Assalam-o-Alaikum! I'm MediApp AI. I can only answer medical and health-related questions. " +
  "For emergencies, contact a doctor or local emergency services immediately.";

class ScreenErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err) {
    console.error('MediAppAI crash:', err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>MediApp AI</Text>
          <Text style={{ textAlign: 'center', color: '#64748b' }}>
            This screen ran into a problem. Please close and reopen the app.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const MediAppAIInner = () => {
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'assistant', content: WELCOME_MESSAGE },
  ]);
  const [authToken, setAuthToken] = useState('');
  const [userId, setUserId] = useState('');
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [clipboardAvailable, setClipboardAvailable] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const loadAuth = async () => {
      const token = await AsyncStorage.getItem('authToken');
      const userStr = await AsyncStorage.getItem('user');
      let user = null;
      if (userStr) {
        try {
          user = JSON.parse(userStr);
        } catch (err) {
          console.error('Failed to parse user storage:', err);
        }
      }
      const id = user?.id || user?.email || '';
      setAuthToken(token || '');
      setUserId(id);
    };
    loadAuth();
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    try {
      // eslint-disable-next-line global-require
      require('expo-clipboard');
      setClipboardAvailable(true);
    } catch (err) {
      setClipboardAvailable(false);
    }
  }, []);

  const fetchChats = async () => {
    if (!authToken) return;
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${AI_CHATS_ENDPOINT}?userId=${encodeURIComponent(userId || '')}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load chat history:', err?.message || err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (authToken) fetchChats();
  }, [authToken, userId]);

  const openHistory = async () => {
    setShowHistory(true);
    await fetchChats();
  };

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([{ id: 'welcome', role: 'assistant', content: WELCOME_MESSAGE }]);
  };

  const loadChat = async (sessionId) => {
    if (!authToken) return;
    try {
      const res = await axios.get(`${AI_CHATS_ENDPOINT}/${sessionId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const session = res.data;
      const mapped = (session?.messages || []).map((m, idx) => ({
        id: `${m.role}_${idx}_${sessionId}`,
        role: m.role,
        content: m.content,
      }));
      setActiveSessionId(sessionId);
      setMessages(mapped.length ? mapped : [{ id: 'welcome', role: 'assistant', content: WELCOME_MESSAGE }]);
      setShowHistory(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to load chat history.');
    }
  };

  const deleteChat = async (sessionId) => {
    if (!authToken) return;
    try {
      await axios.delete(`${AI_CHATS_ENDPOINT}/${sessionId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (activeSessionId === sessionId) {
        startNewChat();
      }
      fetchChats();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete chat.');
    }
  };

  const deleteAllChats = async () => {
    if (!authToken) return;
    try {
      await axios.delete(AI_CHATS_ENDPOINT, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      startNewChat();
      fetchChats();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete chats.');
    }
  };

  const callGroqDirect = async (historyMessages) => {
    if (!GROQ_API_KEY) {
      throw new Error('Groq API key is not configured.');
    }
    const history = (historyMessages || []).slice(-12).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const payload = {
      model: GROQ_MODEL,
      temperature: 0.4,
      max_tokens: 512,
      messages: [
        { role: 'system', content: 'You are a medical-only assistant. Use conversation context for follow-ups. Refuse non-medical questions politely.' },
        ...history,
      ],
    };
    const resp = await axios.post(GROQ_DIRECT_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      timeout: 20000,
    });
    return resp?.data?.choices?.[0]?.message?.content || 'No response received.';
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    if (!authToken) {
      Alert.alert('Login Required', 'Please log in to use MediApp AI.');
      return;
    }

    const userMessage = { id: `u_${Date.now()}`, role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const resp = await axios.post(
        AI_RESPOND_ENDPOINT,
        { sessionId: activeSessionId, message: text, groqKey: GROQ_API_KEY || undefined },
        { headers: { Authorization: `Bearer ${authToken}` }, timeout: 20000 }
      );

      const content = resp?.data?.response || 'No response received.';
      const suggestions = Array.isArray(resp?.data?.suggestions) ? resp.data.suggestions : [];
      const sessionId = resp?.data?.sessionId || activeSessionId;

      setActiveSessionId(sessionId);
      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now() + 1}`,
          role: 'assistant',
          content,
          suggestions,
        },
      ]);
      fetchChats();
    } catch (err) {
      const detail =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Unknown error';

      // Fallback: if server lacks Groq key, call Groq directly
      const serverSessionId = err?.response?.data?.sessionId || activeSessionId;
      if (String(detail).toLowerCase().includes('groq_api_key is not configured')) {
        try {
          const content = await callGroqDirect(nextMessages);
          setMessages((prev) => [
            ...prev,
            { id: `a_${Date.now() + 10}`, role: 'assistant', content },
          ]);
          if (serverSessionId) {
            await axios.post(
              AI_APPEND_ENDPOINT,
              { sessionId: serverSessionId, role: 'assistant', content },
              { headers: { Authorization: `Bearer ${authToken}` }, timeout: 15000 }
            );
            setActiveSessionId(serverSessionId);
            fetchChats();
          }
          return;
        } catch (directErr) {
          const d =
            directErr?.response?.data?.error?.message ||
            directErr?.message ||
            'Groq error';
          setMessages((prev) => [
            ...prev,
            { id: `a_${Date.now() + 11}`, role: 'assistant', content: `Error: ${d}` },
          ]);
          return;
        } finally {
          setLoading(false);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now() + 2}`,
          role: 'assistant',
          content: `Error: ${detail}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderSuggestions = (suggestions) => {
    if (!suggestions || suggestions.length === 0) return null;
    return (
      <View style={styles.suggestionRow}>
        {suggestions.map((m) => (
          <TouchableOpacity
            key={m._id || m.name}
            style={styles.suggestionChip}
            onPress={() => navigation.navigate('MedicineDetail', { medicine: m })}
          >
            <Text style={styles.suggestionText}>{m.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const escapeRegExp = (str) => String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const renderMessageText = (item) => {
    try {
      if (!item?.content) return null;
      if (item.role !== 'assistant' || !Array.isArray(item.suggestions) || !item.suggestions.length) {
        return (
          <Text style={[styles.bubbleText, item.role === 'user' ? styles.userText : styles.assistantText]}>
            {item.content}
          </Text>
        );
      }

      const suggestionMap = new Map(
        item.suggestions
          .map((m) => [String(m.name || '').toLowerCase(), m])
          .filter(([k]) => k)
      );
      const names = Array.from(suggestionMap.keys()).sort((a, b) => b.length - a.length);
      if (!names.length) {
        return (
          <Text style={[styles.bubbleText, styles.assistantText]}>
            {item.content}
          </Text>
        );
      }
      const regex = new RegExp(`(${names.map(escapeRegExp).join('|')})`, 'gi');
      const parts = String(item.content).split(regex).filter((p) => p !== '');

      return (
        <Text style={[styles.bubbleText, styles.assistantText]}>
          {parts.map((part, idx) => {
            const key = part.toLowerCase();
            const med = suggestionMap.get(key);
            if (!med) {
              return <Text key={`${part}_${idx}`}>{part}</Text>;
            }
            return (
              <Text
                key={`${part}_${idx}`}
                style={styles.medicineLink}
                onPress={() => navigation.navigate('MedicineDetail', { medicine: med })}
              >
                {part}
              </Text>
            );
          })}
        </Text>
      );
    } catch (err) {
      return (
        <Text style={[styles.bubbleText, item?.role === 'user' ? styles.userText : styles.assistantText]}>
          {item?.content || ''}
        </Text>
      );
    }
  };

  const openActions = (item, index) => {
    setActionMessage({ ...item, index });
    setShowActions(true);
  };

  const handleCopy = async () => {
    if (!actionMessage?.content) return;
    try {
      // Lazy-load clipboard to avoid native module crash on older builds
      // eslint-disable-next-line global-require
      const Clipboard = require('expo-clipboard');
      await Clipboard.setStringAsync(actionMessage.content);
      Alert.alert('Copied', 'Message copied to clipboard.');
    } catch (err) {
      Alert.alert('Copy unavailable', 'Please update the app from the store to enable copy.');
    } finally {
      setShowActions(false);
    }
  };

  const handleEdit = () => {
    if (!actionMessage?.content) return;
    setInput(actionMessage.content);
    setShowActions(false);
    setTimeout(() => inputRef.current?.focus?.(), 50);
  };

  const styles = useMemo(
    () => getStyles(isDarkMode, width, height, insets, keyboardVisible),
    [isDarkMode, width, height, insets, keyboardVisible]
  );

  return (
      <View style={styles.container}>
        <LinearGradient colors={['#0ea5e9', '#1d4ed8']} style={styles.header}>
          <View style={styles.headerRow}>
            <FontAwesomeIcon icon={faStethoscope} size={22} color="#fff" />
            <Text style={styles.headerTitle}>MediApp AI</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={openHistory} style={styles.headerActionBtn}>
                <FontAwesomeIcon icon={faHistory} size={16} color="#fff" />
                <Text style={styles.headerActionText}>History</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={startNewChat} style={styles.headerActionBtn}>
                <FontAwesomeIcon icon={faPlus} size={16} color="#fff" />
                <Text style={styles.headerActionText}>New</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            Medical-only assistant. Store medicines are suggested first when relevant.
          </Text>
          <View style={styles.headerBadge}>
            <FontAwesomeIcon icon={faShieldAlt} size={12} color="#0ea5e9" />
            <Text style={styles.headerBadgeText}>Safety-first guidance</Text>
          </View>
        </LinearGradient>

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
            renderItem={({ item, index }) => (
              <TouchableOpacity
                activeOpacity={0.85}
                onLongPress={() => openActions(item, index)}
                style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}
              >
                {renderMessageText(item)}
                {item.role === 'assistant' ? renderSuggestions(item.suggestions) : null}
              </TouchableOpacity>
            )}
          />

          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={setInput}
              placeholder="Ask a medical question..."
              placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
              style={styles.input}
              multiline
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendBtn} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <FontAwesomeIcon icon={faPaperPlane} size={16} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <Modal visible={showActions} transparent animationType="fade" onRequestClose={() => setShowActions(false)}>
          <View style={styles.actionOverlay}>
            <View style={styles.actionSheet}>
              <Text style={styles.actionTitle}>Message options</Text>
              <View style={styles.actionRow}>
                {clipboardAvailable ? (
                  <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
                    <Text style={styles.actionBtnText}>Copy</Text>
                  </TouchableOpacity>
                ) : null}
                {actionMessage?.role === 'user' ? (
                  <TouchableOpacity style={styles.actionBtn} onPress={handleEdit}>
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <TouchableOpacity style={styles.actionCancelBtn} onPress={() => setShowActions(false)}>
                <Text style={styles.actionCancelText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={showHistory} transparent animationType="slide" onRequestClose={() => setShowHistory(false)}>
          <View style={styles.historyOverlay}>
            <View style={styles.historyModal}>
              <View style={styles.historyHeaderRow}>
                <Text style={styles.historyTitle}>Recent Chats</Text>
                <TouchableOpacity onPress={deleteAllChats} style={styles.historyClearBtn}>
                  <FontAwesomeIcon icon={faTrash} size={14} color="#fff" />
                  <Text style={styles.historyClearText}>Clear</Text>
                </TouchableOpacity>
              </View>
              {loadingHistory ? (
                <ActivityIndicator />
              ) : (
                <FlatList
                  data={sessions}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <View style={styles.historyItemRow}>
                      <TouchableOpacity style={styles.historyItem} onPress={() => loadChat(item._id)}>
                        <Text style={styles.historyItemTitle}>{item.title || 'Chat'}</Text>
                        <Text style={styles.historyItemSub} numberOfLines={1}>{item.lastMessage || ''}</Text>
                        <Text style={styles.historyItemDate}>
                          {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ''}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteChat(item._id)} style={styles.historyDeleteBtn}>
                        <FontAwesomeIcon icon={faTrash} size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                  ListEmptyComponent={<Text style={styles.historyEmpty}>No chats yet.</Text>}
                />
              )}
              <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.historyCloseBtn}>
                <Text style={styles.historyCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
  );
};

const MediAppAI = () => (
  <ScreenErrorBoundary>
    <MediAppAIInner />
  </ScreenErrorBoundary>
);

const getStyles = (isDarkMode, width, height, insets = { bottom: 0 }, keyboardVisible = false) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#0b0f1a' : '#f3f4f6',
    },
    header: {
      paddingTop: hp(6),
      paddingBottom: hp(3),
      paddingHorizontal: wp(5),
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      color: '#fff',
      fontSize: fontSize(20),
      fontWeight: '800',
      fontFamily: CHAT_FONT_BOLD,
      flex: 1,
      marginLeft: 10,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 10,
    },
    headerActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      gap: 6,
    },
    headerActionText: {
      color: '#fff',
      fontSize: fontSize(12),
      fontWeight: '700',
      fontFamily: CHAT_FONT_BOLD,
    },
    headerSubtitle: {
      color: 'rgba(255,255,255,0.9)',
      marginTop: 8,
      fontSize: fontSize(12),
      fontFamily: CHAT_FONT,
    },
    headerBadge: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      alignSelf: 'flex-start',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 999,
      gap: 6,
    },
    headerBadgeText: {
      color: '#0ea5e9',
      fontWeight: '700',
      fontSize: fontSize(12),
      fontFamily: CHAT_FONT_BOLD,
    },
    body: {
      flex: 1,
    },
    list: {
      padding: wp(5),
      paddingBottom: keyboardVisible ? hp(1) : insets.bottom + hp(2),
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
      backgroundColor: isDarkMode ? '#1f2937' : '#fff',
      borderWidth: 1,
      borderColor: isDarkMode ? '#111827' : '#e5e7eb',
    },
    bubbleText: {
      fontSize: fontSize(15),
      lineHeight: 22,
      fontFamily: CHAT_FONT,
      letterSpacing: 0.2,
    },
    userText: {
      color: '#fff',
      fontWeight: '600',
      fontFamily: CHAT_FONT_BOLD,
    },
    assistantText: {
      color: isDarkMode ? '#e5e7eb' : '#111827',
    },
    medicineLink: {
      color: '#2563eb',
      fontWeight: '700',
      textDecorationLine: 'underline',
      fontFamily: CHAT_FONT_BOLD,
    },
    suggestionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    suggestionChip: {
      backgroundColor: '#0ea5e9',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
    },
    suggestionText: {
      color: '#fff',
      fontSize: fontSize(12),
      fontWeight: '700',
      fontFamily: CHAT_FONT_BOLD,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: wp(4),
      paddingBottom: keyboardVisible ? hp(1) : insets.bottom,
      gap: 10,
      backgroundColor: 'transparent',
    },
    input: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111827' : '#fff',
      color: isDarkMode ? '#e5e7eb' : '#111827',
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      minHeight: hp(6),
      maxHeight: hp(16),
      borderWidth: 1,
      borderColor: isDarkMode ? '#1f2937' : '#e5e7eb',
      fontFamily: CHAT_FONT,
    },
    sendBtn: {
      backgroundColor: '#0ea5e9',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: wp(6),
    },
    actionSheet: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: isDarkMode ? '#0f172a' : '#fff',
      borderRadius: 18,
      padding: wp(5),
      borderWidth: 1,
      borderColor: isDarkMode ? '#1f2937' : '#e5e7eb',
    },
    actionTitle: {
      fontSize: fontSize(16),
      fontWeight: '800',
      color: isDarkMode ? '#fff' : '#111827',
      fontFamily: CHAT_FONT_BOLD,
      marginBottom: hp(1.5),
    },
    actionRow: {
      flexDirection: 'row',
      gap: 10,
    },
    actionBtn: {
      flex: 1,
      backgroundColor: '#0ea5e9',
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: 'center',
    },
    actionBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontFamily: CHAT_FONT_BOLD,
    },
    actionCancelBtn: {
      marginTop: hp(1.5),
      alignSelf: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    actionCancelText: {
      color: isDarkMode ? '#cbd5f5' : '#475569',
      fontWeight: '700',
      fontFamily: CHAT_FONT_BOLD,
    },
    historyOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    historyModal: {
      backgroundColor: isDarkMode ? '#0f172a' : '#fff',
      padding: wp(5),
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '70%',
    },
    historyTitle: {
      fontSize: fontSize(18),
      fontWeight: '800',
      color: isDarkMode ? '#fff' : '#111827',
      fontFamily: CHAT_FONT_BOLD,
      marginBottom: hp(1.5),
    },
    historyHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    historyClearBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ef4444',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      gap: 6,
    },
    historyClearText: {
      color: '#fff',
      fontSize: fontSize(12),
      fontWeight: '700',
      fontFamily: CHAT_FONT_BOLD,
    },
    historyItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    historyItem: {
      flex: 1,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#1f2937' : '#e5e7eb',
    },
    historyDeleteBtn: {
      padding: 8,
      borderRadius: 10,
      backgroundColor: isDarkMode ? '#1f2937' : '#fee2e2',
      borderWidth: 1,
      borderColor: isDarkMode ? '#111827' : '#fecaca',
    },
    historyItemTitle: {
      fontSize: fontSize(14),
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#111827',
      fontFamily: CHAT_FONT_BOLD,
    },
    historyItemSub: {
      fontSize: fontSize(12),
      color: isDarkMode ? '#cbd5f5' : '#6b7280',
      marginTop: 4,
      fontFamily: CHAT_FONT,
    },
    historyItemDate: {
      fontSize: fontSize(11),
      color: isDarkMode ? '#94a3b8' : '#9ca3af',
      marginTop: 4,
      fontFamily: CHAT_FONT,
    },
    historyEmpty: {
      textAlign: 'center',
      color: isDarkMode ? '#cbd5f5' : '#6b7280',
      marginVertical: hp(2),
      fontFamily: CHAT_FONT,
    },
    historyCloseBtn: {
      marginTop: hp(2),
      alignSelf: 'center',
      backgroundColor: '#0ea5e9',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 16,
    },
    historyCloseText: {
      color: '#fff',
      fontWeight: '700',
      fontFamily: CHAT_FONT_BOLD,
    },
  });

export default MediAppAI;
