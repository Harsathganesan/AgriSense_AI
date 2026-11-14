import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'
import './index.css'

// Configure global API base URL from environment or localStorage
const savedApiUrl = typeof window !== 'undefined' ? localStorage.getItem('agrisense_api_base_url') : null;
const envApiUrl = import.meta.env.VITE_API_BASE_URL;
const apiBase = envApiUrl || savedApiUrl;
if (apiBase) {
  axios.defaults.baseURL = apiBase.replace(/\/+$/, '');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

