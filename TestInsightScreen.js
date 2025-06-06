import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { colors } from './utils/theme';
import { generateMicroInsight } from './utils/generateTodaysInsight';

export default function TestInsightScreen() {
  const [insight, setInsight] = useState('No insight yet.');

  const handleTest = async () => {
    const mockCheckIns = [
      { energy: 70, clarity: 60, emotion: 65 },
      { energy: null, clarity: null, emotion: null },
      { energy: null, clarity: null, emotion: null },
    ];
    const mockYesterday = { energy: 78, clarity: 64, emotion: 72 };

    const result = await generateMicroInsight(mockCheckIns, mockYesterday);
    setInsight(result);
    Alert.alert('✅ Insight Generated', result);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>🧠 Test Micro Insight</Text>
      <TouchableOpacity style={styles.button} onPress={handleTest}>
        <Text style={styles.buttonText}>Generate Insight</Text>
      </TouchableOpacity>
      <Text style={styles.resultLabel}>Result:</Text>
      <Text style={styles.resultText}>{insight}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: colors.text,
  },
  button: {
    backgroundColor: colors.accent2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.text,
  },
  resultText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
});