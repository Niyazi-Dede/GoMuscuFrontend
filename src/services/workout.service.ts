import api from './api';
import { Workout, WorkoutCreateDto, WorkoutStats } from '../types';

export const workoutService = {
  create: (data: WorkoutCreateDto) => api.post<Workout>('/workouts', data),
  list: () => api.get<Workout[]>('/workouts'),
  get: (id: string) => api.get<Workout>(`/workouts/${id}`),
  stats: () => api.get<WorkoutStats>('/workouts/stats'),
};
