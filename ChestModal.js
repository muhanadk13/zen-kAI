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

const BOOM_SIZE = Math.min(Dimensions.get('window').width, Dimensions.get('window').height) * 0.9;

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
              style={[styles.image, stage === 'open' && styles.openGlow]}
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
  openGlow: {
    shadowColor: '#FFD700',
    shadowOpacity: 0.9,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
