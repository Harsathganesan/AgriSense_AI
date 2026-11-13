import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const FarmContext = createContext();

export const FarmProvider = ({ children }) => {
  const { user } = useAuth();
  const [farms, setFarms] = useState([]);
  const [activeFarm, setActiveFarm] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/farms');
      const data = res.data;
      setFarms(data);
      if (data && data.length > 0) {
        // Restore saved farm ID or select first
        const savedId = localStorage.getItem('agrisense_active_farm_id');
        const found = data.find(f => f.id === savedId) || data[0];
        setActiveFarm(found);
      }
    } catch (err) {
      console.error("Failed to load farms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFarms();
    }
  }, [user]);

  const changeActiveFarm = (farm) => {
    setActiveFarm(farm);
    if (farm) {
      localStorage.setItem('agrisense_active_farm_id', farm.id);
    }
  };

  const addFarm = async (farmData) => {
    const res = await axios.post('/api/farms', farmData);
    await fetchFarms();
    setActiveFarm(res.data);
    return res.data;
  };

  const updateFarm = async (farmId, updates) => {
    const res = await axios.put(`/api/farms/${farmId}`, updates);
    await fetchFarms();
    return res.data;
  };

  const deleteFarm = async (farmId) => {
    await axios.delete(`/api/farms/${farmId}`);
    await fetchFarms();
  };

  return (
    <FarmContext.Provider value={{
      farms,
      activeFarm,
      setActiveFarm: changeActiveFarm,
      loading,
      fetchFarms,
      addFarm,
      updateFarm,
      deleteFarm
    }}>
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => useContext(FarmContext);

