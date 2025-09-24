import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const AcceptedTransactionScreen = ({ navigation, route }) => {
  const { transaction, cartItems, transactionTime } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.title}>Payment Successful!</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Details</Text>
          <DetailRow label="Amount" value={`Rs ${transaction.depositAmount}`} />
          <DetailRow label="Wallet Number" value={transaction.walletNumber} />
          <DetailRow label="Wallet Name" value={transaction.walletName} />
          <DetailRow label="Transaction ID" value={transaction.transactionID} />
          <DetailRow label="Date" value={transactionTime.toLocaleDateString()} />
          <DetailRow label="Time" value={transactionTime.toLocaleTimeString()} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchased Items</Text>
          {cartItems.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name} x{item.quantity}</Text>
              <Text style={styles.itemPrice}>Rs {item.price * item.quantity}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace('Home')}
        >
          <Text style={styles.buttonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  content: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  successIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#28a745',
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007bff',
    marginBottom: 15,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 15,
    color: '#6c757d',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: '#212529',
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 15,
    color: '#495057',
  },
  itemPrice: {
    fontSize: 15,
    color: '#28a745',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AcceptedTransactionScreen;