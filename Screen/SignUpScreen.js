import React, { useState } from 'react';
import {
  Text, View, TextInput, TouchableOpacity,
  StyleSheet, Alert, Image, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView
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
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();

  const theme = {
    colors: {
      ...defaultTheme.colors,
      background: isDarkMode ? '#121212' : '#f8f9fa',
      textPrimary: isDarkMode ? '#ffffff' : '#212529',
      textSecondary: isDarkMode ? '#adb5bd' : '#495057',
      inputBackground: isDarkMode ? '#2c2c2c' : '#ffffff',
      inputBorder: isDarkMode ? '#495057' : '#dee2e6',
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles(theme).container}
    >
      <ScrollView
        contentContainerStyle={styles(theme).scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles(theme).header}>
          <Image
            source={require('../assets/LogoBGR.png')}
            style={styles(theme).logo}
            resizeMode="contain"
          />
          <Text style={styles(theme).title}>Create New Account</Text>
        </View>

        <TouchableOpacity
          style={styles(theme).imagePicker}
          onPress={pickProfileImage}
          activeOpacity={0.8}
        >
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={styles(theme).profileImage}
            />
          ) : (
            <View style={styles(theme).imagePlaceholder}>
              <Camera
                size={32}
                color={theme.colors.primary}
              />
              <Text style={styles(theme).imagePickerText}>
                Add Profile Photo
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles(theme).formContainer}>
          <View style={styles(theme).nameRow}>
            <View style={[styles(theme).inputWrapper, styles(theme).nameInput]}>
              <User
                size={16}
                style={styles(theme).icon}
              />
              <TextInput
                style={styles(theme).input}
                placeholder="First Name *"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.firstName}
                onChangeText={(text) => handleInputChange('firstName', text)}
              />
            </View>
            <View style={styles(theme).spacer} />
            <View style={[styles(theme).inputWrapper, styles(theme).nameInput]}>
              <User
                size={16}
                style={styles(theme).icon}
              />
              <TextInput
                style={styles(theme).input}
                placeholder="Last Name"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.lastName}
                onChangeText={(text) => handleInputChange('lastName', text)}
              />
            </View>
          </View>

          <View style={styles(theme).inputWrapper}>
            <CreditCard
              size={16}
              style={styles(theme).icon}
            />
            <TextInput
              style={styles(theme).input}
              placeholder="CNIC Number"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.CNICNo}
              onChangeText={(text) => handleInputChange('CNICNo', text)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles(theme).inputWrapper}>
            <Mail
              size={16}
              style={styles(theme).icon}
            />
            <TextInput
              style={styles(theme).input}
              placeholder="Email (Gmail only) *"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text.toLowerCase())}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={true}
              spellCheck={true}
              inputMode="email"
            />
          </View>

          <View style={styles(theme).inputWrapper}>
            <Lock
              size={18}
              style={styles(theme).icon}
            />
            <TextInput
              style={styles(theme).input}
              placeholder="Password *"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles(theme).eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <Eye size={18} color={theme.colors.textSecondary} />
              ) : (
                <EyeOff size={18} color={theme.colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles(theme).inputWrapper}>
            <Lock
              size={18}
              style={styles(theme).icon}
            />
            <TextInput
              style={styles(theme).input}
              placeholder="Confirm Password *"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.confirmPassword}
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles(theme).eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <Eye size={18} color={theme.colors.textSecondary} />
              ) : (
                <EyeOff size={18} color={theme.colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles(theme).submitButton,
            loading && styles(theme).disabledButton
          ]}
          onPress={handleSignUp}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.background} />
          ) : (
            <Text style={styles(theme).buttonText}>Send OTP</Text>
          )}
        </TouchableOpacity>

        <View style={styles(theme).loginContainer}>
          <Text style={styles(theme).loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles(theme).loginLink}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = (theme = defaultTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: wp(5),
    paddingTop: hp(4),
  },
  header: {
    alignItems: 'center',
    marginBottom: hp(2),
  },
  logo: {
    width: wp(40),
    height: wp(40),
    marginBottom: -hp(5),
  },
  title: {
    fontSize: fontSize(22),
    fontWeight: '600',
    color: theme.colors.primary,
    letterSpacing: 0.5,
    marginTop: hp(0.5),
  },
  imagePicker: {
    alignSelf: 'center',
    marginBottom: hp(3),
  },
  profileImage: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  imagePlaceholder: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(14),
    backgroundColor: theme.colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  imagePickerText: {
    color: theme.colors.primary,
    marginTop: hp(0.8),
    fontSize: fontSize(13),
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: hp(2),
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1.2),
  },
  nameInput: {
    flex: 1,
    maxWidth: '48%',
  },
  spacer: {
    width: wp(2),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: wp(3),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
  },
  icon: {
    marginRight: wp(2.5),
    color: theme.colors.textSecondary,
  },
  input: {
    flex: 1,
    height: hp(6),
    color: theme.colors.textPrimary,
    fontSize: fontSize(15),
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: wp(1.5),
    marginLeft: wp(1),
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    height: hp(6.5),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
    marginTop: hp(2),
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: fontSize(17),
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: hp(2.5),
    marginBottom: hp(3),
  },
  loginText: {
    color: theme.colors.textSecondary,
    fontSize: fontSize(14),
  },
  loginLink: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: fontSize(14),
  },
});

export default SignUpScreen;