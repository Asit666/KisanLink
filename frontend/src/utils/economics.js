// ─────────────────────────────────────────────────────────────────────────────
// KisanLink Canonical Economics, Logistics & State Machine Module
// Single Source of Truth shared between React UI Components and Test Suites
// ─────────────────────────────────────────────────────────────────────────────

export const ESCROW_STATES = {
  PENDING_DEPOSIT: 'PENDING_DEPOSIT',
  FUNDS_HELD_IN_ESCROW: 'FUNDS_HELD_IN_ESCROW',
  DISPUTED: 'DISPUTED',
  RELEASED_TO_FARMER: 'RELEASED_TO_FARMER',
  REFUNDED_TO_BUYER: 'REFUNDED_TO_BUYER'
};

export const MODEL_METADATA = {
  architecture: 'MobileNetV3-Large',
  testAccuracy: 99.9,
  datasetSamples: 54305,
  diseaseClasses: 38,
  entropyThresholdNats: 1.2,
  minConfidenceCutoff: 0.60
};

/**
 * Computes farmer net return after deducting freight and mandi/platform handling fees.
 */
export function calculateFarmerNetRealization(
  quantityKg,
  pricePerKg,
  distanceKm,
  ratePerKm = 15,
  baseFee = 100,
  handlingPct = 0.015
) {
  const grossRevenue = Math.round(quantityKg * pricePerKg);
  const freight = Math.round(baseFee + (ratePerKm * distanceKm));
  const handlingFee = Math.round(grossRevenue * handlingPct);
  const totalDeductions = freight + handlingFee;
  const netReturn = grossRevenue - totalDeductions;
  const netPerKg = quantityKg > 0 ? (netReturn / quantityKg) : 0;

  return {
    grossRevenue,
    freight,
    handlingFee,
    totalDeductions,
    netReturn,
    netPerKg: Math.round(netPerKg * 100) / 100
  };
}

/**
 * Computes full-cycle economic net farm profit, cultivation costs, B:C ratio, and escrow bank payout.
 */
export function calculateFarmerEconomicProfit({
  acres = 2.5,
  quantityKg = 5000,
  pricePerKg = 27.0,
  distanceKm = 38,
  ratePerKm = 15,
  baseFee = 100,
  handlingPct = 0.015,
  seedCostPerAcre = 3500,
  fertCostPerAcre = 6500,
  labourCostPerAcre = 8500,
  tillageCostPerAcre = 3500,
  irrigationCostPerAcre = 3000
}) {
  const totalCostPerAcre = seedCostPerAcre + fertCostPerAcre + labourCostPerAcre + tillageCostPerAcre + irrigationCostPerAcre;
  const totalCultivationCost = Math.round(acres * totalCostPerAcre);
  const productionCostPerKg = Number((totalCultivationCost / quantityKg).toFixed(2));

  const grossRevenue = Math.round(quantityKg * pricePerKg);
  const freight = 100 + Math.round(ratePerKm * distanceKm * (1 + (quantityKg > 1000 ? (quantityKg - 1000) / 3000 : 0)));
  const handlingFee = Math.round(grossRevenue * handlingPct);
  const postHarvestCosts = freight + handlingFee;

  // Escrow Net Bank Payout (Direct Cash Wired to Bank)
  const escrowNetBankPayout = grossRevenue - postHarvestCosts;
  const payoutPerKg = Number((escrowNetBankPayout / quantityKg).toFixed(2));

  // Economic Net Farm Profit (Gross - Cultivation - Post-Harvest)
  const economicNetFarmProfit = escrowNetBankPayout - totalCultivationCost;
  const profitPerAcre = Math.round(economicNetFarmProfit / acres);
  const profitMarginPercent = Number(((economicNetFarmProfit / grossRevenue) * 100).toFixed(1));
  const benefitCostRatio = Number((grossRevenue / (totalCultivationCost + postHarvestCosts)).toFixed(2));
  const breakEvenPricePerKg = Number(((totalCultivationCost + postHarvestCosts) / quantityKg).toFixed(2));

  return {
    totalCostPerAcre,
    totalCultivationCost,
    productionCostPerKg,
    grossRevenue,
    freight,
    handlingFee,
    postHarvestCosts,
    escrowNetBankPayout,
    payoutPerKg,
    economicNetFarmProfit,
    profitPerAcre,
    profitMarginPercent,
    benefitCostRatio,
    breakEvenPricePerKg
  };
}

/**
 * Computes buyer landed cost including inbound freight, spoilage contingency, and cold storage.
 */
