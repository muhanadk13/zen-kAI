import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function InsightPlaceholderScreen({ navigation }) {
  useEffect(() => {
    navigation.navigate('Reflection');
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Loading Reflection...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'System',
  },
});
