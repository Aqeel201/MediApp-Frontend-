import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';

const MedicineRecommendation = () => {
  const [disease, setDisease] = useState('');
  const [recommendations, setRecommendations] = useState([]);

  // Dummy function to simulate AI recommendation
  const getRecommendations = () => {
    // Replace with actual AI logic
    const dummyRecommendations = {
      'fever': ['Paracetamol', 'Ibuprofen'],
      'cough': ['Cough Syrup', 'Lozenges'],
      'headache': ['Aspirin', 'Tylenol'],
    };
    setRecommendations(dummyRecommendations[disease.toLowerCase()] || []);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image source={require('../assets/medicine.png')} style={styles.image} />
        <Text style={styles.title}>Medicine Recommendation</Text>
        <Text style={styles.subtitle}>
          Enter your disease or condition to get medicine recommendations
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter disease or condition"
          value={disease}
          onChangeText={setDisease}
        />

        <TouchableOpacity style={styles.button} onPress={getRecommendations}>
          <Text style={styles.buttonText}>Get Recommendations</Text>
        </TouchableOpacity>

        {recommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.recommendationsTitle}>Recommended Medicines:</Text>
            {recommendations.map((medicine, index) => (
              <Text key={index} style={styles.recommendationItem}>
                {medicine}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  recommendationsContainer: {
    marginTop: 20,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  recommendationItem: {
    fontSize: 16,
    marginBottom: 5,
  },
});

export default MedicineRecommendation;
