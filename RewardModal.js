import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';

export default function RewardModal({ visible, reward, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animatable.View animation="zoomIn" duration={400} style={styles.container}>
          <LinearGradient
            colors={["#646DFF", "#D7A4FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.inner}>
              <Text style={styles.title}>Reward Unlocked!</Text>
              <Text style={styles.reward}>{reward}</Text>
              <TouchableOpacity style={styles.button} onPress={onClose}>
                <Text style={styles.buttonText}>Awesome!</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animatable.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    padding: 2,
    borderRadius: 24,
  },
  inner: {
    backgroundColor: '#1C1E29',
    padding: 24,
    borderRadius: 22,
    alignItems: 'center',
    width: 280,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  reward: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B48DFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
