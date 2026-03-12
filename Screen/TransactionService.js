import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Alert } from "react-native";

// Singleton class for managing transaction polling and timers
class TransactionService {
  constructor() {
    this.pendingTransactions = new Map(); // Map<transactionId, { transaction, timer, createdAt }>
    this.userId = null;
    this.pollingInterval = null;
    this.listeners = new Set(); // For notifying screens of updates
  }

  // Initialize userId from AsyncStorage
  async initialize() {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        if (user.email) {
          this.userId = user.email;
          this.startPolling();
        }
      }
    } catch (error) {
      console.error("TransactionService: Error initializing userId:", error);
    }
  }

  // Add a pending transaction with a 20-minute timer
  addPendingTransaction(transaction) {
    const transactionId = transaction._id;
    const createdAt = new Date(transaction.createdAt);
    const timer = {
      timeLeft: "",
      interval: setInterval(() => {
        const now = new Date();
        const diff = 20 * 60 * 1000 - (now - createdAt);
        if (diff > 0) {
          const minutes = Math.floor(diff / (60 * 1000));
          const seconds = Math.floor((diff % (60 * 1000)) / 1000);
          timer.timeLeft = `${minutes}m ${seconds}s remaining`;
        } else {
          timer.timeLeft = "Expired";
          clearInterval(timer.interval);
        }
        this.notifyListeners();
      }, 1000),
    };

    this.pendingTransactions.set(transactionId, { transaction, timer, createdAt });
    this.notifyListeners();
  }

  // Start polling for transaction status updates
  startPolling() {
    if (this.pollingInterval) return; // Prevent multiple intervals
    this.pollingInterval = setInterval(async () => {
      if (!this.userId || this.pendingTransactions.size === 0) return;
      try {
        const res = await axios.get("http://192.168.18.252:2000/api/transactions", {
          params: { userId: this.userId },
        });
        for (const [transactionId, { transaction }] of this.pendingTransactions) {
          const updatedTxn = res.data.find((txn) => txn._id === transactionId);
          if (updatedTxn && updatedTxn.status !== transaction.status) {
            this.updateTransaction(transactionId, updatedTxn);
          }
        }
      } catch (error) {
        console.error("TransactionService: Error polling transactions:", error);
      }
    }, 1000);
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Update transaction status and trigger notifications
  async updateTransaction(transactionId, updatedTxn) {
    const entry = this.pendingTransactions.get(transactionId);
    if (!entry) return;

    entry.transaction = updatedTxn;
    this.notifyListeners();

    if (updatedTxn.status === "Accepted" || updatedTxn.status === "Rejected") {
      // Clear timer
      clearInterval(entry.timer.interval);
      this.pendingTransactions.delete(transactionId);

      const title = updatedTxn.status === "Accepted" ? "Transaction Accepted" : "Transaction Rejected";
      const message = updatedTxn.status === "Accepted"
        ? `Your transaction #${transactionId.slice(-6).toUpperCase()} for Rs. ${updatedTxn.depositAmount} has been accepted.`
        : `Your transaction #${transactionId.slice(-6).toUpperCase()} was rejected due to invalid details.`;

      Alert.alert(title, message);
    }
  }

  // Get pending transactions
  getPendingTransactions() {
    return Array.from(this.pendingTransactions.entries()).map(([id, { transaction, timer }]) => ({
      ...transaction,
      timeLeft: timer.timeLeft,
    }));
  }

  // Get all transactions (for NotificationPage)
  async getAllTransactions() {
    if (!this.userId) return [];
    try {
      const res = await axios.get("http://192.168.18.252:2000/api/transactions", {
        params: { userId: this.userId },
      });
      return res.data.filter((txn) => txn.status === "Accepted" || txn.status === "Rejected");
    } catch (error) {
      console.error("TransactionService: Error fetching transactions:", error);
      return [];
    }
  }

  // Subscribe to updates
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }

  // Clear all transactions and stop timers
  clear() {
    this.pendingTransactions.forEach(({ timer }) => clearInterval(timer.interval));
    this.pendingTransactions.clear();
    this.stopPolling();
    this.listeners.clear();
  }
}

// Export singleton instance
const transactionService = new TransactionService();
export default transactionService;
