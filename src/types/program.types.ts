/**
 * Types liĂ©s aux programmes d'entraĂźnement
 */

export interface Program {
  id: string;
  userId: string;
  title: string;
  description: string;
  content: ProgramContent;
  durationWeeks: number;
  sessionsPerWeek: number;
  generatedAt: string;
  createdAt?: string;
}

export interface ProgramContent {
  weeks: Week[];
  tips: string[];
}

export interface Week {
  weekNumber: number;
  sessions: Session[];
}

export interface Session {
  day: string; // Ex: "Lundi", "Mardi", etc.
  focus: string; // Ex: "Pecs / Triceps"
  exercises: ExerciseDetail[];
}

export interface ExerciseDetail {
  name: string;
  sets: number;
  reps: string; // Ex: "8-10", "12-15", "max"
  rest: string; // Ex: "90s", "2min"
  notes?: string;
}

// Input pour la gĂ©nĂ©ration de programme
export interface ProgramGeneratorInput {
  goal: ProgramGoal;
  experienceLevel: ExperienceLevel;
  sessionsPerWeek: SessionsPerWeek;
  programDuration: ProgramDuration;
  sessionDuration: SessionDuration;
  equipment: Equipment;
}

export type ProgramGoal = 'bulk' | 'cut' | 'maintain' | 'strength';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type SessionsPerWeek = 3 | 4 | 5 | 6;

export type ProgramDuration = 4 | 8 | 12; // en semaines

export type SessionDuration = 45 | 60 | 90; // en minutes

export type Equipment = 'full_gym' | 'home_gym' | 'bodyweight';

// Labels pour l'affichage UI
export const ExperienceLevelLabels: Record<ExperienceLevel, string> = {
  beginner: 'DĂ©butant (< 6 mois)',
  intermediate: 'IntermĂ©diaire (6 mois - 2 ans)',
  advanced: 'AvancĂ© (> 2 ans)',
};

export const EquipmentLabels: Record<Equipment, string> = {
  full_gym: 'Salle de sport complĂšte',
  home_gym: 'Home gym (haltĂšres, barre, banc)',
  bodyweight: 'Poids du corps uniquement',
};

export const SessionDurationLabels: Record<SessionDuration, string> = {
  45: '45 minutes',
  60: '60 minutes',
  90: '90 minutes',
};