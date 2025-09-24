import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from './ThemeContext';

const TermsAndConditionsScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon={faArrowLeft} size={24} color={isDarkMode ? "white" : "blue"} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Terms and Conditions</Text>
      </View>
      <ScrollView style={styles.contentContainer}>
        <Text style={styles.title}>Welcome to Our Medical Store App</Text>
        <Text style={styles.text}>
          These terms and conditions outline the rules and regulations for the use of our Medical Store App.
        </Text>
        <Text style={styles.subtitle}>Introduction</Text>
        <Text style={styles.text}>
          By accessing this app we assume you accept these terms and conditions in full. Do not continue to use the app if you do not accept all of the terms and conditions stated on this page.
        </Text>
        <Text style={styles.subtitle}>License</Text>
        <Text style={styles.text}>
          Unless otherwise stated, our app and/or its licensors own the intellectual property rights for all material on the app. All intellectual property rights are reserved. You may view and/or print pages from the app for your own personal use subject to restrictions set in these terms and conditions.
        </Text>
        <Text style={styles.subtitle}>User Comments</Text>
        <Text style={styles.text}>
          Certain parts of this app offer the opportunity for users to post and exchange opinions, information, material, and data ('Comments'). We do not screen, edit, publish, or review Comments prior to their appearance on the app and Comments do not reflect the views or opinions of our app, its agents, or affiliates.
        </Text>
        <Text style={styles.subtitle}>Hyperlinking to our Content</Text>
        <Text style={styles.text}>
          The following organizations may link to our Web site without prior written approval: Government agencies, Search engines, News organizations, Online directory distributors.
        </Text>
        <Text style={styles.subtitle}>iFrames</Text>
        <Text style={styles.text}>
          Without prior approval and express written permission, you may not create frames around our Web pages or use other techniques that alter in any way the visual presentation or appearance of our app.
        </Text>
        <Text style={styles.subtitle}>Content Liability</Text>
        <Text style={styles.text}>
          We shall have no responsibility or liability for any content appearing on your Web site. You agree to indemnify and defend us against all claims arising out of or based upon your Website.
        </Text>
        <Text style={styles.subtitle}>Reservation of Rights</Text>
        <Text style={styles.text}>
          We reserve the right at any time and in its sole discretion to request that you remove all links or any particular link to our Web site. You agree to immediately remove all links to our Web site upon such request.
        </Text>
        <Text style={styles.subtitle}>Disclaimer</Text>
        <Text style={styles.text}>
          To the maximum extent permitted by applicable law, we exclude all representations, warranties, and conditions relating to our app and the use of this app (including, without limitation, any warranties implied by law in respect of satisfactory quality, fitness for purpose and/or the use of reasonable care and skill).
        </Text>
      </ScrollView>
    </View>
  );
};

const getStyles = (isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? "#1c1c1c" : "white",
  },
  header: {
    backgroundColor: 'transparent',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    color: isDarkMode ? "white" : "blue",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 20,
  },
  iconButton: {
    padding: 10,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    color: isDarkMode ? "white" : "blue",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    color: isDarkMode ? "white" : "blue",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    color: isDarkMode ? "#ddd" : "#333",
    fontSize: 16,
    lineHeight: 24,
  },
});

export default TermsAndConditionsScreen;
