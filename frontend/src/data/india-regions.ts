export interface StateData {
  name: string;
  lat: number;
  lng: number;
  cities: CityData[];
}

export interface CityData {
  name: string;
  lat: number;
  lng: number;
}

export const indianStates: StateData[] = [
  { name: "Maharashtra", lat: 19.7515, lng: 75.7139, cities: [
    { name: "Mumbai", lat: 19.076, lng: 72.877 },
    { name: "Pune", lat: 18.5204, lng: 73.8567 },
    { name: "Nagpur", lat: 21.1458, lng: 79.0882 },
  ]},
  { name: "Delhi", lat: 28.7041, lng: 77.1025, cities: [
    { name: "Delhi", lat: 28.6139, lng: 77.209 },
  ]},
  { name: "Karnataka", lat: 15.3173, lng: 75.7139, cities: [
    { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
    { name: "Mysore", lat: 12.2958, lng: 76.6394 },
    { name: "Manipal", lat: 13.3485, lng: 74.7973 },
  ]},
  { name: "Tamil Nadu", lat: 11.1271, lng: 78.6569, cities: [
    { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    { name: "Coimbatore", lat: 11.0168, lng: 76.9558 },
    { name: "Madurai", lat: 9.9252, lng: 78.1198 },
    { name: "Tiruchirappalli", lat: 10.7905, lng: 78.7047 },
  ]},
  { name: "Telangana", lat: 17.1232, lng: 79.2088, cities: [
    { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
    { name: "Warangal", lat: 17.9784, lng: 79.6 },
  ]},
  { name: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, cities: [
    { name: "Lucknow", lat: 26.8467, lng: 80.9462 },
    { name: "Kanpur", lat: 26.4499, lng: 80.3319 },
    { name: "Noida", lat: 28.5355, lng: 77.391 },
  ]},
  { name: "Gujarat", lat: 22.2587, lng: 71.1924, cities: [
    { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
    { name: "Surat", lat: 21.1702, lng: 72.8311 },
    { name: "Vadodara", lat: 22.3072, lng: 73.1812 },
  ]},
  { name: "Rajasthan", lat: 27.0238, lng: 74.2179, cities: [
    { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
    { name: "Jodhpur", lat: 26.2389, lng: 73.0243 },
    { name: "Pilani", lat: 28.358, lng: 75.588 },
  ]},
  { name: "West Bengal", lat: 22.9868, lng: 87.855, cities: [
    { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
    { name: "Durgapur", lat: 23.5204, lng: 87.3119 },
  ]},
  { name: "Madhya Pradesh", lat: 22.9734, lng: 78.6569, cities: [
    { name: "Bhopal", lat: 23.2599, lng: 77.4126 },
    { name: "Indore", lat: 22.7196, lng: 75.8577 },
  ]},
  { name: "Bihar", lat: 25.0961, lng: 85.3131, cities: [
    { name: "Patna", lat: 25.6093, lng: 85.1376 },
  ]},
  { name: "Odisha", lat: 20.9517, lng: 85.0985, cities: [
    { name: "Bhubaneswar", lat: 20.2961, lng: 85.8245 },
    { name: "Cuttack", lat: 20.4625, lng: 85.883 },
  ]},
  { name: "Punjab", lat: 31.1471, lng: 75.3412, cities: [
    { name: "Chandigarh", lat: 30.7333, lng: 76.7794 },
    { name: "Amritsar", lat: 31.634, lng: 74.8723 },
  ]},
  { name: "Haryana", lat: 29.0588, lng: 76.0856, cities: [
    { name: "Gurugram", lat: 28.4595, lng: 77.0266 },
    { name: "Faridabad", lat: 28.4089, lng: 77.3178 },
  ]},
  { name: "Kerala", lat: 10.8505, lng: 76.2711, cities: [
    { name: "Kochi", lat: 9.9312, lng: 76.2673 },
    { name: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366 },
    { name: "Kozhikode", lat: 11.2588, lng: 75.7804 },
  ]},
  { name: "Jharkhand", lat: 23.6102, lng: 85.2799, cities: [
    { name: "Ranchi", lat: 23.3441, lng: 85.3096 },
  ]},
  { name: "Chhattisgarh", lat: 21.2787, lng: 81.8661, cities: [
    { name: "Raipur", lat: 21.2514, lng: 81.6296 },
  ]},
  { name: "Uttarakhand", lat: 30.0668, lng: 79.0193, cities: [
    { name: "Dehradun", lat: 30.3165, lng: 78.0322 },
    { name: "Roorkee", lat: 29.8543, lng: 77.888 },
  ]},
  { name: "Himachal Pradesh", lat: 31.1048, lng: 77.1734, cities: [
    { name: "Shimla", lat: 31.1048, lng: 77.1734 },
  ]},
  { name: "Assam", lat: 26.2006, lng: 92.9376, cities: [
    { name: "Guwahati", lat: 26.1445, lng: 91.7362 },
  ]},
  { name: "Goa", lat: 15.2993, lng: 74.124, cities: [
    { name: "Goa", lat: 15.2993, lng: 74.124 },
  ]},
  { name: "Jammu & Kashmir", lat: 33.7782, lng: 76.5762, cities: [
    { name: "Srinagar", lat: 34.0837, lng: 74.7973 },
  ]},
  { name: "Nagaland", lat: 26.1584, lng: 94.5624, cities: [
    { name: "Kohima", lat: 25.6586, lng: 94.1086 },
  ]},
  { name: "Meghalaya", lat: 25.467, lng: 91.3662, cities: [
    { name: "Shillong", lat: 25.5788, lng: 91.8933 },
  ]},
  { name: "Manipur", lat: 24.6637, lng: 93.9063, cities: [
    { name: "Imphal", lat: 24.817, lng: 93.9368 },
  ]},
  { name: "Tripura", lat: 23.9408, lng: 92.9376, cities: [
    { name: "Agartala", lat: 23.8315, lng: 91.2868 },
  ]},
  { name: "Mizoram", lat: 23.1646, lng: 92.9376, cities: [
    { name: "Aizawl", lat: 23.7271, lng: 92.7176 },
  ]},
  { name: "Arunachal Pradesh", lat: 28.218, lng: 94.7277, cities: [
    { name: "Itanagar", lat: 27.1044, lng: 93.692 },
  ]},
  { name: "Sikkim", lat: 27.533, lng: 88.5122, cities: [
    { name: "Gangtok", lat: 27.3389, lng: 88.6065 },
  ]},
  { name: "Andhra Pradesh", lat: 15.9129, lng: 79.74, cities: [
    { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185 },
    { name: "Vijayawada", lat: 16.5062, lng: 80.648 },
  ]},
  { name: "Ladakh", lat: 34.1526, lng: 77.5771, cities: [
    { name: "Leh", lat: 34.1526, lng: 77.5771 },
  ]},
  { name: "Chandigarh", lat: 30.7333, lng: 76.7794, cities: [
    { name: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  ]},
  { name: "Puducherry", lat: 11.9416, lng: 79.8083, cities: [
    { name: "Puducherry", lat: 11.9416, lng: 79.8083 },
  ]},
  { name: "Dadra and Nagar Haveli and Daman and Diu", lat: 20.3974, lng: 72.9066, cities: [
    { name: "Daman", lat: 20.3974, lng: 72.8354 },
    { name: "Diu", lat: 20.7141, lng: 70.9873 },
  ]},
  { name: "Lakshadweep", lat: 10.5667, lng: 72.6417, cities: [
    { name: "Kavaratti", lat: 10.5667, lng: 72.6417 },
  ]},
  { name: "Andaman and Nicobar Islands", lat: 11.7401, lng: 92.6586, cities: [
    { name: "Port Blair", lat: 11.6234, lng: 92.7265 },
  ]},
];
