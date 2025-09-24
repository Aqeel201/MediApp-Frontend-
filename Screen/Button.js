// Button.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from './ThemeContext'; // Import the useTheme hook

const Button = ({ title, onPress, style }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[styles.button, { backgroundColor: isDarkMode ? 'blue' : 'blue' }, style]} 
      onPress={onPress}
    >
      <Text style={[styles.buttonText, { color: isDarkMode ? 'white' : 'white' }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Button;
