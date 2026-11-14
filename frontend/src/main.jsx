import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'
import './index.css'

// Configure global API base URL from environment
const apiBase = import.meta.env.VITE_API_BASE_URL;
if (apiBase) {
  axios.defaults.baseURL = apiBase.replace(/\/+$/, '');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

