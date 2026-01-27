import React, { useState } from 'react';
import Footer from './Footer';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Button, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const InventoryManagement = () => {
  const [medicines, setMedicines] = useState([
    { id: '1', name: 'Paracetamol', quantity: 50, price: '$5', expiry: '2025-08-01' },
    { id: '2', name: 'Ibuprofen', quantity: 30, price: '$8', expiry: '2024-12-01' },
    { id: '3', name: 'Amoxicillin', quantity: 20, price: '$12', expiry: '2026-03-15' },
  ]);

  const [newMedicine, setNewMedicine] = useState({ name: '', quantity: '', price: '', expiry: '' });

  const addMedicine = () => {
    if (!newMedicine.name || !newMedicine.quantity || !newMedicine.price || !newMedicine.expiry) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setMedicines([
      ...medicines,
      { ...newMedicine, id: (medicines.length + 1).toString() }
    ]);
    setNewMedicine({ name: '', quantity: '', price: '', expiry: '' });
  };

  const deleteMedicine = (id) => {
    setMedicines(medicines.filter(medicine => medicine.id !== id));
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.details}>Quantity: {item.quantity}</Text>
      <Text style={styles.details}>Price: {item.price}</Text>
      <Text style={styles.details}>Expiry: {item.expiry}</Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteMedicine(item.id)}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Inventory Management</Text>

      <TextInput
        placeholder="Medicine Name"
        style={styles.input}
        value={newMedicine.name}
        onChangeText={text => setNewMedicine({ ...newMedicine, name: text })}
      />
      <TextInput
        placeholder="Quantity"
        style={styles.input}
        keyboardType="numeric"
        value={newMedicine.quantity}
        onChangeText={text => setNewMedicine({ ...newMedicine, quantity: text })}
      />
      <TextInput
        placeholder="Price"
        style={styles.input}
        value={newMedicine.price}
        onChangeText={text => setNewMedicine({ ...newMedicine, price: text })}
      />
      <TextInput
        placeholder="Expiry Date (YYYY-MM-DD)"
        style={styles.input}
        value={newMedicine.expiry}
        onChangeText={text => setNewMedicine({ ...newMedicine, expiry: text })}
      />

      <Button title="Add Medicine" onPress={addMedicine} />

      <FlatList
        data={medicines}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.list}
      />
      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f4f7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  list: {
    marginTop: 20,
  },
  item: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  details: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    marginTop: 10,
    backgroundColor: '#e63946',
    padding: 10,
    borderRadius: 8,
  },
  deleteText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default InventoryManagement;
