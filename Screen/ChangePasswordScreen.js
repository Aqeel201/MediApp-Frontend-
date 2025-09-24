import React, { useState } from 'react';
import {
  Text, View, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './ThemeContext';
import axios from 'axios';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

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

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const context = useTheme();

  const theme = {
    colors: {
      ...defaultTheme.colors,
      ...(context?.theme?.colors || {}),
    }
  };

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    if (!email.toLowerCase().endsWith('@gmail.com')) return 'Please use a Gmail address';
    return null;
  };

  const handleRequestOTP = async () => {
    const validationError = validateEmail();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setLoading(true);
    try {
      console.log('Requesting password reset OTP for:', email);
      const response = await axios.post('http://192.168.18.24:3000/api/auth/request-password-reset', {
        email: email.toLowerCase()
      });

      console.log('Password reset OTP response:', response.data);
      Alert.alert('Success', 'OTP sent to your email. Please verify to reset your password.');
      navigation.navigate('VerifyOTP', { email: email.toLowerCase(), purpose: 'password-reset' });
    } catch (error) {
      console.error('Password reset OTP error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Could not send OTP. Please try again.';
      Alert.alert('Request Failed', errorMessage);
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
          <Text style={styles(theme).title}>Change Password</Text>
          <Text style={styles(theme).subtitle}>
            Enter your email to receive an OTP for password reset
          </Text>
        </View>

        <View style={styles(theme).formContainer}>
          <View style={styles(theme).inputWrapper}>
            <FontAwesome
              name="envelope-o"
              size={16}
              style={styles(theme).icon}
            />
            <TextInput
              style={styles(theme).input}
              placeholder="Email (Gmail only) *"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={(text) => setEmail(text.toLowerCase())}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={true}
              spellCheck={true}
              inputMode="email"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles(theme).submitButton,
            loading && styles(theme).disabledButton
          ]}
          onPress={handleRequestOTP}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.background} />
          ) : (
            <Text style={styles(theme).buttonText}>Send OTP</Text>
          )}
        </TouchableOpacity>

        <View style={styles(theme).backContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles(theme).backLink}>Back to Login</Text>
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

export default ChangePasswordScreen;