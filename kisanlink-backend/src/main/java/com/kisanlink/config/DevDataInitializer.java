package com.kisanlink.config;

import com.kisanlink.entity.Crop;
import com.kisanlink.entity.Market;
import com.kisanlink.entity.MarketPrice;
import com.kisanlink.entity.MarketType;
import com.kisanlink.repository.CropRepository;
import com.kisanlink.repository.MarketPriceRepository;
import com.kisanlink.repository.MarketRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.math.BigDecimal;
import java.time.LocalDate;

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

            Crop tomato = new Crop();
            tomato.setName("Tomato");
            tomato.setCategory("Vegetable");
            tomato.setUnit("kg");
            cropRepository.save(tomato);

            Market ranchiMandi = new Market();
            ranchiMandi.setName("Ranchi Main Mandi");
            ranchiMandi.setDistrict("Ranchi");
            ranchiMandi.setState("Jharkhand");
            ranchiMandi.setLatitude(23.3441);
            ranchiMandi.setLongitude(85.3096);
            ranchiMandi.setMarketType(MarketType.MANDI);
            marketRepository.save(ranchiMandi);

            savePrice(priceRepository, ranchiMandi, tomato, LocalDate.now().minusDays(1), "21");
            savePrice(priceRepository, ranchiMandi, tomato, LocalDate.now(), "23");
        };
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
