import api from './api';
import { Profile, ProfileUpdateDto } from '../types';

export const profileService = {
  getProfile: () => api.get<Profile>('/profile'),
  updateProfile: (data: ProfileUpdateDto) => api.put<Profile>('/profile', data),
};
