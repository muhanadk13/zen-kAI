import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Video } from 'expo-av';
import { useNavigation } from '@react-navigation/native';

export default function LoadScreen({ onboardingDone }) {
  const navigation = useNavigation();
  const videoRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    if (videoLoaded) {
      const timer = setTimeout(() => {
        navigation.replace(onboardingDone ? 'MentalScore' : 'Onboarding');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [videoLoaded, onboardingDone]);

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
