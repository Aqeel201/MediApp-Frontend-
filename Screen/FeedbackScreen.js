import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Animated,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faStar } from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { CartContext } from './CartContext';

const FeedbackScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { userId } = useContext(CartContext);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const scaleAnim = useRef(new Animated.Value(1)).current; // Animation for submit button

  const API_URL = 'http://192.168.18.24:2000/api/feedback';
  const IMAGE_BASE_URL = 'http://192.168.18.24:3000/uploads/';

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userData = await AsyncStorage.getItem('user');
        console.log('Checking login status:', { token: !!token, userData: !!userData, userId });
        if (token && userData) {
          const user = JSON.parse(userData);
          if (user.id && user.email) {
            setUserEmail(user.email);
            setUserName(`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0]);
            setProfileImage(user.profileImage || null);
            setIsLoggedIn(true);
            console.log('Login verified:', { email: user.email, userId: user.id, profileImage: user.profileImage, userName: `${user.firstName || ''} ${user.lastName || ''}` });
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

  const handleAuthError = (message) => {
    setIsLoggedIn(false);
    Alert.alert('Authentication Error', message, [
      { text: 'OK', onPress: () => navigation.navigate('Login') },
    ]);
  };

  const handleStarPress = (star) => {
    if (!isLoggedIn) {
      handleAuthError('Please log in to submit feedback.');
      return;
    }
    setRating(star);
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      handleAuthError('Please log in to submit feedback.');
      return;
    }
    if (!feedback || !rating) {
      Alert.alert('Error', 'Please provide feedback and a rating.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        handleAuthError('Authentication token not found. Please log in again.');
        return;
      }
      const response = await axios.post(
        API_URL,
        { rating, comment: feedback },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newFeedback = response.data.feedback;
      if (!newFeedback || !newFeedback._id) {
        throw new Error('Invalid feedback response from server');
      }
      setFeedback('');
      setRating(0);
      Alert.alert('Success', 'Feedback submitted successfully!');
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Submit feedback error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.status === 401 || error.response?.status === 404) {
        handleAuthError('Session expired or user not found. Please log in again.');
      } else {
        Alert.alert('Error', 'Failed to submit feedback. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStar = (filled) => (
    <FontAwesomeIcon icon={faStar} size={32} color={filled ? '#FFD700' : isDarkMode ? '#555' : '#ccc'} />
  );

  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDarkMode ? ['#1c1c1c', '#121212'] : ['#0d6efd', '#4682b4']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon={faArrowLeft} size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Feedback</Text>
      </LinearGradient>
      <View style={styles.content}>
        <Text style={styles.title}>We Value Your Feedback!</Text>
        <View style={styles.userInfoContainer}>
          {profileImage ? (
            <Image
              source={{ uri: `${IMAGE_BASE_URL}${profileImage}` }}
              style={styles.profileImage}
              onError={() => setProfileImage(null)}
            />
          ) : (
            <Image
              source={require('../assets/default-profile.png')}
              style={styles.profileImage}
            />
          )}
          <View style={styles.userInfoText}>
            <Text style={styles.userName}>{isLoggedIn ? userName : 'Not logged in'}</Text>
            <Text style={styles.userInfo}>{isLoggedIn ? userEmail : ''}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Rate Our App</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => handleStarPress(star)}
              disabled={isLoading || !isLoggedIn}
            >
              {renderStar(star <= rating)}
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.feedbackInput}
          value={feedback}
          onChangeText={setFeedback}
          placeholder="Write your feedback here..."
          placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
          multiline
          editable={!isLoading && isLoggedIn}
        />
        <Pressable
          onPress={handleSubmit}
          disabled={isLoading || !isLoggedIn}
          onPressIn={() =>
            Animated.timing(scaleAnim, {
              toValue: 0.95,
              duration: 100,
              useNativeDriver: true,
            }).start()
          }
          onPressOut={() =>
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }).start()
          }
        >
          <Animated.View style={[styles.submitButton, { transform: [{ scale: scaleAnim }] }, (isLoading || !isLoggedIn) && styles.submitButtonDisabled]}>
            <LinearGradient
              colors={['#0d6efd', '#1e90ff']}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Submitting...' : isLoggedIn ? 'Submit Feedback' : 'Log in to Submit'}
              </Text>
            </LinearGradient>
          </Animated.View>
        </Pressable>
        <TouchableOpacity
          style={styles.viewFeedbackButton}
          onPress={() => navigation.navigate('UserFeedback')}
        >
          <LinearGradient
            colors={['#0d6efd', '#1e90ff']}
            style={styles.viewFeedbackButtonGradient}
          >
            <Text style={styles.viewFeedbackButtonText}>View Other Feedback</Text>
          </LinearGradient>
        </TouchableOpacity>
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
    userInfoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: isDarkMode ? '#444' : '#ccc',
      backgroundColor: '#eaeaea',
      marginRight: 10,
    },
    userInfoText: {
      flex: 1,
    },
    userName: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#333',
      marginBottom: 5,
    },
    userInfo: {
      fontSize: 14,
      color: isDarkMode ? '#aaa' : '#666',
      fontStyle: 'italic',
    },
    subtitle: {
      fontSize: 22,
      fontWeight: '600',
      color: isDarkMode ? '#ddd' : '#444',
      marginTop: 15,
      marginBottom: 10,
    },
    starsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 25,
      gap: 10,
    },
    feedbackInput: {
      borderColor: isDarkMode ? '#444' : '#ccc',
      borderWidth: 1,
      borderRadius: 15,
      padding: 15,
      marginBottom: 20,
      color: isDarkMode ? '#fff' : '#222',
      backgroundColor: isDarkMode ? '#222' : '#fff',
      minHeight: 130,
      textAlignVertical: 'top',
      fontSize: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 3,
    },
    submitButton: {
      borderRadius: 15,
      overflow: 'hidden',
      marginBottom: 15,
    },
    submitButtonGradient: {
      padding: 15,
      alignItems: 'center',
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
    viewFeedbackButton: {
      borderRadius: 15,
      overflow: 'hidden',
      marginBottom: 25,
    },
    viewFeedbackButtonGradient: {
      padding: 15,
      alignItems: 'center',
    },
    viewFeedbackButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
  });

export default FeedbackScreen;