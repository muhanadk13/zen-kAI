import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import * as Animatable from 'react-native-animatable';
import jwtDecode from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';

const formatTime = (isoString) => {
  const date = new Date(isoString);
  return date.toTimeString().slice(0, 5);
};

const calculateFocus = (clarity, energy) => {
  return Math.round(0.6 * clarity + 0.4 * energy);
};

const compileHistory = (days) => {
  return days.map((day, idx) => {
    const header = `Day ${day.date}`;
    const entries = day.entries;

    if (idx < 7) {
      if (entries.length === 0) return `${header}\n  No check-ins\n`;

      const details = entries
        .sort((a, b) => a.window.localeCompare(b.window))
        .map((e) => {
          const focus = calculateFocus(e.clarity, e.energy);
          return [
            `  - ${e.window} @ ${formatTime(e.timestamp)}`,
            `    Today's Metrics:`,
            `      - Energy: ${e.energy}% ⚡`,
            `      - Clarity: ${e.clarity}% 💡`,
            `      - Emotion: ${e.emotion}% 💚`,
            `      - Focus: ${focus}% 🎯`,
            `      - Mental Score: ${focus}%`,
            `      - Note: ${e.note || 'No note provided.'}`,
          ].join('\n');
        })
        .join('\n');

      return `${header}\n${details}\n`;
    } else {
      const avg = (key) =>
        entries.length
          ? Math.round(entries.reduce((sum, e) => sum + (e[key] || 0), 0) / entries.length)
          : 'N/A';

      const avgFocus = entries.length
        ? Math.round(
            entries.reduce(
              (sum, e) => sum + calculateFocus(e.clarity || 0, e.energy || 0),
              0
            ) / entries.length
          )
        : 'N/A';

      const tags = [...new Set(entries.flatMap((e) => e.tags || []))].join(', ') || 'None';

      return `${header}\n  Avg Energy ${avg('energy')}, Clarity ${avg('clarity')}, Emotion ${avg('emotion')}, Focus ${avgFocus} — Tags: ${tags}\n`;
    }
  }).join('\n');
};

export default function HistoryScreen() {
  const [days, setDays] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const decoded = jwtDecode(token); // Future use if needed
        const historyRaw = await AsyncStorage.getItem('history');
        const history = historyRaw ? JSON.parse(historyRaw) : [];

        const grouped = {};
        history.forEach((entry) => {
          const day = entry.timestamp.split('T')[0];
          if (!grouped[day]) grouped[day] = [];
          grouped[day].push(entry);
        });

        const daysArray = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateString = date.toISOString().split('T')[0];
          return { date: dateString, entries: grouped[dateString] || [] };
        });

        const compiled = compileHistory(daysArray);
        await AsyncStorage.setItem('compiledHistory', compiled);
        console.log('✅ Compiled check-in history saved:\n', compiled);

        setDays(daysArray);
      } catch (error) {
        console.error('❌ Failed to load history', error);
      }
    };

    loadHistory();
  }, []);

  return (
    <Animatable.View animation="fadeIn" duration={400} style={styles.flexContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        {days.map((day, idx) => (
          <View key={day.date} style={styles.dayBox}>
            <Text style={styles.dayHeader}>Day {day.date}</Text>
            {idx < 7 ? (
              day.entries.length > 0 ? (
                day.entries
                  .sort((a, b) => a.window.localeCompare(b.window))
                  .map((entry) => (
                    <View key={entry.timestamp} style={styles.entry}>
                      <Text style={styles.entryText}>
                        - {entry.window} @ {formatTime(entry.timestamp)}: Energy {entry.energy}, Clarity {entry.clarity}, Emotion {entry.emotion}
                      </Text>
                      <Text style={styles.note}>Note: {entry.note || 'None'}</Text>
                      <Text style={styles.tags}>Tags: {entry.tags?.join(', ') || 'None'}</Text>
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
                Focus {day.entries.length ? Math.round(day.entries.reduce((s, e) => s + calculateFocus(e.clarity || 0, e.energy || 0), 0) / day.entries.length) : 'N/A'} —
                Tags: {day.entries.length ? [...new Set(day.entries.flatMap(e => e.tags || []))].join(', ') || 'None' : 'N/A'}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
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
