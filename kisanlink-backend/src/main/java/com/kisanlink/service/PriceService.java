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
    private final NotificationWebSocketService notificationWebSocketService;

    public PriceService(MarketPriceRepository priceRepository,
                        MarketRepository marketRepository,
                        CropRepository cropRepository,
                        NotificationWebSocketService notificationWebSocketService) {
        this.priceRepository = priceRepository;
        this.marketRepository = marketRepository;
        this.cropRepository = cropRepository;
        this.notificationWebSocketService = notificationWebSocketService;
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
            return new PriceTrendResponse("STABLE", BigDecimal.valueOf(25), BigDecimal.ZERO);
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

        List<MarketPrice> existingPrices = priceRepository.findByCropIdOrderByDateDesc(crop.getId());
        BigDecimal previousPrice = existingPrices.isEmpty() ? request.modalPrice() : existingPrices.getFirst().getModalPrice();

        MarketPrice price = new MarketPrice();
        price.setMarket(market);
        price.setCrop(crop);
        price.setDate(request.date());
        price.setMinPrice(request.minPrice());
        price.setMaxPrice(request.maxPrice());
        price.setModalPrice(request.modalPrice());
        price.setSource(request.source());
        MarketPrice saved = priceRepository.save(price);

        // Compute price delta & broadcast live alert via WebSockets
        try {
            BigDecimal changePct = BigDecimal.ZERO;
            String direction = "STABLE";
            if (previousPrice.signum() > 0) {
                changePct = request.modalPrice().subtract(previousPrice)
                        .divide(previousPrice, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
                if (changePct.compareTo(BigDecimal.valueOf(0.5)) > 0) {
                    direction = "UPWARD";
                } else if (changePct.compareTo(BigDecimal.valueOf(-0.5)) < 0) {
                    direction = "DOWNWARD";
                }
            }

            com.kisanlink.dto.PriceAlertEvent alert = new com.kisanlink.dto.PriceAlertEvent(
                    crop.getName(),
                    market.getName(),
                    saved.getModalPrice(),
                    previousPrice,
                    changePct,
                    direction,
                    java.time.Instant.now()
            );
            notificationWebSocketService.broadcastPriceAlert(alert);
        } catch (Exception e) {
            // Non-blocking broadcast
        }

        return saved;
    }
}
