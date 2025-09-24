import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { useTheme } from '../Screen/ThemeContext';

function OtpVerificationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { isDarkMode } = useTheme();

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('http://192.168.43.63:5000/api/auth/verify-otp', { email, otp });
      if (response.data.success) {
        Alert.alert('Success', 'Account verified successfully!');
        navigation.navigate('Home');
      } else {
        Alert.alert('Error', response.data.message || 'OTP verification failed.');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      const response = await axios.post('http://192.168.43.63:5000/api/auth/resend-otp', { email });
      if (response.data.success) {
        Alert.alert('Success', 'New OTP has been sent to your email.');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to resend OTP.');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>
      <TextInput
        style={styles.input}
        placeholder="OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="numeric"
        maxLength={6}
        placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
      />
      <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify OTP</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={handleResendOtp} disabled={resending}>
        <Text style={styles.resendText}>
          {resending ? 'Resending OTP...' : 'Resend OTP'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: isDarkMode ? '#1c1c1c' : '#f0f4ff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    color: isDarkMode ? '#4b6bff' : '#4b6bff',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: isDarkMode ? '#aaa' : '#555',
  },
  input: {
    height: 50,
    backgroundColor: isDarkMode ? '#333' : '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    fontSize: 16,
    borderColor: isDarkMode ? '#555' : '#ccc',
    borderWidth: 1,
    color: isDarkMode ? '#fff' : '#000',
  },
  button: {
    backgroundColor: '#0d6efd',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resendText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#0d6efd',
    fontWeight: '600',
  },
});

export default OtpVerificationScreen;