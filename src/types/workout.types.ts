/**
 * Types liĂ©s au suivi des entraĂźnements
 */

export interface Workout {
  id: string;
  userId: string;
  programId?: string;
  date: string; // Format ISO 8601
  completed: boolean;
  notes?: string;
  exercises: WorkoutExercise[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  exercise?: {
    id: string;
    name: string;
    muscleGroup: string;
  };
  sets: number;
  reps: number | string; // Peut ĂȘtre un nombre ou "max", "8-10", etc.
  weight?: number; // en kg
  completed: boolean;
  notes?: string;
}

// DTO pour crĂ©er un workout
export interface WorkoutCreateDto {
  programId?: string;
  date?: string; // Optionnel, par dĂ©faut aujourd'hui
  notes?: string;
  exercises: WorkoutExerciseCreateDto[];
}

export interface WorkoutExerciseCreateDto {
  exerciseId: string;
  sets: number;
  reps: number | string;
  weight?: number;
  notes?: string;
}

// Stats des workouts
export interface WorkoutStats {
  totalWorkouts: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  currentStreak: number; // Jours consĂ©cutifs
  favoriteExercises: string[];
}