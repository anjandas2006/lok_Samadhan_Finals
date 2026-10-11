const express = require('express');
const router = express.Router();
const mapsController = require('../controllers/mapsController');

// GET /api/maps/reverse-geocode - OSM Nominatim reverse geocode
router.get('/reverse-geocode', (req, res) => mapsController.reverseGeocode(req, res));

// GET /api/maps/search - OSM Nominatim search/autocomplete
router.get('/search', (req, res) => mapsController.searchPlace(req, res));

// GET /api/maps/hotspots - Proximity cluster detection
router.get('/hotspots', (req, res) => mapsController.getHotspots(req, res));

// GET /api/maps/config - Tile config for Leaflet/Flutter OSM
router.get('/config', (req, res) => mapsController.getTileConfig(req, res));

module.exports = router;
