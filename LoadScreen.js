import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Video } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import decodeToken from './utils/decodeToken';

export default function LoadScreen() {
  const navigation = useNavigation();
  const videoRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    if (videoLoaded) {
        const timer = setTimeout(async () => {
          const done = await AsyncStorage.getItem('onboardingComplete');

          if (!done) {
            navigation.replace('Onboarding');
            return;
          }

          const token = await AsyncStorage.getItem('token');

          if (!token) {
            navigation.replace('LoginScreen');
            return;
          }

          try {
            const decoded = decodeToken(token);
            if (decoded.exp * 1000 > Date.now()) {
              navigation.replace('MentalScore');
            } else {
              await AsyncStorage.removeItem('token');
              navigation.replace('LoginScreen');
            }
          } catch {
            await AsyncStorage.removeItem('token');
            navigation.replace('LoginScreen');
          }
        }, 3000); // wait 3s after load, then jump
      return () => clearTimeout(timer);
    }
  }, [videoLoaded]);

  return (
    <Animatable.View animation="fadeIn" duration={400} style={{ flex: 1 }}>
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={require('./assets/video/load.mp4')}
        shouldPlay
        resizeMode="cover"
        isMuted
        onLoad={() => setVideoLoaded(true)}
        style={StyleSheet.absoluteFill}
      />
    </View>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});
