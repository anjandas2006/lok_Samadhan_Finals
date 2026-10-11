const fs = require('fs');
const path = require('path');
const config = require('../config/env');
const { pgPool, supabaseClient, getDatabaseMode } = require('../config/database');

async function runSeed() {
  console.log('[Seed] Starting database migration & seed process...');
  const mode = getDatabaseMode();

  if (mode === 'postgres' && pgPool) {
    try {
      const schemaSql = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf-8');
      const seedSql = fs.readFileSync(path.join(__dirname, '../../database/seed.sql'), 'utf-8');

      console.log('[Seed] Applying schema.sql to PostgreSQL...');
      await pgPool.query(schemaSql);
      console.log('[Seed] Applying seed.sql to PostgreSQL...');
      await pgPool.query(seedSql);
      console.log('✅ PostgreSQL schema and seed successfully applied!');
      process.exit(0);
    } catch (err) {
      console.error('[Seed] PostgreSQL seed error:', err.message);
      process.exit(1);
    }
  } else if (mode === 'supabase' && supabaseClient) {
    console.log('[Seed] Supabase connected. For Supabase projects:');
    console.log('👉 Please paste database/schema.sql and database/seed.sql directly into the Supabase SQL Editor:');
    console.log(`   URL: ${config.supabase.url}`);
    console.log('✅ Local seed data is also available in-memory for immediate runtime.');
    process.exit(0);
  } else {
    console.log('[Seed] Currently running in IN-MEMORY mode.');
    console.log('✅ In-memory store already pre-loaded with initial seed grievances and 8 civic departments.');
    process.exit(0);
  }
}

runSeed();
