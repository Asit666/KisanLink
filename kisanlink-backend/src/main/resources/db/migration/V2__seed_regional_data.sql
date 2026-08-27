-- ============================================================================
-- KisanLink Database Migration V2: Seed Regional Master Data
-- ============================================================================

-- 1. Standard Commodity Catalog (Vegetables, Fruits, Seeds, Grains, Pulses)
INSERT INTO crops (name, category, unit) VALUES
    ('Tomato', 'VEGETABLE', 'kg'),
    ('Potato', 'VEGETABLE', 'kg'),
    ('Onion', 'VEGETABLE', 'kg'),
    ('Mango', 'FRUIT', 'kg'),
    ('Apple', 'FRUIT', 'kg'),
    ('Banana', 'FRUIT', 'dozen'),
    ('Mustard Seeds', 'SEED', 'kg'),
    ('Chia Seeds', 'SEED', 'kg'),
    ('Sunflower Seeds', 'SEED', 'kg'),
    ('Rice', 'GRAIN', 'kg'),
    ('Wheat', 'GRAIN', 'kg'),
    ('Lentil', 'PULSE', 'kg')
ON CONFLICT (name) DO NOTHING;

-- 2. Regional Mandis & Wholesale Agriculture Hubs in Jharkhand
INSERT INTO markets (name, address, district, state, latitude, longitude, market_type) VALUES
    ('Ranchi Main Mandi', 'Pandra Market Yard', 'Ranchi', 'Jharkhand', 23.3441, 85.3096, 'MANDI'),
    ('Ramgarh Krishi Mandi', 'NH-33 Bypass Road', 'Ramgarh', 'Jharkhand', 23.6332, 85.5149, 'MANDI'),
    ('Bokaro APMC Center', 'Sector 12 Agro Hub', 'Bokaro', 'Jharkhand', 23.6693, 86.1511, 'APMC'),
    ('Jamshedpur Agro Yard', 'Golmuri Market Area', 'East Singhbhum', 'Jharkhand', 22.8046, 86.2029, 'WHOLESALE'),
    ('Hazaribagh Krishi Mandi', 'Kuru Road', 'Hazaribagh', 'Jharkhand', 23.9961, 85.3685, 'MANDI'),
    ('Dhanbad Wholesale Yard', 'Barwadda Agriculture Complex', 'Dhanbad', 'Jharkhand', 23.7957, 86.4304, 'WHOLESALE');

-- 3. Historical 7-Day Market Prices in Ranchi Main Mandi
-- Tomato (id from name)
INSERT INTO market_prices (market_id, crop_id, date, min_price, max_price, modal_price, source)
SELECT m.id, c.id, CURRENT_DATE - INTERVAL '6 days', 17.00, 21.00, 19.00, 'KisanLink Mandi Feed'
FROM markets m, crops c WHERE m.name = 'Ranchi Main Mandi' AND c.name = 'Tomato';

INSERT INTO market_prices (market_id, crop_id, date, min_price, max_price, modal_price, source)
SELECT m.id, c.id, CURRENT_DATE - INTERVAL '5 days', 18.00, 22.00, 20.00, 'KisanLink Mandi Feed'
FROM markets m, crops c WHERE m.name = 'Ranchi Main Mandi' AND c.name = 'Tomato';

INSERT INTO market_prices (market_id, crop_id, date, min_price, max_price, modal_price, source)
SELECT m.id, c.id, CURRENT_DATE - INTERVAL '4 days', 19.00, 23.00, 21.00, 'KisanLink Mandi Feed'
FROM markets m, crops c WHERE m.name = 'Ranchi Main Mandi' AND c.name = 'Tomato';

INSERT INTO market_prices (market_id, crop_id, date, min_price, max_price, modal_price, source)
SELECT m.id, c.id, CURRENT_DATE - INTERVAL '3 days', 18.00, 22.00, 20.00, 'KisanLink Mandi Feed'
FROM markets m, crops c WHERE m.name = 'Ranchi Main Mandi' AND c.name = 'Tomato';

INSERT INTO market_prices (market_id, crop_id, date, min_price, max_price, modal_price, source)
SELECT m.id, c.id, CURRENT_DATE - INTERVAL '2 days', 20.00, 24.00, 22.00, 'KisanLink Mandi Feed'
FROM markets m, crops c WHERE m.name = 'Ranchi Main Mandi' AND c.name = 'Tomato';

INSERT INTO market_prices (market_id, crop_id, date, min_price, max_price, modal_price, source)
SELECT m.id, c.id, CURRENT_DATE - INTERVAL '1 day', 19.00, 23.00, 21.00, 'KisanLink Mandi Feed'
FROM markets m, crops c WHERE m.name = 'Ranchi Main Mandi' AND c.name = 'Tomato';

