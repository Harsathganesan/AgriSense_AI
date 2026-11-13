import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    appName: "AgriSense AI",
    tagline: "Smart Crop Rotation & Soil Health Decision Platform",
    nav: {
      dashboard: "Dashboard",
      myFarm: "My Farm",
      nasaExplorer: "NASA Data Explorer",
      soilHealth: "Soil Health",
      cropExplorer: "Crop Explorer",
      rotationPlanner: "Crop Rotation Planner",
      aiAssistant: "AI Farm Assistant",
      farmMap: "Farm Map",
      reports: "Reports",
      history: "History",
      settings: "Settings",
      logout: "Sign Out"
    },
    common: {
      activeFarm: "Active Farm",
      loading: "Loading data...",
      save: "Save Changes",
      cancel: "Cancel",
      submit: "Submit",
      download: "Download PDF",
      refresh: "Refresh Data",
      viewDetails: "View Details",
      all: "All",
      acres: "Acres",
      healthy: "Healthy",
      critical: "Action Required",
      warning: "Advisory Alert"
    },
    dashboard: {
      welcome: "Welcome back, Farmer!",
      overviewSubtitle: "Real-time satellite observations and soil health intelligence for your farm.",
      temp: "Mean Temperature",
      rainfall: "30-Day Rainfall",
      moisture: "Root-Zone Moisture",
      vegetation: "NDVI Crop Health",
      elevation: "SRTM Elevation",
      soilScore: "Soil Health Index",
      alertsTitle: "NASA Environmental & Agronomic Alerts",
      weatherTrends: "Recent 30-Day Climate Telemetry (NASA POWER)",
      climatologyTrends: "Seasonal 12-Month Climatology Baseline",
      recommendedRotation: "Recommended Crop Sequence",
      quickActions: "Quick Farm Operations",
      planRotation: "Plan Next Rotation",
      testSoil: "Enter Soil Test",
      askAi: "Ask AI Assistant"
    },
    rotation: {
      title: "Intelligent Crop Rotation Decision Engine",
      subtitle: "Multi-criteria algorithmic comparison grounded on NASA Earth observations and soil biology.",
      generateBtn: "Re-calculate Rotation Strategies",
      comparing: "Comparing 3 Tailored Agronomic Strategies",
      strategy1: "Existing Traditional Rotation",
      strategy2: "Soil-Health-Focused (Legume / Green Manure)",
      strategy3: "Water-Efficient & Climate-Resilient",
      overallScore: "MCDA Suitability Score",
      waterFootprint: "Annual Water Requirement",
      nitrogenAdded: "Biological Nitrogen Fixed",
      waterSaved: "Water Conserved vs Baseline",
      whatIfTitle: "Drought & Climate Shock What-If Simulation",
      simulateBtn: "Simulate Stress Scenario",
      rainDeficit: "Rainfall Deficit Simulation",
      tempRise: "Temperature Surge Simulation"
    },
    soil: {
      title: "Soil Health & Nutrient Diagnostics",
      subtitle: "Laboratory soil-test evaluation based on ICAR and TNAU regional agronomy standards.",
      newEntry: "Record New Soil Test",
      ph: "Soil Reaction (pH)",
      nitrogen: "Available Nitrogen (N)",
      phosphorus: "Available Phosphorus (P)",
      potassium: "Available Potassium (K)",
      organicCarbon: "Soil Organic Carbon (OC)",
      moisture: "Soil Moisture",
      ec: "Electrical Conductivity (EC)",
      scoreCard: "Comprehensive Fertility Scorecard",
      guidelines: "Agronomic Soil Management Advisory"
    },
    assistant: {
      title: "AgriSense AI Farm Assistant",
      subtitle: "Ask farm-specific questions grounded on your actual soil tests, NASA telemetry, and crop plans in English or தமிழ்.",
      placeholder: "Ask anything about crop rotation, soil health, fertilizer reduction or NASA weather...",
      send: "Ask Assistant",
      suggested: "Suggested Farmer Queries"
    }
  },
  ta: {
    appName: "அக்ரிசென்ஸ் AI",
    tagline: "நாசா செயற்கைக்கோள் & மண் நலன் பயிர் சுழற்சி தளம்",
    nav: {
      dashboard: "முகப்பு",
      myFarm: "என் பண்ணை",
      nasaExplorer: "நாசா தரவு ஆய்வகம்",
      soilHealth: "மண் வளம்",
      cropExplorer: "பயிர் களஞ்சியம்",
      rotationPlanner: "பயிர் சுழற்சி திட்டம்",
      aiAssistant: "AI வேளாண் உதவியாளர்",
      farmMap: "பண்ணை வரைபடம்",
      reports: "அறிக்கைகள்",
      history: "முந்தைய பதிவுகள்",
      settings: "அமைப்புகள்",
      logout: "வெளியேறு"
    },
    common: {
      activeFarm: "செயலில் உள்ள பண்ணை",
      loading: "தரவு ஏற்றப்படுகிறது...",
      save: "மாற்றங்களைச் சேமி",
      cancel: "ரத்து செய்",
      submit: "சமர்ப்பி",
      download: "PDF பதிவிறக்கம்",
      refresh: "புதுப்பி",
      viewDetails: "விவரங்களை காண்க",
      all: "அனைத்தும்",
      acres: "ஏக்கர்",
      healthy: "சிறந்தது",
      critical: "கவனம் தேவை",
      warning: "முக்கிய எச்சரிக்கை"
    },
    dashboard: {
      welcome: "வணக்கம், விவசாயி தோழரே!",
      overviewSubtitle: "உங்கள் பண்ணைக்கான நேரடி செயற்கைக்கோள் தரவு மற்றும் மண் பரிசோதனை நிலவரம்.",
      temp: "சராசரி வெப்பநிலை",
      rainfall: "30 நாள் மழைப்பொழிவு",
      moisture: "வேர் மண்டல ஈரப்பதம்",
      vegetation: "பயிர் பசுமை குறியீடு (NDVI)",
      elevation: "நில உயரம் (SRTM)",
      soilScore: "மண் நலக் குறியீடு",
      alertsTitle: "நாசா வானிலை & பயிர் பாதுகாப்பு எச்சரிக்கைகள்",
      weatherTrends: "கடந்த 30 நாள் வானிலை மாற்றங்கள் (NASA POWER)",
      climatologyTrends: "வருடாந்திர 12 மாத மழை & வெப்பநிலை ஒப்பீடு",
      recommendedRotation: "பரிந்துரைக்கப்பட்ட பயிர் சுழற்சி முறை",
      quickActions: "விரைவு செயல்பாடுகள்",
      planRotation: "புதிய சுழற்சி திட்டம்",
      testSoil: "மண் பரிசோதனை சேர்க்க",
      askAi: "AI உதவியாளரிடம் கேட்க"
    },
    rotation: {
      title: "அறிவார்ந்த பயிர் சுழற்சி திட்டமிடுதல்",
      subtitle: "நாசா புவி கண்காணிப்பு மற்றும் மண் நலன் அடிப்படையிலான 3 உத்திகள் ஒப்பீடு.",
      generateBtn: "சுழற்சி முறையை மறுமதிப்பீடு செய்",
      comparing: "3 விவசாய உத்திகள் ஒப்பீட்டு அறிக்கை",
      strategy1: "வழக்கமான பாரம்பரிய முறை (நெல் - நெல் - தரிசு)",
      strategy2: "மண் வளம் பெருக்கும் முறை (பசுந்தாள் - நெல் - உளுந்து)",
      strategy3: "குறைந்த நீர் & வறட்சி தாங்கும் முறை (சிறுதானியம் - நிலக்கடலை - எள்)",
      overallScore: "பொருத்தப்பாடு மதிப்பீடு",
      waterFootprint: "ஆண்டு நீர் தேவை",
      nitrogenAdded: "இயற்கை தழைச்சத்து கூடுதல்",
      waterSaved: "நீர் சேமிப்பு விகிதம்",
      whatIfTitle: "வறட்சி & காலநிலை மாற்ற உருவகப்படுத்துதல் (What-If Simulation)",
      simulateBtn: "சூழ்நிலையை உருவகப்படுத்து",
      rainDeficit: "மழைப் பற்றாக்குறை உருவகப்படுத்துதல்",
      tempRise: "வெப்பநிலை உயர்வு உருவகப்படுத்துதல்"
    },
    soil: {
      title: "மண் பரிசோதனை & ஊட்டச்சத்து ஆய்வு",
      subtitle: "தமிழ்நாடு வேளாண் பல்கலைக்கழகம் (TNAU) மற்றும் ICAR வழிகாட்டுதல் மதிப்பீடு.",
      newEntry: "புதிய மண் பரிசோதனை பதிவு",
      ph: "மண் அமில/காரத்தன்மை (pH)",
      nitrogen: "தழைச்சத்து (Nitrogen - N)",
      phosphorus: "மணிச்சத்து (Phosphorus - P)",
      potassium: "சாம்பல் சத்து (Potassium - K)",
      organicCarbon: "கரிமச்சத்து (Organic Carbon - OC)",
      moisture: "மண் ஈரப்பதம்",
      ec: "மின் கடத்துத்திறன் (EC)",
      scoreCard: "முழுமையான மண் வள மதிப்பீட்டு அட்டை",
      guidelines: "விவசாயிக்கான மண் வள மேலாண்மை வழிகாட்டல்"
    },
    assistant: {
      title: "அக்ரிசென்ஸ் AI வேளாண் உதவியாளர்",
      subtitle: "உங்கள் பண்ணையின் உண்மையான மண் மற்றும் நாசா வானிலை தரவுகள் அடிப்படையில் சந்தேகங்களை தமிழில் கேளுங்கள்.",
      placeholder: "பயிர் சுழற்சி, உரம் மேலாண்மை அல்லது வானிலை பற்றி தமிழில் கேளுங்கள்...",
      send: "கேள்வி கேள்",
      suggested: "விவசாயிகள் அதிகம் கேட்கும் கேள்விகள்"
    }
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('agrisense_lang') || 'en';
  });

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'ta' : 'en';
    setLang(nextLang);
    localStorage.setItem('agrisense_lang', nextLang);
  };

  const t = (path) => {
    const keys = path.split('.');
    let cur = translations[lang];
    for (const k of keys) {
      if (cur && cur[k] !== undefined) {
        cur = cur[k];
      } else {
        // Fallback to English
        let fallback = translations.en;
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) fallback = fallback[fk];
          else return path;
        }
        return fallback;
      }
    }
    return cur;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

