import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

function formatTime(iso) {
  const d = new Date(iso);
  return d.toTimeString().slice(0,5);
}

function calcFocus(c, e) {
  return Math.round(0.6 * c + 0.4 * e);
}

export default function HistoryScreen() {
  const [days, setDays] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem('checkInHistory');
        const history = raw ? JSON.parse(raw) : [];
        const grouped = {};
        history.forEach((e) => {
          const day = e.timestamp.split('T')[0];
          if (!grouped[day]) grouped[day] = [];
          grouped[day].push(e);
        });
        const result = [];
        for (let i = 0; i < 30; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().split('T')[0];
          result.push({ date: key, entries: grouped[key] || [] });
        }
        setDays(result);
      } catch (err) {
        console.error('Error loading history', err);
      }
    };
    load();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {days.map((day, idx) => (
        <View key={day.date} style={styles.dayBox}>
          <Text style={styles.dayHeader}>Day {day.date}</Text>
          {idx < 7 ? (
            day.entries.length > 0 ? (
              day.entries.map((e) => (
                <View key={e.timestamp} style={styles.entry}>
                  <Text style={styles.entryText}>
                    - {e.window} @ {formatTime(e.timestamp)}: Energy {e.energy}, Clarity {e.clarity}, Emotion {e.emotion}
                  </Text>
                  <Text style={styles.note}>Note: {e.note || 'None'}</Text>
                  <Text style={styles.tags}>Tags: N/A</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noData}>No check-ins</Text>
            )
          ) : (
            <Text style={styles.avgText}>
              Avg Energy {day.entries.length ? Math.round(day.entries.reduce((s, e) => s + (e.energy || 0), 0) / day.entries.length) : 'N/A'},
              Clarity {day.entries.length ? Math.round(day.entries.reduce((s, e) => s + (e.clarity || 0), 0) / day.entries.length) : 'N/A'},
              Emotion {day.entries.length ? Math.round(day.entries.reduce((s, e) => s + (e.emotion || 0), 0) / day.entries.length) : 'N/A'},
              Focus {day.entries.length ? Math.round(day.entries.reduce((s, e) => s + calcFocus(e.clarity || 0, e.energy || 0), 0) / day.entries.length) : 'N/A'} — Tags: N/A
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F2F2F7',
  },
  dayBox: {
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
  },
  dayHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  entry: {
    marginBottom: 6,
  },
  entryText: {
    fontSize: 14,
  },
  note: {
    fontSize: 13,
    color: '#555',
  },
  tags: {
    fontSize: 13,
    color: '#777',
  },
  noData: {
    fontSize: 14,
    color: '#999',
  },
  avgText: {
    fontSize: 14,
  },
});
