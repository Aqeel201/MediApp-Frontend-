import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text, Linking } from 'react-native';
import { GiftedChat, Bubble, InputToolbar, Day, Time } from 'react-native-gifted-chat';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SOCKET_URL = 'http://192.168.18.24:2000'; // Backend URL

const Chat = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const initChat = async () => {
      try {
        // Request audio permissions
        const { status } = await Audio.requestPermissionsAsync();
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
        });

        console.log('Attempting to connect to:', SOCKET_URL, 'with token:', token);

        socketInstance.on('connect', () => {
          console.log('✅ Socket connected:', socketInstance.id);
          socketInstance.emit('join', storedUserId);
        });

        socketInstance.on('connect_error', (err) => {
          console.error('❌ Socket connection error:', err.message, err);
          Alert.alert('Connection Error', `Failed to connect to chat server: ${err.message}`);
        });

        socketInstance.on('error', (err) => {
          console.error('❌ Socket error:', err);
          Alert.alert('Socket Error', 'An error occurred with the socket connection.');
        });

        socketInstance.on('previousMessages', (previousMessages) => {
          console.log('Received previous messages:', previousMessages);
          const formattedMessages = previousMessages
            .map((msg) => {
              if (!msg._id || !msg.timestamp || !msg.sender) {
                console.warn('Skipping invalid message:', msg);
                return null;
              }
              const message = {
                _id: msg._id,
                createdAt: new Date(msg.timestamp),
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
              return message;
            })
            .filter((msg) => msg !== null)
            .reverse();
          console.log('Formatted messages:', formattedMessages);
          setMessages(formattedMessages);
        });

        socketInstance.on('receiveMessage', (msg) => {
          console.log('Received message:', JSON.stringify(msg, null, 2));
          const message = {
            _id: msg._id,
            createdAt: new Date(msg.timestamp),
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

        setSocket(socketInstance);
        setIsLoading(false);

        // Cleanup on unmount
        return () => {
          console.log('Disconnecting socket');
          socketInstance.disconnect();
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
      newMessages.forEach((msg) => {
        const message = {
          sender: userId,
          receiver: 'admin',
          type: 'text',
          content: msg.text,
          timestamp: new Date().toISOString(),
        };
        console.log('Sending message:', JSON.stringify(message, null, 2));
        socket.emit('sendMessage', message, (ack) => {
          console.log('Server acknowledgment:', ack);
          if (ack?.error) {
            Alert.alert('Error', 'Failed to send message: ' + ack.error);
          }
        });
      });
    },
    [socket, userId]
  );

  const startRecording = async () => {
    try {
      if (isRecording) return;
      console.log('Starting recording...');
      const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    if (!recording || !isRecording) return;
    console.log('Stopping recording...');
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsRecording(false);
      setRecording(null);

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
            <Icon name="image" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPressIn={startRecording}
            onPressOut={stopRecording}
          >
            <Icon name="mic" size={24} color={isRecording ? '#FF0000' : '#007AFF'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => pickFile('document')}>
            <Icon name="attach-file" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading chat...</Text>
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