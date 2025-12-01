import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { User } from '../types';
import { API_URL } from '../services/mockData';
import { Eye, EyeOff } from 'lucide-react-native';

interface LoginScreenProps {
    onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert("Error", "Please enter username and password");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/supervisor/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                onLogin(data);
            } else {
                Alert.alert("Login Failed", data.error || "Invalid credentials");
            }
        } catch (error) {
            console.error("Login Error:", error);
            Alert.alert("Connection Error", "Could not connect to server. Please check your internet connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.container}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoText}>AMBE</Text>
                        <Text style={styles.subLogoText}>Supervisor App</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.title}>Supervisor Login</Text>

                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter username"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />

                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Enter password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity 
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeIcon}
                            >
                                {showPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                            onPress={handleLogin} 
                            style={[styles.button, { backgroundColor: '#FF8C00', marginTop: 10, opacity: loading ? 0.7 : 1 }]}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Login</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1 },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5', padding: 20 },
    logoContainer: { marginBottom: 40, alignItems: 'center' },
    logoText: { fontSize: 40, fontWeight: 'bold', color: '#20B2AA', letterSpacing: 2 },
    subLogoText: { fontSize: 16, color: '#666', letterSpacing: 1 },
    card: { width: '100%', backgroundColor: '#fff', padding: 30, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
    button: { padding: 15, borderRadius: 10, marginBottom: 15, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16 },
    label: { fontSize: 12, color: '#666', marginBottom: 5, fontWeight: 'bold', textTransform: 'uppercase' },
    passwordContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: '#ddd', 
        borderRadius: 8, 
        marginBottom: 15 
    },
    passwordInput: { 
        flex: 1, 
        padding: 12, 
        fontSize: 16 
    },
    eyeIcon: { 
        padding: 12 
    }
});

export default LoginScreen;
