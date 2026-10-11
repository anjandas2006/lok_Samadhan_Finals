const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const config = require('./config/env');
const routes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Security Headers (Configured to allow Leaflet OpenStreetMap CDN and tiles)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com', 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:', '*.tile.openstreetmap.org'],
        connectSrc: ["'self'", 'https:', 'http:']
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-user-id', 'Accept', 'Origin']
  })
);

// Body Parsers
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Logging
if (config.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate Limiting
app.use('/api', apiLimiter);

// Serve static frontend files (Lok Samadhan Web Dashboard & OpenStreetMap Explorer)
app.use(express.static(path.join(__dirname, '../public')));

// Mount API routes under /api
app.use('/api', routes);

// Fallback for root route if requested directly
app.get('/api-info', (req, res) => {
  res.json({
    name: 'Lok Samadhan Enterprise Civic Redressal API',
    version: '1.0.0',
    documentation: '/dashboard or /',
    healthCheck: '/api/health',
    endpoints: {
      grievances: '/api/grievances',
      aiClassification: '/api/ai/classify',
      aiChat: '/api/ai/chat',
      mapsReverseGeocode: '/api/maps/reverse-geocode?lat=25.5941&lng=85.1376',
      mapsGeoJson: '/api/grievances/geojson',
      departments: '/api/departments'
    }
  });
});

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
