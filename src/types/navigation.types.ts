/**
 * Types pour React Navigation
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Main Stack (aprĂšs authentification)
export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabsParamList>;
  ProgramGenerator: undefined;
  ProgramDisplay: { programId: string };
  WorkoutTracking: { programId?: string; sessionId?: string };
  WorkoutDetail: { workoutId: string };
  EditProfile: undefined;
};

// Bottom Tabs
export type MainTabsParamList = {
  Home: undefined;
  MyProgram: undefined;
  Tracking: undefined;
  Nutrition: undefined;
  Profile: undefined;
};

// Root Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

// Types pour les props des screens
export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  StackScreenProps<AuthStackParamList, T>;

export type MainStackScreenProps<T extends keyof MainStackParamList> =
  StackScreenProps<MainStackParamList, T>;

export type MainTabsScreenProps<T extends keyof MainTabsParamList> =
  BottomTabScreenProps<MainTabsParamList, T>;

// Helper pour obtenir les props de navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}