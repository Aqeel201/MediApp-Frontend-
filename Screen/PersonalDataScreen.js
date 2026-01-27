// PersonalDataScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faCalendar,
  faIdCard,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from './ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, CreditCard } from 'lucide-react-native';

const PersonalDataScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  // State variables
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [CNICNo, setCNICNo] = useState(''); // CNIC field
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load user data from AsyncStorage
  const loadUserData = useCallback(async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setCNICNo(user.CNICNo || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setAddress(user.address || '');
        setDob(user.dob || '');
        setProfileImage(user.profileImage || null);
      }
    } catch (error) {
      console.error('Error loading user data', error);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  }, [loadUserData]);

  // Take a photo using Camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Camera permission status:', status);
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }
      console.log('Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      console.log('Camera result:', result);
      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error in takePhoto:', error);
      Alert.alert('Error', 'Failed to launch camera.');
    }
  };

  // Pick an image from Gallery
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Media library permission status:', status);
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Photo library permission is required to select photos.');
        return;
      }
      console.log('Launching gallery...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      console.log('Gallery result:', result);
      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error in pickImage:', error);
      Alert.alert('Error', 'Failed to launch gallery.');
    }
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  // Save updated data to the backend
  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName || '');
      formData.append('CNICNo', CNICNo || '');
      formData.append('phone', phone || '');
      formData.append('address', address || '');
      formData.append('dob', dob || '');

      if (profileImage && !profileImage.startsWith('http')) {
        const filename = profileImage.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('profileImage', {
          uri: profileImage,
          name: filename,
          type,
        });
      }

      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.put(
        'https://auth-backend-three-navy.vercel.app/api/auth/update',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        Alert.alert('Data Saved', 'Your personal data has been updated.');
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        if (response.data.user.profileImage) {
          setProfileImage(response.data.user.profileImage);
        }
      } else {
        Alert.alert('Update Failed', response.data.message);
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert(
        'Update Failed',
        error.response?.data?.message || 'An error occurred.'
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = getStyles(isDarkMode);
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingTop: insets.top + 10 }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={isDarkMode ? 'white' : '#0d6efd'} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Personal Data</Text>
        </View>

        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handleImagePicker}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profilePic} />
            ) : (
              <User size={80} color={isDarkMode ? 'white' : '#0d6efd'} />
            )}
            <Text style={styles.editText}>Edit Profile Picture</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <User size={20} color={isDarkMode ? 'white' : '#0d6efd'} />
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
              placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
            />
          </View>
          <View style={styles.inputContainer}>
            <FontAwesomeIcon icon={faUser} size={20} color={isDarkMode ? 'white' : '#0d6efd'} />
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
              placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
            />
          </View>
          <View style={styles.inputContainer}>
            <CreditCard size={20} color={isDarkMode ? 'white' : '#0d6efd'} />
            <TextInput
              style={styles.input}
              value={CNICNo}
              onChangeText={setCNICNo}
              placeholder="CNIC Number"
              placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputContainer}>
            <Mail size={20} color={isDarkMode ? 'white' : '#0d6efd'} />
            <TextInput
              style={[styles.input, { color: 'gray' }]}
              value={email}
              editable={false}
            />
          </View>
          <View style={styles.inputContainer}>
            <Phone size={20} color={isDarkMode ? 'white' : '#0d6efd'} />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone"
              keyboardType="phone-pad"
              placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
            />
          </View>
          <View style={styles.inputContainer}>
            <MapPin size={20} color={isDarkMode ? 'white' : '#0d6efd'} />
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Address"
              placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
            />
          </View>
          <View style={styles.inputContainer}>
            <Calendar size={20} color={isDarkMode ? 'white' : '#0d6efd'} />
            <TextInput
              style={styles.input}
              value={dob}
              onChangeText={setDob}
              placeholder="Date of Birth (MM/DD/YYYY)"
              placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
            />
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#1c1c1c' : 'white',
    },
    header: {
      backgroundColor: 'transparent',
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerText: {
      color: isDarkMode ? 'white' : '#0d6efd',
      fontSize: 20,
      fontWeight: 'bold',
      marginLeft: 20,
    },
    iconButton: {
      padding: 10,
    },
    profileSection: {
      alignItems: 'center',
      marginVertical: 20,
    },
    profilePic: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: '#eaeaea',
    },
    editText: {
      marginTop: 10,
      color: '#0d6efd',
      textDecorationLine: 'underline',
    },
    form: {
      padding: 20,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#444' : '#eaeaea',
      paddingBottom: 10,
    },
    input: {
      flex: 1,
      marginLeft: 10,
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#000',
    },
    saveButton: {
      backgroundColor: '#0d6efd',
      height: 50,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
  });

export default PersonalDataScreen;
