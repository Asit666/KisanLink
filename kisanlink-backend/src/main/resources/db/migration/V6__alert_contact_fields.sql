-- V6: Add alert contact fields for SMS/WhatsApp/Email notification routing

ALTER TABLE farmers ADD COLUMN IF NOT EXISTS alert_email VARCHAR(255);
ALTER TABLE buyers  ADD COLUMN IF NOT EXISTS alert_email VARCHAR(255);
