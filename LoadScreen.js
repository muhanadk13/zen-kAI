import React from 'react';
import { Video } from 'expo-av';

export default function LoadScreen() {
  return (
    <Video
      source={require('./assets/load.mp4')}
      shouldPlay
      isLooping
    />
  );
}
