-- ============================================================================
-- KisanLink Database Migration V4: Digital Escrow & UPI Payment Milestones
-- ============================================================================

-- Digital Escrow Accounts & Payment Vault
CREATE TABLE IF NOT EXISTS escrow_payments (
    id BIGSERIAL PRIMARY KEY,
    trade_deal_id BIGINT NOT NULL UNIQUE REFERENCES trade_deals(id) ON DELETE CASCADE,
    total_amount NUMERIC(12, 2) NOT NULL,
    deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    farmer_payout NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_DEPOSIT',
    payment_method VARCHAR(50) DEFAULT 'UPI_INSTANT',
    upi_ref VARCHAR(255),
    farmer_upi_id VARCHAR(255),
    buyer_upi_id VARCHAR(255),
    settlement_utr VARCHAR(255),
    dispute_reason TEXT,
    deposited_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast trade lookups & status filtering
CREATE INDEX IF NOT EXISTS idx_escrow_trade_deal ON escrow_payments(trade_deal_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_payments(status);
