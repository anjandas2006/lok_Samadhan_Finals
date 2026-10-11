const supabaseService = require('./supabaseService');
const aiService = require('./aiService');
const osmService = require('./osmService');
const rewardsService = require('./rewardsService');
const { getDepartmentByCategory } = require('../constants/departments');
const { URGENCY_LEVELS } = require('../constants/statuses');

class GrievanceService {
  /**
   * Retrieves all grievances with SLA breach checks
   */
  async getAllGrievances(filters = {}) {
    const list = await supabaseService.getGrievances(filters);
    const now = new Date();

    // Check SLA status dynamically
    return list.map((g) => {
      const isBreached = g.status !== 'resolved' && new Date(g.dueDate) < now;
      return {
        ...g,
        isSlaBreached: isBreached,
        remainingSlaHours: g.status === 'resolved'
          ? 0
          : Math.max(0, Math.round((new Date(g.dueDate) - now) / (1000 * 3600)))
      };
    });
  }

  /**
   * Retrieves single grievance by ID with department info and SLA calculations
   */
  async getGrievanceById(id) {
    const g = await supabaseService.getGrievanceById(id);
    if (!g) return null;

    const now = new Date();
    const isBreached = g.status !== 'resolved' && new Date(g.dueDate) < now;
    const dept = getDepartmentByCategory(g.departmentCategory);

    return {
      ...g,
      departmentInfo: dept,
      isSlaBreached: isBreached,
      remainingSlaHours: g.status === 'resolved'
        ? 0
        : Math.max(0, Math.round((new Date(g.dueDate) - now) / (1000 * 3600)))
    };
  }

