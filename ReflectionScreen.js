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
import { OPENAI_API_KEY } from './utils/apiKey';

const BASE_SYSTEM_MESSAGE = {
  role: 'system',
  content:
    'You are zen-kAI, a calm, emotionally intelligent assistant. ' +
    'Acknowledge the user in one short line and always finish with a thoughtful question.',
};

export default function ReflectionScreen() { // this is the start that contains all the pages information
  const navigation = useNavigation(); // giving the import a name
  const [message, setMessage] = useState(''); // message is '' but setMessage is what changes it 
  const [chatMessages, setChatMessages] = useState([]); // chatMessage is an empty array that setChatMessages changes
  const [isAIResponding, setIsAIResponding] = useState(false); // isAIResponding is false bit setIsAIResponding changes it
  const scrollViewRef = useRef(); // create a remote for scrollViewRef
  const sendButtonRef = useRef(null); // remote but set to null

  useEffect(() => { // run immediately 
    const loadChatHistory = async () => { // get the chat history - await: there will be some waiting in function
      const savedChatHistory = await AsyncStorage.getItem('chatHistory'); // await means wait for the get item to finish and save
      if (savedChatHistory) { // now if there is history
        setChatMessages(JSON.parse(savedChatHistory)); // convert to understandable format
      }
    };
    loadChatHistory(); // run the method 
    startConversation(); // later
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true }); // lets scroll to the end if there is one 
  }, [chatMessages]); // runs everytime the chatMessages changes

  const animateAIResponse = async (response) => { // will take an input of response
    let displayedText = ''; // no text to start
    for (const letter of response) { //for each letter in the response
      displayedText += letter; // add a new letter to diplayedText
      setChatMessages((prev) => { // create function that takes the previous chat messages
        const lastMessage = prev[prev.length - 1]; // get the last message
        if (lastMessage && !lastMessage.fromUser) { // if there is a last message it its from AI
          return [...prev.slice(0, -1), { text: displayedText, fromUser: false }]; // take all message except last and add a new messgage
        } else {
          return [...prev, { text: displayedText, fromUser: false }]; // add a new message since there is no last message
        }
      });
      await new Promise((res) => setTimeout(res, 25)); // add a pause of 25 milliseconds to each letter
    }

    // Trigger haptic feedback when the AI message is fully displayed
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const fetchOpenAIResponse = async (messages) => { // function for getting AI response with message parameter
    try { // try this code 
      await new Promise((res) => setTimeout(res, 800)); // wait 800 milliseconds before starting 
      const response = await fetch('https://api.openai.com/v1/chat/completions', { // response comes from this url
        method: 'POST', // I will be sending data to openAI
        headers: {
          'Content-Type': 'application/json', // I am sending JSON
          Authorization: `Bearer ${OPENAI_API_KEY}`, // Password
        },
        body: JSON.stringify({ // what I am sending
          model: 'gpt-4o-mini', // the model I am using 
          messages, // previous messages
          temperature: 0.7, // creativity 0-1
          max_tokens: 150, // length of response
        }),
      });
      const data = await response.json(); // data is the response in JSON format
      if (!response.ok) throw new Error(data.error.message); // if response is not ok throw error
      const aiResponse = data.choices[0].message.content.trim(); // take the first array and trim it
      await animateAIResponse(aiResponse); // take the AI response and animate it
      return aiResponse; // return the response
    } catch (err) { // if there is an error
      Alert.alert('Error', err.message); // send an alert with the message
      return 'Something went wrong. Please try again.'; // say there was something that went wrong
    }
  };

  const startConversation = async () => { // start a conversation function
    setChatMessages([]); // clear chat messages
    await AsyncStorage.setItem('lastReflectionDate', new Date().toISOString()); // set the last reflection date to today
    const historyRaw = await AsyncStorage.getItem('checkInHistory'); // get the check in history
    const history = historyRaw ? JSON.parse(historyRaw) : []; // if there is history parse it to JSON otherwise empty array
    const today = new Date().toISOString().split('T')[0]; // get todays date, split it at T and take the first part
    const context = {
      today: history.filter((e) => e.timestamp.startsWith(today)), // only keep today 
      previousDays: history.filter((e) => !e.timestamp.startsWith(today)), // keep everything but today
    };
    const initialMessages = [
      BASE_SYSTEM_MESSAGE, // how AI should behave
      {
        role: 'user',
        // Give information and prompt 
        content: `Here are my check-ins:\n\nToday's: ${JSON.stringify(context.today)}\n\nPrevious days: ${JSON.stringify(context.previousDays)}\n\nAsk one short, meaningful reflection question that helps me understand something about how I’ve been feeling lately — without offering advice or suggesting actions. You never say more than a few words.`,
      },
    ];
    const response = await fetchOpenAIResponse(initialMessages); // response is the AI response with the parameter intialMessages
    if (!chatMessages.some((m) => m.text === response && !m.fromUser)) { // prevent duplicate AI messages (not needed)
      setChatMessages([{ text: response, fromUser: false }]); // set chat messages to the response
    }
  };

  const handleSend = async () => { // function to handle the sending
    if (isAIResponding || !message.trim()) return; // if AI is responding or there is no message do nothing

    await Haptics.selectionAsync(); // add haptiics when the message is sent
    sendButtonRef.current?.rubberBand(400); // now we use the remote to make it do a rubber band animation for 400 milliseconds

    const userMessage = { text: message.trim(), fromUser: true }; // object of the user message
    const newChatMessages = [...chatMessages, userMessage]; // add the new messages to the old
    setChatMessages(newChatMessages); // set the chat message to the updated array
    setMessage(''); // clear the message

    await AsyncStorage.setItem('chatHistory', JSON.stringify(newChatMessages)); // chat history is the JSON of newChatMessage 
    await AsyncStorage.setItem(
      'importantInfo',
      JSON.stringify(newChatMessages.filter((m) => m.fromUser).map((m) => m.text)) // importantInfo is the JSON pf newChatMessages that only keeps the users information and converts to text string 
    );



    const messages = [
      BASE_SYSTEM_MESSAGE, // how AI should behave
      ...newChatMessages.map((m) => ({ // do same thing for evey newChatMessage
        role: m.fromUser ? 'user' : 'assistant', // role is either user or assistant
        content: m.text, // content is the text
      })),
    ];

    setIsAIResponding(true); // AI is responding now (right before)

    try {
      const response = await fetchOpenAIResponse(messages); // try to get the response from AI

      // Prevent duplicate AI messages by checking the last AI message
      setChatMessages((prev) => {
        const lastMessage = prev[prev.length - 1]; // get the last message
        if (lastMessage && lastMessage.text === response && !lastMessage.fromUser) {
          return prev; // Do not add duplicate AI message
        }
        const updatedMessages = [...prev, { text: response, fromUser: false }]; // add the new message
        AsyncStorage.setItem('chatHistory', JSON.stringify(updatedMessages)); // update the chat history
        return updatedMessages; // return the updated messages
      });
    } catch (error) {
      console.error('Error fetching AI response:', error); // catch error
    } finally {
      setIsAIResponding(false); // AI is done responding (end)
    }
  };

  return (
    <Animatable.View animation="fadeIn" duration={400} style={{ flex: 1 }}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}> 
      <SafeAreaView style={styles.container}> 
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}> 
          <BlurView intensity={25} tint="dark" style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
            </Pressable>
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
    paddingTop: 20, // Reduced by 16
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
  backButton: {
    position: 'absolute',
    left: 16,
    top: 20,
    padding: 6,
  },
  chatScroll: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 74, // Reduced by 16
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
