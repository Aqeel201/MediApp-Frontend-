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
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from './ThemeContext';
import { Mail, Lock, Eye, EyeOff, Fingerprint } from 'lucide-react-native';
import axios from 'axios';
import * as LocalAuthentication from 'expo-local-authentication';
import { wp, hp, fontSize } from './responsive';
import PremiumModal from './PremiumModal';
import { CartContext } from './CartContext';


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
  const [modal, setModal] = useState({ visible: false, title: '', message: '', type: 'info' });

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

        // If biometrics are enabled, sync the biometric token
        const biometricsEnabled = await AsyncStorage.getItem('isBiometricsEnabled');
        if (biometricsEnabled === 'true') {
          await AsyncStorage.setItem('biometricToken', token);
          await AsyncStorage.setItem('biometricUser', JSON.stringify(user));
        }

        refreshUser && refreshUser();
        setModal({
          visible: true,
          title: 'Success',
          message: 'Login successful.',
          type: 'success',
          onConfirm: () => navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          })
        });
      } else {
        Alert.alert('Login Failed', response.data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      setModal({
        visible: true,
        title: 'Login Failed',
        message: error.response?.data?.message || 'Invalid credentials or connection error.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login to MediApp',
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        setLoading(true);
        let storedToken = await AsyncStorage.getItem('authToken');

        // If authToken is missing (e.g. after logout), try biometricToken
        if (!storedToken) {
          storedToken = await AsyncStorage.getItem('biometricToken');
          if (storedToken) {
            await AsyncStorage.setItem('authToken', storedToken);
            const bioUser = await AsyncStorage.getItem('biometricUser');
            if (bioUser) {
              await AsyncStorage.setItem('user', bioUser);
            }
          }
        }

        if (storedToken) {
          refreshUser && refreshUser();
          setModal({
            visible: true,
            title: 'Welcome Back!',
            message: 'Biometric authentication successful.',
            type: 'success',
            onConfirm: () => navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            })
          });
        } else {
          setModal({
            visible: true,
            title: 'Action Required',
            message: 'Biometric link not found. Please log in manually once with password to re-enable biometrics.',
            type: 'info'
          });
        }
      }
    } catch (error) {
      setModal({
        visible: true,
        title: 'Error',
        message: 'Biometric authentication failed. Please use your password.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const styles = React.useMemo(() => getStyles(width, height, isDarkMode), [width, height, isDarkMode]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background Animated Images */}
      <Animated.View
        style={[
          styles.backgroundContainer,
          {
            transform: [{ translateX: animatedValue }],
          },
        ]}
      >
        <Image
          source={require('../assets/backround2.jpg')}
          style={[styles.backgroundImage, { width: width }]}
          resizeMode="cover"
        />
        <Image
          source={require('../assets/backround2.jpg')}
          style={[styles.backgroundImage, { width: width }]}
          resizeMode="cover"
        />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.overlay}>
            <View style={styles.header}>
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../assets/LogoBGR.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <LinearGradient
                colors={['#fff', 'rgba(255,255,255,0.7)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.titleGradient}
              >
                <Text style={styles.titleText}>Welcome Back</Text>
              </LinearGradient>
              <Text style={styles.subtitle}>Sign in to continue your journey</Text>
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              <Text style={[styles.formTitle, { marginBottom: 20 }]}>Sign In</Text>

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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <PremiumModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={() => {
          if (modal.onConfirm) modal.onConfirm();
          setModal({ ...modal, visible: false });
        }}
      />
    </View>
  );
};

const getStyles = (width, height, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    flexDirection: 'row',
    height: '100%',
    width: width * 2,
  },
  backgroundImage: {
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: hp(4),
    marginTop: hp(5),
  },
  logoWrapper: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 25,
    marginBottom: hp(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: wp(18),
    height: wp(18),
  },
  titleGradient: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 5,
  },
  titleText: {
    fontSize: fontSize(30),
    fontWeight: '900',
    color: '#0d6efd',
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize(16),
    color: 'rgba(255,255,255,0.7)',
    marginTop: 5,
  },
  formContainer: {
    width: '90%',
    backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.85)' : 'rgba(255, 255, 255, 0.92)',
    padding: wp(8),
    borderRadius: 30,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)',
  },
  formTitle: {
    fontSize: fontSize(24),
    fontWeight: '700',
    color: isDarkMode ? '#fff' : '#1a1a1a',
    marginBottom: hp(3),
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2.5),
    borderWidth: 1.5,
    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderRadius: 15,
    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
    paddingHorizontal: wp(4),
    height: hp(7),
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: fontSize(16),
    color: isDarkMode ? '#fff' : '#1a1a1a',
    height: '100%',
  },
  togglePassword: {
    padding: 10,
  },
  forgotPasswordText: {
    color: '#0d6efd',
    fontSize: fontSize(14),
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: hp(3),
  },
  loginButton: {
    backgroundColor: '#0d6efd',
    height: hp(7),
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2.5),
    shadowColor: '#0d6efd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: fontSize(18),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  biometricButton: {
    alignItems: 'center',
    marginBottom: hp(2),
  },
  biometricText: {
    marginTop: 8,
    color: '#0d6efd',
    fontSize: fontSize(14),
    fontWeight: '600',
  },
  signupText: {
    color: isDarkMode ? '#aaa' : '#666',
    fontSize: fontSize(15),
    textAlign: 'center',
    marginTop: hp(1),
  },
  signupTextHighlight: {
    color: '#0d6efd',
    fontWeight: '800',
  },
});

export default LoginScreen;
