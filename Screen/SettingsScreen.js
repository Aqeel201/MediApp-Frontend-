import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, FlatList } from 'react-native';
import ToggleSwitch from 'toggle-switch-react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronDown, faUser, faSignOutAlt, faLanguage, faMapMarkerAlt, faLock, faArrowLeft, faTrash} from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './ThemeContext';
import Button from './Button'; // Import the Button component

const SettingsScreen = () => {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [isNotificationOn, setIsNotificationOn] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const navigation = useNavigation();

  const handleSave = () => {
    Alert.alert('Settings Saved', 'Your settings have been saved.');
  };

  const handleLogout = () => {
    navigation.navigate('Login');
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    setIsLanguageModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1c1c1c' : 'white' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon={faArrowLeft} size={24} color={isDarkMode ? 'white' : '#0d6efd'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDarkMode ? 'white' : '#0d6efd' }]}>Settings</Text>
      </View>

      <View style={styles.item}>
        <Text style={[styles.text, { color: isDarkMode ? 'white' : '#0d6efd' }]}>Enable Notifications</Text>
        <ToggleSwitch
          isOn={isNotificationOn}
          onColor="green"
          offColor="red"
          labelStyle={{ color: isDarkMode ? 'white' : 'black' }}
          size="medium"
          onToggle={(isOn) => {
            setIsNotificationOn(isOn);
            console.log("Notification changed to: ", isOn);
          }}
        />
      </View>
      <View style={styles.item}>
        <Text style={[styles.text, { color: isDarkMode ? 'white' : '#0d6efd' }]}>Dark Mode</Text>
        <ToggleSwitch
          isOn={isDarkMode}
          onColor="green"
          offColor="red"
          labelStyle={{ color: isDarkMode ? 'white' : 'black' }}
          size="medium"
          onToggle={(isOn) => {
            setIsDarkMode(isOn);
            console.log("Dark Mode changed to: ", isOn);
          }}
        />
      </View>
      <TouchableOpacity style={styles.item} onPress={() => setIsLanguageModalVisible(true)}>
        <Text style={[styles.text, { color: isDarkMode ? 'white' : '#0d6efd' }]}>Change Language</Text>
        <FontAwesomeIcon icon={faChevronDown} size={20} color={isDarkMode ? 'white' : '#0d6efd'} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('PersonalData')}>
        <Text style={[styles.text, { color: isDarkMode ? 'white' : '#0d6efd' }]}>Update Profile</Text>
        <FontAwesomeIcon icon={faUser} size={20} color={isDarkMode ? 'white' : '#0d6efd'} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('ChangePassword')}>
        <Text style={[styles.text, { color: isDarkMode ? 'white' : '#0d6efd' }]}>Change Password</Text>
        <FontAwesomeIcon icon={faLock} size={20} color={isDarkMode ? 'white' : '#0d6efd'} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('MapLocation')}>
        <Text style={[styles.text, { color: isDarkMode ? 'white' : '#0d6efd' }]}>View Cities Map</Text>
        <FontAwesomeIcon icon={faMapMarkerAlt} size={20} color={isDarkMode ? 'white' : '#0d6efd'} />
      </TouchableOpacity>
              <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Reset')}>
          <Text style={[styles.text, { color: isDarkMode ? 'white' : '#0d6efd' }]}>Reset Onboarding</Text>
          <FontAwesomeIcon icon={faTrash} size={20} color={isDarkMode ? 'white' : '#0d6efd'} />
        </TouchableOpacity>
      <Button title="Save Settings" onPress={handleSave} />
      <Button title="Log Out" onPress={handleLogout} style={{ backgroundColor: 'red' }} />

      {/* Language Modal */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={isLanguageModalVisible}
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <FlatList
              data={['English', 'Spanish', 'French', 'German', 'Chinese']}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleLanguageSelect(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item}
            />
            <Button title="Close" onPress={() => setIsLanguageModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 100,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '80%',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  modalItemText: {
    fontSize: 16,
    color: '#0d6efd',
  },
});

export default SettingsScreen;
