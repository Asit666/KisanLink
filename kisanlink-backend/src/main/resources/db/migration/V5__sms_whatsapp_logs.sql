-- ============================================================================
-- KisanLink Database Migration V5: SMS & WhatsApp Alert Logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS sms_whatsapp_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'SMS',
    message_type VARCHAR(50) NOT NULL,
    body TEXT NOT NULL,
    provider_message_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'DELIVERED',
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_user ON sms_whatsapp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON sms_whatsapp_logs(recipient_phone);
