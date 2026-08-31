package com.kisanlink.config;

import com.kisanlink.entity.*;
import com.kisanlink.repository.CropRepository;
import com.kisanlink.repository.MarketPriceRepository;
import com.kisanlink.repository.MarketRepository;
import com.kisanlink.repository.FarmerRepository;
import com.kisanlink.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Configuration
@Profile("dev")
public class DevDataInitializer {

    @Bean
    CommandLineRunner seedDevelopmentData(CropRepository cropRepository,
                                           MarketRepository marketRepository,
                                           MarketPriceRepository priceRepository,
                                           FarmerRepository farmerRepository,
                                           UserRepository userRepository,
                                           com.kisanlink.repository.DiagnosticReportRepository diagnosticReportRepository) {
        return arguments -> {
            if (cropRepository.count() > 0) {
                return;
            }

            // --- Create Sample User and Farmer ---
            User user = new User();
            user.setName("Ashok Kumar");
            user.setEmail("ashok@example.com");
            user.setPhone("9876543210");
            user.setPassword("password123"); // Default password for dev
            user.setRole(Role.FARMER); // Set role for user
            user = userRepository.save(user);
            
            Farmer farmer = new Farmer();
            farmer.setUser(user);
            farmer.setDistrict("Ranchi");
            farmer.setState("Jharkhand");
            farmer = farmerRepository.save(farmer);

            // --- Vegetables ---
            Crop tomato = crop(cropRepository, "Tomato",    CropCategory.VEGETABLE, "kg");
            Crop potato = crop(cropRepository, "Potato",    CropCategory.VEGETABLE, "kg");
            Crop onion  = crop(cropRepository, "Onion",     CropCategory.VEGETABLE, "kg");

            // --- Fruits ---
            Crop mango  = crop(cropRepository, "Mango",     CropCategory.FRUIT,     "kg");
            Crop apple  = crop(cropRepository, "Apple",     CropCategory.FRUIT,     "kg");
            Crop banana = crop(cropRepository, "Banana",    CropCategory.FRUIT,     "dozen");

            // --- Seeds ---
            Crop mustardSeed = crop(cropRepository, "Mustard Seeds",  CropCategory.SEED, "kg");
            Crop chiaSeed    = crop(cropRepository, "Chia Seeds",     CropCategory.SEED, "kg");
            Crop sunflower   = crop(cropRepository, "Sunflower Seeds",CropCategory.SEED, "kg");

            // --- Grains & Pulses ---
            Crop rice   = crop(cropRepository, "Rice",      CropCategory.GRAIN,     "kg");
            Crop wheat  = crop(cropRepository, "Wheat",     CropCategory.GRAIN,     "kg");
            Crop lentil = crop(cropRepository, "Lentil",    CropCategory.PULSE,     "kg");

            // --- Fertilizers & Soil Nutrients ---
            Crop urea        = crop(cropRepository, "Urea (Neem Coated 46% N)",    CropCategory.FERTILIZER, "bag (45kg)");
            Crop dap         = crop(cropRepository, "DAP (Di-Ammonium Phosphate 18:46:0)", CropCategory.FERTILIZER, "bag (50kg)");
            Crop npk19       = crop(cropRepository, "NPK Complex 19:19:19",        CropCategory.FERTILIZER, "kg");
            Crop vermicompost= crop(cropRepository, "Organic Vermicompost",        CropCategory.FERTILIZER, "kg");
            Crop mopPotash   = crop(cropRepository, "Muriate of Potash (MOP 60% K2O)", CropCategory.FERTILIZER, "bag (50kg)");
            Crop ssp         = crop(cropRepository, "Single Super Phosphate (SSP)", CropCategory.FERTILIZER, "bag (50kg)");

            // --- Pesticides, Insecticides & Crop Protection ---
            Crop neemBioPesticide = crop(cropRepository, "Neem Oil 10000 PPM Bio-Pesticide", CropCategory.PESTICIDE, "liter");
            Crop chlorpyrifos     = crop(cropRepository, "Chlorpyrifos 20% EC",               CropCategory.PESTICIDE, "liter");
            Crop mancozeb         = crop(cropRepository, "Mancozeb 75% WP Fungicide",          CropCategory.PESTICIDE, "kg");
            Crop trichoderma      = crop(cropRepository, "Trichoderma Viride Bio-Fungicide",   CropCategory.PESTICIDE, "kg");
            Crop imidacloprid     = crop(cropRepository, "Imidacloprid 17.8% SL",              CropCategory.PESTICIDE, "liter");

            // --- Bio-Inputs & Plant Growth Promoters ---
            Crop seaweedExtract   = crop(cropRepository, "Seaweed Extract Bio-Stimulant",      CropCategory.BIO_INPUT, "liter");
            Crop azotobacter      = crop(cropRepository, "Azotobacter Bio-Fertilizer",         CropCategory.BIO_INPUT, "kg");
            Crop psbCulture       = crop(cropRepository, "PSB Phosphate Solubilizer",          CropCategory.BIO_INPUT, "kg");

            // --- Farm Equipment & Irrigation Tools ---
            Crop knapsackSprayer  = crop(cropRepository, "16L Battery Knapsack Sprayer",       CropCategory.FARM_EQUIPMENT, "unit");
            Crop dripLateralKit   = crop(cropRepository, "16mm Drip Lateral Kit (100m)",      CropCategory.FARM_EQUIPMENT, "bundle");
            Crop solarInsectTrap  = crop(cropRepository, "Solar Powered Insect Trap",         CropCategory.FARM_EQUIPMENT, "unit");
            Crop tarpaulinCover   = crop(cropRepository, "Heavy Duty Tarpaulin (24x18 ft)",   CropCategory.FARM_EQUIPMENT, "unit");

            // --- Regional Mandis & Wholesale Markets ---
            Market ranchiMandi = market(marketRepository, "Ranchi Main Mandi", "Pandra Market Yard", "Ranchi", "Jharkhand", 23.3441, 85.3096, MarketType.MANDI);
            Market ramgarhMandi = market(marketRepository, "Ramgarh Krishi Mandi", "NH-33 Bypass Road", "Ramgarh", "Jharkhand", 23.6332, 85.5149, MarketType.MANDI);
            Market bokaroApmc = market(marketRepository, "Bokaro APMC Center", "Sector 12 Agro Hub", "Bokaro", "Jharkhand", 23.6693, 86.1511, MarketType.APMC);
            Market jamshedpurYard = market(marketRepository, "Jamshedpur Agro Yard", "Golmuri Market Area", "East Singhbhum", "Jharkhand", 22.8046, 86.2029, MarketType.WHOLESALE);
            Market hazaribaghMandi = market(marketRepository, "Hazaribagh Krishi Mandi", "Kuru Road", "Hazaribagh", "Jharkhand", 23.9961, 85.3685, MarketType.MANDI);
            Market dhanbadYard = market(marketRepository, "Dhanbad Wholesale Yard", "Barwadda Agriculture Complex", "Dhanbad", "Jharkhand", 23.7957, 86.4304, MarketType.WHOLESALE);

            // 7-day price series for Tomato (Vegetable)
            savePrice(priceRepository, ranchiMandi, tomato, LocalDate.now().minusDays(6), "19");
            savePrice(priceRepository, ranchiMandi, tomato, LocalDate.now().minusDays(5), "20");
            savePrice(priceRepository, ranchiMandi, tomato, LocalDate.now().minusDays(4), "21");
            savePrice(priceRepository, ranchiMandi, tomato, LocalDate.now().minusDays(3), "20");
            savePrice(priceRepository, ranchiMandi, tomato, LocalDate.now().minusDays(2), "22");
            savePrice(priceRepository, ranchiMandi, tomato, LocalDate.now().minusDays(1), "21");
            savePrice(priceRepository, ranchiMandi, tomato, LocalDate.now(), "24");

            // 7-day price series for Potato (Vegetable)
            savePrice(priceRepository, ranchiMandi, potato, LocalDate.now().minusDays(3), "15");
            savePrice(priceRepository, ranchiMandi, potato, LocalDate.now().minusDays(2), "16");
            savePrice(priceRepository, ranchiMandi, potato, LocalDate.now().minusDays(1), "17");
            savePrice(priceRepository, ranchiMandi, potato, LocalDate.now(), "18");

            // 7-day price series for Mango (Fruit)
            savePrice(priceRepository, ranchiMandi, mango, LocalDate.now().minusDays(4), "65");
            savePrice(priceRepository, ranchiMandi, mango, LocalDate.now().minusDays(3), "68");
            savePrice(priceRepository, ranchiMandi, mango, LocalDate.now().minusDays(2), "70");
            savePrice(priceRepository, ranchiMandi, mango, LocalDate.now().minusDays(1), "74");
            savePrice(priceRepository, ranchiMandi, mango, LocalDate.now(), "78");

            // 7-day price series for Apple (Fruit)
            savePrice(priceRepository, ranchiMandi, apple, LocalDate.now().minusDays(3), "110");
            savePrice(priceRepository, ranchiMandi, apple, LocalDate.now().minusDays(2), "115");
            savePrice(priceRepository, ranchiMandi, apple, LocalDate.now().minusDays(1), "120");
            savePrice(priceRepository, ranchiMandi, apple, LocalDate.now(), "125");

            // 7-day price series for Chia Seeds (Seed)
            savePrice(priceRepository, ranchiMandi, chiaSeed, LocalDate.now().minusDays(4), "130");
            savePrice(priceRepository, ranchiMandi, chiaSeed, LocalDate.now().minusDays(3), "135");
            savePrice(priceRepository, ranchiMandi, chiaSeed, LocalDate.now().minusDays(2), "140");
            savePrice(priceRepository, ranchiMandi, chiaSeed, LocalDate.now().minusDays(1), "142");
            savePrice(priceRepository, ranchiMandi, chiaSeed, LocalDate.now(), "148");

            // 7-day price series for Mustard Seeds (Seed)
            savePrice(priceRepository, ranchiMandi, mustardSeed, LocalDate.now().minusDays(3), "52");
            savePrice(priceRepository, ranchiMandi, mustardSeed, LocalDate.now().minusDays(2), "54");
            savePrice(priceRepository, ranchiMandi, mustardSeed, LocalDate.now().minusDays(1), "55");
            savePrice(priceRepository, ranchiMandi, mustardSeed, LocalDate.now(), "58");

            // 7-day price series for Urea (Fertilizer)
            savePrice(priceRepository, ranchiMandi, urea, LocalDate.now().minusDays(3), "266");
            savePrice(priceRepository, ranchiMandi, urea, LocalDate.now().minusDays(2), "266");
            savePrice(priceRepository, ranchiMandi, urea, LocalDate.now().minusDays(1), "268");
            savePrice(priceRepository, ranchiMandi, urea, LocalDate.now(), "268");

            // 7-day price series for DAP (Fertilizer)
            savePrice(priceRepository, ranchiMandi, dap, LocalDate.now().minusDays(3), "1350");
            savePrice(priceRepository, ranchiMandi, dap, LocalDate.now().minusDays(2), "1350");
            savePrice(priceRepository, ranchiMandi, dap, LocalDate.now().minusDays(1), "1350");
            savePrice(priceRepository, ranchiMandi, dap, LocalDate.now(), "1350");

            // 7-day price series for Neem Bio-Pesticide (Pesticide)
            savePrice(priceRepository, ranchiMandi, neemBioPesticide, LocalDate.now().minusDays(3), "340");
            savePrice(priceRepository, ranchiMandi, neemBioPesticide, LocalDate.now().minusDays(2), "345");
            savePrice(priceRepository, ranchiMandi, neemBioPesticide, LocalDate.now().minusDays(1), "350");
            savePrice(priceRepository, ranchiMandi, neemBioPesticide, LocalDate.now(), "350");

            // 7-day price series for NPK 19:19:19 (Fertilizer)
            savePrice(priceRepository, ranchiMandi, npk19, LocalDate.now().minusDays(3), "92");
            savePrice(priceRepository, ranchiMandi, npk19, LocalDate.now().minusDays(2), "94");
            savePrice(priceRepository, ranchiMandi, npk19, LocalDate.now().minusDays(1), "95");
            // --- Seed Sample Diagnostic Reports ---
            DiagnosticReport r1 = new DiagnosticReport();
            r1.setFarmer(farmer);
            r1.setCrop(tomato);
            r1.setCropName("Tomato");
            r1.setImageUrl("https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=600&auto=format&fit=crop");
            r1.setDetectedDisease("Early Blight (Alternaria solani)");
            r1.setPathogenType("Fungal Pathogen");
            r1.setConfidenceScore(94.8);
            r1.setSeverity(DiagnosticSeverity.MODERATE);
            r1.setSymptoms("Concentric dark brown rings ('target board' spots) on lower foliage with yellow chlorotic halos.");
            r1.setTreatmentPlan("1. Foliar spray of Mancozeb 75% WP @ 2.5g/L water every 10 days.\n2. Apply Trichoderma Viride bio-fungicide to root zone.\n3. Prune bottom leaves to improve airflow.");
            r1.setRecommendedInputs("Mancozeb 75% WP, Trichoderma Viride Bio-Fungicide, NPK Complex 19:19:19");
            r1.setStatus(DiagnosticStatus.COMPLETED);
            diagnosticReportRepository.save(r1);

            DiagnosticReport r2 = new DiagnosticReport();
            r2.setFarmer(farmer);
            r2.setCrop(rice);

            r2.setCropName("Rice (Paddy)");
            r2.setImageUrl("https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=600&auto=format&fit=crop");
            r2.setDetectedDisease("Rice Blast (Magnaporthe oryzae)");
            r2.setPathogenType("Ascomycete Fungus");
            r2.setConfidenceScore(93.5);
            r2.setSeverity(DiagnosticSeverity.SEVERE);
            r2.setSymptoms("Spindle-shaped elliptical lesions with grey/white centers and reddish-brown borders on leaves and panicle neck.");
            r2.setTreatmentPlan("1. Apply Tricyclazole 75% WP @ 0.6g/L.\n2. Balance Nitrogen application with split MOP potash doses.\n3. Maintain 5cm water level in field.");
            r2.setRecommendedInputs("Trichoderma Viride Bio-Fungicide, Muriate of Potash (MOP 60% K2O), Neem Bio-Pesticide (10000 PPM)");
            r2.setStatus(DiagnosticStatus.ESCALATED);
            r2.setExpertNotes("Agronomist Dr. R. Verma reviewed: Field drainage recommended alongside Tricyclazole spray.");
            diagnosticReportRepository.save(r2);

        };
    }



    private Crop crop(CropRepository repo, String name, CropCategory category, String unit) {
        Crop c = new Crop();
        c.setName(name);
        c.setCategory(category);
        c.setUnit(unit);
        return repo.save(c);
    }

    private Market market(MarketRepository repo, String name, String address, String district,
                          String state, Double latitude, Double longitude, MarketType marketType) {
        Market m = new Market();
        m.setName(name);
        m.setAddress(address);
        m.setDistrict(district);
        m.setState(state);
        m.setLatitude(latitude);
        m.setLongitude(longitude);
        m.setMarketType(marketType);
        return repo.save(m);
    }

    private void savePrice(MarketPriceRepository priceRepository, Market market, Crop crop,
                           LocalDate date, String modalPrice) {
        BigDecimal modal = new BigDecimal(modalPrice);
        MarketPrice price = new MarketPrice();
        price.setMarket(market);
        price.setCrop(crop);
        price.setDate(date);
        price.setMinPrice(modal.subtract(BigDecimal.valueOf(2)));
        price.setMaxPrice(modal.add(BigDecimal.valueOf(2)));
        price.setModalPrice(modal);
        price.setSource("KisanLink development sample");
        priceRepository.save(price);
    }
}


