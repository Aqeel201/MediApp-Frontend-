// NotificationPage.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, ArrowLeft, Home, ShoppingBag, User } from 'lucide-react-native';
import { wp, hp, fontSize } from "./responsive";
import { useTheme } from "./ThemeContext";
import Footer from "./Footer"; // Import the reusable Footer component
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_BASE = 'https://dashboard-backend-xrss.vercel.app';

const NotificationPage = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const styles = getStyles(isDarkMode, insets);

  const fetchNotifications = async (markRead = true, withSpinner = true) => {
    if (withSpinner) setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setItems([]);
        if (withSpinner) setLoading(false);
        return;
      }
      const resp = await axios.get(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });
      const data = Array.isArray(resp.data) ? resp.data : [];
      setItems(data);
      if (markRead) {
        await axios.put(
          `${API_BASE}/api/notifications/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
        );
      }
    } catch (err) {
      console.error('Failed to load notifications', err?.message || err);
    } finally {
      if (withSpinner) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications(false);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
        animated={true}
      />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + wp(5) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
          <ArrowLeft
            size={24}
            color={isDarkMode ? "white" : "#0d6efd"}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>Notifications</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchNotifications(true, false);
            }}
            tintColor="#0d6efd"
          />
        }
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color="#0d6efd" />
        ) : items.length ? (
          items.map((notification) => (
            <TouchableOpacity
              key={notification._id || notification.id}
              style={styles.notificationItem}
            >
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Text style={styles.notificationDate}>
                {notification.date ? new Date(notification.date).toLocaleString() : ''}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No notifications yet.</Text>
        )}
      </ScrollView>

      {/* Reusable Modern Footer */}
      <Footer />
    </View>
  );
};

const getStyles = (isDarkMode, insets = { top: 0, bottom: 0 }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? "#1c1c1c" : "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: wp(5),
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? "#444" : "#eaeaea",
  },
  headerText: {
    marginLeft: 10,
    fontSize: fontSize(20),
    fontWeight: "bold",
    color: isDarkMode ? "white" : "#0d6efd",
  },
  scrollView: {
    padding: wp(5),
    marginBottom: hp(10), // leave space for the footer
  },
  notificationItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? "#444" : "#eaeaea",
    marginBottom: 10,
    backgroundColor: isDarkMode ? "#333" : "white",
  },
  notificationDate: {
    marginTop: 6,
    fontSize: 12,
    color: isDarkMode ? "#9ca3af" : "#94a3b8",
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: isDarkMode ? "white" : "black",
  },
  notificationMessage: {
    marginTop: 5,
    fontSize: 14,
    color: isDarkMode ? "#ccc" : "#666",
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: isDarkMode ? "#ccc" : "#666",
  },
});

export default NotificationPage;
