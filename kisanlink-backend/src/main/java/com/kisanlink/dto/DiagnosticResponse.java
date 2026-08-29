package com.kisanlink.dto;

import com.kisanlink.entity.DiagnosticSeverity;
import com.kisanlink.entity.DiagnosticStatus;

import java.time.LocalDateTime;
import java.util.List;

public class DiagnosticResponse {

    private Long id;
    private Long farmerId;
    private String farmerName;
    private Long cropId;
    private String cropName;
    private String imageUrl;
    private String detectedDisease;
    private String pathogenType;
    private Double confidenceScore;
    private DiagnosticSeverity severity;
    private String symptoms;
    private String treatmentPlan;
    private List<String> recommendedInputs;
    private DiagnosticStatus status;
    private String expertNotes;
    private LocalDateTime createdAt;

    public DiagnosticResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getFarmerId() { return farmerId; }
    public void setFarmerId(Long farmerId) { this.farmerId = farmerId; }

    public String getFarmerName() { return farmerName; }
    public void setFarmerName(String farmerName) { this.farmerName = farmerName; }

    public Long getCropId() { return cropId; }
    public void setCropId(Long cropId) { this.cropId = cropId; }

    public String getCropName() { return cropName; }
    public void setCropName(String cropName) { this.cropName = cropName; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getDetectedDisease() { return detectedDisease; }
    public void setDetectedDisease(String detectedDisease) { this.detectedDisease = detectedDisease; }

    public String getPathogenType() { return pathogenType; }
    public void setPathogenType(String pathogenType) { this.pathogenType = pathogenType; }

    public Double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }

    public DiagnosticSeverity getSeverity() { return severity; }
    public void setSeverity(DiagnosticSeverity severity) { this.severity = severity; }

    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }

    public String getTreatmentPlan() { return treatmentPlan; }
    public void setTreatmentPlan(String treatmentPlan) { this.treatmentPlan = treatmentPlan; }

    public List<String> getRecommendedInputs() { return recommendedInputs; }
    public void setRecommendedInputs(List<String> recommendedInputs) { this.recommendedInputs = recommendedInputs; }

    public DiagnosticStatus getStatus() { return status; }
    public void setStatus(DiagnosticStatus status) { this.status = status; }

    public String getExpertNotes() { return expertNotes; }
    public void setExpertNotes(String expertNotes) { this.expertNotes = expertNotes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
