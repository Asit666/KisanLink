package com.kisanlink.dto;

import jakarta.validation.constraints.NotBlank;

public class DiagnosticRequest {

    private Long farmerId;
    private Long cropId;

    @NotBlank(message = "Crop or plant name is required")
    private String cropName;

    private String imageUrl;
    private String notes;

    public DiagnosticRequest() {}

    public Long getFarmerId() { return farmerId; }
    public void setFarmerId(Long farmerId) { this.farmerId = farmerId; }

    public Long getCropId() { return cropId; }
    public void setCropId(Long cropId) { this.cropId = cropId; }

    public String getCropName() { return cropName; }
    public void setCropName(String cropName) { this.cropName = cropName; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
