import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Video } from 'expo-av';
import { useNavigation } from '@react-navigation/native';

export default function LoadScreen() {
  const navigation = useNavigation();
  const videoRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('MentalScore'); // Replace prevents "back" to Load
    }, 3000); // Adjust delay as needed (ms)

    return () => {
      clearTimeout(timer);
      videoRef.current?.stopAsync();
      videoRef.current?.unloadAsync();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={require('./assets/video/load.mp4')}
        shouldPlay
        isLooping
        resizeMode="cover"
        isMuted
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
