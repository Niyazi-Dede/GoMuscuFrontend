/**
 * Types lies aux programmes d'entrainement
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
  sessions?: Session[];
  weeks?: Week[];
  tips: string[];
  selectionGuidance?: string;
  changeGuidance?: string;
}

export interface Week {
  weekNumber: number;
  sessions: Session[];
}

export interface Session {
  id?: string;
  dayOfWeek?: WeekDay;
  day: string;
  focus: string;
  recommended?: boolean;
  recommendationReason?: string;
  exercises: ExerciseDetail[];
}

export type WeekDay =
  | 'lundi'
  | 'mardi'
  | 'mercredi'
  | 'jeudi'
  | 'vendredi'
  | 'samedi'
  | 'dimanche';

export const WEEK_DAYS_ORDER: WeekDay[] = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
];

export const WeekDayLabels: Record<WeekDay, string> = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
  samedi: 'Samedi',
  dimanche: 'Dimanche',
};

export interface ExerciseDetail {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

// Input pour la generation de programme
export interface ProgramGeneratorInput {
  goal: ProgramGoal;
  experienceLevel: ExperienceLevel;
  sessionsPerWeek: SessionsPerWeek;
  sessionDuration: SessionDuration;
  equipment: Equipment;
  programDuration?: ProgramDuration;
}

export type ProgramGoal = 'bulk' | 'cut' | 'maintain' | 'strength' | 'calisthenics';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type SessionsPerWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ProgramDuration = 26 | 39 | 52;

export type SessionDuration = 45 | 60 | 90;

export type Equipment = 'full_gym' | 'home_gym' | 'bodyweight';

export const ExperienceLevelLabels: Record<ExperienceLevel, string> = {
  beginner: 'Debutant (< 6 mois)',
  intermediate: 'Intermediaire (6 mois - 2 ans)',
  advanced: 'Avance (> 2 ans)',
};

export const EquipmentLabels: Record<Equipment, string> = {
  full_gym: 'Salle de sport complete',
  home_gym: 'Home gym (halteres, barre, banc)',
  bodyweight: 'Poids du corps uniquement',
};

export const SessionDurationLabels: Record<SessionDuration, string> = {
  45: '45 minutes',
  60: '60 minutes',
  90: '90 minutes',
};
