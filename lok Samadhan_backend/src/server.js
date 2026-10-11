const app = require('./app');
const config = require('./config/env');
const { getDatabaseMode } = require('./config/database');

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log('\n=============================================================');
  console.log('       🇮🇳 LOK SAMADHAN - CIVIC REDRESSAL BACKEND 🇮🇳        ');
  console.log('=============================================================');
  console.log(`🚀 Server Running on   : http://localhost:${config.port}`);
  console.log(`📱 Mobile Wi-Fi Access : http://10.90.141.134:${config.port}/api`);
  console.log(`🌐 Web Dashboard & Map : http://localhost:${config.port}/`);
  console.log(`🩺 Health Check        : http://localhost:${config.port}/api/health`);
  console.log(`🗄️  Database Mode       : ${getDatabaseMode().toUpperCase()}`);
  console.log(`🤖 AI Engine           : ${config.gemini.model} (${config.gemini.apiKey ? 'Gemini API Connected' : 'Local NLP Fallback'})`);
  console.log(`🗺️  Maps Provider       : OpenStreetMap (Nominatim API)`);
  console.log(`☁️  Deployment Target   : DigitalOcean Ready (Docker / App Platform)`);
  console.log('=============================================================\n');
});

// Graceful shutdown handling for DigitalOcean Docker / Droplet PM2
const handleShutdown = (signal) => {
  console.log(`\n[Server] Received ${signal}. Gracefully closing HTTP server...`);
  server.close(() => {
    console.log('[Server] HTTP server closed cleanly. Exiting process.');
    process.exit(0);
  });

  // Force shutdown after 10s if stuck
  setTimeout(() => {
    console.error('[Server] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
