import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from './theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

function formatTime(iso) {
  const d = new Date(iso);
  return d.toTimeString().slice(0, 5);
}

function calcFocus(clarity, energy) {
  return Math.round(0.6 * clarity + 0.4 * energy);
}

function formatCompiledHistory(days) {
  const lines = [];

  days.forEach((day, idx) => {
    lines.push(`Day ${day.date}`);
    if (idx < 7) {
      if (day.entries.length > 0) {
        [...day.entries]
          .sort((a, b) => a.window.localeCompare(b.window))
          .forEach((e) => {
            const focus = calcFocus(e.clarity, e.energy);
            lines.push(`  - ${e.window} @ ${formatTime(e.timestamp)}`);
            lines.push(`    Today's Metrics (${e.window} check-in):`);
            lines.push(`      - Energy: ${e.energy}% ⚡`);
            lines.push(`      - Clarity: ${e.clarity}% 💡`);
            lines.push(`      - Emotion: ${e.emotion}% 💚`);
            lines.push(`      - Focus: ${focus}% 🎯`);
            lines.push(`      - Mental Score: ${focus}%`);
            lines.push(`      - Note: ${e.note || 'No note provided.'}`);
          });
      } else {
        lines.push(`  No check-ins`);
      }
    } else {
      const length = day.entries.length;
      const avg = (key) =>
        length
          ? Math.round(day.entries.reduce((s, e) => s + (e[key] || 0), 0) / length)
          : 'N/A';
      const focus = length
        ? Math.round(
            day.entries.reduce(
              (s, e) => s + calcFocus(e.clarity || 0, e.energy || 0),
              0
            ) / length
          )
        : 'N/A';
      const tagSummary = [...new Set(day.entries.flatMap((e) => e.tags || []))];
      lines.push(
        `  Avg Energy ${avg('energy')}, Clarity ${avg('clarity')}, Emotion ${avg(
          'emotion'
        )}, Focus ${focus} — Tags: ${tagSummary.length ? tagSummary.join(', ') : 'None'}`
      );
    }
    lines.push('');
  });

  return lines.join('\n');
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

        const compiled = formatCompiledHistory(result);
        await AsyncStorage.setItem('compiledHistory', compiled);
        console.log('✅ Compiled check-in history saved:');
        console.log(compiled);

        setDays(result);
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
    backgroundColor: COLORS.paleGray,
  },
  dayBox: {
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
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
    color: COLORS.textSecondary,
  },
  tags: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  noData: {
    fontSize: 14,
    color: COLORS.placeholder,
  },
  avgText: {
    fontSize: 14,
  },
});
