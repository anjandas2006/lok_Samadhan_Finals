/**
 * Lok Samadhan - Official 8 Civic Departments
 * Aligned with National & State Citizen Grievance Portals (CPGRAMS / Samadhan)
 */
const DEPARTMENTS = {
  waterSupply: {
    category: 'waterSupply',
    code: 'PHED-WTR',
    nameEn: 'Drinking Water & Sanitation (PHED)',
    nameHi: 'पेयजल एवं स्वच्छता विभाग',
    nameGu: 'પીવાનું પાણી અને સ્વચ્છતા વિભાગ (PHED)',
    nodalAuthority: 'Public Health Engineering Department',
    defaultSlaHours: 48,
    icon: 'water_drop',
    color: '#0284C7',
    keywords: [
      'water', 'handpump', 'pipe', 'pipeline', 'leakage', 'drinking water', 'paani', 'chaapaakal',
      'પાણી', 'હેન્ડપંપ', 'પાઇપલાઇન', 'ચાપાકલ', 'नल', 'जल', 'टोंटी', 'बोरिंग', 'boring'
    ]
  },
  electricity: {
    category: 'electricity',
    code: 'DISCOM-ELEC',
    nameEn: 'Electricity Distribution (DISCOM)',
    nameHi: 'विद्युत वितरण निगम',
    nameGu: 'વીજળી વિતરણ નિગમ (DISCOM)',
    nodalAuthority: 'State Electricity Board',
    defaultSlaHours: 24,
    icon: 'electric_bolt',
    color: '#D97706',
    keywords: [
      'electricity', 'power', 'power cut', 'outage', 'transformer', 'wire', 'spark', 'bijli', 'voltage',
      'વીજળી', 'ટ્રાન્સફોર્મર', 'વાયર', 'કરંટ', 'बिजली', 'ट्रांसफार्मर', 'तार', 'शॉर्ट सर्किट', 'fuse'
    ]
  },
  roadsInfrastructure: {
    category: 'roadsInfrastructure',
    code: 'PWD-ROAD',
    nameEn: 'Public Works & Roads (PWD)',
    nameHi: 'लोक निर्माण विभाग (सड़क)',
    nameGu: 'માર્ગ અને મકાન વિભાગ - રસ્તા (PWD)',
    nodalAuthority: 'Public Works Department',
    defaultSlaHours: 72,
    icon: 'add_road',
    color: '#4B5563',
    keywords: [
      'road', 'pothole', 'street', 'bridge', 'tar', 'highway', 'pit', 'sadak', 'khada', 'pul',
      'રસ્તો', 'ખાડા', 'પુલ', 'ડામર', 'सड़क', 'गड्ढा', 'पुलिया', 'खड़ंजा', 'मार्ग'
    ]
  },
  sanitationHealth: {
    category: 'sanitationHealth',
    code: 'HLTH-SANI',
    nameEn: 'Public Health & Local Sanitation',
    nameHi: 'स्वास्थ्य एवं नगर स्वच्छता',
    nameGu: 'જાહેર આરોગ્ય અને સ્થાનિક સ્વચ્છતા',
    nodalAuthority: 'Municipal Health Authority',
    defaultSlaHours: 24,
    icon: 'cleaning_services',
    color: '#059669',
    keywords: [
      'garbage', 'waste', 'drain', 'gutter', 'sewer', 'smell', 'mosquito', 'sanitation', 'kachra', 'naali',
      'કચરો', 'ગટર', 'ગંદકી', 'મચ્છર', 'सफाई', 'कचरा', 'नाला', 'गंदगी', 'बदबू', 'कीटनाशक'
    ]
  },
  pdsRation: {
    category: 'pdsRation',
    code: 'FCS-RATION',
    nameEn: 'Food & Civil Supplies (PDS Ration)',
    nameHi: 'खाद्य एवं रसद विभाग (राशन)',
    nameGu: 'અન્ન અને નાગરિક પુરવઠા વિભાગ (રાશન)',
    nodalAuthority: 'Food & Consumer Protection',
    defaultSlaHours: 48,
    icon: 'inventory_2',
    color: '#DC2626',
    keywords: [
      'ration', 'dealer', 'wheat', 'rice', 'pds', 'quota', 'grain', 'gehu', 'chawal', 'ration card',
      'રાશન', 'ડીલર', 'ઘઉં', 'ચોખા', 'કાર્ડ', 'राशन', 'अनाज', 'कोटेदार', 'डीलर', 'गेहूं', 'चावल', 'बायोमेट्रिक'
    ]
  },
  pensionsWelfare: {
    category: 'pensionsWelfare',
    code: 'SWD-WELFARE',
    nameEn: 'Social Welfare & Pensions',
    nameHi: 'समाज कल्याण एवं पेंशन',
    nameGu: 'સામાજિક ન્યાય અને પેન્શન યોજના',
    nodalAuthority: 'Social Welfare Department',
    defaultSlaHours: 96,
    icon: 'volunteer_activism',
    color: '#7C3AED',
    keywords: [
      'pension', 'widow pension', 'old age', 'disability', 'subsidy', 'welfare', 'vridha', 'vidhwa',
      'પેન્શન', 'વિધવા સહાય', 'વૃદ્ધ પેન્શન', 'દિવ્યાંગ', 'पेंशन', 'वृद्धावस्था', 'विधवा', 'दिव्यांग', 'छात्रवृत्ति'
    ]
  },
  policeLawOrder: {
    category: 'policeLawOrder',
    code: 'POL-SAFETY',
    nameEn: 'Local Police & Public Safety',
    nameHi: 'स्थानीय पुलिस एवं नागरिक सुरक्षा',
    nameGu: 'સ્થાનિક પોલીસ અને જાહેર સુરક્ષા',
    nodalAuthority: 'Home & Police Department',
    defaultSlaHours: 12,
    icon: 'local_police',
    color: '#1E40AF',
    keywords: [
      'police', 'theft', 'fight', 'harassment', 'noise', 'alcohol', 'crime', 'fir', 'safety', 'thana',
      'પોલીસ', 'ચોરી', 'ધાકધમકી', 'દારૂ', 'પોલીસ સ્ટેશન', 'पुलिस', 'चोरी', 'झगड़ा', 'थाना', 'दबंगई', 'अवैध'
    ]
  },
  generalPanchayat: {
    category: 'generalPanchayat',
    code: 'PRD-PANCHAYAT',
    nameEn: 'Panchayati Raj & Rural Development',
    nameHi: 'पंचायती राज एवं ग्राम विकास',
    nameGu: 'પંચાયતી રાજ અને ગ્રામ વિકાસ',
    nodalAuthority: 'Panchayat & Rural Development',
    defaultSlaHours: 72,
    icon: 'account_balance',
    color: '#0D9488',
    keywords: [
      'panchayat', 'mukhiya', 'sarpanch', 'certificate', 'birth certificate', 'death certificate', 'street light', 'fund',
      'પંચાયત', 'સરપંચ', 'દાખલો', 'સ્ટ્રીટ લાઈટ', 'મુખિયા', 'पंचायत', 'मुखिया', 'सरपंच', 'प्रमाण पत्र', 'स्ट्रीट लाइट'
    ]
  }
};

const getDepartmentList = () => Object.values(DEPARTMENTS);

const getDepartmentByCategory = (category) => {
  return DEPARTMENTS[category] || DEPARTMENTS.generalPanchayat;
};

module.exports = {
  DEPARTMENTS,
  getDepartmentList,
  getDepartmentByCategory
};
