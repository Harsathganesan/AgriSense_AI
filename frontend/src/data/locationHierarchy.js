/**
 * AgriSense AI - Global & Indian Regional Administrative Hierarchy
 * Supports Dynamic Cascading Dropdowns: Country -> State -> District
 */

export const LOCATION_HIERARCHY = {
  "India": {
    "Tamil Nadu": [
      "Thanjavur",
      "Tiruvarur",
      "Nagapattinam",
      "Mayiladuthurai",
      "Tiruchirappalli",
      "Pudukkottai",
      "Madurai",
      "Dindigul",
      "Theni",
      "Ramanathapuram",
      "Sivaganga",
      "Virudhunagar",
      "Tirunelveli",
      "Tenkasi",
      "Thoothukudi",
      "Kanyakumari",
      "Salem",
      "Namakkal",
      "Dharmapuri",
      "Krishnagiri",
      "Erode",
      "Tiruppur",
      "Coimbatore",
      "Nilgiris",
      "Cuddalore",
      "Villupuram",
      "Kallakurichi",
      "Vellore",
      "Ranipet",
      "Tirupathur",
      "Tiruvannamalai",
      "Kanchipuram",
      "Chengalpattu",
      "Tiruvallur",
      "Chennai",
      "Ariyalur",
      "Perambalur",
      "Karur"
    ],
    "Karnataka": [
      "Bengaluru Urban",
      "Bengaluru Rural",
      "Mysuru",
      "Mandya",
      "Hassan",
      "Chikkamagaluru",
      "Shimoga",
      "Belagavi",
      "Dharwad",
      "Ballari",
      "Tumakuru",
      "Udupi",
      "Dakshina Kannada",
      "Davanagere",
      "Raichur",
      "Kalaburagi"
    ],
    "Kerala": [
      "Palakkad",
      "Thrissur",
      "Ernakulam",
      "Wayanad",
      "Idukki",
      "Alappuzha",
      "Kottayam",
      "Kozhikode",
      "Thiruvananthapuram",
      "Kollam",
      "Malappuram",
      "Kannur",
      "Kasaragod",
      "Pathanamthitta"
    ],
    "Andhra Pradesh": [
      "Krishna",
      "Guntur",
      "East Godavari",
      "West Godavari",
      "Chittoor",
      "Kurnool",
      "Nellore",
      "Anantapur",
      "Visakhapatnam",
      "Prakasam",
      "YSR Kadapa",
      "Srikakulam",
      "Vizianagaram"
    ],
    "Telangana": [
      "Warangal",
      "Nalgonda",
      "Khammam",
      "Karimnagar",
      "Nizamabad",
      "Rangareddy",
      "Medak",
      "Mahabubnagar",
      "Adilabad",
      "Suryapet"
    ],
    "Maharashtra": [
      "Nashik",
      "Pune",
      "Ahmednagar",
      "Kolhapur",
      "Solapur",
      "Nagpur",
      "Aurangabad",
      "Jalgaon",
      "Satara",
      "Sangli",
      "Amravati",
      "Akola"
    ],
    "Punjab": [
      "Ludhiana",
      "Amritsar",
      "Jalandhar",
      "Patiala",
      "Bathinda",
      "Sangrur",
      "Firozpur",
      "Hoshiarpur",
      "Gurdaspur",
      "Moga"
    ],
    "Haryana": [
      "Karnal",
      "Ambala",
      "Hisar",
      "Rohtak",
      "Sirsa",
      "Kurukshetra",
      "Sonipat",
      "Panipat",
      "Yamunanagar",
      "Fatehabad"
    ]
  },
  "Sri Lanka": {
    "Northern Province": [
      "Jaffna",
      "Kilinochchi",
      "Mannar",
      "Mullaitivu",
      "Vavuniya"
    ],
    "Central Province": [
      "Kandy",
      "Matale",
      "Nuwara Eliya"
    ],
    "Western Province": [
      "Colombo",
      "Gampaha",
      "Kalutara"
    ],
    "Eastern Province": [
      "Batticaloa",
      "Ampara",
      "Trincomalee"
    ]
  },
  "Malaysia": {
    "Selangor": ["Klang", "Petaling", "Kuala Langat", "Sepang", "Hulu Langat"],
    "Johor": ["Johor Bahru", "Muar", "Batu Pahat", "Kluang", "Kota Tinggi"],
    "Kedah": ["Kota Setar", "Kuala Muda", "Kubang Pasu", "Kulim"]
  },
  "United States": {
    "California": ["Fresno", "Kern", "Tulare", "Monterey", "San Joaquin", "Imperial"],
    "Texas": ["Hidalgo", "Castro", "Deaf Smith", "Cameron", "Parmer"],
    "Iowa": ["Polk", "Story", "Linn", "Johnson", "Dallas"]
  }
};

