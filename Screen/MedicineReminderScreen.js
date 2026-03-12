import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, ArrowLeft, Plus, Clock, Calendar, List, ClipboardList } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { wp, hp, fontSize } from './responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';
import { Platform } from 'react-native';

export default function MedicineReminderScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => getStyles(isDarkMode, insets), [isDarkMode, insets]);
  const API_BASE = 'https://dashboard-backend-xrss.vercel.app';
  const [authToken, setAuthToken] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [customMedicine, setCustomMedicine] = useState('');
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [repeat, setRepeat] = useState('None');
  const [time, setTime] = useState(new Date());
  const [date, setDate] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const route = useRoute();
  const { editItem } = route.params || {};

  const [customDays, setCustomDays] = useState('');
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadToken = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) setAuthToken(token);
    } catch (err) {
      console.error('Error loading auth token:', err);
    }
  }, []);

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  const fetchMedicines = async () => {
    try {
      if (!authToken) return;
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      // FIXED: Use correct path /api/medicines/list
      const res = await axios.get(`${API_BASE}/api/medicines/list`, config);
      setMedicines(res.data);
    } catch (err) {
      console.error('Fetch Medicines Error:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to load medicines.');
      }
    }
  };

  const fetchReminders = async () => {
    try {
      if (!authToken) return;
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      const res = await axios.get(`${API_BASE}/api/reminders`, config);
      setReminders(res.data);
    } catch (err) {
      console.error('Fetch Reminders Error:', err);
      if (err.response?.status === 401) {
        console.warn('Unauthorized access to reminders - possible token issue');
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchMedicines(), fetchReminders()]);
    setRefreshing(false);
  };

  useEffect(() => {
    if (authToken !== null) {
      const loadData = async () => {
        await Promise.all([fetchMedicines(), fetchReminders()]);
        setLoading(false);
        setTimeout(() => setPageLoading(false), 800);

        // Handle Edit Item pre-fill
        if (editItem) {
          console.log("Pre-filling for edit:", editItem);
          setSelectedMedicine(editItem.medicineId || '');
          setCustomMedicine(!editItem.medicineId ? editItem.medicineName : '');
          setDosage(editItem.dosage);
          setNotes(editItem.notes || '');
          setRepeat(editItem.repeat || 'None');
          if (editItem.date) setDate(new Date(editItem.date));
          if (editItem.time) {
            const timeParts = editItem.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (timeParts) {
              let hours = parseInt(timeParts[1]);
              const minutes = parseInt(timeParts[2]);
              const ampm = timeParts[3].toUpperCase();
              if (ampm === 'PM' && hours < 12) hours += 12;
              if (ampm === 'AM' && hours === 12) hours = 0;
              const newTime = new Date();
              newTime.setHours(hours, minutes, 0, 0);
              setTime(newTime);
            }
          }
        }
      };
      loadData();
    }
  }, [authToken, editItem]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('reminders', {
        name: 'Medicine Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }, []);

  const addReminder = async () => {
    if ((!selectedMedicine && !customMedicine) || !dosage) {
      Alert.alert('Error', 'Please select or enter a medicine and dosage');
      return;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please enable notifications to use reminders.');
      return;
    }

    const medName = selectedMedicine
      ? medicines.find(m => m._id === selectedMedicine)?.name
      : customMedicine;

    if (!medName) {
      Alert.alert('Error', 'Could not determine medicine name');
      return;
    }

    try {
      if (!authToken) {
        Alert.alert('Error', 'Session expired. Please log in again.');
        return;
      }
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      const response = await axios.post(
        `${API_BASE}/api/reminders`,
        {
          medicineId: selectedMedicine || null,
          medicineName: medName,
          dosage,
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date,
          repeat,
          notes,
          customDays: repeat === 'Custom' ? customDays : null,
          isEdit: !!editItem,
          reminderId: editItem?._id || null
        },
        config
      );

      // Schedule local notification
      let notificationTrigger = null;
      const now = new Date();
      const triggerDate = new Date(date);
      triggerDate.setHours(time.getHours());
      triggerDate.setMinutes(time.getMinutes());
      triggerDate.setSeconds(0);
      triggerDate.setMilliseconds(0);

      if (repeat === 'Daily') {
        notificationTrigger = {
          type: 'calendar',
          hour: time.getHours(),
          minute: time.getMinutes(),
          repeats: true,
        };
      } else if (repeat === 'Weekly') {
        notificationTrigger = {
          type: 'calendar',
          weekday: triggerDate.getDay() + 1,
          hour: time.getHours(),
          minute: time.getMinutes(),
          repeats: true,
        };
      } else {
        // One-time reminder using relative seconds
        const diffInSeconds = Math.max(1, Math.floor((triggerDate.getTime() - now.getTime()) / 1000));
        notificationTrigger = {
          type: 'timeInterval',
          seconds: diffInSeconds,
          repeats: false,
        };
      }

      if (notificationTrigger) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `💊 Medicine Reminder: ${medName}`,
              body: `Time to take your ${dosage}. ${notes || ''}`,
              data: { reminderId: response.data._id },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.MAX,
              channelId: 'reminders',
            },
            trigger: notificationTrigger,
          });
          console.log('Notification scheduled successfully with trigger:', notificationTrigger);
        } catch (notifErr) {
          console.error('Notification Scheduling Error:', notifErr);
        }
      }

      fetchReminders();
      setSelectedMedicine('');
      setCustomMedicine('');
      setDosage('');
      setNotes('');
      setRepeat('None');
      setCustomDays('');

      if (editItem) {
        Alert.alert('Success', 'Reminder updated perfectly!');
        navigation.navigate('ReminderSchedule');
      } else {
        Alert.alert('Success', 'Reminder added perfectly!');
      }
    } catch (err) {
      console.error('Add Reminder Error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Something went wrong';
      Alert.alert('Error', `Failed to process reminder: ${errorMsg}`);
    }
  };

  const deleteReminder = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      await axios.delete(`${API_BASE}/api/reminders/${id}`, config);
      fetchReminders();
    } catch (err) {
      console.error('Delete Reminder Error:', err);
    }
  };

  if (pageLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0d6efd" />
        <Text style={styles.loadingText}>Your Health Matters...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={60} color="#ff4d4f" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={isDarkMode ? "#fff" : "#333"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Reminders</Text>
        <View style={styles.headerIcon}>
          <Bell size={24} color="#0d6efd" />
        </View>
      </View>

      <FlatList
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.cardContainer}>
              <View style={styles.cardHeader}>
                <ClipboardList size={22} color="#0d6efd" style={{ marginRight: 8 }} />
                <Text style={styles.sectionTitle}>Add New Reminder</Text>
              </View>
              <View style={styles.formContent}>
                <View style={styles.inputWrapper}>
                  {!isManualEntry ? (
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={selectedMedicine}
                        onValueChange={(itemValue) => {
                          setSelectedMedicine(itemValue);
                          if (itemValue !== '') {
                            setCustomMedicine('');
                          }
                        }}
                        style={styles.picker}
                        dropdownIconColor={isDarkMode ? "#aaa" : "#888"}
                      >
                        <Picker.Item label="Select Medicine from Store" value="" />
                        {medicines.map((med) => (
                          <Picker.Item key={med._id} label={med.name} value={med._id} />
                        ))}
                      </Picker>
                    </View>
                  ) : (
                    <TextInput
                      placeholder="Type Medicine Name Manually"
                      placeholderTextColor={isDarkMode ? "#666" : "#aaa"}
                      value={customMedicine}
                      onChangeText={setCustomMedicine}
                      style={styles.textInput}
                    />
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setIsManualEntry(!isManualEntry);
                    setSelectedMedicine('');
                    setCustomMedicine('');
                  }}
                  style={{ marginBottom: hp(2.5), alignSelf: 'center', backgroundColor: isDarkMode ? '#333' : '#f0f2f5', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 }}
                >
                  <Text style={{ color: '#0d6efd', fontWeight: 'bold', fontSize: 13 }}>
                    {isManualEntry ? "✨ Select from our Store instead" : "✍️ Type manual name instead"}
                  </Text>
                </TouchableOpacity>

                <View style={[styles.inputWrapper, { flexDirection: 'row', gap: 10 }]}>
                  <TextInput
                    placeholder="Dosage (e.g. 1 Tablet)"
                    placeholderTextColor={isDarkMode ? "#666" : "#aaa"}
                    value={dosage}
                    onChangeText={setDosage}
                    style={[styles.textInput, { flex: 1 }]}
                  />
                  <View style={[styles.pickerContainer, { flex: 1 }]}>
                    <Picker
                      selectedValue={repeat}
                      onValueChange={(itemValue) => setRepeat(itemValue)}
                      style={styles.picker}
                      dropdownIconColor={isDarkMode ? "#aaa" : "#888"}
                    >
                      <Picker.Item label="One Time" value="Once" />
                      <Picker.Item label="Daily" value="Daily" />
                      <Picker.Item label="Weekly" value="Weekly" />
                      <Picker.Item label="Monthly" value="Monthly" />
                      <Picker.Item label="Custom Days" value="Custom" />
                    </Picker>
                  </View>
                </View>

                {repeat === 'Custom' && (
                  <View style={styles.inputWrapper}>
                    <TextInput
                      placeholder="Number of days (e.g. 10)"
                      placeholderTextColor={isDarkMode ? "#666" : "#aaa"}
                      value={customDays}
                      onChangeText={setCustomDays}
                      keyboardType="numeric"
                      style={styles.textInput}
                    />
                  </View>
                )}

                <View style={styles.dateTimeRow}>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateTimeButton}>
                    <Calendar size={18} color="#0d6efd" style={{ marginRight: 8 }} />
                    <Text style={styles.dateTimeText}>{date.toLocaleDateString()}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.dateTimeButton}>
                    <Clock size={18} color="#0d6efd" style={{ marginRight: 8 }} />
                    <Text style={styles.dateTimeText}>
                      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Notes (optional)"
                    placeholderTextColor={isDarkMode ? "#666" : "#aaa"}
                    value={notes}
                    onChangeText={setNotes}
                    style={[styles.textInput, { height: hp(6) }]}
                    multiline
                  />
                </View>

                <TouchableOpacity onPress={addReminder} style={styles.addButton}>
                  <Plus size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.addButtonText}>{editItem ? 'Update Reminder' : 'Set Reminder'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate('ReminderSchedule')}
                  style={[styles.addButton, { backgroundColor: isDarkMode ? '#333' : '#e7f1ff', marginTop: hp(2.5) }]}
                >
                  <ClipboardList size={20} color={isDarkMode ? '#fff' : '#0d6efd'} style={{ marginRight: 8 }} />
                  <Text style={[styles.addButtonText, { color: isDarkMode ? '#fff' : '#0d6efd' }]}>View My Schedule</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
        data={[]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={48} color={isDarkMode ? "#333" : "#e0e0e0"} />
            <Text style={styles.emptyText}>Set a new reminder above</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0d6efd']} />
        }
        contentContainerStyle={{ paddingHorizontal: wp(5), paddingBottom: hp(10) }}
      />

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(e, selected) => {
            setShowDatePicker(false);
            if (selected) setDate(selected);
          }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={(e, selected) => {
            setShowTimePicker(false);
            if (selected) setTime(selected);
          }}
        />
      )}
    </View>
  );
}

