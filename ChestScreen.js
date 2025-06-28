import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import RewardModal from './RewardModal';

const BOOM_SIZE = 220;

export default function ChestScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const reward = route.params?.reward;
  const [stage, setStage] = useState('closed');
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    setStage('closed');
  }, []);

  const handlePress = () => {
    if (stage !== 'closed') return;
    setStage('boom');
    setTimeout(() => {
      setStage('open');
      setTimeout(() => {
        setShowReward(true);
      }, 1000);
    }, 1000);
  };

  const handleRewardClose = () => {
    setShowReward(false);
    navigation.replace('MentalScore');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
        <Animatable.Image
          source={stage === 'open' ? require('./assets/chest-open.png') : require('./assets/chest-closed.png')}
          animation={stage === 'closed' ? 'pulse' : undefined}
          iterationCount={stage === 'closed' ? 'infinite' : 1}
          duration={1500}
          style={styles.image}
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
      <RewardModal visible={showReward} reward={reward} onClose={handleRewardClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
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
    top: '50%',
    left: '50%',
    transform: [{ translateX: -BOOM_SIZE / 2 }, { translateY: -BOOM_SIZE / 2 }],
  },
});
