import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './ThemeContext';
import * as Updates from 'expo-updates'; // Import expo-updates for app restart
import Button from './Button'; // Assuming Button is a custom component

const ResetScreen = () => {
  const { width, height } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleConfirm = () => {
    setIsConfirmed(true); // Switch to confirmation state
  };

  const handleResetNow = async () => {
    try {
      await AsyncStorage.removeItem('hasSeenOnboarding');
      console.log('Onboarding flag removed');
      // Use setTimeout to ensure any state updates finish before reload
      setTimeout(async () => {
        try {
          await Updates.reloadAsync();
        } catch (e) {
          console.error("Updates.reloadAsync failed:", e);
        }
      }, 500);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      Alert.alert('Error', 'Failed to reset onboarding. Please try again.');
    }
  };

  const styles = React.useMemo(() => getStyles(width, height), [width, height]);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1c1c1c' : 'white' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon={faArrowLeft} size={24} color={isDarkMode ? 'white' : '#0d6efd'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDarkMode ? 'white' : '#0d6efd' }]}>Reset Onboarding</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isConfirmed ? (
          <>
            <Text style={[styles.message, { color: isDarkMode ? 'white' : '#333' }]}>
              Onboarding reset confirmed. Press "Reset Now" to restart the app and see the onboarding screens, or cancel to return.
            </Text>
            <Button
              title="Reset Now"
              onPress={handleResetNow}
              style={{ backgroundColor: '#FF5722', marginBottom: height * 0.02 }}
            />
            <Button
              title="Cancel"
              onPress={() => navigation.goBack()}
              style={{ backgroundColor: isDarkMode ? '#555' : '#ccc' }}
            />
          </>
        ) : (
          <>
            <Text style={[styles.message, { color: isDarkMode ? 'white' : '#333' }]}>
              Are you sure you want to reset the onboarding process? This will make the onboarding screens appear again the next time you launch the app.
            </Text>
            <Button
              title="Confirm Reset"
              onPress={handleConfirm}
              style={{ backgroundColor: '#FF5722', marginBottom: height * 0.02 }}
            />
            <Button
              title="Cancel"
              onPress={() => navigation.goBack()}
              style={{ backgroundColor: isDarkMode ? '#555' : '#ccc' }}
            />
          </>
        )}
      </View>
    </View>
  );
};

const getStyles = (width, height) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.03,
  },
  headerTitle: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
  },
  message: {
    fontSize: width * 0.045,
    textAlign: 'center',
    lineHeight: height * 0.03,
    marginBottom: height * 0.03,
  },
});

export default ResetScreen;