import React, { useState, useEffect, useRef } from 'react';
import {
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
} from 'react-native';
import { View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import { markReflectionComplete } from './utils/scoring';
import { OPENAI_API_KEY } from './utils/apiKey';

const baseSystemMessage = {
  role: 'system',
  content:
    'You are zen-kAI, a calm, emotionally intelligent assistant. ' +
    'Acknowledge the user in one short line and always finish with a thoughtful question.',
};

export default function ReflectionScreen() { 
  const navigation = useNavigation(); 
  const [message, setMessage] = useState(''); 
  const [chatMessages, setChatMessages] = useState([]); 
  const [isAIResponding, setIsAIResponding] = useState(false); 
  const scrollViewRef = useRef(); 
  const sendButtonRef = useRef(null); 

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

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true }); 
  }, [chatMessages]); 

  const animateAIResponse = async (response) => { 
    let displayedText = ''; 
    for (const letter of response) { 
      displayedText += letter; 
      setChatMessages((prev) => { 
        const lastMessage = prev[prev.length - 1]; 
        if (lastMessage && !lastMessage.fromUser) { 
          return [...prev.slice(0, -1), { text: displayedText, fromUser: false }]; 
        } else {
          return [...prev, { text: displayedText, fromUser: false }]; 
        }
      });
      await new Promise((res) => setTimeout(res, 25)); 
    }

    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const fetchAIResponse = async (messages) => { 
    try { 
      await new Promise((res) => setTimeout(res, 800)); 
      const response = await fetch('https:
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${OPENAI_API_KEY}`, 
        },
        body: JSON.stringify({ 
          model: 'gpt-4o-mini', 
          messages, 
          temperature: 0.7, 
          max_tokens: 150, 
        }),
      });
      const data = await response.json(); 
      if (!response.ok) throw new Error(data.error.message); 
      const aiResponse = data.choices[0].message.content.trim(); 
      await animateAIResponse(aiResponse); 
      return aiResponse; 
    } catch (err) { 
      Alert.alert('Error', err.message); 
      return 'Something went wrong. Please try again.'; 
    }
  };

  const startConversation = async () => { 
    setChatMessages([]); 
    await AsyncStorage.setItem('lastReflectionDate', new Date().toISOString()); 
    const historyRaw = await AsyncStorage.getItem('checkInHistory'); 
    const history = historyRaw ? JSON.parse(historyRaw) : []; 
    const today = new Date().toISOString().split('T')[0]; 
    const context = {
      today: history.filter((e) => e.timestamp.startsWith(today)), 
      previousDays: history.filter((e) => !e.timestamp.startsWith(today)), 
    };
    const initialMessages = [
      baseSystemMessage, 
      {
        role: 'user',
        
        content: `Here are my check-ins:\n\nToday's: ${JSON.stringify(context.today)}\n\nPrevious days: ${JSON.stringify(context.previousDays)}\n\nAsk one short, meaningful reflection question that helps me understand something about how I’ve been feeling lately — without offering advice or suggesting actions. You never say more than a few words.`,
      },
    ];
    const response = await fetchAIResponse(initialMessages); 
    if (!chatMessages.some((m) => m.text === response && !m.fromUser)) { 
      setChatMessages([{ text: response, fromUser: false }]); 
    }
  };

  const handleSend = async () => { 
    if (isAIResponding || !message.trim()) return; 

    await Haptics.selectionAsync(); 
    sendButtonRef.current?.rubberBand(400); 

    const userMessage = { text: message.trim(), fromUser: true }; 
    const newChatMessages = [...chatMessages, userMessage]; 
    setChatMessages(newChatMessages); 
    setMessage(''); 

    await AsyncStorage.setItem('chatHistory', JSON.stringify(newChatMessages)); 
    await AsyncStorage.setItem(
      'importantInfo',
      JSON.stringify(newChatMessages.filter((m) => m.fromUser).map((m) => m.text)) 
    );

    if (
      newChatMessages.length >= 2 && 
      newChatMessages.at(-2).text === 'What will you do differently tomorrow?' && 
      newChatMessages.at(-1).fromUser 
    ) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); 
      await markReflectionComplete(); 
      setTimeout( 
        () =>
          navigation.reset({
            index: 0,
            routes: [{ name: 'MentalScore' }], 
          }),
        500
      );
      return; 
    }

    if (newChatMessages.filter((m) => !m.fromUser).length >= 4) { 
      await animateAIResponse('What will you do differently tomorrow?'); 
      return; 
    }

    const messages = [
      baseSystemMessage, 
      ...newChatMessages.map((m) => ({ 
        role: m.fromUser ? 'user' : 'assistant', 
        content: m.text, 
      })),
    ];

    setIsAIResponding(true); 

    try {
      const response = await fetchAIResponse(messages); 

      
      setChatMessages((prev) => {
        const lastMessage = prev[prev.length - 1]; 
        if (lastMessage && lastMessage.text === response && !lastMessage.fromUser) { 
          return prev; 
        }
        const updatedMessages = [...prev, { text: response, fromUser: false }]; 
        AsyncStorage.setItem('chatHistory', JSON.stringify(updatedMessages)); 
        return updatedMessages; 
      });
    } catch (error) {
      console.error('Error fetching AI response:', error); 
    } finally {
      setIsAIResponding(false); 
    }
  };

  return (
    <Animatable.View animation="fadeIn" duration={400} style={{ flex: 1 }}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}> 
      <SafeAreaView style={styles.container}> 
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}> 
          <BlurView intensity={25} tint="dark" style={styles.header}> 
            <Text style={styles.title}>Reflection</Text> 
            <Text style={styles.subtitle}>Guided by zen-kAI</Text>
          </BlurView> 

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
                style={[styles.chatBubble, msg.fromUser ? styles.userBubble : styles.aiBubble]} 
              >
                <Text style={styles.chatText}>{msg.text}</Text> 
              </Animatable.View>
            ))}
          </ScrollView>

          <View style={styles.inputContainer}> 

            <TextInput 
              style={styles.input} 
              placeholder={isAIResponding ? 'AI is responding...' : 'Type your response...'} 
              placeholderTextColor="#7C7C8A"
              value={message} 
              onChangeText={setMessage} 
              returnKeyType="send" 
              onSubmitEditing={handleSend} 
              editable={!isAIResponding}
            />
            <Pressable onPress={handleSend} style={styles.sendButton} disabled={isAIResponding}> 
              <Animatable.View ref={sendButtonRef}> 
                <Ionicons name="arrow-up-circle" size={40} color="#51C4FF" /> 
              </Animatable.View>
            </Pressable>

          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1117',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20, 
    paddingBottom: 10,
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#8A8F98',
    marginTop: 4,
  },
  chatScroll: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 74, 
  },
  chatBubble: {
    maxWidth: '80%',
    padding: 14,
    marginVertical: 6,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#3D9DF6',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1C1E29',
  },
  chatText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#1F232B',
    backgroundColor: '#12141B',
  },
  input: {
    flex: 1,
    backgroundColor: '#1F2233',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#FFFFFF',
  },
  sendButton: {
    marginLeft: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F2233',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#51C4FF',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
});
