import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { wp, hp, fontSize } from './responsive';
import { AlertCircle, CheckCircle, Info, LogOut, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const PremiumModal = ({ visible, title, message, type = 'info', onConfirm, onCancel, confirmText, cancelText }) => {
    const [fadeAnim] = React.useState(new Animated.Value(0));
    const [slideAnim] = React.useState(new Animated.Value(50));

    React.useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true })
            ]).start();
        } else {
            fadeAnim.setValue(0);
            slideAnim.setValue(50);
        }
    }, [visible]);

    if (!visible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={wp(12)} color="#10b981" />;
            case 'error': return <AlertCircle size={wp(12)} color="#ef4444" />;
            case 'logout': return <LogOut size={wp(12)} color="#f59e0b" />;
            default: return <Info size={wp(12)} color="#3b82f6" />;
        }
    };

    const getIconBg = () => {
        switch (type) {
            case 'success': return 'rgba(16, 185, 129, 0.1)';
            case 'error': return 'rgba(239, 68, 68, 0.1)';
            case 'logout': return 'rgba(245, 158, 11, 0.1)';
            default: return 'rgba(59, 130, 246, 0.1)';
        }
    };

    return (
        <Modal transparent visible={visible} animationType="none">
            <View style={styles.overlay}>
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
                <Animated.View style={[
                    styles.modalContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}>
                    <View style={[styles.iconContainer, { backgroundColor: getIconBg() }]}>
                        {getIcon()}
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        {onCancel && (
                            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                                <Text style={styles.cancelButtonText}>{cancelText || 'Cancel'}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                { backgroundColor: type === 'error' ? '#ef4444' : type === 'logout' ? '#f59e0b' : '#3b82f6' },
                                !onCancel && { width: '100%' }
                            ]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.confirmButtonText}>{confirmText || 'OK'}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalContainer: {
        width: width * 0.85,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    iconContainer: {
        width: wp(20),
        height: wp(20),
        borderRadius: wp(10),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: fontSize(20),
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: fontSize(14),
        color: '#4b5563',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 25,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    confirmButton: {
        flex: 1,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: fontSize(16),
        fontWeight: 'bold',
    },
    cancelButton: {
        flex: 1,
        height: 50,
        borderRadius: 15,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#4b5563',
        fontSize: fontSize(16),
        fontWeight: 'bold',
    },
});

export default PremiumModal;
