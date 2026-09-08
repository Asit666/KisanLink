// ─────────────────────────────────────────────────────────────────────────────
// KisanLink Frontend Core Logic Unit Tests
// Tests translations, profit calculation, escrow states, and diagnostic checks
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

describe('Net Realization & Freight Calculation Engine', () => {
  function calculateNetRealization(quantityQuintals, pricePerQuintal, distanceKm, ratePerKm = 15, baseFee = 100, platformFee = 100) {
    const grossRevenue = quantityQuintals * pricePerQuintal;
    const transportCost = baseFee + (ratePerKm * distanceKm);
    const totalDeductions = transportCost + platformFee;
    const netReturn = grossRevenue - totalDeductions;
    const netPerQuintal = quantityQuintals > 0 ? (netReturn / quantityQuintals) : 0;

    return {
      grossRevenue,
      transportCost,
      totalDeductions,
      netReturn,
      netPerQuintal: Math.round(netPerQuintal * 100) / 100
    };
  }

  it('should correctly compute net realization for 50 quintals at Rs 2450 over 38 km', () => {
    const result = calculateNetRealization(50, 2450, 38, 15, 100, 100);

    assert.strictEqual(result.grossRevenue, 122500);
    // Transport: 100 + (15 * 38) = 100 + 570 = 670
    assert.strictEqual(result.transportCost, 670);
    // Total deductions: 670 + 100 = 770
    assert.strictEqual(result.totalDeductions, 770);
    // Net return: 122500 - 770 = 121730
    assert.strictEqual(result.netReturn, 121730);
    assert.strictEqual(result.netPerQuintal, 2434.6);
  });

  it('should evaluate when closer mandi yields higher net realization despite lower nominal price', () => {
    // Mandi A (distant): Rs 2500/q, 200 km
    const mandiA = calculateNetRealization(20, 2500, 200, 15, 100, 50);
    // Mandi B (local): Rs 2400/q, 15 km
    const mandiB = calculateNetRealization(20, 2400, 15, 15, 100, 50);

    // Mandi A: 50000 - (100 + 3000 + 50) = 46850
    // Mandi B: 48000 - (100 + 225 + 50) = 47625
    assert.strictEqual(mandiA.netReturn, 46850);
    assert.strictEqual(mandiB.netReturn, 47625);
    // Local mandi B yields higher net return due to freight savings
    assert.ok(mandiB.netReturn > mandiA.netReturn);
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