INSERT INTO market_prices (market_id, crop_id, date, min_price, max_price, modal_price, source)
SELECT m.id, c.id, CURRENT_DATE, 22.00, 26.00, 24.00, 'KisanLink Mandi Feed'
FROM markets m, crops c WHERE m.name = 'Ranchi Main Mandi' AND c.name = 'Tomato';

-- Potato
INSERT INTO market_prices (market_id, crop_id, date, min_price, max_price, modal_price, source)
SELECT m.id, c.id, CURRENT_DATE - INTERVAL '3 days', 13.00, 17.00, 15.00, 'KisanLink Mandi Feed'
FROM markets m, crops c WHERE m.name = 'Ranchi Main Mandi' AND c.name = 'Potato';

INSERT INTO market_prices (market_id, crop_id, date, min_price, max_price, modal_price, source)
SELECT m.id, c.id, CURRENT_DATE - INTERVAL '2 days', 14.00, 18.00, 16.00, 'KisanLink Mandi Feed'
FROM markets m, crops c WHERE m.name = 'Ranchi Main Mandi' AND c.name = 'Potato';

INSERT INTO market_prices (market_id, crop_id, date, min_price, max_price, modal_price, source)
SELECT m.id, c.id, CURRENT_DATE - INTERVAL '1 day', 15.00, 19.00, 17.00, 'KisanLink Mandi Feed'
FROM markets m, crops c WHERE m.name = 'Ranchi Main Mandi' AND c.name = 'Potato';

INSERT INTO market_prices (market_id, crop_id, date, min_price, max_price, modal_price, source)
SELECT m.id, c.id, CURRENT_DATE, 16.00, 20.00, 18.00, 'KisanLink Mandi Feed'
FROM markets m, crops c WHERE m.name = 'Ranchi Main Mandi' AND c.name = 'Potato';

-- Mango
INSERT INTO market_prices (market_id, crop_id, date, min_price, max_price, modal_price, source)
SELECT m.id, c.id, CURRENT_DATE - INTERVAL '4 days', 63.00, 67.00, 65.00, 'KisanLink Mandi Feed'
FROM markets m, crops c WHERE m.name = 'Ranchi Main Mandi' AND c.name = 'Mango';

INSERT INTO market_prices (market_id, crop_id, date, min_price, max_price, modal_price, source)
SELECT m.id, c.id, CURRENT_DATE - INTERVAL '3 days', 66.00, 70.00, 68.00, 'KisanLink Mandi Feed'
FROM markets m, crops c WHERE m.name = 'Ranchi Main Mandi' AND c.name = 'Mango';

INSERT INTO market_prices (market_id, crop_id, date, min_price, max_price, modal_price, source)
SELECT m.id, c.id, CURRENT_DATE - INTERVAL '2 days', 68.00, 72.00, 70.00, 'KisanLink Mandi Feed'
FROM markets m, crops c WHERE m.name = 'Ranchi Main Mandi' AND c.name = 'Mango';

INSERT INTO market_prices (market_id, crop_id, date, min_price, max_price, modal_price, source)
SELECT m.id, c.id, CURRENT_DATE - INTERVAL '1 day', 72.00, 76.00, 74.00, 'KisanLink Mandi Feed'
FROM markets m, crops c WHERE m.name = 'Ranchi Main Mandi' AND c.name = 'Mango';

INSERT INTO market_prices (market_id, crop_id, date, min_price, max_price, modal_price, source)
SELECT m.id, c.id, CURRENT_DATE, 76.00, 80.00, 78.00, 'KisanLink Mandi Feed'
FROM markets m, crops c WHERE m.name = 'Ranchi Main Mandi' AND c.name = 'Mango';

-- Chia Seeds
INSERT INTO market_prices (market_id, crop_id, date, min_price, max_price, modal_price, source)
SELECT m.id, c.id, CURRENT_DATE - INTERVAL '2 days', 138.00, 142.00, 140.00, 'KisanLink Mandi Feed'
FROM markets m, crops c WHERE m.name = 'Ranchi Main Mandi' AND c.name = 'Chia Seeds';

INSERT INTO market_prices (market_id, crop_id, date, min_price, max_price, modal_price, source)
SELECT m.id, c.id, CURRENT_DATE - INTERVAL '1 day', 140.00, 144.00, 142.00, 'KisanLink Mandi Feed'
FROM markets m, crops c WHERE m.name = 'Ranchi Main Mandi' AND c.name = 'Chia Seeds';

INSERT INTO market_prices (market_id, crop_id, date, min_price, max_price, modal_price, source)
SELECT m.id, c.id, CURRENT_DATE, 146.00, 150.00, 148.00, 'KisanLink Mandi Feed'
FROM markets m, crops c WHERE m.name = 'Ranchi Main Mandi' AND c.name = 'Chia Seeds';
