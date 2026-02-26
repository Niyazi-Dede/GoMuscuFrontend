/**
 * Types liĂ©s aux exercices
 */

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  description: string;
  difficulty: Difficulty;
  videoUrl?: string;
  imageUrl?: string;
  createdAt?: string;
}

export type MuscleGroup = 
  | 'chest'      // Pectoraux
  | 'back'       // Dos
  | 'shoulders'  // Épaules
  | 'biceps'     // Biceps
  | 'triceps'    // Triceps
  | 'legs'       // Jambes
  | 'abs'        // Abdominaux
  | 'glutes'     // FessiersRÚgles
  | 'cardio'     // Cardio
  | 'fullbody';  // Corps entier

export type Difficulty = 'easy' | 'medium' | 'hard';

// Labels pour l'affichage UI
export const MuscleGroupLabels: Record<MuscleGroup, string> = {
  chest: 'Pectoraux',
  back: 'Dos',
  shoulders: 'Épaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Jambes',
  abs: 'Abdominaux',
  glutes: 'Fessiers',
  cardio: 'Cardio',
  fullbody: 'Corps entier',
};

export const DifficultyLabels: Record<Difficulty, string> = {
  easy: 'Facile',
  medium: 'IntermĂ©diaire',
  hard: 'Difficile',
};

export const DifficultyColors: Record<Difficulty, string> = {
  easy: '#34C759',    // Vert
  medium: '#FF9500',  // Orange
  hard: '#FF3B30',    // Rouge
};