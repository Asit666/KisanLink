-- V13: Transporter reliability scoring, on-time delivery rate, and tier performance badges

ALTER TABLE transporters
    ADD COLUMN IF NOT EXISTS completed_trips INT NOT NULL DEFAULT 12,
    ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) NOT NULL DEFAULT 4.80,
    ADD COLUMN IF NOT EXISTS rating_count INT NOT NULL DEFAULT 8,
    ADD COLUMN IF NOT EXISTS on_time_rate NUMERIC(5,2) NOT NULL DEFAULT 96.50,
    ADD COLUMN IF NOT EXISTS reliability_score NUMERIC(5,2) NOT NULL DEFAULT 92.50,
    ADD COLUMN IF NOT EXISTS tier_badge VARCHAR(30) NOT NULL DEFAULT 'TOP_CARRIER';
