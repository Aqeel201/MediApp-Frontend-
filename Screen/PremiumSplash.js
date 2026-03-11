import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, StatusBar, Image } from 'react-native';

const { width, height } = Dimensions.get('window');

const PremiumSplash = ({ onFinish }) => {
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const ring1Anim = useRef(new Animated.Value(0)).current;
    const ring2Anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Sequence of animations
        Animated.parallel([
            // Logo Scale & Fade
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 10,
                friction: 2,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            // Expanding rings
            Animated.loop(
                Animated.sequence([
                    Animated.timing(ring1Anim, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(ring1Anim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            ).start(),
            Animated.loop(
                Animated.sequence([
                    Animated.delay(500),
                    Animated.timing(ring2Anim, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(ring2Anim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            ).start(),
        ]).start();

        // Finish splash after 3 seconds
        const timer = setTimeout(() => {
            onFinish && onFinish();
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const ring1Style = {
        transform: [{ scale: ring1Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 4] }) }],
        opacity: ring1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.4, 0] }),
    };

    const ring2Style = {
        transform: [{ scale: ring2Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 4] }) }],
        opacity: ring2Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.3, 0] }),
    };

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            {/* Background Rings */}
            <Animated.View style={[styles.ring, ring1Style]} />
            <Animated.View style={[styles.ring, ring2Style]} />

            {/* Logo Container */}
            <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                <Image
                    source={require('../assets/Logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#004e92', // MediApp Deep Blue
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        width: width * 0.5,
        height: width * 0.5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: width * 0.25,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    logo: {
        width: '70%',
        height: '70%',
    },
    ring: {
        position: 'absolute',
        width: width * 0.4,
        height: width * 0.4,
        borderRadius: width * 0.2,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
    }
});

export default PremiumSplash;
