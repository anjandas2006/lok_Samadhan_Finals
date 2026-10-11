const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  // Google Gemini API / Gemma Model
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
  },

  // Supabase Configuration
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // Direct PostgreSQL Connection
  databaseUrl: process.env.DATABASE_URL || '',

  // OpenStreetMap Nominatim Configuration
  osm: {
    baseUrl: process.env.OSM_NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org',
    userAgent: process.env.OSM_USER_AGENT || 'LokSamadhan-CivicApp/1.0 (contact@lok-samadhan.gov.in)',
  },

  // JWT Security
  jwt: {
    secret: process.env.JWT_SECRET || 'lok_samadhan_jwt_secret_dev_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

module.exports = config;
