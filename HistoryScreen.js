import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { compileHistory, formatTime, calcFocus } from './utils/history';


export default function HistoryScreen() {
  const [days, setDays] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { days, compiled } = await compileHistory();
        console.log('✅ Compiled check-in history saved:');
        console.log(compiled);
        setDays(days);
      } catch (err) {
        console.error('❌ Error loading check-in history', err);
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
              [...day.entries]
                .sort((a, b) => a.window.localeCompare(b.window))
                .map((e) => (
                  <View key={e.timestamp} style={styles.entry}>
                    <Text style={styles.entryText}>
                      - {e.window} @ {formatTime(e.timestamp)}: Energy {e.energy}, Clarity {e.clarity}, Emotion {e.emotion}
                    </Text>
                    <Text style={styles.note}>Note: {e.note || 'None'}</Text>
                    <Text style={styles.tags}>
                      Tags: {e.tags && e.tags.length ? e.tags.join(', ') : 'None'}
                    </Text>
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
              Focus {day.entries.length ? Math.round(day.entries.reduce((s, e) => s + calcFocus(e.clarity || 0, e.energy || 0), 0) / day.entries.length) : 'N/A'} —
              Tags: {day.entries.length ? [...new Set(day.entries.flatMap(e => e.tags || []))].join(', ') || 'None' : 'N/A'}
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
