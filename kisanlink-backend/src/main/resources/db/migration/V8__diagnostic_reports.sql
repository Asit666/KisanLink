CREATE TABLE IF NOT EXISTS diagnostic_reports (
    id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT REFERENCES farmers(id) ON DELETE SET NULL,
    crop_id BIGINT REFERENCES crops(id) ON DELETE SET NULL,
    crop_name VARCHAR(120) NOT NULL,
    image_url TEXT,
    detected_disease VARCHAR(180) NOT NULL,
    pathogen_type VARCHAR(100),
    confidence_score DOUBLE PRECISION,
    severity VARCHAR(30) NOT NULL DEFAULT 'MODERATE',
    symptoms TEXT,
    treatment_plan TEXT,
    recommended_inputs TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    expert_notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_farmer ON diagnostic_reports(farmer_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_status ON diagnostic_reports(status);
