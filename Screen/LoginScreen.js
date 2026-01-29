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
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from './ThemeContext';
import { Mail, Lock, Eye, EyeOff, Fingerprint } from 'lucide-react-native';
import axios from 'axios';
import * as LocalAuthentication from 'expo-local-authentication';
import { CartContext } from './CartContext';
import { wp, hp, fontSize } from './responsive';


const LoginScreen = () => {
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { refreshUser } = useContext(CartContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);

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

    const checkBiometrics = async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricAvailable(hasHardware && isEnrolled);

      const enabled = await AsyncStorage.getItem('isBiometricsEnabled');
      setIsBiometricsEnabled(enabled === 'true');
    };
    checkBiometrics();
  }, [animatedValue, width]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Validation Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        'https://auth-backend-three-navy.vercel.app/api/auth/login',
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

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with Biometrics',
        fallbackLabel: 'Enter Password',
      });

      if (result.success) {
        setLoading(true);
        // In a real app, you'd use a securely stored token or credentials.
        // For this demo, we'll assume we can retrieve the last used user/token if they exist.
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedUser) {
          refreshUser && refreshUser();
          Alert.alert('Success', 'Biometric Login successful.');
          navigation.navigate('Home');
        } else {
          Alert.alert('Account Required', 'Please log in manually first to enable biometrics.');
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert('Error', 'Biometric authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const styles = React.useMemo(() => getStyles(isDarkMode, width, height), [isDarkMode, width, height]);

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
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
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
                <Mail
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
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Lock
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
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.togglePassword}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#0d6efd" />
                  ) : (
                    <Eye size={20} color="#0d6efd" />
                  )}
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

              {isBiometricAvailable && isBiometricsEnabled && (
                <TouchableOpacity
                  style={styles.biometricButton}
                  onPress={handleBiometricLogin}
                  disabled={loading}
                >
                  <Fingerprint size={48} color="#0d6efd" />
                  <Text style={styles.biometricText}>Use Biometrics</Text>
                </TouchableOpacity>
              )}

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

const getStyles = (isDarkMode, width = 375, height = 667) =>
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
      paddingHorizontal: wp(6),
      paddingBottom: hp(5),
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: hp(2),
    },
    logo: {
      width: wp(20),
      height: wp(20),
      marginBottom: hp(1),
      borderRadius: wp(4),
    },
    logoText: {
      fontSize: fontSize(28),
      fontWeight: 'bold',
      color: '#fff',
    },
    formContainer: {
      width: '100%',
      backgroundColor: 'rgba(255,255,255,0.95)',
      padding: wp(6),
      borderRadius: wp(3),
    },
    title: {
      fontSize: fontSize(22),
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: hp(2),
      color: '#333',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: hp(2),
      borderWidth: 1,
      borderColor: isDarkMode ? '#555' : '#ccc',
      borderRadius: 10,
      backgroundColor: '#fff',
      paddingHorizontal: wp(3),
    },
    input: {
      flex: 1,
      height: hp(6.5),
      fontSize: fontSize(16),
      color: '#333',
    },
    inputIcon: {
      marginRight: 10,
    },
    togglePassword: {
      padding: 10,
    },
    forgotPasswordText: {
      color: '#0d6efd',
      fontSize: fontSize(16),
      textAlign: 'right',
      marginBottom: hp(2.5),
    },
    loginButton: {
      backgroundColor: '#0d6efd',
      height: hp(6.5),
      borderRadius: wp(3),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: hp(2),
    },
    loginButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
    signupText: {
      color: '#333',
      fontSize: fontSize(16),
      textAlign: 'center',
    },
    signupTextHighlight: {
      color: '#0d6efd',
      fontWeight: 'bold',
      fontSize: fontSize(16),
    },
    biometricButton: {
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 15,
    },
    biometricText: {
      marginTop: 5,
      color: '#0d6efd',
      fontSize: 14,
      fontWeight: '500',
    },
  });

export default LoginScreen;
