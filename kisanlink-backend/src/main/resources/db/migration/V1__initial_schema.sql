-- ============================================================================
-- KisanLink Database Migration V1: Initial Schema
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Farmers table
CREATE TABLE IF NOT EXISTS farmers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    address VARCHAR(255),
    district VARCHAR(255),
    state VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

-- Buyers table
CREATE TABLE IF NOT EXISTS buyers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(255),
    address VARCHAR(255),
    district VARCHAR(255),
    state VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    verified BOOLEAN NOT NULL DEFAULT FALSE
);

-- Crops catalog
CREATE TABLE IF NOT EXISTS crops (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(20),
    unit VARCHAR(50) DEFAULT 'kg'
);

-- Farmer Produce listings
CREATE TABLE IF NOT EXISTS farmer_produce (
    id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    crop_id BIGINT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 2) NOT NULL,
    quality VARCHAR(255) NOT NULL,
    harvest_date DATE,
    available_until DATE,
    expected_price NUMERIC(12, 2),
    image_url VARCHAR(2048),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Buyer Requirements
CREATE TABLE IF NOT EXISTS buyer_requirements (
    id BIGSERIAL PRIMARY KEY,
    buyer_id BIGINT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    crop_id BIGINT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
    required_quantity NUMERIC(12, 2) NOT NULL,
    quality_required VARCHAR(255) NOT NULL,
    offered_price NUMERIC(12, 2) NOT NULL,
    valid_until DATE,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Regional Markets & Mandis
CREATE TABLE IF NOT EXISTS markets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    district VARCHAR(255),
    state VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    market_type VARCHAR(50) NOT NULL
);

-- Market Price History & Daily Mandi Rates
CREATE TABLE IF NOT EXISTS market_prices (
    id BIGSERIAL PRIMARY KEY,
    market_id BIGINT NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    crop_id BIGINT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    min_price NUMERIC(12, 2) NOT NULL,
    max_price NUMERIC(12, 2) NOT NULL,
    modal_price NUMERIC(12, 2) NOT NULL,
    source VARCHAR(255)
);

-- Matching & Recommendation Engine Outputs
CREATE TABLE IF NOT EXISTS recommendations (
    id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    produce_id BIGINT NOT NULL REFERENCES farmer_produce(id) ON DELETE CASCADE,
    buyer_id BIGINT NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    selling_price NUMERIC(12, 2) NOT NULL,
    transport_cost NUMERIC(12, 2) NOT NULL,
    gross_revenue NUMERIC(12, 2) NOT NULL,
    net_return NUMERIC(12, 2) NOT NULL,
    score NUMERIC(5, 2) NOT NULL,
    explanation VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Price Prediction & Forecasts
CREATE TABLE IF NOT EXISTS price_predictions (
    id BIGSERIAL PRIMARY KEY,
    crop_id BIGINT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
    market_id BIGINT REFERENCES markets(id) ON DELETE SET NULL,
    prediction_date DATE NOT NULL,
    predicted_price NUMERIC(12, 2) NOT NULL,
    lower_bound NUMERIC(12, 2) NOT NULL,
    upper_bound NUMERIC(12, 2) NOT NULL,
    trend VARCHAR(50) NOT NULL,
    model_version VARCHAR(255) NOT NULL DEFAULT 'baseline-trend-v1',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_farmer_produce_farmer ON farmer_produce(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_produce_crop ON farmer_produce(crop_id);
CREATE INDEX IF NOT EXISTS idx_buyer_requirements_buyer ON buyer_requirements(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_requirements_crop ON buyer_requirements(crop_id);
CREATE INDEX IF NOT EXISTS idx_market_prices_lookup ON market_prices(market_id, crop_id, date);
CREATE INDEX IF NOT EXISTS idx_price_predictions_crop_date ON price_predictions(crop_id, prediction_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
