import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Button, Alert } from 'react-native';

const PatientRecords = () => {
  const [patients, setPatients] = useState([
    { id: '1', fullname: 'John Doe', dob: '1985-01-15', gender: 'Male', contact: '123-456-7890', medicalHistory: 'Hypertension' },
    { id: '2', fullname: 'Jane Smith', dob: '1990-03-22', gender: 'Female', contact: '987-654-3210', medicalHistory: 'Diabetes' },
  ]);

  const [newPatient, setNewPatient] = useState({ fullname: '', dob: '', gender: '', contact: '', medicalHistory: '' });

  const addPatient = () => {
    if (!newPatient.fullname || !newPatient.dob || !newPatient.gender || !newPatient.contact || !newPatient.medicalHistory) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setPatients([
      ...patients,
      { ...newPatient, id: (patients.length + 1).toString() }
    ]);
    setNewPatient({ fullname: '', dob: '', gender: '', contact: '', medicalHistory: '' });
  };

  const deletePatient = (id) => {
    setPatients(patients.filter(patient => patient.id !== id));
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.name}>{item.fullname}</Text>
      <Text style={styles.details}>DOB: {item.dob}</Text>
      <Text style={styles.details}>Gender: {item.gender}</Text>
      <Text style={styles.details}>Contact: {item.contact}</Text>
      <Text style={styles.details}>Medical History: {item.medicalHistory}</Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deletePatient(item.id)}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patient Records</Text>
      
      <TextInput
        placeholder="Full Name"
        style={styles.input}
        value={newPatient.fullname}
        onChangeText={text => setNewPatient({ ...newPatient, fullname: text })}
      />
      <TextInput
        placeholder="Date of Birth (YYYY-MM-DD)"
        style={styles.input}
        value={newPatient.dob}
        onChangeText={text => setNewPatient({ ...newPatient, dob: text })}
      />
      <TextInput
        placeholder="Gender"
        style={styles.input}
        value={newPatient.gender}
        onChangeText={text => setNewPatient({ ...newPatient, gender: text })}
      />
      <TextInput
        placeholder="Contact Number"
        style={styles.input}
        keyboardType="phone-pad"
        value={newPatient.contact}
        onChangeText={text => setNewPatient({ ...newPatient, contact: text })}
      />
      <TextInput
        placeholder="Medical History"
        style={styles.input}
        value={newPatient.medicalHistory}
        onChangeText={text => setNewPatient({ ...newPatient, medicalHistory: text })}
      />

      <Button title="Add Patient" onPress={addPatient} />

      <FlatList
        data={patients}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
  },
  list: {
    marginTop: 20,
  },
  item: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  details: {
    fontSize: 14,
    color: '#6c757d',
  },
  deleteButton: {
    marginTop: 10,
    backgroundColor: '#dc3545',
    padding: 8,
    borderRadius: 8,
  },
  deleteText: {
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default PatientRecords;
