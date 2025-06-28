import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import RewardModal from './RewardModal';

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
    <LinearGradient
      colors={['#1C1F2E', '#12131C']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
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

      <RewardModal visible={showReward} reward={reward} onClose={handleRewardClose} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
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
