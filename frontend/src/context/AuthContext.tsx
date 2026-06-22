import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import toast from 'react-hot-toast';
import api from '../api';

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USER_STORAGE_KEY = 'business_nexus_user';
const TOKEN_KEY = 'business_nexus_token';
const RESET_TOKEN_KEY = 'business_nexus_reset_token';

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on initial load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error("Token invalid or expired", err);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password, role });
      const { token, user } = res.data;
      
      setUser(user);
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      toast.success('Successfully logged in!');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Login failed';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      const { token, user } = res.data;
      
      setUser(user);
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      toast.success('Account created successfully!');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock forgot password function
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user exists
      const user = users.find(u => u.email === email);
      if (!user) {
        throw new Error('No account found with this email');
      }
      
      // Generate reset token (in a real app, this would be a secure token)
      const resetToken = Math.random().toString(36).substring(2, 15);
      localStorage.setItem(RESET_TOKEN_KEY, resetToken);
      
      // In a real app, this would send an email
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
  };

  // Mock reset password function
  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify token
      const storedToken = localStorage.getItem(RESET_TOKEN_KEY);
      if (token !== storedToken) {
        throw new Error('Invalid or expired reset token');
      }
      
      // In a real app, this would update the user's password in the database
      localStorage.removeItem(RESET_TOKEN_KEY);
      toast.success('Password reset successfully');
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    toast.success('Logged out successfully');
  };

  // Update user profile
  const updateProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const res = await api.put('/auth/me', updates);
      const updatedUser = res.data;
      
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Profile update failed';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};