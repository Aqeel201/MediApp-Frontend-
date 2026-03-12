import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text, Linking, StatusBar, ActivityIndicator } from 'react-native';
import { GiftedChat, Bubble, InputToolbar, Day, Time } from 'react-native-gifted-chat';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioRecorder, Audio, setAudioModeAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { Image as ImageIcon, Mic, Paperclip, Camera, ArrowLeft } from 'lucide-react-native';
import { useTheme } from './ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { wp, hp, fontSize } from './responsive';

const VERCEL_URL = 'https://dashboard-backend-xrss.vercel.app';
const LOCAL_URL = 'http://192.168.1.100:2000'; // Replace with your local IP
const SOCKET_URL = VERCEL_URL; // Toggle here

const Chat = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode, insets);

  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const recorder = useAudioRecorder({
    encoder: 'aac',
    sampleRate: 44100,
    bitRate: 128000,
    channels: 2,
  });

  useEffect(() => {
    const initChat = async () => {
      try {
        // Request audio permissions
        const { status } = await requestRecordingPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Microphone permission is required for voice messages.');
        }

        const token = await AsyncStorage.getItem('authToken');
        const userString = await AsyncStorage.getItem('user');

        if (!token || !userString) {
          console.error('Missing authToken or user');
          Alert.alert('Authentication Error', 'Please log in to access chat.');
          navigation.navigate('Login');
          return;
        }

        const user = JSON.parse(userString);
        const storedUserId = user.id;
        if (!storedUserId) {
          console.error('Missing userId in user object');
          Alert.alert('Authentication Error', 'Invalid user data. Please log in again.');
          navigation.navigate('Login');
          return;
        }

        console.log('Retrieved authToken:', token);
        console.log('Retrieved userId:', storedUserId);
        setUserId(storedUserId);
        setAuthToken(token);

        const isVercel = SOCKET_URL.includes('vercel.app');
        const socketInstance = io(SOCKET_URL, {
          query: { token },
          transports: isVercel ? ['polling'] : ['websocket', 'polling'], // Force polling on Vercel
          reconnection: true,
          reconnectionAttempts: 5,
        });

        console.log('Attempting to connect to:', SOCKET_URL, 'Mode:', isVercel ? 'Polling' : 'WebSocket');

        socketInstance.on('connect', () => {
          console.log('✅ Socket connected:', socketInstance.id);
          setIsSocketConnected(true);
          socketInstance.emit('join', storedUserId);
        });

        socketInstance.on('connect_error', (err) => {
          // Only log if not on Vercel or if it's a real error
          if (!isVercel) {
            console.warn('❌ Socket connection error:', err.message);
          }
          setIsSocketConnected(false);
        });

        socketInstance.on('error', (err) => {
          console.error('❌ Socket error:', err);
          setIsSocketConnected(false);
        });

        socketInstance.on('disconnect', () => {
          console.log('❌ Socket disconnected');
          setIsSocketConnected(false);
        });

        socketInstance.on('previousMessages', (previousMessages) => {
          console.log('Received previous messages (count):', previousMessages?.length);
          if (!Array.isArray(previousMessages)) {
            console.warn('previousMessages is not an array:', previousMessages);
            return;
          }
          const formattedMessages = previousMessages
            .map((msg) => {
              const msgId = msg._id || msg.id || Math.random().toString();
              const timestamp = msg.timestamp || msg.createdAt || new Date().toISOString();
              const senderId = msg.sender || msg.userId;

              if (!senderId) {
                console.warn('Skipping message without sender:', msg);
                return null;
              }

              const message = {
                _id: msgId,
                createdAt: new Date(timestamp),
                user: {
                  _id: senderId === storedUserId ? 1 : 2,
                  name: senderId === 'admin' ? 'Admin' : 'You'
                },
              };

              if (msg.type === 'text') {
                message.text = msg.content || msg.text || '';
              } else if (msg.type === 'image') {
                message.image = msg.content?.startsWith('http') ? msg.content : `${SOCKET_URL}${msg.content}`;
              } else if (msg.type === 'voice' || msg.type === 'document') {
                message.text = `[${msg.type.toUpperCase()}] ${msg.content?.split('/').pop() || 'File'}`;
                message.file = msg.content?.startsWith('http') ? msg.content : `${SOCKET_URL}${msg.content}`;
              }
              return message;
            })
            .filter((msg) => msg !== null)
            .reverse();
          console.log('Formatted messages (count):', formattedMessages.length);
          setMessages(formattedMessages);
        });

        socketInstance.on('receiveMessage', (msg) => {
          console.log('Received message:', JSON.stringify(msg, null, 2));
          const message = {
            _id: msg._id || Math.random().toString(),
            createdAt: new Date(msg.timestamp || Date.now()),
            user: { _id: msg.sender === storedUserId ? 1 : 2, name: msg.sender === 'admin' ? 'Admin' : 'You' },
          };
          if (msg.type === 'text') {
            message.text = msg.content;
          } else if (msg.type === 'image') {
            message.image = `${SOCKET_URL}${msg.content}`;
          } else if (msg.type === 'voice' || msg.type === 'document') {
            message.text = `[${msg.type.toUpperCase()}] ${msg.content.split('/').pop()}`;
            message.file = msg.content.startsWith('http') ? msg.content : `${SOCKET_URL}${msg.content}`;
          }
          setMessages((prev) => {
            // Prevent duplicates by checking _id
            if (prev.some((m) => m._id === msg._id)) {
              console.log('Duplicate message detected, skipping append:', msg._id);
              return prev;
            }
            console.log('Appending message:', message);
            return GiftedChat.append(prev, [message]);
          });
        });

        // Initialize audio mode
        await setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        setSocket(socketInstance);
        setIsLoading(false);

        // Polling Fallback: Fetch messages every 3 seconds
        const fetchMessages = async () => {
          if (!token || !storedUserId) return;
          try {
            const response = await axios.get(`${SOCKET_URL}/api/messages/admin`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data && Array.isArray(response.data)) {
              const formatted = response.data.map(msg => {
                const msgId = msg._id || msg.id || Math.random().toString();
                const timestamp = msg.timestamp || msg.createdAt || new Date().toISOString();
                const senderId = msg.sender || msg.userId;
                return {
                  _id: msgId,
                  createdAt: new Date(timestamp),
                  user: {
                    _id: (senderId === storedUserId || senderId === userId) ? 1 : 2,
                    name: (senderId === 'admin' || senderId !== storedUserId) ? 'Admin' : 'You'
                  },
                  text: msg.type === 'text' ? (msg.content || msg.text || '') : `[${msg.type.toUpperCase()}] ${msg.content?.split('/').pop() || 'File'}`,
                  image: msg.type === 'image' ? (msg.content?.startsWith('http') ? msg.content : `${SOCKET_URL}${msg.content}`) : undefined,
                  file: (msg.type === 'voice' || msg.type === 'document') ? (msg.content?.startsWith('http') ? msg.content : `${SOCKET_URL}${msg.content}`) : undefined,
                };
              });

              setMessages(prev => {
                const newMsgs = formatted.filter(m => !prev.some(p => p._id === m._id));
                if (newMsgs.length > 0) {
                  const newestAdminMsg = newMsgs.find(m => m.user._id === 2);
                  return GiftedChat.append(prev, newMsgs.reverse());
                }
                return prev;
              });
            }
          } catch (error) {
            // Silently handle polling errors
          }
        };

        // Initial fetch
        fetchMessages();
        const pollingInterval = setInterval(fetchMessages, 3000);

        // Cleanup on unmount
        return () => {
          console.log('Cleaning up chat resources');
          socketInstance.disconnect();
          clearInterval(pollingInterval);
        };
      } catch (error) {
        console.error('Error initializing chat:', error);
        Alert.alert('Error', 'Failed to initialize chat. Please try again.');
        navigation.navigate('Login');
        setIsLoading(false);
      }
    };

    initChat();
  }, [navigation]);

  const onSend = useCallback(
    (newMessages = []) => {
      if (!userId || !authToken) {
        console.error('Cannot send message: userId or authToken missing');
        Alert.alert('Error', 'Unable to send message. Please log in again.');
        return;
      }
      newMessages.forEach(async (msg) => {
        const messageData = {
          receiver: 'admin',
          type: 'text',
          content: msg.text,
        };

        console.log('Sending message via POST:', JSON.stringify(messageData, null, 2));
        try {
          const response = await axios.post(`${SOCKET_URL}/api/chat/send`, messageData, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          console.log('POST message response:', response.data);
          // Socket (if connected) or Polling will handle receiving the message back
        } catch (error) {
          console.error('Failed to send message via POST:', error.message);
          Alert.alert('Error', 'Failed to send message: ' + (error.response?.data?.error || error.message));
        }
      });
    },
    [userId, authToken]
  );

  const startRecording = async () => {
    try {
      if (isRecording) return;
      console.log('Starting recording...');
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    console.log('Stopping recording...');
    try {
      recorder.stop();
      const uri = recorder.uri;
      setIsRecording(false);

      if (!uri) {
        throw new Error('Recording URI is null');
      }

      // Send the recorded audio
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'audio/m4a',
        name: `voice_${Date.now()}.m4a`,
      });
      formData.append('userId', userId);
      formData.append('type', 'voice');
      formData.append('receiver', 'admin');

      const response = await axios.post(`${SOCKET_URL}/chat/upload`, formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Voice message uploaded:', response.data);
    } catch (err) {
      console.error('Error stopping or uploading recording:', err);
      Alert.alert('Error', 'Failed to send voice message.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (result.canceled) return;

      const { uri, fileName, type } = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: fileName || `photo_${Date.now()}.jpg`,
      });
      formData.append('userId', userId);
      formData.append('type', 'image');
      formData.append('receiver', 'admin');

      const response = await axios.post(`${SOCKET_URL}/chat/upload`, formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Photo uploaded:', response.data);
    } catch (err) {
      console.error('Error taking/uploading photo:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to upload photo.');
    }
  };

  const pickFile = async (type) => {
    try {
      let mimeTypes;
      switch (type) {
        case 'image':
          mimeTypes = 'image/*';
          break;
        case 'document':
          mimeTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
          break;
        default:
          return;
      }

      const res = await DocumentPicker.getDocumentAsync({
        type: mimeTypes,
        copyToCacheDirectory: true,
      });

      if (res.canceled) {
        console.log(`${type} selection cancelled`);
        return;
      }

      const { uri, mimeType, name } = res.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: mimeType,
        name: name || `${type}_${Date.now()}.${mimeType.split('/')[1]}`,
      });
      formData.append('userId', userId);
      formData.append('type', type);
      formData.append('receiver', 'admin');

      const response = await axios.post(`${SOCKET_URL}/chat/upload`, formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log(`${type} uploaded:`, response.data);
    } catch (err) {
      console.error(`Error uploading ${type}:`, err.response?.data || err.message);
      Alert.alert('Error', `Failed to upload ${type}: ` + (err.response?.data?.message || err.message));
    }
  };

  const renderBubble = (props) => {
    const { currentMessage } = props;
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#007AFF',
            borderRadius: 20,
            padding: 10,
            marginVertical: 5,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 5,
            elevation: 2,
          },
          left: {
            backgroundColor: '#E5E5EA',
            borderRadius: 20,
            padding: 10,
            marginVertical: 5,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 5,
            elevation: 2,
          },
        }}
        textStyle={{
          right: { color: '#FFF', fontSize: 16, fontFamily: 'System' },
          left: { color: '#000', fontSize: 16, fontFamily: 'System' },
        }}
        renderCustomView={() => {
          if (currentMessage.file) {
            return (
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await Linking.openURL(currentMessage.file);
                  } catch (error) {
                    Alert.alert('Error', 'Failed to open file.');
                  }
                }}
                style={styles.fileContainer}
              >
                <Text style={styles.fileText}>{currentMessage.text}</Text>
              </TouchableOpacity>
            );
          }
          return null;
        }}
      />
    );
  };

  const renderDay = (props) => (
    <Day
      {...props}
      textStyle={{ color: '#888', fontSize: 12, fontWeight: 'bold' }}
    />
  );

  const renderTime = (props) => (
    <Time
      {...props}
      timeTextStyle={{
        right: { color: '#fff', fontSize: 10 },
        left: { color: '#000', fontSize: 10 },
      }}
    />
  );

  const renderInputToolbar = (props) => (
    <InputToolbar
      {...props}
      containerStyle={styles.inputToolbar}
      renderActions={() => (
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={() => pickFile('image')}>
            <ImageIcon size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={takePhoto}>
            <Camera size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPressIn={startRecording}
            onPressOut={stopRecording}
          >
            <Mic size={24} color={isRecording ? '#FF0000' : '#007AFF'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => pickFile('document')}>
            <Paperclip size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}
    />
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, color: isDarkMode ? '#fff' : '#000' }}>Loading chat...</Text>
      </View>
    );
  }




  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={isDarkMode ? "white" : "#007AFF"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat with Admin</Text>
        <View style={{ width: 40 }} />
      </View>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{ _id: 1, name: 'You' }}
        renderBubble={renderBubble}
        renderDay={renderDay}
        renderTime={renderTime}
        showAvatarForEveryMessage={false}
        renderUsernameOnMessage={true}
        renderInputToolbar={renderInputToolbar}
      />
    </View>
  );
};

const getStyles = (isDarkMode, insets = { top: 0, bottom: 0 }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#1c1c1c' : '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingTop: insets.top + hp(1),
    paddingBottom: hp(1.5),
    backgroundColor: isDarkMode ? '#1c1c1c' : '#fff',
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#333' : '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: fontSize(20),
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#007AFF',
  },
  inputToolbar: {
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? '#444' : '#E5E5EA',
    backgroundColor: isDarkMode ? '#1c1c1c' : '#fff',
    paddingBottom: insets.bottom > 0 ? insets.bottom - 10 : 0, // Ensure gap on bottom for home indicator
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    gap: wp(3),
  },
  fileContainer: {
    padding: 10,
    backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f0f0',
    borderRadius: 10,
  },
  fileText: {
    color: '#007AFF',
    fontSize: fontSize(14),
  },
});

export default Chat;
