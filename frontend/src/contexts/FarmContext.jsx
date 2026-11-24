import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const FarmContext = createContext();

export const FarmProvider = ({ children }) => {
  const { user } = useAuth();
  const [farms, setFarms] = useState([]);
  const [activeFarm, setActiveFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFarms = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/farms');
      const data = res.data;
      if (Array.isArray(data)) {
        setFarms(data);
        if (data.length > 0) {
          const userDist = user?.registered_location?.district || user?.district;
          const savedId = localStorage.getItem('agrisense_active_farm_id');
          // Prefer active farm matching user's registered district or savedId
          const savedFarm = savedId ? data.find(f => f.id === savedId) : null;
          const matchedDistrictFarm = userDist ? data.find(f => f.district?.toLowerCase() === userDist?.toLowerCase()) : null;
          const targetFarm = savedFarm || matchedDistrictFarm || data[0];
          setActiveFarm(targetFarm);
        } else {
          setActiveFarm(null);
        }
      } else {
        setFarms([]);
        setActiveFarm(null);
      }
    } catch (err) {
      console.error("Failed to load farms from backend:", err.response?.data || err.message);
      setError(err.response?.data?.detail || err.message || "Failed to load farms");
      setFarms([]);
      setActiveFarm(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFarms();
    } else {
      setFarms([]);
      setActiveFarm(null);
      setLoading(false);
    }
  }, [user]);

  const changeActiveFarm = (farm) => {
    setActiveFarm(farm);
    if (farm && farm.id) {
      localStorage.setItem('agrisense_active_farm_id', farm.id);
    }
  };

  const addFarm = async (farmData) => {
    const res = await axios.post('/api/farms', farmData);
    await fetchFarms();
    if (res.data) {
      setActiveFarm(res.data);
    }
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

  const currentDistrict = activeFarm?.district || user?.registered_location?.district || user?.district || 'Thanjavur';

  return (
    <FarmContext.Provider value={{
      farms,
      activeFarm,
      currentDistrict,
      setActiveFarm: changeActiveFarm,
      loading,
      error,
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
