package com.kisanlink.controller;

import com.kisanlink.dto.MarketRequest;
import com.kisanlink.entity.Market;
import com.kisanlink.service.MarketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/markets")
public class MarketController {
    private final MarketService marketService;

    public MarketController(MarketService marketService) {
        this.marketService = marketService;
    }

    @GetMapping
    public List<Market> findAll() {
        return marketService.findAll();
    }

    @GetMapping("/{id}")
    public Market findById(@PathVariable Long id) {
        return marketService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Market create(@Valid @RequestBody MarketRequest request) {
        return marketService.create(request);
    }
}
