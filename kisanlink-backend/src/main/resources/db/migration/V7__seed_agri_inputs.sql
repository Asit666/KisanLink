-- V7: Seed Agri-Inputs (Fertilizers, Pesticides, Bio-Inputs, Farm Equipment)

INSERT INTO crops (name, category, unit) VALUES
  ('Urea (Neem Coated 46% N)', 'FERTILIZER', 'bag (45kg)'),
  ('DAP (Di-Ammonium Phosphate 18:46:0)', 'FERTILIZER', 'bag (50kg)'),
  ('NPK Complex 19:19:19', 'FERTILIZER', 'kg'),
  ('Organic Vermicompost', 'FERTILIZER', 'kg'),
  ('Muriate of Potash (MOP 60% K2O)', 'FERTILIZER', 'bag (50kg)'),
  ('Single Super Phosphate (SSP)', 'FERTILIZER', 'bag (50kg)'),
  ('Neem Oil 10000 PPM Bio-Pesticide', 'PESTICIDE', 'liter'),
  ('Chlorpyrifos 20% EC', 'PESTICIDE', 'liter'),
  ('Mancozeb 75% WP Fungicide', 'PESTICIDE', 'kg'),
  ('Trichoderma Viride Bio-Fungicide', 'PESTICIDE', 'kg'),
  ('Imidacloprid 17.8% SL', 'PESTICIDE', 'liter'),
  ('Seaweed Extract Bio-Stimulant', 'BIO_INPUT', 'liter'),
  ('Azotobacter Bio-Fertilizer', 'BIO_INPUT', 'kg'),
  ('PSB Phosphate Solubilizer', 'BIO_INPUT', 'kg'),
  ('16L Battery Knapsack Sprayer', 'FARM_EQUIPMENT', 'unit'),
  ('16mm Drip Lateral Kit (100m)', 'FARM_EQUIPMENT', 'bundle'),
  ('Solar Powered Insect Trap', 'FARM_EQUIPMENT', 'unit'),
  ('Heavy Duty Tarpaulin (24x18 ft)', 'FARM_EQUIPMENT', 'unit')
ON CONFLICT (name) DO NOTHING;
