package com.kisanlink.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kisanlink.dto.WeatherAdvisoryResponse;
import com.kisanlink.dto.WeatherDailyForecast;
import com.kisanlink.entity.Crop;
import com.kisanlink.entity.CropCategory;
import com.kisanlink.repository.CropRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class WeatherAdvisoryService {

    private static final Logger log = LoggerFactory.getLogger(WeatherAdvisoryService.class);
    private final CropRepository cropRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public WeatherAdvisoryService(CropRepository cropRepository, ObjectMapper objectMapper) {
        this.cropRepository = cropRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
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

        WeatherData liveData = fetchLiveWeatherData(lat, lon);

        double currentTemp;
        int humidity;
        double rainfallMm;
        double windSpeed;
        String currentCondition;
        List<WeatherDailyForecast> forecastList;

        if (liveData != null) {
            currentTemp = liveData.currentTemp();
            humidity = liveData.humidity();
            rainfallMm = liveData.rainfallMm();
            windSpeed = liveData.windSpeed();
            currentCondition = liveData.currentCondition();
            forecastList = liveData.forecast();
        } else {
            // Offline fallback: Micro-climate synthesis based on coordinates and season
            double latOffset = (lat - 23.0) * 1.2;
            currentTemp = Math.round((28.5 - latOffset) * 10.0) / 10.0;
            humidity = Math.min(95, Math.max(45, (int) Math.round(68 + (lon - 85.0) * 8.0)));
            rainfallMm = (humidity > 75) ? 2.5 : 0.0;
            windSpeed = Math.round((12.0 + Math.abs(lat - 23.5) * 3.0) * 10.0) / 10.0;

            if (rainfallMm > 5.0) {
                currentCondition = "RAIN_SHOWER";
            } else if (humidity > 72) {
                currentCondition = "PARTLY_CLOUDY";
            } else {
                currentCondition = "SUNNY";
            }

            forecastList = generateSynthesizedForecast(currentTemp, humidity, windSpeed);
        }

        // Harvest Suitability & Window calculation
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
                transitAdvisory = "High heat and moisture accelerate post-harvest decay. Dispatch within 3 hours in ventilated plastic crates under shade.";
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
                transitAdvisory = "Dry ambient conditions optimal for grain and seed transit and warehouse storage.";
            }
        }

        // Tailored Crop Advisories
        List<String> cropAdvisories = new ArrayList<>();
        cropAdvisories.add(String.format("Optimal Harvest Window: %s for %s (%s).", recommendedHarvestWindow, cropName, category));
        if (isPerishable) {
            cropAdvisories.add(String.format("Produce Turgidity: Harvest during low-evapotranspiration morning hours to retain fresh weight in %s.", cropName));
            if (humidity > 70) {
                cropAdvisories.add("Fungal Spore Risk: Elevated humidity may promote soft rot. Avoid packing damp or wet produce.");
            }
        } else {
            cropAdvisories.add(String.format("Moisture Content: Keep %s moisture level below 12%% before bagging to prevent fungal growth during storage.", cropName));
            cropAdvisories.add("Pest Shield: Ensure clean, dry jute bags and store on raised wooden pallets.");
        }
        if (currentTemp > 30.0) {
            cropAdvisories.add("Solar Heat Warning: Direct sunlight on harvested crates can increase internal pulp temperature rapidly.");
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

    private WeatherData fetchLiveWeatherData(double lat, double lon) {
        try {
            String url = String.format(Locale.US,
                    "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto",
                    lat, lon);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(4))
                    .header("User-Agent", "KisanLink-Weather-Advisory/1.0")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("Open-Meteo weather API returned status {}. Using fallback model.", response.statusCode());
                return null;
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode current = root.path("current");
            if (current.isMissingNode()) {
                return null;
            }

            double currentTemp = current.path("temperature_2m").asDouble(28.0);
            int humidity = current.path("relative_humidity_2m").asInt(65);
            double rainfallMm = current.path("precipitation").asDouble(0.0);
            double windSpeed = current.path("wind_speed_10m").asDouble(12.0);
            int weatherCode = current.path("weather_code").asInt(0);
            String currentCondition = mapWeatherCodeToCondition(weatherCode);

            List<WeatherDailyForecast> forecastList = new ArrayList<>();
            JsonNode daily = root.path("daily");
            if (!daily.isMissingNode()) {
                JsonNode times = daily.path("time");
                JsonNode maxTemps = daily.path("temperature_2m_max");
                JsonNode minTemps = daily.path("temperature_2m_min");
                JsonNode precipProbs = daily.path("precipitation_probability_max");
                JsonNode windSpeeds = daily.path("wind_speed_10m_max");
                JsonNode weatherCodes = daily.path("weather_code");

                int count = Math.min(5, times.size());
                for (int i = 0; i < count; i++) {
                    LocalDate date = LocalDate.parse(times.get(i).asText());
                    String dayName = (i == 0) ? "Today" : date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
                    double tMax = maxTemps.has(i) ? maxTemps.get(i).asDouble() : currentTemp + 4.0;
                    double tMin = minTemps.has(i) ? minTemps.get(i).asDouble() : currentTemp - 5.0;
                    int prob = precipProbs.has(i) ? precipProbs.get(i).asInt() : 10;
                    double wind = windSpeeds.has(i) ? windSpeeds.get(i).asDouble() : windSpeed;
                    int code = weatherCodes.has(i) ? weatherCodes.get(i).asInt() : weatherCode;
                    String cond = mapWeatherCodeToCondition(code);

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
                            humidity,
                            wind,
                            dailyAdv
                    ));
                }
            }

            if (forecastList.isEmpty()) {
                forecastList = generateSynthesizedForecast(currentTemp, humidity, windSpeed);
            }

            return new WeatherData(currentTemp, humidity, rainfallMm, windSpeed, currentCondition, forecastList);

        } catch (Exception e) {
            log.info("Live weather query skipped/offline ({}). Falling back to agro-climate projection.", e.getMessage());
            return null;
        }
    }

    private List<WeatherDailyForecast> generateSynthesizedForecast(double currentTemp, int humidity, double windSpeed) {
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
        return forecastList;
    }

    private String mapWeatherCodeToCondition(int weatherCode) {
        if (weatherCode == 0) return "SUNNY";
        if (weatherCode >= 1 && weatherCode <= 3) return "PARTLY_CLOUDY";
        if (weatherCode == 45 || weatherCode == 48) return "FOGGY";
        if (weatherCode >= 51 && weatherCode <= 67) return "RAIN_SHOWER";
        if (weatherCode >= 80 && weatherCode <= 82) return "RAIN_SHOWER";
        if (weatherCode >= 71 && weatherCode <= 77) return "SNOW_SHOWER";
        if (weatherCode >= 95 && weatherCode <= 99) return "THUNDERSTORM";
        return "SUNNY";
    }

    private String resolveLocationName(double lat, double lon) {
        if (Math.abs(lat - 23.3441) < 0.15 && Math.abs(lon - 85.3096) < 0.15) return "Ranchi Region";
        if (Math.abs(lat - 23.6332) < 0.15 && Math.abs(lon - 85.5149) < 0.15) return "Ramgarh District";
        if (Math.abs(lat - 23.6693) < 0.15 && Math.abs(lon - 86.1511) < 0.15) return "Bokaro APMC Zone";
        if (Math.abs(lat - 22.8046) < 0.15 && Math.abs(lon - 86.2029) < 0.15) return "Jamshedpur Valley";
        if (Math.abs(lat - 23.9925) < 0.15 && Math.abs(lon - 85.3637) < 0.15) return "Hazaribagh Agro Belt";
        if (Math.abs(lat - 23.7957) < 0.15 && Math.abs(lon - 86.4304) < 0.15) return "Dhanbad Region";
        return String.format(Locale.US, "GPS %.2f°N, %.2f°E", lat, lon);
    }

    private record WeatherData(
            double currentTemp,
            int humidity,
            double rainfallMm,
            double windSpeed,
            String currentCondition,
            List<WeatherDailyForecast> forecast
    ) {}
}
