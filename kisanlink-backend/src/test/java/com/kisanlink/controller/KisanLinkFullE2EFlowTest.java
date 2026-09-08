package com.kisanlink.controller;

import tools.jackson.databind.ObjectMapper;
import com.kisanlink.dto.*;
import com.kisanlink.entity.*;
import com.kisanlink.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-End Proof Integration Test for KisanLink.
 * Verifies the complete lifecycle:
 * Frontend API -> Spring Boot Backend -> JPA Database -> AI Forecast/Diagnostic -> Trade Deal -> Escrow Lock -> Settlement.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class KisanLinkFullE2EFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CropRepository cropRepository;

    @Autowired
    private MarketRepository marketRepository;

    @Autowired
    private MarketPriceRepository marketPriceRepository;

    private Crop tomatoCrop;
    private Market azadpurMarket;

    @BeforeEach
    void setUp() {
        tomatoCrop = cropRepository.findByNameIgnoreCase("Tomato")
                .orElseGet(() -> {
                    Crop c = new Crop();
                    c.setName("Tomato");
                    c.setCategory(CropCategory.VEGETABLE);
                    return cropRepository.save(c);
                });

        azadpurMarket = marketRepository.findByNameIgnoreCase("Azadpur Terminal Hub")
                .orElseGet(() -> {
                    Market m = new Market();
                    m.setName("Azadpur Terminal Hub");
                    m.setAddress("Azadpur, New Delhi");
                    m.setState("Delhi");
                    m.setDistrict("North Delhi");
                    m.setMarketType(MarketType.APMC);
                    return marketRepository.save(m);
                });

        // Seed 14 days of historical prices for AI time-series regression
        LocalDate today = LocalDate.now();
        for (int i = 14; i >= 1; i--) {
            LocalDate d = today.minusDays(i);
            if (marketPriceRepository.findByMarketIdAndCropIdAndDate(azadpurMarket.getId(), tomatoCrop.getId(), d).isEmpty()) {
                MarketPrice p = new MarketPrice();
                p.setMarket(azadpurMarket);
                p.setCrop(tomatoCrop);
                p.setDate(d);
                p.setMinPrice(BigDecimal.valueOf(20.0 + (i * 0.3)));
                p.setMaxPrice(BigDecimal.valueOf(28.0 + (i * 0.3)));
                p.setModalPrice(BigDecimal.valueOf(24.0 + (i * 0.3)));
                p.setSource("AGMARKNET_LIVE");
                marketPriceRepository.save(p);
            }
        }
    }

    private AuthResponse registerUser(String name, String email, String phone, String password, Role role) throws Exception {
        RegisterRequest req = new RegisterRequest(name, email, phone, password, role);
        String json = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readValue(json, AuthResponse.class);
    }

    @Test
    @DisplayName("Complete E2E Lifecycle: Auth -> Mandi Ingestion -> AI Prediction -> Disease Scan -> Deal -> Escrow Lock -> Settlement")
    void testCompleteEndToEndBusinessFlow() throws Exception {
        // ──────────────────────────────────────────────────────────────────────
        // STEP 1: Register and Authenticate Farmer, Buyer, Transporter
        // ──────────────────────────────────────────────────────────────────────
        AuthResponse farmerAuth = registerUser("Ramesh Kumar", "ramesh.e2e@farmer.com", "9811223344", "Secure@123", Role.FARMER);
        assertNotNull(farmerAuth.token());
        assertEquals("FARMER", farmerAuth.role());
        Long farmerProfileId = farmerAuth.profileId();

        AuthResponse buyerAuth = registerUser("Priya Reliance Agro", "priya.e2e@buyer.com", "9822334455", "Secure@123", Role.BUYER);
        assertNotNull(buyerAuth.token());
        assertEquals("BUYER", buyerAuth.role());
        Long buyerProfileId = buyerAuth.profileId();

        AuthResponse transporterAuth = registerUser("Suresh Logistics", "suresh.e2e@logistics.com", "9833445566", "Secure@123", Role.TRANSPORTER);
        assertNotNull(transporterAuth.token());
        assertEquals("TRANSPORTER", transporterAuth.role());

        // ──────────────────────────────────────────────────────────────────────
        // STEP 2: Live Market Price Discovery & AGMARKNET Ingestion Check
        // ──────────────────────────────────────────────────────────────────────
        mockMvc.perform(get("/api/prices/" + tomatoCrop.getId())
                        .header("Authorization", "Bearer " + farmerAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // Verify sync endpoint handles requests with structured feedback
        mockMvc.perform(post("/api/prices/sync?state=Jharkhand&limit=10")
                        .header("Authorization", "Bearer " + farmerAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").exists());

        // ──────────────────────────────────────────────────────────────────────
        // STEP 3: Statistical AI Price Forecasting with Confidence Intervals
        // ──────────────────────────────────────────────────────────────────────
        mockMvc.perform(get("/api/predictions/" + tomatoCrop.getId() + "/forecast?days=7")
                        .header("Authorization", "Bearer " + farmerAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cropName").value("Tomato"))
                .andExpect(jsonPath("$.trend").exists())
                .andExpect(jsonPath("$.confidenceScore").isNumber())
                .andExpect(jsonPath("$.multiDayForecast").isArray())
                .andExpect(jsonPath("$.confidenceIntervals").isArray());

        // ──────────────────────────────────────────────────────────────────────
        // STEP 4: Crop Doctor AI Vision & Pathological Diagnosis with Escalation
        // ──────────────────────────────────────────────────────────────────────
        DiagnosticRequest diagReq = new DiagnosticRequest();
        diagReq.setFarmerId(farmerProfileId);
        diagReq.setCropId(tomatoCrop.getId());
        diagReq.setCropName("Tomato");
        diagReq.setImageUrl("https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=600");
        diagReq.setNotes("Concentric dark rings with yellow halos on bottom leaves.");

        String diagJson = mockMvc.perform(post("/api/diagnostics")
                        .header("Authorization", "Bearer " + farmerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(diagReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.detectedDisease").exists())
                .andExpect(jsonPath("$.treatmentPlan").exists())
                .andReturn().getResponse().getContentAsString();

        DiagnosticResponse diagResp = objectMapper.readValue(diagJson, DiagnosticResponse.class);
        Long reportId = diagResp.getId();

        // Escalate diagnostic report to certified agronomists
        mockMvc.perform(post("/api/diagnostics/" + reportId + "/escalate")
                        .header("Authorization", "Bearer " + farmerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\": \"Escalated for senior agronomist review\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ESCALATED"));

        // ──────────────────────────────────────────────────────────────────────
        // STEP 5: Farmer Produce Listing & Direct Trade Deal Creation
        // ──────────────────────────────────────────────────────────────────────
        ProduceRequest produceReq = new ProduceRequest(
                tomatoCrop.getId(),
                BigDecimal.valueOf(5000),
                "GRADE_A",
                LocalDate.now().plusDays(2),
                LocalDate.now().plusDays(10),
                BigDecimal.valueOf(26.50)
        );

        String produceJson = mockMvc.perform(post("/api/farmers/" + farmerProfileId + "/produce")
                        .header("Authorization", "Bearer " + farmerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(produceReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        FarmerProduce produceResp = objectMapper.readValue(produceJson, FarmerProduce.class);
        assertNotNull(produceResp.getId());

        // Create direct trade deal between Farmer and Buyer
        TradeDealRequest dealReq = new TradeDealRequest(
                farmerProfileId,
                buyerProfileId,
                produceResp.getId(),
                null,
                tomatoCrop.getId(),
                BigDecimal.valueOf(5000),
                BigDecimal.valueOf(27.00),
                BigDecimal.valueOf(670.00),
                TradeStatus.PROPOSED,
                "Azadpur Hub",
                "Bulk direct sourcing contract"
        );

        String dealJson = mockMvc.perform(post("/api/trades")
                        .header("Authorization", "Bearer " + buyerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dealReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PROPOSED"))
                .andReturn().getResponse().getContentAsString();

        TradeDealResponse dealResp = objectMapper.readValue(dealJson, TradeDealResponse.class);
        Long dealId = dealResp.id();

        // ──────────────────────────────────────────────────────────────────────
        // STEP 6: Farmer Accepts Deal Terms
        // ──────────────────────────────────────────────────────────────────────
        mockMvc.perform(patch("/api/trades/" + dealId + "/status")
                        .header("Authorization", "Bearer " + farmerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "ACCEPTED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));

        // ──────────────────────────────────────────────────────────────────────
        // STEP 7: Sandbox Escrow Vault Locking (Simulated Instant UPI)
        // ──────────────────────────────────────────────────────────────────────
        String escrowJson = mockMvc.perform(post("/api/escrow/initiate/" + dealId)
                        .header("Authorization", "Bearer " + buyerAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_DEPOSIT"))
                .andReturn().getResponse().getContentAsString();

        EscrowResponse escrowResp = objectMapper.readValue(escrowJson, EscrowResponse.class);
        Long escrowId = escrowResp.id();

        // Buyer deposits funds into Sandbox Escrow
        EscrowDepositRequest depositReq = new EscrowDepositRequest(
                BigDecimal.valueOf(135000.00),
                PaymentMethod.UPI_INSTANT,
                "buyer.priya@upi",
                "UPI-E2E-SANDBOX-9988"
        );

        mockMvc.perform(post("/api/escrow/" + escrowId + "/deposit")
                        .header("Authorization", "Bearer " + buyerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(depositReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FUNDS_HELD_IN_ESCROW"))
                .andExpect(jsonPath("$.upiRef").value("UPI-E2E-SANDBOX-9988"));

        // ──────────────────────────────────────────────────────────────────────
        // STEP 8: Dispatch Transport & Release Escrow Settlement
        // ──────────────────────────────────────────────────────────────────────
        // Mark trade deal as dispatched (IN_TRANSIT)
        mockMvc.perform(patch("/api/trades/" + dealId + "/status")
                        .header("Authorization", "Bearer " + farmerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "IN_TRANSIT"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_TRANSIT"));

        // Confirm delivery and release escrow payout to farmer
        mockMvc.perform(post("/api/escrow/" + escrowId + "/release")
                        .header("Authorization", "Bearer " + buyerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new EscrowReleaseRequest("Delivery confirmed by buyer"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RELEASED_TO_FARMER"))
                .andExpect(jsonPath("$.settlementUtr").exists());

        // Verify trade deal is settled and complete
        mockMvc.perform(get("/api/trades/" + dealId)
                        .header("Authorization", "Bearer " + farmerAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }
}
