/**
 * Types liĂ©s Ă  l'utilisateur et son profil
 */

export interface User {
  id: string;
  email: string;
  roles: string[];
  createdAt?: string;
}

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  weight: number; // en kg
  height: number; // en cm
  age: number;
  goal: Goal;
  activityLevel: ActivityLevel;
  dailyCalorieTarget?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type Goal = 'bulk' | 'cut' | 'maintain' | 'strength';

export type ActivityLevel = 1 | 2 | 3 | 4 | 5;

// Labels pour l'affichage UI
export const GoalLabels: Record<Goal, string> = {
  bulk: 'Prise de masse',
  cut: 'SĂšche / Perte de poids',
  maintain: 'Maintien / Tonification',
  strength: 'Gain de force',
};

export const ActivityLevelLabels: Record<ActivityLevel, string> = {
  1: 'SĂ©dentaire (peu ou pas d\'exercice)',
  2: 'LĂ©gĂšrement actif (1-3 jours/semaine)',
  3: 'ModĂ©rĂ©ment actif (3-5 jours/semaine)',
  4: 'TrĂšs actif (6-7 jours/semaine)',
  5: 'ExtrĂȘmement actif (sport intense quotidien)',
};

// DTOs pour les requĂȘtes API
export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ProfileUpdateDto {
  fullName?: string;
  weight?: number;
  height?: number;
  age?: number;
  goal?: Goal;
  activityLevel?: ActivityLevel;
}