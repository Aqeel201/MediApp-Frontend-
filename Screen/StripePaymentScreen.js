import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { wp, hp, fontSize } from "./responsive";
import { useTheme } from './ThemeContext';

const StripePaymentScreen = () => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [loading, setLoading] = useState(false);
    const [paymentDone, setPaymentDone] = useState(false);
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const { isDarkMode } = useTheme();
    const { orderData } = route.params || {};

    const amount = orderData?.orderTotal || 0;

    // In a real app, you would fetch clientSecret from your backend
    // For this "Perfect Proof of Concept", we'll simulate the backend logic
    const fetchPaymentSheetParams = async () => {
        // Simulated Backend Call
        // const response = await fetch(`${API_URL}/payment-sheet`, { method: 'POST' });
        // const { paymentIntent, ephemeralKey, customer } = await response.json();

        return {
            paymentIntent: 'pi_test_simulated_secret', // Dummy secret for UI testing
            ephemeralKey: 'ek_test_simulated_secret',
            customer: 'cus_test_simulated',
            publishableKey: 'pk_test_51Pzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
        };
    };

    const initializePaymentSheet = async () => {
        setLoading(true);
        const {
            paymentIntent,
            ephemeralKey,
            customer,
            publishableKey,
        } = await fetchPaymentSheetParams();

        const { error } = await initPaymentSheet({
            merchantDisplayName: "MediApp Inc.",
            customerId: customer,
            customerEphemeralKeySecret: ephemeralKey,
            paymentIntentClientSecret: paymentIntent,
            // Set allowsDelayedPaymentMethods to true if your business can handle delayed notification payments
            allowsDelayedPaymentMethods: true,
            defaultBillingDetails: {
                name: `${orderData?.shippingAddress?.firstName} ${orderData?.shippingAddress?.lastName}`,
                email: orderData?.userId,
            }
        });

        if (!error) {
            setLoading(false);
        } else {
            setLoading(false);
            Alert.alert("Stripe Error", "Failed to initialize payment sheet. Please try again.");
        }
    };

    useEffect(() => {
        initializePaymentSheet();
    }, []);

    const openPaymentSheet = async () => {
        const { error } = await presentPaymentSheet();

        if (error) {
            if (error.code === 'Canceled') {
                // User cancelled
            } else {
                Alert.alert(`Error code: ${error.code}`, error.message);
            }
        } else {
            // Payment Successful!
            setPaymentDone(true);
            setTimeout(() => {
                // Clear cart and proceed (simulated)
                navigation.navigate("Confirmation", {
                    order: { ...orderData, id: "SIM-" + Date.now() },
                    paymentMethod: "Stripe"
                });
            }, 2000);
        }
    };

    const styles = getStyles(isDarkMode, insets);

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={isDarkMode ? "#fff" : "#000"} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>SECURE CHECKOUT</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        {paymentDone ? (
                            <CheckCircle size={60} color="#28a745" />
                        ) : (
                            <CreditCard size={60} color="#007bff" />
                        )}
                    </View>

                    <Text style={styles.title}>
                        {paymentDone ? "PAYMENT SUCCESSFUL!" : "CARD PAYMENT (STRIPE)"}
                    </Text>

                    <Text style={styles.amountLabel}>Payable Total:</Text>
                    <Text style={styles.amountText}>PKR {amount.toLocaleString()}</Text>

                    {!paymentDone && (
                        <View style={styles.badgeRow}>
                            <View style={styles.badge}>
                                <ShieldCheck size={16} color="#28a745" />
                                <Text style={styles.badgeText}>SSL SECURE</Text>
                            </View>
                            <View style={styles.badge}>
                                <CreditCard size={16} color="#007bff" />
                                <Text style={styles.badgeText}>ENC-256</Text>
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.instructionBox}>
                    <Text style={styles.instructionText}>
                        {paymentDone
                            ? "Your order is being processed automatically. You will be redirected shortly."
                            : "This is a secure connection to Stripe. Your card data is never stored on our servers."}
                    </Text>
                </View>

                {!paymentDone && (
                    <TouchableOpacity
                        style={[styles.payButton, loading && styles.disabledButton]}
                        onPress={openPaymentSheet}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.payButtonText}>OPEN PAYMENT SHEET</Text>
                        )}
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
};

const getStyles = (isDarkMode, insets) => StyleSheet.create({
    container: { flex: 1, backgroundColor: isDarkMode ? "#121212" : "#f8f9fa" },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? "#333" : "#eee",
    },
    headerTitle: { fontSize: 16, fontWeight: "bold", color: isDarkMode ? "#fff" : "#000", letterSpacing: 1 },
    backButton: { padding: 5 },
    content: { padding: 20, alignItems: "center" },
    card: {
        width: "100%",
        backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
        borderRadius: 20,
        padding: 30,
        alignItems: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        marginTop: 20,
    },
    iconContainer: { marginBottom: 20 },
    title: { fontSize: 18, fontWeight: "bold", color: isDarkMode ? "#fff" : "#333", marginBottom: 20 },
    amountLabel: { fontSize: 14, color: "#666", marginBottom: 5 },
    amountText: { fontSize: 32, fontWeight: "800", color: "#007bff", marginBottom: 25 },
    badgeRow: { flexDirection: "row", gap: 10 },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: isDarkMode ? "#333" : "#f0f0f0",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 5
    },
    badgeText: { fontSize: 10, fontWeight: "bold", color: "#666" },
    instructionBox: { marginTop: 30, paddingHorizontal: 20 },
    instructionText: { textAlign: "center", color: "#666", lineHeight: 20, fontSize: 14 },
    payButton: {
        backgroundColor: "#007bff",
        width: "100%",
        height: 55,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 40,
    },
    payButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    disabledButton: { backgroundColor: "#ccc" }
});

export default StripePaymentScreen;
