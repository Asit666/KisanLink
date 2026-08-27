package com.kisanlink.service;

import com.kisanlink.dto.MarketPriceRequest;
import com.kisanlink.dto.PriceTrendResponse;
import com.kisanlink.entity.MarketPrice;
import com.kisanlink.repository.CropRepository;
import com.kisanlink.repository.MarketPriceRepository;
import com.kisanlink.repository.MarketRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class PriceService {
    private final MarketPriceRepository priceRepository;
    private final MarketRepository marketRepository;
    private final CropRepository cropRepository;

    public PriceService(MarketPriceRepository priceRepository, MarketRepository marketRepository,
                        CropRepository cropRepository) {
        this.priceRepository = priceRepository;
        this.marketRepository = marketRepository;
        this.cropRepository = cropRepository;
    }

    public List<MarketPrice> findByCrop(Long cropId) {
        return priceRepository.findByCropIdOrderByDateDesc(cropId);
    }

    public List<MarketPrice> history(Long cropId, LocalDate from, LocalDate to) {
        return priceRepository.findByCropIdAndDateBetweenOrderByDateAsc(cropId, from, to);
    }

    public PriceTrendResponse trend(Long cropId) {
        List<MarketPrice> prices = priceRepository.findByCropIdOrderByDateDesc(cropId);
        if (prices.isEmpty()) {
            throw new IllegalArgumentException("No price history found for crop: " + cropId);
        }
        BigDecimal latest = prices.getFirst().getModalPrice();
        BigDecimal previous = prices.size() > 1 ? prices.get(1).getModalPrice() : latest;
        BigDecimal change = previous.signum() == 0 ? BigDecimal.ZERO
                : latest.subtract(previous).divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
        String direction = change.compareTo(BigDecimal.ONE) > 0 ? "UPWARD"
                : change.compareTo(BigDecimal.ONE.negate()) < 0 ? "DOWNWARD" : "STABLE";
        return new PriceTrendResponse(direction, latest, change);
    }

    public MarketPrice create(MarketPriceRequest request) {
        var market = marketRepository.findById(request.marketId())
                .orElseThrow(() -> new IllegalArgumentException("Market not found: " + request.marketId()));
        var crop = cropRepository.findById(request.cropId())
                .orElseThrow(() -> new IllegalArgumentException("Crop not found: " + request.cropId()));
        MarketPrice price = new MarketPrice();
        price.setMarket(market);
        price.setCrop(crop);
        price.setDate(request.date());
        price.setMinPrice(request.minPrice());
        price.setMaxPrice(request.maxPrice());
        price.setModalPrice(request.modalPrice());
        price.setSource(request.source());
        return priceRepository.save(price);
    }
}
