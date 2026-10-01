import React, { createContext, useContext, useState } from 'react'

// Simple language toggle for Indian languages. We deliberately did NOT use
// react-i18next or any heavy library - just a lookup object of common UI strings.
// English is default. Translations for other languages are partial for now.
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
]

// translations - only the most common strings for now, rest falls back to english
const TRANSLATIONS = {
  en: {
    bookAppointment: 'Book Appointment',
    findDoctors: 'Find Doctors',
    myAppointments: 'My Appointments',
    dashboard: 'Dashboard',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    viewDetails: 'View Details',
    token: 'Token',
    upcoming: 'Upcoming',
    completed: 'Completed',
    cancelled: 'Cancelled',
    payNow: 'Pay Now',
    emergency: 'Emergency',
    howItWorks: 'How it Works',
  },
  hi: {
    bookAppointment: 'अपॉइंटमेंट बुक करें',
    findDoctors: 'डॉक्टर खोजें',
    myAppointments: 'मेरे अपॉइंटमेंट',
    dashboard: 'डैशबोर्ड',
    login: 'लॉगिन',
    register: 'रजिस्टर',
    logout: 'लॉगआउट',
    viewDetails: 'विवरण देखें',
    token: 'टोकन',
    upcoming: 'आगामी',
    completed: 'पूर्ण',
    cancelled: 'रद्द',
    payNow: 'भुगतान करें',
    emergency: 'आपातकाल',
    howItWorks: 'यह कैसे काम करता है',
  },
  ta: {
    bookAppointment: 'சந்திப்பை பதிவு செய்யுங்கள்',
    findDoctors: 'மருத்துவரை தேடுங்கள்',
    myAppointments: 'என் சந்திப்புகள்',
    dashboard: 'டாஷ்போர்டு',
    login: 'உள்நுழைவு',
    register: 'பதிவு',
    logout: 'வெளியேறு',
    viewDetails: 'விவரங்களைப் பார்க்க',
    token: 'டோக்கன்',
    upcoming: 'வரவிருக்கும்',
    completed: 'முடிந்தது',
    cancelled: 'ரத்து',
    payNow: 'இப்போது செலுத்து',
    emergency: 'அவசரம்',
    howItWorks: 'இது எப்படி வேலை செய்கிறது',
  },
  te: {
    bookAppointment: 'అపాయింట్‌మెంట్ బుక్ చేయండి',
    findDoctors: 'డాక్టర్ వెతకండి',
    myAppointments: 'నా అపాయింట్‌మెంట్లు',
    dashboard: 'డాష్‌బోర్డ్',
    login: 'లాగిన్',
    register: 'నమోదు',
    logout: 'లాగ్ అవుట్',
    viewDetails: 'వివరాలు చూడండి',
    token: 'టోకెన్',
    upcoming: 'రాబోయే',
    completed: 'పూర్తయింది',
    cancelled: 'రద్దు',
    payNow: 'ఇప్పుడు చెల్లించండి',
    emergency: 'అత్యవసరం',
    howItWorks: 'ఇది ఎలా పనిచేస్తుంది',
  },
  kn: {
    bookAppointment: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ',
    findDoctors: 'ವೈದ್ಯರನ್ನು ಹುಡುಕಿ',
    myAppointments: 'ನನ್ನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು',
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    login: 'ಲಾಗಿನ್',
    register: 'ನೋಂದಣಿ',
    logout: 'ಲಾಗ್ ಔಟ್',
    viewDetails: 'ವಿವರಗಳನ್ನು ನೋಡಿ',
    token: 'ಟೋಕನ್',
    upcoming: 'ಮುಂಬರುವ',
    completed: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    cancelled: 'ರದ್ದು',
    payNow: 'ಈಗ ಪಾವತಿಸಿ',
    emergency: 'ತುರ್ತು',
    howItWorks: 'ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ',
  },
  mr: {
    bookAppointment: 'अपॉइंटमेंट बुक करा',
    findDoctors: 'डॉक्टर शोधा',
    myAppointments: 'माझी अपॉइंटमेंट',
    dashboard: 'डॅशबोर्ड',
    login: 'लॉगिन',
    register: 'नोंदणी',
    logout: 'लॉगआउट',
    viewDetails: 'तपशील पहा',
    token: 'टोकन',
    upcoming: 'आगामी',
    completed: 'पूर्ण',
    cancelled: 'रद्द',
    payNow: 'आता द्या',
    emergency: 'आपत्कालीन',
    howItWorks: 'हे कसे कार्य करते',
  },
  bn: {
    bookAppointment: 'অ্যাপয়েন্টমেন্ট বুক করুন',
    findDoctors: 'ডাক্তার খুঁজুন',
    myAppointments: 'আমার অ্যাপয়েন্টমেন্ট',
    dashboard: 'ড্যাশবোর্ড',
    login: 'লগইন',
    register: 'নিবন্ধন',
    logout: 'লগআউট',
    viewDetails: 'বিস্তারিত দেখুন',
    token: 'টোকেন',
    upcoming: 'আসন্ন',
    completed: 'সম্পন্ন',
    cancelled: 'বাতিল',
    payNow: 'এখন পরিশোধ করুন',
    emergency: 'জরুরি',
    howItWorks: 'এটি কীভাবে কাজ করে',
  },
}

const LangContext = createContext(null)

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('clinicbook_lang') || 'en')

  const changeLang = (code) => {
    setLang(code)
    localStorage.setItem('clinicbook_lang', code) // remember choice between visits
  }

  // t = translate. falls back to english if a string is missing in chosen language
  const t = (key) => {
    return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.en[key] || key
  }

  return (
    <LangContext.Provider value={{ lang, changeLang, t, languages: LANGUAGES }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
