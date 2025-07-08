import { TextInput } from 'react-native';
import React, {useState} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import { Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        const res = await fetch('http://192.168.0.87:4000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', 
            },
            body: JSON.stringify({ email, password }) 
        })

        if (!res.ok) {
            console.error("Login failed");
            return;
        }
        const data =  await res.json();
        await AsyncStorage.setItem('token', data.token);
        console.log("Token saved! ", data.token)
    };

    return (
        <View>
            <Text>Welcome to zen-kAI</Text>
            <TextInput onChangeText={setEmail}></TextInput>
            <TextInput onChangeText={setPassword}></TextInput>
            <Button onPress={handleLogin}></Button>
        </View>



    )
}


