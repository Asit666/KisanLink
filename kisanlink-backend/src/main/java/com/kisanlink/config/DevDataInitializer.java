package com.kisanlink.config;

import com.kisanlink.entity.*;
import com.kisanlink.repository.CropRepository;
import com.kisanlink.repository.MarketPriceRepository;
import com.kisanlink.repository.MarketRepository;
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
                                           MarketPriceRepository priceRepository) {
        return arguments -> {
            if (cropRepository.count() > 0) {
                return;
            }

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


