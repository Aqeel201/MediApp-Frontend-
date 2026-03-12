import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import axios from 'axios';

const PendingTransactionScreen = ({ navigation, route }) => {
  const { transaction, cartItems } = route.params;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [timeLeft, setTimeLeft] = useState('');

  // Timer countdown for 20 minutes
  useEffect(() => {
    const timer = setInterval(() => {
      const createdRaw = new Date(transaction.createdAt);
      const now = new Date();
      const createdTime = createdRaw > now ? now : createdRaw;
      const diff = 20 * 60 * 1000 - (now - createdTime);
      if (diff > 0) {
        const minutes = Math.floor(diff / (60 * 1000));
        const seconds = Math.floor((diff % (60 * 1000)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s remaining`);
      } else {
        setTimeLeft('Expired');
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [transaction.createdAt]);

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

    // Poll backend for transaction status updates
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`https://dashboard-backend-xrss.vercel.app/api/transactions?userId=${transaction.userId}`);
        const transactions = res.data || [];
        const updatedTxn = transactions.find(t => t._id === transaction._id);

        if (updatedTxn && updatedTxn.status !== 'Pending') {
          clearInterval(interval);
          navigation.replace(updatedTxn.status === 'Accepted' ? 'AcceptedTransaction' : 'RejectedTransaction', {
            transaction: updatedTxn,
            cartItems,
            transactionTime: new Date(updatedTxn.updatedAt || updatedTxn.createdAt)
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);

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
      {timeLeft !== '' && (
        <Text style={styles.timerText}>{timeLeft}</Text>
      )}
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
