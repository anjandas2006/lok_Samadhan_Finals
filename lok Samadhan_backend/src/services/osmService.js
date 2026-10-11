const axios = require('axios');
const config = require('../config/env');
const { calculateHaversineDistanceKm, filterWithinRadius, clusterGrievances } = require('../utils/geoUtils');

class OpenStreetMapService {
  constructor() {
    this.baseUrl = config.osm.baseUrl;
    this.userAgent = config.osm.userAgent;
    // Simple in-memory cache to respect OSM Nominatim rate limits (1 req/sec)
    this.cache = new Map();
    this.cacheTtlMs = 1000 * 60 * 60 * 24; // 24 hours
  }

  /**
   * Reverse Geocodes coordinates (lat, lon) into administrative location details
   */
  async reverseGeocode(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('Valid latitude and longitude numbers are required');
    }

    // Cache key rounded to 4 decimals (~11 meters precision)
    const cacheKey = `rev_${lat.toFixed(4)}_${lon.toFixed(4)}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseUrl}/reverse`, {
        params: {
          format: 'jsonv2',
          lat,
          lon,
          addressdetails: 1,
          zoom: 18
        },
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': 'en,hi;q=0.8'
        },
        timeout: 6000
      });

      const data = response.data;
      const addr = data.address || {};

      // Map OpenStreetMap fields into Indian Administrative Structure
      const parsedLocation = {
        latitude: lat,
        longitude: lon,
        displayName: data.display_name || 'Location on OpenStreetMap',
        villageWard: addr.village || addr.suburb || addr.neighbourhood || addr.road || 'Local Ward',
        block: addr.county || addr.town || addr.subdistrict || 'Local Block/Taluka',
        district: addr.state_district || addr.city || addr.district || 'District HQ',
        state: addr.state || 'State',
        postcode: addr.postcode || null,
        country: addr.country || 'India',
        osmId: data.osm_id || null,
        osmType: data.osm_type || null
      };

      this._saveToCache(cacheKey, parsedLocation);
      return parsedLocation;
    } catch (err) {
      console.warn(`[OSM Service] Reverse geocode failed (${err.message}). Using fallback defaults.`);
      return {
        latitude: lat,
        longitude: lon,
        displayName: `Lat: ${lat}, Lon: ${lon}`,
        villageWard: 'Ward Area',
        block: 'Central Block',
        district: 'District Office',
        state: 'State',
        postcode: null,
        country: 'India',
        isFallback: true
      };
    }
  }

  /**
   * Searches for a place by name, town, or administrative boundary
   */
  async searchPlace(query) {
    if (!query || !query.trim()) {
      throw new Error('Search query is required');
    }

    const cacheKey = `search_${query.trim().toLowerCase()}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          format: 'jsonv2',
          q: query,
          addressdetails: 1,
          limit: 5,
          countrycodes: 'in' // Prioritize India
        },
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 6000
      });

      const results = (response.data || []).map((item) => ({
        displayName: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        type: item.type,
        importance: item.importance,
        address: item.address
      }));

      this._saveToCache(cacheKey, results);
      return results;
    } catch (err) {
      console.warn(`[OSM Service] Place search failed: ${err.message}`);
      return [];
    }
  }

  /**
   * Finds nearby grievances within radius (default 5 km)
   */
  filterNearbyGrievances(allGrievances, centerLat, centerLng, radiusKm = 5) {
    return filterWithinRadius(allGrievances, centerLat, centerLng, radiusKm);
  }

  /**
   * Generates GeoJSON FeatureCollection for OpenStreetMap visual layers
   */
  toGeoJson(grievances) {
    const features = grievances.map((g) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [g.longitude, g.latitude]
      },
      properties: {
        id: g.id,
        citizenName: g.citizenName,
        departmentCategory: g.departmentCategory,
        status: g.status,
        urgency: g.urgency,
        villageWard: g.villageWard,
        district: g.district,
        rawSpeechText: g.rawSpeechText,
        translatedText: g.translatedText,
        createdAt: g.createdAt,
        dueDate: g.dueDate
      }
    }));

    return {
      type: 'FeatureCollection',
      features
    };
  }

  /**
   * Identifies hotspots / clusters on OpenStreetMap
   */
  getHotspots(grievances, radiusKm = 0.5) {
    return clusterGrievances(grievances, radiusKm);
  }

  // --------------------------------------------------------------------------
  // Cache utilities
  // --------------------------------------------------------------------------
  _getFromCache(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.cacheTtlMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  _saveToCache(key, data) {
    if (this.cache.size > 2000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, { timestamp: Date.now(), data });
  }
}

module.exports = new OpenStreetMapService();
