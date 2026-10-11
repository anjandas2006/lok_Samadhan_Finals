-- =========================================================================
-- Lok Samadhan - Grievance Coin (GC) Rewards System Schema
-- Compatible with Supabase PostgreSQL & Direct PostgreSQL
-- =========================================================================

-- 1. Reward Catalogue Table
CREATE TABLE IF NOT EXISTS reward_catalogue (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    cost INTEGER NOT NULL CHECK (cost > 0),
    category VARCHAR(50) DEFAULT 'voucher',
    is_demo BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Reward Balances Table
CREATE TABLE IF NOT EXISTS reward_balances (
    user_id VARCHAR(100) PRIMARY KEY,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_redeemed INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Eligible Complaint Rewards (Strict Uniqueness Constraint to prevent duplicate rewards)
CREATE TABLE IF NOT EXISTS complaint_rewards (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    complaint_id VARCHAR(100) NOT NULL UNIQUE,
    coins_awarded INTEGER NOT NULL DEFAULT 1,
    awarded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Reward Redemptions (Demo claims records)
CREATE TABLE IF NOT EXISTS reward_redemptions (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    reward_id VARCHAR(50) NOT NULL REFERENCES reward_catalogue(id),
    reward_name VARCHAR(150) NOT NULL,
    coins_deducted INTEGER NOT NULL CHECK (coins_deducted > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Demo Claimed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Grievance Coin Transactions Ledger
CREATE TABLE IF NOT EXISTS gc_transactions (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'redeemed')),
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    reference_id VARCHAR(100),
    balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_gc_trans_user ON gc_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON reward_redemptions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaint_rewards_user ON complaint_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_complaint_rewards_cid ON complaint_rewards(complaint_id);

-- Seed standard Hackathon Demo Catalogue
INSERT INTO reward_catalogue (id, name, description, cost, category, is_demo, is_active)
VALUES 
    ('rew-flipkart-20', 'Flipkart Discount Voucher', 'Flat discount on your next shopping order across select electronics and fashion items.', 20, 'shopping', TRUE, TRUE),
    ('rew-amazon-20', 'Amazon Discount Voucher', 'Instant balance benefit for pantry essentials, household goods, and utility bills.', 20, 'shopping', TRUE, TRUE),
    ('rew-googleplay-50', 'Google Play Store Redeem Code', 'Digital credits for apps, books, movies, and developer tools on Google Play.', 50, 'entertainment', TRUE, TRUE),
    ('rew-lenskart-30', 'Lenskart Voucher', 'Prescription eyeglasses and polarized sunglasses discount voucher.', 30, 'health', TRUE, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    cost = EXCLUDED.cost,
    description = EXCLUDED.description;
