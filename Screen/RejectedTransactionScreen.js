import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const RejectedTransactionScreen = ({ navigation, route }) => {
  const { transaction } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>❌</Text>
      </View>
      <Text style={styles.title}>Transaction Failed</Text>
      
      <View style={styles.reasonBox}>
        <Text style={styles.reasonText}>
          {transaction.reason || 'Possible reasons:'}
        </Text>
        <Text style={styles.bulletPoint}>• Incorrect payment amount</Text>
        <Text style={styles.bulletPoint}>• Invalid transaction ID</Text>
        <Text style={styles.bulletPoint}>• Mismatched account details</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={() => navigation.navigate('Help')}
      >
        <Text style={styles.buttonText}>Contact Support</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => navigation.goBack()}
      >
        <Text style={[styles.buttonText, styles.secondaryText]}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    backgroundColor: '#fff',
  },
  iconContainer: {
    marginBottom: 25,
  },
  icon: {
    fontSize: 80,
    color: '#dc3545',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#dc3545',
    marginBottom: 20,
  },
  reasonBox: {
    backgroundColor: '#ffe3e3',
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
    width: '100%',
  },
  reasonText: {
    fontSize: 16,
    color: '#dc3545',
    marginBottom: 10,
    textAlign: 'center',
  },
  bulletPoint: {
    fontSize: 14,
    color: '#dc3545',
    marginLeft: 10,
    marginBottom: 5,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#dc3545',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#007bff',
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#fff',
  },
  secondaryText: {
    color: '#007bff',
  },
});

export default RejectedTransactionScreen;