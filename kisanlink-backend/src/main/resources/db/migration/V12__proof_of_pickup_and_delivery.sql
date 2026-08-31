-- V12: Proof of Pickup (POP) and Proof of Delivery (POD) with audit verification codes and discrepancy tracking

ALTER TABLE transport_bookings
    ADD COLUMN IF NOT EXISTS pickup_code VARCHAR(10),
    ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS pickup_quantity_kg NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS pickup_notes TEXT,
    ADD COLUMN IF NOT EXISTS delivery_code VARCHAR(10),
    ADD COLUMN IF NOT EXISTS delivered_quantity_kg NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
    ADD COLUMN IF NOT EXISTS discrepancy_kg NUMERIC(10,2);
