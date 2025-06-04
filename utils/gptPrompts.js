export function microInsightPrompt(currentCheckIn, yesterdayCheckIn) {
  const { energy, clarity, emotion } = currentCheckIn;
  const { energy: yEnergy, clarity: yClarity, emotion: yEmotion } = yesterdayCheckIn;
  return `Compare these two check-ins and give 1 sentence about what changed or stayed consistent.\n\nYesterday: Energy ${yEnergy}, Clarity ${yClarity}, Emotion ${yEmotion}\nToday: Energy ${energy}, Clarity ${clarity}, Emotion ${emotion}`;
}

export function dailyReflectionPrompt(checkIns) {
  const [morning, midday, night] = checkIns;
  return `You are a mindful assistant. Based on these 3 check-ins, write a daily mental summary. Include:\n- Emotional and clarity trends\n- Observations\n- 1 thought-provoking question\n\nMorning: E: ${morning.energy}, C: ${morning.clarity}, Em: ${morning.emotion}\nMidday: E: ${midday.energy}, C: ${midday.clarity}, Em: ${midday.emotion}\nNight: E: ${night.energy}, C: ${night.clarity}, Em: ${night.emotion}`;
}

export function patternDetectionPrompt(weeklyData) {
  const lines = Object.entries(weeklyData)
    .map(([day, data]) => `${day}: Energy ${data.energy}, Clarity ${data.clarity}`)
    .join('\n');
  return `Based on this 30-day dataset, what trends do you see?\n\n${lines}\n\nSummarize emotional and focus patterns. Include advice.`;
}
