import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, FlatList, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ToggleSwitch from 'toggle-switch-react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronDown, faUser, faSignOutAlt, faLanguage, faMapMarkerAlt, faLock, faArrowLeft, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from './Button'; // Import the Button component
import { wp, hp, fontSize } from './responsive';
import { Fingerprint, Bell, Moon, Sun, Languages, User, Lock, MapPin, Trash2, ArrowLeft, CheckCircle, Info, LogOut } from 'lucide-react-native';
import * as Updates from 'expo-updates';
import PremiumModal from './PremiumModal';
import axios from 'axios';

const AUTH_BASE = 'https://auth-backend-three-navy.vercel.app';


const SettingsScreen = () => {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [isNotificationOn, setIsNotificationOn] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
  const [promoOptIn, setPromoOptIn] = useState(true);
  const [modal, setModal] = useState({ visible: false, title: '', message: '', type: 'info' });
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { isDownloading, isUpdatePending, isChecking } = Updates.useUpdates();

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const biometrics = await AsyncStorage.getItem('isBiometricsEnabled');
        setIsBiometricsEnabled(biometrics === 'true');
        const notifications = await AsyncStorage.getItem('isNotificationOn');
        setIsNotificationOn(notifications === 'true');
        const lang = await AsyncStorage.getItem('selectedLanguage');
        if (lang) setSelectedLanguage(lang);
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (typeof parsed.promoOptIn === 'boolean') {
              setPromoOptIn(parsed.promoOptIn);
            }
          } catch (e) {
            // no-op
          }
        }
      } catch (error) {
        console.error('Error loading settings', error);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem('isNotificationOn', isNotificationOn.toString());
      await AsyncStorage.setItem('selectedLanguage', selectedLanguage);
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const form = new FormData();
        form.append('promoOptIn', promoOptIn ? 'true' : 'false');
        const resp = await axios.put(
          `${AUTH_BASE}/api/auth/update`,
          form,
          { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
        );
        const updatedUser = resp?.data?.user;
        if (updatedUser) {
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
      setModal({
        visible: true,
        title: "Settings Saved",
        message: "Your application preferences have been successfully updated and synced.",
        type: 'success'
      });
    } catch (e) {
      setModal({
        visible: true,
        title: "Error",
        message: "Failed to save settings. Please try again.",
        type: 'error'
      });
    }
  };

  const handleCheckUpdate = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
      } else {
        setModal({
          visible: true,
          title: "Up to Date",
          message: "MediApp is currently running the latest version. New feature updates will be notified here.",
          type: 'success'
        });
      }
    } catch (e) {
      setModal({
        visible: true,
        title: "Update Failed",
        message: "Unable to check for updates. Please verify your connection.",
        type: 'error'
      });
    }
  };

  const handleLogout = () => {
    setModal({
      visible: true,
      title: "Confirm Logout",
      message: "Are you sure you want to end your session?",
      type: 'logout'
    });
  };

  const handleModalClose = async (confirm) => {
    if (modal.type === 'logout' && confirm === true) {
      try {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('user');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } catch (e) {
        console.error("Logout error:", e);
      }
    }
    setModal({ ...modal, visible: false });
  };

  const handleLanguageSelect = async (language) => {
    setSelectedLanguage(language);
    setIsLanguageModalVisible(false);
    await AsyncStorage.setItem('selectedLanguage', language);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1c1c1c' : 'white', paddingTop: insets.top }]}>
      <PremiumModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={async () => {
          if (modal.type === 'logout') {
            try {
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('user');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (e) {
              console.error("Logout error:", e);
            }
          }
          setModal({ ...modal, visible: false });
        }}
        onCancel={modal.type === 'logout' ? () => setModal({ ...modal, visible: false }) : null}
        confirmText={modal.type === 'logout' ? 'Logout' : 'Got it'}
      />
      <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor="transparent" translucent={true} />
      <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: insets.bottom + 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={isDarkMode ? 'white' : '#0d6efd'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDarkMode ? 'white' : '#0d6efd' }]}>Settings</Text>
        </View>

        {/* Software Update Section */}
        <View style={[styles.section, { borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#333' : '#eee', paddingBottom: 15, marginBottom: 15 }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#aaa' : '#666', fontSize: 12, marginBottom: 10, fontWeight: 'bold' }]}>SOFTWARE UPDATE</Text>
          <View style={styles.item}>
            <View>
              <Text style={[styles.text, { color: isDarkMode ? 'white' : '#333', fontWeight: 'bold' }]}>App Version</Text>
              <Text style={{ color: isDarkMode ? '#888' : '#666', fontSize: 12 }}>Current: 1.0.0</Text>
            </View>
            {isChecking && <ActivityIndicator size="small" color="#0d6efd" />}
          </View>

          {isUpdatePending ? (
            <TouchableOpacity
              style={{ backgroundColor: '#10b981', padding: 12, borderRadius: 8, marginTop: 10, alignItems: 'center' }}
              onPress={() => Updates.reloadAsync()}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>✨ Update Ready - Install Now</Text>
            </TouchableOpacity>
          ) : isDownloading ? (
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: '#0d6efd', fontSize: 13, marginBottom: 5 }}>📡 Downloading updates...</Text>
              <View style={{ height: 4, backgroundColor: '#eee', borderRadius: 2, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: '45%', backgroundColor: '#0d6efd' }} />
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={{ borderColor: '#0d6efd', borderWidth: 1, padding: 10, borderRadius: 8, marginTop: 10, alignItems: 'center' }}
              onPress={handleCheckUpdate}
            >
              <Text style={{ color: '#0d6efd', fontWeight: 'bold' }}>Check for Updates</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.item}>
          <Text style={[styles.text, { color: isDarkMode ? 'white' : '#333' }]}>Enable Notifications</Text>
          <ToggleSwitch
            isOn={isNotificationOn}
            onColor="#0d6efd"
            offColor="#ccc"
            labelStyle={{ color: isDarkMode ? 'white' : 'black' }}
            size="medium"
            onToggle={(isOn) => setIsNotificationOn(isOn)}
          />
        </View>
        <View style={styles.item}>
          <Text style={[styles.text, { color: isDarkMode ? 'white' : '#333' }]}>Dark Mode</Text>
          <ToggleSwitch
            isOn={isDarkMode}
            onColor="#0d6efd"
            offColor="#ccc"
            labelStyle={{ color: isDarkMode ? 'white' : 'black' }}
            size="medium"
            onToggle={(isOn) => setIsDarkMode(isOn)}
          />
        </View>
        <View style={styles.item}>
          <View>
            <Text style={[styles.text, { color: isDarkMode ? 'white' : '#333' }]}>Promotional Emails</Text>
            <Text style={{ color: isDarkMode ? '#888' : '#666', fontSize: 12 }}>Receive health tips and offers</Text>
          </View>
          <ToggleSwitch
            isOn={promoOptIn}
            onColor="#0d6efd"
            offColor="#ccc"
            labelStyle={{ color: isDarkMode ? 'white' : 'black' }}
            size="medium"
            onToggle={(isOn) => setPromoOptIn(isOn)}
          />
        </View>
        <View style={styles.item}>
          <Text style={[styles.text, { color: isDarkMode ? 'white' : '#333' }]}>Biometric Authentication</Text>
          <ToggleSwitch
            isOn={isBiometricsEnabled}
            onColor="#0d6efd"
            offColor="#ccc"
            labelStyle={{ color: isDarkMode ? 'white' : 'black' }}
            size="medium"
            onToggle={async (isOn) => {
              try {
                setIsBiometricsEnabled(isOn);
                await AsyncStorage.setItem('isBiometricsEnabled', isOn.toString());

                if (isOn) {
                  const token = await AsyncStorage.getItem('authToken');
                  const user = await AsyncStorage.getItem('user');
                  if (token) {
                    await AsyncStorage.setItem('biometricToken', token);
                  }
                  if (user) {
                    await AsyncStorage.setItem('biometricUser', user);
                  }
                } else {
                  await AsyncStorage.removeItem('biometricToken');
                  await AsyncStorage.removeItem('biometricUser');
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to save biometric setting.');
              }
            }}
          />
        </View>
        <TouchableOpacity style={styles.item} onPress={() => setIsLanguageModalVisible(true)}>
          <View>
            <Text style={[styles.text, { color: isDarkMode ? 'white' : '#333' }]}>Language</Text>
            <Text style={{ color: isDarkMode ? '#888' : '#666', fontSize: 12 }}>{selectedLanguage}</Text>
          </View>
          <Languages size={20} color={isDarkMode ? 'white' : '#0d6efd'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('PersonalData')}>
          <Text style={[styles.text, { color: isDarkMode ? 'white' : '#333' }]}>Update Profile</Text>
          <User size={20} color={isDarkMode ? 'white' : '#0d6efd'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('ChangePassword')}>
          <Text style={[styles.text, { color: isDarkMode ? 'white' : '#333' }]}>Change Password</Text>
          <Lock size={20} color={isDarkMode ? 'white' : '#0d6efd'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('MapLocation')}>
          <Text style={[styles.text, { color: isDarkMode ? 'white' : '#333' }]}>View Cities Map</Text>
          <MapPin size={20} color={isDarkMode ? 'white' : '#0d6efd'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Reset')}>
          <Text style={[styles.text, { color: isDarkMode ? 'white' : '#333' }]}>Reset Onboarding</Text>
          <Trash2 size={20} color={isDarkMode ? 'white' : '#0d6efd'} />
        </TouchableOpacity>
        <View style={{ height: hp(2) }} />
        <Button title="Save Settings" onPress={handleSave} />
        <Button title="Log Out" onPress={handleLogout} style={{ backgroundColor: '#dc3545', marginTop: 10 }} />
      </ScrollView>

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
  },
  scrollContainer: {
    padding: wp(5),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: fontSize(22),
    fontWeight: 'bold',
    marginLeft: 15,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2.5),
  },
  text: {
    fontSize: fontSize(16),
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
