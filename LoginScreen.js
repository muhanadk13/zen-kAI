import React, { useState, useEffect } from 'react';
import { TextInput, View, StyleSheet, Text } from 'react-native';
import { Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  console.log("🟢 LoginScreen rendered");

  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    console.log("✅ LoginScreen useEffect hit");
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch('http://192.168.0.87:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        console.error("Login failed");
        return;
      }

      const data = await res.json();
      await AsyncStorage.setItem('token', data.token);
      console.log("✅ Token saved!", data.token);

      // Go to main app after successful login
      navigation.reset({ index: 0, routes: [{ name: 'MentalScore' }] });
    } catch (err) {
      console.error("❌ Login error:", err);
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
      <Button mode="contained" onPress={handleLogin}>
        Log In
      </Button>
      <Text style={styles.footer}>LOGIN SCREEN</Text>
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
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
  },
});
