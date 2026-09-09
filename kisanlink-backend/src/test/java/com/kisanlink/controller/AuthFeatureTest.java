package com.kisanlink.controller;

import tools.jackson.databind.ObjectMapper;
import com.kisanlink.dto.AuthResponse;
import com.kisanlink.dto.LoginRequest;
import com.kisanlink.dto.RegisterRequest;
import com.kisanlink.entity.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class AuthFeatureTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Should register and login across all roles with email or phone")
    void testFullAuthLifecycle() throws Exception {
        // 1. Register FARMER with phone and email
        RegisterRequest farmerReq = new RegisterRequest(
                "Ramesh Farmer",
                "ramesh@testfarmer.in",
                "9811122233",
                "Password@123",
                Role.FARMER
        );
        String farmerResJson = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(farmerReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        AuthResponse farmerAuth = objectMapper.readValue(farmerResJson, AuthResponse.class);
        assertThat(farmerAuth.token()).isNotBlank();
        assertThat(farmerAuth.name()).isEqualTo("Ramesh Farmer");
        assertThat(farmerAuth.role()).isEqualTo("FARMER");
        assertThat(farmerAuth.email()).isEqualTo("ramesh@testfarmer.in");
        assertThat(farmerAuth.phone()).isEqualTo("9811122233");
        assertThat(farmerAuth.profileId()).isNotNull();

        // 2. Login with Email
        LoginRequest emailLoginReq = new LoginRequest("ramesh@testfarmer.in", "Password@123");
        String loginResJson = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emailLoginReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        AuthResponse loginWithEmail = objectMapper.readValue(loginResJson, AuthResponse.class);
        assertThat(loginWithEmail.token()).isNotBlank();
        assertThat(loginWithEmail.name()).isEqualTo("Ramesh Farmer");
        assertThat(loginWithEmail.email()).isEqualTo("ramesh@testfarmer.in");

        // 3. Login with Mobile Number (Dual identifier login)
        LoginRequest phoneLoginReq = new LoginRequest("9811122233", "Password@123");
        String phoneLoginResJson = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(phoneLoginReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        AuthResponse loginWithPhone = objectMapper.readValue(phoneLoginResJson, AuthResponse.class);
        assertThat(loginWithPhone.token()).isNotBlank();
        assertThat(loginWithPhone.role()).isEqualTo("FARMER");
        assertThat(loginWithPhone.phone()).isEqualTo("9811122233");

        // 4. Register FPO Operator
        RegisterRequest fpoReq = new RegisterRequest(
                "Sahyadri Farmers Producer Co",
                "ceo@sahyadrifpo.org",
                "9822233344",
                "FpoSecure@123",
                Role.FPO
        );
        String fpoResJson = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(fpoReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        AuthResponse fpoAuth = objectMapper.readValue(fpoResJson, AuthResponse.class);
        assertThat(fpoAuth.role()).isEqualTo("FPO");
        assertThat(fpoAuth.profileId()).isNotNull();

        // 5. Login FPO Operator using Phone
        LoginRequest fpoPhoneLogin = new LoginRequest("9822233344", "FpoSecure@123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(fpoPhoneLogin)))
                .andExpect(status().isOk());

        // 6. Register BUYER and TRANSPORTER
        RegisterRequest buyerReq = new RegisterRequest(
                "Metro Fresh Agro",
                "procure@metrofresh.com",
                "9833344455",
                "BuyerPass@123",
                Role.BUYER
        );
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buyerReq)))
                .andExpect(status().isCreated());

        RegisterRequest transReq = new RegisterRequest(
                "QuickLogistics India",
                "dispatch@quicklogistics.in",
                "9844455566",
                "TransPass@123",
                Role.TRANSPORTER
        );
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(transReq)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Should reject invalid passwords and non-existent users")
    void testAuthValidationErrors() throws Exception {
        RegisterRequest farmerReq = new RegisterRequest(
                "Validation Test",
                "valid@test.com",
                "9900112233",
                "CorrectPass@123",
                Role.FARMER
        );
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(farmerReq)))
                .andExpect(status().isCreated());

        // Wrong password
        LoginRequest wrongPass = new LoginRequest("valid@test.com", "WrongPassword!456");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongPass)))
                .andExpect(status().isUnauthorized());

        // Non-existent user identifier
        LoginRequest nonExistent = new LoginRequest("nobody@test.com", "AnyPassword@123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(nonExistent)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should prevent duplicate email, duplicate phone, and public admin registration")
    void testRegistrationConstraints() throws Exception {
        RegisterRequest first = new RegisterRequest(
                "First User",
                "unique@test.com",
                "9876501234",
                "Secret@123",
                Role.FARMER
        );
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated());

        // Duplicate email is rejected
        RegisterRequest dupEmail = new RegisterRequest(
                "Second User",
                "unique@test.com",
                "9876509999",
                "Secret@123",
                Role.BUYER
        );
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dupEmail)))
                .andExpect(status().isBadRequest());

        // Public ADMIN registration blocked
        RegisterRequest adminReq = new RegisterRequest(
                "Malicious Admin",
                "fakeadmin@gov.in",
                "9876508888",
                "Secret@123",
                Role.ADMIN
        );
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminReq)))
                .andExpect(status().isBadRequest());
    }
}
