/**
 * Types liĂ©s Ă  la nutrition
 */

export interface Meal {
  id: string;
  userId: string;
  date: string; // Format ISO 8601
  name: string;
  calories: number;
  protein?: number; // en grammes
  carbs?: number; // en grammes
  fats?: number; // en grammes
  createdAt?: string;
}

export interface MealCreateDto {
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  date?: string; // Optionnel, par dĂ©faut aujourd'hui
}

export interface NutritionStats {
  date: string;
  caloriesConsumed: number;
  caloriesTarget: number;
  caloriesRemaining: number;
  proteinConsumed?: number;
  proteinTarget?: number;
  carbsConsumed?: number;
  carbsTarget?: number;
  fatsConsumed?: number;
  fatsTarget?: number;
  meals: Meal[];
}