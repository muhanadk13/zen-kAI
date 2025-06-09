import AsyncStorage from '@react-native-async-storage/async-storage';

export function formatTime(iso) {
  const d = new Date(iso);
  return d.toTimeString().slice(0, 5);
}

export function calcFocus(clarity, energy) {
  return Math.round(0.6 * clarity + 0.4 * energy);
}

export function formatCompiledHistory(days) {
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
        `  Avg Energy ${avg('energy')}, Clarity ${avg('clarity')}, Emotion ${avg('emotion')}, Focus ${focus} — Tags: ${tagSummary.length ? tagSummary.join(', ') : 'None'}`
      );
    }
    lines.push('');
  });

  return lines.join('\n');
}

export async function compileHistory() {
  const raw = await AsyncStorage.getItem('checkInHistory');
  const history = raw ? JSON.parse(raw) : [];

  const grouped = {};
  history.forEach((e) => {
    const day = e.timestamp.split('T')[0];
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(e);
  });

  const days = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ date: key, entries: grouped[key] || [] });
  }

  const compiled = formatCompiledHistory(days);
  await AsyncStorage.setItem('compiledHistory', compiled);
  return { days, compiled };
}
