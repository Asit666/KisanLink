package com.kisanlink.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Typed configuration for transport cost and recommendation scoring weights.
 * All values are externalisable via {@code application.properties} or environment
 * variables — no recompile needed to tune them.
 *
 * <pre>
 * kisanlink.transport.base-charge=100.00
 * kisanlink.transport.rate-per-km=15.00
 * kisanlink.transport.max-distance-km=500.0
 *
 * kisanlink.scoring.weight.net-margin=0.40
 * kisanlink.scoring.weight.price=0.30
 * kisanlink.scoring.weight.proximity=0.20
 * kisanlink.scoring.weight.buyer-trust=0.10
 * </pre>
 */
@Component
@ConfigurationProperties(prefix = "kisanlink")
public class RecommendationConfig {

    private Transport transport = new Transport();
    private Scoring scoring = new Scoring();

    public Transport getTransport() { return transport; }
    public void setTransport(Transport transport) { this.transport = transport; }

    public Scoring getScoring() { return scoring; }
    public void setScoring(Scoring scoring) { this.scoring = scoring; }

    // ── Transport nested config ───────────────────────────────────────────────

    public static class Transport {
        /** Fixed base charge per trip (₹), regardless of distance. */
        private BigDecimal baseCharge = new BigDecimal("100.00");

        /** Variable cost per kilometre (₹/km). */
        private BigDecimal ratePerKm = new BigDecimal("15.00");

        /**
         * Buyers beyond this distance (km) are excluded from recommendations.
         * Set to a very large value to disable the filter.
         */
        private double maxDistanceKm = 500.0;

        public BigDecimal getBaseCharge() { return baseCharge; }
        public void setBaseCharge(BigDecimal baseCharge) { this.baseCharge = baseCharge; }

        public BigDecimal getRatePerKm() { return ratePerKm; }
        public void setRatePerKm(BigDecimal ratePerKm) { this.ratePerKm = ratePerKm; }

        public double getMaxDistanceKm() { return maxDistanceKm; }
        public void setMaxDistanceKm(double maxDistanceKm) { this.maxDistanceKm = maxDistanceKm; }
    }

    // ── Scoring nested config ─────────────────────────────────────────────────

    public static class Scoring {
        private Weights weight = new Weights();

        public Weights getWeight() { return weight; }
        public void setWeight(Weights weight) { this.weight = weight; }

        /**
         * Scoring factor weights.
         * They should sum to {@code 1.0}; if they don't the engine still works but
         * scores will be outside the 0–100 range.
         */
        public static class Weights {
            /** Weight for net-return margin after transport cost. */
            private double netMargin = 0.40;

            /** Weight for offer price competitiveness relative to all candidates. */
            private double price = 0.30;

            /** Weight for proximity (inversely proportional to distance). */
            private double proximity = 0.20;

            /** Weight for buyer verification / trust. */
            private double buyerTrust = 0.10;

            public double getNetMargin() { return netMargin; }
            public void setNetMargin(double netMargin) { this.netMargin = netMargin; }

            public double getPrice() { return price; }
            public void setPrice(double price) { this.price = price; }

            public double getProximity() { return proximity; }
            public void setProximity(double proximity) { this.proximity = proximity; }

            public double getBuyerTrust() { return buyerTrust; }
            public void setBuyerTrust(double buyerTrust) { this.buyerTrust = buyerTrust; }
        }
    }
}
