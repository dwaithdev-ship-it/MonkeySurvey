import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Placeholder Screens (will be implemented next)
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/main/DashboardScreen';
import SurveyListScreen from '../screens/main/SurveyListScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    const { user } = useSelector((state) => state.auth);
    const isAdmin = user?.role === 'admin';

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    if (route.name === 'Dashboard' || route.name === 'Survey Form') iconName = 'poll';
                    else if (route.name === 'Surveys') iconName = 'view-list';
                    else if (route.name === 'Profile') iconName = 'account';
                    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                },
            })}
        >
            {isAdmin ? (
                <>
                    <Tab.Screen name="Dashboard" component={DashboardScreen} />
                    <Tab.Screen name="Surveys" component={SurveyListScreen} />
                </>
            ) : (
                <Tab.Screen name="Survey Form" component={DashboardScreen} />
            )}
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    const { isAuthenticated } = useSelector((state) => state.auth);

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </>
            ) : (
                <Stack.Screen name="Main" component={MainTabNavigator} />
            )}
        </Stack.Navigator>
    );
};

export default AppNavigator;
