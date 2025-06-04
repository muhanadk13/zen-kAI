import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import ConfettiCannon from 'react-native-confetti-cannon';

const OPENAI_API_KEY = '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';

// System prompt to keep replies short and inquisitive
const BASE_SYSTEM_MESSAGE = {
  role: 'system',
  content:
    'You are zen-kAI, a calm, emotionally intelligent assistant. ' +
    'Acknowledge the user in one short line and always finish with a thoughtful question.',
};

export default function ReflectionScreen() {
  const navigation = useNavigation(); // Access navigation object

  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isAIResponding, setIsAIResponding] = useState(false); // Track AI response state
  const [showConfetti, setShowConfetti] = useState(false);
  const scrollViewRef = useRef();
  const sendButtonRef = useRef(null);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  useEffect(() => {
    const loadChatHistory = async () => {
      const savedChatHistory = await AsyncStorage.getItem('chatHistory');
      if (savedChatHistory) {
        setChatMessages(JSON.parse(savedChatHistory));
      }
    };

    loadChatHistory();
    startConversation();
  }, []);

  // Autoscroll to the bottom whenever chatMessages changes
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: false }); // Instant scroll
  }, [chatMessages]);

  const animateAIResponse = async (response) => {
    let displayedText = '';
    for (const letter of response) {
      displayedText += letter;
      setChatMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && !lastMessage.fromUser) {
          return [
            ...prev.slice(0, -1),
            { text: displayedText, fromUser: false },
          ];
        } else {
          return [...prev, { text: displayedText, fromUser: false }];
        }
      });

      // Trigger subtle haptics feedback for AI response
      await Haptics.selectionAsync();

      await new Promise((resolve) => setTimeout(resolve, 30)); // Typing speed
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const fetchOpenAIResponse = async (messages) => {
    try {
      // Simulate AI thinking with a delay
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ API Error:', data);
        Alert.alert('Error', `OpenAI API Error: ${data.error.message}`);
        return `Error: ${data.error.message}`;
      }

      const aiResponse = data.choices[0].message.content.trim();
      await animateAIResponse(aiResponse); // Use typing animation
      return aiResponse;
    } catch (err) {
      console.error('❌ Error fetching OpenAI response:', err.message || err);
      return 'Sorry, I encountered an error. Please try again.';
    }
  };

  const startConversation = async () => {
    try {
      // Clear previous chat messages immediately
      setChatMessages([]);

      // Record the start of a reflection session
      await AsyncStorage.setItem('lastReflectionDate', new Date().toISOString());

      const historyRaw = await AsyncStorage.getItem('checkInHistory');
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      const today = new Date().toISOString().split('T')[0];
      const todayEntries = history.filter((entry) => entry.timestamp.startsWith(today));
      const context = {
        today: todayEntries,
        previousDays: history.filter((entry) => !entry.timestamp.startsWith(today)),
      };

      const initialMessages = [
        BASE_SYSTEM_MESSAGE,
        {
          role: 'user',
          content: `Here are my check-ins:

        Today's: ${JSON.stringify(context.today)}
        
        Previous days: ${JSON.stringify(context.previousDays)}
        
        Ask one short, meaningful reflection question that helps me understand something about how I’ve been feeling lately — without offering advice or suggesting actions. You never say more than a few words`,
        },
      ];

      // Fetch AI response
      const response = await fetchOpenAIResponse(initialMessages);

      // Add AI response as the first message
      setChatMessages([{ text: response, fromUser: false }]);
    } catch (err) {
      console.error('❌ Error starting conversation:', err);
      Alert.alert('Error', 'Failed to start the conversation.');
    }
  };

  const handleSend = async () => {
    if (isAIResponding) return;

    await Haptics.selectionAsync();
    sendButtonRef.current?.rubberBand(400);
  
    const userMessage = message.trim();
    if (!userMessage) return;
  
    const newChatMessages = [...chatMessages, { text: userMessage, fromUser: true }];
    setChatMessages(newChatMessages);
    setMessage('');
  
    // Save all chat messages
    await AsyncStorage.setItem('chatHistory', JSON.stringify(newChatMessages));
  
    // Save only user messages for important information
    const importantInfo = newChatMessages.filter((m) => m.fromUser).map((m) => m.text);
    await AsyncStorage.setItem('importantInfo', JSON.stringify(importantInfo));
  
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, 100);
  
    const userReplyCount = newChatMessages.filter((m) => m.fromUser).length;
  
    // Check if the user has responded to the final question
    const hasRespondedToFinalQuestion =
      newChatMessages.length >= 2 &&
      newChatMessages[newChatMessages.length - 2].text === 'What will you do differently tomorrow?' &&
      newChatMessages[newChatMessages.length - 1].fromUser;
  
    if (hasRespondedToFinalQuestion) {
      setShowConfetti(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        setChatMessages([]);
        navigation.navigate('MentalScore');
        setShowConfetti(false);
      }, 1500);
      return;
    }
  
    const aiReplyCount = newChatMessages.filter((m) => !m.fromUser).length;
  
    if (aiReplyCount >= 4) {
      // Add the final question with AI typing animation
      const finalQuestion = 'What will you do differently tomorrow?';
      await animateAIResponse(finalQuestion); // Animation handles state updates
      // No need to call setChatMessages again here
      return;
    }
  
    const messages = [
      BASE_SYSTEM_MESSAGE,
      ...newChatMessages.map((msg) => ({
        role: msg.fromUser ? 'user' : 'assistant',
        content: msg.text,
      })),
      { role: 'user', content: userMessage },
    ];
  
    // Log the prompt being sent to the AI
    console.log('Prompt sent to AI:', JSON.stringify(messages, null, 2));
  
    setIsAIResponding(true);
  
    const response = await fetchOpenAIResponse(messages);
  
    // Add the AI response to chat messages
    const updatedChatMessages = [...newChatMessages, { text: response, fromUser: false }];
    setChatMessages(updatedChatMessages);
  
    await AsyncStorage.setItem('chatHistory', JSON.stringify(updatedChatMessages));
  
    setIsAIResponding(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1C1C1E' : '#F2F2F7' }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={10}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#1C1C1E' }]}>Reflection</Text>
            <Text style={[styles.subtitle, { color: isDarkMode ? '#A9A9A9' : '#8E8E93' }]}>
              Your personal AI assistant
            </Text>
          </View>

          <ScrollView
            style={styles.chatScroll}
            contentContainerStyle={{ paddingVertical: 10 }}
            ref={scrollViewRef}
            keyboardShouldPersistTaps="handled"
          >
            {chatMessages.map((msg, index) => (
              <Animatable.View
                key={index}
                animation="fadeInUp"
                duration={400}
                style={[
                  styles.chatBubble,
                  msg.fromUser ? styles.userBubble : styles.aiBubble,
                  { backgroundColor: msg.fromUser ? (isDarkMode ? '#007AFF' : '#D0E8FF') : (isDarkMode ? '#2C2C2E' : '#EDEDED') },
                ]}
              >
                <Text style={[styles.chatText, { color: isDarkMode ? '#FFFFFF' : '#1C1C1E' }]}>{msg.text}</Text>
              </Animatable.View>
            ))}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isAIResponding ? '#E0E0E0' : isDarkMode ? '#2C2C2E' : '#F1F1F3',
                  color: isAIResponding ? '#A9A9A9' : isDarkMode ? '#FFFFFF' : '#1C1C1E',
                },
              ]}
              placeholder={isAIResponding ? 'AI is responding...' : 'Type your response...'}
              placeholderTextColor={isAIResponding ? '#A9A9A9' : isDarkMode ? '#666666' : '#A9A9A9'}
              value={message}
              onChangeText={setMessage}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              editable={!isAIResponding} // Disable input while AI is responding
            />
            <Pressable
              onPress={handleSend}
              style={styles.sendButton}
              disabled={isAIResponding} // Disable button while AI is responding
            >
              <Animatable.View ref={sendButtonRef}>
                <Ionicons
                  name="arrow-up-circle"
                  size={43}
                  color={isAIResponding ? '#A9A9A9' : isDarkMode ? '#0A84FF' : '#007AFF'}
                />
              </Animatable.View>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
        {showConfetti && (
          <ConfettiCannon
            count={80}
            origin={{ x: Dimensions.get('window').width / 2, y: 0 }}
            fadeOut
          />
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'System',
    marginTop: 4,
  },
  chatScroll: {
    flex: 1,
  },
  chatBubble: {
    maxWidth: '75%',
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 14,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  aiBubble: {
    alignSelf: 'flex-start',
  },
  chatText: {
    fontSize: 16,
    fontFamily: 'System',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    flex: 1,
    fontFamily: 'System',
  },
  sendButton: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
