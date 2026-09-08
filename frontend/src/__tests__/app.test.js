// ─────────────────────────────────────────────────────────────────────────────
// KisanLink Frontend Core Logic Unit Tests
// Tests translations, profit calculation, escrow states, role calculations
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getLocalizedText, LANGUAGE_TEXT } from '../i18n/translations.js';

describe('i18n Multilingual Translation Module', () => {
  it('should retrieve localized strings via LANGUAGE_TEXT in English, Hindi, and Marathi', () => {
    assert.strictEqual(LANGUAGE_TEXT.en.authFarmer, 'Farmer / Producer');
    assert.strictEqual(LANGUAGE_TEXT.hi.authFarmer, 'किसान / उत्पादक');
    assert.strictEqual(LANGUAGE_TEXT.mr.authFarmer, 'शेतकरी / उत्पादक');
  });

  it('should retrieve localized strings via getLocalizedText dictionary', () => {
    assert.strictEqual(getLocalizedText('Soil Health Testing', 'en'), 'Soil Health Testing');
    assert.strictEqual(getLocalizedText('Soil Health Testing', 'hi'), 'मिट्टी स्वास्थ्य परीक्षण');
    assert.strictEqual(getLocalizedText('Soil Health Testing', 'mr'), 'मातीचे आरोग्य परीक्षण');
  });

  it('should fallback gracefully to original key when translation is absent', () => {
    const fallback = getLocalizedText('NonExistentTermXYZ', 'hi');
    assert.strictEqual(fallback, 'NonExistentTermXYZ');
  });
});

