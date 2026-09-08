package com.kisanlink.controller;

import com.kisanlink.dto.MarketPriceRequest;
import com.kisanlink.dto.PriceTrendResponse;
import com.kisanlink.entity.MarketPrice;
import com.kisanlink.service.MandiDataIngestionService;
import com.kisanlink.service.PriceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/prices")
public class PriceController {
    private final PriceService priceService;
    private final MandiDataIngestionService mandiDataIngestionService;

    public PriceController(PriceService priceService, MandiDataIngestionService mandiDataIngestionService) {
        this.priceService = priceService;
        this.mandiDataIngestionService = mandiDataIngestionService;
    }

    @GetMapping("/{cropId}")
    public List<MarketPrice> findByCrop(@PathVariable Long cropId) {
        return priceService.findByCrop(cropId);
    }

    @GetMapping("/{cropId}/history")
    public List<MarketPrice> history(@PathVariable Long cropId,
                                     @RequestParam LocalDate from,
                                     @RequestParam LocalDate to) {
        return priceService.history(cropId, from, to);
    }

    @GetMapping("/{cropId}/trend")
    public PriceTrendResponse trend(@PathVariable Long cropId) {
        return priceService.trend(cropId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MarketPrice create(@Valid @RequestBody MarketPriceRequest request) {
        return priceService.create(request);
    }

    @PostMapping("/sync-agmarknet")
    public MandiDataIngestionService.MandiSyncResult syncAgmarknet(
            @RequestParam(required = false) String state,
            @RequestParam(required = false, defaultValue = "100") Integer limit) {
        return mandiDataIngestionService.syncMandiPrices(state, limit);
    }
}
