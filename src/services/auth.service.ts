import api from './api';
import { RegisterDto, LoginDto } from '../types';

export const authService = {
  register: (data: RegisterDto) => api.post('/register', data),
  login: (data: LoginDto) => api.post('/login', data),
};
