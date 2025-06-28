import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

export default function ChestModal({ visible, onComplete }) {
  const [stage, setStage] = useState('closed');

  useEffect(() => {
    if (visible) {
      setStage('closed');
    }
  }, [visible]);

  const handlePress = () => {
    if (stage !== 'closed') return;
    setTimeout(() => {
      setStage('open');
      setTimeout(() => {
        onComplete && onComplete();
      }, 1000);
    }, 1000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <LinearGradient
        colors={['#1C1F2E', '#12131C']}
        style={styles.overlay}
      >
        <Animatable.View animation="zoomIn" duration={500}>
          <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
            <Animatable.Image
              source={
                stage === 'open'
                  ? require('./assets/chest-open.png')
                  : require('./assets/chest-closed.png')
              }
              animation={stage === 'closed' ? 'pulse' : undefined}
              iterationCount={stage === 'closed' ? 'infinite' : 1}
              duration={1500}
              style={styles.image}
            />
          </TouchableOpacity>
        </Animatable.View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 240,
    height: 240,
    resizeMode: 'contain',
  },
});
