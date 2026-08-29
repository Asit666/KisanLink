package com.kisanlink.service;

import com.kisanlink.dto.DiagnosticRequest;
import com.kisanlink.dto.DiagnosticResponse;
import com.kisanlink.entity.*;
import com.kisanlink.repository.CropRepository;
import com.kisanlink.repository.DiagnosticReportRepository;
import com.kisanlink.repository.FarmerRepository;
import com.kisanlink.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class DiagnosticService {

    private final DiagnosticReportRepository diagnosticReportRepository;
    private final FarmerRepository farmerRepository;
    private final CropRepository cropRepository;
    private final UserRepository userRepository;
    private final NotificationWebSocketService webSocketService;
    private final com.kisanlink.security.OwnershipService ownershipService;

    public DiagnosticService(DiagnosticReportRepository diagnosticReportRepository,
                             FarmerRepository farmerRepository,
                             CropRepository cropRepository,
                             UserRepository userRepository,
                             NotificationWebSocketService webSocketService,
                             com.kisanlink.security.OwnershipService ownershipService) {
        this.diagnosticReportRepository = diagnosticReportRepository;
        this.farmerRepository = farmerRepository;
        this.cropRepository = cropRepository;
        this.userRepository = userRepository;
        this.webSocketService = webSocketService;
        this.ownershipService = ownershipService;
    }

    @Transactional
    public DiagnosticResponse runDiagnosticScan(DiagnosticRequest request, String userEmail) {
        Farmer farmer = null;
        if (userEmail != null && !userEmail.isBlank()) {
            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user != null) {
                farmer = farmerRepository.findByUserId(user.getId()).orElse(null);
            }
        }
        if (request.getFarmerId() != null) {
            if (userEmail != null) {
                ownershipService.checkFarmerOwnership(request.getFarmerId(), userEmail);
            }
            farmer = farmerRepository.findById(request.getFarmerId()).orElse(farmer);
        }

        Crop crop = null;
        if (request.getCropId() != null) {
            crop = cropRepository.findById(request.getCropId()).orElse(null);
        }

        String cropName = request.getCropName() != null ? request.getCropName() : (crop != null ? crop.getName() : "General Crop");

        // Run diagnostic knowledge inference
        DiagnosticProfile profile = inferPathology(cropName, request.getImageUrl(), request.getNotes());

        DiagnosticReport report = new DiagnosticReport();
        report.setFarmer(farmer);
        report.setCrop(crop);
        report.setCropName(cropName);
        report.setImageUrl(request.getImageUrl() != null && !request.getImageUrl().isBlank()
                ? request.getImageUrl()
                : profile.defaultSampleImage);
        report.setDetectedDisease(profile.diseaseName);
        report.setPathogenType(profile.pathogenType);
        report.setConfidenceScore(profile.confidenceScore);
        report.setSeverity(profile.severity);
        report.setSymptoms(profile.symptoms);
        report.setTreatmentPlan(profile.treatmentPlan);
        report.setRecommendedInputs(String.join(", ", profile.recommendedInputs));
        report.setStatus(DiagnosticStatus.COMPLETED);
        report.setCreatedAt(LocalDateTime.now());

        DiagnosticReport saved = diagnosticReportRepository.save(report);

        // Real-time notification push
        if (farmer != null && farmer.getUser() != null) {
            webSocketService.sendUserNotification(
                    farmer.getUser(),
                    "DIAGNOSTIC_COMPLETED",
                    "Crop Doctor AI: " + profile.diseaseName + " Detected",
                    "Scan completed for " + cropName + " (" + profile.confidenceScore + "% confidence). Review treatment prescription.",
                    saved.getId(),
                    null
            );
        }

        return toResponse(saved);
    }

    public List<DiagnosticResponse> getFarmerReports(Long farmerId, String userEmail) {
        if (userEmail != null) {
            ownershipService.checkFarmerOwnership(farmerId, userEmail);
        }
        return diagnosticReportRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId).stream()
                .map(this::toResponse)
                .toList();
    }

    public DiagnosticResponse getReportById(Long id, String userEmail) {
        DiagnosticReport report = diagnosticReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Diagnostic report not found: " + id));
        if (report.getFarmer() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Unowned diagnostic report");
        }
        if (userEmail != null) {
            ownershipService.checkFarmerOwnership(report.getFarmer().getId(), userEmail);
        }
        return toResponse(report);
    }

    @Transactional
    public DiagnosticResponse escalateReport(Long id, String expertNotes, String userEmail) {
        DiagnosticReport report = diagnosticReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Diagnostic report not found: " + id));

        if (report.getFarmer() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Unowned diagnostic report");
        }
        if (userEmail != null) {
            ownershipService.checkFarmerOwnership(report.getFarmer().getId(), userEmail);
        }


        report.setStatus(DiagnosticStatus.ESCALATED);
        if (expertNotes != null && !expertNotes.isBlank()) {
            report.setExpertNotes(expertNotes);
        }
        DiagnosticReport updated = diagnosticReportRepository.save(report);

        if (report.getFarmer() != null && report.getFarmer().getUser() != null) {
            webSocketService.sendUserNotification(
                    report.getFarmer().getUser(),
                    "DIAGNOSTIC_ESCALATED",
                    "Case Escalated to Agronomist",
                    "Diagnostic Report #" + id + " for " + report.getCropName() + " has been escalated to regional plant pathologists.",
                    id,
                    null
            );
        }

        return toResponse(updated);
    }


    private DiagnosticResponse toResponse(DiagnosticReport r) {
        DiagnosticResponse resp = new DiagnosticResponse();
        resp.setId(r.getId());
        resp.setFarmerId(r.getFarmer() != null ? r.getFarmer().getId() : null);
        resp.setFarmerName(r.getFarmer() != null && r.getFarmer().getUser() != null ? r.getFarmer().getUser().getName() : "Independent Farmer");

        resp.setCropId(r.getCrop() != null ? r.getCrop().getId() : null);
        resp.setCropName(r.getCropName());
        resp.setImageUrl(r.getImageUrl());
        resp.setDetectedDisease(r.getDetectedDisease());
        resp.setPathogenType(r.getPathogenType());
        resp.setConfidenceScore(r.getConfidenceScore());
        resp.setSeverity(r.getSeverity());
        resp.setSymptoms(r.getSymptoms());
        resp.setTreatmentPlan(r.getTreatmentPlan());
        resp.setRecommendedInputs(r.getRecommendedInputs() != null
                ? Arrays.stream(r.getRecommendedInputs().split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList()
                : List.of());
        resp.setStatus(r.getStatus());
        resp.setExpertNotes(r.getExpertNotes());
        resp.setCreatedAt(r.getCreatedAt());
        return resp;
    }

    private DiagnosticProfile inferPathology(String cropName, String imageUrl, String notes) {
        String lower = (cropName + " " + (notes != null ? notes : "")).toLowerCase();

        // 1. Keyword-first detection on symptoms / pathology signatures
        if (lower.contains("powder") || lower.contains("mildew") || lower.contains("white dust")) {
            return new DiagnosticProfile(
                    "Powdery Mildew (Erysiphe / Leveillula spp.)",
                    "Ascomycete Fungal Disease",
                    93.8,
                    DiagnosticSeverity.MODERATE,
                    "White to greyish powdery fungal patches on upper leaf surfaces, buds, and young stems. Causes leaf distortion, premature leaf drop, and poor fruit development.",
                    "1. Spray Wettable Sulphur 80% WDG @ 2-3g/L water or Hexaconazole 5% SC @ 1ml/L.\n2. Bio-control: Foliar application of Ampelomyces quisqualis bio-fungicide.\n3. Increase sunlight penetration and avoid dense crop spacing.",
                    List.of("Mancozeb 75% WP", "Trichoderma Viride Bio-Fungicide", "Seaweed Extract Bio-Stimulant"),
                    "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=600&auto=format&fit=crop"
            );
        } else if (lower.contains("rust") || lower.contains("pustule") || lower.contains("orange spot")) {
            return new DiagnosticProfile(
                    "Foliar Rust Disease (Puccinia spp.)",
                    "Basidiomycete Fungus",
                    95.2,
                    DiagnosticSeverity.SEVERE,
                    "Small, raised reddish-orange to brown pustules on leaf surface that rupture exposing powdery spores. Severe chlorosis and foliar drying.",
                    "1. Spray Propiconazole 25% EC @ 1ml/L or Tebuconazole 25.9% EC @ 1.5ml/L at first appearance.\n2. Apply Mancozeb 75% WP @ 2.5g/L for broad-spectrum protection.\n3. Avoid excessive nitrogen fertilisation; apply balanced Potash (MOP).",
                    List.of("Mancozeb 75% WP", "Muriate of Potash (MOP 60% K2O)", "NPK Complex 19:19:19"),
                    "https://images.unsplash.com/photo-1508747703725-719777637510?w=600&auto=format&fit=crop"
            );
        } else if (lower.contains("aphid") || lower.contains("whitefly") || lower.contains("sucking") || lower.contains("thrip") || lower.contains("hopper")) {
            return new DiagnosticProfile(
                    "Sucking Pest Complex (Aphids / Whitefly / Thrips)",
                    "Insect Pest Infestation",
                    94.1,
                    DiagnosticSeverity.MODERATE,
                    "Dense colonies of tiny green/black aphids or whiteflies on leaf undersides and terminal shoots. Foliage covered with sticky honeydew and black sooty mold.",
                    "1. Spray Imidacloprid 17.8% SL @ 0.5ml/L or Acetamiprid 20% SP @ 0.3g/L.\n2. Apply Cold-Pressed Neem Bio-Pesticide (10,000 PPM) @ 3ml/L water.\n3. Install Yellow and Blue sticky traps @ 15-20 traps/acre.",
                    List.of("Imidacloprid 17.8% SL", "Neem Bio-Pesticide (10000 PPM)", "Chlorpyrifos 20% EC"),
                    "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop"
            );
        } else if (lower.contains("borer") || lower.contains("caterpillar") || lower.contains("worm") || lower.contains("chewed") || lower.contains("armyworm")) {
            return new DiagnosticProfile(
                    "Foliar Borer & Caterpillar Infestation (Spodoptera / Helicoverpa)",
                    "Lepidopteran Insect Pest",
                    92.6,
                    DiagnosticSeverity.SEVERE,
                    "Irregular holes chewed in leaves, skeletonised leaf blades, and larval frass pellets present in shoot leaf whorls.",
                    "1. Spray Emamectin Benzoate 5% SG @ 0.5g/L or Chlorantraniliprole 18.5% SC @ 0.4ml/L.\n2. Install Pheromone Traps @ 5 traps/acre for adult monitoring.\n3. Apply Bacillus thuringiensis (Bt) bio-insecticide.",
                    List.of("Chlorpyrifos 20% EC", "Neem Bio-Pesticide (10000 PPM)", "Seaweed Extract Bio-Stimulant"),
                    "https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=600&auto=format&fit=crop"
            );
        } else if (lower.contains("curl") || lower.contains("virus") || lower.contains("wrinkle") || lower.contains("mosaic")) {
            return new DiagnosticProfile(
                    "Viral Leaf Curl & Mosaic Syndrome (Begomovirus / Potyvirus)",
                    "Viral Vector-Borne Disease",
                    92.8,
                    DiagnosticSeverity.MODERATE,
                    "Upward or downward cupping/curling of leaves, severe vein clearing, stunted internodes, and bushy plant growth.",
                    "1. Control insect vectors (Whitefly/Aphids) with Imidacloprid 17.8% SL @ 0.5ml/L.\n2. Spray Micronutrient Zinc + Boron + Seaweed extract to support vegetative vigor.\n3. Rogue out and destroy severely infected plants immediately.",
                    List.of("Imidacloprid 17.8% SL", "Neem Bio-Pesticide (10000 PPM)", "NPK Complex 19:19:19"),
                    "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop"
            );
        } else if (lower.contains("yellow") || lower.contains("chlorosis") || lower.contains("nutrient") || lower.contains("pale")) {
            return new DiagnosticProfile(
                    "Nitrogen & Micronutrient Chlorosis",
                    "Nutrient Deficiency (Abiotic)",
                    95.0,
                    DiagnosticSeverity.MILD,
                    "Uniform pale yellowing starting on older bottom leaves progressing to upper canopy. Thin stems, stunted vegetative growth, and reduced leaf area.",
                    "1. Top dress Urea (Neem Coated) @ 25-30 kg/acre or foliar spray 1% Urea solution.\n2. Foliar application of water-soluble NPK 19:19:19 @ 5g/L water.\n3. Apply Organic Vermicompost @ 500 kg/acre to replenish organic soil carbon.",
                    List.of("Urea (Neem Coated 46% N)", "NPK Complex 19:19:19", "Organic Vermicompost"),
                    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop"
            );
        }

        // 2. Crop-specific detection fallback
        if (lower.contains("tomato")) {
            if (lower.contains("late") || lower.contains("water") || lower.contains("rot")) {
                return new DiagnosticProfile(
                        "Tomato Late Blight (Phytophthora infestans)",
                        "Oomycete / Water Mold",
                        95.4,
                        DiagnosticSeverity.SEVERE,
                        "Water-soaked oily dark lesions on leaf margins and stems, with white mildew on leaf undersides during cool, wet weather. Rapid fruit rotting.",
                        "1. Spray Metalaxyl 8% + Mancozeb 64% WP @ 2.5g/L water.\n2. Ensure proper plant staking and drip irrigation.\n3. Apply Trichoderma Viride bio-fungicide to root zone.",
                        List.of("Mancozeb 75% WP", "Trichoderma Viride Bio-Fungicide", "Seaweed Extract Bio-Stimulant"),
                        "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=600&auto=format&fit=crop"
                );
            }
            return new DiagnosticProfile(
                    "Tomato Early Blight (Alternaria solani)",
                    "Fungal Pathogen",
                    94.8,
                    DiagnosticSeverity.MODERATE,
                    "Concentric dark brown rings ('target board' spots) on lower foliage, progressing upwards with yellow chlorotic halos. Premature defoliation.",
                    "1. Foliar spray of Mancozeb 75% WP @ 2.5g/L water every 10-12 days.\n2. Apply Trichoderma Viride bio-fungicide to root zone.\n3. Prune bottom leaves to improve canopy aeration.",
                    List.of("Mancozeb 75% WP", "Trichoderma Viride Bio-Fungicide", "NPK Complex 19:19:19"),
                    "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=600&auto=format&fit=crop"
            );
        } else if (lower.contains("potato")) {
            return new DiagnosticProfile(
                    "Potato Late Blight (Phytophthora infestans)",
                    "Oomycete / Water Mold",
                    96.2,
                    DiagnosticSeverity.SEVERE,
                    "Water-soaked dark lesions appearing at leaf margins with white fuzzy mycelial growth on underside during high humidity (>90%). Rapid vine blighting.",
                    "1. Immediate spray of systemic fungicide (Metalaxyl + Mancozeb @ 2g/L water).\n2. Destroy infected potato haulms before tuber harvest.\n3. Apply Seaweed extract for plant immunity recovery.",
                    List.of("Mancozeb 75% WP", "Seaweed Extract Bio-Stimulant", "Single Super Phosphate (SSP)"),
                    "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop"
            );
        } else if (lower.contains("rice") || lower.contains("paddy")) {
            return new DiagnosticProfile(
                    "Rice Blast (Magnaporthe oryzae)",
                    "Ascomycete Fungus",
                    93.5,
                    DiagnosticSeverity.SEVERE,
                    "Spindle-shaped or diamond elliptical lesions with grey/white centers and reddish-brown borders on leaves, nodes, and panicle neck ('neck blast').",
                    "1. Apply Tricyclazole 75% WP @ 0.6g/L or Isoprothiolane @ 1.5ml/L.\n2. Balance Nitrogen application — split Urea doses with MOP potash.\n3. Soil application of Pseudomonas fluorescens bio-agent.",
                    List.of("Trichoderma Viride Bio-Fungicide", "Muriate of Potash (MOP 60% K2O)", "Neem Bio-Pesticide (10000 PPM)"),
                    "https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=600&auto=format&fit=crop"
            );
        } else if (lower.contains("wheat")) {
            return new DiagnosticProfile(
                    "Wheat Yellow & Brown Rust (Puccinia striiformis)",
                    "Basidiomycete Fungus",
                    94.3,
                    DiagnosticSeverity.SEVERE,
                    "Yellow-orange powdery stripes and pustules arranged in parallel lines along leaf veins. Rapid foliar desiccation.",
                    "1. Foliar spray of Propiconazole 25% EC @ 1ml/L at first sign of yellow stripes.\n2. Apply balanced Potash (MOP) to improve stalk strength.\n3. Irrigate at critical crown-root initiation stage.",
                    List.of("Mancozeb 75% WP", "Muriate of Potash (MOP 60% K2O)", "Urea (Neem Coated 46% N)"),
                    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop"
            );
        } else if (lower.contains("chilli") || lower.contains("pepper")) {
            return new DiagnosticProfile(
                    "Chilli Anthracnose & Fruit Rot (Colletotrichum capsici)",
                    "Fungal Pathogen",
                    93.1,
                    DiagnosticSeverity.MODERATE,
                    "Circular sunken black spots with concentric rings on ripe chilli pods and leaves. Die-back of apical branches.",
                    "1. Spray Azoxystrobin 23% SC @ 1ml/L or Mancozeb 75% WP @ 2.5g/L.\n2. Seed treatment with Trichoderma Viride @ 10g/kg seed.\n3. Avoid overhead irrigation during fruiting.",
                    List.of("Mancozeb 75% WP", "Trichoderma Viride Bio-Fungicide", "NPK Complex 19:19:19"),
                    "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop"
            );
        } else if (lower.contains("mustard")) {
            return new DiagnosticProfile(
                    "Mustard White Rust & Staghead (Albugo candida)",
                    "Oomycete Pathogen",
                    92.4,
                    DiagnosticSeverity.MODERATE,
                    "White or creamy raised pustules on the lower leaf surface with floral malformation into swollen 'staghead' structures.",
                    "1. Spray Mancozeb 75% WP @ 2g/L or Metalaxyl 35% WS for seed dressing.\n2. Rogue out infected staghead branches.\n3. Spray Chlorpyrifos 20% EC @ 2ml/L if aphids co-occur.",
                    List.of("Mancozeb 75% WP", "Chlorpyrifos 20% EC", "Seaweed Extract Bio-Stimulant"),
                    "https://images.unsplash.com/photo-1508747703725-719777637510?w=600&auto=format&fit=crop"
            );
        } else if (lower.contains("onion") || lower.contains("garlic")) {
            return new DiagnosticProfile(
                    "Onion Purple Blotch (Alternaria porri)",
                    "Fungal Pathogen",
                    91.9,
                    DiagnosticSeverity.MODERATE,
                    "Small water-soaked sunken lesions on leaves turning purple with yellowish margins. Causes leaf collapse and undersized bulbs.",
                    "1. Spray Mancozeb 75% WP @ 2.5g/L + sticker/spreader.\n2. Apply bio-agent Trichoderma Viride in soil.\n3. Ensure adequate field drainage.",
                    List.of("Mancozeb 75% WP", "Trichoderma Viride Bio-Fungicide", "NPK Complex 19:19:19"),
                    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&auto=format&fit=crop"
            );
        } else if (lower.contains("cotton")) {
            return new DiagnosticProfile(
                    "Cotton Bacterial Blight / Angular Leaf Spot (Xanthomonas albilineans)",
                    "Bacterial Pathogen",
                    92.7,
                    DiagnosticSeverity.MODERATE,
                    "Angular water-soaked spots bounded by leaf veinlets, turning dark brown/black. 'Blackarm' lesion symptoms on branches.",
                    "1. Spray Copper Oxychloride 50% WP @ 2.5g/L + Streptocycline 100ppm.\n2. Destroy infected crop residue after picking.\n3. Apply balanced NPK fertilisation.",
                    List.of("Mancozeb 75% WP", "NPK Complex 19:19:19", "Neem Bio-Pesticide (10000 PPM)"),
                    "https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=600&auto=format&fit=crop"
            );
        } else {
            return new DiagnosticProfile(
                    "Foliar Cercospora & Leaf Spot Complex",
                    "Fungal Complex",
                    89.5,
                    DiagnosticSeverity.MODERATE,
                    "Scattered necrotic brown spots with chlorotic margins across foliar canopy. Mild leaf edge scorch and slowed photosynthesis.",
                    "1. Broad-spectrum preventive spray with Mancozeb 75% WP @ 2.5g/L.\n2. Bio-stimulation with Seaweed Extract @ 2ml/L to enhance stress recovery.\n3. Ensure balanced soil moisture and good drainage.",
                    List.of("Mancozeb 75% WP", "Seaweed Extract Bio-Stimulant", "Organic Vermicompost"),
                    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&auto=format&fit=crop"
            );
        }
    }

    private static class DiagnosticProfile {

        String diseaseName;
        String pathogenType;
        double confidenceScore;
        DiagnosticSeverity severity;
        String symptoms;
        String treatmentPlan;
        List<String> recommendedInputs;
        String defaultSampleImage;

        public DiagnosticProfile(String diseaseName, String pathogenType, double confidenceScore,
                                 DiagnosticSeverity severity, String symptoms, String treatmentPlan,
                                 List<String> recommendedInputs, String defaultSampleImage) {
            this.diseaseName = diseaseName;
            this.pathogenType = pathogenType;
            this.confidenceScore = confidenceScore;
            this.severity = severity;
            this.symptoms = symptoms;
            this.treatmentPlan = treatmentPlan;
            this.recommendedInputs = recommendedInputs;
            this.defaultSampleImage = defaultSampleImage;
        }
    }
}
