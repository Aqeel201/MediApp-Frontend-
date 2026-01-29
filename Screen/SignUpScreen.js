import React, { useState, useEffect, useRef } from 'react';
import {
  Text, View, TextInput, TouchableOpacity,
  StyleSheet, Alert, Image, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './ThemeContext';
import axios from 'axios';
import { User, CreditCard, Mail, Lock, Eye, EyeOff, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wp, hp, fontSize } from './responsive';
import { StatusBar } from 'expo-status-bar';

const defaultTheme = {
  colors: {
    primary: '#0d6efd',
    background: '#f8f9fa',
    textPrimary: '#212529',
    textSecondary: '#495057',
    inputBackground: '#ffffff',
    inputBorder: '#dee2e6',
  }
};

const SignUpScreen = () => {
  const { width, height } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();

  const theme = {
    colors: {
      ...defaultTheme.colors,
      background: isDarkMode ? '#121212' : '#f8f9fa',
      textPrimary: isDarkMode ? '#ffffff' : '#212529',
      textSecondary: isDarkMode ? '#adb5bd' : '#495057',
      inputBackground: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
      inputBorder: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    }
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    CNICNo: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Animated value for background image
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: -width,
          duration: 15000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 15000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue, width]);

  const styles = React.useMemo(() => getStyles(width, height, isDarkMode), [width, height, isDarkMode]);

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const { firstName, email, password, confirmPassword } = formData;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!firstName.trim()) return 'First name is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    if (!email.toLowerCase().endsWith('@gmail.com')) return 'Please use a Gmail address';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSignUp = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('CNICNo', formData.CNICNo);
      formDataToSend.append('email', formData.email.toLowerCase());
      formDataToSend.append('password', formData.password);

      if (profileImage) {
        const filename = profileImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';
        formDataToSend.append('profileImage', {
          uri: profileImage,
          name: filename,
          type,
        });
      }

      console.log('Sending signup request (FormData)...');

      const response = await axios.post('https://auth-backend-three-navy.vercel.app/api/auth/signup', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Signup response:', response.data);

      if (response.status === 201) {
        await AsyncStorage.setItem('tempAuthToken', response.data.token);
        await AsyncStorage.setItem('tempUser', JSON.stringify(response.data.user));
        Alert.alert('Success', 'OTP sent to your email. Please verify to complete registration.');
        navigation.navigate('VerifyOTP', { email: formData.email.toLowerCase() });
      }
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Could not register. Please try again.';
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

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
              <TouchableOpacity onPress={pickProfileImage} style={styles.imagePicker}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Camera size={40} color="rgba(255,255,255,0.7)" />
                  </View>
                )}
                <View style={styles.cameraIconContainer}>
                  <Camera size={14} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.titleText}>Join MediApp</Text>
              <Text style={styles.subtitle}>Care for your health with us</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Create Account</Text>

              <View style={styles.nameRow}>
                <View style={[styles.inputWrapper, styles.nameInput]}>
                  <User size={18} color={isDarkMode ? '#aaa' : '#666'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="First Name *"
                    placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
                    value={formData.firstName}
                    onChangeText={(text) => handleInputChange('firstName', text)}
                  />
                </View>
                <View style={[styles.inputWrapper, styles.nameInput]}>
                  <User size={18} color={isDarkMode ? '#aaa' : '#666'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Last Name"
                    placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
                    value={formData.lastName}
                    onChangeText={(text) => handleInputChange('lastName', text)}
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <CreditCard size={18} color={isDarkMode ? '#aaa' : '#666'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="CNIC Number"
                  placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
                  value={formData.CNICNo}
                  onChangeText={(text) => handleInputChange('CNICNo', text)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Mail size={18} color={isDarkMode ? '#aaa' : '#666'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email (Gmail only) *"
                  placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text.toLowerCase())}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={18} color={isDarkMode ? '#aaa' : '#666'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password *"
                  placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  {showPassword ? <EyeOff size={18} color="#0d6efd" /> : <Eye size={18} color="#0d6efd" />}
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={18} color={isDarkMode ? '#aaa' : '#666'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password *"
                  placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
                  value={formData.confirmPassword}
                  onChangeText={(text) => handleInputChange('confirmPassword', text)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  {showConfirmPassword ? <EyeOff size={18} color="#0d6efd" /> : <Eye size={18} color="#0d6efd" />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLinkText}>
                  Already have an account? <Text style={styles.loginLinkHighlight}>Log In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingTop: hp(5),
  },
  header: {
    alignItems: 'center',
    marginBottom: hp(3),
  },
  imagePicker: {
    marginBottom: hp(2),
  },
  profileImage: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    borderWidth: 3,
    borderColor: '#0d6efd',
  },
  imagePlaceholder: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#0d6efd',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  titleText: {
    fontSize: fontSize(26),
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: fontSize(14),
    color: 'rgba(255,255,255,0.7)',
    marginTop: 5,
  },
  formContainer: {
    width: '92%',
    backgroundColor: isDarkMode ? 'rgba(25, 25, 25, 0.88)' : 'rgba(255, 255, 255, 0.94)',
    padding: wp(6),
    borderRadius: 30,
    alignSelf: 'center',
    marginBottom: hp(5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)',
  },
  formTitle: {
    fontSize: fontSize(22),
    fontWeight: '700',
    color: isDarkMode ? '#fff' : '#1a1a1a',
    marginBottom: hp(2.5),
    textAlign: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  nameInput: {
    flex: 0.48,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.8),
    borderWidth: 1.5,
    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderRadius: 15,
    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
    paddingHorizontal: wp(3.5),
    height: hp(6.5),
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: fontSize(15),
    color: isDarkMode ? '#fff' : '#1a1a1a',
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  submitButton: {
    backgroundColor: '#0d6efd',
    height: hp(6.5),
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(1),
    marginBottom: hp(2),
    shadowColor: '#0d6efd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: fontSize(17),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: hp(1),
  },
  loginLinkText: {
    color: isDarkMode ? '#aaa' : '#666',
    fontSize: fontSize(14),
  },
  loginLinkHighlight: {
    color: '#0d6efd',
    fontWeight: '800',
  },
});

export default SignUpScreen;