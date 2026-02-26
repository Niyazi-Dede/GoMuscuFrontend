import api from './api';
import { Meal, MealCreateDto, NutritionStats } from '../types';

export const nutritionService = {
  listMeals: (date: string) => api.get<Meal[]>(`/meals?date=${date}`),
  create: (data: MealCreateDto) => api.post<Meal>('/meals', data),
  delete: (id: string) => api.delete(`/meals/${id}`),
  stats: (date: string) => api.get<NutritionStats>('/nutrition/stats', { params: { date } }),
};
