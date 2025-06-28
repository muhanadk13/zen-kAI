import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

const BOOM_SIZE = 220; // Match the chest image dimensions

export default function ChestModal({ visible, onComplete }) {
  const [stage, setStage] = useState('closed');

  useEffect(() => {
    if (visible) {
      setStage('closed');
    }
  }, [visible]);

  const handlePress = () => {
    if (stage !== 'closed') return;
    setStage('boom');
    setTimeout(() => {
      setStage('open');
      setTimeout(() => {
        onComplete && onComplete();
      }, 1000);
    }, 1000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
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
              style={[styles.image, stage === 'open']}
            />
            {stage === 'boom' && (
              <Animatable.Image
                source={require('./assets/boom.png')}
                animation="zoomIn"
                duration={300}
                style={[styles.boom, styles.absolute]}
              />
            )}
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
  },
  boom: {
    width: BOOM_SIZE,
    height: BOOM_SIZE,
    resizeMode: 'contain',
  },

  absolute: {
    position: 'absolute',
    top: '50%', // Center vertically
    left: '50%', // Center horizontally
    transform: [
      { translateX: -BOOM_SIZE / 2 }, // Adjust horizontal position
      { translateY: -BOOM_SIZE / 2 }, // Adjust vertical position
    ],
  },
});
