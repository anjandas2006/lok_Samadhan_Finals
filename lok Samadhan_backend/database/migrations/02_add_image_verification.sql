-- Migration 02: Add AI Image Verification & Authenticity Columns
-- Compatible with Supabase PostgreSQL & Direct PostgreSQL

ALTER TABLE grievances ADD COLUMN IF NOT EXISTS image_verification_status VARCHAR(50) DEFAULT 'unverified';
ALTER TABLE grievances ADD COLUMN IF NOT EXISTS image_civic_category VARCHAR(50);
ALTER TABLE grievances ADD COLUMN IF NOT EXISTS image_confidence_score NUMERIC(4, 2);
ALTER TABLE grievances ADD COLUMN IF NOT EXISTS image_authenticity_status VARCHAR(50) DEFAULT 'unavailable';
ALTER TABLE grievances ADD COLUMN IF NOT EXISTS image_authenticity_details TEXT;
ALTER TABLE grievances ADD COLUMN IF NOT EXISTS image_detector_info VARCHAR(150);
ALTER TABLE grievances ADD COLUMN IF NOT EXISTS image_verified_at TIMESTAMPTZ;
ALTER TABLE grievances ADD COLUMN IF NOT EXISTS exif_gps_latitude DOUBLE PRECISION;
ALTER TABLE grievances ADD COLUMN IF NOT EXISTS exif_gps_longitude DOUBLE PRECISION;

COMMENT ON COLUMN grievances.image_verification_status IS 'Civic problem detection status: verified_civic_issue, unverified, flagged_manual_review';
COMMENT ON COLUMN grievances.image_civic_category IS 'Category detected by AI vision model (e.g. roadsInfrastructure, sanitationHealth)';
COMMENT ON COLUMN grievances.image_confidence_score IS 'Confidence score (0.00 to 1.00) from vision model';
COMMENT ON COLUMN grievances.image_authenticity_status IS 'Authenticity state: likely_authentic, suspicious_manipulation, inconclusive, unavailable';
COMMENT ON COLUMN grievances.image_authenticity_details IS 'Forensic details, observed signals, or caveats';
COMMENT ON COLUMN grievances.image_detector_info IS 'Detector model name / version';
COMMENT ON COLUMN grievances.image_verified_at IS 'Timestamp of AI image analysis';
COMMENT ON COLUMN grievances.exif_gps_latitude IS 'Optional historical EXIF GPS latitude extracted from photo metadata';
COMMENT ON COLUMN grievances.exif_gps_longitude IS 'Optional historical EXIF GPS longitude extracted from photo metadata';

CREATE INDEX IF NOT EXISTS idx_grievances_img_verif ON grievances(image_verification_status);
CREATE INDEX IF NOT EXISTS idx_grievances_img_auth ON grievances(image_authenticity_status);
