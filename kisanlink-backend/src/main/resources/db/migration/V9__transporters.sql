-- V9: Transporter role support
-- Adds transporters table and transport_bookings table

CREATE TABLE IF NOT EXISTS transporters (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(30) NOT NULL DEFAULT 'MINI_TRUCK',
    vehicle_number VARCHAR(20),
    capacity_kg NUMERIC(10,2) NOT NULL DEFAULT 2000.00,
    base_district VARCHAR(100),
    base_state VARCHAR(100),
    base_latitude DOUBLE PRECISION,
    base_longitude DOUBLE PRECISION,
    rate_per_km NUMERIC(10,2) NOT NULL DEFAULT 15.00,
    base_charge NUMERIC(10,2) NOT NULL DEFAULT 100.00,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    alert_phone VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transport_bookings (
    id BIGSERIAL PRIMARY KEY,
    trade_deal_id BIGINT NOT NULL REFERENCES trade_deals(id) ON DELETE CASCADE,
    transporter_id BIGINT NOT NULL REFERENCES transporters(id),
    requested_by VARCHAR(20) NOT NULL DEFAULT 'FARMER',
    pickup_latitude DOUBLE PRECISION,
    pickup_longitude DOUBLE PRECISION,
    pickup_address VARCHAR(255),
    delivery_latitude DOUBLE PRECISION,
    delivery_longitude DOUBLE PRECISION,
    delivery_address VARCHAR(255),
    distance_km NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    estimated_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    scheduled_date DATE,
    notes TEXT,
    confirmed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add transporter payout column to escrow_payments
ALTER TABLE escrow_payments
    ADD COLUMN IF NOT EXISTS transporter_payout NUMERIC(12,2) NOT NULL DEFAULT 0.00;
