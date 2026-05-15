import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, TextInput,
    StyleSheet, SafeAreaView, Alert, ActivityIndicator
} from 'react-native';

export function LoginScreen({ onLogin }) {
    const [mode, setMode] = useState('pin'); // 'pin' or 'password'
    const [pin, setPin] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePinPress = (num) => {
        if (pin.length < 6) {
            const newPin = pin + num;
            setPin(newPin);
            // Auto submit if 4-6 digits? Spec says 4-6 + Enter.
        }
    };

    const handleBackspace = () => {
        setPin(pin.slice(0, -1));
    };

    const handleLogin = async () => {
        setLoading(true);
        // Simulate auth for now
        setTimeout(() => {
            setLoading(false);
            if (mode === 'pin') {
                if (pin === '1234') {
                    onLogin({ username: 'Admin', role: 'owner' });
                } else {
                    Alert.alert('Gagal', 'PIN salah');
                    setPin('');
                }
            } else {
                if (username === 'admin' && password === 'admin') {
                    onLogin({ username: 'Admin', role: 'owner' });
                } else {
                    Alert.alert('Gagal', 'Username/Password salah');
                }
            }
        }, 1000);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.storeName}>LING-LING POS</Text>
                <Text style={styles.subtitle}>Selamat Datang</Text>
            </View>

            <View style={styles.card}>
                {mode === 'pin' ? (
                    <View style={styles.pinSection}>
                        <View style={styles.dotsContainer}>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <View 
                                    key={i} 
                                    style={[
                                        styles.dot, 
                                        pin.length >= i && styles.dotActive
                                    ]} 
                                />
                            ))}
                        </View>

                        <View style={styles.grid}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'back'].map((item, idx) => (
                                <TouchableOpacity 
                                    key={idx}
                                    style={styles.gridItem}
                                    onPress={() => {
                                        if (item === 'back') handleBackspace();
                                        else if (item !== '') handlePinPress(item);
                                    }}
                                    disabled={item === ''}
                                >
                                    {item === 'back' ? (
                                        <Text style={styles.gridText}>⌫</Text>
                                    ) : (
                                        <Text style={styles.gridText}>{item}</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity 
                            style={[styles.loginButton, pin.length < 4 && styles.buttonDisabled]} 
                            onPress={handleLogin}
                            disabled={pin.length < 4 || loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>MASUK</Text>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.passwordSection}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput 
                            style={styles.input} 
                            value={username} 
                            onChangeText={setUsername}
                            placeholder="admin"
                            placeholderTextColor="#35577D"
                        />
                        
                        <Text style={styles.label}>Password</Text>
                        <TextInput 
                            style={styles.input} 
                            value={password} 
                            onChangeText={setPassword}
                            secureTextEntry
                            placeholder="••••••"
                            placeholderTextColor="#35577D"
                        />

                        <TouchableOpacity 
                            style={styles.loginButton} 
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>LOGIN</Text>}
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity 
                    style={styles.toggleButton} 
                    onPress={() => setMode(mode === 'pin' ? 'password' : 'pin')}
                >
                    <Text style={styles.toggleText}>
                        {mode === 'pin' ? 'Login sebagai Owner/Manager' : 'Kembali ke Login PIN'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#141E30', justifyContent: 'center', padding: 20 },
    header: { alignItems: 'center', marginBottom: 40 },
    storeName: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2 },
    subtitle: { fontSize: 14, color: '#53D2DC', marginTop: 4, fontWeight: '700', textTransform: 'uppercase' },
    card: { backgroundColor: '#1A2640', borderRadius: 32, padding: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
    pinSection: { alignItems: 'center' },
    dotsContainer: { flexDirection: 'row', gap: 15, marginBottom: 40 },
    dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#35577D' },
    dotActive: { backgroundColor: '#53D2DC', borderColor: '#53D2DC' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', justifyContent: 'center', gap: 15, marginBottom: 30 },
    gridItem: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#141E30', alignItems: 'center', justifyContent: 'center', borderLight: 1, borderColor: '#35577D' },
    gridText: { fontSize: 24, color: '#FFFFFF', fontWeight: '800' },
    passwordSection: { gap: 15 },
    label: { color: '#53D2DC', fontSize: 12, fontWeight: '700', marginBottom: 4 },
    input: { backgroundColor: '#141E30', borderRadius: 16, padding: 16, color: '#FFFFFF', fontSize: 16, borderLight: 1, borderColor: '#35577D' },
    loginButton: { backgroundColor: '#3196E2', width: '100%', padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 10 },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    toggleButton: { marginTop: 20, alignItems: 'center' },
    toggleText: { color: '#35577D', fontSize: 13, fontWeight: '700' }
});
