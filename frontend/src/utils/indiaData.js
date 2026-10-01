// Indian states with cities (tier-1, tier-2 and some tier-3 coverage).
// This list is kept in one file so the Register/Profile pages and doctor clinic
// address forms can all share it. Not every single city is here, we added as needed.

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan',
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Jammu & Kashmir', 'Chandigarh', 'Puducherry'
]

// key = state, value = list of cities (tier1 first, then tier2, then a few tier3)
export const INDIAN_CITIES = {
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Davanagere', 'Ballari'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur'],
  'Delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Karol Bagh'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Erode'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri', 'Asansol'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Noida', 'Ghaziabad', 'Varanasi', 'Agra'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
  'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati'],
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Rishikesh'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Mandi'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama'],
  'Jammu & Kashmir': ['Srinagar', 'Jammu'],
  'Chandigarh': ['Chandigarh'],
  'Puducherry': ['Puducherry']
}

// Country codes for international users (secondary audience).
// India is default and first in the list.
export const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
]

export const getStateCities = (state) => {
  return INDIAN_CITIES[state] || []
}
