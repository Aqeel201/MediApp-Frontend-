import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Animated,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { StatusBar } from 'expo-status-bar';

const UserFeedbackScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [feedbackList, setFeedbackList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current; // Animation for feedback items

  const API_URL = 'https://auth-backend-three-navy.vercel.app/api/feedback';
  const IMAGE_BASE_URL = 'https://auth-backend-three-navy.vercel.app/uploads/';

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userData = await AsyncStorage.getItem('user');
        console.log('Checking login status:', { token: !!token, userData: !!userData });
        if (token && userData) {
          const user = JSON.parse(userData);
          if (user.id && user.email) {
            console.log('Login verified:', { email: user.email, userId: user.id });
            await fetchFeedback(token);
          } else {
            console.log('Invalid user data:', user);
            handleAuthError('Invalid user data. Please log in again.');
          }
        } else {
          console.log('Missing auth data:', { token, userData });
          handleAuthError('Authentication required. Please log in.');
        }
      } catch (error) {
        console.error('AsyncStorage error:', error);
        handleAuthError('Failed to load user data. Please log in again.');
      }
    };
    checkLoginStatus();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [feedbackList]);

  const handleAuthError = (message) => {
    Alert.alert('Authentication Error', message, [
      { text: 'OK', onPress: () => navigation.navigate('Login') },
    ]);
  };

  const fetchFeedback = async (token) => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedbackList(response.data);
      console.log('Feedback fetched:', response.data.length, 'items', response.data);
    } catch (error) {
      console.error('Fetch feedback error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.status === 401 || error.response?.status === 404) {
        handleAuthError('Session expired or user not found. Please log in again.');
      } else {
        Alert.alert('Error', 'Failed to fetch feedback. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        await fetchFeedback(token);
      } else {
        handleAuthError('Authentication token not found. Please log in again.');
      }
    } catch (error) {
      console.error('Refresh feedback error:', error);
      Alert.alert('Error', 'Failed to refresh feedback. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const renderFeedbackItem = ({ item }) => (
    <Animated.View style={[styles.feedbackItem, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={isDarkMode ? ['#2a2a2a', '#1c1c1c'] : ['#ffffff', '#f0f0f0']}
        style={styles.feedbackCard}
      >
        <View style={styles.feedbackHeader}>
          {item.userProfileImage ? (
            <Image
              source={{ uri: item.userProfileImage }}
              style={styles.feedbackProfileImage}
              onError={() => console.log('Failed to load profile image for:', item.userName)}
            />
          ) : (
            <Image
              source={require('../assets/default-profile.png')}
              style={styles.feedbackProfileImage}
            />
          )}
          <View style={styles.feedbackInfo}>
            <Text style={styles.feedbackUser}>{item.userName}</Text>
            <Text style={styles.feedbackDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.feedbackRating}>
          <Text style={styles.feedbackRatingStars}>{'★'.repeat(item.rating)}</Text>
          <Text style={styles.feedbackRatingEmpty}>{'★'.repeat(5 - item.rating)}</Text>
        </View>
        <Text style={styles.feedbackText}>{item.comment}</Text>
      </LinearGradient>
    </Animated.View>
  );

  const styles = getStyles(isDarkMode, insets);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDarkMode ? ['#1c1c1c', '#121212'] : ['#0d6efd', '#4682b4']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon={faArrowLeft} size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>User Feedback</Text>
      </LinearGradient>
      <View style={styles.content}>
        <Text style={styles.title}>User Feedback</Text>
        <FlatList
          data={feedbackList}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderFeedbackItem}
          ListEmptyComponent={<Text style={styles.noFeedbackText}>No feedback available.</Text>}
          contentContainerStyle={styles.feedbackList}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={isDarkMode ? ['#fff'] : ['#0d6efd']}
            />
          }
        />
      </View>
    </View>
  );
};

const getStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      paddingTop: 40,
      borderBottomWidth: 0,
    },
    headerText: {
      fontSize: 26,
      fontWeight: '700',
      color: '#fff',
      marginLeft: 10,
    },
    iconButton: {
      padding: 10,
    },
    content: {
      padding: 20,
      flex: 1,
    },
    title: {
      fontSize: 30,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#222',
      marginBottom: 15,
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    feedbackList: {
      paddingBottom: 30,
    },
    feedbackItem: {
      marginBottom: 15,
    },
    feedbackCard: {
      borderRadius: 15,
      padding: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 3,
    },
    feedbackHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    feedbackProfileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? '#444' : '#ccc',
      backgroundColor: '#eaeaea',
    },
    feedbackInfo: {
      flex: 1,
    },
    feedbackUser: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#333',
    },
    feedbackDate: {
      fontSize: 14,
      color: isDarkMode ? '#aaa' : '#666',
      fontStyle: 'italic',
    },
    feedbackRating: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    feedbackRatingStars: {
      color: '#FFD700',
      fontSize: 20,
    },
    feedbackRatingEmpty: {
      color: isDarkMode ? '#555' : '#ccc',
      fontSize: 20,
    },
    feedbackText: {
      color: isDarkMode ? '#ddd' : '#333',
      fontSize: 16,
      lineHeight: 24,
    },
    noFeedbackText: {
      color: isDarkMode ? '#aaa' : '#666',
      fontSize: 16,
      textAlign: 'center',
      marginTop: 20,
    },
  });

export default UserFeedbackScreen;