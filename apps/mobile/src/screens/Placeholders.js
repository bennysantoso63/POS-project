import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function SetupWizardScreen() {
    return <View style={styles.container}><Text style={styles.text}>Setup Wizard Placeholder</Text></View>;
}

export function DashboardScreen() {
    return <View style={styles.container}><Text style={styles.text}>Dashboard Placeholder</Text></View>;
}

export function InventoryScreen() {
    return <View style={styles.container}><Text style={styles.text}>Inventory Placeholder</Text></View>;
}

export function SettingsScreen() {
    return <View style={styles.container}><Text style={styles.text}>Settings Placeholder</Text></View>;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#141E30', alignItems: 'center', justifyContent: 'center' },
    text: { color: '#53D2DC', fontWeight: '800' }
});
