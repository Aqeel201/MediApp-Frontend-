import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';

// Configure this to your backend
const BASE_URL = 'http://192.168.18.24:2000'; // <- change to your backend host
const MEDICINES_ENDPOINT = `${BASE_URL}/medicines`;
const CHECK_ENDPOINT = `${BASE_URL}/api/check-interactions`;

// Example: pass token if required
const getAuthHeaders = (token) => token ? { Authorization: `Bearer ${token}` } : {};

export default function SmartInteractionScreen({ navigation, route }) {
  const token = route?.params?.token || null; // or get from context/storage
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [query, setQuery] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null); // { safe: bool, interactions: [...] }
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await fetch(MEDICINES_ENDPOINT, { headers: getAuthHeaders(token) });
      const data = await res.json();
      // endpoint returns array
      setMedicines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch meds error', err);
      setError('Failed to fetch medicines.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectedArray = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const doCheck = async () => {
    if (selectedArray.length < 2) {
      Alert.alert('Select at least 2 medicines', 'Choose two or more medicines to check interactions.');
      return;
    }
    setChecking(true);
    setResult(null);
    try {
      const body = { ids: selectedArray };
      const res = await fetch(CHECK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(token)
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setResult(data);
      if (!data.safe) {
        // optionally store check history or notify pharmacist
      }
    } catch (err) {
      console.error('Check error', err);
      setError('Failed to check interactions.');
    } finally {
      setChecking(false);
    }
  };

  const filtered = useMemo(() => {
    if (!query) return medicines;
    const q = query.toLowerCase();
    return medicines.filter(m => (m.name || '').toLowerCase().includes(q) || (m.manufacturer || '').toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q));
  }, [medicines, query]);

  const renderMed = ({ item }) => {
    const sel = selectedIds.has(item._id || item.id);
    return (
      <TouchableOpacity onPress={() => toggleSelect(item._id || item.id)} style={[styles.medRow, sel && styles.medRowSelected]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.medName}>{item.name}</Text>
          <Text style={styles.medMeta}>{item.dosage || item.medicineType || ''} • {item.manufacturer || ''}</Text>
        </View>
        <Text style={styles.selectTag}>{sel ? 'Selected' : 'Tap'}</Text>
      </TouchableOpacity>
    );
  };

  const renderResult = () => {
    if (!result) return null;
    if (result.safe) {
      return (
        <View style={styles.safeBox}>
          <Text style={styles.safeText}>No interactions found for selected medicines ✅</Text>
        </View>
      );
    }
    if (Array.isArray(result.interactions) && result.interactions.length) {
      return result.interactions.map((it, idx) => (
        <View key={idx} style={[styles.warnBox, it.severity === 'high' ? styles.warnHigh : styles.warnModerate]}>
          <Text style={styles.warnTitle}>Interaction — Severity: {it.severity.toUpperCase()}</Text>
          <Text style={styles.warnMsg}>{it.message}</Text>
          <Text style={styles.warnMeds}>Medicines: {it.medicines.map(m => m.name).join(', ')}</Text>
          {it.suggestions && it.suggestions.length ? (
            <Text style={styles.suggest}>Suggestions: {it.suggestions.join('; ')}</Text>
          ) : null}
          <View style={styles.warnButtons}>
            <TouchableOpacity style={styles.pharmBtn} onPress={() => Alert.alert('Consult pharmacist', 'Calling pharmacist chat (implement)')}>
              <Text style={styles.pharmBtnText}>Consult Pharmacist</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeBtn}
              onPress={() => {
                // remove the first medicine in pair (example action)
                const idToRemove = it.medicines[1]?._id || it.medicines[1]?.id;
                if (idToRemove) {
                  const newSet = new Set(selectedIds);
                  newSet.delete(idToRemove);
                  setSelectedIds(newSet);
                }
              }}>
              <Text style={styles.removeBtnText}>Remove one med</Text>
            </TouchableOpacity>
          </View>
        </View>
      ));
    }
    return <Text style={{ marginTop: 10 }}>No interactions object returned.</Text>;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Smart Medicine Interaction</Text>
      <View style={styles.searchRow}>
        <TextInput placeholder="Search medicines..." value={query} onChangeText={setQuery} style={styles.searchInput} />
        <TouchableOpacity onPress={fetchMedicines} style={styles.refreshBtn}><Text>⟲</Text></TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator size="large" style={{ marginTop: 30 }} /> : (
        <>
          <Text style={styles.caption}>Tap medicines to select (selected {selectedIds.size})</Text>
          <FlatList
            data={filtered}
            keyExtractor={item => (item._id || item.id).toString()}
            renderItem={renderMed}
            style={{ flex: 1, marginTop: 8 }}
          />
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={doCheck} style={styles.checkBtn}>
              {checking ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkBtnText}>Check Interactions</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSelectedIds(new Set()); setResult(null); }} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 280, marginTop: 8 }}>
            {renderResult()}
          </ScrollView>
        </>
      )}
      {error ? <Text style={{ color: 'red', marginTop: 6 }}>{error}</Text> : null}
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
  container: { flex: 1, padding: 14, backgroundColor: '#f7f7f8' },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1, backgroundColor: '#fff', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#ddd' },
  refreshBtn: { marginLeft: 8, padding: 10, backgroundColor: '#eee', borderRadius: 6 },
  caption: { marginTop: 8, color: '#555' },
  medRow: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderRadius: 8, marginVertical: 6, alignItems: 'center' },
  medRowSelected: { borderWidth: 1, borderColor: '#2a9d8f', backgroundColor: '#eafaf6' },
  medName: { fontWeight: '600' },
  medMeta: { color: '#666', marginTop: 4 },
  selectTag: { fontSize: 12, color: '#333', marginLeft: 8 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' },
  checkBtn: { flex: 1, padding: 12, backgroundColor: '#e63946', borderRadius: 8, alignItems: 'center', marginRight: 8 },
  checkBtnText: { color: '#fff', fontWeight: '700' },
  clearBtn: { padding: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  clearBtnText: { color: '#333' },
  safeBox: { padding: 12, backgroundColor: '#dbf4e4', borderRadius: 8, marginTop: 10 },
  safeText: { color: '#216e40', fontWeight: '700' },
  warnBox: { padding: 12, borderRadius: 8, marginTop: 10 },
  warnHigh: { backgroundColor: '#ffd6d6', borderColor: '#ff8a8a', borderWidth: 1 },
  warnModerate: { backgroundColor: '#fff6d6', borderColor: '#ffda8a', borderWidth: 1 },
  warnTitle: { fontWeight: '700' },
  warnMsg: { marginTop: 6 },
  warnMeds: { marginTop: 6, fontStyle: 'italic' },
  suggest: { marginTop: 6, fontWeight: '600' },
  warnButtons: { flexDirection: 'row', marginTop: 8 },
  pharmBtn: { padding: 8, backgroundColor: '#2a9d8f', borderRadius: 8, marginRight: 8 },
  pharmBtnText: { color: '#fff' },
  removeBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1 },
  removeBtnText: { color: '#333' },
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