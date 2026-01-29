import React from 'react';
import Onboarding from 'react-native-onboarding-swiper';
import { Image, StyleSheet, Text, View, Animated, Easing, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';

const OnboardingNavigator = () => {
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation();
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      navigation.replace('Login');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  // Animation values
  const scaleValue = React.useRef(new Animated.Value(0.8)).current;
  const opacityValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 800,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const styles = React.useMemo(() => getStyles(width, height), [width, height]);

  const renderImage = (source, isLottie = false) => {
    if (isLottie) {
      return (
        <View style={styles.animationContainer}>
          <LottieView
            source={source}
            autoPlay
            loop
            style={styles.animation}
          />
        </View>
      );
    }
    return (
      <Animated.View style={[styles.imageContainer, { transform: [{ scale: scaleValue }], opacity: opacityValue }]}>
        <Image source={source} style={styles.image} />
      </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={['#000428', '#004e92']}
      style={styles.background}
    >
      <Onboarding
        pages={[
          {
            backgroundColor: 'transparent',
            image: renderImage(require('../assets/animations/health-care.json'), true),
            title: (
              <Animated.Text style={[styles.title, { opacity: opacityValue }]}>
                Welcome to <Text style={styles.titleHighlight}>MediApp</Text>
              </Animated.Text>
            ),
            subtitle: (
              <Animated.Text style={[styles.subtitle, { opacity: opacityValue }]}>
                Your personal health companion for all medical needs and wellness solutions.
              </Animated.Text>
            ),
          },
          {
            backgroundColor: 'transparent',
            image: renderImage(require('../assets/animations/online-shopping.json'), true),
            title: (
              <Animated.Text style={[styles.title, { opacity: opacityValue }]}>
                Smart <Text style={styles.titleHighlight}>Medicine</Text> Shopping
              </Animated.Text>
            ),
            subtitle: (
              <Animated.Text style={[styles.subtitle, { opacity: opacityValue }]}>
                Browse, order, and get medicines delivered to your doorstep with just a few taps.
              </Animated.Text>
            ),
          },
          {
            backgroundColor: 'transparent',
            image: renderImage(require('../assets/animations/secure-payment.json'), true),
            title: (
              <Animated.Text style={[styles.title, { opacity: opacityValue }]}>
                Secure <Text style={styles.titleHighlight}>Transactions</Text>
              </Animated.Text>
            ),
            subtitle: (
              <Animated.Text style={[styles.subtitle, { opacity: opacityValue }]}>
                Enjoy seamless and protected payments with our encrypted transaction system.
              </Animated.Text>
            ),
          },
        ]}
        onDone={() => completeOnboarding()}
        onSkip={() => completeOnboarding()}
        containerStyles={styles.container}
        titleStyles={styles.title}
        subtitleStyles={styles.subtitle}
        nextLabel={
          <Text style={styles.buttonText}>Next</Text>
        }
        skipLabel={
          <Text style={styles.buttonText}>Skip</Text>
        }
        doneLabel={
          <Text style={styles.buttonText}>Get Started</Text>
        }
        nextButtonStyles={styles.button}
        skipButtonStyles={styles.button}
        doneButtonStyles={[styles.button, styles.doneButton]}
        bottomBarHighlight={false}
        bottomBarHeight={100}
        controlStatusBar={false}
        DotComponent={({ selected }) => (
          <View
            style={[
              styles.dot,
              selected ? styles.activeDot : null,
            ]}
          />
        )}
      />
    </LinearGradient>
  );
};

const getStyles = (width = 375, height = 667) => StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
    resizeMode: 'contain',
  },
  animationContainer: {
    width: width * 0.8,
    height: width * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  titleHighlight: {
    color: '#4DFF8B',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 26,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  doneButton: {
    backgroundColor: '#4DFF8B',
    borderColor: 'transparent',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeDot: {
    width: 20,
    backgroundColor: '#4DFF8B',
  },
});

export default OnboardingNavigator;