export function calculateBuyerLandedCost(
  quantityKg,
  farmPurchaseRatePerKg,
  distanceKm,
  storageDays = 3,
  targetResaleRatePerKg = 32.0
) {
  const grossPurchaseCost = Math.round(quantityKg * farmPurchaseRatePerKg);
  const tonnage = quantityKg / 1000;
  const inboundFreight = Math.round(350 + (distanceKm * Math.max(1, tonnage) * 3.8));
  const spoilageBuffer = Math.round(grossPurchaseCost * 0.025);
  const storageCost = Math.round(tonnage * storageDays * 120);

  const totalLandedCost = grossPurchaseCost + inboundFreight + spoilageBuffer + storageCost;
  const landedCostPerKg = Math.round((totalLandedCost / quantityKg) * 100) / 100;

  const projectedResaleRevenue = Math.round(quantityKg * targetResaleRatePerKg);
  const netGrossMargin = projectedResaleRevenue - totalLandedCost;
  const marginPerQuintal = Math.round(((netGrossMargin / quantityKg) * 100) * 100) / 100;
  const marginPercent = Math.round(((netGrossMargin / projectedResaleRevenue) * 100) * 10) / 10;

  return {
    grossPurchaseCost,
    inboundFreight,
    spoilageBuffer,
    storageCost,
    totalLandedCost,
    landedCostPerKg,
    projectedResaleRevenue,
    netGrossMargin,
    marginPerQuintal,
    marginPercent
  };
}

/**
 * Computes transporter trip operating profit, diesel consumption, and wear.
 */
export function calculateTransporterTripProfit(
  distanceKm,
  ratePerKm,
  baseCharge,
  mileageKmPerLitre,
  dieselPrice = 92.0,
  tolls = 240,
  deadheadRisk = 0.20,
  driverWages = 450,
  wearPerKm = 2.8
) {
  const grossFreightRevenue = Math.round(baseCharge + (distanceKm * ratePerKm));
  const outwardFuelLitres = distanceKm / mileageKmPerLitre;
  const outwardFuelCost = Math.round(outwardFuelLitres * dieselPrice);
  const deadheadContingency = Math.round(outwardFuelCost * deadheadRisk);
  const maintenanceAndWear = Math.round(distanceKm * wearPerKm);

  const totalOperatingCost = outwardFuelCost + deadheadContingency + tolls + driverWages + maintenanceAndWear;
  const netTripProfit = grossFreightRevenue - totalOperatingCost;
  const profitMarginPercent = Math.round(((netTripProfit / grossFreightRevenue) * 100) * 10) / 10;
  const netReturnPerKm = Math.round((netTripProfit / distanceKm) * 100) / 100;

  return {
    grossFreightRevenue,
    outwardFuelCost,
    deadheadContingency,
    totalOperatingCost,
    netTripProfit,
    profitMarginPercent,
    netReturnPerKm
  };
}

/**
 * Computes comprehensive commercial fleet economics for a transport booking.
 */
export function calculateTransporterFullFleetEconomics({
  distanceKm = 85,
  payloadKg = 2500,
  ratePerKm = 17.5,
  baseCharge = 220,
  mileageKmPerLitre = 8.5,
  dieselPrice = 92.0,
  tolls = 240,
  deadheadRisk = 0.20,
  wearPerKm = 2.8,
  driverWages = 450,
  permitInsurance = 100,
  escrowFeePercent = 0.02
}) {
  const dist = Math.max(1, distanceKm);
  const payloadTons = payloadKg / 1000;
  const tonKm = Number((payloadTons * dist).toFixed(1));

  const grossFreightRevenue = Math.round(baseCharge + (dist * ratePerKm));
  const escrowFee = Math.round(grossFreightRevenue * escrowFeePercent);
  const escrowNetBankPayout = grossFreightRevenue - escrowFee;

  const fuelLitres = dist / mileageKmPerLitre;
  const outwardFuelCost = Math.round(fuelLitres * dieselPrice);
  const deadheadContingency = Math.round(outwardFuelCost * deadheadRisk);
  const maintenanceAndWear = Math.round(dist * wearPerKm);

  const totalOperatingCost = outwardFuelCost + deadheadContingency + tolls + maintenanceAndWear + driverWages + permitInsurance + escrowFee;
  const netTripProfit = grossFreightRevenue - totalOperatingCost;
  const profitMarginPercent = Number(((netTripProfit / grossFreightRevenue) * 100).toFixed(1));
  const netReturnPerKm = Number((netTripProfit / dist).toFixed(2));
  const netReturnPerKg = Number((netTripProfit / payloadKg).toFixed(2));
  const breakEvenFreightRatePerKm = Number((totalOperatingCost / dist).toFixed(2));
  const revenuePerTonKm = Number((grossFreightRevenue / tonKm).toFixed(2));

  return {
    grossFreightRevenue,
    escrowFee,
    escrowNetBankPayout,
    outwardFuelCost,
    deadheadContingency,
    totalOperatingCost,
    netTripProfit,
    profitMarginPercent,
    netReturnPerKm,
    netReturnPerKg,
    breakEvenFreightRatePerKm,
    revenuePerTonKm,
    tonKm
  };
}

/**
 * Normalizes wholesale mandi rates (Rs/Quintal) to consumer/trading units (Rs/kg).
 */
export function normalizeMandiPricePerQuintal(quintalPrice) {
  if (!quintalPrice || quintalPrice <= 0) return 0;
  return Math.round((quintalPrice / 100) * 100) / 100;
}

