import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

export default function ChestScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const rewardFromRoute = route.params?.reward;
  const [stage, setStage] = useState('closed');
  const [showReward, setShowReward] = useState(false);
  const [selectedReward, setSelectedReward] = useState('');

  const fakeRewards = [
    '🎰 Jackpot XP Boost',
    '🎯 Laser Focus Bonus',
    '🔥 Super Insight',
    '💎 Golden Reflection',
    '🎁 Mystery Reward',
    '💡 Clarity Surge',
    '💥 Streak Freeze Token',
    '🚀 Momentum Blast',
    '👀 Try Again...',
  ];

  useEffect(() => {
    setStage('closed');
    const randomReward =
      rewardFromRoute ||
      fakeRewards[Math.floor(Math.random() * fakeRewards.length)];
    setSelectedReward(randomReward);
  }, []);

  const handlePress = () => {
    if (stage !== 'closed') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setStage('boom');

    setTimeout(() => {
      setStage('open');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        setShowReward(true);
      }, 1200);
    }, 1200);
  };

  const handleRewardClose = () => {
    setShowReward(false);
    navigation.replace('MentalScore');
  };

  return (
    <LinearGradient
      colors={['#100C28', '#24113C']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* 🎆 Casino Lights */}
      {stage !== 'closed' && (
        <LottieView
          source={require('./assets/GIF/particles.json')}
          autoPlay
          loop
          style={styles.particles}
        />
      )}

      <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
        <Animatable.Image
          source={
            stage === 'open'
              ? require('./assets/chest-open.png')
              : require('./assets/chest-closed.png')
          }
          animation={
            stage === 'closed'
              ? 'pulse'
              : stage === 'boom'
              ? 'zoomOut'
              : 'bounceIn'
          }
          iterationCount={stage === 'closed' ? 'infinite' : 1}
          duration={stage === 'boom' ? 600 : 1500}
          style={[
            styles.image,
            stage === 'open' && { transform: [{ scale: 1.15 }] },
          ]}
        />
      </TouchableOpacity>

      {/* 💥 Light Burst */}
      {stage === 'open' && (
        <Animatable.View
          animation="zoomIn"
          duration={600}
          style={styles.lightBurst}
        />
      )}

      {/* 🎉 Reward Modal */}
      {showReward && (
        <Animatable.View
          animation="zoomInUp"
          duration={600}
          style={styles.rewardBox}
        >
          <LinearGradient
            colors={['#FDE68A', '#FCA5A5', '#FECACA']}
            style={styles.rewardGradient}
          >
            <Text style={styles.rewardTitle}>🎉 Reward Unlocked!</Text>
            <Text style={styles.reward}>{selectedReward}</Text>
            <TouchableOpacity
              onPress={handleRewardClose}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Awesome!</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animatable.View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particles: {
    position: 'absolute',
    width: width * 1.8,
    height: width * 1.8,
    zIndex: -1,
  },
  image: {
    width: width * 0.55,
    height: width * 0.55,
    resizeMode: 'contain',
  },
  lightBurst: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: width * 0.6,
    zIndex: -2,
  },
  rewardBox: {
    position: 'absolute',
    bottom: 100,
    width: width * 0.8,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    alignItems: 'center',
  },
  rewardGradient: {
    padding: 24,
    borderRadius: 26,
    width: '100%',
    alignItems: 'center',
  },
  rewardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1f2937',
    marginBottom: 8,
  },
  reward: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 18,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
