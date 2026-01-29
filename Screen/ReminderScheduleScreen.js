import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    StatusBar,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Trash, Clock, Calendar, Edit2, BellOff } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { wp, hp, fontSize } from './responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';

export default function ReminderScheduleScreen() {
    const navigation = useNavigation();
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = React.useMemo(() => getStyles(isDarkMode, insets), [isDarkMode, insets]);
    const API_BASE = 'https://dashboard-backend-xrss.vercel.app';

    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [authToken, setAuthToken] = useState(null);

    const fetchReminders = useCallback(async (token) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${API_BASE}/api/reminders`, config);
            setReminders(res.data);
        } catch (err) {
            console.error('Fetch Reminders Error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                const token = await AsyncStorage.getItem('authToken');
                if (token) {
                    setAuthToken(token);
                    fetchReminders(token);
                } else {
                    setLoading(false);
                }
            };
            load();
        }, [fetchReminders])
    );

    const onRefresh = () => {
        setRefreshing(true);
        if (authToken) fetchReminders(authToken);
    };

    const deleteReminder = async (id) => {
        Alert.alert(
            'Delete Reminder',
            'Are you sure you want to remove this reminder?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const config = { headers: { Authorization: `Bearer ${authToken}` } };
                            await axios.delete(`${API_BASE}/api/reminders/${id}`, config);
                            fetchReminders(authToken);
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete reminder');
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (item) => {
        navigation.navigate('MedicineReminder', { editItem: item });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0d6efd" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            <LinearGradient
                colors={isDarkMode ? ['#1e1e1e', '#121212'] : ['#ffffff', '#f8f9fa']}
                style={[styles.header, { paddingTop: insets.top + hp(2) }]}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={isDarkMode ? "#fff" : "#333"} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Your Schedule</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <FlatList
                data={reminders}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ padding: wp(5), paddingBottom: hp(10) }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0d6efd']} />
                }
                renderItem={({ item }) => (
                    <View style={styles.reminderCard}>
                        <View style={styles.cardContent}>
                            <View style={styles.cardHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.medNameText}>{item.medicineName}</Text>
                                    <View style={styles.badgeRow}>
                                        <View style={styles.dosageBadge}>
                                            <Text style={styles.badgeText}>{item.dosage}</Text>
                                        </View>
                                        <View style={[styles.frequencyBadge, { backgroundColor: item.repeat === 'Once' ? '#ffc107' : '#0d6efd' }]}>
                                            <Text style={styles.whiteBadgeText}>{item.repeat}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                                        <Edit2 size={18} color="#0d6efd" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => deleteReminder(item._id)} style={[styles.actionBtn, { marginLeft: 10 }]}>
                                        <Trash size={18} color="#ff4d4f" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.timeSection}>
                                <View style={styles.timeRow}>
                                    <Clock size={16} color="#666" style={{ marginRight: 6 }} />
                                    <Text style={styles.timeText}>{item.time}</Text>
                                </View>
                                <View style={styles.timeRow}>
                                    <Calendar size={16} color="#666" style={{ marginRight: 6, marginLeft: 15 }} />
                                    <Text style={styles.timeText}>{new Date(item.date).toLocaleDateString()}</Text>
                                </View>
                            </View>

                            {item.notes ? (
                                <View style={styles.noteBox}>
                                    <Text style={styles.noteText}>{item.notes}</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <BellOff size={60} color={isDarkMode ? "#333" : "#ddd"} />
                        <Text style={styles.emptyTitle}>No Reminders</Text>
                        <Text style={styles.emptySub}>Your schedule is currently empty.</Text>
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => navigation.navigate('MedicineReminder')}
                        >
                            <Text style={styles.addBtnText}>Add Reminder</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>
    );
}

const getStyles = (isDarkMode, insets) => StyleSheet.create({
    container: { flex: 1, backgroundColor: isDarkMode ? '#121212' : '#f8f9fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingBottom: hp(2),
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: isDarkMode ? '#252525' : '#f0f2f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: fontSize(20),
        fontWeight: '800',
        color: isDarkMode ? '#fff' : '#1a1a1a',
    },
    reminderCard: {
        backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
        borderRadius: 20,
        marginBottom: hp(2),
        padding: wp(4.5),
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    medNameText: { fontSize: fontSize(20), fontWeight: '900', color: isDarkMode ? '#fff' : '#1a1a1a', marginBottom: 5 },
    badgeRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
    dosageBadge: { backgroundColor: 'rgba(13, 110, 253, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    frequencyBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    badgeText: { fontSize: fontSize(12), fontWeight: '800', color: isDarkMode ? '#fff' : '#0d6efd' },
    whiteBadgeText: { fontSize: fontSize(12), fontWeight: '800', color: '#fff' }, // For solid backgrounds
    actionButtons: { flexDirection: 'row' },
    actionBtn: { padding: 8, backgroundColor: isDarkMode ? '#252525' : '#f8f9fa', borderRadius: 10 },
    timeSection: { flexDirection: 'row', marginTop: hp(2), borderTopWidth: 1, borderTopColor: isDarkMode ? '#333' : '#eee', paddingTop: hp(1.5) },
    timeRow: { flexDirection: 'row', alignItems: 'center' },
    timeText: { fontSize: fontSize(14), color: isDarkMode ? '#aaa' : '#666', fontWeight: '500' },
    noteBox: { marginTop: hp(1.5), backgroundColor: isDarkMode ? '#252525' : '#f9f9f9', padding: 10, borderRadius: 12 },
    noteText: { fontSize: fontSize(13), color: isDarkMode ? '#888' : '#777', fontStyle: 'italic' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: hp(15) },
    emptyTitle: { fontSize: fontSize(20), fontWeight: '700', color: isDarkMode ? '#fff' : '#333', marginTop: 15 },
    emptySub: { fontSize: fontSize(14), color: '#888', marginTop: 5 },
    addBtn: { backgroundColor: '#0d6efd', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25, marginTop: 25 },
    addBtnText: { color: '#fff', fontWeight: 'bold' },
});
