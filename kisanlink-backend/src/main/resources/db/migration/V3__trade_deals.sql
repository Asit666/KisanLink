-- ============================================================================
-- KisanLink Database Migration V3: Trade Deals & Counter-Offer Negotiations
-- ============================================================================

-- Trade Deals Ledger
CREATE TABLE IF NOT EXISTS trade_deals (
    id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    buyer_id BIGINT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    crop_id BIGINT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
    produce_id BIGINT REFERENCES farmer_produce(id) ON DELETE SET NULL,
    requirement_id BIGINT REFERENCES buyer_requirements(id) ON DELETE SET NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    agreed_price_per_kg NUMERIC(12, 2) NOT NULL,
    transport_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    net_farmer_return NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PROPOSED',
    initiated_by VARCHAR(50) NOT NULL,
    delivery_address VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Interactive Price Negotiation & Counter-Offer History
CREATE TABLE IF NOT EXISTS trade_negotiations (
    id BIGSERIAL PRIMARY KEY,
    trade_deal_id BIGINT NOT NULL REFERENCES trade_deals(id) ON DELETE CASCADE,
    sender_role VARCHAR(50) NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    proposed_price_per_kg NUMERIC(12, 2) NOT NULL,
    proposed_quantity NUMERIC(12, 2) NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast trade lookups
CREATE INDEX IF NOT EXISTS idx_trade_deals_farmer ON trade_deals(farmer_id);
CREATE INDEX IF NOT EXISTS idx_trade_deals_buyer ON trade_deals(buyer_id);
CREATE INDEX IF NOT EXISTS idx_trade_deals_status ON trade_deals(status);
CREATE INDEX IF NOT EXISTS idx_trade_negotiations_deal ON trade_negotiations(trade_deal_id);
