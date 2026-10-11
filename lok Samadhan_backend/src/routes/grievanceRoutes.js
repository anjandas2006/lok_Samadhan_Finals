const express = require('express');
const router = express.Router();
const grievanceController = require('../controllers/grievanceController');

// GET /api/grievances - Filtered list of grievances
router.get('/', (req, res) => grievanceController.getGrievances(req, res));

// GET /api/grievances/stats - Aggregated metrics
router.get('/stats', (req, res) => grievanceController.getStats(req, res));

// GET /api/grievances/nearby - Geospatial search
router.get('/nearby', (req, res) => grievanceController.getNearby(req, res));

// GET /api/grievances/geojson - OpenStreetMap GeoJSON feature collection
router.get('/geojson', (req, res) => grievanceController.getGeoJson(req, res));

// GET /api/grievances/:id - Single grievance details
router.get('/:id', (req, res) => grievanceController.getGrievanceById(req, res));

// POST /api/grievances - Lodge a new grievance
router.post('/', (req, res) => grievanceController.createGrievance(req, res));

// PATCH /api/grievances/:id/status - Update grievance status
router.patch('/:id/status', (req, res) => grievanceController.updateStatus(req, res));

// PATCH /api/grievances/:id/flag-review - Flag image for manual review
router.patch('/:id/flag-review', (req, res) => grievanceController.flagImageReview(req, res));

// POST /api/grievances/:id/escalate - Escalate grievance past SLA
router.post('/:id/escalate', (req, res) => grievanceController.escalate(req, res));

module.exports = router;
