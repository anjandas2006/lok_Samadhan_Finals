const osmService = require('../services/osmService');
const grievanceService = require('../services/grievanceService');
const { successResponse, errorResponse } = require('../utils/response');

class MapsController {
  /**
   * GET /api/maps/reverse-geocode
   * Query: lat, lng
   */
  async reverseGeocode(req, res) {
    try {
      const lat = parseFloat(req.query.lat || req.query.latitude);
      const lon = parseFloat(req.query.lng || req.query.lon || req.query.longitude);

      if (isNaN(lat) || isNaN(lon)) {
        return errorResponse(res, 'Valid lat and lng query params are required', 400);
      }

      const location = await osmService.reverseGeocode(lat, lon);
      return successResponse(res, location, 'Reverse geocoded via OpenStreetMap Nominatim');
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * GET /api/maps/search
   * Query: q (e.g. "Ahmedabad", "Sanand", "Patna")
   */
  async searchPlace(req, res) {
    try {
      const query = req.query.q || req.query.query;
      if (!query) {
        return errorResponse(res, 'Query parameter "q" is required', 400);
      }

      const results = await osmService.searchPlace(query);
      return successResponse(res, results, `Found ${results.length} locations on OpenStreetMap`);
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * GET /api/maps/hotspots
   * Detects complaint clusters across the map
   */
  async getHotspots(req, res) {
    try {
      const radiusKm = parseFloat(req.query.radiusKm || 0.8);
      const all = await grievanceService.getAllGrievances();
      const hotspots = osmService.getHotspots(all, radiusKm);
      return successResponse(res, hotspots, `Identified ${hotspots.length} civic hotspots`);
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  /**
   * GET /api/maps/config
   * Tile configuration for frontend OpenStreetMap clients (Leaflet, MapLibre, Flutter OSM)
   */
  getTileConfig(req, res) {
    return successResponse(res, {
      tileServerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      defaultCenter: {
        latitude: 23.0225,
        longitude: 72.5714,
        zoom: 7
      }
    }, 'OpenStreetMap tile server configuration');
  }
}

module.exports = new MapsController();
