-- V14: Favorite transporters for farmers and repeat bookings

CREATE TABLE IF NOT EXISTS farmer_favorite_transporters (
    id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    transporter_id BIGINT NOT NULL REFERENCES transporters(id) ON DELETE CASCADE,
    notes VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uk_farmer_transporter_fav UNIQUE(farmer_id, transporter_id)
);

CREATE INDEX IF NOT EXISTS idx_fav_farmer ON farmer_favorite_transporters(farmer_id);
