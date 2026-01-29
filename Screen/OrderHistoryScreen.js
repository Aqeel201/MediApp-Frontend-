// OrderHistoryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from './ThemeContext';
import { wp, hp, fontSize } from './responsive';
import { ArrowLeft, X, ShoppingBag, Clock, CheckCircle, AlertCircle, Trash } from 'lucide-react-native';
import moment from 'moment';

const OrderHistoryScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = React.useMemo(() => getStyles(isDarkMode, width, height), [isDarkMode, width, height]);

  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [userId, setUserId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Retrieve user data from AsyncStorage (using email as identifier)
  useEffect(() => {
    AsyncStorage.getItem("user")
      .then(userData => {
        if (userData) {
          const user = JSON.parse(userData);
          if (user.email) {
            setUserId(user.email);
          }
        }
      })
      .catch(error => console.error("Error retrieving user data:", error));
  }, []);

  // Function to fetch orders for the user
  const fetchOrders = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`https://dashboard-backend-xrss.vercel.app/api/order?userId=${userId}`);
      const json = await response.json();
      if (json.orders) {
        setOrders(json.orders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders: ", error);
    }
  };

  // Fetch orders when userId is set
  useEffect(() => {
    if (userId) {
      fetchOrders();
    }
  }, [userId]);

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  // Filter orders by searching for medicine names within cart items
  const filteredOrders = orders.filter(order =>
    order.cartItems && order.cartItems.some(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Helper: Format date using moment.js
  const formatDate = (dateString) => moment(dateString).format('DD MMM YYYY, hh:mm A');

  // Helper: Determine badge color based on order status
  const getStatusColor = (status) => {
    if (!status) return '#9E9E9E';
    switch (status.toLowerCase()) {
      case 'delivered': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'rejected': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  // Render each order item
  const renderItem = ({ item }) => {
    // Use the first medicine's image as a thumbnail (if available)
    const firstMedicine = item.cartItems && item.cartItems[0];
    const imageUrl = firstMedicine && firstMedicine.image
      ? (firstMedicine.image.startsWith('http')
        ? firstMedicine.image
        : `https://dashboard-backend-xrss.vercel.app${firstMedicine.image}`)
      : null;

    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedOrder(item);
          setModalVisible(true);
        }}
      >
        <View style={styles.orderItem}>
          <View style={styles.orderRow}>
            {imageUrl && (
              <Image source={{ uri: imageUrl }} style={styles.orderImage} />
            )}
            <View style={styles.orderDetails}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>#{item._id ? item._id.slice(-6).toUpperCase() : 'N/A'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              <View style={styles.medicinesContainer}>
                {item.cartItems && item.cartItems.slice(0, 2).map((medicine, index) => (
                  <Text key={index} style={styles.medicineText}>
                    {medicine.name} x{medicine.cartQuantity}
                  </Text>
                ))}
                {item.cartItems && item.cartItems.length > 2 && (
                  <Text style={styles.moreItemsText}>
                    and {item.cartItems.length - 2} more items...
                  </Text>
                )}
              </View>
              <View style={styles.orderFooter}>
                <Text style={styles.orderDate}>
                  {formatDate(item.date)}
                </Text>
                {item.paymentMethod === 'EasyPaisa' && item.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.completePaymentButton}
                    onPress={() => navigation.navigate('JazzCashPayment', {
                      orderData: {
                        orderTotal: item.orderTotal,
                        cartItems: item.cartItems,
                        shippingFee: item.shippingFee,
                        orderId: item._id
                      }
                    })}
                  >
                    <Text style={styles.completePaymentText}>Complete Payment</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.orderTotal}>
                  Rs. {item.orderTotal?.toFixed(2) || '0.00'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order History</Text>
        </View>

        <TextInput
          style={styles.searchBox}
          placeholder="Search by medicine..."
          placeholderTextColor={isDarkMode ? '#ccc' : '#666'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <FlatList
          data={filteredOrders}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />

        {/* Order Details Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            {selectedOrder && (
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <X size={24} color="#fff" />
                </TouchableOpacity>

                <ScrollView contentContainerStyle={styles.modalScroll}>
                  <Text style={styles.modalTitle}>Order Details</Text>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Order ID:</Text>
                    <Text style={styles.detailValue}>#{selectedOrder._id ? selectedOrder._id.slice(-6).toUpperCase() : 'N/A'}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) }]}>
                      <Text style={styles.statusText}>{selectedOrder.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.sectionTitle}>Medicines</Text>
                  {selectedOrder.cartItems && selectedOrder.cartItems.map((medicine, index) => (
                    <View key={index} style={styles.medicineItem}>
                      {medicine.image && (
                        <Image
                          source={{ uri: medicine.image && medicine.image.startsWith('http') ? medicine.image : `https://dashboard-backend-xrss.vercel.app${medicine.image}` }}
                          style={{ width: 50, height: 50, borderRadius: 5, marginRight: 10 }}
                        />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.medicineName}>{medicine.name}</Text>
                        <View style={styles.medicineDetails}>
                          <Text style={styles.medicineQty}>x{medicine.cartQuantity}</Text>
                          <Text style={styles.medicinePrice}>Rs. {medicine.price?.toFixed(2) || '0.00'}</Text>
                        </View>
                      </View>
                    </View>
                  ))}

                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalAmount}>Rs. {selectedOrder.orderTotal?.toFixed(2) || '0.00'}</Text>
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

const getStyles = (isDarkMode, width = 375, height = 667) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: isDarkMode ? '#000' : '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: StatusBar.currentHeight || 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  backButton: {
    paddingRight: 10,
  },
  headerTitle: {
    fontSize: fontSize(22),
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#000',
    textAlign: 'center',
    flex: 1,
  },
  searchBox: {
    backgroundColor: isDarkMode ? '#444' : '#eee',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    color: isDarkMode ? '#fff' : '#000',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  orderItem: {
    backgroundColor: isDarkMode ? '#333' : '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderImage: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(2),
    marginRight: 10,
  },
  orderDetails: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: isDarkMode ? '#fff' : '#007bff',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  medicinesContainer: {
    marginBottom: 12,
  },
  medicineText: {
    color: isDarkMode ? '#ccc' : '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  moreItemsText: {
    color: isDarkMode ? '#888' : '#999',
    fontSize: 12,
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? '#444' : '#eee',
    paddingTop: 12,
  },
  orderDate: {
    color: isDarkMode ? '#888' : '#666',
    fontSize: 12,
  },
  orderTotal: {
    color: isDarkMode ? '#fff' : '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: isDarkMode ? '#222' : '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.9,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    backgroundColor: '#007bff',
    borderRadius: 20,
    padding: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: isDarkMode ? '#fff' : '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailLabel: {
    color: isDarkMode ? '#ccc' : '#666',
    fontSize: 16,
  },
  detailValue: {
    color: isDarkMode ? '#fff' : '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: isDarkMode ? '#fff' : '#000',
    marginVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#444' : '#eee',
    paddingBottom: 10,
  },
  medicineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
  },
  medicineName: {
    color: isDarkMode ? '#ccc' : '#333',
    fontSize: 16,
    flex: 2,
  },
  medicineDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicineQty: {
    color: isDarkMode ? '#888' : '#666',
    fontSize: 14,
  },
  medicinePrice: {
    color: isDarkMode ? '#fff' : '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? '#444' : '#eee',
  },
  totalLabel: {
    color: isDarkMode ? '#ccc' : '#666',
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    color: isDarkMode ? '#fff' : '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  completePaymentButton: {
    backgroundColor: '#28a745',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 5,
  },
  completePaymentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default OrderHistoryScreen;
