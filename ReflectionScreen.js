import React, { useState, useRef, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'react-native';

export default function ReflectionScreen() {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const scrollViewRef = useRef();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const handleSend = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const userMessage = message.trim();
    if (!userMessage) return;

    setChatMessages(prev => [...prev, { text: userMessage, fromUser: true }]);
    setMessage('');

    // Simulate AI reply immediately
    const reply = generateAIResponse(userMessage);
    animateAIResponse(reply);
  };

  const animateAIResponse = async (reply) => {
    let displayedText = '';
    const words = reply.split(' '); // Split reply into words
    for (const word of words) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Light haptic for each word
      for (const letter of word) {
        displayedText += letter; // Append letter by letter
        setChatMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && !lastMessage.fromUser) {
            // Update the last AI message
            return [
              ...prev.slice(0, -1),
              { text: displayedText, fromUser: false },
            ];
          } else {
            // Add a new AI message
            return [...prev, { text: displayedText, fromUser: false }];
          }
        });

        // Scroll to the end after updating the chat
        scrollViewRef.current?.scrollToEnd({ animated: true }); // Animated scroll

        await new Promise(resolve => setTimeout(resolve, 30)); // Faster delay for letter animation
      }
      displayedText += ' '; // Add space after each word
    }
  };

  const generateAIResponse = (userMessage) => {
    // Simulate dynamic AI response
    return `You said: "${userMessage}". Here's something to reflect on...`;
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#1C1C1E' : '#F9FAFB' }]}>
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
              <View
                key={index}
                style={[
                  styles.chatBubble,
                  msg.fromUser ? styles.userBubble : styles.aiBubble,
                  { backgroundColor: msg.fromUser ? (isDarkMode ? '#007AFF' : '#D0E8FF') : (isDarkMode ? '#2C2C2E' : '#EDEDED') },
                ]}
              >
                <Text style={[styles.chatText, { color: isDarkMode ? '#FFFFFF' : '#1C1C1E' }]}>{msg.text}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDarkMode ? '#2C2C2E' : '#F1F1F3',
                  color: isDarkMode ? '#FFFFFF' : '#1C1C1E',
                },
              ]}
              placeholder="Ask me anything..."
              placeholderTextColor={isDarkMode ? '#666666' : '#A9A9A9'}
              value={message}
              onChangeText={setMessage}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <Pressable onPress={handleSend} style={styles.sendButton}>
              <Ionicons name="arrow-up-circle" size={43} color={isDarkMode ? '#0A84FF' : '#007AFF'} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
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
    width: 44, // Increased size by 25%
    height: 44, // Increased size by 25%
    borderRadius: 22, // Ensure circular shape
  },
});