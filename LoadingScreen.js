import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

export default function LoadingScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.replace('MentalScore');
    }, 2500);
    return () => clearTimeout(timeout);
  }, [navigation]);

  return (
    <LinearGradient
      colors={["#1cadf1", "#9048f7"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animatable.Image
        animation="fadeIn"
        delay={200}
        duration={800}
        source={require('./assets/logo-full.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Animatable.Text animation="fadeInUp" delay={400} style={styles.title}>
        ZENKAI
      </Animatable.Text>
      <Animatable.Text
        animation="fadeIn"
        delay={900}
        iterationCount="infinite"
        direction="alternate"
        style={styles.message}
      >
        Centering your mind...
      </Animatable.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 18,
    color: '#eee',
  },
});
