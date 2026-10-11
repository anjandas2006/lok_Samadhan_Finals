const express = require('express');
const router = express.Router();

const grievanceRoutes = require('./grievanceRoutes');
const aiRoutes = require('./aiRoutes');
const mapsRoutes = require('./mapsRoutes');
const departmentRoutes = require('./departmentRoutes');
const authRoutes = require('./authRoutes');
const rewardsRoutes = require('./rewardsRoutes');

const { getDatabaseMode } = require('../config/database');
const config = require('../config/env');

// Health Check Endpoint (essential for DigitalOcean App Platform and monitoring)
router.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'healthy',
    service: 'Lok Samadhan Enterprise Grievance Redressal Backend',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    databaseMode: getDatabaseMode(),
    aiModel: config.gemini.model,
    aiProvider: config.gemini.apiKey ? 'Gemini API (Active)' : 'Local Heuristic NLP (Fallback)',
    osmService: 'OpenStreetMap Nominatim Connected',
    deployment: 'DigitalOcean Ready',
    timestamp: new Date().toISOString()
  });
});

// Sub-routes mounting
router.use('/grievances', grievanceRoutes);
router.use('/ai', aiRoutes);
router.use('/maps', mapsRoutes);
router.use('/departments', departmentRoutes);
router.use('/auth', authRoutes);
router.use('/rewards', rewardsRoutes);

module.exports = router;
