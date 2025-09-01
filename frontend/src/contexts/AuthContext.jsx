import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getCaptcha } from '../services/api';

const AuthContext = createContext();

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on app load
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, captchaAnswer, captchaToken) => {
    try {
      console.log('Attempting login with:', { email, captchaAnswer, captchaToken });
      const response = await loginUser(email, password, captchaAnswer, captchaToken);
      console.log('Login response:', response);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      console.log('Login successful, user set:', userData);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const register = async (userData, captchaAnswer, captchaToken) => {
    try {
      await registerUser(userData, captchaAnswer, captchaToken);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const getCaptchaData = async () => {
    try {
      const response = await getCaptcha();
      return response.data;
    } catch (error) {
      throw new Error('Failed to get captcha');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    getCaptchaData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
