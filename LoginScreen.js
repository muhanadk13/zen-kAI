import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';

const API_URL = 'https://zen-kai-production.up.railway.app';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  const validate = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (isSignup && password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleAuth = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const endpoint = isSignup ? 'signup' : 'login';
      const res = await fetch(`${API_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      if (res.status === 401) {
        setError('Invalid email or password');
        return;
      }
      if (res.status === 409) {
        setError('Email already in use');
        return;
      }
      if (!res.ok) {
        setError('Server error, try again');
        return;
      }

      const data = await res.json();
      await AsyncStorage.setItem('token', data.token);
      navigation.reset({ index: 0, routes: [{ name: 'MentalScore' }] });
    } catch (err) {
      setError('Server error, try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1C1F2E', '#12131C']} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          <Image
            source={require('./assets/logo-text-only.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Animatable.View animation="fadeInUp" duration={600} style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#A0A5B9"
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={setEmail}
              value={email}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#A0A5B9"
              secureTextEntry
              onChangeText={setPassword}
              value={password}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.button}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{isSignup ? 'Sign Up' : 'Log In'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setError('');
                setIsSignup(!isSignup);
              }}
            >
              <Text style={styles.toggleText}>
                {isSignup ? 'Have an account? Log in' : "Don't have an account? Sign up"}
              </Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: '100%',
    height: 100,
    alignSelf: 'center',
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#1C1E29',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  input: {
    backgroundColor: '#2E3340',
    color: '#fff',
    padding: 14,
    marginBottom: 14,
    borderRadius: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#646DFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  toggleText: {
    color: '#A0A5B9',
    marginTop: 18,
    textAlign: 'center',
    fontSize: 14,
  },
  error: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 10,
  },
});
