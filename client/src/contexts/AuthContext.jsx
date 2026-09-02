import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return user;
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed. Please try again.';
      setError(message);
      throw new Error(message);
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', userData);
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return user;
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed. Please try again.';
      setError(message);
      throw new Error(message);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update profile';
      throw new Error(message);
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to change password';
      throw new Error(message);
    }
  }, []);

  // Forgot password
  const forgotPassword = useCallback(async (email) => {
    try {
      await api.post('/auth/forgot-password', { email });
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to send reset email';
      throw new Error(message);
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (token, password) => {
    try {
      await api.post('/auth/reset-password', { token, password });
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to reset password';
      throw new Error(message);
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isCoordinator: user?.role === 'coordinator' || user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
