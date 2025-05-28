import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MentalScoreScreen from './MentalScoreScreen';
import CheckInScreen from './CheckInScreen';
import InsightPlaceholderScreen from './InsightPlaceholderScreen';
import ReflectionScreen from './ReflectionScreen'; // ✅ Import the Reflection screen

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="MentalScore">
        <Stack.Screen name="MentalScore" component={MentalScoreScreen} />
        <Stack.Screen name="CheckIn" component={CheckInScreen} />
        <Stack.Screen
          name="InsightPlaceholder"
          component={InsightPlaceholderScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Reflection"
          component={ReflectionScreen}
          options={{ headerShown: false }} // Optional: Hide header for a clean look
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
