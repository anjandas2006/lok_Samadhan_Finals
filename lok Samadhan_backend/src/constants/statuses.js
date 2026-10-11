/**
 * Lok Samadhan - Grievance Statuses, Urgency Levels, and Personas
 */

const GRIEVANCE_STATUSES = {
  hitlReview: {
    key: 'hitlReview',
    labelEn: 'HITL Review Pending',
    labelHi: 'मानव समीक्षा लंबित',
    labelGu: 'માનવ સમીક્ષા બાકી',
    badgeColor: '#EAB308',
    isFinal: false
  },
  received: {
    key: 'received',
    labelEn: 'Received',
    labelHi: 'प्राप्त हुई',
    labelGu: 'મળેલ છે',
    badgeColor: '#3B82F6',
    isFinal: false
  },
  underReview: {
    key: 'underReview',
    labelEn: 'Under Investigation',
    labelHi: 'जांच जारी',
    labelGu: 'તપાસ ચાલુ છે',
    badgeColor: '#8B5CF6',
    isFinal: false
  },
  inProgress: {
    key: 'inProgress',
    labelEn: 'In Progress',
    labelHi: 'कार्य प्रगति पर',
    labelGu: 'કામગીરી પ્રગતિમાં છે',
    badgeColor: '#F59E0B',
    isFinal: false
  },
  resolved: {
    key: 'resolved',
    labelEn: 'Resolved',
    labelHi: 'निस्तारित / हल',
    labelGu: 'નિકાલ થયેલ / પૂર્ણ',
    badgeColor: '#10B981',
    isFinal: true
  },
  escalated: {
    key: 'escalated',
    labelEn: 'SLA Breached & Escalated',
    labelHi: 'समय-सीमा उल्लंघन (उच्च अधिकारी को प्रेषित)',
    labelGu: 'સમય-મર્યાદા ઉલ્લંઘન (ઉચ્ચ અધિકારીને મોકલેલ)',
    badgeColor: '#EF4444',
    isFinal: false
  }
};

const URGENCY_LEVELS = {
  low: {
    key: 'low',
    labelEn: 'LOW URGENCY',
    labelHi: 'सामान्य प्राथमिकता',
    labelGu: 'સામાન્ય પ્રાથમિકતા',
    color: '#10B981',
    slaMultiplier: 1.5
  },
  medium: {
    key: 'medium',
    labelEn: 'MEDIUM URGENCY',
    labelHi: 'मध्यम प्राथमिकता',
    labelGu: 'મધ્યમ પ્રાથમિકતા',
    color: '#F59E0B',
    slaMultiplier: 1.0
  },
  high: {
    key: 'high',
    labelEn: 'HIGH URGENCY',
    labelHi: 'उच्च प्राथमिकता',
    labelGu: 'ઉચ્ચ પ્રાથમિકતા',
    color: '#EF4444',
    slaMultiplier: 0.5
  }
};

const USER_PERSONAS = {
  citizen: 'citizen',
  governmentOfficial: 'governmentOfficial',
  admin: 'admin'
};

module.exports = {
  GRIEVANCE_STATUSES,
  URGENCY_LEVELS,
  USER_PERSONAS
};
