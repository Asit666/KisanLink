package com.kisanlink.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kisanlink.entity.Crop;
import com.kisanlink.entity.CropCategory;
import com.kisanlink.entity.Market;
import com.kisanlink.entity.MarketPrice;
import com.kisanlink.repository.CropRepository;
import com.kisanlink.repository.MarketPriceRepository;
import com.kisanlink.repository.MarketRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class MandiDataIngestionService {

    private static final Logger log = LoggerFactory.getLogger(MandiDataIngestionService.class);
    private static final DateTimeFormatter[] DATE_FORMATTERS = {
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("d/M/yyyy")
    };

    private final MarketPriceRepository marketPriceRepository;
    private final MarketRepository marketRepository;
    private final CropRepository cropRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient;

    @Value("${kisanlink.agmarknet.api-key:}")
    private String apiKey;

    @Value("${kisanlink.agmarknet.resource-id:9ef84268-d588-465a-a308-a864a43d0070}")
    private String resourceId;

    @Value("${kisanlink.agmarknet.fallback-resource-id:35985678-0d79-46b4-9ed6-6f13308a1d24}")
    private String fallbackResourceId;

    @Value("${kisanlink.agmarknet.default-state:Jharkhand}")
    private String defaultState;

    @Value("${kisanlink.agmarknet.enabled:true}")
    private boolean syncEnabled;

    public MandiDataIngestionService(MarketPriceRepository marketPriceRepository,
                                     MarketRepository marketRepository,
                                     CropRepository cropRepository) {
        this.marketPriceRepository = marketPriceRepository;
        this.marketRepository = marketRepository;
        this.cropRepository = cropRepository;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    public record MandiSyncResult(
            int recordsFetched,
            int recordsIngested,
            int recordsSkipped,
            String status,
            String message
    ) {}

    @Scheduled(cron = "${kisanlink.agmarknet.sync-cron:0 0 6,18 * * *}")
    public void scheduledAgmarknetSync() {
        if (!syncEnabled) {
            log.info("AGMARKNET scheduled sync is disabled by configuration.");
            return;
        }
        log.info("Starting scheduled AGMARKNET mandi price synchronization for state: {}", defaultState);
        MandiSyncResult result = syncMandiPrices(defaultState, 100);
        log.info("AGMARKNET sync completed: {}", result);
    }

    @Transactional
    public MandiSyncResult syncMandiPrices(String state, Integer limit) {
        String targetState = (state != null && !state.isBlank()) ? state.trim() : defaultState;
        int maxRecords = (limit != null && limit > 0 && limit <= 500) ? limit : 100;

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("AGMARKNET API Key is not configured (kisanlink.agmarknet.api-key). Operating in local validation mode.");
            return new MandiSyncResult(0, 0, 0, "API_KEY_REQUIRED",
                    "AGMARKNET API key not set. Add AGMARKNET_API_KEY to environment variables to ingest live data.gov.in feeds.");
        }

        try {
                JsonNode recordsNode = fetchRecords(resourceId, targetState, maxRecords, true);
                String usedResourceId = resourceId;
                if (recordsNode.isEmpty() && fallbackResourceId != null && !fallbackResourceId.isBlank()
                    && !fallbackResourceId.equals(resourceId)) {
                recordsNode = fetchRecords(fallbackResourceId, targetState, maxRecords, true);
                usedResourceId = fallbackResourceId;
                }
                if (recordsNode.isEmpty()) {
                recordsNode = fetchRecords(usedResourceId, targetState, maxRecords, false);
                }
            if (!recordsNode.isArray() || recordsNode.isEmpty()) {
                return new MandiSyncResult(0, 0, 0, "NO_RECORDS",
                        "No mandi price records returned for state: " + targetState);
            }

            int fetched = recordsNode.size();
            int ingested = 0;
            int skipped = 0;

            for (JsonNode record : recordsNode) {
                boolean saved = processRecord(record, targetState);
                if (saved) {
                    ingested++;
                } else {
                    skipped++;
                }
            }

            return new MandiSyncResult(fetched, ingested, skipped, "SUCCESS",
                    String.format("Successfully ingested %d of %d live mandi records for %s using resource %s.", ingested, fetched, targetState, usedResourceId));

        } catch (Exception e) {
            log.error("Failed to sync AGMARKNET mandi prices: {}", e.getMessage(), e);
            return new MandiSyncResult(0, 0, 0, "EXCEPTION", "Error syncing AGMARKNET: " + e.getMessage());
        }
    }

    private JsonNode fetchRecords(String requestedResourceId, String state, int limit, boolean filterByState) throws Exception {
        StringBuilder url = new StringBuilder(String.format(Locale.US,
                "https://api.data.gov.in/resource/%s?api-key=%s&format=json&limit=%d",
                requestedResourceId, apiKey, limit));
        if (filterByState) {
            url.append("&filters[state]=").append(URLEncoder.encode(state, StandardCharsets.UTF_8));
        }
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url.toString()))
                .timeout(Duration.ofSeconds(10))
                .header("User-Agent", "KisanLink-Mandi-Ingestion/1.0")
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            log.warn("AGMARKNET resource {} returned HTTP {}", requestedResourceId, response.statusCode());
            return objectMapper.createArrayNode();
        }
        JsonNode records = objectMapper.readTree(response.body()).path("records");
        return records.isArray() ? records : objectMapper.createArrayNode();
    }

    private boolean processRecord(JsonNode record, String defaultStateName) {
        try {
            String commodityName = record.path("commodity").asText("").trim();
            String marketName = record.path("market").asText("").trim();
            String district = record.path("district").asText("").trim();
            String state = record.path("state").asText(defaultStateName).trim();
            String arrivalDateStr = record.path("arrival_date").asText("").trim();

            if (!state.isBlank() && !state.equalsIgnoreCase(defaultStateName)) {
                return false;
            }

            double minPriceVal = record.path("min_price").asDouble(0.0);
            double maxPriceVal = record.path("max_price").asDouble(0.0);
            double modalPriceVal = record.path("modal_price").asDouble(0.0);

            if (commodityName.isEmpty() || marketName.isEmpty() || modalPriceVal <= 0) {
                return false;
            }

            // Convert per-quintal price (standard in AGMARKNET) to per-kg if necessary, or store per-kg price
            // Standard AGMARKNET is in INR per Quintal (100 kg)
            BigDecimal modalPrice = BigDecimal.valueOf(modalPriceVal / 100.0).setScale(2, java.math.RoundingMode.HALF_UP);
            BigDecimal minPrice = minPriceVal > 0 ? BigDecimal.valueOf(minPriceVal / 100.0).setScale(2, java.math.RoundingMode.HALF_UP) : modalPrice;
            BigDecimal maxPrice = maxPriceVal > 0 ? BigDecimal.valueOf(maxPriceVal / 100.0).setScale(2, java.math.RoundingMode.HALF_UP) : modalPrice;

            LocalDate arrivalDate = parseArrivalDate(arrivalDateStr);

            // Match or create Crop
            Crop crop = cropRepository.findByNameIgnoreCase(commodityName)
                    .orElseGet(() -> {
                        Crop newCrop = new Crop();
                        newCrop.setName(commodityName);
                        newCrop.setCategory(CropCategory.VEGETABLE);
                        return cropRepository.save(newCrop);
                    });

            // Match or create Market
            Market market = marketRepository.findByNameIgnoreCase(marketName)
                    .orElseGet(() -> {
                        Market newMarket = new Market();
                        newMarket.setName(marketName);
                        newMarket.setAddress(district.isEmpty() ? marketName : district + ", " + state);
                        newMarket.setState(state);
                        newMarket.setDistrict(district);
                        newMarket.setMarketType(com.kisanlink.entity.MarketType.APMC);
                        return marketRepository.save(newMarket);
                    });

            // Check if price record exists for market, crop, and date
            if (marketPriceRepository.findByMarketIdAndCropIdAndDate(market.getId(), crop.getId(), arrivalDate).isPresent()) {
                return false; // Skip duplicate
            }

            MarketPrice marketPrice = new MarketPrice();
            marketPrice.setMarket(market);
            marketPrice.setCrop(crop);
            marketPrice.setDate(arrivalDate);
            marketPrice.setMinPrice(minPrice);
            marketPrice.setMaxPrice(maxPrice);
            marketPrice.setModalPrice(modalPrice);
            marketPrice.setSource("AGMARKNET_LIVE");

            marketPriceRepository.save(marketPrice);
            return true;

        } catch (Exception e) {
            log.debug("Skipping invalid AGMARKNET record: {}", e.getMessage());
            return false;
        }
    }

    private LocalDate parseArrivalDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return LocalDate.now();
        }
        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(dateStr, formatter);
            } catch (Exception ignored) {
            }
        }
        return LocalDate.now();
    }
}
