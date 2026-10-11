-- Migration: Fix GPS Location for Lok Samadhan
-- 1. Allow NULL for latitude and longitude (remove hardcoded Patna defaults)
ALTER TABLE grievances ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE grievances ALTER COLUMN latitude DROP DEFAULT;
ALTER TABLE grievances ALTER COLUMN longitude DROP NOT NULL;
ALTER TABLE grievances ALTER COLUMN longitude DROP DEFAULT;

-- 2. Add GPS accuracy in meters and capture timestamp columns (if not present)
ALTER TABLE grievances ADD COLUMN IF NOT EXISTS gps_accuracy_m DOUBLE PRECISION;
ALTER TABLE grievances ADD COLUMN IF NOT EXISTS location_captured_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Update comments and indexing
COMMENT ON COLUMN grievances.latitude IS 'Authoritative device GPS latitude (-90 to 90)';
COMMENT ON COLUMN grievances.longitude IS 'Authoritative device GPS longitude (-180 to 180)';
COMMENT ON COLUMN grievances.gps_accuracy_m IS 'Device GPS accuracy radius in meters';
COMMENT ON COLUMN grievances.location_captured_at IS 'UTC timestamp when GPS coordinates were captured by the device';

CREATE INDEX IF NOT EXISTS idx_grievances_coords ON grievances(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
