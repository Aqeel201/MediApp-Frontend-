// TransactionHistoryScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
  Image,
  ScrollView, // Added ScrollView import
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faReceipt, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import moment from 'moment';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for the close button

const TransactionHistoryScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  const [userId, setUserId] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Retrieve logged-in user data from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem("user").then(userData => {
      if (userData) {
        const user = JSON.parse(userData);
        if (user.email) setUserId(user.email);
      }
    });
  }, []);

  // Fetch transactions for the specific user
  const loadTransactions = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token || !userId) return;
      
      const response = await axios.get(`http://192.168.18.24:2000/api/transactions?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.status === 200) {
        // Adjust based on your API response structure.
        const transactionsData = response.data.transactions || response.data || [];
        setTransactions(transactionsData);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadTransactions();
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  // Helper functions for formatting
  const formatDate = (dateString) => moment(dateString).format('DD MMM YYYY, hh:mm A');
  const formatCurrency = (amount) => `Rs. ${parseFloat(amount).toFixed(2)}`;

  // Render each transaction card in the FlatList
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() => {
        setSelectedTransaction(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.cardHeader}>
        <FontAwesomeIcon icon={faReceipt} size={20} color={isDarkMode ? '#7c3aed' : '#6d28d9'} />
        <Text style={styles.transactionReference}>
          {item.transactionID || `#${item._id.slice(-6).toUpperCase()}`}
        </Text>
        <Text
          style={[
            styles.transactionStatus,
            item.status === 'Accepted'
              ? styles.statusSuccess
              : item.status === 'Rejected'
              ? styles.statusError
              : styles.statusWarning,
          ]}
        >
          {item.status}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.transactionMeta}>
          <Text style={styles.transactionAmount}>{formatCurrency(item.depositAmount)}</Text>
          <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <FontAwesomeIcon icon={faArrowLeft} size={24} color={isDarkMode ? '#fff' : '#6d28d9'} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Transaction History</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6d28d9" style={styles.loader} />
        ) : transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesomeIcon icon={faBoxOpen} size={60} color="#94a3b8" />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}

        {/* Transaction Details Modal */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            {selectedTransaction && (
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Transaction Details</Text>
                  <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.modalScroll}>
                  <View style={styles.orderSummary}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Transaction ID:</Text>
                      <Text style={styles.summaryValue}>
                        {selectedTransaction.transactionID || `#${selectedTransaction._id.slice(-6).toUpperCase()}`}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Date:</Text>
                      <Text style={styles.summaryValue}>{formatDate(selectedTransaction.createdAt)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Status:</Text>
                      <Text style={[
                        styles.summaryValue,
                        selectedTransaction.status === 'Accepted'
                          ? styles.statusSuccess
                          : selectedTransaction.status === 'Rejected'
                          ? styles.statusError
                          : styles.statusWarning
                      ]}>
                        {selectedTransaction.status}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Deposit Amount:</Text>
                      <Text style={styles.summaryValue}>{formatCurrency(selectedTransaction.depositAmount)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Wallet Number:</Text>
                      <Text style={styles.summaryValue}>{selectedTransaction.walletNumber}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Wallet Name:</Text>
                      <Text style={styles.summaryValue}>{selectedTransaction.walletName}</Text>
                    </View>
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (isDarkMode) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#1c1c1c' : '#ffffff',
    },
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: StatusBar.currentHeight || 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    backButton: {
      padding: 10,
      marginRight: 12,
    },
    headerText: {
      fontSize: 24,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#1e293b',
      flex: 1,
    },
    transactionCard: {
      backgroundColor: isDarkMode ? '#1e293b' : '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 10,
    },
    transactionReference: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#e2e8f0' : '#475569',
    },
    transactionStatus: {
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 'auto',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
    },
    statusSuccess: {
      backgroundColor: '#dcfce7',
      color: '#16a34a',
    },
    statusWarning: {
      backgroundColor: '#fef9c3',
      color: '#ca8a04',
    },
    statusError: {
      backgroundColor: '#fee2e2',
      color: '#dc2626',
    },
    cardBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    transactionMeta: {
      alignItems: 'flex-end',
    },
    transactionAmount: {
      fontSize: 18,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#1e293b',
    },
    transactionDate: {
      fontSize: 12,
      color: isDarkMode ? '#94a3b8' : '#64748b',
      marginTop: 4,
    },
    loader: {
      marginTop: 50,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 50,
      gap: 16,
    },
    emptyText: {
      fontSize: 18,
      color: isDarkMode ? '#94a3b8' : '#64748b',
    },
    listContainer: {
      paddingBottom: 20,
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: isDarkMode ? '#1e293b' : '#fff',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#1e293b',
    },
    closeButton: {
      padding: 8,
    },
    modalScroll: {
      paddingBottom: 40,
    },
    orderSummary: {
      backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    summaryLabel: {
      fontSize: 14,
      color: isDarkMode ? '#94a3b8' : '#64748b',
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '500',
      color: isDarkMode ? '#e2e8f0' : '#1e293b',
    },
    productsSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#1e293b',
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#444' : '#eee',
      paddingBottom: 10,
    },
    productItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      paddingVertical: 8,
    },
    productImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      marginRight: 10,
    },
    productInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    productName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#1e293b',
      marginBottom: 4,
    },
    productCategory: {
      fontSize: 14,
      color: isDarkMode ? '#94a3b8' : '#64748b',
      marginBottom: 8,
    },
    productMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    productPrice: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#7c3aed' : '#6d28d9',
    },
    productQuantity: {
      fontSize: 14,
      color: isDarkMode ? '#94a3b8' : '#64748b',
    },
    totalSection: {
      backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
      borderRadius: 12,
      padding: 16,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    grandTotal: {
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#475569' : '#cbd5e1',
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#94a3b8' : '#64748b',
    },
    totalValue: {
      fontSize: 16,
      fontWeight: '700',
      color: isDarkMode ? '#fff' : '#1e293b',
    },
    timerText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#007bff',
      marginTop: 10,
    },
  });

export default TransactionHistoryScreen;
