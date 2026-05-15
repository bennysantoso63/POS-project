import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import { LoginScreen }         from '../screens/auth/LoginScreen';
import { DeploymentModeScreen } from '../screens/auth/DeploymentModeScreen';
import { KasirScreen }         from '../screens/kasir/KasirScreen';
import { SetupWizardScreen, DashboardScreen, InventoryScreen, SettingsScreen } from '../screens/Placeholders';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

function MainTabs({ currentUser }) {
    const isOwner   = currentUser?.role === 'owner';
    const isManager = ['owner','manager'].includes(currentUser?.role);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown   : false,
                tabBarStyle   : {
                    backgroundColor: '#141E30',
                    borderTopColor : '#35577D',
                    height         : 60,
                    paddingBottom  : 8,
                },
                tabBarActiveTintColor  : '#53D2DC',
                tabBarInactiveTintColor: '#35577D',
            }}
        >
            <Tab.Screen
                name="Kasir"
                component={KasirScreen}
                options={{ tabBarIcon: () => null }}
            />
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ tabBarIcon: () => null }}
            />
            {isManager && (
                <Tab.Screen
                    name="Inventaris"
                    component={InventoryScreen}
                    options={{ tabBarIcon: () => null }}
                />
            )}
            <Tab.Screen
                name="Pengaturan"
                component={SettingsScreen}
                options={{ tabBarIcon: () => null }}
            />
        </Tab.Navigator>
    );
}

export function AppNavigator({ currentUser, deploymentMode }) {
    const isLoggedIn = !!currentUser;
    const hasModeSelected = deploymentMode !== null;

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!hasModeSelected ? (
                    <Stack.Screen name="DeploymentMode" component={DeploymentModeScreen} />
                ) : !isLoggedIn ? (
                    <>
                        <Stack.Screen name="Login"  component={LoginScreen} />
                        <Stack.Screen name="Setup"  component={SetupWizardScreen} />
                    </>
                ) : (
                    <Stack.Screen name="Main">
                        {() => <MainTabs currentUser={currentUser} />}
                    </Stack.Screen>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
