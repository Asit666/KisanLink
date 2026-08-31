-- V15: Transporter multi-vehicle fleet management and logistics trade disputes

CREATE TABLE IF NOT EXISTS transporter_vehicles (
    id BIGSERIAL PRIMARY KEY,
    transporter_id BIGINT NOT NULL REFERENCES transporters(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(30) NOT NULL DEFAULT 'MINI_TRUCK',
    vehicle_number VARCHAR(30) NOT NULL,
    capacity_kg NUMERIC(10,2) NOT NULL DEFAULT 2000.00,
    rate_per_km NUMERIC(10,2) NOT NULL DEFAULT 15.00,
    base_charge NUMERIC(10,2) NOT NULL DEFAULT 100.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transporter_vehicles ON transporter_vehicles(transporter_id);

CREATE TABLE IF NOT EXISTS trade_disputes (
    id BIGSERIAL PRIMARY KEY,
    trade_deal_id BIGINT NOT NULL REFERENCES trade_deals(id) ON DELETE CASCADE,
    raised_by_role VARCHAR(20) NOT NULL,
    raised_by_user_id BIGINT NOT NULL REFERENCES users(id),
    dispute_type VARCHAR(40) NOT NULL,
    description TEXT NOT NULL,
    claim_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trade_disputes_deal ON trade_disputes(trade_deal_id);
