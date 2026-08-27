package com.kisanlink.service;

import com.kisanlink.dto.WeatherAdvisoryResponse;
import com.kisanlink.dto.WeatherDailyForecast;
import com.kisanlink.entity.Crop;
import com.kisanlink.entity.CropCategory;
import com.kisanlink.repository.CropRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class WeatherAdvisoryService {

    private final CropRepository cropRepository;

    public WeatherAdvisoryService(CropRepository cropRepository) {
        this.cropRepository = cropRepository;
    }

    public WeatherAdvisoryResponse getAdvisory(Double latitude, Double longitude, Long cropId, String locationName) {
        double lat = latitude != null ? latitude : 23.3441;
        double lon = longitude != null ? longitude : 85.3096;
        String locName = (locationName != null && !locationName.isBlank()) ? locationName : resolveLocationName(lat, lon);

        Crop crop = null;
        if (cropId != null) {
            crop = cropRepository.findById(cropId).orElse(null);
        }

        CropCategory category = crop != null && crop.getCategory() != null ? crop.getCategory() : CropCategory.VEGETABLE;
        String cropName = crop != null ? crop.getName() : "General Produce";

        // Micro-climate synthesis based on coordinates & season
        double latOffset = (lat - 23.0) * 1.2;
        double currentTemp = Math.round((28.5 - latOffset) * 10.0) / 10.0;
        int humidity = Math.min(95, Math.max(45, (int) Math.round(68 + (lon - 85.0) * 8.0)));
        double rainfallMm = (humidity > 75) ? 2.5 : 0.0;
        double windSpeed = Math.round((12.0 + Math.abs(lat - 23.5) * 3.0) * 10.0) / 10.0;

        String currentCondition;
        if (rainfallMm > 5.0) {
            currentCondition = "RAIN_SHOWER";
        } else if (humidity > 72) {
            currentCondition = "PARTLY_CLOUDY";
        } else {
            currentCondition = "SUNNY";
        }

        // Harvest Suitability & Window
        String harvestSuitability;
        String recommendedHarvestWindow;
        if (rainfallMm > 10.0 || windSpeed > 35.0) {
            harvestSuitability = "HAZARDOUS";
            recommendedHarvestWindow = "Postpone harvest until storm/rain passes";
        } else if (rainfallMm > 2.0) {
            harvestSuitability = "UNFAVORABLE";
            recommendedHarvestWindow = "Mid-day dry window (11:00 AM - 02:00 PM)";
        } else if (currentTemp > 33.0) {
            harvestSuitability = "FAVORABLE";
            recommendedHarvestWindow = "Early Dawn (05:30 AM - 08:30 AM) to avoid solar heat stress";
        } else {
            harvestSuitability = "EXCELLENT";
            recommendedHarvestWindow = "Morning (06:00 AM - 09:30 AM) or Evening (04:30 PM - 06:30 PM)";
        }

        // Spoilage Risk Calculation
        String spoilageRiskIndex;
        String transitAdvisory;
        boolean isPerishable = (category == CropCategory.VEGETABLE || category == CropCategory.FRUIT || category == CropCategory.OTHER);

        if (isPerishable) {
            if (currentTemp >= 32.0 && humidity >= 70) {
                spoilageRiskIndex = "CRITICAL";
                transitAdvisory = "High heat & moisture accelerate post-harvest decay. Dispatch within 3 hours in ventilated plastic crates under shade.";
            } else if (currentTemp >= 28.0 || humidity >= 75) {
                spoilageRiskIndex = "HIGH";
                transitAdvisory = "Dispatch within 6-8 hours. Cover vehicle with breathable tarpaulin and ensure crate airflow.";
            } else if (currentTemp >= 24.0) {
                spoilageRiskIndex = "MODERATE";
                transitAdvisory = "Standard transit safe up to 150 km. Protect from direct solar radiation during transit.";
            } else {
                spoilageRiskIndex = "LOW";
                transitAdvisory = "Favorable transit conditions. Ambient shelf-life exceeds 48 hours.";
            }
        } else {
            // Grains, Seeds, Pulses, Oilseeds, Spices
            if (humidity >= 85 || rainfallMm > 0.0) {
                spoilageRiskIndex = "MODERATE";
                transitAdvisory = "Risk of moisture absorption and mold. Ensure moisture-proof sealed gunny bags and waterproof tarpaulin.";
            } else {
                spoilageRiskIndex = "LOW";
                transitAdvisory = "Dry ambient conditions optimal for grain & seed transit and warehouse storage.";
            }
        }

        // Tailored Crop Advisories
        List<String> cropAdvisories = new ArrayList<>();
        cropAdvisories.add(String.format("Optimal Harvest Window: %s for %s (%s).", recommendedHarvestWindow, cropName, category));
        if (isPerishable) {
            cropAdvisories.add(String.format("Produce Turgidity: Harvest during low-evapotranspiration morning hours to retain 95%% fresh weight in %s.", cropName));
            if (humidity > 70) {
                cropAdvisories.add("Fungal Spore Risk: Elevated humidity may promote soft rot. Avoid packing damp or wet produce.");
            }
        } else {
            cropAdvisories.add(String.format("Moisture Content: Keep %s moisture level below 12%% before bagging to prevent fungal growth during storage.", cropName));
            cropAdvisories.add("Pest Shield: Ensure clean, dry jute bags and store on raised wooden pallets.");
        }
        if (currentTemp > 30.0) {
            cropAdvisories.add("Solar Heat Warning: Direct sunlight on harvested crates can increase internal pulp temperature by 6-8°C.");
        }

        // 5-Day Forward Daily Forecast
        List<WeatherDailyForecast> forecastList = new ArrayList<>();
        LocalDate today = LocalDate.now();
        String[] conditions = {"SUNNY", "PARTLY_CLOUDY", "PARTLY_CLOUDY", "RAIN_SHOWER", "SUNNY"};
        int[] rainProbs = {10, 25, 35, 65, 15};
        double[] tempOffsets = {0.0, 0.8, -1.2, -2.5, 0.5};

        for (int i = 0; i < 5; i++) {
            LocalDate date = today.plusDays(i);
            String dayName = (i == 0) ? "Today" : date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            double tMax = Math.round((currentTemp + 3.5 + tempOffsets[i]) * 10.0) / 10.0;
            double tMin = Math.round((currentTemp - 5.5 + tempOffsets[i]) * 10.0) / 10.0;
            int prob = rainProbs[i % rainProbs.length];
            String cond = conditions[i % conditions.length];
            int hum = Math.min(95, Math.max(50, humidity + (prob > 50 ? 12 : -5)));
            double wind = Math.round((windSpeed + (i % 2 == 0 ? 1.5 : -1.0)) * 10.0) / 10.0;

            String dailyAdv;
            if (prob >= 50) {
                dailyAdv = "Rain predicted. Complete harvest before noon and prepare waterproof transport coverings.";
            } else if (tMax >= 33.0) {
                dailyAdv = "Hot day. Avoid afternoon harvesting and keep produce in cool shade.";
            } else {
                dailyAdv = "Clear weather. Ideal for harvesting, grading, and mandi dispatch.";
            }

            forecastList.add(new WeatherDailyForecast(
                    date,
                    dayName,
                    tMax,
                    tMin,
                    prob,
                    cond,
                    hum,
                    wind,
                    dailyAdv
            ));
        }

        return new WeatherAdvisoryResponse(
                locName,
                lat,
                lon,
                currentTemp,
                currentCondition,
                humidity,
                rainfallMm,
                windSpeed,
                harvestSuitability,
                recommendedHarvestWindow,
                spoilageRiskIndex,
                transitAdvisory,
                cropAdvisories,
                forecastList,
                Instant.now()
        );
    }

    private String resolveLocationName(double lat, double lon) {
        if (Math.abs(lat - 23.3441) < 0.15 && Math.abs(lon - 85.3096) < 0.15) return "Ranchi Region";
        if (Math.abs(lat - 23.6332) < 0.15 && Math.abs(lon - 85.5149) < 0.15) return "Ramgarh District";
        if (Math.abs(lat - 23.6693) < 0.15 && Math.abs(lon - 86.1511) < 0.15) return "Bokaro APMC Zone";
        if (Math.abs(lat - 22.8046) < 0.15 && Math.abs(lon - 86.2029) < 0.15) return "Jamshedpur Valley";
        if (Math.abs(lat - 23.9925) < 0.15 && Math.abs(lon - 85.3637) < 0.15) return "Hazaribagh Agro Belt";
        if (Math.abs(lat - 23.7957) < 0.15 && Math.abs(lon - 86.4304) < 0.15) return "Dhanbad Region";
        return String.format("GPS %.2f°N, %.2f°E", lat, lon);
    }
}
