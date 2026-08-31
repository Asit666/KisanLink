-- V10: Seed sample transporters for development and demo
-- These represent logistics operators near Jharkhand region

-- Transporter user accounts (password = 'Pass123!' encoded — skipped for H2 dev; created via DevDataInitializer)
-- This migration seeds only if running against PostgreSQL with real users
-- In dev (H2), DevDataInitializer handles this seeding programmatically.
-- This is a no-op for dev; for prod, run DevDataInitializer equivalent or use this seed.

-- Note: actual inserts are done by DevDataInitializer.java for dev profile
SELECT 1; -- placeholder to keep Flyway happy