export const DISTRICT_COORDINATES = {
  "thanjavur": { lat: 10.7870, lon: 79.1378, zoom: 10 },
  "tiruvarur": { lat: 10.7719, lon: 79.6358, zoom: 11 },
  "nagapattinam": { lat: 10.7656, lon: 79.8424, zoom: 11 },
  "mayiladuthurai": { lat: 11.1075, lon: 79.6523, zoom: 11 },
  "tiruchirappalli": { lat: 10.7905, lon: 78.7047, zoom: 10 },
  "pudukkottai": { lat: 10.3833, lon: 78.8001, zoom: 10 },
  "madurai": { lat: 9.9252, lon: 78.1198, zoom: 10 },
  "dindigul": { lat: 10.3673, lon: 77.9803, zoom: 10 },
  "theni": { lat: 10.0104, lon: 77.4768, zoom: 11 },
  "ramanathapuram": { lat: 9.3639, lon: 78.8395, zoom: 10 },
  "sivaganga": { lat: 9.8433, lon: 78.4809, zoom: 10 },
  "virudhunagar": { lat: 9.5872, lon: 77.9514, zoom: 10 },
  "tirunelveli": { lat: 8.7139, lon: 77.7567, zoom: 10 },
  "tenkasi": { lat: 8.9594, lon: 77.3150, zoom: 11 },
  "thoothukudi": { lat: 8.7642, lon: 78.1348, zoom: 10 },
  "kanyakumari": { lat: 8.0883, lon: 77.5385, zoom: 11 },
  "salem": { lat: 11.6643, lon: 78.1460, zoom: 10 },
  "namakkal": { lat: 11.2189, lon: 78.1674, zoom: 11 },
  "dharmapuri": { lat: 12.1211, lon: 78.1582, zoom: 10 },
  "krishnagiri": { lat: 12.5186, lon: 78.2137, zoom: 10 },
  "erode": { lat: 11.3410, lon: 77.7172, zoom: 10 },
  "tiruppur": { lat: 11.1085, lon: 77.3411, zoom: 10 },
  "coimbatore": { lat: 11.0168, lon: 76.9558, zoom: 10 },
  "nilgiris": { lat: 11.4102, lon: 76.6950, zoom: 11 },
  "cuddalore": { lat: 11.7480, lon: 79.7714, zoom: 10 },
  "villupuram": { lat: 11.9401, lon: 79.4861, zoom: 10 },
  "kallakurichi": { lat: 11.7384, lon: 78.9639, zoom: 11 },
  "vellore": { lat: 12.9165, lon: 79.1325, zoom: 11 },
  "ranipet": { lat: 12.9224, lon: 79.3327, zoom: 11 },
  "tirupathur": { lat: 12.4925, lon: 78.5678, zoom: 11 },
  "tiruvannamalai": { lat: 12.2253, lon: 79.0747, zoom: 10 },
  "kanchipuram": { lat: 12.8342, lon: 79.7036, zoom: 11 },
  "chengalpattu": { lat: 12.6841, lon: 79.9836, zoom: 11 },
  "tiruvallur": { lat: 13.1432, lon: 79.9083, zoom: 10 },
  "chennai": { lat: 13.0827, lon: 80.2707, zoom: 12 },
  "ariyalur": { lat: 11.1401, lon: 79.0786, zoom: 11 },
  "perambalur": { lat: 11.2342, lon: 78.8820, zoom: 11 },
  "karur": { lat: 10.9601, lon: 78.0766, zoom: 11 },

  // Key other states
  "bengaluru urban": { lat: 12.9716, lon: 77.5946, zoom: 11 },
  "mysuru": { lat: 12.2958, lon: 76.6394, zoom: 10 },
  "mandya": { lat: 12.5244, lon: 76.8958, zoom: 11 },
  "palakkad": { lat: 10.7867, lon: 76.6548, zoom: 10 },
  "wayanad": { lat: 11.6854, lon: 76.1320, zoom: 11 },
  "krishna": { lat: 16.1809, lon: 81.1303, zoom: 10 },
  "guntur": { lat: 16.3067, lon: 80.4365, zoom: 10 },
  "pune": { lat: 18.5204, lon: 73.8567, zoom: 10 },
  "nashik": { lat: 19.9975, lon: 73.7898, zoom: 10 },
  "ludhiana": { lat: 30.9010, lon: 75.8573, zoom: 10 },
  "karnal": { lat: 29.6857, lon: 76.9905, zoom: 10 }
};

export function getCountries() {
  return Object.keys(LOCATION_HIERARCHY);
}

export function getStates(country = "India") {
  const c = LOCATION_HIERARCHY[country];
  return c ? Object.keys(c) : [];
}

export function getDistricts(country = "India", state = "Tamil Nadu") {
  const c = LOCATION_HIERARCHY[country];
  if (!c) return [];
  const s = c[state];
  return s || [];
}

export function getDistrictCoords(district = "Thanjavur") {
  const key = district.toLowerCase().trim();
  return DISTRICT_COORDINATES[key] || { lat: 10.7870, lon: 79.1378, zoom: 10 };
}

