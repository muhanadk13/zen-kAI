import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Video } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoadScreen() {
  const navigation = useNavigation();
  const videoRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    if (videoLoaded) {
      const timer = setTimeout(async () => {
        const done = await AsyncStorage.getItem('onboardingComplete');
        navigation.replace(done ? 'MentalScore' : 'Onboarding');
      }, 3000); // wait 3s after load, then jump
      return () => clearTimeout(timer);
    }
  }, [videoLoaded]);

  return (
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});