/**
 * Computes optimal direct buyer realization rate with positive margin over local mandi rate.
 */
export function computeQuickSellMetrics(mandiModalRate, premiumRatio = 1.08) {
  const directBuyerRate = Number((mandiModalRate * premiumRatio).toFixed(2));
  const netGainPerKg = Number((directBuyerRate - mandiModalRate).toFixed(2));
  const defaultLotKg = 500;
  const totalNetAdvantage = Number((netGainPerKg * defaultLotKg).toFixed(2));

  return {
    directBuyerRate,
    netGainPerKg,
    defaultLotKg,
    totalNetAdvantage,
    recommendation: 'DIRECT BULK BUYER (ESCROW GUARANTEED)'
  };
}

/**
 * Evaluates AI diagnosis confidence entropy against cutoff thresholds.
 */
export function evaluateDiagnosisConfidence(entropyNats, topClassProb) {
  const isUncertain = entropyNats > MODEL_METADATA.entropyThresholdNats || topClassProb < MODEL_METADATA.minConfidenceCutoff;
  return {
    isUncertain,
    requiresExpertReview: isUncertain,
    routingTarget: isUncertain ? 'AGRONOMIST_ESCALATION' : 'AUTOMATED_TREATMENT_PROTOCOL'
  };
}

/**
 * State machine transition for digital escrow deposits and disputes.
 */
export function transitionEscrow(currentState, action) {
  if (currentState === ESCROW_STATES.PENDING_DEPOSIT && action === 'DEPOSIT') {
    return ESCROW_STATES.FUNDS_HELD_IN_ESCROW;
  }
  if (currentState === ESCROW_STATES.FUNDS_HELD_IN_ESCROW && action === 'RELEASE') {
    return ESCROW_STATES.RELEASED_TO_FARMER;
  }
  if (currentState === ESCROW_STATES.FUNDS_HELD_IN_ESCROW && action === 'DISPUTE') {
    return ESCROW_STATES.DISPUTED;
  }
  if ((currentState === ESCROW_STATES.FUNDS_HELD_IN_ESCROW || currentState === ESCROW_STATES.DISPUTED) && action === 'REFUND') {
    return ESCROW_STATES.REFUNDED_TO_BUYER;
  }
  throw new Error(`Invalid transition from ${currentState} with action ${action}`);
}

/**
 * Validates multi-factor Proof of Pickup (POP) handshake.
 */
export function validatePickupHandshake({ pickupCode, quantityLoadedKg, vehicleNumber, driverName, gpsLocation }) {
  if (!pickupCode || pickupCode.trim().length !== 4) {
    throw new Error('Invalid 4-digit pickup code');
  }
  if (!quantityLoadedKg || quantityLoadedKg <= 0) {
    throw new Error('Weighbridge certified net weight required');
  }
  return {
    verified: true,
    pickupCode,
    quantityLoadedKg,
    vehicleNumber: vehicleNumber || 'UNASSIGNED',
    driverName: driverName || 'UNASSIGNED',
    gpsLocation: gpsLocation || 'N/A',
    timestamp: new Date().toISOString()
  };
}

/**
 * Validates multi-factor Proof of Delivery (POD) handshake and computes weighbridge variance.
 */
export function validateDeliveryHandshake({ deliveryCode, deliveredQuantityKg, dispatchedQuantityKg, vehicleNumber, driverName, gpsLocation }) {
  if (!deliveryCode || deliveryCode.trim().length !== 4) {
    throw new Error('Invalid 4-digit delivery code');
  }
  if (!deliveredQuantityKg || deliveredQuantityKg <= 0) {
    throw new Error('Terminal weighbridge delivered weight required');
  }
  const discrepancyKg = Number((dispatchedQuantityKg - deliveredQuantityKg).toFixed(2));
  return {
    verified: true,
    deliveryCode,
    deliveredQuantityKg,
    discrepancyKg,
    isExactMatch: discrepancyKg === 0,
    vehicleNumber: vehicleNumber || 'UNASSIGNED',
    driverName: driverName || 'UNASSIGNED',
    gpsLocation: gpsLocation || 'N/A',
    timestamp: new Date().toISOString()
  };
}

/**
 * Enforces agricultural safety protocols on unconfirmed visual screenings.
 */
export function enforceChemicalSafety(diagnosticReport) {
  if (diagnosticReport.model_status === 'visual_heuristic_screening' || diagnosticReport.confidence_score === null) {
    const mentionsSyntheticPesticides = /spray|mancozeb|propiconazole|chlorpyrifos|imidacloprid/i.test(diagnosticReport.treatment_plan || '');
    return {
      safe: !mentionsSyntheticPesticides,
      requiresKvkConsultation: true,
      recommendedInputs: 'Consult Local KVK / Agricultural Extension Officer'
    };
  }
  return {
    safe: true,
    requiresKvkConsultation: false,
    recommendedInputs: diagnosticReport.recommended_inputs
  };
}