const getStyles = (isDarkMode, insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#121212' : '#f8f9fa',
    paddingTop: (insets.top || 50),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#121212' : '#f8f9fa',
  },
  loadingText: {
    marginTop: 15,
    fontSize: fontSize(16),
    color: isDarkMode ? '#aaa' : '#666',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    height: hp(8),
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  headerTitle: {
    fontSize: fontSize(20),
    fontWeight: '800',
    color: isDarkMode ? '#fff' : '#1a1a1a',
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
    borderRadius: 25,
    padding: wp(6), // Increased
    marginTop: hp(2), // Increased
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: fontSize(18),
    fontWeight: '700',
    color: isDarkMode ? '#fff' : '#1a1a1a',
    marginBottom: hp(2),
  },
  inputGroup: {
    // Removed gap for better compatibility, using margins in children
  },
  pickerWrapper: {
    backgroundColor: isDarkMode ? '#252525' : '#f0f2f5',
    borderRadius: 15,
    height: hp(7), // Increased
    justifyContent: 'center',
    paddingHorizontal: wp(2),
    marginBottom: hp(1.5), // Using margin instead of gap
  },
  picker: {
    color: isDarkMode ? '#fff' : '#333',
    width: '100%',
    marginLeft: -8, // Adjustment for better alignment
  },
  inputWrapper: {
    backgroundColor: isDarkMode ? '#252525' : '#f0f2f5',
    borderRadius: 15,
    height: hp(7), // Increased
    paddingHorizontal: wp(4),
    justifyContent: 'center',
    marginBottom: hp(1.5), // Space between inputs
  },
  textInput: {
    fontSize: fontSize(15),
    color: isDarkMode ? '#fff' : '#333',
  },
  inputRow: {
    flexDirection: 'row',
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#252525' : '#f0f2f5',
    borderRadius: 15,
    height: hp(7), // Increased
    paddingHorizontal: wp(4),
    marginHorizontal: 5, // Spacing between buttons
  },
  dateTimeText: {
    fontSize: fontSize(14),
    color: isDarkMode ? '#fff' : '#333',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#0d6efd',
    height: hp(7),
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(1),
    shadowColor: '#0d6efd',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: fontSize(16),
    fontWeight: '700',
  },
  reminderCard: {
    backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
    borderRadius: 20,
    marginBottom: hp(2),
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardAccent: {
    width: 6,
    backgroundColor: '#0d6efd',
  },
  cardContent: {
    flex: 1,
    padding: wp(4.5),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medNameText: {
    fontSize: fontSize(18),
    fontWeight: '700',
    color: isDarkMode ? '#fff' : '#1a1a1a',
    marginBottom: 2,
  },
  dosageText: {
    fontSize: fontSize(14),
    color: '#0d6efd',
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 5,
  },
  cardFooter: {
    flexDirection: 'row',
    marginTop: hp(1.5),
    gap: 12,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(13, 110, 253, 0.1)' : 'rgba(13, 110, 253, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#252525' : '#f0f2f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: fontSize(12),
    color: '#0d6efd',
    fontWeight: '700',
  },
  noteBox: {
    marginTop: hp(1.5),
    backgroundColor: isDarkMode ? '#252525' : '#f8f9fa',
    padding: 10,
    borderRadius: 12,
  },
  noteText: {
    fontSize: fontSize(13),
    color: isDarkMode ? '#aaa' : '#666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(10),
  },
  emptyText: {
    marginTop: 10,
    fontSize: fontSize(16),
    color: isDarkMode ? '#444' : '#ccc',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(10),
  },
  errorText: {
    fontSize: fontSize(16),
    color: isDarkMode ? '#fff' : '#333',
    textAlign: 'center',
    marginTop: hp(2),
    marginBottom: hp(3),
  },
  retryButton: {
    backgroundColor: '#0d6efd',
    paddingHorizontal: wp(10),
    paddingVertical: hp(2),
    borderRadius: 15,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: fontSize(16),
    fontWeight: '700',
  },
});
