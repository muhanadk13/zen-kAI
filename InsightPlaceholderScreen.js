import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from './utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function InsightPlaceholderScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current; // Use useRef for Animated.Value
  const [insight, setInsight] = useState('Generating insight...'); // Placeholder insight

  useEffect(() => {
    const fetchLatestCheckIn = async () => {
      try {
        const historyRaw = await AsyncStorage.getItem('checkInHistory');
        const history = historyRaw ? JSON.parse(historyRaw) : [];
        const latestCheckIn = history[history.length - 1]; // Get the most recent check-in

        if (latestCheckIn) {
          const { energy, clarity, emotion, note } = latestCheckIn;

          const prompt = `
          You're a supportive and direct mental performance coach. The user just completed a check-in with these values:
          
          - Energy: ${energy}/10
          - Clarity: ${clarity}/10
          - Emotion: ${emotion}/10
          - Note: ${note || 'None'}
          
          Your job is to give one piece of short, actionable advice for what they should do next. Do not repeat their scores or describe how they feel. Be clear, helpful, and realistic. Make the insight feel like it understands them and helps them shift their day forward now.
          
          Respond in 1–2 short sentences.`;

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer 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`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'You are a motivational, emotionally intelligent assistant who gives direct advice.' },
                { role: 'user', content: prompt },
              ],
              temperature: 0.7,
            }),
          });

          const data = await response.json();
          console.log('API Response:', data); // Log the API response for debugging

          if (!response.ok) {
            console.error('API Error:', data.error);
            setInsight('Could not generate an insight right now.');
            return;
          }

          const gptInsight = data.choices?.[0]?.message?.content?.trim();

          if (gptInsight) {
            setInsight(gptInsight); // Update the insight dynamically
          } else {
            setInsight('Could not generate an insight right now.');
          }
        } else {
          setInsight('No recent check-in found.');
        }
      } catch (err) {
        console.error('❌ Error fetching or generating insight:', err);
        setInsight('Unable to fetch insights.');
      }
    };

    fetchLatestCheckIn();

    // Start the animation sequence
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1, // Fade in to full opacity
        duration: 1000, // Smooth fade-in
        useNativeDriver: true,
      }),
      Animated.delay(6500), // Keep the text visible for 10 seconds
      Animated.timing(fadeAnim, {
        toValue: 0, // Fade out to zero opacity
        duration: 1000, // Smooth fade-out
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Navigate to the next screen after the animation completes
      navigation.navigate('MentalScore');
    });
  }, [fadeAnim, navigation]);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.text, { opacity: fadeAnim }]}>
        {insight}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight, // Light background for a clean look
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 24, // Balanced font size for readability
    fontWeight: '600', // Medium bold for elegance
    color: colors.textDark, // Dark text for contrast
    textAlign: 'center',
    fontFamily: 'System',
    letterSpacing: 0.5, // Subtle letter spacing for refinement
    lineHeight: 32, // Comfortable line height for readability
    shadowColor: 'rgba(0, 0, 0, 0.1)', // Subtle shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
});
