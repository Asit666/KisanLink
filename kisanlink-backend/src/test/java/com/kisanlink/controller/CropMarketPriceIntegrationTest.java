package com.kisanlink.controller;

import tools.jackson.databind.ObjectMapper;
import com.kisanlink.dto.AuthResponse;
import com.kisanlink.dto.CropPriceSummaryDTO;
import com.kisanlink.dto.CropProduceResponse;
import com.kisanlink.dto.MandiComparisonResponse;
import com.kisanlink.dto.ProduceRequest;
import com.kisanlink.dto.RegisterRequest;
import com.kisanlink.entity.Crop;
import com.kisanlink.entity.CropCategory;
import com.kisanlink.entity.Farmer;
import com.kisanlink.entity.FarmerProduce;
import com.kisanlink.entity.Market;
import com.kisanlink.entity.MarketPrice;
import com.kisanlink.entity.MarketType;
import com.kisanlink.entity.Role;
import com.kisanlink.entity.User;
import com.kisanlink.repository.CropRepository;
import com.kisanlink.repository.FarmerProduceRepository;
import com.kisanlink.repository.FarmerRepository;
import com.kisanlink.repository.MarketPriceRepository;
import com.kisanlink.repository.MarketRepository;
import com.kisanlink.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.transaction.annotation.Transactional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class CropMarketPriceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CropRepository cropRepository;

    @Autowired
    private MarketRepository marketRepository;

    @Autowired
    private MarketPriceRepository priceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private FarmerProduceRepository produceRepository;

    @Test
    @DisplayName("Should retrieve dynamic crop price summaries with MSP and listing counts")
    void testCropPriceSummaries() throws Exception {
        // Setup crop with MSP
        Crop wheat = new Crop();
        wheat.setName("Wheat");
        wheat.setCategory(CropCategory.GRAIN);
        wheat.setUnit("kg");
        wheat.setMspPrice(new BigDecimal("22.75"));
        wheat = cropRepository.save(wheat);

        Market mandi = new Market();
        mandi.setName("Ranchi Market");
        mandi.setDistrict("Ranchi");
        mandi.setState("Jharkhand");
        mandi.setLatitude(23.3441);
        mandi.setLongitude(85.3096);
        mandi.setMarketType(MarketType.MANDI);
        mandi = marketRepository.save(mandi);

        MarketPrice p1 = new MarketPrice();
        p1.setCrop(wheat);
        p1.setMarket(mandi);
        p1.setDate(LocalDate.now().minusDays(1));
        p1.setModalPrice(new BigDecimal("24.00"));
        p1.setMinPrice(new BigDecimal("22.00"));
        p1.setMaxPrice(new BigDecimal("26.00"));
        priceRepository.save(p1);

        MarketPrice p2 = new MarketPrice();
        p2.setCrop(wheat);
        p2.setMarket(mandi);
        p2.setDate(LocalDate.now());
        p2.setModalPrice(new BigDecimal("25.00"));
        p2.setMinPrice(new BigDecimal("23.00"));
        p2.setMaxPrice(new BigDecimal("27.00"));
        priceRepository.save(p2);

        String json = mockMvc.perform(get("/api/prices/summary"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        CropPriceSummaryDTO[] summaries = objectMapper.readValue(json, CropPriceSummaryDTO[].class);
        assertThat(summaries).isNotEmpty();

        CropPriceSummaryDTO wheatSummary = null;
        for (CropPriceSummaryDTO s : summaries) {
            if ("Wheat".equals(s.cropName())) {
                wheatSummary = s;
                break;
            }
        }

        assertThat(wheatSummary).isNotNull();
        assertThat(wheatSummary.latestModalPrice()).isEqualByComparingTo(new BigDecimal("25.00"));
        assertThat(wheatSummary.mspPrice()).isEqualByComparingTo(new BigDecimal("22.75"));
        assertThat(wheatSummary.trend()).isEqualTo("UPWARD");
    }

    @Test
    @DisplayName("Should return active farmer produce lots for a specific crop")
    void testGetProduceByCrop() throws Exception {
        Crop tomato = new Crop();
        tomato.setName("Tomato");
        tomato.setCategory(CropCategory.VEGETABLE);
        tomato.setUnit("kg");
        tomato = cropRepository.save(tomato);

        User u = new User();
        u.setName("Test Farmer");
        u.setEmail("farmer1@test.in");
        u.setPhone("9811100011");
        u.setPassword("pass");
        u.setRole(Role.FARMER);
        u = userRepository.save(u);

        Farmer farmer = new Farmer();
        farmer.setUser(u);
        farmer.setName("Test Farmer");
        farmer.setDistrict("Ranchi");
        farmer.setState("Jharkhand");
        farmer.setLatitude(23.3441);
        farmer.setLongitude(85.3096);
        farmer = farmerRepository.save(farmer);

        FarmerProduce prod = new FarmerProduce();
        prod.setFarmer(farmer);
        prod.setCrop(tomato);
        prod.setQuantity(new BigDecimal("500"));
        prod.setQuality("Grade A");
        prod.setExpectedPrice(new BigDecimal("28.00"));
        prod.setHarvestDate(LocalDate.now());
        prod.setAvailableUntil(LocalDate.now().plusDays(5));
        prod.setDescription("Farm-fresh Grade A crop");
        produceRepository.save(prod);

        String json = mockMvc.perform(get("/api/crops/" + tomato.getId() + "/produce"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        CropProduceResponse[] produceList = objectMapper.readValue(json, CropProduceResponse[].class);
        assertThat(produceList).hasSize(1);
        assertThat(produceList[0].quality()).isEqualTo("Grade A");
        assertThat(produceList[0].farmerName()).isEqualTo("Test Farmer");
        assertThat(produceList[0].expectedPrice()).isEqualByComparingTo(new BigDecimal("28.00"));
    }

    @Test
    @DisplayName("Should return regional Mandi price comparison with estimated transport deductions")
    void testMandiComparison() throws Exception {
        Crop tomato = new Crop();
        tomato.setName("Tomato");
        tomato.setCategory(CropCategory.VEGETABLE);
        tomato.setUnit("kg");
        tomato = cropRepository.save(tomato);

        Market m1 = new Market();
        m1.setName("Ranchi Main Mandi");
        m1.setDistrict("Ranchi");
        m1.setState("Jharkhand");
        m1.setLatitude(23.3441);
        m1.setLongitude(85.3096);
        m1.setMarketType(MarketType.MANDI);
        m1 = marketRepository.save(m1);

        Market m2 = new Market();
        m2.setName("Ramgarh Mandi");
        m2.setDistrict("Ramgarh");
        m2.setState("Jharkhand");
        m2.setLatitude(23.6332);
        m2.setLongitude(85.5149);
        m2.setMarketType(MarketType.MANDI);
        m2 = marketRepository.save(m2);

        MarketPrice p1 = new MarketPrice();
        p1.setCrop(tomato);
        p1.setMarket(m1);
        p1.setDate(LocalDate.now());
        p1.setModalPrice(new BigDecimal("24.00"));
        p1.setMinPrice(new BigDecimal("22.00"));
        p1.setMaxPrice(new BigDecimal("26.00"));
        priceRepository.save(p1);

        MarketPrice p2 = new MarketPrice();
        p2.setCrop(tomato);
        p2.setMarket(m2);
        p2.setDate(LocalDate.now());
        p2.setModalPrice(new BigDecimal("28.00"));
        p2.setMinPrice(new BigDecimal("26.00"));
        p2.setMaxPrice(new BigDecimal("30.00"));
        priceRepository.save(p2);

        // Fetch comparison near Ranchi (23.34, 85.31)
        String json = mockMvc.perform(get("/api/crops/" + tomato.getId() + "/mandi-comparison")
                        .param("lat", "23.3441")
                        .param("lon", "85.3096"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        MandiComparisonResponse[] comparisons = objectMapper.readValue(json, MandiComparisonResponse[].class);
        assertThat(comparisons).hasSize(2);
        // Ramgarh is 28/kg with higher price, Ranchi is ~0km away
        assertThat(comparisons[0].estimatedNetRealization()).isNotNull();
        assertThat(comparisons[0].distanceKm()).isNotNull();
    }

    @Test
    @DisplayName("Farmer produce creation: fails with 400 when quality is blank, succeeds when quality is provided")
    void testProduceQualityValidation() throws Exception {
        // Register & login farmer to obtain JWT
        RegisterRequest farmerReq = new RegisterRequest(
                "Suresh Farmer",
                "suresh@kisanlink.in",
                "9876543210",
                "Pass123!",
                Role.FARMER
        );
        String regJson = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(farmerReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        AuthResponse auth = objectMapper.readValue(regJson, AuthResponse.class);
        String token = "Bearer " + auth.token();
        Long farmerId = auth.profileId();

        Crop tomato = new Crop();
        tomato.setName("Tomato");
        tomato.setCategory(CropCategory.VEGETABLE);
        tomato.setUnit("kg");
        tomato = cropRepository.save(tomato);

        // 1. Omit quality -> Should fail with 400 Bad Request
        ProduceRequest blankQualityReq = new ProduceRequest(
                tomato.getId(),
                new BigDecimal("1000"),
                "", // Blank quality
                LocalDate.now(),
                LocalDate.now().plusDays(10),
                new BigDecimal("25.0")
        );

        mockMvc.perform(post("/api/farmers/" + farmerId + "/produce")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blankQualityReq)))
                .andExpect(status().isBadRequest());

        // 2. Provide valid quality -> Should succeed with 201 Created
        ProduceRequest validQualityReq = new ProduceRequest(
                tomato.getId(),
                new BigDecimal("1000"),
                "Grade A",
                LocalDate.now(),
                LocalDate.now().plusDays(10),
                new BigDecimal("25.0")
        );

        mockMvc.perform(post("/api/farmers/" + farmerId + "/produce")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validQualityReq)))
                .andExpect(status().isCreated());
    }
}
