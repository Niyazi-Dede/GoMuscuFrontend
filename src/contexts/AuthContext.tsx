import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth.service';
import { setApiAuthToken, setApiUnauthorizedHandler } from '../services/api';
import { User, RegisterDto } from '../types';
import { AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    setApiAuthToken(token);
  }, [token]);

  useEffect(() => {
    setApiUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
    });

    return () => {
      setApiUnauthorizedHandler(null);
    };
  }, []);

  const restoreSession = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user'),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Erreur restauration session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    const { token: newToken, user: newUser } = response.data as AuthResponse;
    await Promise.all([
      AsyncStorage.setItem('token', newToken),
      AsyncStorage.setItem('user', JSON.stringify(newUser)),
    ]);
    setToken(newToken);
    setUser(newUser);
  };

  const register = async (data: RegisterDto) => {
    const response = await authService.register(data);
    const { token: newToken, user: newUser } = response.data as AuthResponse;
    await Promise.all([
      AsyncStorage.setItem('token', newToken),
      AsyncStorage.setItem('user', JSON.stringify(newUser)),
    ]);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    AsyncStorage.multiRemove(['token', 'user']).catch((err) =>
      console.error('Erreur logout storage:', err)
    );
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }
  return context;
};
