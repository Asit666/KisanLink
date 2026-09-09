package com.kisanlink.controller;

import tools.jackson.databind.ObjectMapper;
import com.kisanlink.dto.AuthResponse;
import com.kisanlink.dto.BuyerRequirementRequest;
import com.kisanlink.dto.BuyerRequirementResponse;
import com.kisanlink.dto.RegisterRequest;
import com.kisanlink.entity.*;
import com.kisanlink.repository.BuyerRepository;
import com.kisanlink.repository.BuyerRequirementRepository;
import com.kisanlink.repository.CropRepository;
import com.kisanlink.repository.DemandRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.transaction.annotation.Transactional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class MarketplaceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CropRepository cropRepository;

    @Autowired
    private BuyerRepository buyerRepository;

    @Autowired
    private BuyerRequirementRepository requirementRepository;

    @Autowired
    private DemandRepository demandRepository;

    @Test
    @DisplayName("Buyer requirement validation: fails with 400 when qualityRequired is blank, succeeds when provided")
    void testBuyerRequirementValidation() throws Exception {
        // Register & login buyer
        RegisterRequest buyerReg = new RegisterRequest(
                "Anita Buyer",
                "anita.buyer@kisanlink.in",
                "9876501234",
                "Pass123!",
                Role.BUYER
        );
        String regJson = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buyerReg)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        AuthResponse auth = objectMapper.readValue(regJson, AuthResponse.class);
        String token = "Bearer " + auth.token();
        Long buyerId = auth.profileId();

        Crop tomato = new Crop();
        tomato.setName("Tomato");
        tomato.setCategory(CropCategory.VEGETABLE);
        tomato.setUnit("kg");
        tomato = cropRepository.save(tomato);

        // 1. Omit qualityRequired -> Expect 400 Bad Request
        BuyerRequirementRequest invalidReq = new BuyerRequirementRequest(
                tomato.getId(),
                new BigDecimal("2000"),
                "", // Blank quality
                new BigDecimal("35.0"),
                LocalDate.now().plusDays(10),
                "Nashik Mandi Yard"
        );

        mockMvc.perform(post("/api/buyers/" + buyerId + "/requirements")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest());

        // 2. Supply qualityRequired ("Grade A") -> Expect 201 Created
        BuyerRequirementRequest validReq = new BuyerRequirementRequest(
                tomato.getId(),
                new BigDecimal("2000"),
                "Grade A",
                new BigDecimal("35.0"),
                LocalDate.now().plusDays(10),
                "Nashik Mandi Yard"
        );

        String successJson = mockMvc.perform(post("/api/buyers/" + buyerId + "/requirements")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        assertThat(successJson).contains("Grade A");
        assertThat(successJson).contains("35.0");
    }

    @Test
    @DisplayName("Crop requirements endpoint: GET /api/crops/{id}/requirements returns active buyer demand")
    void testGetCropRequirements() throws Exception {
        // Register buyer
        RegisterRequest buyerReg = new RegisterRequest(
                "Priya Buyer",
                "priya.buyer@kisanlink.in",
                "9876505678",
                "Pass123!",
                Role.BUYER
        );
        String regJson = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buyerReg)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        AuthResponse auth = objectMapper.readValue(regJson, AuthResponse.class);
        String token = "Bearer " + auth.token();
        Long buyerId = auth.profileId();

        Crop wheat = new Crop();
        wheat.setName("Wheat");
        wheat.setCategory(CropCategory.GRAIN);
        wheat.setUnit("kg");
        wheat = cropRepository.save(wheat);

        BuyerRequirementRequest req = new BuyerRequirementRequest(
                wheat.getId(),
                new BigDecimal("5000"),
                "Grade A",
                new BigDecimal("28.0"),
                LocalDate.now().plusDays(15),
                "Bhopal Terminal Market"
        );

        mockMvc.perform(post("/api/buyers/" + buyerId + "/requirements")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // Now query GET /api/crops/{cropId}/requirements
        String json = mockMvc.perform(get("/api/crops/" + wheat.getId() + "/requirements"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        BuyerRequirementResponse[] requirements = objectMapper.readValue(json, BuyerRequirementResponse[].class);
        assertThat(requirements).hasSize(1);
        assertThat(requirements[0].cropName()).isEqualTo("Wheat");
        assertThat(requirements[0].qualityRequired()).isEqualTo("Grade A");
        assertThat(requirements[0].offeredPrice()).isEqualByComparingTo("28.0");
        assertThat(requirements[0].location()).isEqualTo("Bhopal Terminal Market");
    }

    @Test
    @DisplayName("Demand endpoint: GET /api/demands returns live buyer demands")
    void testDemandsEndpoint() throws Exception {
        RegisterRequest buyerReg = new RegisterRequest(
                "Kisan Wholesaler",
                "kisan.wholesaler@kisanlink.in",
                "9876509999",
                "Pass123!",
                Role.BUYER
        );
        String regJson = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buyerReg)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        AuthResponse auth = objectMapper.readValue(regJson, AuthResponse.class);
        Buyer buyer = buyerRepository.findById(auth.profileId()).orElseThrow();

        Demand demand = new Demand();
        demand.setBuyer(buyer);
        demand.setCropName("Tomato");
        demand.setMinQuantityKg(1000.0);
        demand.setMaxQuantityKg(3000.0);
        demand.setPreferredGrade(Grade.A);
        demand.setExpectedPricePerKg(34.0);
        demandRepository.save(demand);

        String json = mockMvc.perform(get("/api/demands"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Demand[] demands = objectMapper.readValue(json, Demand[].class);
        assertThat(demands).isNotEmpty();
        assertThat(demands[0].getCropName()).isEqualTo("Tomato");
        assertThat(demands[0].getPreferredGrade()).isEqualTo(Grade.A);
        assertThat(demands[0].getExpectedPricePerKg()).isEqualTo(34.0);
    }
}
