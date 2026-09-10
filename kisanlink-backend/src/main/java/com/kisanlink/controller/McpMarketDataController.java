package com.kisanlink.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kisanlink.entity.Crop;
import com.kisanlink.entity.Market;
import com.kisanlink.entity.MarketPrice;
import com.kisanlink.repository.CropRepository;
import com.kisanlink.repository.MarketPriceRepository;
import com.kisanlink.repository.MarketRepository;
import com.kisanlink.service.MandiDataIngestionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.time.Instant;

@RestController
@RequestMapping("/mcp")
public class McpMarketDataController {
    private final CropRepository cropRepository;
    private final MarketRepository marketRepository;
    private final MarketPriceRepository priceRepository;
    private final MandiDataIngestionService mandiDataIngestionService;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private volatile Instant lastRefresh;
    private volatile String lastRefreshStatus = "NOT_ATTEMPTED";

    @Value("${kisanlink.mcp.token:}")
    private String mcpToken;

    @Value("${kisanlink.mcp.live-refresh-enabled:true}")
    private boolean liveRefreshEnabled;

    @Value("${kisanlink.mcp.refresh-minutes:15}")
    private int refreshMinutes;

    @Value("${kisanlink.agmarknet.default-state:Jharkhand}")
    private String defaultState;

    public McpMarketDataController(CropRepository cropRepository,
                                   MarketRepository marketRepository,
                                   MarketPriceRepository priceRepository,
                                   MandiDataIngestionService mandiDataIngestionService) {
        this.cropRepository = cropRepository;
        this.marketRepository = marketRepository;
        this.priceRepository = priceRepository;
        this.mandiDataIngestionService = mandiDataIngestionService;
    }

    @PostMapping
    public Map<String, Object> handle(@RequestBody Map<String, Object> request,
                                      @RequestHeader(value = "X-MCP-Token", required = false) String token) {
        verifyToken(token);
        String method = String.valueOf(request.getOrDefault("method", ""));
        Object id = request.get("id");

        if ("initialize".equals(method)) {
            return response(id, Map.of(
                    "protocolVersion", "2025-03-26",
                    "capabilities", Map.of("tools", Map.of()),
                    "serverInfo", Map.of("name", "kisanlink-market-mcp", "version", "1.0.0")
            ));
        }
        if ("notifications/initialized".equals(method)) {
            return Map.of();
        }
        if ("tools/list".equals(method)) {
            return response(id, Map.of("tools", List.of(
                    tool("get_latest_market_price", "Get the latest normalized market price for a crop and optional market."),
                    tool("get_historical_prices", "Get bounded historical normalized prices for a crop and optional market.")
            )));
        }
        if ("tools/call".equals(method)) {
            @SuppressWarnings("unchecked")
            Map<String, Object> params = (Map<String, Object>) request.getOrDefault("params", Map.of());
            String name = String.valueOf(params.getOrDefault("name", ""));
            @SuppressWarnings("unchecked")
            Map<String, Object> arguments = (Map<String, Object>) params.getOrDefault("arguments", Map.of());
            String result = switch (name) {
                case "get_latest_market_price" -> {
                    refreshLiveDataIfDue();
                    List<Map<String, Object>> rows = historicalRows(arguments, 1);
                    Map<String, Object> latest = new LinkedHashMap<>(rows.stream().findFirst()
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No market price history found")));
                    latest.put("data_status", dataStatus(rows));
                    yield toJson(latest);
                }
                case "get_historical_prices" -> historicalJson(arguments);
                default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown MCP tool: " + name);
            };
            return response(id, Map.of("content", List.of(Map.of("type", "text", "text", result))));
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported MCP method: " + method);
    }

    private void verifyToken(String token) {
        if (mcpToken != null && !mcpToken.isBlank() && !mcpToken.equals(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid MCP token");
        }
    }

    private Map<String, Object> tool(String name, String description) {
        return Map.of(
                "name", name,
                "description", description,
                "inputSchema", Map.of("type", "object", "properties", Map.of(
                        "crop", Map.of("type", "string"),
                        "market", Map.of("type", "string"),
                        "days", Map.of("type", "integer", "maximum", 730)
                ), "required", List.of("crop"))
        );
    }

    private Map<String, Object> response(Object id, Object result) {
        return Map.of("jsonrpc", "2.0", "id", id, "result", result);
    }

    private String historicalJson(Map<String, Object> arguments) {
        refreshLiveDataIfDue();
        int days = Math.max(1, Math.min(number(arguments.get("days"), 365), 730));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("crop", String.valueOf(arguments.get("crop")));
        result.put("market", arguments.getOrDefault("market", "ALL_MARKETS"));
        result.put("unit", "INR/kg");
        List<Map<String, Object>> rows = historicalRows(arguments, days);
        result.put("data_status", dataStatus(rows));
        result.put("last_refresh", lastRefresh == null ? null : lastRefresh.toString());
        result.put("refresh_status", lastRefreshStatus);
        result.put("data", rows);
        return toJson(result);
    }

    private String dataStatus(List<Map<String, Object>> rows) {
        if (rows.stream().anyMatch(row -> "AGMARKNET_LIVE".equals(row.get("source")))) {
            return "LIVE";
        }
        return "CACHED_DEVELOPMENT";
    }

    private synchronized void refreshLiveDataIfDue() {
        if (!liveRefreshEnabled || (lastRefresh != null && lastRefresh.plusSeconds(Math.max(1, refreshMinutes) * 60L).isAfter(Instant.now()))) {
            return;
        }
        MandiDataIngestionService.MandiSyncResult result = mandiDataIngestionService.syncMandiPrices(defaultState, 500);
        lastRefresh = Instant.now();
        lastRefreshStatus = result.status();
    }

    private List<Map<String, Object>> historicalRows(Map<String, Object> arguments, int days) {
        String cropName = String.valueOf(arguments.getOrDefault("crop", "")).trim();
        if (cropName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "crop is required");
        }
        Crop crop = cropRepository.findByNameIgnoreCase(cropName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Crop not found: " + cropName));
        String marketName = String.valueOf(arguments.getOrDefault("market", "")).trim();
        Market market = marketName.isBlank() ? null : marketRepository.findByNameIgnoreCase(marketName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Market not found: " + marketName));
        List<MarketPrice> prices = new ArrayList<>(priceRepository.findByCropIdOrderByDateDesc(crop.getId()));
        if (market != null) {
            prices.removeIf(price -> price.getMarket() == null || !price.getMarket().getId().equals(market.getId()));
        }
        return prices.stream().limit(days).map(this::toRow).toList();
    }

    private Map<String, Object> toRow(MarketPrice price) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("date", price.getDate() != null ? price.getDate().toString() : null);
        row.put("crop", price.getCrop().getName());
        row.put("market", price.getMarket().getName());
        row.put("modal_price", price.getModalPrice());
        row.put("min_price", price.getMinPrice());
        row.put("max_price", price.getMaxPrice());
        row.put("unit", "INR/kg");
        row.put("source", price.getSource() == null ? "DATABASE" : price.getSource());
        return row;
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize MCP result", exception);
        }
    }

    private int number(Object value, int fallback) {
        if (value instanceof Number number) return number.intValue();
        try { return Integer.parseInt(String.valueOf(value)); } catch (Exception ignored) { return fallback; }
    }
}