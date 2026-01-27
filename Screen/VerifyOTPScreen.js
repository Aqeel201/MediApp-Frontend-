import React, { useState, useEffect } from 'react';
import {
  Text, View, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from './ThemeContext';
import axios from 'axios';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const VerifyOTPScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email, purpose = 'signup' } = route.params;
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

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  useEffect(() => {
    let timer;
    if (resendDisabled && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            setResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendDisabled, resendTimer]);

  useEffect(() => {
    if (otp.length === 6 && /^\d{6}$/.test(otp)) {
      handleVerifyOTP();
    }
  }, [otp]);

  const validatePassword = () => {
    if (purpose !== 'password-reset') return null;
    if (newPassword.length < 6) return 'Password must be at least 6 characters';
    if (newPassword !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      Alert.alert('Validation Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    if (purpose === 'password-reset') {
      const passwordError = validatePassword();
      if (passwordError) {
        Alert.alert('Validation Error', passwordError);
        return;
      }
    }

    setLoading(true);
    try {
      console.log('Verifying OTP for:', email, 'Purpose:', purpose, 'OTP:', otp);
      const endpoint = purpose === 'password-reset' ? '/api/auth/reset-password' : '/api/auth/verify-otp';
      const payload = purpose === 'password-reset'
        ? { email: email.toLowerCase(), otp, newPassword }
        : { email: email.toLowerCase(), otp };

      const response = await axios.post(`https://auth-backend-three-navy.vercel.app${endpoint}`, payload);

      console.log('Verify OTP response:', response.data);

      if (response.status === 200 || response.status === 201) {
        if (purpose === 'password-reset') {
          Alert.alert('Success', 'Password reset successfully!', [
            { text: 'OK', onPress: () => navigation.navigate('Login') }
          ]);
        } else {
          await AsyncStorage.setItem('authToken', response.data.token);
          await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
          await AsyncStorage.removeItem('tempAuthToken');
          await AsyncStorage.removeItem('tempUser');
          Alert.alert('Success', 'Email verified successfully!', [
            { text: 'OK', onPress: () => navigation.navigate('Login') }
          ]);
        }
      }
    } catch (error) {
      console.error('OTP verification error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Could not verify OTP. Please try again.';
      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setResendDisabled(true);
    setResendTimer(30);

    try {
      console.log('Resending OTP to:', email, 'Purpose:', purpose);
      const endpoint = purpose === 'password-reset' ? '/api/auth/request-password-reset' : '/api/auth/send-otp';
      await axios.post(`https://auth-backend-three-navy.vercel.app${endpoint}`, {
        email: email.toLowerCase()
      });
      Alert.alert('Success', 'OTP resent to your email.');
    } catch (error) {
      console.error('Resend OTP error:', error.response?.data || error.message);
      setResendDisabled(false);
      setResendTimer(0);
      const errorMessage = error.response?.data?.message || 'Could not resend OTP. Please try again.';
      Alert.alert('Resend Failed', errorMessage);
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
          <Text style={styles(theme).title}>
            {purpose === 'password-reset' ? 'Reset Your Password' : 'Verify Your Email'}
          </Text>
          <Text style={styles(theme).subtitle}>
            Enter the 6-digit OTP sent to {email}
          </Text>
        </View>

        <View style={styles(theme).formContainer}>
          <View style={styles(theme).inputWrapper}>
            <FontAwesome
              name="lock"
              size={18}
              style={styles(theme).icon}
            />
            <TextInput
              style={styles(theme).input}
              placeholder="Enter OTP"
              placeholderTextColor={theme.colors.textSecondary}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              autoCapitalize="none"
              autoFocus={true}
            />
          </View>

          {purpose === 'password-reset' && (
            <>
              <View style={styles(theme).inputWrapper}>
                <FontAwesome
                  name="lock"
                  size={18}
                  style={styles(theme).icon}
                />
                <TextInput
                  style={styles(theme).input}
                  placeholder="New Password *"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles(theme).eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <FontAwesome
                    name={showPassword ? "eye" : "eye-slash"}
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles(theme).inputWrapper}>
                <FontAwesome
                  name="lock"
                  size={18}
                  style={styles(theme).icon}
                />
                <TextInput
                  style={styles(theme).input}
                  placeholder="Confirm New Password *"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles(theme).eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <FontAwesome
                    name={showConfirmPassword ? "eye" : "eye-slash"}
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles(theme).submitButton,
            loading && styles(theme).disabledButton
          ]}
          onPress={handleVerifyOTP}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.background} />
          ) : (
            <Text style={styles(theme).buttonText}>
              {purpose === 'password-reset' ? 'Reset Password' : 'Verify OTP'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles(theme).resendButton,
            (loading || resendDisabled) && styles(theme).disabledButton
          ]}
          onPress={handleResendOTP}
          disabled={loading || resendDisabled}
          activeOpacity={0.9}
        >
          <Text style={styles(theme).resendText}>
            {resendDisabled ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>

        <View style={styles(theme).backContainer}>
          <TouchableOpacity onPress={() => navigation.navigate(purpose === 'password-reset' ? 'ChangePassword' : 'Signup')}>
            <Text style={styles(theme).backLink}>
              {purpose === 'password-reset' ? 'Back to Change Password' : 'Back to Sign Up'}
            </Text>
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
    padding: 20,
    paddingTop: 25,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: -30,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
  },
  icon: {
    marginRight: 10,
    color: theme.colors.textSecondary,
  },
  input: {
    flex: 1,
    height: 48,
    color: theme.colors.textPrimary,
    fontSize: 15,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 6,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
    marginTop: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  resendButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  resendText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  backContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  backLink: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default VerifyOTPScreen;