  /**
   * Creates a new civic grievance
   * - Performs AI classification if category is missing
   * - Performs OSM reverse geocoding if lat/lng are provided
   * - Calculates SLA Due Date
   */
  async createGrievance(payload) {
    const now = new Date();
    let category = payload.departmentCategory;
    let urgency = payload.urgency || 'medium';
    let confidence = payload.aiConfidenceScore || 0.95;
    let dialect = payload.spokenDialect || 'Hindi';
    let translated = payload.translatedText;
    let isHitl = payload.isHitlFallback || false;

    // 1. If category or translation is not provided, trigger Gemma / Gemini AI
    if (!category || !translated) {
      const aiResult = await aiService.classifyGrievance(payload.rawSpeechText, {
        villageWard: payload.villageWard,
        block: payload.block,
        district: payload.district,
        state: payload.state
      });

      category = category || aiResult.departmentCategory;
      urgency = urgency || aiResult.urgency;
      confidence = aiResult.confidenceScore || 0.92;
      dialect = dialect || aiResult.spokenDialect;
      translated = translated || aiResult.translatedText;
      isHitl = aiResult.isHitlRequired || confidence < 0.75;
    }

    // 2. Authoritative GPS Coordinates validation & reverse geocoding
    let lat = null;
    let lon = null;
    let gpsAccuracyM = null;
    const locationCapturedAt = payload.locationCapturedAt || payload.location_captured_at || now.toISOString();

    if (payload.latitude !== undefined && payload.latitude !== null && payload.latitude !== '') {
      const parsedLat = parseFloat(payload.latitude);
      if (!isNaN(parsedLat) && parsedLat >= -90 && parsedLat <= 90) {
        lat = parsedLat;
      }
    }

    if (payload.longitude !== undefined && payload.longitude !== null && payload.longitude !== '') {
      const parsedLon = parseFloat(payload.longitude);
      if (!isNaN(parsedLon) && parsedLon >= -180 && parsedLon <= 180) {
        lon = parsedLon;
      }
    }

    if (payload.gpsAccuracyM !== undefined && payload.gpsAccuracyM !== null && payload.gpsAccuracyM !== '') {
      const parsedAcc = parseFloat(payload.gpsAccuracyM);
      if (!isNaN(parsedAcc) && parsedAcc >= 0) {
        gpsAccuracyM = parsedAcc;
      }
    } else if (payload.gps_accuracy_m !== undefined && payload.gps_accuracy_m !== null && payload.gps_accuracy_m !== '') {
      const parsedAcc = parseFloat(payload.gps_accuracy_m);
      if (!isNaN(parsedAcc) && parsedAcc >= 0) {
        gpsAccuracyM = parsedAcc;
      }
    }

    let villageWard = payload.villageWard;
    let block = payload.block;
    let district = payload.district;
    let state = payload.state;

    // Only reverse geocode if actual GPS coordinates exist
    if (lat !== null && lon !== null) {
      if (!villageWard || !district || villageWard === 'Unknown' || villageWard === 'Local Ward') {
        try {
          const osmLocation = await osmService.reverseGeocode(lat, lon);
          villageWard = villageWard && villageWard !== 'Unknown' && villageWard !== 'Local Ward' ? villageWard : osmLocation.villageWard;
          block = block && block !== 'Local Block' ? block : osmLocation.block;
          district = district && district !== 'Local District' ? district : osmLocation.district;
          state = state && state !== 'Local State' ? state : osmLocation.state;
        } catch (err) {
          console.warn(`[GrievanceService] Reverse geocode fallback: ${err.message}`);
        }
      }
    }

    // 3. Compute Department SLA Due Date
    const dept = getDepartmentByCategory(category);
    const urgencyConfig = URGENCY_LEVELS[urgency] || URGENCY_LEVELS.medium;
    const effectiveSlaHours = Math.round(dept.defaultSlaHours * urgencyConfig.slaMultiplier);
    const dueDate = new Date(now.getTime() + effectiveSlaHours * 3600 * 1000);

    // Initial status
    const initialStatus = isHitl ? 'hitlReview' : 'received';
    const id = payload.id || `LS-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const latDir = lat !== null ? (lat >= 0 ? 'N' : 'S') : '';
    const lonDir = lon !== null ? (lon >= 0 ? 'E' : 'W') : '';
    const gpsLogStr = (lat !== null && lon !== null)
      ? `GPS: Lat ${Math.abs(lat).toFixed(4)}° ${latDir}, Long ${Math.abs(lon).toFixed(4)}° ${lonDir}${gpsAccuracyM !== null ? ` (Accuracy: ±${Math.round(gpsAccuracyM)}m)` : ''}`
      : 'GPS: Location not available';

    const initialAuditLogs = [
      {
        timestamp: now.toISOString(),
        statusLabel: 'Grievance Registered',
        actor: 'Lok Samadhan Gateway',
        description: `Spoken language detected: ${dialect}. ${gpsLogStr}.`
      },
      {
        timestamp: new Date(now.getTime() + 1000).toISOString(),
        statusLabel: isHitl ? 'Routed to HITL Queue' : `Auto-Routed to ${dept.code}`,
        actor: 'Lok Samadhan AI Router',
        description: isHitl
          ? 'Confidence score below threshold. Routed for manual Human-In-The-Loop review.'
          : `Classified as ${dept.nameEn}. Allotted SLA: ${effectiveSlaHours} hours.`
      }
    ];

    const newRecord = {
      id,
      citizenPhone: payload.citizenPhone || '+91 98000 00000',
      citizenName: payload.citizenName || 'Citizen Nagarik',
      spokenDialect: dialect,
      rawSpeechText: payload.rawSpeechText,
      translatedText: translated,
      departmentCategory: category,
      villageWard: villageWard || 'Area Pending Verification',
      block: block || 'Block Unspecified',
      district: district || 'District Unspecified',
      state: state || 'State Unspecified',
      latitude: lat,
      longitude: lon,
      gpsAccuracyM,
      locationCapturedAt,
      photoUrl: payload.photoUrl || null,
      photoAnalysisSummary: payload.photoAnalysisSummary || null,
      imageVerificationStatus: payload.imageVerificationStatus || payload.image_verification_status || (payload.photoUrl ? 'unverified' : null),
      imageCivicCategory: payload.imageCivicCategory || payload.image_civic_category || null,
      imageConfidenceScore: payload.imageConfidenceScore !== undefined ? payload.imageConfidenceScore : (payload.image_confidence_score !== undefined ? payload.image_confidence_score : null),
      imageAuthenticityStatus: payload.imageAuthenticityStatus || payload.image_authenticity_status || (payload.photoUrl ? 'unavailable' : null),
      imageAuthenticityDetails: payload.imageAuthenticityDetails || payload.image_authenticity_details || null,
      imageDetectorInfo: payload.imageDetectorInfo || payload.image_detector_info || null,
      imageVerifiedAt: payload.imageVerifiedAt || payload.image_verified_at || (payload.photoUrl ? now.toISOString() : null),
      exifGpsLatitude: payload.exifGpsLatitude !== undefined ? payload.exifGpsLatitude : (payload.exif_gps_latitude !== undefined ? payload.exif_gps_latitude : null),
      exifGpsLongitude: payload.exifGpsLongitude !== undefined ? payload.exifGpsLongitude : (payload.exif_gps_longitude !== undefined ? payload.exif_gps_longitude : null),
      urgency,
      aiConfidenceScore: confidence,
      status: initialStatus,
      isHitlFallback: isHitl,
      hitlReviewerNotes: isHitl ? 'Awaiting officer categorization review' : null,
      createdAt: now.toISOString(),
      dueDate: dueDate.toISOString(),
      resolutionNote: null,
      resolutionTimestamp: null,
      escalationLevel: 0,
      assignedOfficerId: null,
      assignedOfficerName: null,
      auditLog: initialAuditLogs
    };

    const created = await supabaseService.createGrievance(newRecord);

    try {
      const citizenIdentifier = payload.userId || 'default_citizen';
      const rewardResult = await rewardsService.awardComplaintReward(
        citizenIdentifier,
        created.id,
        `Eligible Civic Complaint #${created.id}`
      );
      return {
        ...created,
        rewardInfo: rewardResult
      };
    } catch (rewardErr) {
      console.warn(`[GrievanceService] Auto-award reward note: ${rewardErr.message}`);
      return created;
    }
  }

  /**
   * Officer action: flags an image for manual review or updates verification state
   */
  async flagImageReview(id, { note = '', verificationStatus = 'flagged_manual_review', authenticityStatus, officerName = 'Reviewing Officer' } = {}) {
    const existing = await supabaseService.getGrievanceById(id);
    if (!existing) {
      throw new Error(`Grievance with ID ${id} not found`);
    }

    const updates = {
      imageVerificationStatus: verificationStatus,
      isHitlFallback: true,
      hitlReviewerNotes: note || existing.hitlReviewerNotes || 'Flagged for image verification review.'
    };
    if (authenticityStatus) {
      updates.imageAuthenticityStatus = authenticityStatus;
    }

    const auditStep = {
      timestamp: new Date().toISOString(),
      statusLabel: 'Image Verification Flagged',
      actor: officerName,
      description: note || `Image flagged as ${verificationStatus} for manual review.`
    };

    await supabaseService.addAuditLog(id, auditStep);
    return await supabaseService.updateGrievance(id, updates);
  }

  /**
   * Updates status of grievance (e.g. Under Investigation, In Progress, Resolved)
   */
  async updateStatus(id, newStatus, { actor = 'Government Officer', note = '', officerId = null, officerName = null } = {}) {
    const existing = await supabaseService.getGrievanceById(id);
    if (!existing) {
      throw new Error(`Grievance with ID ${id} not found`);
    }

    const updates = {
      status: newStatus
    };

    if (newStatus === 'resolved') {
      updates.resolutionNote = note || 'Issue resolved and field work verified.';
      updates.resolutionTimestamp = new Date().toISOString();
    }

    if (officerId) updates.assignedOfficerId = officerId;
    if (officerName) updates.assignedOfficerName = officerName;

    // Add audit log
    await supabaseService.addAuditLog(id, {
      statusLabel: `Status Updated to ${newStatus}`,
      actor,
      description: note || `Grievance status transitioned from ${existing.status} to ${newStatus}.`
    });

    return await supabaseService.updateGrievance(id, updates);
  }

  /**
   * Escalates an overdue or breached grievance
   */
  async escalateGrievance(id, { reason = 'SLA Breached - Auto Escalation', actor = 'Lok Samadhan SLA Sentinel' } = {}) {
    const existing = await supabaseService.getGrievanceById(id);
    if (!existing) {
      throw new Error(`Grievance with ID ${id} not found`);
    }

    const newLevel = (existing.escalationLevel || 0) + 1;
    const updates = {
      status: 'escalated',
      escalationLevel: newLevel
    };

    await supabaseService.addAuditLog(id, {
      statusLabel: `Escalated to Level ${newLevel}`,
      actor,
      description: reason
    });

    return await supabaseService.updateGrievance(id, updates);
  }

  /**
   * Proximity query using OpenStreetMap coordinates
   */
  async getNearby(lat, lon, radiusKm = 5) {
    const all = await supabaseService.getGrievances();
    return osmService.filterNearbyGrievances(all, lat, lon, radiusKm);
  }
}

module.exports = new GrievanceService();
