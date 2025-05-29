import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ProgressBar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MentalScoreScreen() {
  const navigation = useNavigation();

  const getCheckInWindow = () => {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 6 && hour < 12) return 'checkIn1';
    if (hour >= 12 && hour < 17) return 'checkIn2';
    return 'checkIn3';
  };

  const handleCheckInPress = async () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const window = getCheckInWindow();
    const key = `${today}-${window}`;
    const existing = await AsyncStorage.getItem(key);

    if (!existing) {
      navigation.navigate('CheckIn', { window });
    } else {
      Alert.alert('Already Checked In', 'You already completed this check-in.');
    }
  };

  const resetCheckIn3 = async () => {
    const today = new Date().toISOString().split('T')[0];
    const key = `${today}-checkIn3`;
    await AsyncStorage.removeItem(key);
    Alert.alert('✅ Reset Complete', 'Check-In 3 has been cleared for testing.');
  };

  const devLaunchCheckIn3 = () => {
    navigation.navigate('CheckIn', { window: 'checkIn3' });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleCheckInPress}>
          <Text style={styles.headerButton}>Check In</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.gaugeContainer}>
        <Image
          source={require('./assets/gauge.png')}
          style={styles.gaugeImage}
          resizeMode="contain"
        />
        <Text style={styles.mentalScore}>89</Text>
        <Text style={styles.mentalScoreLabel}>MentalScore</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={require('./assets/calendar.webp')} style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Weekly Insight</Text>
        </View>
        <Text style={styles.cardText}>
          Here’s what I noticed from your check-in:
          {'\n'}• High Energy + Cloudy Mind = Mental clutter
          {'\n'}• Emotional Score: 6/8 — Positive, but not peaking
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image source={require('./assets/advice.png')} style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Advice</Text>
        </View>
        <Text style={styles.cardText}>
          You start strong. Midweek dips.
          {'\n\n'}
          <Text style={styles.bold}>Next Step</Text>
          {'\n'}Try: Heavy tasks → Mon/Tue.
          {'\n'}Light plan → Wed.
        </Text>
      </View>

      <View style={styles.metricsSection}>
        <View style={styles.row}>
          <View style={[styles.metricBox, styles.metricBoxLeft]}>
            <Text style={styles.metricLabel}>⚡ Energy 48%</Text>
            <ProgressBar progress={0.48} color="#C3B1E1" style={styles.bar} />
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>💡 Clarity 63%</Text>
            <ProgressBar progress={0.63} color="#f5c065" style={styles.bar} />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.metricBox, styles.metricBoxLeft]}>
            <Text style={styles.metricLabel}>💚 Emotion 98%</Text>
            <ProgressBar progress={0.98} color="#7fe87a" style={styles.bar} />
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>🎯 Focus 72%</Text>
            <ProgressBar progress={0.72} color="#60a5fa" style={styles.bar} />
          </View>
        </View>
      </View>

      {/* Developer Buttons */}
      <View style={styles.resetContainer}>
        <TouchableOpacity onPress={resetCheckIn3} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Reset Check-In 3 (Dev)</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={devLaunchCheckIn3} style={[styles.resetButton, { marginTop: 12, backgroundColor: '#3b82f6' }]}>
          <Text style={styles.resetButtonText}>Open Check-In 3 (Dev)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: -20,
    paddingHorizontal: 24,
    backgroundColor: '#f8f8f8',
    paddingBottom: 40,
  },
  headerButton: {
    marginRight: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  gaugeImage: {
    width: 360,
    height: 240,
  },
  mentalScore: {
    position: 'absolute',
    top: '38%',
    fontSize: 48,
    fontWeight: '700',
    color: '#000',
    marginTop: 30,
  },
  mentalScoreLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#555',
    marginTop: -70,
  },
  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardIcon: {
    width: 22,
    height: 22,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  cardText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    color: '#333',
    marginTop: 2,
  },
  bold: {
    fontWeight: '600',
    color: '#000',
  },
  metricsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricBox: {
    flex: 1,
  },
  metricBoxLeft: {
    marginRight: 12,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  bar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
  },
  resetContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  resetButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
