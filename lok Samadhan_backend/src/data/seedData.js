const { DEPARTMENTS } = require('../constants/departments');

const getInitialSeedGrievances = () => {
  const now = new Date();

  return [
    {
      id: 'LS-2026-72418',
      citizenPhone: '+91 98250 12345',
      citizenName: 'Hasmukhbhai Patel',
      spokenDialect: 'Gujarati (ગુજરાતી)',
      rawSpeechText: 'અમારા ગામમાં પીવાના પાણીની મુખ્ય પાઇપલાઇન તૂટી ગઈ છે, ૪ દિવસથી પાણીનો પુરવઠો બંધ છે. સાણંદ તાલુકો.',
      translatedText: 'Main drinking water supply pipeline broken in our village, water supply suspended for 4 days. Sanand Taluka.',
      departmentCategory: 'waterSupply',
      villageWard: 'Sanand Village, Ward 3',
      block: 'Sanand Taluka',
      district: 'Ahmedabad',
      state: 'Gujarat',
      latitude: 22.9868,
      longitude: 72.3812,
      photoUrl: null,
      photoAnalysisSummary: null,
      urgency: 'high',
      aiConfidenceScore: 0.97,
      status: 'underReview',
      isHitlFallback: false,
      hitlReviewerNotes: null,
      createdAt: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
      dueDate: new Date(now.getTime() + 45 * 3600 * 1000).toISOString(),
      resolutionNote: null,
      resolutionTimestamp: null,
      escalationLevel: 0,
      assignedOfficerId: 'OFF-GUJ-102',
      assignedOfficerName: 'Rajesh Solanki (Junior Engineer PHED)',
      auditLog: [
        {
          timestamp: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
          statusLabel: 'Voice Grievance Registered',
          actor: 'Lok Samadhan Voice Gateway',
          description: 'Spoken language recognized: Gujarati (gu_IN). GPS: Lat 22.9868° N, Long 72.3812° E.'
        },
        {
          timestamp: new Date(now.getTime() - 2.9 * 3600 * 1000).toISOString(),
          statusLabel: 'Auto-Routed to PHED',
          actor: 'Lok Samadhan NLP Router',
          description: 'Routed to Drinking Water & Sanitation (PHED) Gujarat circle. Standard 48h SLA allotted.'
        },
        {
          timestamp: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
          statusLabel: 'Assigned to Field Engineer',
          actor: 'PHED Automation',
          description: 'Assigned to Rajesh Solanki (Junior Engineer PHED) for on-site pipeline inspection.'
        }
      ]
    },
    {
      id: 'LS-2026-89412',
      citizenPhone: '+91 98351 44102',
      citizenName: 'Rameshwar Mahato',
      spokenDialect: 'Bhojpuri',
      rawSpeechText: 'हमार टोला के चापाकल दु हफ्ता से बिगड़ल बा, पीने के पानी ना आवत बा। रामपुर वार्ड 4।',
      translatedText: 'Our village handpump has been broken for 2 weeks, drinking water supply stopped. Rampur Ward 4.',
      departmentCategory: 'waterSupply',
      villageWard: 'Rampur Village, Ward 4',
      block: 'Bhojpur Sadar',
      district: 'Bhojpur',
      state: 'Bihar',
      latitude: 25.5941,
      longitude: 85.1376,
      photoUrl: null,
      photoAnalysisSummary: null,
      urgency: 'high',
      aiConfidenceScore: 0.94,
      status: 'received',
      isHitlFallback: false,
      hitlReviewerNotes: null,
      createdAt: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      dueDate: new Date(now.getTime() + 44 * 3600 * 1000).toISOString(),
      resolutionNote: null,
      resolutionTimestamp: null,
      escalationLevel: 0,
      assignedOfficerId: null,
      assignedOfficerName: null,
      auditLog: [
        {
          timestamp: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
          statusLabel: 'Voice Grievance Registered',
          actor: 'Lok Samadhan Mobile Gateway',
          description: 'GPS fetched: Lat 25.5941° N, Long 85.1376° E. Spoken language detected: Bhojpuri.'
        },
        {
          timestamp: new Date(now.getTime() - 3.9 * 3600 * 1000).toISOString(),
          statusLabel: 'AI Speech-to-Text & Auto-Routed',
          actor: 'Lok Samadhan NLP Router',
          description: 'Transcribed & mapped to Drinking Water & Sanitation (PHED) Queue.'
        }
      ]
    },
    {
      id: 'LS-2026-99201',
      citizenPhone: '+91 94140 88231',
      citizenName: 'Virendra Singh',
      spokenDialect: 'Hindi (Photo Multimodal AI)',
      rawSpeechText: '[Photo Uploaded] 11KV Transformer Explosion & Wire Snap Hazard.',
      translatedText: 'High Voltage 11KV Electrical Transformer caught fire and exploded, live wire hanging over main road.',
      departmentCategory: 'electricity',
      villageWard: 'Grid Substation Colony, Ward 2',
      block: 'Bhojpur Sadar',
      district: 'Bhojpur',
      state: 'Bihar',
      latitude: 25.5992,
      longitude: 85.1412,
      photoUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=500',
      photoAnalysisSummary: 'AI Vision Analysis: Severe 11KV Transformer Fire Damage & Snapped High Tension Lines detected. High Safety Hazard.',
      imageVerificationStatus: 'verified_civic_issue',
      imageCivicCategory: 'electricity',
      imageConfidenceScore: 0.98,
      imageAuthenticityStatus: 'likely_authentic',
      imageAuthenticityDetails: 'No strong evidence of AI generation or manipulation was detected. This does not guarantee that the image is authentic.',
      imageDetectorInfo: 'Lok Samadhan Forensic Metadata Engine v2.0 + Gemini Vision',
      imageVerifiedAt: new Date(now.getTime() - 6 * 3600 * 1000).toISOString(),
      exifGpsLatitude: 25.5992,
      exifGpsLongitude: 85.1412,
      urgency: 'high',
      aiConfidenceScore: 0.98,
      status: 'inProgress',
      isHitlFallback: false,
      hitlReviewerNotes: null,
      createdAt: new Date(now.getTime() - 6 * 3600 * 1000).toISOString(),
      dueDate: new Date(now.getTime() + 18 * 3600 * 1000).toISOString(),
      resolutionNote: null,
      resolutionTimestamp: null,
      escalationLevel: 0,
      assignedOfficerId: 'OFF-BHR-404',
      assignedOfficerName: 'Amit Verma (Assistant Electrical Inspector)',
      auditLog: [
        {
          timestamp: new Date(now.getTime() - 6 * 3600 * 1000).toISOString(),
          statusLabel: 'Emergency Hazard Lodged',
          actor: 'Lok Samadhan Multimodal Gateway',
          description: 'Photo analyzed with Gemini Vision. 11KV live wire damage confirmed.'
        },
        {
          timestamp: new Date(now.getTime() - 5.8 * 3600 * 1000).toISOString(),
          statusLabel: 'High Urgency SLA Initiated',
          actor: 'DISCOM Dispatch Center',
          description: 'Immediate safety shutdown dispatched to lineman team.'
        },
        {
          timestamp: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
          statusLabel: 'Repair Crew On-Site',
          actor: 'Lineman Team Alpha',
          description: 'Feeder isolated. Replacement coil unit arriving on site.'
        }
      ]
    },
    {
      id: 'LS-2026-55104',
      citizenPhone: '+91 88765 22341',
      citizenName: 'Saraswati Devi',
      spokenDialect: 'Maithili',
      rawSpeechText: 'तीन महिना सँ विधवा पेंशन नै आएल अछि, मुखिया जी बैंक जाबय लेल कहैत छथि।',
      translatedText: 'Widow pension has not arrived for three months, local representative asks to check bank branch repeatedly.',
      departmentCategory: 'pensionsWelfare',
      villageWard: 'Madhubani Rural, Ward 7',
      block: 'Rajnagar Block',
      district: 'Madhubani',
      state: 'Bihar',
      latitude: 26.3541,
      longitude: 86.0712,
      photoUrl: null,
      photoAnalysisSummary: null,
      urgency: 'medium',
      aiConfidenceScore: 0.91,
      status: 'received',
      isHitlFallback: false,
      hitlReviewerNotes: null,
      createdAt: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
      dueDate: new Date(now.getTime() + 84 * 3600 * 1000).toISOString(),
      resolutionNote: null,
      resolutionTimestamp: null,
      escalationLevel: 0,
      assignedOfficerId: null,
      assignedOfficerName: null,
      auditLog: [
        {
          timestamp: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
          statusLabel: 'Voice Grievance Registered',
          actor: 'Lok Samadhan Gateway',
          description: 'Spoken language detected: Maithili (bih_IN). Auto-routed to Social Welfare.'
        }
      ]
    },
    {
      id: 'LS-2026-44321',
      citizenPhone: '+91 99042 56789',
      citizenName: 'Bhaveshbhai Joshi',
      spokenDialect: 'Gujarati (ગુજરાતી)',
      rawSpeechText: 'મેઇન બજાર રોડ પર મોટો ખાડો પડી ગયો છે, ગઈકાલે એક બાઇક સવાર પડી ગયો. તરત રિપેરિંગ જરૂરી.',
      translatedText: 'Large deep pothole on Main Market Road, yesterday a motorcyclist met with an accident. Immediate repair required.',
      departmentCategory: 'roadsInfrastructure',
      villageWard: 'Old City Market, Station Road',
      block: 'Gandhinagar Taluka',
      district: 'Gandhinagar',
      state: 'Gujarat',
      latitude: 23.2156,
      longitude: 72.6369,
      photoUrl: null,
      photoAnalysisSummary: null,
      urgency: 'high',
      aiConfidenceScore: 0.95,
      status: 'underReview',
      isHitlFallback: false,
      hitlReviewerNotes: null,
      createdAt: new Date(now.getTime() - 10 * 3600 * 1000).toISOString(),
      dueDate: new Date(now.getTime() + 62 * 3600 * 1000).toISOString(),
      resolutionNote: null,
      resolutionTimestamp: null,
      escalationLevel: 0,
      assignedOfficerId: 'OFF-GUJ-205',
      assignedOfficerName: 'Ketan Mehta (Executive Engineer PWD)',
      auditLog: [
        {
          timestamp: new Date(now.getTime() - 10 * 3600 * 1000).toISOString(),
          statusLabel: 'Road Defect Registered',
          actor: 'Citizen Mobile App',
          description: 'Urgent road repair demand logged. Location: Gandhinagar Old City Market.'
        }
      ]
    },
    {
      id: 'LS-2026-11029',
      citizenPhone: '+91 91234 56789',
      citizenName: 'Anjali Kumari',
      spokenDialect: 'Hindi',
      rawSpeechText: 'सरकारी राशन दुकान पर डीलर गेहूं कम तौलता है और बायोमेट्रिक लगाकर वापस भेज देता है।',
      translatedText: 'PDS ration dealer distributes lesser grain weight and turns away beneficiaries after taking biometric scans.',
      departmentCategory: 'pdsRation',
      villageWard: 'Daudnagar Block, Ward 12',
      block: 'Daudnagar',
      district: 'Aurangabad',
      state: 'Bihar',
      latitude: 25.0256,
      longitude: 84.4025,
      photoUrl: null,
      photoAnalysisSummary: null,
      urgency: 'medium',
      aiConfidenceScore: 0.93,
      status: 'escalated',
      isHitlFallback: false,
      hitlReviewerNotes: 'SLA timer exceeded without response from District Supply Officer. Auto-escalated to Sub-Divisional Magistrate.',
      createdAt: new Date(now.getTime() - 52 * 3600 * 1000).toISOString(),
      dueDate: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      resolutionNote: null,
      resolutionTimestamp: null,
      escalationLevel: 1,
      assignedOfficerId: 'OFF-BHR-099',
      assignedOfficerName: 'Sub-Divisional Magistrate (Aurangabad)',
      auditLog: [
        {
          timestamp: new Date(now.getTime() - 52 * 3600 * 1000).toISOString(),
          statusLabel: 'Grievance Registered',
          actor: 'Lok Samadhan Web Portal',
          description: 'Ration quantity discrepancy logged.'
        },
        {
          timestamp: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
          statusLabel: 'SLA Breached & Escalated',
          actor: 'Lok Samadhan SLA Sentinel',
          description: 'Overdue past 48 hours without closure. Escalated to Sub-Divisional Magistrate Level 1.'
        }
      ]
    },
    {
      id: 'LS-2026-30219',
      citizenPhone: '+91 94312 99881',
      citizenName: 'Manoj Kumar Sinha',
      spokenDialect: 'Hindi',
      rawSpeechText: 'सब्जी मंडी के पास नाला जाम हो गया है, गंदा पानी दुकानों में घुस रहा है। दुर्गंध से बीमारी का खतरा।',
      translatedText: 'Main drain clogged near Vegetable Market, contaminated drain water overflowing into shops with health hazard.',
      departmentCategory: 'sanitationHealth',
      villageWard: 'Sabzi Mandi, Ward 15',
      block: 'Patna Sadar',
      district: 'Patna',
      state: 'Bihar',
      latitude: 25.6100,
      longitude: 85.1415,
      photoUrl: null,
      photoAnalysisSummary: null,
      urgency: 'medium',
      aiConfidenceScore: 0.96,
      status: 'resolved',
      isHitlFallback: false,
      hitlReviewerNotes: null,
      createdAt: new Date(now.getTime() - 36 * 3600 * 1000).toISOString(),
      dueDate: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
      resolutionNote: 'Municipal Corporation sanitation squad deployed with suction tanker. Silt cleared and drain flow restored successfully.',
      resolutionTimestamp: new Date(now.getTime() - 14 * 3600 * 1000).toISOString(),
      escalationLevel: 0,
      assignedOfficerId: 'OFF-PAT-312',
      assignedOfficerName: 'Suresh Prasad (Sanitation Inspector)',
      auditLog: [
        {
          timestamp: new Date(now.getTime() - 36 * 3600 * 1000).toISOString(),
          statusLabel: 'Grievance Registered',
          actor: 'Lok Samadhan Mobile App',
          description: 'Sanitation complaint lodged for Sabzi Mandi Ward 15.'
        },
        {
          timestamp: new Date(now.getTime() - 14 * 3600 * 1000).toISOString(),
          statusLabel: 'Resolved on Site',
          actor: 'Suresh Prasad (Sanitation Inspector)',
          description: 'Work verified with photographic proof. Drain cleared.'
        }
      ]
    }
  ];
};

module.exports = {
  getInitialSeedGrievances
};
