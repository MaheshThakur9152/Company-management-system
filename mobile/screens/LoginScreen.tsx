
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { User } from '../types';
import { getSites } from '../services/mockData';

interface LoginScreenProps {
    onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<'select' | 'supervisor' | 'boss'>('select');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        const lowerUser = username.toLowerCase().trim();
        const cleanPass = password.trim();

        if (mode === 'boss') {
            if (lowerUser === 'boss' && cleanPass === 'boss') {
                onLogin({
                    userId: 'boss',
                    name: 'Boss User',
                    role: 'boss',
                    email: 'boss@ambeservice.com',
                    assignedSites: []
                });
            } else {
                Alert.alert("Login Failed", "Invalid Boss credentials");
            }
            return;
        }

        if (mode === 'supervisor') {
            // Credential Map
            const siteConfig: Record<string, { id: string, pass: string }> = {
                'minerva9':   { id: 's1', pass: 'minerva123' },
                'minervaho':  { id: 's2', pass: 'minerva123' },
                'royal':      { id: 's3', pass: 'royal123' },
                'ceejay':     { id: 's4', pass: 'ceejay123' },
                'sanjay':     { id: 's5', pass: 'sanjay123' },
                'elara':      { id: 's6', pass: 'elara123' },
                'ajmera':     { id: 's7', pass: 'ajmera123' },
                'acme':       { id: 's8', pass: 'acme123' },
                'shreeya':    { id: 's9', pass: 'shreeya123' },
                'ambeoffice': { id: 's10', pass: 'ambe123' },
                'washroom':   { id: 's11', pass: 'washroom123' },
                'minlo':      { id: 's12', pass: 'minlo123' },
                'palacio':    { id: 's13', pass: 'palacio123' },
                'bpinfra':    { id: 's14', pass: 'bpinfra123' },
                'minsales':   { id: 's15', pass: 'minsales123' },
                'rounder':    { id: 's16', pass: 'rounder123' }
            };

            if (siteConfig[lowerUser]) {
                const config = siteConfig[lowerUser];
                if (cleanPass === config.pass) {
                    const siteId = config.id;
                    let siteName = 'Unknown Site';
                    try {
                        const sites = await getSites();
                        const found = sites.find(s => s.id === siteId);
                        if (found) siteName = found.name;
                    } catch (e) {
                        console.log("Failed to fetch site name", e);
                    }
                    
                    onLogin({
                        userId: `sup-${siteId}`,
                        name: `${siteName} Supervisor`,
                        email: `${lowerUser}@ambeservice.com`,
                        role: 'supervisor',
                        assignedSites: [siteId]
                    });
                } else {
                    Alert.alert("Login Failed", "Invalid Password");
                }
            } else {
                Alert.alert("Login Failed", "Invalid Username");
            }
        }
    };

    if (mode === 'select') {
        return (
            <View style={styles.container}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>AMBE</Text>
                    <Text style={styles.subLogoText}>Service Facility</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.title}>Select App to Login</Text>

                    <TouchableOpacity onPress={() => setMode('supervisor')} style={[styles.button, { backgroundColor: '#FF8C00' }]}>
                        <Text style={styles.buttonText}>Supervisor App</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setMode('boss')} style={[styles.button, { backgroundColor: '#333' }]}>
                        <Text style={styles.buttonText}>Boss / Owner App</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>{mode === 'boss' ? 'Boss Login' : 'Supervisor Login'}</Text>
                
                <Text style={styles.label}>Username</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Enter username" 
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                />

                <Text style={styles.label}>Password</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Enter password" 
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity onPress={handleLogin} style={[styles.button, { backgroundColor: mode === 'boss' ? '#333' : '#FF8C00', marginTop: 10 }]}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { setMode('select'); setUsername(''); setPassword(''); }} style={{ marginTop: 15 }}>
                    <Text style={{ color: '#666', textAlign: 'center' }}>Back to Selection</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5', padding: 20 },
    logoContainer: { marginBottom: 40, alignItems: 'center' },
    logoText: { fontSize: 40, fontWeight: 'bold', color: '#20B2AA', letterSpacing: 2 },
    subLogoText: { fontSize: 16, color: '#666', letterSpacing: 1 },
    card: { width: '100%', backgroundColor: '#fff', padding: 30, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
    button: { padding: 15, borderRadius: 10, marginBottom: 15, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16 },
    label: { fontSize: 12, color: '#666', marginBottom: 5, fontWeight: 'bold', textTransform: 'uppercase' }
});

export default LoginScreen;
