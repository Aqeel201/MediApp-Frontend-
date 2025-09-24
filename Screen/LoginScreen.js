// Screen/LoginScreen.js
import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Animated,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from './ThemeContext';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';
import { CartContext } from './CartContext';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { refreshUser } = useContext(CartContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animated value for background image
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: -width,
          duration: 10000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 10000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Validation Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        'http://192.168.18.24:2000/api/auth/login',
        { email, password }
      );
      if (response.status === 200) {
        const token = response.data.token;
        const user = response.data.user;
        if (!user) {
          Alert.alert('Login Failed', 'User details not received from server.');
          setLoading(false);
          return;
        }
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        refreshUser && refreshUser();
        Alert.alert('Success', 'Login successful.');
        navigation.navigate('Home');
      } else {
        Alert.alert('Login Failed', response.data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        error.response?.data?.message || 'An unexpected error occurred.'
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Animated.Image
        source={require('../assets/backround2.jpg')}
        style={[
          styles.backgroundImage,
          { transform: [{ translateX: animatedValue }] },
        ]}
        resizeMode="cover"
      />

      {/* Overlay with semi-transparent dark layer */}
      <View style={styles.overlay}>
        {/* StatusBar for transparent overlay */}
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent hidden
        />

        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={
            Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0
          }
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/Logo.png')}
                style={styles.logo}
              />
              <Text style={styles.logoText}>MediApp</Text>
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              <Text style={styles.title}>Welcome Back</Text>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Icon
                  name="envelope"
                  size={20}
                  color={isDarkMode ? '#aaa' : '#333'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
                  value={email}
                  onChangeText={(text) => setEmail(text.toLowerCase())}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Icon
                  name="lock"
                  size={20}
                  color={isDarkMode ? '#aaa' : '#333'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  textContentType="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.togglePassword}
                >
                  <Icon
                    name={showPassword ? 'eye-slash' : 'eye'}
                    size={20}
                    color="#0d6efd"
                  />
                </TouchableOpacity>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                onPress={() => navigation.navigate('ChangePassword')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>Log In</Text>
                )}
              </TouchableOpacity>

              {/* Signup Navigation */}
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signupText}>
                  Don't have an account?{' '}
                  <Text style={styles.signupTextHighlight}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

const getStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    backgroundImage: {
      position: 'absolute',
      width: width * 2,
      height: height,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    keyboardAvoiding: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    logo: {
      width: 80,
      height: 80,
      marginBottom: 10,
      borderRadius: 15,
    },
    logoText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#fff',
    },
    formContainer: {
      width: '100%',
      backgroundColor: 'rgba(255,255,255,0.95)',
      padding: 20,
      borderRadius: 10,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 20,
      color: isDarkMode ? '#bbb' : '#333',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
      borderWidth: 1,
      borderColor: isDarkMode ? '#555' : '#ccc',
      borderRadius: 10,
      backgroundColor: isDarkMode ? '#333' : '#fff',
      paddingHorizontal: 10,
    },
    input: {
      flex: 1,
      height: 50,
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#333',
    },
    inputIcon: {
      marginRight: 10,
    },
    togglePassword: {
      padding: 10,
    },
    forgotPasswordText: {
      color: '#0d6efd',
      fontSize: 16,
      textAlign: 'right',
      marginBottom: 20,
    },
    loginButton: {
      backgroundColor: '#0d6efd',
      height: 50,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
    },
    loginButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
    signupText: {
      color: isDarkMode ? '#fff' : '#333',
      fontSize: 16,
      textAlign: 'center',
    },
    signupTextHighlight: {
      color: '#0d6efd',
      fontWeight: 'bold',
    },
  });

export default LoginScreen;
