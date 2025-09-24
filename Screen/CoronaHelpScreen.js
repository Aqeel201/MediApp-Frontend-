import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './ThemeContext'; // Import the useTheme hook

const CoronaHelpScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme(); // Access global dark mode state

  const styles = getStyles(isDarkMode); // Get styles based on dark mode

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Corona Help</Text>
      <Image source={require('../assets/covid19.png')} style={styles.image} />
      <Text style={styles.subtitle}>Stay Informed and Safe</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Symptoms</Text>
        <Text style={styles.sectionContent}>
          - Fever{'\n'}
          - Cough{'\n'}
          - Shortness of breath{'\n'}
          - Loss of taste or smell
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prevention Tips</Text>
        <Text style={styles.sectionContent}>
          - Wash your hands regularly{'\n'}
          - Wear a mask{'\n'}
          - Maintain social distance{'\n'}
          - Avoid crowded places
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trusted Resources</Text>
        <TouchableOpacity onPress={() => navigation.navigate('WebView', { url: 'https://www.who.int' })} style={styles.link}>
          <Text style={styles.linkText}>World Health Organization</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('WebView', { url: 'https://www.cdc.gov' })} style={styles.link}>
          <Text style={styles.linkText}>Centers for Disease Control and Prevention</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.button}>
        <Text style={styles.buttonText}>Go to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const getStyles = (isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: isDarkMode ? '#1c1c1c' : '#f0f4ff', // Background color based on dark mode
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#000', // Text color based on dark mode
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: isDarkMode ? '#ccc' : '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#000',
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 16,
    color: isDarkMode ? '#ccc' : '#333',
    lineHeight: 24,
  },
  link: {
    paddingVertical: 10,
  },
  linkText: {
    fontSize: 16,
    color: '#007bff',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 50,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default CoronaHelpScreen;
