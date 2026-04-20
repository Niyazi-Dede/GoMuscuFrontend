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

const TAB_ICONS: Record<keyof MainTabsParamList, [string, string]> = {
  Home: ['home', 'home-outline'],
  MyProgram: ['barbell', 'barbell-outline'],
  Tracking: ['stats-chart', 'stats-chart-outline'],
  Nutrition: ['nutrition', 'nutrition-outline'],
  Profile: ['person', 'person-outline'],
};

function TabIcon({ routeName, focused }: { routeName: keyof MainTabsParamList; focused: boolean }) {
  const [active, inactive] = TAB_ICONS[routeName];
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons
        name={(focused ? active : inactive) as keyof typeof Ionicons.glyphMap}
        size={22}
        color={focused ? '#FFFFFF' : DarkColors.textSecondary}
      />
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: DarkColors.primaryLight,
        tabBarInactiveTintColor: DarkColors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused }) => (
          <TabIcon routeName={route.name} focused={focused} />
        ),
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
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 18,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(31, 41, 55, 0.96)',
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.22)',
    paddingBottom: 10,
    paddingTop: 10,
    paddingHorizontal: 6,
    elevation: 18,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  tabItem: {
    paddingTop: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  iconWrap: {
    width: 46,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: DarkColors.primary,
    shadowColor: DarkColors.primary,
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
});
