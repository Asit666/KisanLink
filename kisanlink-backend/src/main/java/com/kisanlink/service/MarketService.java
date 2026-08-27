package com.kisanlink.service;

import com.kisanlink.config.RecommendationConfig;
import com.kisanlink.dto.MarketRequest;
import com.kisanlink.dto.NearbyMarketResponse;
import com.kisanlink.entity.Market;
import com.kisanlink.repository.MarketRepository;
import com.kisanlink.util.DistanceCalculator;
import com.kisanlink.util.ProfitCalculator;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;

@Service
public class MarketService {
    private final MarketRepository marketRepository;
    private final RecommendationConfig config;

    public MarketService(MarketRepository marketRepository, RecommendationConfig config) {
        this.marketRepository = marketRepository;
        this.config = config;
    }

    public List<Market> findAll() {
        return marketRepository.findAll();
    }

    public Market findById(Long id) {
        return marketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Market not found: " + id));
    }

    public Market create(MarketRequest request) {
        Market market = new Market();
        market.setName(request.name());
        market.setAddress(request.address());
        market.setDistrict(request.district());
        market.setState(request.state());
        market.setLatitude(request.latitude());
        market.setLongitude(request.longitude());
        market.setMarketType(request.marketType());
        return marketRepository.save(market);
    }

    /**
     * Finds markets ordered by shortest distance from the given coordinates.
     * Computes transport freight cost, travel time estimates, compass direction, and navigation links.
     */
    public List<NearbyMarketResponse> findNearbyMarkets(Double originLat, Double originLon,
                                                        Double maxDistanceKm, Integer limit) {
        // Fallback to default coordinates if origin not provided (e.g. Ranchi center: 23.3441, 85.3096)
        double lat = originLat != null ? originLat : 23.3441;
        double lon = originLon != null ? originLon : 85.3096;

        double maxDist = (maxDistanceKm != null && maxDistanceKm > 0)
                ? maxDistanceKm
                : config.getTransport().getMaxDistanceKm();

        int maxResults = (limit != null && limit > 0) ? limit : 10;

        BigDecimal baseCharge = config.getTransport().getBaseCharge();
        BigDecimal ratePerKm = config.getTransport().getRatePerKm();

        return marketRepository.findAll().stream()
                .filter(m -> m.getLatitude() != null && m.getLongitude() != null)
                .map(m -> {
                    BigDecimal distance = DistanceCalculator.between(lat, lon, m.getLatitude(), m.getLongitude());
                    BigDecimal transportCost = ProfitCalculator.transport(distance, baseCharge, ratePerKm);

                    // Average agricultural freight transit speed ~40 km/h
                    int durationMinutes = Math.max(5, (int) Math.round(distance.doubleValue() / 40.0 * 60));

                    String direction = calculateCardinalDirection(lat, lon, m.getLatitude(), m.getLongitude());

                    String routeSummary = String.format("%.1f km via Regional Highway (~%d mins)",
                            distance.doubleValue(), durationMinutes);

                    String navigationUrl = String.format(
                            "https://www.google.com/maps/dir/?api=1&origin=%.6f,%.6f&destination=%.6f,%.6f",
                            lat, lon, m.getLatitude(), m.getLongitude());

                    return new NearbyMarketResponse(
                            m.getId(),
                            m.getName(),
                            m.getAddress(),
                            m.getDistrict(),
                            m.getState(),
                            m.getLatitude(),
                            m.getLongitude(),
                            m.getMarketType(),
                            distance,
                            transportCost,
                            durationMinutes,
                            direction,
                            routeSummary,
                            navigationUrl
                    );
                })
                .filter(res -> res.distanceKm().doubleValue() <= maxDist)
                .sorted(Comparator.comparing(NearbyMarketResponse::distanceKm))
                .limit(maxResults)
                .toList();
    }

    private static String calculateCardinalDirection(double lat1, double lon1, double lat2, double lon2) {
        if (Math.abs(lat1 - lat2) < 0.0001 && Math.abs(lon1 - lon2) < 0.0001) {
            return "Local";
        }
        double lat1Rad = Math.toRadians(lat1);
        double lat2Rad = Math.toRadians(lat2);
        double deltaLonRad = Math.toRadians(lon2 - lon1);

        double y = Math.sin(deltaLonRad) * Math.cos(lat2Rad);
        double x = Math.cos(lat1Rad) * Math.sin(lat2Rad)
                - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLonRad);
        double bearing = (Math.toDegrees(Math.atan2(y, x)) + 360.0) % 360.0;

        String[] directions = {"N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"};
        int index = (int) Math.round(bearing / 45.0) % 8;
        return directions[index];
    }
}
