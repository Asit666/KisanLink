package com.kisanlink.controller;

import tools.jackson.databind.ObjectMapper;
import com.kisanlink.dto.*;
import com.kisanlink.entity.*;
import com.kisanlink.entity.CropCategory;
import com.kisanlink.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class KisanLinkIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CropRepository cropRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private BuyerRepository buyerRepository;

    @Autowired
    private FarmerProduceRepository farmerProduceRepository;

    @Autowired
    private BuyerRequirementRepository buyerRequirementRepository;

    @Autowired
    private RecommendationRepository recommendationRepository;

    @Autowired
    private MarketRepository marketRepository;

    @Autowired
    private MarketPriceRepository marketPriceRepository;

    private Crop tomato;

    @BeforeEach
    void setUp() {
        // Since we are annotated with @Transactional, the database will be rolled back after each test method.
        // However, let's pre-populate a crop that can be used across tests.
        tomato = new Crop();
        tomato.setName("Tomato");
        tomato.setCategory(CropCategory.VEGETABLE);
        tomato.setUnit("kg");
        tomato = cropRepository.save(tomato);
    }

    private AuthResponse registerUser(String name, String email, String password, Role role) throws Exception {
        RegisterRequest request = new RegisterRequest(name, email, "1234567890", password, role);
        String responseJson = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readValue(responseJson, AuthResponse.class);
    }

    private AuthResponse loginUser(String email, String password) throws Exception {
        LoginRequest request = new LoginRequest(email, password);
        String responseJson = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readValue(responseJson, AuthResponse.class);
    }

    @Test
    void testUserRegistrationAndLogin() throws Exception {
        // 1. Register Farmer
        AuthResponse farmerAuth = registerUser("John Farmer", "john@farmer.com", "Password@123", Role.FARMER);
        assertNotNull(farmerAuth.token());
        assertEquals("John Farmer", farmerAuth.name());
        assertEquals("FARMER", farmerAuth.role());
        assertNotNull(farmerAuth.userId());
        assertNotNull(farmerAuth.profileId());

        // 2. Register Buyer
        AuthResponse buyerAuth = registerUser("ABC Buyer", "abc@buyer.com", "Password@123", Role.BUYER);
        assertNotNull(buyerAuth.token());
        assertEquals("ABC Buyer", buyerAuth.name());
        assertEquals("BUYER", buyerAuth.role());
        assertNotNull(buyerAuth.userId());
        assertNotNull(buyerAuth.profileId());

        // 3. Login Farmer
        AuthResponse farmerLogin = loginUser("john@farmer.com", "Password@123");
        assertNotNull(farmerLogin.token());
        assertEquals(farmerAuth.profileId(), farmerLogin.profileId());

        // 4. Login Buyer
        AuthResponse buyerLogin = loginUser("abc@buyer.com", "Password@123");
        assertNotNull(buyerLogin.token());
        assertEquals(buyerAuth.profileId(), buyerLogin.profileId());

        // 5. Try duplicate registration
        RegisterRequest duplicateRequest = new RegisterRequest("Duplicate John", "john@farmer.com", "1234567890", "Password@123", Role.FARMER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testProfileManagement() throws Exception {
        // Register and login Farmer & Buyer
        AuthResponse farmerAuth = registerUser("John Farmer", "john@farmer.com", "Password@123", Role.FARMER);
        AuthResponse buyerAuth = registerUser("ABC Buyer", "abc@buyer.com", "Password@123", Role.BUYER);

        // Get Farmer Profile (without auth should fail)
        mockMvc.perform(get("/api/farmers/" + farmerAuth.profileId()))
                .andExpect(status().isForbidden());

        // Get Farmer Profile with Auth
        mockMvc.perform(get("/api/farmers/" + farmerAuth.profileId())
                        .header("Authorization", "Bearer " + farmerAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(farmerAuth.profileId()))
                .andExpect(jsonPath("$.user.email").value("john@farmer.com"));

        // Update Farmer Profile
        FarmerProfileRequest farmerProfileRequest = new FarmerProfileRequest("Ranchi Mandi Road", "Ranchi", "Jharkhand", 23.3441, 85.3096);
        mockMvc.perform(put("/api/farmers/" + farmerAuth.profileId())
                        .header("Authorization", "Bearer " + farmerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(farmerProfileRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.address").value("Ranchi Mandi Road"))
                .andExpect(jsonPath("$.district").value("Ranchi"))
                .andExpect(jsonPath("$.latitude").value(23.3441));

        // Get Buyer Profile with Auth
        mockMvc.perform(get("/api/buyers/" + buyerAuth.profileId())
                        .header("Authorization", "Bearer " + buyerAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(buyerAuth.profileId()))
                .andExpect(jsonPath("$.businessName").value("ABC Buyer"));

        // Update Buyer Profile
        BuyerProfileRequest buyerProfileRequest = new BuyerProfileRequest("ABC Processors", "Processor", "Industrial Area", "Ranchi", "Jharkhand", 23.35, 85.31);
        mockMvc.perform(put("/api/buyers/" + buyerAuth.profileId())
                        .header("Authorization", "Bearer " + buyerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buyerProfileRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.businessName").value("ABC Processors"))
                .andExpect(jsonPath("$.businessType").value("Processor"))
                .andExpect(jsonPath("$.latitude").value(23.35));
    }

    @Test
    void testFarmerProduceManagement() throws Exception {
        AuthResponse farmerAuth = registerUser("John Farmer", "john@farmer.com", "Password@123", Role.FARMER);

        // Add Produce
        ProduceRequest produceRequest = new ProduceRequest(tomato.getId(), new BigDecimal("500"), "GRADE_A",
                LocalDate.now(), LocalDate.now().plusDays(5), new BigDecimal("25.0"));

        String produceResponseJson = mockMvc.perform(post("/api/farmers/" + farmerAuth.profileId() + "/produce")
                        .header("Authorization", "Bearer " + farmerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(produceRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantity").value(500))
                .andExpect(jsonPath("$.quality").value("GRADE_A"))
                .andReturn().getResponse().getContentAsString();

        FarmerProduce createdProduce = objectMapper.readValue(produceResponseJson, FarmerProduce.class);
        assertNotNull(createdProduce.getId());

        // List Produce
        mockMvc.perform(get("/api/farmers/" + farmerAuth.profileId() + "/produce")
                        .header("Authorization", "Bearer " + farmerAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(createdProduce.getId()))
                .andExpect(jsonPath("$[0].crop.name").value("Tomato"));

        // Delete Produce
        mockMvc.perform(delete("/api/farmers/produce/" + createdProduce.getId())
                        .header("Authorization", "Bearer " + farmerAuth.token()))
                .andExpect(status().isNoContent());

        // List Produce again (should be empty)
        mockMvc.perform(get("/api/farmers/" + farmerAuth.profileId() + "/produce")
                        .header("Authorization", "Bearer " + farmerAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void testFarmerProduceWithCustomCropAndImage() throws Exception {
        AuthResponse farmerAuth = registerUser("Green Farmer", "green@farmer.com", "Password@123", Role.FARMER);

        // Add Produce with custom product name, SEED category, and image URL
        ProduceRequest customProduce = new ProduceRequest(
                null,
                "Organic Chia Seeds",
                CropCategory.SEED,
                new BigDecimal("150"),
                "PREMIUM",
                LocalDate.now(),
                LocalDate.now().plusDays(10),
                new BigDecimal("120.0"),
                "https://images.unsplash.com/photo-1589927986089-35812388d1f4",
                "High quality certified organic chia seeds"
        );

        mockMvc.perform(post("/api/farmers/" + farmerAuth.profileId() + "/produce")
                        .header("Authorization", "Bearer " + farmerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(customProduce)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.crop.name").value("Organic Chia Seeds"))
                .andExpect(jsonPath("$.crop.category").value("SEED"))
                .andExpect(jsonPath("$.imageUrl").value("https://images.unsplash.com/photo-1589927986089-35812388d1f4"))
                .andExpect(jsonPath("$.description").value("High quality certified organic chia seeds"))
                .andExpect(jsonPath("$.quantity").value(150));
    }


    @Test
    void testBuyerRequirementManagement() throws Exception {
        AuthResponse buyerAuth = registerUser("ABC Buyer", "abc@buyer.com", "Password@123", Role.BUYER);

        // Add Requirement
        BuyerRequirementRequest reqRequest = new BuyerRequirementRequest(tomato.getId(), new BigDecimal("2000"), "GRADE_A",
                new BigDecimal("28.0"), LocalDate.now().plusDays(5), "Ranchi");

        String reqResponseJson = mockMvc.perform(post("/api/buyers/" + buyerAuth.profileId() + "/requirements")
                        .header("Authorization", "Bearer " + buyerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.requiredQuantity").value(2000))
                .andExpect(jsonPath("$.offeredPrice").value(28.0))
                .andReturn().getResponse().getContentAsString();

        BuyerRequirement createdReq = objectMapper.readValue(reqResponseJson, BuyerRequirement.class);
        assertNotNull(createdReq.getId());

        // List Requirements
        mockMvc.perform(get("/api/buyers/" + buyerAuth.profileId() + "/requirements")
                        .header("Authorization", "Bearer " + buyerAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(createdReq.getId()))
                .andExpect(jsonPath("$[0].crop.name").value("Tomato"));

        // Delete Requirement
        mockMvc.perform(delete("/api/buyers/requirements/" + createdReq.getId())
                        .header("Authorization", "Bearer " + buyerAuth.token()))
                .andExpect(status().isNoContent());

        // List Requirements again (should be empty)
        mockMvc.perform(get("/api/buyers/" + buyerAuth.profileId() + "/requirements")
                        .header("Authorization", "Bearer " + buyerAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void testRecommendations() throws Exception {
        // Setup Farmer and Farmer Profile with Location (Ranchi)
        AuthResponse farmerAuth = registerUser("John Farmer", "john@farmer.com", "Password@123", Role.FARMER);
        FarmerProfileRequest farmerProfileRequest = new FarmerProfileRequest("Ranchi", "Ranchi", "Jharkhand", 23.3441, 85.3096);
        mockMvc.perform(put("/api/farmers/" + farmerAuth.profileId())
                        .header("Authorization", "Bearer " + farmerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(farmerProfileRequest)))
                .andExpect(status().isOk());

        // Setup Produce (500 kg Tomato GRADE_A)
        ProduceRequest produceRequest = new ProduceRequest(tomato.getId(), new BigDecimal("500"), "GRADE_A",
                LocalDate.now(), LocalDate.now().plusDays(5), new BigDecimal("25.0"));
        String produceResponseJson = mockMvc.perform(post("/api/farmers/" + farmerAuth.profileId() + "/produce")
                        .header("Authorization", "Bearer " + farmerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(produceRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        FarmerProduce createdProduce = objectMapper.readValue(produceResponseJson, FarmerProduce.class);

        // Setup Buyer and Buyer Profile with Location (40 km away)
        AuthResponse buyerAuth = registerUser("ABC Buyer", "abc@buyer.com", "Password@123", Role.BUYER);
        // Set buyer location to latitude 23.3441, longitude 85.7000 (roughly 40km away from Ranchi)
        BuyerProfileRequest buyerProfileRequest = new BuyerProfileRequest("ABC Processors", "Processor", "Industrial Area", "Purulia Road", "Jharkhand", 23.3441, 85.7000);
        mockMvc.perform(put("/api/buyers/" + buyerAuth.profileId())
                        .header("Authorization", "Bearer " + buyerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buyerProfileRequest)))
                .andExpect(status().isOk());

        // Set buyer requirement
        BuyerRequirementRequest reqRequest = new BuyerRequirementRequest(tomato.getId(), new BigDecimal("2000"), "GRADE_A",
                new BigDecimal("30.0"), LocalDate.now().plusDays(5), "Purulia Road");
        mockMvc.perform(post("/api/buyers/" + buyerAuth.profileId() + "/requirements")
                        .header("Authorization", "Bearer " + buyerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqRequest)))
                .andExpect(status().isCreated());

        // Perform recommendation request
        RecommendationRequest recRequest = new RecommendationRequest(farmerAuth.profileId(), createdProduce.getId());
        String recResponseJson = mockMvc.perform(post("/api/recommendations")
                        .header("Authorization", "Bearer " + farmerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.crop").value("Tomato"))
                .andExpect(jsonPath("$.recommendedBuyer.buyerName").value("ABC Processors"))
                .andExpect(jsonPath("$.recommendedBuyer.pricePerKg").value(30.0))
                // reason[0] now reflects the weighted composite score
                .andExpect(jsonPath("$.reason[0]").value(org.hamcrest.Matchers.containsString("Highest weighted composite score")))
                .andReturn().getResponse().getContentAsString();

        RecommendationResponse recommendationResponse = objectMapper.readValue(recResponseJson, RecommendationResponse.class);
        assertNotNull(recommendationResponse.recommendedBuyer());

        // Verify recommendation history
        mockMvc.perform(get("/api/recommendations/farmer/" + farmerAuth.profileId())
                        .header("Authorization", "Bearer " + farmerAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].farmer.id").value(farmerAuth.profileId()))
                .andExpect(jsonPath("$[0].buyer.businessName").value("ABC Processors"))
                .andExpect(jsonPath("$[0].netReturn").value(recommendationResponse.recommendedBuyer().netReturn().doubleValue()));
    }

    // ── Ownership hardening tests ─────────────────────────────────────────────

    @Test
    void testFarmerCannotMutateAnotherFarmersResources() throws Exception {
        // Register two farmers
        AuthResponse farmerA = registerUser("Farmer A", "farmera@test.com", "Password@123", Role.FARMER);
        AuthResponse farmerB = registerUser("Farmer B", "farmerb@test.com", "Password@123", Role.FARMER);

        // Farmer A tries to update Farmer B's profile — must be 403
        FarmerProfileRequest profileReq = new FarmerProfileRequest("Hack Road", "Hack District", "Fake State", 0.0, 0.0);
        mockMvc.perform(put("/api/farmers/" + farmerB.profileId())
                        .header("Authorization", "Bearer " + farmerA.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access denied: you do not own this farmer profile"));

        // Farmer A lists produce for Farmer B's profile (POST) — must be 403
        ProduceRequest produceReq = new ProduceRequest(tomato.getId(), new BigDecimal("100"), "GRADE_A",
                LocalDate.now(), LocalDate.now().plusDays(3), new BigDecimal("20.0"));
        mockMvc.perform(post("/api/farmers/" + farmerB.profileId() + "/produce")
                        .header("Authorization", "Bearer " + farmerA.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(produceReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access denied: you do not own this farmer profile"));

        // Farmer B adds their own produce legitimately
        String produceJson = mockMvc.perform(post("/api/farmers/" + farmerB.profileId() + "/produce")
                        .header("Authorization", "Bearer " + farmerB.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(produceReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        FarmerProduce farmerBProduce = objectMapper.readValue(produceJson, FarmerProduce.class);

        // Farmer A tries to delete Farmer B's produce — must be 403
        mockMvc.perform(delete("/api/farmers/produce/" + farmerBProduce.getId())
                        .header("Authorization", "Bearer " + farmerA.token()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access denied: you do not own this produce listing"));

        // Farmer A can still update their own profile — must be 200
        mockMvc.perform(put("/api/farmers/" + farmerA.profileId())
                        .header("Authorization", "Bearer " + farmerA.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileReq)))
                .andExpect(status().isOk());
    }

    @Test
    void testBuyerCannotMutateAnotherBuyersResources() throws Exception {
        // Register two buyers
        AuthResponse buyerA = registerUser("Buyer A", "buyera@test.com", "Password@123", Role.BUYER);
        AuthResponse buyerB = registerUser("Buyer B", "buyerb@test.com", "Password@123", Role.BUYER);

        // Buyer A tries to update Buyer B's profile — must be 403
        BuyerProfileRequest profileReq = new BuyerProfileRequest("Hacked Corp", "Hacker", "Hack St", "Hack Dist", "Fake State", 0.0, 0.0);
        mockMvc.perform(put("/api/buyers/" + buyerB.profileId())
                        .header("Authorization", "Bearer " + buyerA.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access denied: you do not own this buyer profile"));

        // Buyer A tries to post a requirement under Buyer B's profile — must be 403
        BuyerRequirementRequest reqReq = new BuyerRequirementRequest(tomato.getId(), new BigDecimal("500"), "GRADE_A",
                new BigDecimal("22.0"), LocalDate.now().plusDays(3), "Fake Location");
        mockMvc.perform(post("/api/buyers/" + buyerB.profileId() + "/requirements")
                        .header("Authorization", "Bearer " + buyerA.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access denied: you do not own this buyer profile"));

        // Buyer B adds their own requirement legitimately
        String reqJson = mockMvc.perform(post("/api/buyers/" + buyerB.profileId() + "/requirements")
                        .header("Authorization", "Bearer " + buyerB.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        BuyerRequirement buyerBReq = objectMapper.readValue(reqJson, BuyerRequirement.class);

        // Buyer A tries to delete Buyer B's requirement — must be 403
        mockMvc.perform(delete("/api/buyers/requirements/" + buyerBReq.getId())
                        .header("Authorization", "Bearer " + buyerA.token()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Access denied: you do not own this requirement"));

        // Buyer A can still update their own profile — must be 200
        mockMvc.perform(put("/api/buyers/" + buyerA.profileId())
                        .header("Authorization", "Bearer " + buyerA.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileReq)))
                .andExpect(status().isOk());
    }

    /**
     * Verifies that the weighted scoring engine:
     * - returns a numeric {@code score} and boolean {@code buyerVerified} on each option
     * - produces reason[0] that mentions the composite score
     * - score is within the expected 0–100 range
     */
    @Test
    void testWeightedScoringIncludesScoreAndVerifiedFlag() throws Exception {
        AuthResponse farmerAuth = registerUser("Score Farmer", "score@farmer.com", "Password@123", Role.FARMER);
        FarmerProfileRequest fp = new FarmerProfileRequest("Ranchi", "Ranchi", "Jharkhand", 23.3441, 85.3096);
        mockMvc.perform(put("/api/farmers/" + farmerAuth.profileId())
                        .header("Authorization", "Bearer " + farmerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(fp)))
                .andExpect(status().isOk());

        ProduceRequest pr = new ProduceRequest(tomato.getId(), new BigDecimal("300"), "GRADE_A",
                LocalDate.now(), LocalDate.now().plusDays(7), new BigDecimal("22.0"));
        String produceJson = mockMvc.perform(post("/api/farmers/" + farmerAuth.profileId() + "/produce")
                        .header("Authorization", "Bearer " + farmerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pr)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        FarmerProduce produce = objectMapper.readValue(produceJson, FarmerProduce.class);

        // Set up one buyer within 500 km range
        AuthResponse buyerAuth = registerUser("Scoring Buyer", "scoring@buyer.com", "Password@123", Role.BUYER);
        BuyerProfileRequest bp = new BuyerProfileRequest("Scoring Corp", "Trader", "Dhanbad", "Dhanbad", "Jharkhand", 23.3441, 86.4);
        mockMvc.perform(put("/api/buyers/" + buyerAuth.profileId())
                        .header("Authorization", "Bearer " + buyerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bp)))
                .andExpect(status().isOk());

        BuyerRequirementRequest req = new BuyerRequirementRequest(tomato.getId(), new BigDecimal("1000"), "GRADE_A",
                new BigDecimal("28.0"), LocalDate.now().plusDays(7), "Dhanbad");
        mockMvc.perform(post("/api/buyers/" + buyerAuth.profileId() + "/requirements")
                        .header("Authorization", "Bearer " + buyerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // Run recommendation and assert score shape
        RecommendationRequest recReq = new RecommendationRequest(farmerAuth.profileId(), produce.getId());
        String recJson = mockMvc.perform(post("/api/recommendations")
                        .header("Authorization", "Bearer " + farmerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recommendedBuyer.score").isNumber())
                .andExpect(jsonPath("$.recommendedBuyer.buyerVerified").isBoolean())
                .andExpect(jsonPath("$.reason[0]").value(org.hamcrest.Matchers.containsString("weighted composite score")))
                .andReturn().getResponse().getContentAsString();

        RecommendationResponse resp = objectMapper.readValue(recJson, RecommendationResponse.class);
        assertNotNull(resp.recommendedBuyer());
        // Score must be in sensible range 0–100
        assertTrue(resp.recommendedBuyer().score().doubleValue() >= 0,
                "Score should be >= 0, was: " + resp.recommendedBuyer().score());
        assertTrue(resp.recommendedBuyer().score().doubleValue() <= 100,
                "Score should be <= 100, was: " + resp.recommendedBuyer().score());
    }

    @Test
    void testNearbyMarketsEndpoint() throws Exception {
        // Create 2 test markets: one close (Ranchi), one further (Jamshedpur ~110km)
        Market ranchiMandi = new Market();
        ranchiMandi.setName("Ranchi Test Mandi");
        ranchiMandi.setDistrict("Ranchi");
        ranchiMandi.setState("Jharkhand");
        ranchiMandi.setLatitude(23.3441);
        ranchiMandi.setLongitude(85.3096);
        ranchiMandi.setMarketType(MarketType.MANDI);
        marketRepository.save(ranchiMandi);

        Market jamshedpurMandi = new Market();
        jamshedpurMandi.setName("Jamshedpur Test Mandi");
        jamshedpurMandi.setDistrict("East Singhbhum");
        jamshedpurMandi.setState("Jharkhand");
        jamshedpurMandi.setLatitude(22.8046);
        jamshedpurMandi.setLongitude(86.2029);
        jamshedpurMandi.setMarketType(MarketType.WHOLESALE);
        marketRepository.save(jamshedpurMandi);

        // Query nearby markets from Ranchi origin (23.3441, 85.3096)
        mockMvc.perform(get("/api/markets/nearby")
                        .param("latitude", "23.3441")
                        .param("longitude", "85.3096")
                        .param("maxDistanceKm", "200")
                        .param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Ranchi Test Mandi"))
                .andExpect(jsonPath("$[0].distanceKm").value(0.0))
                .andExpect(jsonPath("$[0].estimatedTransportCost").isNumber())
                .andExpect(jsonPath("$[0].estimatedDurationMinutes").isNumber())
                .andExpect(jsonPath("$[0].routeSummary").isString())
                .andExpect(jsonPath("$[0].navigationUrl").value(org.hamcrest.Matchers.containsString("maps/dir")))
                .andExpect(jsonPath("$[1].name").value("Jamshedpur Test Mandi"))
                .andExpect(jsonPath("$[1].distanceKm").value(org.hamcrest.Matchers.greaterThan(50.0)));
    }

    @Test
    void testPricePredictionWithLabeledConfidenceIntervals() throws Exception {
        // Create test market
        Market testMarket = new Market();
        testMarket.setName("Prediction Test Market");
        testMarket.setMarketType(MarketType.MANDI);
        testMarket = marketRepository.save(testMarket);

        // Seed 5 historical price points with an upward trend (20 -> 21 -> 22 -> 23 -> 25)
        for (int i = 0; i < 5; i++) {
            MarketPrice mp = new MarketPrice();
            mp.setMarket(testMarket);
            mp.setCrop(tomato);
            mp.setDate(LocalDate.now().minusDays(5 - i));
            mp.setModalPrice(BigDecimal.valueOf(20 + i + (i == 4 ? 1 : 0)));
            mp.setMinPrice(mp.getModalPrice().subtract(BigDecimal.valueOf(2)));
            mp.setMaxPrice(mp.getModalPrice().add(BigDecimal.valueOf(2)));
            mp.setSource("Test History");
            marketPriceRepository.save(mp);
        }

        // Test GET /api/predictions/{cropId}/forecast?days=7
        mockMvc.perform(get("/api/predictions/" + tomato.getId() + "/forecast")
                        .param("days", "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cropName").value("Tomato"))
                .andExpect(jsonPath("$.estimatedPrice").isNumber())
                .andExpect(jsonPath("$.trend").value("UPWARD"))
                .andExpect(jsonPath("$.confidenceScore").isNumber())
                .andExpect(jsonPath("$.volatilityLevel").isString())
                .andExpect(jsonPath("$.confidenceIntervals").isArray())
                .andExpect(jsonPath("$.confidenceIntervals[0].label").value("80% Core Band"))
                .andExpect(jsonPath("$.confidenceIntervals[0].confidenceLevel").value(0.80))
                .andExpect(jsonPath("$.confidenceIntervals[1].label").value("90% Likely Range"))
                .andExpect(jsonPath("$.confidenceIntervals[1].confidenceLevel").value(0.90))
                .andExpect(jsonPath("$.confidenceIntervals[2].label").value("95% Conservative Boundary"))
                .andExpect(jsonPath("$.confidenceIntervals[2].confidenceLevel").value(0.95))
                .andExpect(jsonPath("$.multiDayForecast").isArray())
                .andExpect(jsonPath("$.multiDayForecast.length()").value(7))
                .andExpect(jsonPath("$.multiDayForecast[0].interval80.lowerBound").isNumber())
                .andExpect(jsonPath("$.multiDayForecast[0].interval90.lowerBound").isNumber())
                .andExpect(jsonPath("$.multiDayForecast[0].interval95.lowerBound").isNumber());

        // Test GET /api/predictions/{cropId}/estimate
        mockMvc.perform(get("/api/predictions/" + tomato.getId() + "/estimate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estimatedPrice").isNumber())
                .andExpect(jsonPath("$.confidenceIntervals.length()").value(3));
    }

    @Test
    void testTradeDealLifecycleAndAccessProtection() throws Exception {
        // 1. Register Farmer and Buyer
        AuthResponse farmerAuth = registerUser("Trade Farmer", "tradefarmer@test.com", "Password@123", Role.FARMER);
        AuthResponse buyerAuth = registerUser("Trade Buyer", "tradebuyer@test.com", "Password@123", Role.BUYER);
        AuthResponse intruderAuth = registerUser("Intruder Buyer", "tradeintruder@test.com", "Password@123", Role.BUYER);

        String farmerToken = farmerAuth.token();
        String buyerToken = buyerAuth.token();
        String intruderToken = intruderAuth.token();

        Long farmerId = farmerAuth.profileId();
        Long buyerId = buyerAuth.profileId();

        // 2. Create a crop
        Crop capsicum = new Crop();
        capsicum.setName("Capsicum");
        capsicum.setCategory(CropCategory.VEGETABLE);
        capsicum.setUnit("kg");
        capsicum = cropRepository.save(capsicum);

        // 3. Farmer creates a Trade Deal
        TradeDealRequest dealRequest = new TradeDealRequest(
                farmerId,
                buyerId,
                null,
                null,
                capsicum.getId(),
                BigDecimal.valueOf(500),
                BigDecimal.valueOf(40.0),
                BigDecimal.valueOf(500.0), // transport cost
                TradeStatus.PROPOSED,
                "Ranchi Cold Storage Hub",
                "Grade A export packaging requested"
        );

        String createRes = mockMvc.perform(post("/api/trades")
                        .header("Authorization", "Bearer " + farmerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dealRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.cropName").value("Capsicum"))
                .andExpect(jsonPath("$.quantity").value(500))
                .andExpect(jsonPath("$.agreedPricePerKg").value(40.0))
                .andExpect(jsonPath("$.transportCost").value(500.0))
                .andExpect(jsonPath("$.totalAmount").value(20000.0))
                .andExpect(jsonPath("$.netFarmerReturn").value(19500.0))
                .andExpect(jsonPath("$.status").value("PROPOSED"))
                .andExpect(jsonPath("$.initiatedBy").value("FARMER"))
                .andReturn().getResponse().getContentAsString();

        TradeDealResponse createdDeal = objectMapper.readValue(createRes, TradeDealResponse.class);
        Long dealId = createdDeal.id();

        // 4. Buyer lists their deals and verifies the deal is present
        mockMvc.perform(get("/api/trades/buyer/" + buyerId)
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(dealId));

        // 5. Buyer accepts the deal: PROPOSED -> ACCEPTED
        mockMvc.perform(patch("/api/trades/" + dealId + "/status")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACCEPTED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));

        // 6. Farmer marks as in-transit: ACCEPTED -> IN_TRANSIT
        mockMvc.perform(patch("/api/trades/" + dealId + "/status")
                        .header("Authorization", "Bearer " + farmerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_TRANSIT\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_TRANSIT"));

        // 7. Buyer confirms delivery: IN_TRANSIT -> DELIVERED
        mockMvc.perform(patch("/api/trades/" + dealId + "/status")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELIVERED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DELIVERED"));

        // 8. Payment settlement: DELIVERED -> COMPLETED
        mockMvc.perform(patch("/api/trades/" + dealId + "/status")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"COMPLETED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        // 9. Unauthorized third party tries to view or modify this deal -> 403 Forbidden
        mockMvc.perform(get("/api/trades/" + dealId)
                        .header("Authorization", "Bearer " + intruderToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testWeatherAndAgroClimaticAdvisoryEndpoint() throws Exception {
        // Create a perishable crop
        Crop spinach = new Crop();
        spinach.setName("Spinach");
        spinach.setCategory(CropCategory.VEGETABLE);
        spinach.setUnit("kg");
        spinach = cropRepository.save(spinach);

        // Test GET /api/weather/advisory
        mockMvc.perform(get("/api/weather/advisory")
                        .param("latitude", "23.3441")
                        .param("longitude", "85.3096")
                        .param("cropId", spinach.getId().toString())
                        .param("locationName", "Ranchi Farm Hub"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.locationName").value("Ranchi Farm Hub"))
                .andExpect(jsonPath("$.latitude").value(23.3441))
                .andExpect(jsonPath("$.longitude").value(85.3096))
                .andExpect(jsonPath("$.currentTemp").isNumber())
                .andExpect(jsonPath("$.humidityPercent").isNumber())
                .andExpect(jsonPath("$.harvestSuitability").isString())
                .andExpect(jsonPath("$.recommendedHarvestWindow").isString())
                .andExpect(jsonPath("$.spoilageRiskIndex").isString())
                .andExpect(jsonPath("$.transitAdvisory").isString())
                .andExpect(jsonPath("$.cropAdvisories").isArray())
                .andExpect(jsonPath("$.cropAdvisories.length()").value(org.hamcrest.Matchers.greaterThan(0)))
                .andExpect(jsonPath("$.forecast").isArray())
                .andExpect(jsonPath("$.forecast.length()").value(5))
                .andExpect(jsonPath("$.forecast[0].dayName").value("Today"))
                .andExpect(jsonPath("$.forecast[0].tempMax").isNumber())
                .andExpect(jsonPath("$.forecast[0].tempMin").isNumber())
                .andExpect(jsonPath("$.forecast[0].precipitationProbability").isNumber());
    }

    @Test
    void testInteractiveCounterOfferAndNegotiationFlow() throws Exception {
        // 1. Register Farmer and Buyer
        AuthResponse farmerAuth = registerUser("Negotiating Farmer", "negofarmer@test.com", "Password@123", Role.FARMER);
        AuthResponse buyerAuth = registerUser("Negotiating Buyer", "negobuyer@test.com", "Password@123", Role.BUYER);

        String farmerToken = farmerAuth.token();
        String buyerToken = buyerAuth.token();

        Long farmerId = farmerAuth.profileId();
        Long buyerId = buyerAuth.profileId();

        // 2. Create a crop
        Crop cabbage = new Crop();
        cabbage.setName("Cabbage");
        cabbage.setCategory(CropCategory.VEGETABLE);
        cabbage.setUnit("kg");
        cabbage = cropRepository.save(cabbage);

        // 3. Farmer creates initial deal
        TradeDealRequest dealRequest = new TradeDealRequest(
                farmerId,
                buyerId,
                null,
                null,
                cabbage.getId(),
                BigDecimal.valueOf(500),
                BigDecimal.valueOf(20.0),
                BigDecimal.valueOf(400.0),
                TradeStatus.PROPOSED,
                "Bokaro Wholesale Hub",
                "Initial quote"
        );

        String createRes = mockMvc.perform(post("/api/trades")
                        .header("Authorization", "Bearer " + farmerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dealRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PROPOSED"))
                .andReturn().getResponse().getContentAsString();

        TradeDealResponse deal = objectMapper.readValue(createRes, TradeDealResponse.class);
        Long dealId = deal.id();

        // 4. Buyer submits counter-offer
        CounterOfferRequest buyerCounter = new CounterOfferRequest(
                BigDecimal.valueOf(24.0),
                BigDecimal.valueOf(1000),
                "Can offer ₹24/kg if quantity is increased to 1,000 kg"
        );

        mockMvc.perform(post("/api/trades/" + dealId + "/negotiate")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buyerCounter)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("NEGOTIATING"))
                .andExpect(jsonPath("$.agreedPricePerKg").value(24.0))
                .andExpect(jsonPath("$.quantity").value(1000))
                .andExpect(jsonPath("$.totalAmount").value(24000.0))
                .andExpect(jsonPath("$.negotiations.length()").value(1))
                .andExpect(jsonPath("$.negotiations[0].senderRole").value("BUYER"))
                .andExpect(jsonPath("$.negotiations[0].message").value("Can offer ₹24/kg if quantity is increased to 1,000 kg"));

        // 5. Farmer counters back
        CounterOfferRequest farmerCounter = new CounterOfferRequest(
                BigDecimal.valueOf(25.0),
                BigDecimal.valueOf(800),
                "Can supply 800 kg maximum at ₹25/kg"
        );

        mockMvc.perform(post("/api/trades/" + dealId + "/negotiate")
                        .header("Authorization", "Bearer " + farmerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(farmerCounter)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("NEGOTIATING"))
                .andExpect(jsonPath("$.agreedPricePerKg").value(25.0))
                .andExpect(jsonPath("$.quantity").value(800))
                .andExpect(jsonPath("$.totalAmount").value(20000.0))
                .andExpect(jsonPath("$.netFarmerReturn").value(19600.0))
                .andExpect(jsonPath("$.negotiations.length()").value(2))
                .andExpect(jsonPath("$.negotiations[1].senderRole").value("FARMER"));

        // 6. Buyer accepts the final negotiated terms
        mockMvc.perform(patch("/api/trades/" + dealId + "/status")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACCEPTED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.agreedPricePerKg").value(25.0))
                .andExpect(jsonPath("$.quantity").value(800));
    }

    @Test
    void testFarmerEarningsAndPremiumAnalytics() throws Exception {
        // 1. Register Farmer & Buyer
        AuthResponse farmerAuth = registerUser("Analytics Farmer", "analyticfarmer@test.com", "Password@123", Role.FARMER);
        AuthResponse buyerAuth = registerUser("Analytics Buyer", "analyticbuyer@test.com", "Password@123", Role.BUYER);

        String farmerToken = farmerAuth.token();
        Long farmerId = farmerAuth.profileId();
        Long buyerId = buyerAuth.profileId();

        // 2. Create Crop
        Crop ginger = new Crop();
        ginger.setName("Ginger");
        ginger.setCategory(CropCategory.SPICE);
        ginger.setUnit("kg");
        ginger = cropRepository.save(ginger);

        // 3. Create a completed trade deal
        TradeDealRequest dealRequest = new TradeDealRequest(
                farmerId,
                buyerId,
                null,
                null,
                ginger.getId(),
                BigDecimal.valueOf(1500),
                BigDecimal.valueOf(60.0),
                BigDecimal.valueOf(1200.0),
                TradeStatus.COMPLETED,
                "Ranchi APMC Yard",
                "Contract executed"
        );

        mockMvc.perform(post("/api/trades")
                        .header("Authorization", "Bearer " + farmerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dealRequest)))
                .andExpect(status().isCreated());

        // 4. Test GET /api/analytics/farmer/{farmerId}
        mockMvc.perform(get("/api/analytics/farmer/" + farmerId)
                        .header("Authorization", "Bearer " + farmerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.farmerId").value(farmerId))
                .andExpect(jsonPath("$.farmerName").value("Analytics Farmer"))
                .andExpect(jsonPath("$.totalLifetimeRevenue").isNumber())
                .andExpect(jsonPath("$.totalLifetimeVolumeKg").value(1500.0))
                .andExpect(jsonPath("$.totalLifetimeVolumeTons").value(1.5))
                .andExpect(jsonPath("$.kisanLinkPremiumIndexPercent").isNumber())
                .andExpect(jsonPath("$.totalExtraProfitEarned").isNumber())
                .andExpect(jsonPath("$.monthlyEarnings").isArray())
                .andExpect(jsonPath("$.monthlyEarnings.length()").value(org.hamcrest.Matchers.greaterThan(0)));
    }

    @Test
    void testRealTimeWebSocketNotificationTriggers() throws Exception {
        // 1. Register Farmer & Buyer
        AuthResponse farmerAuth = registerUser("Live Farmer", "livefarmer@test.com", "Password@123", Role.FARMER);
        AuthResponse buyerAuth = registerUser("Live Buyer", "livebuyer@test.com", "Password@123", Role.BUYER);

        String farmerToken = farmerAuth.token();
        String buyerToken = buyerAuth.token();
        Long farmerId = farmerAuth.profileId();
        Long buyerId = buyerAuth.profileId();
        Long farmerUserId = farmerAuth.userId();
        Long buyerUserId = buyerAuth.userId();

        // 2. Create Crop & Farmer Produce
        Crop crop = new Crop();
        crop.setName("Cauliflower");
        crop.setCategory(CropCategory.VEGETABLE);
        crop.setUnit("kg");
        crop = cropRepository.save(crop);

        ProduceRequest produceReq = new ProduceRequest(
                crop.getId(),
                null,
                CropCategory.VEGETABLE,
                BigDecimal.valueOf(1000),
                "GRADE_A",
                null,
                null,
                BigDecimal.valueOf(30),
                null,
                "Fresh organic cauliflower"
        );

        mockMvc.perform(post("/api/farmers/" + farmerId + "/produce")
                        .header("Authorization", "Bearer " + farmerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(produceReq)))
                .andExpect(status().isCreated());

        // 3. Buyer adds requirement -> triggers automatic real-time push notification for matching farmer
        BuyerRequirementRequest req = new BuyerRequirementRequest(
                crop.getId(),
                null,
                CropCategory.VEGETABLE,
                BigDecimal.valueOf(500),
                "GRADE_A",
                BigDecimal.valueOf(32),
                null,
                "Ranchi"
        );

        mockMvc.perform(post("/api/buyers/" + buyerId + "/requirements")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // 4. Verify farmer received matching push notification
        mockMvc.perform(get("/api/notifications/user/" + farmerUserId)
                        .header("Authorization", "Bearer " + farmerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThan(0)))
                .andExpect(jsonPath("$[0].title").value(org.hamcrest.Matchers.containsString("New Buyer Match")));

        // 5. Farmer proposes trade deal -> Buyer receives live notification
        TradeDealRequest dealReq = new TradeDealRequest(
                farmerId,
                buyerId,
                null,
                null,
                crop.getId(),
                BigDecimal.valueOf(500),
                BigDecimal.valueOf(32.0),
                BigDecimal.valueOf(300.0),
                TradeStatus.PROPOSED,
                "Ranchi Hub",
                "Direct farm supply"
        );

        String dealJson = mockMvc.perform(post("/api/trades")
                        .header("Authorization", "Bearer " + farmerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dealReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long dealId = objectMapper.readTree(dealJson).get("id").asLong();

        // 6. Verify buyer received proposal notification
        mockMvc.perform(get("/api/notifications/user/" + buyerUserId)
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThan(0)))
                .andExpect(jsonPath("$[0].title").value(org.hamcrest.Matchers.containsString("New Trade Proposal")));

        // 7. Buyer accepts trade -> Farmer receives acceptance notification
        mockMvc.perform(patch("/api/trades/" + dealId + "/status")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACCEPTED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));

        mockMvc.perform(get("/api/notifications/user/" + farmerUserId)
                        .header("Authorization", "Bearer " + farmerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value(org.hamcrest.Matchers.containsString("Accepted")));
    }

    @Test
    void testDigitalEscrowAndUpiMilestoneTracking() throws Exception {
        // 1. Register Farmer & Buyer
        AuthResponse farmerAuth = registerUser("Escrow Farmer", "escrowfarmer@test.com", "Password@123", Role.FARMER);
        AuthResponse buyerAuth = registerUser("Escrow Buyer", "escrowbuyer@test.com", "Password@123", Role.BUYER);

        String farmerToken = farmerAuth.token();
        String buyerToken = buyerAuth.token();
        Long farmerId = farmerAuth.profileId();
        Long buyerId = buyerAuth.profileId();

        // 2. Create Crop
        Crop capsicum = new Crop();
        capsicum.setName("Capsicum");
        capsicum.setCategory(CropCategory.VEGETABLE);
        capsicum.setUnit("kg");
        capsicum = cropRepository.save(capsicum);

        // 3. Create & Accept Trade Deal
        TradeDealRequest dealReq = new TradeDealRequest(
                farmerId,
                buyerId,
                null,
                null,
                capsicum.getId(),
                BigDecimal.valueOf(400),
                BigDecimal.valueOf(45.0),
                BigDecimal.valueOf(500.0),
                TradeStatus.ACCEPTED,
                "Ranchi Cold Hub",
                "Escrow-protected trade"
        );

        String dealJson = mockMvc.perform(post("/api/trades")
                        .header("Authorization", "Bearer " + farmerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dealReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long dealId = objectMapper.readTree(dealJson).get("id").asLong();

        // 4. Accept deal before initiating Escrow
        mockMvc.perform(patch("/api/trades/" + dealId + "/status")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACCEPTED\"}"))
                .andExpect(status().isOk());


        // 4. Initiate Escrow Account
        String escrowJson = mockMvc.perform(post("/api/escrow/initiate/" + dealId)
                        .header("Authorization", "Bearer " + buyerToken))
                .andExpect(status().isOk())

                .andExpect(jsonPath("$.tradeDealId").value(dealId))
                .andExpect(jsonPath("$.totalAmount").value(18000.0))
                .andExpect(jsonPath("$.farmerPayout").value(17500.0))
                .andExpect(jsonPath("$.status").value("PENDING_DEPOSIT"))
                .andReturn().getResponse().getContentAsString();

        Long escrowId = objectMapper.readTree(escrowJson).get("id").asLong();

        // 5. Buyer deposits ₹18,000 into Escrow via UPI
        EscrowDepositRequest depositReq = new EscrowDepositRequest(
                BigDecimal.valueOf(18000.0),
                PaymentMethod.UPI_INSTANT,
                "escrowbuyer@okaxis",
                "UPI/2026/9820491823"
        );

        mockMvc.perform(post("/api/escrow/" + escrowId + "/deposit")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(depositReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FUNDS_HELD_IN_ESCROW"))
                .andExpect(jsonPath("$.depositAmount").value(18000.0))
                .andExpect(jsonPath("$.upiRef").value("UPI/2026/9820491823"));

        // 6. Farmer verifies funds are locked in Escrow
        mockMvc.perform(get("/api/escrow/trade/" + dealId)
                        .header("Authorization", "Bearer " + farmerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FUNDS_HELD_IN_ESCROW"))
                .andExpect(jsonPath("$.farmerPayout").value(17500.0));

        // 7. Buyer releases payout upon delivery
        EscrowReleaseRequest releaseReq = new EscrowReleaseRequest("Produce inspected and Grade A verified");
        mockMvc.perform(post("/api/escrow/" + escrowId + "/release")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(releaseReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RELEASED_TO_FARMER"))
                .andExpect(jsonPath("$.settlementUtr").isString())
                .andExpect(jsonPath("$.releasedAt").isNotEmpty());

        // 8. Verify Trade Deal status is now COMPLETED
        mockMvc.perform(get("/api/trades/" + dealId)
                        .header("Authorization", "Bearer " + farmerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    private AuthResponse registerUserWithPhone(String name, String email, String phone, String password, Role role) throws Exception {
        RegisterRequest request = new RegisterRequest(name, email, phone, password, role);
        String responseJson = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readValue(responseJson, AuthResponse.class);
    }

    @Test
    void testSmsAndWhatsAppAlertsAndInboundWebhook() throws Exception {
        // 1. Register Farmer & Buyer with distinct phone numbers
        AuthResponse farmerAuth = registerUserWithPhone("SMS Farmer", "smsfarmer@test.com", "9876543210", "Password@123", Role.FARMER);
        AuthResponse buyerAuth = registerUserWithPhone("SMS Buyer", "smsbuyer@test.com", "9876543211", "Password@123", Role.BUYER);


        String farmerToken = farmerAuth.token();
        String buyerToken = buyerAuth.token();
        Long farmerId = farmerAuth.profileId();
        Long buyerId = buyerAuth.profileId();

        // 2. Create Crop
        Crop ginger = new Crop();
        ginger.setName("Ginger");
        ginger.setCategory(CropCategory.SPICE);
        ginger.setUnit("kg");
        ginger = cropRepository.save(ginger);

        // 3. Buyer proposes Trade Deal
        TradeDealRequest dealReq = new TradeDealRequest(
                farmerId,
                buyerId,
                null,
                null,
                ginger.getId(),
                BigDecimal.valueOf(200),
                BigDecimal.valueOf(80.0),
                BigDecimal.valueOf(300.0),
                TradeStatus.PROPOSED,
                "Lohardaga Mandi",
                "Spices consignment"
        );

        String dealJson = mockMvc.perform(post("/api/trades")
                        .header("Authorization", "Bearer " + buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dealReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long dealId = objectMapper.readTree(dealJson).get("id").asLong();

        // 4. Verify SMS log was recorded
        mockMvc.perform(get("/api/notifications/sms-whatsapp")
                        .header("Authorization", "Bearer " + farmerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThan(0)))
                .andExpect(jsonPath("$[0].body").value(org.hamcrest.Matchers.containsString("Ginger")));

        // 5. Inbound SMS Webhook simulating Farmer replying "ACCEPT <dealId>"
        InboundSmsWebhookRequest webhookReq = new InboundSmsWebhookRequest(
                "+91-9876543210",
                "ACCEPT " + dealId,
                "MSG-TWILIO-991823"
        );

        mockMvc.perform(post("/api/notifications/sms-whatsapp/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(webhookReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.body").value(org.hamcrest.Matchers.containsString("accepted via SMS")));

        // 6. Verify trade deal status changed to ACCEPTED
        mockMvc.perform(get("/api/trades/" + dealId)
                        .header("Authorization", "Bearer " + farmerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));

        // 7. Manual test alert dispatch
        SmsAlertRequest testAlert = new SmsAlertRequest(
                "+91-9876543210",
                MessageChannel.WHATSAPP,
                "PRICE_SPIKE",
                "Ranchi Mandi: Ginger surged +15% to ₹92/kg."
        );

        mockMvc.perform(post("/api/notifications/sms-whatsapp/test-send")
                        .header("Authorization", "Bearer " + farmerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(testAlert)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DELIVERED"))
                .andExpect(jsonPath("$.channel").value("WHATSAPP"));
    }

    @Test
    public void testCropHealthDiagnosticScanAndEscalation() throws Exception {
        // 1. Register Farmer
        AuthResponse farmerAuth = registerUser("Doctor Test Farmer", "doctorfarmer@kisanlink.com", "Secret@123", Role.FARMER);
        String farmerToken = farmerAuth.token();
        Long farmerId = farmerAuth.profileId();


        // 2. Submit AI Leaf Scan for Tomato Early Blight
        DiagnosticRequest req = new DiagnosticRequest();
        req.setFarmerId(farmerId);
        req.setCropName("Tomato");
        req.setNotes("Target concentric brown rings on bottom leaves");
        req.setImageUrl("https://images.unsplash.com/photo-1592841200221-a6898f307baa");

        String scanRes = mockMvc.perform(post("/api/diagnostics/scan")
                        .header("Authorization", "Bearer " + farmerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.detectedDisease").value(org.hamcrest.Matchers.containsString("Early Blight")))
                .andExpect(jsonPath("$.severity").value("MODERATE"))
                .andExpect(jsonPath("$.confidenceScore").value(org.hamcrest.Matchers.greaterThan(90.0)))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.recommendedInputs").value(org.hamcrest.Matchers.hasItem("Mancozeb 75% WP")))
                .andReturn().getResponse().getContentAsString();

        DiagnosticResponse response = objectMapper.readValue(scanRes, DiagnosticResponse.class);
        Long reportId = response.getId();

        // 3. Fetch Farmer's Diagnostic History
        mockMvc.perform(get("/api/diagnostics/farmer/" + farmerId)
                        .header("Authorization", "Bearer " + farmerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(reportId));

        // 4. Fetch Single Report by ID
        mockMvc.perform(get("/api/diagnostics/" + reportId)
                        .header("Authorization", "Bearer " + farmerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cropName").value("Tomato"));

        // 5. Escalate Case to Agronomist
        mockMvc.perform(post("/api/diagnostics/" + reportId + "/escalate")
                        .header("Authorization", "Bearer " + farmerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\": \"Please verify if Mancozeb or Copper Oxychloride is better in rainy week\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ESCALATED"))
                .andExpect(jsonPath("$.expertNotes").value(org.hamcrest.Matchers.containsString("Copper Oxychloride")));
    }
}




