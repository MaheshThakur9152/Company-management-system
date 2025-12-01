import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { Eye, EyeOff, Wifi, Settings } from 'lucide-react-native';
import { User } from '../types';
import { loginUser, loginSupervisor, checkBackendConnection, setApiUrl, getCurrentApiUrl } from '../services/mockData';

interface LoginScreenProps {
    onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkingConnection, setCheckingConnection] = useState(false);

    // Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [serverUrl, setServerUrl] = useState('');

    useEffect(() => {
        setServerUrl(getCurrentApiUrl());
    }, []);

    const handleCheckConnection = async () => {
        setCheckingConnection(true);
        const isConnected = await checkBackendConnection();
        setCheckingConnection(false);

        if (isConnected) {
            Alert.alert("Success", "Backend is reachable!");
        } else {
            Alert.alert("Failed", `Cannot connect to backend at:\n${getCurrentApiUrl()}\n\nCheck your network or IP settings.`);
        }
    };

    const handleSaveSettings = () => {
        setApiUrl(serverUrl);
        setShowSettings(false);
        Alert.alert("Settings Saved", "Server URL updated successfully. Please try connecting again.");
    };

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert("Error", "Please enter username and password");
            return;
        }

        setLoading(true);
        try {
            let loginSuccess = false;

            // Try Boss/Admin Login first
            try {
                const user = await loginUser(username, password);
                if (user && (user.role === 'boss' || user.role === 'admin')) {
                    onLogin(user);
                    loginSuccess = true;
                    return;
                }
            } catch (e: any) {
                console.log('Boss login failed:', e.message);
                if (e.message && (e.message.includes('Network request failed') || e.message.includes('Failed to fetch'))) {
                    throw e; // Re-throw network errors to be caught by outer catch
                }
            }

            // Try Supervisor Login
            if (!loginSuccess) {
                try {
                    const supervisor = await loginSupervisor(username, password);
                    if (supervisor) {
                        onLogin(supervisor);
                        loginSuccess = true;
                        return;
                    }
                } catch (e: any) {
                    console.log('Supervisor login failed:', e.message);
                    if (e.message && (e.message.includes('Network request failed') || e.message.includes('Failed to fetch'))) {
                        throw e; // Re-throw network errors
                    }
                }
            }

            Alert.alert("Login Failed", "Invalid credentials. Please check your username and password.");
        } catch (error: any) {
            console.error("Login Error:", error);
            const errorMessage = error.message || "Unknown error";
            if (errorMessage.includes('Network request failed') || errorMessage.includes('Failed to fetch') || errorMessage.includes('API Error')) {
                Alert.alert("Connection Error", `Could not connect to server at:\n${getCurrentApiUrl()}\n\n1. Ensure Backend is running.\n2. Check your network.\n3. Update Server URL in Settings.`);
            } else {
                Alert.alert("Error", "An unexpected error occurred during login: " + errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Text style={styles.logoText}>AMBE</Text>
                <Text style={styles.subLogoText}>Management App</Text>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.title}>Login</Text>
                    <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsIcon}>
                        <Settings size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Username / Email</Text>
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
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                        {showPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={handleLogin}
                    style={[styles.button, { backgroundColor: '#333', marginTop: 10 }]}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Login</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleCheckConnection}
                    style={styles.connectionButton}
                    disabled={checkingConnection}
                >
                    {checkingConnection ? (
                        <ActivityIndicator size="small" color="#20B2AA" />
                    ) : (
                        <>
                            <Wifi size={16} color="#20B2AA" />
                            <Text style={styles.connectionText}>Check Server Connection</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Settings Modal */}
            <Modal visible={showSettings} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Server Settings</Text>

                        <Text style={styles.label}>Backend URL</Text>
                        <TextInput
                            style={styles.input}
                            value={serverUrl}
                            onChangeText={setServerUrl}
                            autoCapitalize="none"
                            placeholder="http://192.168.x.x:3000/api"
                        />
                        <Text style={styles.hintText}>
                            Default: http://192.168.1.96:3000/api (Physical Device){'\n'}
                            Emulator: http://10.0.2.2:3000/api
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setShowSettings(false)} style={[styles.button, styles.cancelButton]}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveSettings} style={[styles.button, styles.saveButton]}>
                                <Text style={styles.buttonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5', padding: 20 },
    logoContainer: { marginBottom: 40, alignItems: 'center' },
    logoText: { fontSize: 40, fontWeight: 'bold', color: '#20B2AA', letterSpacing: 2 },
    subLogoText: { fontSize: 16, color: '#666', letterSpacing: 1 },
    card: { width: '100%', backgroundColor: '#fff', padding: 30, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    cardHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20, position: 'relative' },
    title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    settingsIcon: { position: 'absolute', right: 0 },
    button: { padding: 15, borderRadius: 10, marginBottom: 15, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16 },
    label: { fontSize: 12, color: '#666', marginBottom: 5, fontWeight: 'bold', textTransform: 'uppercase' },
    passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 15 },
    passwordInput: { flex: 1, padding: 12, fontSize: 16 },
    eyeIcon: { padding: 12 },
    connectionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, gap: 8 },
    connectionText: { color: '#20B2AA', fontSize: 14, fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', width: '100%', padding: 25, borderRadius: 20, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
    hintText: { fontSize: 12, color: '#999', marginBottom: 20, lineHeight: 18 },
    modalButtons: { flexDirection: 'row', gap: 10 },
    cancelButton: { flex: 1, backgroundColor: '#999', marginBottom: 0 },
    saveButton: { flex: 1, backgroundColor: '#20B2AA', marginBottom: 0 }
});

export default LoginScreen;
