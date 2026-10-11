const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const config = require('./env');
const { getInitialSeedGrievances } = require('../data/seedData');
const { getDepartmentList } = require('../constants/departments');

let supabaseClient = null;
let pgPool = null;
let activeDatabaseMode = 'in-memory'; // 'supabase' | 'postgres' | 'in-memory'

// In-Memory store for development / zero-configuration fallback
const inMemoryStore = {
  departments: getDepartmentList(),
  grievances: getInitialSeedGrievances(),
  users: [
    {
      id: 'OFF-GUJ-102',
      phone: '+91 98250 99999',
      name: 'Rajesh Solanki',
      role: 'governmentOfficial',
      departmentCategory: 'waterSupply',
      district: 'Ahmedabad'
    },
    {
      id: 'OFF-BHR-404',
      phone: '+91 94140 11111',
      name: 'Amit Verma',
      role: 'governmentOfficial',
      departmentCategory: 'electricity',
      district: 'Bhojpur'
    },
    {
      id: 'ADMIN-001',
      phone: '+91 90000 00000',
      name: 'Chief Grievance Officer',
      role: 'admin',
      departmentCategory: null,
      district: 'All'
    }
  ],
  feedbacks: []
};

// Initialize Supabase if credentials exist
if (config.supabase.url && (config.supabase.serviceRoleKey || config.supabase.anonKey)) {
  try {
    const key = config.supabase.serviceRoleKey || config.supabase.anonKey;
    supabaseClient = createClient(config.supabase.url, key, {
      auth: { persistSession: false }
    });
    activeDatabaseMode = 'supabase';
    console.log(`[Database] Connected to Supabase at: ${config.supabase.url}`);
  } catch (err) {
    console.warn(`[Database] Supabase initialization warning: ${err.message}`);
  }
} else if (config.databaseUrl) {
  try {
    pgPool = new Pool({
      connectionString: config.databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    activeDatabaseMode = 'postgres';
    console.log(`[Database] Configured PostgreSQL direct pool via DATABASE_URL.`);
  } catch (err) {
    console.warn(`[Database] PostgreSQL initialization warning: ${err.message}`);
  }
} else {
  console.log(`[Database] No database URL or Supabase keys provided. Running in high-fidelity IN-MEMORY store mode with initial seed data.`);
}

module.exports = {
  supabaseClient,
  pgPool,
  activeDatabaseMode,
  inMemoryStore,
  getDatabaseMode: () => activeDatabaseMode
};
