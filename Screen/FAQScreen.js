// FAQScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from './ThemeContext';

const FAQs = [
  {
    question: 'What is MediApp?',
    answer: 'MediApp is a comprehensive healthcare application that allows you to order medicines online, consult with doctors, and manage your health records in one place.',
  },
  {
    question: 'How do I place an order?',
    answer: 'To place an order, simply browse the medicines in the app, add them to your cart, and proceed to checkout. You can choose your preferred payment method and delivery address.',
  },
  {
    question: 'How can I consult with a doctor?',
    answer: 'You can schedule a consultation with a doctor by navigating to the "Consultation" section in the app. Choose a doctor, select a time slot, and confirm your appointment.',
  },
  // Add more FAQs as needed
];

const FAQScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const [expandedIndex, setExpandedIndex] = React.useState(null);
  const styles = getStyles(isDarkMode);

  const handlePress = (index) => {
    setExpandedIndex(index === expandedIndex ? null : index);
  };

  // Move FAQItem inside FAQScreen so it has access to styles
  const FAQItem = ({ faq, isExpanded, onPress }) => {
    const { question, answer } = faq;
    const [maxHeight, setMaxHeight] = React.useState(0);
    const animatedController = React.useRef(new Animated.Value(0)).current;
    const contentHeight = React.useRef(0);

    React.useEffect(() => {
      Animated.timing(animatedController, {
        duration: 300,
        toValue: isExpanded ? 1 : 0,
        useNativeDriver: false,
      }).start();
    }, [isExpanded]);

    const arrowAngle = animatedController.interpolate({
      inputRange: [0, 1],
      outputRange: ['0rad', `${Math.PI}rad`],
    });

    const height = animatedController.interpolate({
      inputRange: [0, 1],
      outputRange: [0, maxHeight],
    });

    return (
      <View style={styles.faqItem}>
        <TouchableOpacity onPress={onPress} style={styles.faqQuestionContainer}>
          <Text style={styles.faqQuestion}>{question}</Text>
          <Animated.View style={{ transform: [{ rotateZ: arrowAngle }] }}>
            <FontAwesomeIcon icon={faChevronDown} size={16} color="#007bff" />
          </Animated.View>
        </TouchableOpacity>
        <Animated.View style={[styles.faqAnswerContainer, { height }]}>
          <View
            style={styles.faqAnswerWrapper}
            onLayout={(event) => {
              contentHeight.current = event.nativeEvent.layout.height;
              setMaxHeight(contentHeight.current);
            }}
          >
            <Text style={styles.faqAnswer}>{answer}</Text>
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon={faArrowLeft} size={24} color={styles.iconColor.color} />
        </TouchableOpacity>
        <Text style={styles.headerText}>FAQs</Text>
      </View>

      {/* FAQs List */}
      <ScrollView contentContainerStyle={styles.scrollView}>
        {FAQs.map((faq, index) => (
          <FAQItem
            key={index}
            faq={faq}
            isExpanded={expandedIndex === index}
            onPress={() => handlePress(index)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const getStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#1c1c1c' : '#ffffff',
    },
    header: {
      backgroundColor: 'transparent',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 50 : 20,
      paddingBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerText: {
      color: isDarkMode ? '#ffffff' : '#007bff',
      fontSize: 22,
      fontWeight: 'bold',
      marginLeft: 10,
    },
    iconButton: {
      padding: 10,
    },
    iconColor: {
      color: isDarkMode ? '#ffffff' : '#007bff',
    },
    scrollView: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    faqItem: {
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#444' : '#ccc',
    },
    faqQuestionContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
    },
    faqQuestion: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#ffffff' : '#333333',
      flex: 1,
      marginRight: 10,
    },
    faqAnswerContainer: {
      overflow: 'hidden',
    },
    faqAnswerWrapper: {
      position: 'absolute',
      bottom: 0,
    },
    faqAnswer: {
      fontSize: 14,
      color: isDarkMode ? '#dddddd' : '#555555',
      paddingBottom: 15,
      lineHeight: 22,
    },
  });

export default FAQScreen;
