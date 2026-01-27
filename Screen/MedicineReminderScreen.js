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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function MedicineReminderScreen() {
  const navigation = useNavigation();
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
    try {
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      await axios.post(
        `${API_BASE}/api/reminders`,
        {
          medicineId: selectedMedicine || null,
          medicineName: customMedicine || null,
          dosage,
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date,
          repeat,
          notes,
        },
        config
      );
      fetchReminders();
      setSelectedMedicine('');
      setCustomMedicine('');
      setDosage('');
      setNotes('');
      setRepeat('None');
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
        <Ionicons name="alert-circle-outline" size={48} color="#3b82f6" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medicine Reminders</Text>
      </View>
      {/* Medicine Picker */}
      <Picker
        selectedValue={selectedMedicine}
        onValueChange={(value) => setSelectedMedicine(value)}
        style={styles.picker}
      >
        <Picker.Item label="Select Medicine" value="" />
        {medicines.map((med) => (
          <Picker.Item key={med._id} label={`${med.name} (${med.dosage})`} value={med._id} />
        ))}
      </Picker>
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
            <Text style={styles.reminderText}>
              {item.medicineName} - {item.dosage}
            </Text>
            <Text style={styles.reminderSubText}>
              {new Date(item.date).toDateString()} at {item.time}
            </Text>
            {item.notes ? <Text style={{ color: '#777' }}>Notes: {item.notes}</Text> : null}
            <TouchableOpacity onPress={() => deleteReminder(item._id)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
        }
      />
      {/* Watermark */}
      <View style={styles.watermarkContainer}>
        <Text style={styles.watermarkText}>
          In Development - Functionality May Be Incomplete
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: '#f9f9f9' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
  picker: { backgroundColor: '#fff', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: { fontSize: 16 },
  addButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  reminderCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    elevation: 2,
  },
  reminderText: { fontSize: 16, fontWeight: 'bold' },
  reminderSubText: { color: '#555', marginVertical: 5 },
  deleteText: { color: 'red' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { marginVertical: 10, fontSize: 16, textAlign: 'center' },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: '#fff', fontWeight: 'bold' },
  watermarkContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    opacity: 0.6,
  },
  watermarkText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
});