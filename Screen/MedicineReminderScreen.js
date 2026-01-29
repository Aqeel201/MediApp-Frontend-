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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Bell, Plus, Trash, AlertCircle, Clock, Calendar } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { wp, hp, fontSize } from './responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';

export default function MedicineReminderScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const API_BASE = 'https://dashboard-backend-xrss.vercel.app';
  const [authToken, setAuthToken] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [customMedicine, setCustomMedicine] = useState('');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [repeat, setRepeat] = useState('None');
  const [time, setTime] = useState(new Date());
  const [date, setDate] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
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
      const config = authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {};
      const res = await axios.get(`${API_BASE}/medicines`, config);
      setMedicines(res.data);
    } catch (err) {
      console.error('Fetch Medicines Error:', err);
      setError('Failed to load medicines.');
    }
  };

  const fetchReminders = async () => {
    try {
      const config = authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {};
      const res = await axios.get(`${API_BASE}/api/reminders`, config);
      setReminders(res.data);
    } catch (err) {
      console.error('Fetch Reminders Error:', err);
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
      };
      loadData();
    }
  }, [authToken]);

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

    try {
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
        },
        config
      );

      // Schedule local notification
      const trigger = new Date(date);
      trigger.setHours(time.getHours());
      trigger.setMinutes(time.getMinutes());
      trigger.setSeconds(0);

      if (trigger > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Medicine Reminder: ${medName}`,
            body: `It's time to take ${dosage}. ${notes || ''}`,
            data: { reminderId: response.data._id },
          },
          trigger,
        });
      }

      fetchReminders();
      setSelectedMedicine('');
      setCustomMedicine('');
      setDosage('');
      setNotes('');
      setRepeat('None');
      Alert.alert('Success', 'Reminder added perfectly!');
    } catch (err) {
      console.error('Add Reminder Error:', err);
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
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#f8fafc', '#ffffff']} style={styles.errorContainer}>
        <AlertCircle size={48} color="#3b82f6" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + hp(1), paddingBottom: insets.bottom + hp(2) }]}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
          <ArrowLeft size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medicine Reminders</Text>
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedMedicine}
          onValueChange={(value) => setSelectedMedicine(value)}
          style={styles.picker}
          dropdownIconColor={isDarkMode ? "#fff" : "#000"}
        >
          <Picker.Item label="Select Store Medicine" value="" />
          {medicines.map((med) => (
            <Picker.Item key={med._id} label={`${med.name} (${med.dosage || 'No Dosage'})`} value={med._id} />
          ))}
        </Picker>
      </View>
      {/* Or enter custom medicine */}
      <TextInput
        placeholder="Or enter custom medicine name"
        value={customMedicine}
        onChangeText={setCustomMedicine}
        style={styles.input}
      />
      <TextInput
        placeholder="Dosage (e.g., 1 Tablet)"
        value={dosage}
        onChangeText={setDosage}
        style={styles.input}
      />
      {/* Notes */}
      <TextInput
        placeholder="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        style={styles.input}
      />
      {/* Repeat */}
      <Picker selectedValue={repeat} onValueChange={(val) => setRepeat(val)} style={styles.picker}>
        <Picker.Item label="No Repeat" value="None" />
        <Picker.Item label="Daily" value="Daily" />
        <Picker.Item label="Weekly" value="Weekly" />
      </Picker>
      {/* Date Picker */}
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.button}>
        <Text style={styles.buttonText}>Select Date: {date.toDateString()}</Text>
      </TouchableOpacity>
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
      {/* Time Picker */}
      <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.button}>
        <Text style={styles.buttonText}>
          Select Time: {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>
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
      {/* Add Reminder */}
      <TouchableOpacity onPress={addReminder} style={styles.addButton}>
        <Text style={styles.addButtonText}>Add Reminder</Text>
      </TouchableOpacity>
      {/* Reminders List */}
      <FlatList
        data={reminders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.reminderCard}>
            <View style={styles.reminderHeader}>
              <Text style={styles.reminderText}>
                {item.medicineName}
              </Text>
              <TouchableOpacity onPress={() => deleteReminder(item._id)} style={styles.deleteButton}>
                <Trash size={20} color="#ff4d4f" />
              </TouchableOpacity>
            </View>
            <View style={styles.reminderDetails}>
              <View style={styles.detailRow}>
                <Clock size={16} color={isDarkMode ? "#aaa" : "#666"} />
                <Text style={styles.reminderSubText}> {item.time}</Text>
              </View>
              <View style={styles.detailRow}>
                <Calendar size={16} color={isDarkMode ? "#aaa" : "#666"} />
                <Text style={styles.reminderSubText}> {new Date(item.date).toDateString()}</Text>
              </View>
              <Text style={styles.dosageText}>{item.dosage}</Text>
            </View>
            {item.notes ? (
              <View style={styles.notesContainer}>
                <Text style={styles.notesText}>Note: {item.notes}</Text>
              </View>
            ) : null}
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
        }
        contentContainerStyle={{ paddingBottom: hp(5) }}
      />
      {/* No Watermark - Removed "In Development" */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: wp(5),
    flex: 1,
    backgroundColor: isDarkMode ? '#121212' : '#f8fafc'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2.5),
    justifyContent: 'space-between'
  },
  headerTitle: {
    fontSize: fontSize(22),
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#1F2937'
  },
  pickerContainer: {
    backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
    borderRadius: 12,
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: isDarkMode ? '#333' : '#e2e8f0',
    overflow: 'hidden',
  },
  picker: {
    height: hp(6),
    color: isDarkMode ? '#fff' : '#333',
  },
  input: {
    backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
    borderWidth: 1,
    borderColor: isDarkMode ? '#333' : '#e2e8f0',
    padding: wp(4),
    marginBottom: hp(1.5),
    borderRadius: 12,
    fontSize: fontSize(16),
    color: isDarkMode ? '#fff' : '#333',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#2d3748' : '#e2e8f0',
    padding: wp(4),
    borderRadius: 12,
    marginBottom: hp(1.5),
  },
  buttonText: {
    fontSize: fontSize(15),
    color: isDarkMode ? '#fff' : '#1a202c',
    fontWeight: '500'
  },
  addButton: {
    backgroundColor: '#3b82f6',
    padding: hp(2),
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: hp(3),
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: fontSize(17),
    fontWeight: 'bold'
  },
  reminderCard: {
    backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
    padding: wp(4.5),
    borderRadius: 16,
    marginBottom: hp(2),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  reminderText: {
    fontSize: fontSize(18),
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#1a202c',
    flex: 1
  },
  deleteButton: {
    padding: 8,
  },
  reminderDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: wp(3),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderSubText: {
    fontSize: fontSize(14),
    color: isDarkMode ? '#a0aec0' : '#718096',
  },
  dosageText: {
    fontSize: fontSize(14),
    fontWeight: '600',
    color: '#3b82f6',
    backgroundColor: isDarkMode ? '#1a365d' : '#ebf8ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  notesContainer: {
    marginTop: hp(1),
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? '#333' : '#edf2f7',
  },
  notesText: {
    fontSize: fontSize(14),
    fontStyle: 'italic',
    color: isDarkMode ? '#cbd5e0' : '#4a5568',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#121212' : '#fff'
  },
  loadingText: {
    marginTop: 10,
    fontSize: fontSize(16),
    color: isDarkMode ? '#fff' : '#333'
  },
});
