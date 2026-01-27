import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text, Linking } from 'react-native';
import { GiftedChat, Bubble, InputToolbar, Day, Time } from 'react-native-gifted-chat';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioRecorder, Audio, setAudioModeAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import axios from 'axios';
import { Image as ImageIcon, Mic, Paperclip } from 'lucide-react-native';

const VERCEL_URL = 'https://dashboard-backend-xrss.vercel.app';
const LOCAL_URL = 'http://192.168.1.100:2000'; // Replace with your local IP
const SOCKET_URL = VERCEL_URL; // Toggle here

const Chat = ({ navigation }) => {
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

        const socketInstance = io(SOCKET_URL, {
          query: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
        });

        console.log('Attempting to connect to:', SOCKET_URL, 'with token:', token);

        socketInstance.on('connect', () => {
          console.log('✅ Socket connected:', socketInstance.id);
          setIsSocketConnected(true);
          socketInstance.emit('join', storedUserId);
        });

        socketInstance.on('connect_error', (err) => {
          console.warn('❌ Socket connection error (expected on Vercel):', err.message);
          setIsSocketConnected(false);
          // Removed Alert to prevent spamming user on Vercel
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
            message.file = `${SOCKET_URL}${msg.content}`;
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

        // Polling Fallback: Fetch messages every 5 seconds if socket is not connected or as a safety
        const pollingInterval = setInterval(async () => {
          if (!token || !storedUserId) return;
          console.log('Polling for new messages...');
          try {
            const response = await axios.get(`${SOCKET_URL}/api/messages/admin`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data && Array.isArray(response.data)) {
              const fetchedMessages = response.data;
              const formatted = fetchedMessages.map(msg => {
                const msgId = msg._id || msg.id || Math.random().toString();
                const timestamp = msg.timestamp || msg.createdAt || new Date().toISOString();
                const senderId = msg.sender || msg.userId;

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
              });

              setMessages(prev => {
                const newMsgs = formatted.filter(m => !prev.some(p => p._id === m._id));
                if (newMsgs.length > 0) {
                  console.log(`Polling added ${newMsgs.length} new messages`);
                  return GiftedChat.append(prev, newMsgs.reverse());
                }
                return prev;
              });
            }
          } catch (error) {
            console.warn('Polling failed:', error.message);
          }
        }, 5000);

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
      if (!socket || !userId) {
        console.error('Cannot send message: socket or userId missing');
        Alert.alert('Error', 'Unable to send message. Please try again.');
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
          // Socket will emit receiveMessage which will append to state
        } catch (error) {
          console.error('Failed to send message via POST:', error.message);
          Alert.alert('Error', 'Failed to send message: ' + (error.response?.data?.error || error.message));
        }
      });
    },
    [socket, userId]
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
      await recorder.stopAsync();
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
        <GiftedChat
          messages={[]}
          user={{ _id: 1 }}
          renderInputToolbar={() => null}
        />
        <View style={StyleSheet.absoluteFill}>
          <Text style={{ alignSelf: 'center', marginTop: '50%' }}>Loading chat...</Text>
        </View>
      </View>
    );
  }

  console.log('Rendering GiftedChat with messages:', JSON.stringify(messages, null, 2));

  return (
    <View style={styles.container}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inputToolbar: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    padding: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    gap: 10,
  },
  fileContainer: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  fileText: {
    color: '#007AFF',
    fontSize: 14,
  },
});

export default Chat;