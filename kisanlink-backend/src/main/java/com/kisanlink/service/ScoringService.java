package com.kisanlink.service;

import com.kisanlink.config.RecommendationConfig;
import com.kisanlink.dto.RecommendationOption;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Computes a weighted multi-factor score for each {@link RecommendationOption}.
 *
 * <h3>Score formula</h3>
 * <pre>
 * netMarginScore  = option.netReturn / option.grossRevenue          (clamped 0–1)
 * priceScore      = option.pricePerKg / max(pricePerKg)            (0–1)
 * proximityScore  = 1 – option.distanceKm / maxDistanceKm          (clamped 0–1)
 * buyerTrustScore = 1.0 if verified, 0.5 otherwise                 (0–1)
 *
 * score = (w_margin × netMarginScore
 *        + w_price  × priceScore
 *        + w_prox   × proximityScore
 *        + w_trust  × buyerTrustScore) × 100     → 0–100
 * </pre>
 *
 * All weights and the max-distance cap are read from {@link RecommendationConfig}
 * and are fully configurable via {@code application.properties}.
 */
@Service
public class ScoringService {

    private final RecommendationConfig config;

    public ScoringService(RecommendationConfig config) {
        this.config = config;
    }

    /**
     * Replaces the {@code score} field on each option with the weighted composite score
     * and returns a new list of {@link RecommendationOption} instances sorted by score
     * descending (best first).
     *
     * @param raw list of options with preliminary financial data already filled in
     * @return re-scored and sorted list
     */
    public List<RecommendationOption> score(List<RecommendationOption> raw) {
        if (raw.isEmpty()) return raw;

        RecommendationConfig.Scoring.Weights w = config.getScoring().getWeight();
        double maxDistanceKm = config.getTransport().getMaxDistanceKm();

        // Normalisation anchors
        double maxPrice = raw.stream()
                .mapToDouble(o -> o.pricePerKg().doubleValue())
                .max().orElse(1.0);

        // Re-score each option
        List<RecommendationOption> scored = raw.stream().map(opt -> {
            double netMarginScore = clamp(safeDiv(opt.netReturn(), opt.grossRevenue()));
            double priceScore = clamp(opt.pricePerKg().doubleValue() / maxPrice);
            double proximityScore = maxDistanceKm > 0
                    ? clamp(1.0 - opt.distanceKm().doubleValue() / maxDistanceKm)
                    : 1.0;
            double buyerTrustScore = opt.buyerVerified() ? 1.0 : 0.5;

            double composite = w.getNetMargin() * netMarginScore
                    + w.getPrice() * priceScore
                    + w.getProximity() * proximityScore
                    + w.getBuyerTrust() * buyerTrustScore;

            BigDecimal newScore = BigDecimal.valueOf(composite * 100)
                    .setScale(2, RoundingMode.HALF_UP);

            return new RecommendationOption(
                    opt.buyerId(),
                    opt.buyerName(),
                    opt.pricePerKg(),
                    opt.distanceKm(),
                    opt.transportCost(),
                    opt.grossRevenue(),
                    opt.netReturn(),
                    newScore,
                    opt.buyerVerified(),
                    opt.transporterId(),
                    opt.transporterName(),
                    opt.vehicleType(),
                    opt.transporterRatePerKm(),
                    opt.transporterBaseCharge(),
                    opt.platformFee(),
                    opt.profitComparisonNote()
            );
        }).sorted((a, b) -> b.score().compareTo(a.score())).toList();

        if (scored.size() > 1) {
            RecommendationOption top = scored.getFirst();
            RecommendationOption second = scored.get(1);
            BigDecimal delta = top.netReturn().subtract(second.netReturn());

            String topNote = delta.compareTo(BigDecimal.ZERO) > 0
                    ? String.format("Yields INR %s higher net return than 2nd option via optimal transporter freight pairing.", delta.toPlainString())
                    : "Optimal multi-factor deal combination.";

            java.util.List<RecommendationOption> annotated = new java.util.ArrayList<>();
            annotated.add(new RecommendationOption(
                    top.buyerId(), top.buyerName(), top.pricePerKg(), top.distanceKm(),
                    top.transportCost(), top.grossRevenue(), top.netReturn(), top.score(),
                    top.buyerVerified(), top.transporterId(), top.transporterName(),
                    top.vehicleType(), top.transporterRatePerKm(), top.transporterBaseCharge(),
                    top.platformFee(), topNote
            ));

            for (int i = 1; i < scored.size(); i++) {
                RecommendationOption current = scored.get(i);
                BigDecimal diff = top.netReturn().subtract(current.netReturn());
                String note = String.format("INR %s less take-home profit than Best Deal.", diff.toPlainString());
                annotated.add(new RecommendationOption(
                        current.buyerId(), current.buyerName(), current.pricePerKg(), current.distanceKm(),
                        current.transportCost(), current.grossRevenue(), current.netReturn(), current.score(),
                        current.buyerVerified(), current.transporterId(), current.transporterName(),
                        current.vehicleType(), current.transporterRatePerKm(), current.transporterBaseCharge(),
                        current.platformFee(), note
                ));
            }
            return annotated;
        }

        return scored;
    }

    /**
     * Builds a human-readable list of reasons explaining why this option scored the way it did.
     *
     * @param winner       the top-ranked option
     * @param all          all scored options (used for context, e.g. "best price")
     * @param buyerVerified whether the winning buyer is verified
     */
    public List<String> reasons(RecommendationOption winner, List<RecommendationOption> all, boolean buyerVerified) {
        java.util.List<String> reasons = new java.util.ArrayList<>();
        reasons.add("Highest weighted composite score (" + winner.score() + "/100)");

        // Net margin signal
        if (winner.grossRevenue().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal marginPct = winner.netReturn()
                    .divide(winner.grossRevenue(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP);
            reasons.add("Net margin: " + marginPct + "% after ₹" + winner.transportCost() + " transport cost");
        }

        // Price competitiveness signal
        boolean isBestPrice = all.stream()
                .allMatch(o -> winner.pricePerKg().compareTo(o.pricePerKg()) >= 0);
        if (isBestPrice) {
            reasons.add("Best offered price: ₹" + winner.pricePerKg() + "/unit");
        }

        // Proximity signal
        boolean isClosest = all.stream()
                .allMatch(o -> winner.distanceKm().compareTo(o.distanceKm()) <= 0);
        if (isClosest) {
            reasons.add("Closest buyer at " + winner.distanceKm() + " km");
        } else {
            reasons.add("Distance: " + winner.distanceKm() + " km");
        }

        // Trust signal
        if (buyerVerified) {
            reasons.add("Verified buyer — trust bonus applied");
        }

        return reasons;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static double safeDiv(BigDecimal numerator, BigDecimal denominator) {
        if (denominator == null || denominator.compareTo(BigDecimal.ZERO) == 0) return 0.0;
        return numerator.divide(denominator, 8, RoundingMode.HALF_UP).doubleValue();
    }

    private static double clamp(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }
}
