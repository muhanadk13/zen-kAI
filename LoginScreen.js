import React, { useState } from 'react';
import { TextInput, View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'https://zen-kai-production.up.railway.app';

export default function LoginScreen() {
  console.log("🟢 LoginScreen rendered");

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
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to zen-kAI</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        value={email}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button mode="contained" onPress={handleAuth} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : isSignup ? (
          'Sign Up'
        ) : (
          'Log In'
        )}
      </Button>
      <TouchableOpacity onPress={() => { setError(''); setIsSignup(!isSignup); }}>
        <Text style={{ marginTop: 12, color: '#007aff', textAlign: 'center' }}>
          {isSignup ? 'Have an account? Log in' : "Don't have an account? Sign up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
  },
  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
});
