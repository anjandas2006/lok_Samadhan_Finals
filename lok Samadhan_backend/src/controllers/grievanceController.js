const grievanceService = require('../services/grievanceService');
const supabaseService = require('../services/supabaseService');
const osmService = require('../services/osmService');
const { successResponse, errorResponse } = require('../utils/response');

class GrievanceController {
  /**
   * GET /api/grievances
   * Query params: status, departmentCategory, urgency, district, citizenPhone, search
   */
  async getGrievances(req, res) {
    try {
      const filters = {
        status: req.query.status,
        departmentCategory: req.query.departmentCategory || req.query.department,
        urgency: req.query.urgency,
        district: req.query.district,
        citizenPhone: req.query.citizenPhone,
        search: req.query.search
      };

      const grievances = await grievanceService.getAllGrievances(filters);
      return successResponse(res, grievances, `Fetched ${grievances.length} grievances successfully`);
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * GET /api/grievances/:id
   */
  async getGrievanceById(req, res) {
    try {
      const grievance = await grievanceService.getGrievanceById(req.params.id);
      if (!grievance) {
        return errorResponse(res, `Grievance ${req.params.id} not found`, 404);
      }
      return successResponse(res, grievance, 'Grievance retrieved successfully');
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * POST /api/grievances
   * Lodges a new grievance
   */
  async createGrievance(req, res) {
    try {
      const {
        id,
        userId,
        rawSpeechText,
        citizenPhone,
        citizenName,
        spokenDialect,
        departmentCategory,
        villageWard,
        block,
        district,
        state,
        latitude,
        longitude,
        gpsAccuracyM,
        gps_accuracy_m,
        locationCapturedAt,
        location_captured_at,
        photoUrl,
        photoAnalysisSummary,
        imageVerificationStatus,
        image_verification_status,
        imageCivicCategory,
        image_civic_category,
        imageConfidenceScore,
        image_confidence_score,
        imageAuthenticityStatus,
        image_authenticity_status,
        imageAuthenticityDetails,
        image_authenticity_details,
        imageDetectorInfo,
        image_detector_info,
        imageVerifiedAt,
        image_verified_at,
        exifGpsLatitude,
        exif_gps_latitude,
        exifGpsLongitude,
        exif_gps_longitude,
        urgency
      } = req.body;

      if (!rawSpeechText) {
        return errorResponse(res, 'rawSpeechText is required to lodge a grievance', 400);
      }

      const created = await grievanceService.createGrievance({
        id,
        userId: userId || (req.user && req.user.id) || null,
        rawSpeechText,
        citizenPhone,
        citizenName,
        spokenDialect,
        departmentCategory,
        villageWard,
        block,
        district,
        state,
        latitude,
        longitude,
        gpsAccuracyM: gpsAccuracyM ?? gps_accuracy_m,
        locationCapturedAt: locationCapturedAt ?? location_captured_at,
        photoUrl,
        photoAnalysisSummary,
        imageVerificationStatus: imageVerificationStatus ?? image_verification_status,
        imageCivicCategory: imageCivicCategory ?? image_civic_category,
        imageConfidenceScore: imageConfidenceScore ?? image_confidence_score,
        imageAuthenticityStatus: imageAuthenticityStatus ?? image_authenticity_status,
        imageAuthenticityDetails: imageAuthenticityDetails ?? image_authenticity_details,
        imageDetectorInfo: imageDetectorInfo ?? image_detector_info,
        imageVerifiedAt: imageVerifiedAt ?? image_verified_at,
        exifGpsLatitude: exifGpsLatitude ?? exif_gps_latitude,
        exifGpsLongitude: exifGpsLongitude ?? exif_gps_longitude,
        urgency
      });

      return successResponse(res, created, 'Grievance lodged successfully', 201);
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * PATCH /api/grievances/:id/flag-review
   * Allows officer to flag suspicious/inconclusive image for manual review
   */
  async flagImageReview(req, res) {
    try {
      const { id } = req.params;
      const { note, verificationStatus, authenticityStatus, officerName } = req.body;

      const updated = await grievanceService.flagImageReview(id, {
        note,
        verificationStatus: verificationStatus || 'flagged_manual_review',
        authenticityStatus,
        officerName: officerName || 'Officer'
      });

      return successResponse(res, updated, 'Grievance image verification updated for manual review');
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  /**
   * PATCH /api/grievances/:id/status
   * Updates status (underReview, inProgress, resolved, escalated)
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, note, actor, officerId, officerName } = req.body;

      if (!status) {
        return errorResponse(res, 'status is required', 400);
      }

      const updated = await grievanceService.updateStatus(id, status, {
        note,
        actor: actor || 'Government Official',
        officerId,
        officerName
      });

      return successResponse(res, updated, `Status updated to ${status}`);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  /**
   * POST /api/grievances/:id/escalate
   */
  async escalate(req, res) {
    try {
      const { id } = req.params;
      const { reason, actor } = req.body;

      const escalated = await grievanceService.escalateGrievance(id, {
        reason: reason || 'SLA Overdue',
        actor: actor || 'SLA Escalation Sentinel'
      });

      return successResponse(res, escalated, 'Grievance escalated successfully');
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  /**
   * GET /api/grievances/nearby
   * Query params: lat, lng, radiusKm
   */
  async getNearby(req, res) {
    try {
      const lat = parseFloat(req.query.lat || req.query.latitude);
      const lon = parseFloat(req.query.lng || req.query.lon || req.query.longitude);
      const radiusKm = parseFloat(req.query.radiusKm || req.query.radius || 5);

      if (isNaN(lat) || isNaN(lon)) {
        return errorResponse(res, 'Valid lat and lng query parameters are required', 400);
      }

      const nearby = await grievanceService.getNearby(lat, lon, radiusKm);
      return successResponse(res, nearby, `Found ${nearby.length} grievances within ${radiusKm}km`);
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * GET /api/grievances/stats
   * Aggregated dashboard analytics
   */
  async getStats(req, res) {
    try {
      const stats = await supabaseService.getStats();
      return successResponse(res, stats, 'Dashboard statistics fetched successfully');
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * GET /api/grievances/geojson
   * Returns GeoJSON format for OpenStreetMap Leaflet layers
   */
  async getGeoJson(req, res) {
    try {
      const all = await grievanceService.getAllGrievances();
      const geoJson = osmService.toGeoJson(all);
      return res.status(200).json(geoJson);
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }
}

module.exports = new GrievanceController();
