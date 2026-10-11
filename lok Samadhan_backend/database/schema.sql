-- =========================================================================
-- Lok Samadhan - Citizen Grievance Redressal Database Schema
-- Compatible with Supabase PostgreSQL & Direct PostgreSQL (DigitalOcean)
-- =========================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    category VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name_en VARCHAR(150) NOT NULL,
    name_hi VARCHAR(150) NOT NULL,
    name_gu VARCHAR(150) NOT NULL,
    nodal_authority VARCHAR(200) NOT NULL,
    default_sla_hours INTEGER NOT NULL DEFAULT 48,
    icon VARCHAR(50) DEFAULT 'info',
    color VARCHAR(20) DEFAULT '#0284C7',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Grievances Table
CREATE TABLE IF NOT EXISTS grievances (
    id VARCHAR(50) PRIMARY KEY,
    citizen_phone VARCHAR(30) NOT NULL,
    citizen_name VARCHAR(100) NOT NULL,
    spoken_dialect VARCHAR(100) NOT NULL DEFAULT 'Hindi',
    raw_speech_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    department_category VARCHAR(50) REFERENCES departments(category) ON UPDATE CASCADE,
    village_ward VARCHAR(150) NOT NULL,
    block VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    gps_accuracy_m DOUBLE PRECISION,
    location_captured_at TIMESTAMPTZ,
    photo_url TEXT,
    photo_analysis_summary TEXT,
    image_verification_status VARCHAR(50) DEFAULT 'unverified',
    image_civic_category VARCHAR(50),
    image_confidence_score NUMERIC(4, 2),
    image_authenticity_status VARCHAR(50) DEFAULT 'unavailable',
    image_authenticity_details TEXT,
    image_detector_info VARCHAR(150),
    image_verified_at TIMESTAMPTZ,
    exif_gps_latitude DOUBLE PRECISION,
    exif_gps_longitude DOUBLE PRECISION,
    urgency VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
    ai_confidence_score NUMERIC(4, 2) NOT NULL DEFAULT 0.90,
    status VARCHAR(30) NOT NULL DEFAULT 'received' CHECK (status IN ('hitlReview', 'received', 'underReview', 'inProgress', 'resolved', 'escalated')),
    is_hitl_fallback BOOLEAN DEFAULT FALSE,
    hitl_reviewer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    resolution_note TEXT,
    resolution_timestamp TIMESTAMPTZ,
    escalation_level INTEGER DEFAULT 0,
    assigned_officer_id VARCHAR(50),
    assigned_officer_name VARCHAR(100),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Grievance Audit Logs Table
CREATE TABLE IF NOT EXISTS grievance_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    grievance_id VARCHAR(50) NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    status_label VARCHAR(150) NOT NULL,
    actor VARCHAR(100) NOT NULL,
    description TEXT NOT NULL
);

-- 4. Users & Officials Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    phone VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    role VARCHAR(30) NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'governmentOfficial', 'admin')),
    department_category VARCHAR(50) REFERENCES departments(category) ON UPDATE CASCADE,
    district VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Citizen Feedback & Satisfaction Rating
CREATE TABLE IF NOT EXISTS citizen_feedbacks (
    id BIGSERIAL PRIMARY KEY,
    grievance_id VARCHAR(50) NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
    citizen_phone VARCHAR(30),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high-performance querying
CREATE INDEX IF NOT EXISTS idx_grievances_status ON grievances(status);
CREATE INDEX IF NOT EXISTS idx_grievances_department ON grievances(department_category);
CREATE INDEX IF NOT EXISTS idx_grievances_phone ON grievances(citizen_phone);
CREATE INDEX IF NOT EXISTS idx_grievances_urgency ON grievances(urgency);
CREATE INDEX IF NOT EXISTS idx_grievances_district ON grievances(district);
CREATE INDEX IF NOT EXISTS idx_grievances_due_date ON grievances(due_date);
CREATE INDEX IF NOT EXISTS idx_grievances_coords ON grievances(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_audit_grievance_id ON grievance_audit_logs(grievance_id);

-- Auto-update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_grievances_updated_at ON grievances;
CREATE TRIGGER set_grievances_updated_at
BEFORE UPDATE ON grievances
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Helpful view for SLA breached grievances
CREATE OR REPLACE VIEW view_sla_breached_grievances AS
SELECT 
    g.*,
    d.name_en AS department_name_en,
    d.name_hi AS department_name_hi,
    d.nodal_authority
FROM grievances g
JOIN departments d ON g.department_category = d.category
WHERE g.status != 'resolved' 
  AND (NOW() > g.due_date OR g.status = 'escalated');
