-- V11: Private Farmer <-> Buyer Trade Chat with Structured Offers

CREATE TABLE IF NOT EXISTS chat_conversations (
    id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    buyer_id BIGINT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    crop_name VARCHAR(100),
    trade_deal_id BIGINT REFERENCES trade_deals(id) ON DELETE SET NULL,
    last_message_text TEXT,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_role VARCHAR(20) NOT NULL,
    sender_id BIGINT NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    message_text TEXT NOT NULL,
    is_offer BOOLEAN NOT NULL DEFAULT FALSE,
    offer_crop_name VARCHAR(100),
    offer_quantity_kg NUMERIC(10,2),
    offer_price_per_kg NUMERIC(10,2),
    offer_total_amount NUMERIC(12,2),
    offer_status VARCHAR(20),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chat_conv_farmer ON chat_conversations(farmer_id);
CREATE INDEX IF NOT EXISTS idx_chat_conv_buyer ON chat_conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON chat_messages(conversation_id);
