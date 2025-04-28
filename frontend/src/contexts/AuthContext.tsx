'use client';

import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { userApi } from '@/services/api';
import axios, { AxiosError } from 'axios';

// Define user type
export type User = {
  user_id: number;
  username: string;
  email: string;
};

// Define error type
type ApiError = {
  message: string;
  success: boolean;
};

// Define auth context type
type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isAuthenticated: false,
});

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in from localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await userApi.login({ email, password });
      if (data.success) {
        const userData: User = {
          user_id: data.user_id,
          username: data.username,
          email: data.email
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error: unknown) {
      let errorMessage: string = 'Login failed';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        errorMessage = axiosError.response?.data?.message || 'Login failed';
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await userApi.register({ username, email, password });
      if (data.success) {
        await login(email, password);
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error: unknown) {
      let errorMessage: string = 'Registration failed';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        errorMessage = axiosError.response?.data?.message || 'Registration failed';
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext); 