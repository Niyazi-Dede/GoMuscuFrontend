import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList, MainTabsParamList } from '../types';
import { DarkColors } from '../constants/colors';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ProgramGeneratorScreen from '../screens/program/ProgramGeneratorScreen';
import MyProgramScreen from '../screens/program/MyProgramScreen';
import ProgramDisplayScreen from '../screens/program/ProgramDisplayScreen';
import WorkoutHistoryScreen from '../screens/tracking/WorkoutHistoryScreen';
import WorkoutTrackingScreen from '../screens/tracking/WorkoutTrackingScreen';
import WorkoutDetailScreen from '../screens/tracking/WorkoutDetailScreen';
import NutritionScreen from '../screens/nutrition/NutritionScreen';
import HomeScreen from '../screens/home/HomeScreen';

const Stack = createStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<MainTabsParamList>();

// Placeholder screens pour les futurs tickets
function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{title}</Text>
      <Text style={styles.placeholderSub}>À venir</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: DarkColors.primary,
        tabBarInactiveTintColor: DarkColors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<keyof MainTabsParamList, [string, string]> = {
            Home: ['home', 'home-outline'],
            MyProgram: ['barbell', 'barbell-outline'],
            Tracking: ['stats-chart', 'stats-chart-outline'],
            Nutrition: ['nutrition', 'nutrition-outline'],
            Profile: ['person', 'person-outline'],
          };
          const [active, inactive] = icons[route.name];
          return (
            <Ionicons
              name={(focused ? active : inactive) as keyof typeof Ionicons.glyphMap}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil' }} />
      <Tab.Screen name="MyProgram" component={MyProgramScreen} options={{ title: 'Programme' }} />
      <Tab.Screen name="Tracking" component={WorkoutHistoryScreen} options={{ title: 'Suivi' }} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} options={{ title: 'Nutrition' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="ProgramGenerator" component={ProgramGeneratorScreen} />
      <Stack.Screen name="ProgramDisplay" component={ProgramDisplayScreen} />
      <Stack.Screen name="WorkoutTracking" component={WorkoutTrackingScreen} />
      <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: DarkColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: DarkColors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  placeholderSub: {
    color: DarkColors.textSecondary,
    fontSize: 15,
  },
  tabBar: {
    backgroundColor: DarkColors.card,
    borderTopColor: DarkColors.divider,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
