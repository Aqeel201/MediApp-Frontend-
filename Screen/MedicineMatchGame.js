import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Animated, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend URLs
const BASE_URL = 'http://192.168.18.24:2000'; // change to your backend server
const Q_ENDPOINT = `${BASE_URL}/api/game/question`;
const ANSWER_ENDPOINT = `${BASE_URL}/api/game/answer`;
const SCORE_ENDPOINT = (userId) => `${BASE_URL}/api/game/score/${userId}`;
const REDEEM_ENDPOINT = `${BASE_URL}/api/game/redeem`;

export default function MedicineMatchGame() {
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      let uid = await AsyncStorage.getItem('mm_userId');
      if (!uid) {
        uid = 'u-' + Math.random().toString(36).substr(2, 9);
        await AsyncStorage.setItem('mm_userId', uid);
      }
      setUserId(uid);
      fetchScore(uid);
      fetchQuestion();
    })();
  }, []);

  const fetchQuestion = async () => {
    setLoading(true);
    setQuestion(null);
    setSelected(null);
    setLastResult(null);
    try {
      const res = await fetch(Q_ENDPOINT);
      const json = await res.json();
      setQuestion(json.question);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const fetchScore = async (uid) => {
    try {
      const res = await fetch(SCORE_ENDPOINT(uid));
      if (!res.ok) return;
      const json = await res.json();
      setPoints(json.points || 0);
      setStreak(json.streak || 0);
    } catch (err) {
      console.warn('Score fetch failed', err);
    }
  };

  const submit = async () => {
    if (selected === null) {
      Alert.alert('Choose an option', 'Please select an option first.');
      return;
    }
    if (!userId || !question) return;
    setSubmitting(true);
    try {
      const res = await fetch(ANSWER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, qid: question.qid, selectedIndex: selected })
      });
      const json = await res.json();
      setLastResult(json);
      if (json.correct) {
        Animated.sequence([
          Animated.timing(scale, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      }
      setPoints(json.newTotalPoints || points);
      setStreak(json.newStreak || 0);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const redeem = async () => {
    if (!userId) return;
    if (points < 50) {
      Alert.alert('Not enough points', 'You need at least 50 points to redeem a coupon.');
      return;
    }
    try {
      const res = await fetch(REDEEM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, cost: 50 })
      });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Coupon redeemed!', `Your coupon: ${json.coupon}\nRemaining: ${json.remaining} points`);
        setPoints(json.remaining);
      } else {
        Alert.alert('Redeem failed', json.error || 'Unknown error');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Redeem failed');
    }
  };

  if (loading || !question) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading question...</Text>
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>Medicine Match Challenge</Text>
          <View style={styles.info}>
            <Text style={styles.infoText}>Points: {points}</Text>
            <Text style={styles.infoText}>Streak: {streak}</Text>
          </View>
        </View>
        {/* Show medicine info if available */}
        {question.medicine && (
          <View style={styles.medicineCard}>
            <Text style={styles.medicineTitle}>{question.medicine.name}</Text>
            <Text style={styles.medicineDesc}>{question.medicine.description}</Text>
          </View>
        )}
        <View style={styles.card}>
          <Text style={styles.qPrompt}>{question.prompt}</Text>
          {question.options?.map((opt, idx) => {
            const isSelected = selected === idx;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelected(idx)}
                style={[
                  styles.option,
                  isSelected && styles.optionSelected
                ]}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnPrimary} onPress={submit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={fetchQuestion}>
            <Text style={styles.btnTextSecondary}>Skip</Text>
          </TouchableOpacity>
        </View>
        {lastResult && (
          <View style={styles.result}>
            <Text style={{ fontWeight: '700' }}>
              {lastResult.correct ? 'Correct! 🎉' : 'Not quite 😕'}
            </Text>
            <Text style={{ marginTop: 6 }}>{lastResult.explanation}</Text>
            <Text style={{ marginTop: 6 }}>Points awarded: {lastResult.pointsAwarded}</Text>
          </View>
        )}
        <View style={{ marginTop: 16 }}>
          <TouchableOpacity style={styles.redeem} onPress={redeem}>
            <Text style={styles.redeemText}>Redeem 50 pts → Coupon</Text>
          </TouchableOpacity>
        </View>
        <Animated.View style={[styles.confetti, { transform: [{ scale }] }]}>
          <Text style={{ fontSize: 28 }}>🎉</Text>
        </Animated.View>
      </ScrollView>
      {/* Watermark */}
      <View style={styles.watermarkContainer}>
        <Text style={styles.watermarkText}>
          In Development - Functionality May Be Incomplete
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: '#fafafa' },
  container: { padding: 16, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: '700' },
  info: { alignItems: 'flex-end' },
  infoText: { color: '#444' },
  medicineCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginTop: 12, borderWidth: 1, borderColor: '#eee' },
medicineTitle: { fontSize: 16, fontWeight: '700' },
medicineDesc: { fontSize: 14, color: '#555', marginTop: 4 },
card: { marginTop: 12, backgroundColor: '#fff', padding: 16, borderRadius: 10, elevation: 2 },
qPrompt: { fontSize: 16, fontWeight: '600' },
  option: { marginTop: 12, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  optionText: { fontSize: 15 },
  optionSelected: { borderColor: '#2a9d8f', backgroundColor: '#eafaf6' },
  actions: { flexDirection: 'row', marginTop: 14 },
  btnPrimary: { flex: 1, padding: 12, backgroundColor: '#2a9d8f', borderRadius: 8, alignItems: 'center', marginRight: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
  btnSecondary: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  btnTextSecondary: { color: '#333', fontWeight: '700' },
  result: { marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
  redeem: { padding: 10, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  redeemText: { color: '#2a9d8f', fontWeight: '700' },
  confetti: { position: 'absolute', right: 24, top: 80 },
  watermarkContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    opacity: 0.6,
  },
  watermarkText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
});