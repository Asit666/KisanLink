package com.kisanlink.config;

import com.kisanlink.entity.*;
import com.kisanlink.repository.CropRepository;
import com.kisanlink.repository.MarketPriceRepository;
import com.kisanlink.repository.MarketRepository;
import com.kisanlink.repository.FarmerRepository;
import com.kisanlink.repository.TransporterRepository;
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
                                           TransporterRepository transporterRepository,
                                           com.kisanlink.repository.DiagnosticReportRepository diagnosticReportRepository,
                                           com.kisanlink.repository.FpoProfileRepository fpoProfileRepository,
                                           com.kisanlink.repository.BuyerRepository buyerRepository,
                                           com.kisanlink.repository.FarmerProduceRepository produceRepository,
                                           com.kisanlink.repository.BuyerRequirementRepository requirementRepository,
                                           com.kisanlink.repository.TradeDealRepository tradeDealRepository,
                                           com.kisanlink.repository.DemandRepository demandRepository) {
        return arguments -> {
            if (cropRepository.count() > 0) {
                return;
            }

            String defaultPass = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("password123");

            // 1. Seed Farmer Ramesh
            User farmerUser = new User();
            farmerUser.setName("Ramesh Kumar");
            farmerUser.setEmail("farmer@kisanlink.in");
            farmerUser.setPhone("9422288910");
            farmerUser.setPassword(defaultPass);
            farmerUser.setRole(Role.FARMER);
            farmerUser = userRepository.save(farmerUser);

            Farmer farmer = new Farmer();
            farmer.setUser(farmerUser);
            farmer.setName("Ramesh Kumar");
            farmer.setDistrict("Nashik");
            farmer.setState("Maharashtra");
            farmer.setLatitude(20.1764);
            farmer.setLongitude(73.9856);
            farmer.setAddress("Survey 104, Pimpalgaon Baswant");
            farmer = farmerRepository.save(farmer);

            // 2. Seed Buyer Priya
            User buyerUser = new User();
            buyerUser.setName("Priya Sharma");
            buyerUser.setEmail("buyer@kisanlink.in");
            buyerUser.setPhone("9822055432");
            buyerUser.setPassword(defaultPass);
            buyerUser.setRole(Role.BUYER);
            buyerUser = userRepository.save(buyerUser);

            Buyer buyer = new Buyer();
            buyer.setUser(buyerUser);
            buyer.setBusinessName("Priya Agro Wholesale & Retail Hub");
            buyer.setBusinessType("WHOLESALER");
            buyer.setDistrict("Nashik");
            buyer.setState("Maharashtra");
            buyer.setLatitude(19.9975);
            buyer.setLongitude(73.7898);
            buyer.setVerified(true);
            buyer = buyerRepository.save(buyer);

            // 3. Seed FPO Sahyadri
            User fpoUser = new User();
            fpoUser.setName("Sahyadri Farmers Producer Co.");
            fpoUser.setEmail("fpo@kisanlink.in");
            fpoUser.setPhone("9823144102");
            fpoUser.setPassword(defaultPass);
            fpoUser.setRole(Role.FPO);
            fpoUser = userRepository.save(fpoUser);

            FpoProfile fpo = new FpoProfile();
            fpo.setUser(fpoUser);
            fpo.setFpoName("Sahyadri Farmers Producer Co.");
            fpo.setRegistrationNo("FPO-MH-2026-9932");
            fpo.setState("Maharashtra");
            fpo.setDistrict("Nashik");
            fpo = fpoProfileRepository.save(fpo);

            // 4. Seed Platform Admin
            User adminUser = new User();
            adminUser.setName("Platform Admin");
            adminUser.setEmail("admin@kisanlink.in");
            adminUser.setPhone("9999900000");
            adminUser.setPassword(defaultPass);
            adminUser.setRole(Role.ADMIN);
            userRepository.save(adminUser);

            // --- Vegetables ---
            Crop tomato = crop(cropRepository, "Tomato",    CropCategory.VEGETABLE, "kg", null);
            Crop potato = crop(cropRepository, "Potato",    CropCategory.VEGETABLE, "kg", null);
            Crop onion  = crop(cropRepository, "Onion",     CropCategory.VEGETABLE, "kg", null);

            // --- Fruits ---
            Crop mango  = crop(cropRepository, "Mango",     CropCategory.FRUIT,     "kg", null);
            Crop apple  = crop(cropRepository, "Apple",     CropCategory.FRUIT,     "kg", null);
            Crop banana = crop(cropRepository, "Banana",    CropCategory.FRUIT,     "dozen", null);

            // --- Seeds ---
            Crop mustardSeed = crop(cropRepository, "Mustard Seeds",  CropCategory.SEED, "kg", new BigDecimal("56.50"));
            Crop chiaSeed    = crop(cropRepository, "Chia Seeds",     CropCategory.SEED, "kg", null);
            Crop sunflower   = crop(cropRepository, "Sunflower Seeds",CropCategory.SEED, "kg", new BigDecimal("67.60"));

            // --- Grains & Pulses ---
            Crop rice   = crop(cropRepository, "Rice",      CropCategory.GRAIN,     "kg", new BigDecimal("23.00"));
            Crop wheat  = crop(cropRepository, "Wheat",     CropCategory.GRAIN,     "kg", new BigDecimal("22.75"));
            Crop lentil = crop(cropRepository, "Lentil",    CropCategory.PULSE,     "kg", new BigDecimal("64.25"));

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

            // 7-day price series for Tomato across Mandis
            savePrice(priceRepository, ranchiMandi, tomato, LocalDate.now().minusDays(6), "19");
            savePrice(priceRepository, ranchiMandi, tomato, LocalDate.now().minusDays(5), "20");
            savePrice(priceRepository, ranchiMandi, tomato, LocalDate.now().minusDays(4), "21");
            savePrice(priceRepository, ranchiMandi, tomato, LocalDate.now().minusDays(3), "20");
            savePrice(priceRepository, ranchiMandi, tomato, LocalDate.now().minusDays(2), "22");
            savePrice(priceRepository, ranchiMandi, tomato, LocalDate.now().minusDays(1), "21");
            savePrice(priceRepository, ranchiMandi, tomato, LocalDate.now(), "24");
            savePrice(priceRepository, ramgarhMandi, tomato, LocalDate.now(), "26");
            savePrice(priceRepository, bokaroApmc, tomato, LocalDate.now(), "25");
            savePrice(priceRepository, jamshedpurYard, tomato, LocalDate.now(), "28");

            // Price series for Potato across Mandis
            savePrice(priceRepository, ranchiMandi, potato, LocalDate.now().minusDays(3), "15");
            savePrice(priceRepository, ranchiMandi, potato, LocalDate.now().minusDays(2), "16");
            savePrice(priceRepository, ranchiMandi, potato, LocalDate.now().minusDays(1), "17");
            savePrice(priceRepository, ranchiMandi, potato, LocalDate.now(), "18");
            savePrice(priceRepository, ramgarhMandi, potato, LocalDate.now(), "17");
            savePrice(priceRepository, bokaroApmc, potato, LocalDate.now(), "19");

            // Price series for Wheat (Grain with MSP 22.75) across Mandis
            savePrice(priceRepository, ranchiMandi, wheat, LocalDate.now().minusDays(2), "24");
            savePrice(priceRepository, ranchiMandi, wheat, LocalDate.now().minusDays(1), "24.5");
            savePrice(priceRepository, ranchiMandi, wheat, LocalDate.now(), "25");
            savePrice(priceRepository, ramgarhMandi, wheat, LocalDate.now(), "24.5");
            savePrice(priceRepository, bokaroApmc, wheat, LocalDate.now(), "26");

            // Price series for Rice (Grain with MSP 23.00) across Mandis
            savePrice(priceRepository, ranchiMandi, rice, LocalDate.now().minusDays(2), "26");
            savePrice(priceRepository, ranchiMandi, rice, LocalDate.now().minusDays(1), "26.5");
            savePrice(priceRepository, ranchiMandi, rice, LocalDate.now(), "27");
            savePrice(priceRepository, ramgarhMandi, rice, LocalDate.now(), "26.2");
            savePrice(priceRepository, bokaroApmc, rice, LocalDate.now(), "28");

            // Price series for Lentil (Pulse with MSP 64.25) across Mandis
            savePrice(priceRepository, ranchiMandi, lentil, LocalDate.now().minusDays(1), "71");
            savePrice(priceRepository, ranchiMandi, lentil, LocalDate.now(), "72");
            savePrice(priceRepository, ramgarhMandi, lentil, LocalDate.now(), "70");
            savePrice(priceRepository, bokaroApmc, lentil, LocalDate.now(), "74");

            // 7-day price series for Mango (Fruit)
            savePrice(priceRepository, ranchiMandi, mango, LocalDate.now().minusDays(4), "65");
            savePrice(priceRepository, ranchiMandi, mango, LocalDate.now().minusDays(3), "68");
            savePrice(priceRepository, ranchiMandi, mango, LocalDate.now().minusDays(2), "70");
            savePrice(priceRepository, ranchiMandi, mango, LocalDate.now().minusDays(1), "74");
            savePrice(priceRepository, ranchiMandi, mango, LocalDate.now(), "78");
            savePrice(priceRepository, ramgarhMandi, mango, LocalDate.now(), "80");
            savePrice(priceRepository, jamshedpurYard, mango, LocalDate.now(), "82");

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

            // 7-day price series for Mustard Seeds (Seed with MSP 56.50)
            savePrice(priceRepository, ranchiMandi, mustardSeed, LocalDate.now().minusDays(3), "52");
            savePrice(priceRepository, ranchiMandi, mustardSeed, LocalDate.now().minusDays(2), "54");
            savePrice(priceRepository, ranchiMandi, mustardSeed, LocalDate.now().minusDays(1), "55");
            savePrice(priceRepository, ranchiMandi, mustardSeed, LocalDate.now(), "58");
            savePrice(priceRepository, ramgarhMandi, mustardSeed, LocalDate.now(), "57");
            savePrice(priceRepository, bokaroApmc, mustardSeed, LocalDate.now(), "60");

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

            // --- Seed Sample Farmer Produce ---
            FarmerProduce sampleProduce = new FarmerProduce();
            sampleProduce.setFarmer(farmer);
            sampleProduce.setCrop(tomato);
            sampleProduce.setQuantity(new BigDecimal("1200"));
            sampleProduce.setQuality("Grade A");
            sampleProduce.setExpectedPrice(new BigDecimal("32.0"));
            sampleProduce.setHarvestDate(LocalDate.now());
            sampleProduce.setAvailableUntil(LocalDate.now().plusDays(10));
            sampleProduce.setDescription("NABL certified Grade A+ farm fresh tomatoes.");
            produceRepository.save(sampleProduce);

            FarmerProduce sampleProduceWheat = new FarmerProduce();
            sampleProduceWheat.setFarmer(farmer);
            sampleProduceWheat.setCrop(wheat);
            sampleProduceWheat.setQuantity(new BigDecimal("3500"));
            sampleProduceWheat.setQuality("Grade A");
            sampleProduceWheat.setExpectedPrice(new BigDecimal("26.5"));
            sampleProduceWheat.setHarvestDate(LocalDate.now());
            sampleProduceWheat.setAvailableUntil(LocalDate.now().plusDays(30));
            sampleProduceWheat.setDescription("Premium Sharbati Wheat, machine cleaned and sorted.");
            produceRepository.save(sampleProduceWheat);

            FarmerProduce sampleProduceMustard = new FarmerProduce();
            sampleProduceMustard.setFarmer(farmer);
            sampleProduceMustard.setCrop(mustardSeed);
            sampleProduceMustard.setQuantity(new BigDecimal("800"));
            sampleProduceMustard.setQuality("Grade B");
            sampleProduceMustard.setExpectedPrice(new BigDecimal("59.0"));
            sampleProduceMustard.setHarvestDate(LocalDate.now());
            sampleProduceMustard.setAvailableUntil(LocalDate.now().plusDays(20));
            sampleProduceMustard.setDescription("High oil content bold mustard seeds, standard Mandi grade.");
            produceRepository.save(sampleProduceMustard);

            // --- Seed Sample Buyer Requirements ---
            BuyerRequirement sampleReq = new BuyerRequirement();
            sampleReq.setBuyer(buyer);
            sampleReq.setCrop(tomato);
            sampleReq.setRequiredQuantity(new BigDecimal("2000"));
            sampleReq.setQualityRequired("Grade A");
            sampleReq.setOfferedPrice(new BigDecimal("34.0"));
            sampleReq.setLocation("Nashik APMC Terminal Yard");
            sampleReq.setValidUntil(LocalDate.now().plusDays(14));
            requirementRepository.save(sampleReq);

            BuyerRequirement sampleReqWheat = new BuyerRequirement();
            sampleReqWheat.setBuyer(buyer);
            sampleReqWheat.setCrop(wheat);
            sampleReqWheat.setRequiredQuantity(new BigDecimal("5000"));
            sampleReqWheat.setQualityRequired("Grade A");
            sampleReqWheat.setOfferedPrice(new BigDecimal("28.0"));
            sampleReqWheat.setLocation("Bhopal Mandi Logistics Hub");
            sampleReqWheat.setValidUntil(LocalDate.now().plusDays(21));
            requirementRepository.save(sampleReqWheat);

            BuyerRequirement sampleReqMustard = new BuyerRequirement();
            sampleReqMustard.setBuyer(buyer);
            sampleReqMustard.setCrop(mustardSeed);
            sampleReqMustard.setRequiredQuantity(new BigDecimal("1500"));
            sampleReqMustard.setQualityRequired("Grade B");
            sampleReqMustard.setOfferedPrice(new BigDecimal("62.5"));
            sampleReqMustard.setLocation("Jaipur Krishi Upaj Mandi");
            sampleReqMustard.setValidUntil(LocalDate.now().plusDays(18));
            requirementRepository.save(sampleReqMustard);

            BuyerRequirement sampleReqRice = new BuyerRequirement();
            sampleReqRice.setBuyer(buyer);
            sampleReqRice.setCrop(rice);
            sampleReqRice.setRequiredQuantity(new BigDecimal("4000"));
            sampleReqRice.setQualityRequired("Grade A");
            sampleReqRice.setOfferedPrice(new BigDecimal("24.5"));
            sampleReqRice.setLocation("Karnal Grain Market Complex");
            sampleReqRice.setValidUntil(LocalDate.now().plusDays(25));
            requirementRepository.save(sampleReqRice);

            // --- Seed Sample Active Trade Deal ---
            TradeDeal sampleDeal = new TradeDeal();
            sampleDeal.setFarmer(farmer);
            sampleDeal.setBuyer(buyer);
            sampleDeal.setCrop(tomato);
            sampleDeal.setProduce(sampleProduce);
            sampleDeal.setRequirement(sampleReq);
            sampleDeal.setQuantity(new BigDecimal("1200"));
            sampleDeal.setAgreedPricePerKg(new BigDecimal("32.0"));
            sampleDeal.setTransportCost(new BigDecimal("450.0"));
            sampleDeal.setTotalAmount(new BigDecimal("38400.0"));
            sampleDeal.setNetFarmerReturn(new BigDecimal("37950.0"));
            sampleDeal.setStatus(TradeStatus.IN_TRANSIT);
            sampleDeal.setInitiatedBy(Role.FARMER);
            sampleDeal.setNotes("Standard Grade A+ sorted dispatch via KisanLink Freight.");
            tradeDealRepository.save(sampleDeal);

            // --- Seed Active Demands ---
            if (demandRepository.count() == 0) {
                Demand d1 = new Demand();
                d1.setBuyer(buyer);
                d1.setCropName("Tomato");
                d1.setMinQuantityKg(1000.0);
                d1.setMaxQuantityKg(3000.0);
                d1.setPreferredGrade(Grade.A);
                d1.setExpectedPricePerKg(34.0);
                demandRepository.save(d1);

                Demand d2 = new Demand();
                d2.setBuyer(buyer);
                d2.setCropName("Wheat");
                d2.setMinQuantityKg(2000.0);
                d2.setMaxQuantityKg(8000.0);
                d2.setPreferredGrade(Grade.A);
                d2.setExpectedPricePerKg(28.0);
                demandRepository.save(d2);

                Demand d3 = new Demand();
                d3.setBuyer(buyer);
                d3.setCropName("Mustard Seeds");
                d3.setMinQuantityKg(500.0);
                d3.setMaxQuantityKg(2500.0);
                d3.setPreferredGrade(Grade.B);
                d3.setExpectedPricePerKg(62.5);
                demandRepository.save(d3);

                Demand d4 = new Demand();
                d4.setBuyer(buyer);
                d4.setCropName("Rice (Paddy)");
                d4.setMinQuantityKg(3000.0);
                d4.setMaxQuantityKg(10000.0);
                d4.setPreferredGrade(Grade.A);
                d4.setExpectedPricePerKg(24.5);
                demandRepository.save(d4);

                Demand d5 = new Demand();
                d5.setBuyer(buyer);
                d5.setCropName("Mango");
                d5.setMinQuantityKg(400.0);
                d5.setMaxQuantityKg(1500.0);
                d5.setPreferredGrade(Grade.A);
                d5.setExpectedPricePerKg(185.0);
                demandRepository.save(d5);
            }

            // --- Seed Sample Transporters ---
            seedTransporters(userRepository, transporterRepository,
                    new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder());

        };
    }



    private Crop crop(CropRepository repo, String name, CropCategory category, String unit) {
        return crop(repo, name, category, unit, null);
    }

    private Crop crop(CropRepository repo, String name, CropCategory category, String unit, BigDecimal mspPrice) {
        Crop c = new Crop();
        c.setName(name);
        c.setCategory(category);
        c.setUnit(unit);
        c.setMspPrice(mspPrice);
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

    private void seedTransporters(UserRepository userRepository,
                                  TransporterRepository transporterRepository,
                                  org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder encoder) {
        if (transporterRepository.count() > 0) return;

        record T(String name, String email, String phone, String vNum, VehicleType vType,
                 double cap, String dist, String state, double lat, double lon,
                 double rate, double base, boolean verified) {}

        List<T> transporters = List.of(
            new T("Suresh Logistics", "transporter@kisanlink.in", "9001112222",
                  "JH-01-AB-1234", VehicleType.MINI_TRUCK, 2000,
                  "Ranchi", "Jharkhand", 23.3441, 85.3096, 15.0, 100.0, true),
            new T("Ramesh Transport Co.", "ramesh.transport@kisanlink.in", "9002223333",
                  "JH-05-CD-5678", VehicleType.FULL_TRUCK, 5000,
                  "Bokaro", "Jharkhand", 23.6693, 86.1511, 18.0, 150.0, true),
            new T("Gupta Tempo Service", "gupta.tempo@kisanlink.in", "9003334444",
                  "JH-02-EF-9012", VehicleType.TEMPO, 1000,
                  "Hazaribagh", "Jharkhand", 23.9925, 85.3637, 12.0, 80.0, false),
            new T("Singh Pickup Express", "singh.pickup@kisanlink.in", "9004445555",
                  "JH-03-GH-3456", VehicleType.PICKUP, 500,
                  "Ramgarh", "Jharkhand", 23.6283, 85.5104, 10.0, 60.0, false),
            new T("Jha Heavy Logistics", "jha.logistics@kisanlink.in", "9005556666",
                  "JH-04-IJ-7890", VehicleType.FULL_TRUCK, 8000,
                  "Dhanbad", "Jharkhand", 23.7957, 86.4304, 20.0, 200.0, true)
        );

        String encoded = encoder.encode("Pass123!");
        for (T t : transporters) {
            User u = new User();
            u.setName(t.name()); u.setEmail(t.email()); u.setPhone(t.phone());
            u.setPassword(encoded); u.setRole(Role.TRANSPORTER);
            u = userRepository.save(u);

            Transporter tr = new Transporter();
            tr.setUser(u);
            tr.setVehicleType(t.vType());
            tr.setVehicleNumber(t.vNum());
            tr.setCapacityKg(BigDecimal.valueOf(t.cap()));
            tr.setBaseDistrict(t.dist()); tr.setBaseState(t.state());
            tr.setBaseLatitude(t.lat()); tr.setBaseLongitude(t.lon());
            tr.setRatePerKm(BigDecimal.valueOf(t.rate()));
            tr.setBaseCharge(BigDecimal.valueOf(t.base()));
            tr.setVerified(t.verified());
            tr.setAvailable(true);
            tr.setAlertPhone(t.phone());
            transporterRepository.save(tr);
        }
    }
}
