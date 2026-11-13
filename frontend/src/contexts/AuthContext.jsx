import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('agrisense_token') || null);
  const [loading, setLoading] = useState(true);

  // Set default authorization header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('agrisense_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('agrisense_token');
    }
  }, [token]);

  // Load user profile or auto-login with demo credentials
  useEffect(() => {
    const fetchMe = async () => {
      try {
        if (token) {
          const res = await axios.get('/api/auth/me');
          setUser(res.data);
        } else {
          // Auto login demo farmer for instant user accessibility
          const res = await axios.post('/api/auth/login', {
            email: 'farmer@agrisense.ai',
            password: 'farmer123'
          });
          setToken(res.data.access_token);
          setUser(res.data.user);
        }
      } catch (err) {
        console.warn("Auth initialization fallback:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    setToken(res.data.access_token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (userData) => {
    const res = await axios.post('/api/auth/register', userData);
    setToken(res.data.access_token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('agrisense_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

