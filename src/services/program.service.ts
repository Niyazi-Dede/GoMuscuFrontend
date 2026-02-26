import api from './api';
import { Program, ProgramGeneratorInput } from '../types';

export const programService = {
  generate: (input: ProgramGeneratorInput) =>
    api.post<Program>('/programs/generate', input, { timeout: 30000 }),
  list: () => api.get<Program[]>('/programs'),
  get: (id: string) => api.get<Program>(`/programs/${id}`),
};
