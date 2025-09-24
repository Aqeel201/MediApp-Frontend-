import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import axios from 'axios';

const PendingTransactionScreen = ({ navigation, route }) => {
  const { transaction, cartItems } = route.params;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`http://192.168.43.137:5000/api/transactions/${transaction._id}`);
        if (res.data.status !== transaction.status) {
          clearInterval(interval);
          navigation.replace(res.data.status === 'Accepted' ? 'AcceptedTransaction' : 'RejectedTransaction', {
            transaction: res.data,
            cartItems,
            transactionTime: new Date(res.data.updatedAt)
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/easypaisa_logo.png')}
        style={[styles.spinner, {
          transform: [{
            rotate: rotateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg']
            })
          }]
        }]}
      />
      <Text style={styles.title}>Processing Payment</Text>
      <Text style={styles.message}>
        Please wait while we verify your transaction with EasyPaisa
      </Text>
      <Text style={styles.note}>
        This process usually takes 2-5 minutes. Keep the app open!
      </Text>
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
  spinner: {
    width: 100,
    height: 100,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007bff',
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6c757d',
    lineHeight: 24,
    marginBottom: 10,
  },
  note: {
    fontSize: 14,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default PendingTransactionScreen;