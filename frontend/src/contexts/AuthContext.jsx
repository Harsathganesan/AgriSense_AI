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

  // Load user profile when token is present
  useEffect(() => {
    const fetchMe = async () => {
      try {
        if (token) {
          const res = await axios.get('/api/auth/me');
          setUser(res.data);
        } else {
          setUser(null);
        }
      } catch (err) {
        if (token) {
          setToken(null);
          localStorage.removeItem('agrisense_token');
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const purgeStaleCache = () => {
    try {
      localStorage.removeItem('agrisense_tracked_crop');
      localStorage.removeItem('agrisense_tracked_crops_list');
      localStorage.removeItem('agrisense_active_farm_id');
      localStorage.removeItem('agrisense_gps_configured');
    } catch (e) {}
  };

  const login = async (email, password) => {
    purgeStaleCache();
    const res = await axios.post('/api/auth/login', { email, password });
    if (typeof res.data === 'string' && res.data.includes('<!DOCTYPE')) {
      throw new Error("Backend API unreachable: Received HTML instead of JSON. Please verify backend URL.");
    }
    if (res.data && res.data.access_token) {
      setToken(res.data.access_token);
      setUser(res.data.user);
    }
    return res.data;
  };

  const register = async (userData) => {
    purgeStaleCache();
    const res = await axios.post('/api/auth/register', userData);
    if (typeof res.data === 'string' && res.data.includes('<!DOCTYPE')) {
      throw new Error("Backend API unreachable: Received HTML instead of JSON. Please verify backend URL.");
    }
    if (res.data && res.data.access_token) {
      setToken(res.data.access_token);
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = () => {
    purgeStaleCache();
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

