package com.kisanlink.service;

import com.kisanlink.dto.MarketRequest;
import com.kisanlink.entity.Market;
import com.kisanlink.repository.MarketRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MarketService {
    private final MarketRepository marketRepository;

    public MarketService(MarketRepository marketRepository) {
        this.marketRepository = marketRepository;
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
}
