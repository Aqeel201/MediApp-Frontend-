import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { GiftedChat, Bubble, InputToolbar } from 'react-native-gifted-chat';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SOCKET_URL = 'http://192.168.18.24:2000'; // Backend URL

const Chat = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    const initChat = async () => {
      try {
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
          console.error('❌ Socket connection error:', err.message);
          Alert.alert('Connection Error', 'Failed to connect to chat server. Please try again.');
        });

        socketInstance.on('receiveMessage', (msg) => {
          console.log('Received new message:', msg);
          const message = {
            _id: msg._id,
            createdAt: new Date(msg.timestamp),
            user: { _id: msg.sender === storedUserId ? 1 : 2, name: msg.sender === 'admin' ? 'Admin' : 'You' },
          };
          if (msg.type === 'text') {
            message.text = msg.content;
          } else if (msg.type === 'image') {
            message.image = `${SOCKET_URL}${msg.content}`;
          }
          setMessages((prev) => GiftedChat.append(prev, [message]));
        });

        // Fetch previous messages
        try {
          const response = await axios.get(`${SOCKET_URL}/api/messages/admin`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Received previous messages:', response.data.length);
          setMessages(
            response.data
              .map((msg) => {
                const message = {
                  _id: msg._id,
                  createdAt: new Date(msg.timestamp),
                  user: { _id: msg.sender === storedUserId ? 1 : 2, name: msg.sender === 'admin' ? 'Admin' : 'You' },
                };
                if (msg.type === 'text') {
                  message.text = msg.content;
                } else if (msg.type === 'image') {
                  message.image = `${SOCKET_URL}${msg.content}`;
                }
                return message;
              })
              .reverse()
          );
        } catch (err) {
          console.error('Error fetching previous messages:', err);
          Alert.alert('Error', 'Failed to load previous messages.');
        }

        setSocket(socketInstance);

        return () => {
          console.log('Disconnecting socket');
          socketInstance.disconnect();
        };
      } catch (error) {
        console.error('Error initializing chat:', error);
        Alert.alert('Error', 'Failed to initialize chat. Please try again.');
        navigation.navigate('Login');
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
        };
        console.log('Sending message:', message);
        socket.emit('sendMessage', message);
      });
    },
    [socket, userId]
  );

  const pickImage = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (res.canceled) {
        console.log('Image selection cancelled');
        return;
      }

      const { uri, mimeType, name } = res.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: mimeType,
        name: name || `image_${Date.now()}.jpg`,
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

      console.log('Image uploaded:', response.data);
    } catch (err) {
      console.error('Error uploading image:', err);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  const renderBubble = (props) => {
    const { currentMessage } = props;
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: { backgroundColor: '#007AFF' },
          left: { backgroundColor: '#E5E5EA' },
        }}
        textStyle={{
          right: { color: '#FFF' },
          left: { color: '#000' },
        }}
      />
    );
  };

  const renderInputToolbar = (props) => (
    <InputToolbar
      {...props}
      containerStyle={styles.inputToolbar}
      renderActions={() => (
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={pickImage}>
            <Icon name="image" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}
    />
  );

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{ _id: 1, name: 'You' }}
        renderBubble={renderBubble}
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
});

export default Chat;