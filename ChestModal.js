import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, Image, StyleSheet } from 'react-native';

export default function ChestModal({ visible, onComplete }) {
  const [stage, setStage] = useState('closed');

  const handlePress = () => {
    if (stage !== 'closed') return;
    setStage('boom');
    setTimeout(() => {
      setStage('open');
      setTimeout(() => {
        onComplete && onComplete();
      }, 700);
    }, 1000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
          <Image
            source={
              stage === 'open'
                ? require('./assets/chest-open.png')
                : require('./assets/chest-closed.png')
            }
            style={styles.image}
          />
          {stage === 'boom' && (
            <Image
              source={require('./assets/boom.png')}
              style={[styles.image, styles.absolute]}
            />
          )}
        </TouchableOpacity>
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
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});