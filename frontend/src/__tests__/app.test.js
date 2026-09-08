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

  function calculateFarmerEconomicProfit({
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

  it('should compute full-cycle economic net farm profit, B:C ratio, profit per acre, and break-even price vs escrow bank payout', () => {
    // 2.5 acres Tomato, 5000 kg yield, Rs 27/kg, 38 km haul to institutional buyer
    const res = calculateFarmerEconomicProfit({
      acres: 2.5,
      quantityKg: 5000,
      pricePerKg: 27.0,
      distanceKm: 38,
      seedCostPerAcre: 3500,
      fertCostPerAcre: 6500,
      labourCostPerAcre: 8500,
      tillageCostPerAcre: 3500,
      irrigationCostPerAcre: 3000
    });

    // Cultivation: 3500 + 6500 + 8500 + 3500 + 3000 = 25000/acre * 2.5 = 62500
    assert.strictEqual(res.totalCostPerAcre, 25000);
    assert.strictEqual(res.totalCultivationCost, 62500);
    assert.strictEqual(res.productionCostPerKg, 12.50);

    // Gross: 5000 * 27 = 135000
    assert.strictEqual(res.grossRevenue, 135000);

    // Freight: 100 + 15 * 38 * (1 + 4000/3000 = 2.333) = 100 + 1330 = 1430
    assert.strictEqual(res.freight, 1430);
    // Handling: 1.5% of 135000 = 2025
    assert.strictEqual(res.handlingFee, 2025);
    assert.strictEqual(res.postHarvestCosts, 3455);

    // Escrow Net Bank Payout: 135000 - 3455 = 131545
    assert.strictEqual(res.escrowNetBankPayout, 131545);
    assert.strictEqual(res.payoutPerKg, 26.31);

    // Economic Net Farm Profit: 131545 - 62500 = 69045
    assert.strictEqual(res.economicNetFarmProfit, 69045);
    assert.strictEqual(res.profitPerAcre, 27618); // 69045 / 2.5
    assert.ok(res.profitMarginPercent > 50);

    // Benefit-Cost Ratio: 135000 / (62500 + 3455 = 65955) = 2.05 : 1
    assert.strictEqual(res.benefitCostRatio, 2.05);

    // Break-Even Price: 65955 / 5000 = 13.19/kg
    assert.strictEqual(res.breakEvenPricePerKg, 13.19);
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

  function calculateTransporterFullFleetEconomics({
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

  it('should compute escrow bank payout, break-even freight rate, revenue per ton-km, and profit per kg', () => {
    // 120 km trip in Medium LCV (5T): base 450, 26.0/km, 6.0 km/L, 3500 kg payload, tolls 320, deadhead 20%, driver 650, permit 180
    const res = calculateTransporterFullFleetEconomics({
      distanceKm: 120,
      payloadKg: 3500,
      ratePerKm: 26.0,
      baseCharge: 450,
      mileageKmPerLitre: 6.0,
      dieselPrice: 92.0,
      tolls: 320,
      deadheadRisk: 0.20,
      wearPerKm: 4.5,
      driverWages: 650,
      permitInsurance: 180,
      escrowFeePercent: 0.02
    });

    // Gross freight: 450 + (120 * 26) = 3570
    assert.strictEqual(res.grossFreightRevenue, 3570);
    // Escrow fee (2%): 71
    assert.strictEqual(res.escrowFee, 71);
    // Escrow Net Bank Payout: 3570 - 71 = 3499
    assert.strictEqual(res.escrowNetBankPayout, 3499);

    // Fuel: (120 / 6) * 92 = 20 * 92 = 1840
    assert.strictEqual(res.outwardFuelCost, 1840);
    // Deadhead (20%): 368
    assert.strictEqual(res.deadheadContingency, 368);
    // Wear: 120 * 4.5 = 540
    // Operating total: 1840 + 368 + 320 + 540 + 650 + 180 + 71 = 3969
    assert.strictEqual(res.totalOperatingCost, 3969);

    // Net trip profit: 3570 - 3969 = -399
    assert.strictEqual(res.netTripProfit, -399);

    // Break-even rate per km: 3969 / 120 = 33.08/km (minimum rate to charge to cover all expenses)
    assert.strictEqual(res.breakEvenFreightRatePerKm, 33.08);

    // Ton-km: 3.5 tons * 120 km = 420 ton-km
    assert.strictEqual(res.tonKm, 420);
    // Revenue per ton-km: 3570 / 420 = 8.50
    assert.strictEqual(res.revenuePerTonKm, 8.50);
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