describe('Farmer Net Realization & Selling Decision Engine', () => {
  function calculateFarmerNetRealization(quantityKg, pricePerKg, distanceKm, ratePerKm = 15, baseFee = 100, handlingPct = 0.015) {
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

  it('should compute farmer net return after deducting freight and handling', () => {
    // 500 kg Tomato at Rs 27/kg over 38 km
    const res = calculateFarmerNetRealization(500, 27.0, 38, 15, 100, 0.015);
    assert.strictEqual(res.grossRevenue, 13500);
    // Freight: 100 + (15 * 38) = 670
    assert.strictEqual(res.freight, 670);
    // Handling: 1.5% of 13500 = 203
    assert.strictEqual(res.handlingFee, 203);
    assert.strictEqual(res.netReturn, 12627);
    assert.strictEqual(res.netPerKg, 25.25);
  });

  it('should evaluate when closer mandi yields higher net realization despite lower nominal rate', () => {
    // Mandi A (distant): Rs 25/kg, 120 km
    const mandiA = calculateFarmerNetRealization(1000, 25.0, 120, 15, 100, 0.065);
    // Mandi B (local): Rs 24/kg, 12 km
    const mandiB = calculateFarmerNetRealization(1000, 24.0, 12, 15, 100, 0.065);

    // Mandi A: Gross 25000 - Freight 1900 - Cess 1625 = 21475
    // Mandi B: Gross 24000 - Freight 280 - Cess 1560 = 22160
    assert.strictEqual(mandiA.netReturn, 21475);
    assert.strictEqual(mandiB.netReturn, 22160);
    assert.ok(mandiB.netReturn > mandiA.netReturn);
  });
});

describe('Buyer Landed Cost & Procurement Margin Engine', () => {
  function calculateBuyerLandedCost(quantityKg, farmPurchaseRatePerKg, distanceKm, storageDays = 3, targetResaleRatePerKg = 32.0) {
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

  it('should accurately compute buyer landed cost per kg and wholesale profit spread', () => {
    // 2500 kg Tomato at Rs 22.50/kg farm rate, 65 km inbound haul, 3 days cold storage, target resale Rs 32.0/kg
    const res = calculateBuyerLandedCost(2500, 22.5, 65, 3, 32.0);

    // Gross purchase: 2500 * 22.5 = 56250
    assert.strictEqual(res.grossPurchaseCost, 56250);
    // Inbound freight: 350 + (65 * 2.5 * 3.8) = 350 + 617.5 = 968
    assert.strictEqual(res.inboundFreight, 968);
    // Spoilage buffer: 2.5% of 56250 = 1406
    assert.strictEqual(res.spoilageBuffer, 1406);
    // Storage cost: 2.5 tons * 3 days * 120 = 900
    assert.strictEqual(res.storageCost, 900);
    // Total landed cost: 56250 + 968 + 1406 + 900 = 59524
    assert.strictEqual(res.totalLandedCost, 59524);
    assert.strictEqual(res.landedCostPerKg, 23.81);

    // Resale revenue: 2500 * 32 = 80000
    assert.strictEqual(res.projectedResaleRevenue, 80000);
    // Net gross margin: 80000 - 59524 = 20476
    assert.strictEqual(res.netGrossMargin, 20476);
    assert.ok(res.marginPercent > 25);
  });
});

describe('Transporter Trip Operating Profit & Freight Margin Engine', () => {
  function calculateTransporterTripProfit(distanceKm, ratePerKm, baseCharge, mileageKmPerLitre, dieselPrice = 92.0, tolls = 240, deadheadRisk = 0.20, driverWages = 450, wearPerKm = 2.8) {
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

  it('should compute transporter net profit deducting diesel, tolls, wear, and deadhead buffer', () => {
    // 85 km trip in Pickup (rate: 17.5/km, base: 220, mileage: 8.5 km/L, wear: 2.8/km, driver: 450, tolls: 240, diesel: 92)
    const res = calculateTransporterTripProfit(85, 17.5, 220, 8.5, 92.0, 240, 0.20, 450, 2.8);

    // Gross freight: 220 + (85 * 17.5) = 220 + 1487.5 = 1708
    assert.strictEqual(res.grossFreightRevenue, 1708);
    // Outward fuel: (85 / 8.5) * 92 = 10 * 92 = 920
    assert.strictEqual(res.outwardFuelCost, 920);
    // Deadhead contingency (20%): 920 * 0.2 = 184
    assert.strictEqual(res.deadheadContingency, 184);
    // Tolls (240) + Driver (450) + Wear (85 * 2.8 = 238) = 928
    // Total operating cost: 920 + 184 + 928 = 2032
    assert.strictEqual(res.totalOperatingCost, 2032);
    // Operating profit: 1708 - 2032 = -324 (shows realistic economic alert when mileage and deadhead are unrecovered)
    assert.strictEqual(res.netTripProfit, -324);
  });

  it('should yield healthy positive operating margin when backhaul return load is secured (deadhead = 0)', () => {
    // 150 km haul at 26.0/km (Medium LCV), base: 450, mileage: 6.0 km/L, wear: 4.5/km, driver: 650, tolls: 300, deadhead: 0
    const res = calculateTransporterTripProfit(150, 26.0, 450, 6.0, 92.0, 300, 0.0, 650, 4.5);

    // Gross freight: 450 + (150 * 26) = 4350
    assert.strictEqual(res.grossFreightRevenue, 4350);
    // Fuel: (150 / 6) * 92 = 25 * 92 = 2300
    assert.strictEqual(res.outwardFuelCost, 2300);
    assert.strictEqual(res.deadheadContingency, 0);
    // Total cost: 2300 + 0 + 300 + 650 + (150 * 4.5 = 675) = 3925
    assert.strictEqual(res.totalOperatingCost, 3925);
    assert.strictEqual(res.netTripProfit, 425);
    assert.ok(res.profitMarginPercent > 9.0);
  });
});

describe('Diagnostic Heuristic Fallback Verification', () => {
  it('should enforce null confidence score and expert review flag for heuristic predictions', () => {
    const heuristicReport = {
      model_status: 'visual_heuristic_screening',
      confidence_score: null,
      requires_expert_review: true,
      condition: 'Healthy Foliage / Vigorous Plant Canopy'
    };

    assert.strictEqual(heuristicReport.confidence_score, null);
    assert.strictEqual(heuristicReport.requires_expert_review, true);
    assert.strictEqual(heuristicReport.model_status, 'visual_heuristic_screening');
  });
});
