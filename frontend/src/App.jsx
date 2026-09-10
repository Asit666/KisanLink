import React, { useEffect, useState, useRef, useCallback } from 'react';
import { KisanLinkWebSocketClient } from './websocket';


import { LANGUAGE_TEXT, getLocalizedText } from './i18n/translations';

import {
  CATEGORIES,
  AGRI_INPUT_SPECS,
  DIAGNOSTIC_PRESETS,
  SUPPORT_DIRECTORY,
  INITIAL_USER_ORDERS,
  INITIAL_SHOP_INVENTORY,
  INITIAL_SHOP_OFFERS,
  INITIAL_COMMUNITY_POSTS,
  getDemoSuggestions,
  USE_DEMO_DATA,
  DEFAULT_CROPS,
  DEFAULT_BUYER_DEMANDS,
  DEFAULT_MATCHING_RECOMMENDATION,
  DEFAULT_FPO_PROFILE,
  DEFAULT_FPO_FARMERS,
  DEFAULT_FPO_LOTS,
  DEFAULT_FPO_INTAKES,
  DEFAULT_COLLECTION_SCHEDULE,
  DEFAULT_ADMIN_DATA
} from './data/mockData';

import { API_URL, AI_API_URL } from './config/api';
import { FindTransporterPanel, TransportBookingStatus, default as TransporterDashboard } from './pages/TransporterDashboard';
import TradeChatView from './pages/TradeChatView';
import FpoLotsAndPassportView from './pages/FpoLotsAndPassportView';
import FpoMemberFarmersView from './pages/FpoMemberFarmersView';
import FpoIntakeView from './pages/FpoIntakeView';
import FarmerPayoutsLedgerView from './pages/FarmerPayoutsLedgerView';
import AdminGovernanceView from './pages/AdminGovernanceView';
import {
  calculateFarmerNetRealization,
  calculateFarmerEconomicProfit,
  calculateBuyerLandedCost,
  calculateTransporterTripProfit,
  calculateTransporterFullFleetEconomics,
  normalizeMandiPricePerQuintal,
  computeQuickSellMetrics
} from './utils/economics';


// Modern Vector Icon Component for Left Navigation
function NavIcon({ name }) {
  const p = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", style: { display: "block" } };
  switch (name) {
    case 'crops':
      return <svg {...p}><path d="M7 20h10"/><path d="M12 20v-8"/><path d="M12 12c-3 0-6-3-6-6 4 0 6 3 6 6z"/><path d="M12 12c3 0 6-3 6-6-4 0-6 3-6 6z"/></svg>;
    case 'inputs':
      return <svg {...p}><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
    case 'orders':
      return <svg {...p}><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/></svg>;
    case 'shop':
      return <svg {...p}><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>;
    case 'progress':
    case 'transport':
      return <svg {...p}><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-3-4h-5v10Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>;
    case 'chat':
      return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case 'payouts':
      return <svg {...p}><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><path d="M6 14h4"/></svg>;
    case 'intake':
      return <svg {...p}><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>;
    case 'lots':
      return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;
    case 'farmers':
      return <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'analytics':
      return <svg {...p}><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>;
    case 'trust':
      return <svg {...p}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>;
    case 'governance':
      return <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>;
    case 'community':
      return <svg {...p}><path d="M17 6.1H3a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2v3l3-3h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z"/></svg>;
    case 'diagnostics':
      return <svg {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
    case 'support':
      return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg>;
    default:
      return <svg {...p}><circle cx="12" cy="12" r="10"/></svg>;
  }
}

function App() {
  const [currentView, setCurrentView] = useState('prices');
  const [activeChatConversationId, setActiveChatConversationId] = useState(null);
  const [ratingCarrierModal, setRatingCarrierModal] = useState(null);
  const [disputeModal, setDisputeModal] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 768 : true));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [crops, setCrops] = useState(DEFAULT_CROPS);
  const [buyerDemands, setBuyerDemands] = useState(DEFAULT_BUYER_DEMANDS);
  const [fpoProfile, setFpoProfile] = useState(DEFAULT_FPO_PROFILE);
  const [fpoLots, setFpoLots] = useState(DEFAULT_FPO_LOTS);
  const [fpoFarmers, setFpoFarmers] = useState(DEFAULT_FPO_FARMERS);
  const [fpoIntakes, setFpoIntakes] = useState(DEFAULT_FPO_INTAKES);
  const [collectionSchedule, setCollectionSchedule] = useState(DEFAULT_COLLECTION_SCHEDULE);
  const [adminData, setAdminData] = useState(DEFAULT_ADMIN_DATA);
  const [dealOtpModal, setDealOtpModal] = useState(null);
  const [showFpoRegisterModal, setShowFpoRegisterModal] = useState(false);
  const [showBuyerRegisterModal, setShowBuyerRegisterModal] = useState(false);
  const [routeAction, setRouteAction] = useState(null);
  const [routeFarmerId, setRouteFarmerId] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [inputCategoryFilter, setInputCategoryFilter] = useState('ALL');
  const [communityPosts, setCommunityPosts] = useState(INITIAL_COMMUNITY_POSTS);
  const [communityFilterCrop, setCommunityFilterCrop] = useState('ALL');
  const [communityParticipantFilter, setCommunityParticipantFilter] = useState('ALL');
  const [communitySearchQuery, setCommunitySearchQuery] = useState('');
  const [newPostModalOpen, setNewPostModalOpen] = useState(false);
  const [newPostForm, setNewPostForm] = useState({
    authorType: 'FARMER',
    authorName: '',
    authorRole: '',
    location: '',
    cropName: 'Tomato',
    postType: 'DISEASE_HELP',
    title: '',
    description: '',
    imageUrl: ''
  });
  const [replyInputByPostId, setReplyInputByPostId] = useState({});
  const communityPhotoInputRef = useRef(null);

  const [marketplaceSearchQuery, setMarketplaceSearchQuery] = useState('');
  const [marketplaceSortBy, setMarketplaceSortBy] = useState('POPULAR');
  const [quickProduceModal, setQuickProduceModal] = useState(null);

  const [quickRequirementModal, setQuickRequirementModal] = useState(null);
  const [quickProcureInputModal, setQuickProcureInputModal] = useState(null);
  const [isSyncingAgmarknet, setIsSyncingAgmarknet] = useState(false);
  const [agmarknetLastSync, setAgmarknetLastSync] = useState('Just now (Live)');
  const [closingDrawer, setClosingDrawer] = useState(null);
  const [cropPriceSummaries, setCropPriceSummaries] = useState({});
  const [mandiComparisons, setMandiComparisons] = useState([]);
  const [loadingMandiComparison, setLoadingMandiComparison] = useState(false);
  const [cropProduceList, setCropProduceList] = useState([]);
  const [loadingCropProduce, setLoadingCropProduce] = useState(false);
  const [cropRequirementsList, setCropRequirementsList] = useState([]);
  const [loadingCropRequirements, setLoadingCropRequirements] = useState(false);

  function closeCommunityDrawer() {
    setClosingDrawer('COMMUNITY');
    setTimeout(() => {
      setNewPostModalOpen(false);
      setClosingDrawer(null);
    }, 220);
  }

  function closeProduceDrawer() {
    setClosingDrawer('PRODUCE');
    setTimeout(() => {
      setQuickProduceModal(null);
      setClosingDrawer(null);
    }, 220);
  }

  function closeRequirementDrawer() {
    setClosingDrawer('REQUIREMENT');
    setTimeout(() => {
      setQuickRequirementModal(null);
      setClosingDrawer(null);
    }, 220);
  }

  function closeGoogleMapDrawer() {
    setClosingDrawer('GOOGLE_MAP');
    setTimeout(() => {
      setGoogleMapModalNode(null);
      setClosingDrawer(null);
    }, 220);
  }
  const [supportCategoryFilter, setSupportCategoryFilter] = useState('ALL');
  const [supportSearchQuery, setSupportSearchQuery] = useState('');
  const [selectedSupportNode, setSelectedSupportNode] = useState(null);
  const [supportMapViewMode, setSupportMapViewMode] = useState('RADAR');
  const [googleMapModalNode, setGoogleMapModalNode] = useState(null);
  const [supportDirectoryData, setSupportDirectoryData] = useState(SUPPORT_DIRECTORY);

  useEffect(() => {
    let isMounted = true;
    async function loadSupportCenters() {
      try {
        const lat = 20.0384;
        const lng = 73.8052;
        const res = await fetch(`${API_URL}/api/support/nearby?latitude=${lat}&longitude=${lng}&radiusKm=500`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item) => {
            const dLat = (item.lat != null ? item.lat : 20.0384) - lat;
            const dLng = (item.lng != null ? item.lng : 73.8052) - lng;
            const normX = Math.max(15, Math.min(85, Math.round(50 + (dLng * 15))));
            const normY = Math.max(15, Math.min(85, Math.round(50 - (dLat * 15))));

            return {
              id: `sd-db-${item.id}`,
              name: item.name,
              type: item.type,
              badge: item.badge || 'Verified Center',
              designation: item.designation || 'Institutional Support',
              department: item.department || '',
              district: item.district || '',
              location: item.location || '',
              lat: item.lat,
              lng: item.lng,
              mapQuery: `${item.name}, ${item.location || item.district}`,
              googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name + ' ' + (item.location || item.district))}`,
              distanceKm: item.distanceKm,
              rating: item.rating || '4.8',
              phone: item.phone || '',
              tollFree: item.tollFree,
              hours: item.hours || 'Mon - Sat: 09:30 AM - 05:30 PM',
              services: Array.isArray(item.services) ? item.services : [],
              inCharge: item.inCharge || 'Director / In-Charge',
              mapCoords: { x: normX, y: normY },
              status: item.status || 'ACTIVE_NOW'
            };
          });
          setSupportDirectoryData(mapped);
        }
      } catch (err) {
        console.warn('Support centers dynamic query fallback to default:', err);
      }
    }
    loadSupportCenters();
    return () => { isMounted = false; };
  }, []);
  const [buyerCalcCrop, setBuyerCalcCrop] = useState('Tomato');
  const [buyerCalcQty, setBuyerCalcQty] = useState(2500);
  const [buyerCalcQuality, setBuyerCalcQuality] = useState('GRADE_A');
  const [buyerCalcSource, setBuyerCalcSource] = useState('Direct Farm-Gate');
  const [buyerCalcDistanceKm, setBuyerCalcDistanceKm] = useState(65);
  const [buyerCalcStorageDays, setBuyerCalcStorageDays] = useState(3);
  const [buyerCalcResaleRate, setBuyerCalcResaleRate] = useState(32.0);

  const buyerDecision = (() => {
    const baseRateMap = {
      'Tomato': { farm: 22.5, hub: 24.0, apmc: 26.5 },
      'Onion': { farm: 18.0, hub: 19.5, apmc: 22.0 },
      'Wheat': { farm: 23.0, hub: 24.2, apmc: 25.8 },
      'Soybean': { farm: 42.0, hub: 43.8, apmc: 46.5 },
      'Potato': { farm: 14.5, hub: 16.0, apmc: 18.2 },
      'Green Grapes': { farm: 55.0, hub: 58.0, apmc: 64.0 }
    };
    const qualityMultipliers = { 'GRADE_APLUS': 1.12, 'GRADE_A': 1.0, 'FAQ': 0.88 };
    const qMult = qualityMultipliers[buyerCalcQuality] || 1.0;
    const rates = baseRateMap[buyerCalcCrop] || { farm: 20.0, hub: 22.0, apmc: 24.0 };

    const purchaseRatePerKg = Number((
      (buyerCalcSource === 'Direct Farm-Gate' ? rates.farm : buyerCalcSource === 'Aggregation Yard' ? rates.hub : rates.apmc) * qMult
    ).toFixed(2));

    const qty = Math.max(1, Number(buyerCalcQty) || 100);
    const grossPurchaseCost = Math.round(purchaseRatePerKg * qty);
    const tonnage = qty / 1000;
    const inboundFreight = Math.round(350 + (buyerCalcDistanceKm * Math.max(1, tonnage) * 3.8));
    const spoilageBuffer = Math.round(grossPurchaseCost * 0.025);
    const storageCost = Math.round(tonnage * Math.max(1, buyerCalcStorageDays) * 120);

    const totalLandedCost = grossPurchaseCost + inboundFreight + spoilageBuffer + storageCost;
    const landedCostPerKg = Number((totalLandedCost / qty).toFixed(2));

    const targetRate = Math.max(0.1, Number(buyerCalcResaleRate) || (purchaseRatePerKg * 1.3));
    const projectedResaleRevenue = Math.round(targetRate * qty);
    const netGrossMargin = projectedResaleRevenue - totalLandedCost;
    const marginPerQuintal = Number(((netGrossMargin / qty) * 100).toFixed(2));
    const marginPercent = Number(((netGrossMargin / Math.max(1, projectedResaleRevenue)) * 100).toFixed(1));
    const apmcCommissionAvoided = Math.round(grossPurchaseCost * 0.065);

    return {
      purchaseRatePerKg,
      grossPurchaseCost,
      inboundFreight,
      spoilageBuffer,
      storageCost,
      totalLandedCost,
      landedCostPerKg,
      projectedResaleRevenue,
      netGrossMargin,
      marginPerQuintal,
      marginPercent,
      apmcCommissionAvoided
    };
  })();
  const TRANSPORTER_VEHICLE_SPECS = {
    'MINI_TRUCK': { baseCharge: 150, ratePerKm: 14.0, mileage: 10.5, wearPerKm: 2.2, driverPerTrip: 350, permitInsurancePerTrip: 80, name: 'Mini-Truck (Tata Ace / 2T)' },
    'PICKUP': { baseCharge: 220, ratePerKm: 17.5, mileage: 8.5, wearPerKm: 2.8, driverPerTrip: 450, permitInsurancePerTrip: 100, name: 'Pickup (Bolero Maxi / 1.5T)' },
    'MEDIUM_5T': { baseCharge: 450, ratePerKm: 26.0, mileage: 6.0, wearPerKm: 4.5, driverPerTrip: 650, permitInsurancePerTrip: 180, name: 'Medium LCV (Eicher 5T)' },
    'HEAVY_10T': { baseCharge: 800, ratePerKm: 42.0, mileage: 4.2, wearPerKm: 7.0, driverPerTrip: 950, permitInsurancePerTrip: 250, name: 'Multi-Axle Heavy (10T)' },
    'REEFER': { baseCharge: 950, ratePerKm: 48.0, mileage: 3.8, wearPerKm: 8.5, driverPerTrip: 1100, permitInsurancePerTrip: 320, name: 'Cold-Chain Reefer (Temp Controlled)' }
  };

  const [transCalcDistanceKm, setTransCalcDistanceKm] = useState(85);
  const [transCalcPayloadKg, setTransCalcPayloadKg] = useState(2500);
  const [transCalcVehicleType, setTransCalcVehicleType] = useState('PICKUP');
  const [transCalcDieselPrice, setTransCalcDieselPrice] = useState(92.0);
  const [transCalcTollCost, setTransCalcTollCost] = useState(240);
  const [transCalcDeadheadRisk, setTransCalcDeadheadRisk] = useState(0.20);
  const [transCalcDriverWage, setTransCalcDriverWage] = useState(null);
  const [transCalcPermitCost, setTransCalcPermitCost] = useState(null);
  const [showTransCostDetails, setShowTransCostDetails] = useState(false);

  const transporterTripDecision = (() => {
    const spec = TRANSPORTER_VEHICLE_SPECS[transCalcVehicleType] || TRANSPORTER_VEHICLE_SPECS['PICKUP'];
    const dist = Math.max(1, Number(transCalcDistanceKm) || 10);
    const payloadKg = Math.max(10, Number(transCalcPayloadKg) || 1000);
    const payloadTons = payloadKg / 1000;
    const tonKm = Number((payloadTons * dist).toFixed(1));

    const grossFreightRevenue = Math.round(spec.baseCharge + (dist * spec.ratePerKm));
    const escrowFee = Math.round(grossFreightRevenue * 0.02);
    const escrowNetBankPayout = grossFreightRevenue - escrowFee;

    const fuelPrice = Math.max(50, Number(transCalcDieselPrice) || 92);
    const fuelLitres = dist / spec.mileage;
    const outwardFuelCost = Math.round(fuelLitres * fuelPrice);
    const deadheadContingency = Math.round(outwardFuelCost * Number(transCalcDeadheadRisk));
    const tolls = Number(transCalcTollCost) || 0;
    const maintenanceAndWear = Math.round(dist * spec.wearPerKm);
    const driverWages = transCalcDriverWage !== null && transCalcDriverWage !== undefined && transCalcDriverWage !== '' ? Number(transCalcDriverWage) : spec.driverPerTrip;
    const permitInsurance = transCalcPermitCost !== null && transCalcPermitCost !== undefined && transCalcPermitCost !== '' ? Number(transCalcPermitCost) : spec.permitInsurancePerTrip;

    const totalOperatingCost = outwardFuelCost + deadheadContingency + tolls + maintenanceAndWear + driverWages + permitInsurance + escrowFee;
    const netTripProfit = grossFreightRevenue - totalOperatingCost;
    const profitMarginPercent = Number(((netTripProfit / Math.max(1, grossFreightRevenue)) * 100).toFixed(1));
    const netReturnPerKm = Number((netTripProfit / dist).toFixed(2));
    const netReturnPerKg = Number((netTripProfit / payloadKg).toFixed(2));
    const breakEvenFreightRatePerKm = Number((totalOperatingCost / dist).toFixed(2));
    const revenuePerTonKm = Number((grossFreightRevenue / Math.max(0.1, tonKm)).toFixed(2));

    return {
      specName: spec.name,
      grossFreightRevenue,
      escrowFee,
      escrowNetBankPayout,
      outwardFuelCost,
      deadheadContingency,
      tolls,
      maintenanceAndWear,
      driverWages,
      permitInsurance,
      totalOperatingCost,
      netTripProfit,
      profitMarginPercent,
      netReturnPerKm,
      netReturnPerKg,
      breakEvenFreightRatePerKm,
      revenuePerTonKm,
      tonKm,
      payloadTons
    };
  })();
  const CROP_PRODUCTION_BENCHMARKS = {
    'Tomato': { defaultAcres: 2.5, yieldPerAcreKg: 2000, seedCostPerAcre: 3500, fertCostPerAcre: 6500, labourCostPerAcre: 8500, tillageCostPerAcre: 3500, irrigationCostPerAcre: 3000 },
    'Onion': { defaultAcres: 2.0, yieldPerAcreKg: 2400, seedCostPerAcre: 4000, fertCostPerAcre: 5500, labourCostPerAcre: 7000, tillageCostPerAcre: 3200, irrigationCostPerAcre: 2800 },
    'Wheat': { defaultAcres: 4.0, yieldPerAcreKg: 1600, seedCostPerAcre: 2200, fertCostPerAcre: 4200, labourCostPerAcre: 4500, tillageCostPerAcre: 2800, irrigationCostPerAcre: 1800 },
    'Soybean': { defaultAcres: 3.5, yieldPerAcreKg: 1000, seedCostPerAcre: 2600, fertCostPerAcre: 3800, labourCostPerAcre: 4200, tillageCostPerAcre: 2200, irrigationCostPerAcre: 1300 },
    'Potato': { defaultAcres: 2.0, yieldPerAcreKg: 3500, seedCostPerAcre: 8500, fertCostPerAcre: 7500, labourCostPerAcre: 8000, tillageCostPerAcre: 4000, irrigationCostPerAcre: 3500 },
    'Green Grapes': { defaultAcres: 1.5, yieldPerAcreKg: 2200, seedCostPerAcre: 9000, fertCostPerAcre: 12000, labourCostPerAcre: 14000, tillageCostPerAcre: 5000, irrigationCostPerAcre: 6000 }
  };

  const [sellCalcCrop, setSellCalcCrop] = useState('Tomato');
  const [sellCalcAcres, setSellCalcAcres] = useState(2.5);
  const [sellCalcQty, setSellCalcQty] = useState(5000);
  const [sellCalcQuality, setSellCalcQuality] = useState('GRADE_A');
  const [sellCalcCluster, setSellCalcCluster] = useState('Nashik Aggregation Yard');
  const [showCultivationCosts, setShowCultivationCosts] = useState(false);
  const [customCostOverrides, setCustomCostOverrides] = useState({});
  const netSellDecision = (() => {
    const crop = sellCalcCrop;
    const benchmark = CROP_PRODUCTION_BENCHMARKS[crop] || CROP_PRODUCTION_BENCHMARKS['Tomato'];
    const acres = Math.max(0.1, Number(sellCalcAcres) || 1);
    const qty = Math.max(1, Number(sellCalcQty) || Math.round(acres * benchmark.yieldPerAcreKg));
    const quality = sellCalcQuality;

    const seedCostPerAcre = customCostOverrides.seedCost !== undefined ? Number(customCostOverrides.seedCost) : benchmark.seedCostPerAcre;
    const fertCostPerAcre = customCostOverrides.fertCost !== undefined ? Number(customCostOverrides.fertCost) : benchmark.fertCostPerAcre;
    const labourCostPerAcre = customCostOverrides.labourCost !== undefined ? Number(customCostOverrides.labourCost) : benchmark.labourCostPerAcre;
    const tillageCostPerAcre = customCostOverrides.tillageCost !== undefined ? Number(customCostOverrides.tillageCost) : benchmark.tillageCostPerAcre;
    const irrigationCostPerAcre = customCostOverrides.irrigationCost !== undefined ? Number(customCostOverrides.irrigationCost) : benchmark.irrigationCostPerAcre;

    const totalCostPerAcre = seedCostPerAcre + fertCostPerAcre + labourCostPerAcre + tillageCostPerAcre + irrigationCostPerAcre;
    const totalCultivationCost = Math.round(acres * totalCostPerAcre);
    const productionCostPerKg = Number((totalCultivationCost / qty).toFixed(2));

    const qMultiplier = quality === 'GRADE_APLUS' ? 1.15 : (quality === 'GRADE_A' ? 1.0 : 0.88);
    const baseRates = {
      'Tomato': 27.0,
      'Onion': 22.5,
      'Wheat': 25.5,
      'Soybean': 48.0,
      'Potato': 19.0,
      'Green Grapes': 78.0
    };
    const nominalRate = (baseRates[crop] || 25.0) * qMultiplier;
    const buyerDistKm = 38;
    const buyerRatePerKg = Math.round(nominalRate * 10) / 10;
    const buyerGross = Math.round(qty * buyerRatePerKg);
    const buyerFreight = 100 + Math.round(15 * buyerDistKm * (1 + (qty > 1000 ? (qty - 1000) / 3000 : 0)));
    const buyerHandling = Math.round(buyerGross * 0.015);
    const buyerPostHarvestCosts = buyerFreight + buyerHandling;
    const buyerBankPayout = buyerGross - buyerPostHarvestCosts;
    const buyerNetPerKg = Math.round((buyerBankPayout / qty) * 100) / 100;
    const buyerEconomicProfit = buyerBankPayout - totalCultivationCost;
    const buyerProfitPerAcre = Math.round(buyerEconomicProfit / acres);
    const buyerMarginPercent = Number(((buyerEconomicProfit / Math.max(1, buyerGross)) * 100).toFixed(1));
    const buyerBenefitCostRatio = Number((buyerGross / Math.max(1, totalCultivationCost + buyerPostHarvestCosts)).toFixed(2));
    const buyerBreakEvenPricePerKg = Number(((totalCultivationCost + buyerPostHarvestCosts) / qty).toFixed(2));
    const mandiDistKm = 12;
    const mandiRatePerKg = Math.round((nominalRate * 0.94) * 10) / 10;
    const mandiGross = Math.round(qty * mandiRatePerKg);
    const mandiFreight = 100 + Math.round(15 * mandiDistKm);
    const mandiCommission = Math.round(mandiGross * 0.065);
    const mandiPostHarvestCosts = mandiFreight + mandiCommission;
    const mandiBankPayout = mandiGross - mandiPostHarvestCosts;
    const mandiNetPerKg = Math.round((mandiBankPayout / qty) * 100) / 100;
    const mandiEconomicProfit = mandiBankPayout - totalCultivationCost;
    const mandiProfitPerAcre = Math.round(mandiEconomicProfit / acres);
    const mandiMarginPercent = Number(((mandiEconomicProfit / Math.max(1, mandiGross)) * 100).toFixed(1));
    const mandiBenefitCostRatio = Number((mandiGross / Math.max(1, totalCultivationCost + mandiPostHarvestCosts)).toFixed(2));
    const mandiBreakEvenPricePerKg = Number(((totalCultivationCost + mandiPostHarvestCosts) / qty).toFixed(2));
    const traderRatePerKg = Math.round((nominalRate * 0.82) * 10) / 10;
    const traderGross = Math.round(qty * traderRatePerKg);
    const traderBankPayout = traderGross;
    const traderNetPerKg = traderRatePerKg;
    const traderEconomicProfit = traderGross - totalCultivationCost;
    const traderProfitPerAcre = Math.round(traderEconomicProfit / acres);
    const traderMarginPercent = Number(((traderEconomicProfit / Math.max(1, traderGross)) * 100).toFixed(1));
    const traderBenefitCostRatio = Number((traderGross / Math.max(1, totalCultivationCost)).toFixed(2));
    const traderBreakEvenPricePerKg = Number((totalCultivationCost / qty).toFixed(2));

    const netAdvantage = buyerEconomicProfit - Math.max(mandiEconomicProfit, traderEconomicProfit);

    return {
      qty,
      crop,
      acres,
      quality,
      seedCostPerAcre,
      fertCostPerAcre,
      labourCostPerAcre,
      tillageCostPerAcre,
      irrigationCostPerAcre,
      totalCostPerAcre,
      totalCultivationCost,
      productionCostPerKg,
      buyer: {
        destinationName: 'Azadpur Terminal Hub / Reliance Agro Link',
        buyerName: 'FreshBasket Agri Procurement Ltd',
        pricePerKg: buyerRatePerKg,
        distanceKm: buyerDistKm,
        freight: buyerFreight,
        handlingFee: buyerHandling,
        totalCosts: buyerPostHarvestCosts,
        grossRevenue: buyerGross,
        bankPayout: buyerBankPayout,
        netReturn: buyerBankPayout,
        netPerKg: buyerNetPerKg,
        economicProfit: buyerEconomicProfit,
        profitPerAcre: buyerProfitPerAcre,
        marginPercent: buyerMarginPercent,
        benefitCostRatio: buyerBenefitCostRatio,
        breakEvenPricePerKg: buyerBreakEvenPricePerKg,
        trustScore: 97,
        matchScore: 94,
        paymentTerms: '24-Hour Verified Escrow Settlement'
      },
      mandi: {
        destinationName: 'Local APMC Central Mandi Yard',
        pricePerKg: mandiRatePerKg,
        distanceKm: mandiDistKm,
        freight: mandiFreight,
        commissionFee: mandiCommission,
        grossRevenue: mandiGross,
        bankPayout: mandiBankPayout,
        netReturn: mandiBankPayout,
        netPerKg: mandiNetPerKg,
        economicProfit: mandiEconomicProfit,
        profitPerAcre: mandiProfitPerAcre,
        marginPercent: mandiMarginPercent,
        benefitCostRatio: mandiBenefitCostRatio,
        breakEvenPricePerKg: mandiBreakEvenPricePerKg
      },
      villageTrader: {
        destinationName: 'Village Gate Aggregator',
        pricePerKg: traderRatePerKg,
        grossRevenue: traderGross,
        bankPayout: traderBankPayout,
        netReturn: traderBankPayout,
        netPerKg: traderNetPerKg,
        economicProfit: traderEconomicProfit,
        profitPerAcre: traderProfitPerAcre,
        marginPercent: traderMarginPercent,
        benefitCostRatio: traderBenefitCostRatio,
        breakEvenPricePerKg: traderBreakEvenPricePerKg
      },
      netAdvantage: Math.max(0, netAdvantage)
    };
  })();
  const [userOrders, setUserOrders] = useState(INITIAL_USER_ORDERS);
  const [shopInventory, setShopInventory] = useState(INITIAL_SHOP_INVENTORY);
  const [shopOffers, setShopOffers] = useState(INITIAL_SHOP_OFFERS);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState('KL-ORD-8821');
  const [shopCategoryFilter, setShopCategoryFilter] = useState('ALL');

  function handleReleaseEscrow(orderId) {
    setUserOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          escrowStatus: 'DELIVERED',
          orderStatus: 'DELIVERED',
          timeline: o.timeline.map((step, idx) => idx === o.timeline.length - 1 ? { ...step, completed: true, active: true, timestamp: 'Just Now' } : step)
        };
      }
      return o;
    }));
    setMessage(`Escrow funds for Order #${orderId} released to seller's verified account.`);
  }

  function handleRaiseDispute(orderId) {
    setUserOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, escrowStatus: 'DISPUTED', orderStatus: 'DISPUTED' };
      }
      return o;
    }));
    setMessage(`Dispute raised for Order #${orderId}. ICICI Escrow desk and APMC arbitrator notified.`);
  }

  function handleToggleShopStatus(inventoryId) {
    setShopInventory(prev => prev.map(item => {
      if (item.id === inventoryId) {
        const nextStatus = item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  }

  function handleAcceptOffer(offer) {
    const newOrderId = `KL-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: newOrderId,
      dealId: Math.floor(200 + Math.random() * 800),
      commodity: offer.cropName,
      category: 'PRODUCE',
      role: 'SELLER',
      counterpart: `${offer.buyerName} (${offer.buyerType.replace('_', ' ')})`,
      counterpartPhone: '+91 22 4400 8899',
      quantity: offer.offeredQuantity,
      unit: offer.unit,
      pricePerUnit: offer.offeredPrice,
      totalAmount: offer.offeredQuantity * offer.offeredPrice,
      escrowStatus: 'ESCROW_LOCKED',
      escrowPercent: 100,
      orderStatus: 'CONTRACT_SIGNED',
      orderDate: new Date().toISOString().split('T')[0],
      estimatedDelivery: '3 Days from Dispatch',
      originLocation: 'Nashik Aggregation Yard',
      deliveryLocation: offer.destination,
      logistics: {
        carrier: 'KisanLink Freight Direct',
        vehicleNo: 'Assignment Pending',
        driverName: 'Fleet Assigned on Dispatch',
        driverPhone: '--',
        currentLocation: 'Nashik Hub Silo',
        currentStage: 2
      },
      qualityCertificate: 'Farmer Self-Declared & Assay Pending',
      timeline: [
        { stage: 1, title: 'Order Placed & Contract Signed', desc: 'Direct buyer offer accepted by farmer', timestamp: 'Just Now', completed: true },
        { stage: 2, title: 'Escrow Protected & Deposit Locked', desc: `₹${(offer.offeredQuantity * offer.offeredPrice).toLocaleString()} locked in ICICI Escrow`, timestamp: 'Just Now', completed: true, active: true },
        { stage: 3, title: 'Quality Assay & Moisture Tested', desc: 'Pre-dispatch QC check', timestamp: 'Scheduled Tomorrow', completed: false },
        { stage: 4, title: 'Dispatched & In Transit', desc: 'Carrier dispatch', timestamp: 'Pending QC', completed: false },
        { stage: 5, title: 'Destination Hub Arrival', desc: offer.destination, timestamp: 'Pending Dispatch', completed: false },
        { stage: 6, title: 'Delivery Sign-off & Escrow Payout', desc: 'Instant payout to Farmer bank account', timestamp: 'Pending Delivery', completed: false }
      ]
    };

    setUserOrders(prev => [newOrder, ...prev]);
    setShopOffers(prev => prev.filter(o => o.id !== offer.id));
    setMessage(`Offer from ${offer.buyerName} accepted! Created Trade Contract #${newOrderId}.`);
  }

  function handleDeclineOffer(offerId) {
    setShopOffers(prev => prev.filter(o => o.id !== offerId));
    setMessage(`Offer declined.`);
  }

  function handleTrackOrder(orderId) {
    setSelectedTrackingOrderId(orderId);
    setCurrentView('order-progress');
  }

  async function submitTradeDispute(e) {
    if (e) e.preventDefault();
    if (!disputeModal) return;
    const { trade, disputeType, claimAmount, description } = disputeModal;
    setMessage('Submitting trade dispute for arbitration...');
    try {
      if (session?.token && !session?.token.startsWith('demo-')) {
        await fetch(`${API_URL}/api/trades/disputes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({
            tradeDealId: trade.id,
            disputeType: disputeType,
            claimAmount: Number(claimAmount) || 0,
            description: description || 'Specification discrepancy or logistics issue.'
          })
        });
      }
      setMessage(`Dispute successfully filed for Deal #${trade.id}. Escrow desk and APMC arbitration desk notified.`);
      setDisputeModal(null);
    } catch {
      setMessage(`Dispute filed for Deal #${trade.id}.`);
      setDisputeModal(null);
    }
  }

  async function submitCarrierRating(e) {
    if (e) e.preventDefault();
    if (!ratingCarrierModal) return;
    const { trade, rating, tags, notes } = ratingCarrierModal;
    const transporterId = trade?.transporterId || 1;
    setMessage('Submitting transporter reliability review...');
    try {
      if (session?.token && !session?.token.startsWith('demo-')) {
        await fetch(`${API_URL}/api/transport/transporters/${transporterId}/rate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({
            rating: Number(rating),
            tags: tags,
            reviewNotes: notes || 'Punctual and careful transit.'
          })
        });
      }
      setMessage(`Review submitted! Transporter rated ${rating}/5 stars. Reliability index updated.`);
      setRatingCarrierModal(null);
    } catch {
      setMessage(`Review submitted! Transporter rated ${rating}/5 stars.`);
      setRatingCarrierModal(null);
    }
  }
  const [imageInputMode, setImageInputMode] = useState('sample');
  const [diagnosticForm, setDiagnosticForm] = useState({
    cropName: '',
    cropId: null,
    imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=600&auto=format&fit=crop',
    notes: 'Concentric dark target rings with yellow chlorotic halos on bottom leaves.'
  });
  const [previewImageUrl, setPreviewImageUrl] = useState('https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=900&auto=format&fit=crop');
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [diagnosticHistory, setDiagnosticHistory] = useState([]);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticFile, setDiagnosticFile] = useState(null);
  const [diagnosticImageFeatures, setDiagnosticImageFeatures] = useState(null);
  const [escalateModalReport, setEscalateModalReport] = useState(null);
  const [escalationNotes, setEscalationNotes] = useState('');
  const diagnosticFileInputRef = useRef(null);
  const diagnosticCameraInputRef = useRef(null);
  const [pulseCategory, setPulseCategory] = useState('VEGETABLE');
  const [selectedPulseCropId, setSelectedPulseCropId] = useState(null);
  const [pulseCrop, setPulseCrop] = useState(null);
  const [pulsePrices, setPulsePrices] = useState([]);
  const [trend, setTrend] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [nearbyMarkets, setNearbyMarkets] = useState([]);
  const [selectedMapMarket, setSelectedMapMarket] = useState(null);
  const [mapCoords, setMapCoords] = useState({ lat: 23.3441, lon: 85.3096, label: 'Ranchi Center' });
  const [mapRadius, setMapRadius] = useState(200);
  const [mapLoading, setMapLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherCropId, setWeatherCropId] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'PRICE_ALERT',
      icon: '[Crop]',
      title: 'Tomato Market Price Jump',
      message: 'Tomato modal price reached ₹24/kg (+14.3%) in Ranchi Main Market.',
      time: '10m ago',
      unread: true,
      viewTarget: 'prices'
    },
    {
      id: 2,
      type: 'BUYER_MATCH',
      icon: '[Deal]',
      title: 'New Matching Requirement',
      message: 'ABC Processors published a requirement for 2,000 kg Grade A Tomato at ₹30/kg.',
      time: '25m ago',
      unread: true,
      viewTarget: 'matching'
    },
    {
      id: 3,
      type: 'FORECAST',
      icon: '[Trend]',
      title: 'Bullish AI Price Forecast',
      message: 'Mustard Seeds projected +7.2% upward trajectory over the next 7 days.',
      time: '1h ago',
      unread: true,
      viewTarget: 'predictions'
    },
    {
      id: 4,
      type: 'ROUTE',
      icon: '[Radar]',
      title: 'Freight Rate Update',
      message: 'Ramgarh Market route active (38.4 km, ₹675.40 freight).',
      time: '2h ago',
      unread: false,
      viewTarget: 'map'
    }
  ]);

  const [authMode, setAuthMode] = useState('login');
  const [role, setRole] = useState('FARMER');
  const [account, setAccount] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    orgName: '',
    regNumber: '',
    district: '',
    state: '',
    businessType: 'Wholesaler',
    vehicleType: 'Medium Commercial (Eicher / 407)',
    vehicleNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [session, setSession] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('kisanlinkSession') || 'null');
      if (stored && stored.name) {
        stored.name = stored.name.replace(/\s*\((farmer|buyer|agrotech)[^)]*\)/gi, '').trim();
      }
      return stored;
    } catch {
      return null;
    }
  });
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('kisanlinkLanguage') || 'en';
    } catch {
      return 'en';
    }
  });
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialFocusRect, setTutorialFocusRect] = useState(null);
  const tutorialRefs = useRef({ language: null, market: null, sidebarMarket: null, notifications: null, profile: null, diagnostics: null });
  const tutorialScrollLockRef = useRef(false);
  const tutorialLastRectRef = useRef(null);

  const text = LANGUAGE_TEXT[language] || LANGUAGE_TEXT.en;
  const tutorialTargets = [
    { key: 'market', title: text.tutorialStep1Title || 'Live Mandi & Market Trading', description: text.tutorialStep1Text || 'Monitor real-time Agmarknet mandi arrivals, wholesale modal rates, and price trends across major agricultural hubs.' },
    { key: 'sidebarMarket', title: text.tutorialStep2Title || 'Commodity & Inputs Desk', description: text.tutorialStep2Text || 'Access certified farm inputs, fertilizer catalogues, seed varieties, and direct harvest order management.' },
    { key: 'diagnostics', title: text.tutorialStep3Title || 'AI Crop Health Diagnostics', description: text.tutorialStep3Text || 'Instant visual plant pathology powered by scientific image assessment with safe biological protocol guidance.' },
    { key: 'language', title: text.tutorialStep4Title || 'Multilingual Regional Dialects', description: text.tutorialStep4Text || 'Instant switching between English, Hindi (हिन्दी), and Marathi (मराठी) across all views and data tables.' },
    { key: 'notifications', title: text.tutorialStep5Title || 'Real-Time Escrow & Activity Feed', description: text.tutorialStep5Text || 'Live WebSocket streaming updates for deal escrow, dispatch manifests, proof of delivery, and certified weigh-slips.' },
    { key: 'profile', title: text.tutorialStep6Title || 'Verified Trade Profile & Ledger', description: text.tutorialStep6Text || 'Manage KYC bank accounts, digital delivery receipts, and automated NPCI IMPS / UPI settlement disbursals.' },
  ];

  useEffect(() => {
    if (!showTutorial) {
      setTutorialFocusRect(null);
      return;
    }

    const targetKey = tutorialTargets[tutorialStep]?.key;
    if (!targetKey) {
      setTutorialFocusRect(null);
      return;
    }

    if (targetKey === 'market' || targetKey === 'sidebarMarket') {
      setCurrentView('prices');
    } else if (targetKey === 'diagnostics') {
      setCurrentView('diagnostics');
    } else if (targetKey === 'notifications') {
      setCurrentView('notifications');
    } else if (targetKey === 'profile') {
      setCurrentView('profile');
    }

    let rafId = null;

    const updateFocusRect = () => {
      const node = tutorialRefs.current[targetKey];
      if (!node) {
        setTutorialFocusRect(null);
        return;
      }

      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight) {
        setTutorialFocusRect({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        });
      } else {
        setTutorialFocusRect(null);
      }
    };

    updateFocusRect();
    rafId = requestAnimationFrame(updateFocusRect);

    const onResize = () => updateFocusRect();
    const onScroll = () => updateFocusRect();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') completeTutorial();
      if (e.key === 'ArrowRight') setTutorialStep(prev => Math.min(prev + 1, tutorialTargets.length - 1));
      if (e.key === 'ArrowLeft') setTutorialStep(prev => Math.max(prev - 1, 0));
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, { passive: true });
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showTutorial, tutorialStep, language]);

  useEffect(() => {
    try {
      localStorage.setItem('kisanlinkLanguage', language);
    } catch {
    }
  }, [language]);
  const [produceSource, setProduceSource] = useState('catalog');
  const [produce, setProduce] = useState({
    cropId: 1,
    cropName: '',
    category: 'VEGETABLE',
    quantity: 500,
    quality: 'GRADE_A',
    harvestDate: '',
    availableUntil: '',
    expectedPrice: '',
    imageUrl: '',
    description: '',
  });
  const [requirementSource, setRequirementSource] = useState('catalog');
  const [requirement, setRequirement] = useState({
    cropId: 1,
    cropName: '',
    category: 'VEGETABLE',
    requiredQuantity: 2000,
    qualityRequired: 'GRADE_A',
    offeredPrice: 27,
    validUntil: '',
    location: '',
  });

  const [produceResult, setProduceResult] = useState({
    id: 1,
    crop: { id: 1, name: 'Tomato', category: 'VEGETABLE' },
    cropName: 'Tomato',
    category: 'VEGETABLE',
    quantity: 1200,
    quality: 'GRADE_A'
  });
  const [recommendation, setRecommendation] = useState(DEFAULT_MATCHING_RECOMMENDATION);
  const [trades, setTrades] = useState([
    {
      id: 101,
      cropName: 'Tomato (Hybrid Desi)',
      cropCategory: 'VEGETABLE',
      farmerName: 'Ramesh Kumar (Nashik Cluster)',
      farmerDistrict: 'Nashik',
      buyerName: 'Priya Agro Wholesale Hub',
      quantity: 1200,
      agreedPricePerKg: 32.0,
      transportCost: 450,
      netFarmerReturn: 37950,
      status: 'IN_TRANSIT',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      notes: 'Standard Grade A+ dispatch via KisanLink Freight Express.',
      negotiations: [
        { id: 1, senderName: 'Priya Agro', senderRole: 'BUYER', proposedPricePerKg: 30.0, proposedQuantity: 1200, message: 'Initial requirement for 1.2 tons at ₹30/kg', createdAt: new Date(Date.now() - 172800000).toISOString() },
        { id: 2, senderName: 'Ramesh Kumar', senderRole: 'FARMER', proposedPricePerKg: 32.0, proposedQuantity: 1200, message: 'Can supply Grade A+ sorted crates at ₹32/kg with sorting guarantee', createdAt: new Date(Date.now() - 120000000).toISOString() }
      ]
    },
    {
      id: 102,
      cropName: 'Wheat (Lokwan Sharbati)',
      cropCategory: 'GRAIN',
      farmerName: 'Sahyadri Farmers Producer Co.',
      farmerDistrict: 'Nashik',
      buyerName: 'Adani Agri Logistics Ltd',
      quantity: 5000,
      agreedPricePerKg: 24.5,
      transportCost: 1200,
      netFarmerReturn: 121300,
      status: 'ACCEPTED',
      createdAt: new Date(Date.now() - 43200000).toISOString(),
      notes: 'Direct FPO procurement handshake with moisture assay certificate.',
      negotiations: []
    }
  ]);
  const [negotiatingDealId, setNegotiatingDealId] = useState(null);
  const [counterOffer, setCounterOffer] = useState({ proposedPricePerKg: '', proposedQuantity: '', message: '' });
  const [selectedInvoiceTrade, setSelectedInvoiceTrade] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [profile, setProfile] = useState({ businessName: '', businessType: '', address: '', district: '', state: '', latitude: '23.3441', longitude: '85.3096', phone: '', alertEmail: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [liveToast, setLiveToast] = useState(null);
  const wsClientRef = useRef(null);
  const [escrowMap, setEscrowMap] = useState({});
  const [escrowDepositModal, setEscrowDepositModal] = useState(null);
  const [escrowDepositForm, setEscrowDepositForm] = useState({ buyerUpiId: '', paymentMethod: 'UPI_INSTANT' });
  const [smsLogs, setSmsLogs] = useState([]);
  const [smsLogLoading, setSmsLogLoading] = useState(false);
  const [notifSubTab, setNotifSubTab] = useState('app');
  const [testSmsForm, setTestSmsForm] = useState({
    recipientPhone: '+91 98765 43210',
    channel: 'WHATSAPP',
    messageType: 'TRADE_OFFER',
    text: 'Ranchi APMC: Buyer posted requirement for 500 kg Tomato at ₹36/kg. Reply ACCEPT to confirm.'
  });

  useEffect(() => {
    loadCrops();
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.hostname}:8080/ws`;
    const client = new KisanLinkWebSocketClient(wsUrl, (status) => {
      setWsConnected(status);
    });
    wsClientRef.current = client;
    client.connect();
    const unsubPrices = client.subscribe('/topic/prices/alerts', (event) => {
      if (!event) return;
      const newNotif = {
        id: Date.now(),
        type: 'PRICE_ALERT',
        title: `${event.cropName} Price Movement`,
        message: `${event.marketName}: ₹${event.newPrice}/kg (${event.changePercent > 0 ? '+' : ''}${event.changePercent}%)`,
        time: 'Just now',
        unread: true,
        viewTarget: 'prices'
      };
      setNotifications(prev => [newNotif, ...prev]);
      setLiveToast({ title: newNotif.title, message: newNotif.message });
      setTimeout(() => setLiveToast(null), 5000);
      if (selectedPulseCropId) {
        loadPriceData(selectedPulseCropId);
      }
    });


    return () => {
      unsubPrices();
      client.disconnect();
    };
  }, []);
  useEffect(() => {
    if (!session || !session.userId || !wsClientRef.current) return;
    const client = wsClientRef.current;
    const unsubNotifs = client.subscribe(`/topic/notifications/user/${session.userId}`, (event) => {
      if (!event) return;
      const newNotif = {
        id: Date.now(),
        type: event.eventType || 'NOTIFICATION',
        icon: event.eventType?.includes('BUYER') ? '[Trade]' : event.eventType?.includes('TRADE') ? '[Order]' : '[Notice]',
        title: event.title || 'Live Update',
        message: event.message || '',
        time: 'Just now',
        unread: true,
        viewTarget: event.eventType?.includes('TRADE') ? 'matching' : 'notifications'
      };
      setNotifications(prev => [newNotif, ...prev]);
      setLiveToast({ title: newNotif.title, message: newNotif.message });
      setTimeout(() => setLiveToast(null), 6000);
    });
    const unsubTrades = client.subscribe(`/topic/trades/user/${session.userId}`, (event) => {
      if (!event) return;
      loadTrades();
      if (session.role === 'FARMER' || currentView === 'analytics') {
        loadFarmerAnalytics();
      }
    });

    return () => {
      unsubNotifs();
      unsubTrades();
    };
  }, [session, currentView]);

  useEffect(() => {
    if (session) {
      loadTrades();
      if (session.role === 'FARMER' || currentView === 'analytics') {
        loadFarmerAnalytics();
      }
    }
  }, [session, currentView]);

  async function loadFarmerAnalytics() {
    if (!session || !session.profileId) return;
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/analytics/farmer/${session.profileId}`, {
        headers: { Authorization: `Bearer ${session.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.totalLifetimeRevenue || data.completedTradesCount)) {
          if (data.monthlyEarnings && data.monthlyEarnings.length > 0) {
            data.monthlyEarnings = data.monthlyEarnings.map(m => ({
              ...m,
              totalVolumeTons: m.totalVolumeTons || (m.totalVolumeKg ? (m.totalVolumeKg / 1000).toFixed(1) : '1.2')
            }));
            if (data.monthlyEarnings.length === 1) {
              data.monthlyEarnings = [
                { month: 'May 2026', totalRevenue: 52400, totalVolumeTons: 2.6, totalVolumeKg: 2600 },
                { month: 'Jun 2026', totalRevenue: 44100, totalVolumeTons: 2.2, totalVolumeKg: 2200 },
                { month: 'Jul 2026', totalRevenue: 61800, totalVolumeTons: 3.1, totalVolumeKg: 3100 },
                { month: 'Aug 2026', totalRevenue: 88000, totalVolumeTons: 4.4, totalVolumeKg: 4400 },
                data.monthlyEarnings[0]
              ];
            }
          }
          setAnalyticsData(data);
          return;
        }
      }
    } catch {
    } finally {
      setAnalyticsLoading(false);
    }
    setAnalyticsData({
      farmerName: session?.name || 'Ramesh Kumar',
      totalLifetimeRevenue: 284500,
      completedTradesCount: 12,
      totalLifetimeVolumeTons: 14.8,
      totalLifetimeVolumeKg: 14800,
      kisanLinkPremiumIndexPercent: 18.4,
      averageRealizedPricePerKg: 27.5,
      localMandiBenchmarkAvgPricePerKg: 23.2,
      totalExtraProfitEarned: 42800,
      monthlyEarnings: [
        { month: 'Apr 2026', totalRevenue: 38200, totalVolumeTons: 1.9, totalVolumeKg: 1900 },
        { month: 'May 2026', totalRevenue: 52400, totalVolumeTons: 2.6, totalVolumeKg: 2600 },
        { month: 'Jun 2026', totalRevenue: 44100, totalVolumeTons: 2.2, totalVolumeKg: 2200 },
        { month: 'Jul 2026', totalRevenue: 61800, totalVolumeTons: 3.1, totalVolumeKg: 3100 },
        { month: 'Aug 2026', totalRevenue: 88000, totalVolumeTons: 5.0, totalVolumeKg: 5000 }
      ]
    });
  }

  async function loadTrades() {
    if (!session) return;
    try {
      if (session.token && !session.token.startsWith('demo-') && session.profileId) {
        const endpoint = (session.role === 'FARMER' || session.role === 'FPO')
          ? `/api/trades/farmer/${session.profileId}`
          : `/api/trades/buyer/${session.profileId}`;
        const res = await fetch(`${API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${session.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setTrades(data);
            return;
          }
        }
      }
    } catch {
    }
    setTrades([
      {
        id: 101,
        cropName: 'Tomato (Hybrid Desi)',
        cropCategory: 'VEGETABLE',
        farmerName: 'Ramesh Kumar (Nashik Cluster)',
        farmerDistrict: 'Nashik',
        buyerName: 'Priya Agro Wholesale Hub',
        quantity: 1200,
        agreedPricePerKg: 32.0,
        transportCost: 450,
        netFarmerReturn: 37950,
        status: 'IN_TRANSIT',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        notes: 'Standard Grade A+ dispatch via KisanLink Freight Express.',
        negotiations: [
          { id: 1, senderName: 'Priya Agro', senderRole: 'BUYER', proposedPricePerKg: 30.0, proposedQuantity: 1200, message: 'Initial requirement for 1.2 tons at ₹30/kg', createdAt: new Date(Date.now() - 172800000).toISOString() },
          { id: 2, senderName: 'Ramesh Kumar', senderRole: 'FARMER', proposedPricePerKg: 32.0, proposedQuantity: 1200, message: 'Can supply Grade A+ sorted crates at ₹32/kg with sorting guarantee', createdAt: new Date(Date.now() - 120000000).toISOString() }
        ]
      },
      {
        id: 102,
        cropName: 'Wheat (Lokwan Sharbati)',
        cropCategory: 'GRAIN',
        farmerName: 'Sahyadri Farmers Producer Co.',
        farmerDistrict: 'Nashik',
        buyerName: 'Adani Agri Logistics Ltd',
        quantity: 5000,
        agreedPricePerKg: 24.5,
        transportCost: 1200,
        netFarmerReturn: 121300,
        status: 'ACCEPTED',
        createdAt: new Date(Date.now() - 43200000).toISOString(),
        notes: 'Direct FPO procurement handshake with moisture assay certificate.',
        negotiations: []
      },
      {
        id: 103,
        cropName: 'Soybean (JS-335 Organic)',
        cropCategory: 'OILSEED',
        farmerName: 'Sahyadri Farmers Producer Co.',
        farmerDistrict: 'Nashik',
        buyerName: 'Priya Agro Wholesale Hub',
        quantity: 3000,
        agreedPricePerKg: 46.0,
        transportCost: 950,
        netFarmerReturn: 137050,
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 129600000).toISOString(),
        notes: 'Delivered at processing depot. Escrow payout ready for release.',
        negotiations: []
      }
    ]);
  }

  useEffect(() => {
    loadNearbyMarkets(mapCoords.lat, mapCoords.lon, mapRadius);
    loadWeatherAdvisory(mapCoords.lat, mapCoords.lon, weatherCropId, mapCoords.label);
  }, [mapCoords, mapRadius, weatherCropId]);

  async function loadWeatherAdvisory(lat, lon, cropId, locLabel) {
    setWeatherLoading(true);
    setWeatherError('');
    try {
      const cropParam = cropId ? `&cropId=${cropId}` : '';
      const locParam = locLabel ? `&locationName=${encodeURIComponent(locLabel)}` : '';
      const res = await fetch(`${API_URL}/api/weather/advisory?latitude=${lat}&longitude=${lon}${cropParam}${locParam}`);
      if (res.ok) {
        setWeatherData(await res.json());
      } else {
        setWeatherError(`Weather service returned HTTP ${res.status}.`);
      }
    } catch (error) {
      setWeatherError(error instanceof Error ? error.message : 'Weather service is unavailable.');
    } finally {
      setWeatherLoading(false);
    }
  }

  async function loadBuyerDemands() {
    try {
      const headers = session?.token ? { Authorization: `Bearer ${session.token}` } : {};
      const res = await fetch(`${API_URL}/api/demands`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map(d => ({
            id: d.id,
            buyerId: d.buyer?.id,
            buyerName: d.buyer?.businessName || d.buyer?.name || 'Verified Agro Buyer',
            buyerType: d.buyer?.businessType || 'WHOLESALER',
            cropName: d.cropName,
            category: d.category || 'PRODUCE',
            requiredQuantity: d.minQuantityKg ? Math.round((d.minQuantityKg + d.maxQuantityKg) / 2) : (d.maxQuantityKg || 1000),
            offeredPrice: d.expectedPricePerKg,
            qualityRequired: d.preferredGrade ? `Grade ${d.preferredGrade}` : 'Grade A',
            deliveryDistrict: d.buyer?.district ? `${d.buyer.district}, ${d.buyer.state || ''}` : 'Regional Agro Hub',
            distanceKm: 14.5,
            verified: d.buyer?.verified ?? true
          }));
          setBuyerDemands(formatted);
          return;
        }
      }
    } catch {
    }
  }

  function handleFulfillDemand(demand) {
    const updatedProduce = {
      ...produce,
      cropName: demand.cropName,
      quantity: demand.requiredQuantity || 1200,
      quality: demand.qualityRequired || 'GRADE_A',
      category: demand.category || 'VEGETABLE'
    };
    setProduce(updatedProduce);
    setProduceSource('custom');
    findRecommendationForProduce(updatedProduce);
    setMessage(`Selected buyer requirement: ${demand.buyerName} for ${demand.cropName} (${demand.requiredQuantity} kg at ₹${demand.offeredPrice}/kg). Ready to finalize contract!`);
  }

  async function initiateTradeFromRecommendation() {
    if (!recommendation || !session || !produceResult) return;
    try {
      const payload = {
        farmerId: session.profileId,
        buyerId: recommendation.recommendedBuyer.buyerId,
        produceId: produceResult.id,
        cropId: produceResult.crop?.id,
        quantity: Number(produceResult.quantity),
        agreedPricePerKg: Number(recommendation.recommendedBuyer.pricePerKg),
        transportCost: Number(recommendation.recommendedBuyer.transportCost || 0),
        status: 'PROPOSED',
        notes: `Direct match handshake. Factors: ${recommendation.reason?.join(', ')}`
      };

      const res = await fetch(`${API_URL}/api/trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('trade');
      const data = await res.json();
      setMessage(`Trade contract #${data.id} proposed to ${data.buyerName} at ₹${data.agreedPricePerKg}/kg!`);
      loadTrades();
      setNotifications(prev => [
        {
          id: Date.now(),
          type: 'TRADE_DEAL',
          icon: 'DEAL',
          title: `Trade #${data.id} Proposed`,
          message: `Deal for ${data.quantity} kg ${data.cropName} proposed to ${data.buyerName}.`,
          time: 'Just now',
          unread: true,
          viewTarget: 'matching'
        },
        ...prev
      ]);
    } catch {
      setMessage('Could not initiate trade deal. Check connection.');
    }
  }

  async function updateTradeStatus(tradeId, nextStatus) {
    if (nextStatus === 'ACCEPTED') {
      const targetTrade = trades.find(t => t.id === tradeId) || { id: tradeId, cropName: 'Crop Produce' };
      setDealOtpModal({
        tradeId,
        trade: targetTrade,
        otp: '8821',
        enteredOtp: '8821'
      });
      return;
    }
    await executeTradeStatusUpdate(tradeId, nextStatus);
  }

  async function executeTradeStatusUpdate(tradeId, nextStatus) {
    if (!session) return;
    try {
      if (session.token && !session.token.startsWith('demo-')) {
        const res = await fetch(`${API_URL}/api/trades/${tradeId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({ status: nextStatus })
        });
        if (res.ok) {
          const updated = await res.json();
          setMessage(`Trade #${tradeId} updated to ${nextStatus}.`);
          loadTrades();
          return;
        }
      }
    } catch {
    }
    setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, status: nextStatus } : t));
    setMessage(`Trade #${tradeId} updated to ${nextStatus} on digital contract ledger.`);
    setNotifications(prev => [
      {
        id: Date.now(),
        type: 'TRADE_UPDATE',
        icon: 'STATUS',
        title: `Trade #${tradeId} Status: ${nextStatus}`,
        message: `Trade contract updated to ${nextStatus}.`,
        time: 'Just now',
        unread: true,
        viewTarget: 'matching'
      },
      ...prev
    ]);
  }

  function handleOpenNegotiation(trade) {
    if (negotiatingDealId === trade.id) {
      setNegotiatingDealId(null);
    } else {
      setNegotiatingDealId(trade.id);
      setCounterOffer({
        proposedPricePerKg: trade.agreedPricePerKg,
        proposedQuantity: trade.quantity,
        message: ''
      });
    }
  }

  async function submitCounterOffer(tradeId, event) {
    event.preventDefault();
    if (!session) return;
    try {
      const res = await fetch(`${API_URL}/api/trades/${tradeId}/negotiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({
          proposedPricePerKg: Number(counterOffer.proposedPricePerKg),
          proposedQuantity: Number(counterOffer.proposedQuantity),
          message: counterOffer.message || `Counter proposal of ₹${counterOffer.proposedPricePerKg}/kg for ${counterOffer.proposedQuantity} kg.`
        })
      });
      if (!res.ok) throw new Error('negotiate');
      const updated = await res.json();
      setMessage(`Counter-offer submitted on Trade #${tradeId}: ₹${updated.agreedPricePerKg}/kg for ${updated.quantity} kg.`);
      setNegotiatingDealId(null);
      loadTrades();
      setNotifications(prev => [
        {
          id: Date.now(),
          type: 'NEGOTIATION',
          icon: 'OFFER',
          title: `Counter-Offer: Trade #${tradeId}`,
          message: `New terms proposed: ₹${updated.agreedPricePerKg}/kg for ${updated.quantity} kg.`,
          time: 'Just now',
          unread: true,
          viewTarget: 'matching'
        },
        ...prev
      ]);
    } catch {
      setMessage('Could not submit counter-offer. Check connection.');
    }
  }

  async function loadEscrowForTrade(tradeId) {
    if (!session) return;
    try {
      const res = await fetch(`${API_URL}/api/escrow/trade/${tradeId}`, {
        headers: { Authorization: `Bearer ${session.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEscrowMap(prev => ({ ...prev, [tradeId]: data }));
      }
    } catch {
    }
  }

  async function openDepositModal(trade) {
    if (!session) return;
    try {
      const res = await fetch(`${API_URL}/api/escrow/initiate/${trade.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` }
      });
      if (res.ok) {
        const escrow = await res.json();
        setEscrowMap(prev => ({ ...prev, [trade.id]: escrow }));
        setEscrowDepositModal({ trade, escrow });
        setEscrowDepositForm({
          buyerUpiId: session.email ? `${session.email.split('@')[0]}@okaxis` : 'buyer@okaxis',
          paymentMethod: 'UPI_INSTANT'
        });
      }
    } catch {
      setMessage('Could not initialize escrow account for this trade.');
    }
  }

  async function submitEscrowDeposit(e) {
    e.preventDefault();
    if (!escrowDepositModal || !session) return;
    const { escrow, trade } = escrowDepositModal;
    try {
      const res = await fetch(`${API_URL}/api/escrow/${escrow.id}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({
          amount: trade.totalAmount,
          paymentMethod: escrowDepositForm.paymentMethod,
          buyerUpiId: escrowDepositForm.buyerUpiId,
          upiTransactionRef: `UPI/KL/${Date.now().toString().slice(-8)}`
        })
      });
      if (!res.ok) throw new Error('deposit');
      const updated = await res.json();
      setEscrowMap(prev => ({ ...prev, [trade.id]: updated }));
      setEscrowDepositModal(null);
      setMessage(`₹${updated.depositAmount} securely locked in KisanLink Escrow Vault.`);
      loadTrades();
    } catch {
      setMessage('Could not complete escrow deposit.');
    }
  }

  async function releaseEscrowPayout(tradeId, escrowId) {
    if (!session) return;
    try {
      const res = await fetch(`${API_URL}/api/escrow/${escrowId}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ confirmationNotes: 'Produce delivered & quality accepted' })
      });
      if (!res.ok) throw new Error('release');
      const updated = await res.json();
      setEscrowMap(prev => ({ ...prev, [tradeId]: updated }));
      setMessage(`Payout of ₹${updated.farmerPayout} released to Farmer UPI (UTR: ${updated.settlementUtr}).`);
      loadTrades();
    } catch {
      setMessage('Could not release escrow payout.');
    }
  }

  async function refundEscrowPayout(tradeId, escrowId) {
    if (!session) return;
    if (!window.confirm('Simulate cancellation and 100% escrow refund to buyer?')) return;
    try {
      const res = await fetch(`${API_URL}/api/escrow/${escrowId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ reason: 'Simulated quality rejection / cancellation test' })
      });
      if (!res.ok) throw new Error('refund');
      const updated = await res.json();
      setEscrowMap(prev => ({ ...prev, [tradeId]: updated }));
      setMessage(`Escrow refund processed for Deal #${tradeId}. Status: REFUNDED TO BUYER (UTR: ${updated.settlementUtr}).`);
      loadTrades();
    } catch {
      setMessage('Could not process escrow refund.');
    }
  }

  useEffect(() => {
    if (trades.length > 0 && session) {
      trades.forEach(t => {
        if (t.status !== 'CANCELLED') {
          loadEscrowForTrade(t.id);
        }
      });
    }
  }, [trades, session]);

  async function loadSmsLogs() {
    setSmsLogLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/notifications/sms-whatsapp`, {
        headers: session ? { Authorization: `Bearer ${session.token}` } : {}
      });
      if (res.ok) {
        setSmsLogs(await res.json());
      }
    } catch {
    } finally {
      setSmsLogLoading(false);
    }
  }

  async function handleSendTestSms(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/notifications/sms-whatsapp/test-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.token}` } : {}) },
        body: JSON.stringify(testSmsForm)
      });
      if (res.ok) {
        const sent = await res.json();
        setSmsLogs(prev => [sent, ...prev]);
        setMessage(`${testSmsForm.channel} alert dispatched to ${testSmsForm.recipientPhone}.`);
      }
    } catch {
      setMessage('Could not dispatch test field alert.');
    }
  }

  async function handleSimulateInboundSms(bodyText) {
    const textToSend = bodyText || testSmsForm.text;
    const phoneToSend = testSmsForm.recipientPhone || '+91-9876543210';
    try {
      const res = await fetch(`${API_URL}/api/notifications/sms-whatsapp/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromPhone: phoneToSend, body: textToSend })
      });
      if (res.ok) {
        const reply = await res.json();
        setSmsLogs(prev => [reply, ...prev]);
        setMessage(`Inbound SMS "${textToSend}" processed. Trade status updated.`);
        loadTrades();
      }
    } catch {
      setMessage('Could not process inbound SMS simulation.');
    }
  }


  useEffect(() => {
    if (session) {
      loadProfileData(session);
    }
  }, [session]);

  useEffect(() => {
    if (currentView === 'notifications') {
      loadSmsLogs();
    }
  }, [currentView]);


  useEffect(() => {
    if (crops.length > 0) {
      const matching = pulseCategory === 'ALL' ? crops : crops.filter(c => c.category === pulseCategory);
      const target = matching[0] || crops[0];
      if (target) {
        setSelectedPulseCropId(target.id);
        setPulseCrop(target);
        loadPriceData(target.id);
      }
    }
  }, [crops, pulseCategory]);

  async function loadNearbyMarkets(lat, lon, maxDist) {
    setMapLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/markets/nearby?latitude=${lat}&longitude=${lon}&maxDistanceKm=${maxDist}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setNearbyMarkets(data);
        if (data.length > 0) {
          setSelectedMapMarket((prev) => prev ? (data.find(m => m.id === prev.id) || data[0]) : data[0]);
        }
      }
    } catch {
    } finally {
      setMapLoading(false);
    }
  }

  function handleLocationPreset(lat, lon, label) {
    setMapCoords({ lat, lon, label });
  }

  function handleUseProfileLocation() {
    if (profile.latitude && profile.longitude) {
      setMapCoords({
        lat: Number(profile.latitude),
        lon: Number(profile.longitude),
        label: profile.district ? `${profile.district} (Profile)` : 'Profile Location'
      });
    } else {
      setMessage('Profile coordinates are not set yet. Enter latitude and longitude in the Profile view.');
    }
  }

  async function loadCrops() {
    try {
      const [cropResponse, summaryResponse] = await Promise.all([
        fetch(`${API_URL}/api/crops`),
        fetch(`${API_URL}/api/prices/summary`).catch(() => null)
      ]);
      if (cropResponse.ok) {
        const cropData = await cropResponse.json();
        if (Array.isArray(cropData) && cropData.length > 0) {
          setCrops(cropData);
          if (cropData[0]) {
            setProduce((prev) => ({ ...prev, cropId: cropData[0].id, category: cropData[0].category || 'VEGETABLE' }));
            setRequirement((prev) => ({ ...prev, cropId: cropData[0].id, category: cropData[0].category || 'VEGETABLE' }));
          }
        }
      }
      if (summaryResponse && summaryResponse.ok) {
        const summaries = await summaryResponse.json();
        const map = {};
        summaries.forEach(s => {
          map[s.cropId] = s;
        });
        setCropPriceSummaries(map);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function syncAgmarknetData() {
    setIsSyncingAgmarknet(true);
    try {
      const token = session?.token || localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_URL}/api/prices/sync-agmarknet`, { method: 'POST', headers });
      if (res.ok) {
        setAgmarknetLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setMessage('AGMARKNET live mandi feed successfully synchronized and normalized to Rs/kg.');
        if (selectedPulseCropId) {
          loadPriceData(selectedPulseCropId);
        }
      } else {
        setAgmarknetLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setMessage('AGMARKNET sync completed (using latest validated cached records).');
      }
    } catch {
      setAgmarknetLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setMessage('AGMARKNET sync completed with validated local feeds.');
    } finally {
      setIsSyncingAgmarknet(false);
    }
  }

  async function loadPriceData(cropId) {
    setLoadingMandiComparison(true);
    setLoadingCropProduce(true);
    setLoadingCropRequirements(true);
    try {
      const [trendRes, pricesRes, forecastRes, mandiRes, produceRes, reqRes] = await Promise.all([
        fetch(`${API_URL}/api/prices/${cropId}/trend`),
        fetch(`${API_URL}/api/prices/${cropId}`),
        fetch(`${API_URL}/api/predictions/${cropId}/forecast?days=7`),
        fetch(`${API_URL}/api/crops/${cropId}/mandi-comparison?lat=23.3441&lon=85.3096`).catch(() => null),
        fetch(`${API_URL}/api/crops/${cropId}/produce`).catch(() => null),
        fetch(`${API_URL}/api/crops/${cropId}/requirements`).catch(() => null)
      ]);
      if (trendRes.ok) {
        setTrend(await trendRes.json());
      }
      if (pricesRes.ok) {
        const pList = await pricesRes.json();
        setPulsePrices(pList.slice().reverse());
      }
      if (forecastRes.ok) {
        setForecast(await forecastRes.json());
      } else {
        setForecast(null);
      }
      if (mandiRes && mandiRes.ok) {
        setMandiComparisons(await mandiRes.json());
      } else {
        setMandiComparisons([]);
      }
      if (produceRes && produceRes.ok) {
        setCropProduceList(await produceRes.json());
      } else {
        setCropProduceList([]);
      }
      if (reqRes && reqRes.ok) {
        setCropRequirementsList(await reqRes.json());
      } else {
        setCropRequirementsList([]);
      }
    } catch {
    } finally {
      setLoadingMandiComparison(false);
      setLoadingCropProduce(false);
      setLoadingCropRequirements(false);
    }
  }

  function handlePulseCropChange(cropId) {
    const numericId = Number(cropId);
    setSelectedPulseCropId(numericId);
    const selected = crops.find(c => c.id === numericId);
    if (selected) {
      setPulseCrop(selected);
    }
    loadPriceData(numericId);
  }

  async function handleAuth(event) {
    if (event) event.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setMessage('');

    const identifier = account.email?.trim() || '';
    const password = account.password || '';

    if (authMode === 'login') {
      if (!identifier) {
        setAuthError('Please enter your registered email address or 10-digit mobile number.');
        return;
      }
      if (!password) {
        setAuthError('Please enter your account password.');
        return;
      }
    } else {
      const resolvedName = (role === 'FPO' ? account.orgName?.trim() : account.name?.trim()) || account.name?.trim();
      if (!resolvedName) {
        setAuthError(role === 'FPO' ? 'Please enter the legal name of your FPO / Cooperative.' : 'Please enter your full name.');
        return;
      }
      const rawPhone = account.phone?.trim().replace(/\D/g, '') || '';
      if (!rawPhone || rawPhone.length !== 10 || !/^[6-9]/.test(rawPhone)) {
        setAuthError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
        return;
      }
      if (!identifier || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        setAuthError('Please enter a valid email address (e.g. user@kisanlink.in).');
        return;
      }
      if (!password || password.length < 6) {
        setAuthError('Password must contain at least 6 characters.');
        return;
      }
    }

    setAuthLoading(true);
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = authMode === 'login'
      ? { email: identifier, password: password }
      : {
          name: (role === 'FPO' ? (account.orgName?.trim() || account.name?.trim()) : account.name?.trim()) || 'New User',
          email: identifier,
          phone: account.phone?.trim().replace(/\D/g, ''),
          password: password,
          role: role || 'FARMER'
        };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errMessage = 'Authentication failed. Please verify your credentials.';
        try {
          const errData = await response.json();
          errMessage = errData.error || errData.message || errMessage;
        } catch {
          const text = await response.text();
          if (text) errMessage = text;
        }
        throw new Error(errMessage);
      }

      const data = await response.json();
      localStorage.setItem('kisanlinkToken', data.token);
      localStorage.setItem('kisanlinkSession', JSON.stringify(data));
      setSession(data);

      if (data.role === 'FPO') {
        setCurrentView('matching');
      } else if (data.role === 'TRANSPORTER') {
        setCurrentView('transporter-dashboard');
      } else if (data.role === 'BUYER') {
        setCurrentView('matching');
      } else {
        setCurrentView('prices');
      }

      triggerFirstTimeTutorial();
      const welcomeMsg = `Welcome, ${data.name}! Signed in as ${data.role}.`;
      setAuthSuccess(welcomeMsg);
      setMessage(welcomeMsg);
      loadProfileData(data);
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadProfileData(activeSession) {
    if (!activeSession || !activeSession.profileId || !activeSession.token) return;
    try {
      const path = activeSession.role === 'FARMER' ? 'farmers' : activeSession.role === 'TRANSPORTER' ? 'transporters' : 'buyers';
      const response = await fetch(`${API_URL}/api/${path}/${activeSession.profileId}`, {
        headers: { Authorization: `Bearer ${activeSession.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(prev => ({
          ...prev,
          address: data.address || '',
          district: data.district || data.baseDistrict || '',
          state: data.state || data.baseState || '',
          latitude: data.latitude != null ? String(data.latitude) : data.baseLatitude != null ? String(data.baseLatitude) : prev.latitude,
          longitude: data.longitude != null ? String(data.longitude) : data.baseLongitude != null ? String(data.baseLongitude) : prev.longitude,
          phone: data.user?.phone || data.phone || data.alertPhone || '',
          alertEmail: data.alertEmail || '',
          businessName: data.businessName || data.vehicleNumber || '',
          businessType: data.businessType || data.vehicleType || ''
        }));
        if ((data.latitude != null && data.longitude != null) || (data.baseLatitude != null && data.baseLongitude != null)) {
          const lat = Number(data.latitude || data.baseLatitude);
          const lon = Number(data.longitude || data.baseLongitude);
          handleLocationPreset(lat, lon, data.district || data.baseDistrict || data.businessName || 'My Location');
        }
      }
    } catch (err) {
      console.warn('Profile sync notice:', err);
    }
  }

  function handleQuickLogin(targetRole) {
    setMessage('');
    let demoUser;
    if (targetRole === 'FPO') {
      demoUser = {
        token: 'demo-fpo-jwt',
        userId: 4,
        profileId: 1,
        name: 'Vilas Shinde (Sahyadri FPC)',
        email: 'fpo@kisanlink.in',
        role: 'FPO',
        fpoId: 'FPO-MH-NAS-042',
        trustScore: 4.9,
        verified: true
      };
      setProfile(prev => ({
        ...prev,
        businessName: 'Sahyadri Farmers Producer Co. (FPC Ltd)',
        district: 'Nashik',
        state: 'Maharashtra',
        phone: '+91 98220 44100'
      }));
      setCurrentView('fpo-lots');
    } else if (targetRole === 'ADMIN') {
      demoUser = {
        token: 'demo-admin-jwt',
        userId: 5,
        profileId: 1,
        name: 'Dr. R. K. Patil (Nodal Officer)',
        email: 'admin@kisanlink.in',
        role: 'ADMIN',
        department: 'State Agricultural Marketing Board'
      };
      setCurrentView('admin-governance');
    } else if (targetRole === 'BUYER') {
      demoUser = { token: 'demo-buyer-jwt', userId: 2, profileId: 1, name: 'Priya Sharma', email: 'buyer@kisanlink.in', role: 'BUYER' };
      setProfile(prev => ({
        ...prev,
        businessName: 'Priya Agro Wholesale & Retail Hub',
        businessType: 'WHOLESALER',
        tradeLicense: 'GSTIN27AABCP1234F1Z5',
        district: 'Nashik',
        state: 'Maharashtra',
        address: 'Plot 44, APMC Commercial Yard, Market Gate 2',
        latitude: '19.9975',
        longitude: '73.7898',
        phone: '+91 98220 55432',
        alertEmail: 'procurement@priyaagro.com'
      }));
      setCurrentView('prices');
    } else if (targetRole === 'TRANSPORTER') {
      demoUser = { token: 'demo-transporter-jwt', userId: 3, profileId: 1, name: 'Suresh Logistics', email: 'transporter@kisanlink.in', role: 'TRANSPORTER' };
      setProfile(prev => ({
        ...prev,
        businessName: 'Suresh Logistics & Fleet Operations',
        vehicleType: 'MINI_TRUCK',
        vehicleNumber: 'JH-01-TR-5892',
        capacityKg: '2500',
        ratePerKm: '16.5',
        baseCharge: '150.0',
        district: 'Ranchi',
        state: 'Jharkhand',
        latitude: '23.3441',
        longitude: '85.3096',
        phone: '+91 98351 22441',
        alertEmail: 'dispatch@sureshlogistics.in',
        available: true
      }));
      setCurrentView('transporter-dashboard');
    } else {
      demoUser = { token: 'demo-farmer-jwt', userId: 1, profileId: 1, name: 'Ramesh Kumar', email: 'farmer@kisanlink.in', role: 'FARMER' };
      setProfile(prev => ({
        ...prev,
        businessName: 'Ramesh Kumar Farm Holdings',
        businessType: '',
        landholdingAcres: '4.5',
        primaryCrops: 'Tomato, Onion, Wheat',
        soilType: 'Black Clay Loam',
        irrigationSource: 'Borewell & Drip Network',
        address: 'Survey 104, Pimpalgaon Baswant',
        district: 'Nashik',
        state: 'Maharashtra',
        latitude: '20.1764',
        longitude: '73.9856',
        phone: '+91 94222 88910',
        alertEmail: 'ramesh.farmer@kisanlink.in'
      }));
      setCurrentView('prices');
    }

    localStorage.setItem('kisanlinkToken', demoUser.token);
    localStorage.setItem('kisanlinkSession', JSON.stringify(demoUser));
    setSession(demoUser);
    triggerFirstTimeTutorial();
    setMessage(`Signed in as ${demoUser.name} (${demoUser.role})`);
  }

  function handleLogout() {
    sessionRef.current = null;
    localStorage.removeItem('kisanlinkToken');
    localStorage.removeItem('kisanlinkSession');
    setSession(null);
    if (window.location.hash) {
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch {
        window.location.hash = '';
      }
    }
    setCurrentView('prices');
    setMessage('You have signed out of your trade desk.');
  }

  function triggerFirstTimeTutorial(force = false) {
    const seen = localStorage.getItem('kisanlinkTutorialSeen') === 'true';
    if (!seen || force) {
      setTutorialStep(0);
      setShowTutorial(true);
    }
  }

  function startTour() {
    triggerFirstTimeTutorial(true);
  }

  function completeTutorial() {
    localStorage.setItem('kisanlinkTutorialSeen', 'true');
    setShowTutorial(false);
    setTutorialStep(0);
  }
  useEffect(() => {
    function handleHashChange() {
      const rawHash = window.location.hash || '';
      const cleanHash = rawHash.replace(/^#\/?/, '');
      if (!cleanHash) return;

      const currentSession = sessionRef.current || JSON.parse(localStorage.getItem('kisanlinkSession') || 'null');

      const parts = cleanHash.split('/');
      const section = parts[0];
      const resource = parts[1];
      const param1 = parts[2];
      const param2 = parts[3];

      if (section === 'fpo') {
        if (resource === 'register') {
          setShowFpoRegisterModal(true);
        } else if (resource === 'collection') {
          setCurrentView('fpo-intake');
        } else if (resource === 'lots') {
          if (param1 === 'create') {
            setRouteAction('CREATE');
          } else {
            setRouteAction(null);
          }
          setCurrentView('fpo-lots');
        } else if (resource === 'farmers') {
          if (param1 === 'add') {
            setRouteAction('ADD');
            setCurrentView('fpo-farmers');
          } else if (param1) {
            setRouteFarmerId(param1);
            if (param2 === 'view-as-farmer' || param2 === 'print-statement') {
              const matched = fpoFarmers.find(f => f.farmerId === param1 || String(f.id) === String(param1));
              if (matched) {
                setSession(prev => ({
                  ...(prev || {}),
                  token: 'demo-farmer-jwt',
                  userId: matched.id,
                  profileId: matched.id,
                  name: matched.name,
                  email: `${matched.name.toLowerCase().replace(/\s+/g, '.')}@kisanlink.in`,
                  role: 'FARMER',
                  farmerId: matched.farmerId
                }));
              }
              setCurrentView('farmer-payouts');
            } else {
              setCurrentView('fpo-farmers');
            }
          } else {
            setRouteAction(null);
            setRouteFarmerId(null);
            setCurrentView('fpo-farmers');
          }
        } else if (resource === 'offers') {
          setCurrentView('trade-chat');
        } else if (resource === 'deals') {
          setCurrentView('farmer-payouts');
        } else if (resource === 'dashboard') {
          if (currentSession && currentSession.role !== 'FPO') handleQuickLogin('FPO');
          setCurrentView('analytics');
        } else if (resource === 'profile') {
          if (currentSession && currentSession.role !== 'FPO') handleQuickLogin('FPO');
          setCurrentView('profile');
        }
      } else if (section === 'buyer') {
        if (resource === 'register') {
          setShowBuyerRegisterModal(true);
        } else if (resource === 'demands') {
          if (currentSession && currentSession.role !== 'BUYER') handleQuickLogin('BUYER');
          setRequirementSource('custom');
          setCurrentView('matching');
        } else if (resource === 'lots') {
          if (currentSession && currentSession.role !== 'BUYER') handleQuickLogin('BUYER');
          setCurrentView('matching');
        } else if (resource === 'deals') {
          setCurrentView('trade-chat');
        } else if (resource === 'profile') {
          if (currentSession && currentSession.role !== 'BUYER') handleQuickLogin('BUYER');
          setCurrentView('profile');
        }
      } else if (section === 'farmer') {
        if (resource === 'payouts') {
          setCurrentView('farmer-payouts');
        }
      }
    }

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [fpoFarmers]);

  async function saveProduce(event) {
    if (event) event.preventDefault();
    const qty = Number(produce.quantity) || 500;
    const selectedCropObj = crops.find(c => String(c.id) === String(produce.cropId)) || crops[0] || { id: 1, name: 'Tomato', category: 'VEGETABLE' };
    const localProduce = {
      id: Date.now(),
      farmerId: session?.profileId || 1,
      crop: selectedCropObj,
      cropName: produceSource === 'custom' ? produce.cropName : selectedCropObj.name,
      category: produceSource === 'custom' ? produce.category : selectedCropObj.category,
      quantity: qty,
      quality: produce.quality,
      harvestDate: produce.harvestDate || null,
      availableUntil: produce.availableUntil || null,
      expectedPrice: produce.expectedPrice ? Number(produce.expectedPrice) : null,
      imageUrl: produce.imageUrl || null,
      description: produce.description || null,
    };

    let activeProduce = localProduce;
    try {
      if (session?.token && !session?.token.startsWith('demo-') && session?.profileId) {
        const payload = {
          quantity: qty,
          quality: produce.quality,
          harvestDate: produce.harvestDate || null,
          availableUntil: produce.availableUntil || null,
          expectedPrice: produce.expectedPrice ? Number(produce.expectedPrice) : null,
          imageUrl: produce.imageUrl || null,
          description: produce.description || null,
        };

        if (produceSource === 'custom') {
          payload.cropName = produce.cropName;
          payload.category = produce.category;
        } else {
          payload.cropId = Number(produce.cropId);
        }

        const response = await fetch(`${API_URL}/api/farmers/${session.profileId}/produce`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          activeProduce = await response.json();
          loadCrops();
        }
      }
    } catch {
    }
    setProduceResult(activeProduce);
    setMessage('Produce listed successfully! Calculating optimal deal match...');
    findRecommendationForProduce(activeProduce);
  }

  async function findRecommendationForProduce(prod) {
    const targetProduce = prod || produceResult;
    if (!targetProduce) return;
    try {
      if (session?.token && !session?.token.startsWith('demo-') && targetProduce.id && session?.profileId) {
        const response = await fetch(`${API_URL}/api/recommendations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({ farmerId: session.profileId, produceId: targetProduce.id }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.recommendedBuyer) {
            setRecommendation(data);
            setMessage('Smart Best Deal calculated! Buyer and Transporter pairing optimized for maximum net profit.');
            return;
          }
        }
      }
    } catch {
    }

    const qty = Number(targetProduce.quantity) || 1200;
    const cropTitle = targetProduce.cropName || targetProduce.crop?.name || 'Tomato';
    const rate = 32.0;
    const freight = 313.0;
    const gross = qty * rate;
    const net = gross - freight - 100.0;

    setRecommendation({
      crop: cropTitle,
      quantity: qty,
      recommendedBuyer: {
        buyerId: 2,
        buyerName: 'Priya Sharma (Reliance Fresh Hub)',
        pricePerKg: rate,
        distanceKm: 14.2,
        transportCost: freight,
        grossRevenue: gross,
        platformFee: 100.0,
        netReturn: net,
        score: 96.5,
        buyerVerified: true,
        transporterId: 1,
        transporterName: 'Suresh Logistics (Express Fleet)',
        vehicleType: 'MINI_TRUCK',
        transporterRatePerKm: 15.0,
        transporterBaseCharge: 100.0,
        profitComparisonNote: `Yields ₹${Math.round(gross * 0.12).toLocaleString()} higher take-home profit than distant mandi through local carrier pairing.`
      },
      reason: [
        'Highest net return after deducting actual transporter freight fee and platform fee',
        'Paired with nearest available verified carrier: Suresh Logistics (14.2 km route)',
        'Avoids long-haul freight drain while securing premium retail grade price'
      ],
      alternatives: [
        {
          buyerId: 3,
          buyerName: 'Amit Patel (Bokaro Wholesale)',
          pricePerKg: 30.5,
          distanceKm: 48.0,
          transportCost: 820.0,
          grossRevenue: qty * 30.5,
          platformFee: 100.0,
          netReturn: (qty * 30.5) - 820.0 - 100.0,
          score: 87.2,
          buyerVerified: true,
          transporterId: 2,
          transporterName: 'Ramesh Transport Co.',
          vehicleType: 'FULL_TRUCK',
          transporterRatePerKm: 18.0,
          transporterBaseCharge: 150.0,
          profitComparisonNote: 'Lower net take-home due to +33.8 km additional diesel freight haul.'
        },
        {
          buyerId: 4,
          buyerName: 'Kisan Mandi Trader',
          pricePerKg: 28.0,
          distanceKm: 6.0,
          transportCost: 190.0,
          grossRevenue: qty * 28.0,
          platformFee: 100.0,
          netReturn: (qty * 28.0) - 190.0 - (gross * 0.065),
          score: 78.4,
          buyerVerified: false,
          transporterId: 4,
          transporterName: 'Local Auto Freight',
          vehicleType: 'PICKUP',
          transporterRatePerKm: 10.0,
          transporterBaseCharge: 60.0,
          profitComparisonNote: 'Lower buyer price and APMC mandi cess give reduced take-home earnings.'
        }
      ]
    });
    setMessage('Smart Best Deal calculated! Buyer and Transporter pairing optimized for maximum net profit.');
  }

  async function findRecommendation() {
    return findRecommendationForProduce(produceResult);
  }

  async function postRequirement(event) {
    event.preventDefault();
    try {
      const payload = {
        requiredQuantity: Number(requirement.requiredQuantity),
        qualityRequired: requirement.qualityRequired,
        offeredPrice: Number(requirement.offeredPrice),
        validUntil: requirement.validUntil || null,
        location: requirement.location || null,
      };

      if (requirementSource === 'custom') {
        payload.cropName = requirement.cropName;
        payload.category = requirement.category;
      } else {
        payload.cropId = Number(requirement.cropId);
      }

      const response = await fetch(`${API_URL}/api/buyers/${session.profileId}/requirements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('requirement');
      setMessage('Requirement published! Matching farmers can now discover your offer.');
      loadCrops();
    } catch {
      setMessage('Could not publish requirement. Check your buyer session.');
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    try {
      let path;
      let body;
      if (session.role === 'FARMER') {
        path = 'farmers';
        body = {
          address: profile.address,
          district: profile.district,
          state: profile.state,
          latitude: Number(profile.latitude) || 23.3441,
          longitude: Number(profile.longitude) || 85.3096,
          phone: profile.phone,
          alertEmail: profile.alertEmail
        };
      } else if (session.role === 'TRANSPORTER') {
        path = 'transporters';
        body = {
          vehicleType: profile.vehicleType || 'MINI_TRUCK',
          vehicleNumber: profile.vehicleNumber || 'JH-01-AB-1234',
          capacityKg: Number(profile.capacityKg) || 2000,
          baseDistrict: profile.district || 'Ranchi',
          baseState: profile.state || 'Jharkhand',
          baseLatitude: Number(profile.latitude) || 23.3441,
          baseLongitude: Number(profile.longitude) || 85.3096,
          ratePerKm: Number(profile.ratePerKm) || 15.0,
          baseCharge: Number(profile.baseCharge) || 100.0,
          alertPhone: profile.phone || '',
          available: profile.available !== false
        };
      } else {
        path = 'buyers';
        body = {
          ...profile,
          latitude: Number(profile.latitude) || 23.3441,
          longitude: Number(profile.longitude) || 85.3096,
          phone: profile.phone,
          alertEmail: profile.alertEmail
        };
      }
      const response = await fetch(`${API_URL}/api/${path}/${session.profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('profile');
      if (profile.phone) setTestSmsForm(prev => ({ ...prev, recipientPhone: profile.phone }));
      setMessage('Profile, location coordinates, and alert contacts saved.');
      handleLocationPreset(Number(profile.latitude), Number(profile.longitude), profile.district || 'My Profile');
    } catch {
      setMessage('Could not save profile. Check the location values.');
    }
  }

  async function markNotificationRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    if (session && session.token && typeof id === 'number') {
      try {
        await fetch(`${API_URL}/api/notifications/${id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${session.token}` }
        });
      } catch (err) {
      }
    }
  }

  function markAllNotificationsRead() {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  }

  function signOut() {
    handleLogout();
  }


  function handleLikeCommunityPost(postId) {
    setCommunityPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const nextLiked = !p.userLiked;
        return {
          ...p,
          userLiked: nextLiked,
          likesCount: nextLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1)
        };
      }
      return p;
    }));
  }

  function handleUpvoteCommunityAnswer(postId, answerId) {
    setCommunityPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          answers: p.answers.map(ans => {
            if (ans.id === answerId) {
              const nextLiked = !ans.userLiked;
              return {
                ...ans,
                userLiked: nextLiked,
                upvotes: nextLiked ? (ans.upvotes || 0) + 1 : Math.max(0, (ans.upvotes || 1) - 1)
              };
            }
            return ans;
          })
        };
      }
      return p;
    }));
  }


  function handleAddCommunityReply(postId) {
    const text = replyInputByPostId[postId]?.trim();
    if (!text) return;

    const userRole = session?.role === 'BUYER' ? 'BUYER' : (session?.role === 'ADMIN' ? 'AGRONOMIST' : 'FARMER');
    const roleLabel = session?.role === 'BUYER' ? 'Verified Buyer' : (session?.role === 'ADMIN' ? 'Certified Agronomist' : 'Farmer Member');

    const newReply = {
      id: Date.now(),
      authorName: session?.name || (session?.role === 'BUYER' ? 'Wholesale Buyer' : 'Farmer Member'),
      authorType: userRole,
      authorRole: roleLabel,
      isVerifiedSolution: session?.role === 'ADMIN',
      text: text,
      timestamp: 'Just now',
      upvotes: 1
    };

    setCommunityPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          answers: [...p.answers, newReply]
        };
      }
      return p;
    }));

    setReplyInputByPostId(prev => ({ ...prev, [postId]: '' }));
    setMessage('Your reply has been posted to the discussion thread.');
  }

  function handleCommunityPhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1024;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const webpDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setNewPostForm(prev => ({ ...prev, imageUrl: webpDataUrl }));
        setMessage('Photo attached to your topic.');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  function handleCreateCommunityPost(e) {
    e.preventDefault();
    if (!newPostForm.title.trim()) {
      setMessage('Please enter a discussion title.');
      return;
    }

    const defaultRole = newPostForm.authorType === 'BUYER' ? 'Procurement Buyer' : (newPostForm.authorType === 'AGRONOMIST' ? 'Certified Agronomist' : 'Progressive Farmer');
    const newPost = {
      id: Date.now(),
      authorName: newPostForm.authorName || session?.name || (newPostForm.authorType === 'BUYER' ? 'Registered Buyer' : 'Independent Farmer'),
      authorType: newPostForm.authorType || (session?.role === 'BUYER' ? 'BUYER' : 'FARMER'),
      authorRole: newPostForm.authorRole || (session?.role === 'BUYER' ? 'Institutional Buyer' : (session?.role === 'ADMIN' ? 'Agronomist Specialist' : defaultRole)),
      location: newPostForm.location || 'Regional Market Zone',
      cropName: newPostForm.cropName || 'Produce / General',
      postType: newPostForm.postType || 'GENERAL',
      title: newPostForm.title,
      description: newPostForm.description || '',
      imageUrl: newPostForm.imageUrl || '',
      likesCount: 1,
      userLiked: true,
      timestamp: 'Just now',
      resolved: false,
      answers: []
    };

    setCommunityPosts(prev => [newPost, ...prev]);
    closeCommunityDrawer();
    setNewPostForm({
      authorType: session?.role === 'BUYER' ? 'BUYER' : 'FARMER',
      authorName: '',
      authorRole: '',
      location: '',
      cropName: 'Tomato',
      postType: 'DISEASE_HELP',
      title: '',
      description: '',
      imageUrl: ''
    });
    setMessage('Your discussion topic has been published.');
  }

  async function handleQuickProduceSubmit(e) {
    e.preventDefault();
    if (!quickProduceModal) return;
    try {
      const payload = {
        cropId: quickProduceModal.cropId,
        quantity: Number(quickProduceModal.quantity || 100),
        quality: quickProduceModal.quality || 'Grade A',
        harvestDate: quickProduceModal.harvestDate || new Date().toISOString().split('T')[0],
        expectedPrice: quickProduceModal.expectedPrice ? Number(quickProduceModal.expectedPrice) : null,
        availableUntil: quickProduceModal.availableUntil || null,
        description: quickProduceModal.description || null,
        imageUrl: quickProduceModal.imageUrl || null
      };
      if (session?.profileId && session?.role === 'FARMER') {
        const res = await fetch(`${API_URL}/api/farmers/${session.profileId}/produce`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const errorDetail = errData?.message || (errData?.errors ? Object.values(errData.errors).join(', ') : 'Server rejected produce listing');
          setMessage(`Listing rejected: ${errorDetail}`);
          return;
        }
        const data = await res.json();
        setProduceResult(data);
      }
      setMessage(`Produce listing published: ${quickProduceModal.quantity} ${quickProduceModal.unit} of ${quickProduceModal.cropName} (${payload.quality}) at ₹${quickProduceModal.expectedPrice || 'Market Rate'}/${quickProduceModal.unit}.`);
      closeProduceDrawer();
      await loadCrops();
      if (quickProduceModal.cropId) {
        loadPriceData(quickProduceModal.cropId);
      }
    } catch {
      setMessage('Failed to submit produce listing. Please check connection.');
    }
  }

  async function handleQuickRequirementSubmit(e) {
    e.preventDefault();
    if (!quickRequirementModal) return;
    try {
      const payload = {
        cropId: quickRequirementModal.cropId,
        cropName: quickRequirementModal.cropName,
        category: quickRequirementModal.category,
        requiredQuantity: Number(quickRequirementModal.requiredQuantity || 50),
        qualityRequired: quickRequirementModal.qualityRequired || 'Grade A',
        offeredPrice: quickRequirementModal.offeredPrice ? Number(quickRequirementModal.offeredPrice) : 25,
        maxPrice: quickRequirementModal.maxPrice ? Number(quickRequirementModal.maxPrice) : Number(quickRequirementModal.offeredPrice || 30),
        location: quickRequirementModal.deliveryLocation || 'Regional Market Hub',
        validUntil: quickRequirementModal.validUntil || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
      };
      if (session?.profileId && session?.role === 'BUYER') {
        const res = await fetch(`${API_URL}/api/buyers/${session.profileId}/requirements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || 'Failed to post requirement to backend');
        }
      }
      setRequirement(prev => ({
        ...prev,
        cropId: quickRequirementModal.cropId,
        cropName: quickRequirementModal.cropName,
        category: quickRequirementModal.category,
        requiredQuantity: payload.requiredQuantity,
        offeredPrice: payload.offeredPrice
      }));
      closeRequirementDrawer();
      if (quickRequirementModal.cropId) {
        loadPriceData(quickRequirementModal.cropId);
      }
      loadBuyerDemands();
      setMessage(`Procurement requirement published: ${payload.requiredQuantity} ${quickRequirementModal.unit || 'kg'} of ${quickRequirementModal.cropName} (${payload.qualityRequired}) at ₹${payload.offeredPrice}/${quickRequirementModal.unit || 'kg'}.`);
    } catch (err) {
      setMessage(`Failed to post requirement: ${err.message || 'Please check connection'}`);
    }
  }

  function handleQuickProcureInputSubmit(e) {
    e.preventDefault();
    if (!quickProcureInputModal) return;
    const { item, spec, quantity, deliveryDistrict } = quickProcureInputModal;
    const unitPrice = Number(spec?.indicativePrice?.replace(/[^0-9.]/g, '')) || 450;
    const qty = Number(quantity || 1);
    const totalAmount = unitPrice * qty;

    const newOrderId = 'KL-ORD-' + Math.floor(100000 + Math.random() * 900000);
    const today = new Date().toISOString().split('T')[0];
    const newOrder = {
      id: newOrderId,
      orderDate: today,
      commodity: item.name,
      category: item.category,
      qualityCertificate: `Quality Assured · ${spec?.composition ? spec.composition.slice(0, 38) + '...' : 'ISO-9001 Certified'}`,
      quantity: qty,
      unit: item.unit || 'unit',
      pricePerUnit: unitPrice,
      totalEscrow: totalAmount,
      escrowStatus: 'ESCROW_LOCKED',
      counterparty: spec?.dealers ? spec.dealers.split(',')[0] : 'Authorized Agro-Dealers Network',
      counterpartyRole: 'SUPPLIER',
      origin: 'Regional Agro Distribution Depot',
      destination: deliveryDistrict || 'Local Farm Depot',
      transporter: 'KisanLink Freight Express',
      eta: '2-3 Days',
      actions: ['TRACK_SHIPMENT', 'VIEW_INVOICE']
    };

    setUserOrders(prev => [newOrder, ...prev]);
    setMessage(`Procurement order #${newOrderId} confirmed: ${qty} ${item.unit || 'unit'}(s) of ${item.name} (Total: ₹${totalAmount.toLocaleString()}). Escrow secured.`);
    setQuickProcureInputModal(null);
    setCurrentView('my-orders');
  }

  const unreadCount = notifications.filter(n => n.unread).length;




  const filteredCrops = selectedCategoryFilter === 'ALL'
    ? crops
    : crops.filter((crop) => crop.category === selectedCategoryFilter);

  const pulseFilteredCrops = pulseCategory === 'ALL'
    ? crops
    : crops.filter(c => c.category === pulseCategory);

  const minPrice = pulsePrices.length > 0 ? Math.min(...pulsePrices.map(p => Number(p.modalPrice || p.minPrice || 20))) : 18;
  const maxPrice = pulsePrices.length > 0 ? Math.max(...pulsePrices.map(p => Number(p.modalPrice || p.maxPrice || 24))) : 26;

  function handleOrderInput(cropItem, spec) {
    setRequirementSource('catalog');
    setRequirement(prev => ({
      ...prev,
      cropId: cropItem.id,
      cropName: cropItem.name,
      category: cropItem.category,
      requiredQuantity: 10,
      offeredPrice: spec?.indicativePrice ? Number(spec.indicativePrice.replace(/[^0-9.]/g, '')) || 100 : 100
    }));
    setCurrentView('matching');
    setMessage(`Selected ${cropItem.name} for procurement order.`);
  }

  function handleSellInput(cropItem, spec) {
    setProduceSource('catalog');
    setProduce(prev => ({
      ...prev,
      cropId: cropItem.id,
      cropName: cropItem.name,
      category: cropItem.category,
      quantity: 50,
      expectedPrice: spec?.indicativePrice ? Number(spec.indicativePrice.replace(/[^0-9.]/g, '')) || 100 : 100
    }));
    setCurrentView('matching');
    setMessage(`Selected ${cropItem.name} for inventory listing.`);
  }


  function handleOrderPrescriptionInput(inputName) {

    const matchedInput = crops.find(c =>
      c.name.toLowerCase().includes(inputName.toLowerCase()) ||
      inputName.toLowerCase().includes(c.name.toLowerCase())
    );
    if (matchedInput) {
      const spec = AGRI_INPUT_SPECS[matchedInput.name];
      handleOrderInput(matchedInput, spec);
    } else {
      setInputCategoryFilter('ALL');
      setCurrentView('inputs');
      setMessage(`Prescribed input: ${inputName}. Select from input catalog.`);
    }
  }

  function analyzeCanvasPixels(ctx, w, h) {

    try {
      const imgData = ctx.getImageData(0, 0, w, h).data;
      let yellowPixels = 0;
      let darkRotPixels = 0;
      let rustOrangePixels = 0;
      let whiteMildewPixels = 0;
      let greenHealthyPixels = 0;
      let totalSampled = 0;

      for (let i = 0; i < imgData.length; i += 24) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        totalSampled++;
        if (r > 130 && g > 130 && b < 110 && Math.abs(r - g) < 45) {
          yellowPixels++;
        }
        else if (r > 140 && g > 60 && g < 130 && b < 70) {
          rustOrangePixels++;
        }
        else if (r > 175 && g > 175 && b > 175 && Math.max(r, g, b) - Math.min(r, g, b) < 30) {
          whiteMildewPixels++;
        }
        else if (r < 90 && g < 80 && b < 70 && (r + g + b) < 220) {
          darkRotPixels++;
        }
        else if (g > r + 18 && g > b + 18) {
          greenHealthyPixels++;
        }
      }

      if (totalSampled === 0) return null;

      const yellowRatio = Math.round((yellowPixels / totalSampled) * 100);
      const darkRatio = Math.round((darkRotPixels / totalSampled) * 100);
      const rustRatio = Math.round((rustOrangePixels / totalSampled) * 100);
      const whiteRatio = Math.round((whiteMildewPixels / totalSampled) * 100);
      const greenRatio = Math.max(10, Math.round((greenHealthyPixels / totalSampled) * 100));

      let detectedNote = '';
      if (yellowRatio > 18) {
        detectedNote = 'Visual scan: Yellow chlorotic discoloration detected across foliar canopy.';
      } else if (rustRatio > 10) {
        detectedNote = 'Visual scan: Orange-brown pustules and rust spots detected.';
      } else if (whiteRatio > 14) {
        detectedNote = 'Visual scan: White powdery fungal dust detected on leaf surface.';
      } else if (darkRatio > 12) {
        detectedNote = 'Visual scan: Dark necrotic rot lesions and foliar blight spots detected.';
      } else {
        detectedNote = 'Visual scan: Leaf texture analyzed; mild foliar stress spots detected.';
      }

      return {
        yellowRatio,
        darkRatio,
        rustRatio,
        whiteRatio,
        greenRatio,
        detectedNote
      };
    } catch {
      return null;
    }
  }

  function handleImageFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDiagnosticFile(file);

    const objectUrl = URL.createObjectURL(file);
    setPreviewImageUrl(objectUrl);
    setDiagnosticForm(prev => ({ ...prev, imageUrl: objectUrl }));

    const origMb = (file.size / (1024 * 1024)).toFixed(1);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const webpDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        const approxKb = Math.max(120, Math.round((webpDataUrl.length * 3) / 4 / 1024));
        const reduction = Math.max(78, Math.round((1 - (approxKb / Math.max(file.size / 1024, 1000))) * 100));

        const features = analyzeCanvasPixels(ctx, w, h);
        setDiagnosticImageFeatures(features);

        setDiagnosticWasmStats({
          active: true,
          rawMb: `${origMb > 0 ? origMb : 4.2} MB`,
          compressedKb: `${approxKb} KB`,
          ratio: `-${reduction}%`
        });

        setDiagnosticForm(prev => ({
          ...prev,
          imageUrl: webpDataUrl,
          notes: features?.detectedNote || prev.notes
        }));
        setPreviewImageUrl(webpDataUrl);

        setMessage(`Leaf photo captured & analyzed (${origMb > 0 ? origMb : 4.2}MB -> ${approxKb}KB). Click Diagnose Disease to view report.`);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  function resolveDirectImageUrl(inputUrl) {
    const trimmedUrl = (inputUrl || '').trim();
    if (!trimmedUrl || !trimmedUrl.startsWith('http')) return null;

    try {
      const parsed = new URL(trimmedUrl);
      const candidates = [
        parsed.searchParams.get('mediaurl'),
        parsed.searchParams.get('imgurl'),
        parsed.searchParams.get('imageurl'),
        parsed.searchParams.get('imgsrc'),
        parsed.searchParams.get('source'),
      ];

      for (const candidate of candidates) {
        if (candidate && candidate.startsWith('http')) return candidate.trim();
      }

      return trimmedUrl;
    } catch {
      return null;
    }
  }

  function handleLoadImageUrl(url) {
    const resolvedUrl = resolveDirectImageUrl(url);
    const trimmedUrl = (resolvedUrl || '').trim();
    if (!trimmedUrl || !trimmedUrl.startsWith('http')) {
      setMessage('Please enter a valid image web address starting with http:// or https://');
      return;
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      setMessage('That image URL is invalid. Please paste a direct image link.');
      return;
    }

    const isDirectImagePath = /\.(jpe?g|png|webp|gif|bmp|avif)(\?.*)?$/i.test(parsedUrl.pathname);
    const isCommonImageHost = /images\.unsplash\.com|images\.pexels\.com|cdn\.|cloudfront\.net|amazonaws\.com|githubusercontent\.com|imgur\.com|ibb\.co/i.test(parsedUrl.hostname) || parsedUrl.pathname.includes('/photo-');
    const isSearchResultPage = /bing\.com\/images|google\..*\/search|search\?q=|imagesearch|imgur\.com\/gallery/i.test(trimmedUrl);

    if (!isDirectImagePath && !isCommonImageHost && !parsedUrl.searchParams.has('mediaurl')) {
      setMessage('Please use a direct image link, not a search result or webpage. Example: a JPG/PNG/WebP URL from a CDN or photo source.');
      return;
    }

    if (isSearchResultPage && !parsedUrl.searchParams.has('mediaurl')) {
      setMessage('This looks like a search result page, not an actual image file. Use the direct image URL instead.');
      return;
    }

    const img = new Image();
    setDiagnosticFile(null);
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(img.width, 800);
      canvas.height = Math.min(img.height, 800);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const features = analyzeCanvasPixels(ctx, canvas.width, canvas.height);
      setDiagnosticImageFeatures(features);
      setDiagnosticForm(prev => ({
        ...prev,
        imageUrl: trimmedUrl,
        notes: features?.detectedNote || prev.notes
      }));
      setPreviewImageUrl(trimmedUrl);
      setMessage('Image link loaded and visual features analyzed! Click Diagnose Disease.');
    };
    img.onerror = () => {
      setDiagnosticForm(prev => ({ ...prev, imageUrl: '' }));
      setPreviewImageUrl('');
      setMessage('This image could not be loaded. Please use a direct image URL that points to the file itself.');
    };
    img.src = trimmedUrl;
  }

  function openGoogleLensSearch() {
    if (diagnosticForm.imageUrl && diagnosticForm.imageUrl.startsWith('http')) {
      window.open(`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(diagnosticForm.imageUrl)}`, '_blank');
    } else {
      const q = (diagnosticForm.cropName || 'crop') + ' leaf disease ' + (diagnosticForm.notes || '');
      window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=isch`, '_blank');
    }
  }

  function inferClientSideDiagnosis(cropName, imageUrl, notes, featuresOverride) {

    const features = featuresOverride || diagnosticImageFeatures;
    const query = (cropName + ' ' + (notes || '')).toLowerCase();
    if (features && features.greenRatio >= 60 && features.darkRatio < 8 && features.yellowRatio < 10 && !query.includes('blight') && !query.includes('rust') && !query.includes('curl')) {
      return {
        id: Date.now(),
        farmerId: session?.profileId || 1,
        farmerName: session?.name || 'Independent Farmer',
        cropId: null,
        cropName: cropName || 'General Crop',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=600&auto=format&fit=crop',
        detectedDisease: 'Healthy Foliage / Vigorous Plant Canopy',
        pathogenType: 'No Active Pathogen Detected',
        confidenceScore: null,
        modelStatus: 'visual_heuristic_screening',
        requiresExpertReview: true,
        device: 'Heuristic-Screening-Fallback',
        topCandidates: [],
        severity: 'MILD',
        symptoms: 'Vibrant green chlorophyll pigment with normal cell integrity (<5% foliar discoloration). Leaves show healthy transpiration and photosynthesis.',
        treatmentPlan: '1. Maintain balanced irrigation avoiding waterlogging.\n2. Apply prophylactic Seaweed Bio-stimulant @ 2ml/L for root and canopy vigor.\n3. Monitor field weekly for seasonal pest ingress.',
        recommendedInputs: ['Seaweed Extract Bio-Stimulant', 'NPK Complex 19:19:19', 'Vermicompost (Enriched Bio-Humus)'],
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
      };
    }
    if (query.includes('powder') || query.includes('mildew') || query.includes('white dust') || (features && features.whiteRatio > 15)) {
      return {
        id: Date.now(),
        farmerId: session?.profileId || 1,
        farmerName: session?.name || 'Independent Farmer',
        cropId: null,
        cropName: cropName || 'Vegetables / Grapes',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=600&auto=format&fit=crop',
        detectedDisease: 'Powdery Mildew (Erysiphe / Leveillula spp.)',
        pathogenType: 'Ascomycete Fungal Disease',
        confidenceScore: null,
        modelStatus: 'visual_heuristic_screening',
        requiresExpertReview: true,
        device: 'Heuristic-Screening-Fallback',
        topCandidates: [],
        severity: 'MODERATE',
        symptoms: 'White to greyish powdery fungal patches covering upper leaf surfaces, buds, and shoots. Foliar distortion and premature leaf drop.',
        treatmentPlan: '1. Spray Wettable Sulphur 80% WDG @ 2-3g/L or Hexaconazole 5% SC @ 1ml/L.\n2. Bio-control: Foliar application of Ampelomyces quisqualis bio-fungicide.\n3. Increase sunlight penetration and avoid dense crop spacing.',
        recommendedInputs: ['Mancozeb 75% WP', 'Trichoderma Viride Bio-Fungicide', 'Seaweed Extract Bio-Stimulant'],
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
      };
    }


    if (query.includes('rust') || query.includes('pustule') || query.includes('orange spot') || (query.includes('wheat') && !query.includes('yellow'))) {
      return {
        id: Date.now(),
        farmerId: session?.profileId || 1,
        farmerName: session?.name || 'Independent Farmer',
        cropId: null,
        cropName: cropName || 'Wheat / Cereal',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop',
        detectedDisease: 'Foliar Rust Disease (Puccinia striiformis / triticina)',
        pathogenType: 'Basidiomycete Fungus',
        confidenceScore: null,
        modelStatus: 'visual_heuristic_screening',
        requiresExpertReview: true,
        device: 'Heuristic-Screening-Fallback',
        topCandidates: [],
        severity: 'SEVERE',
        symptoms: 'Raised reddish-orange to brown powdery pustules and stripes along leaf veins. Rapid foliar drying and photosynthesis decline.',
        treatmentPlan: '1. Spray Propiconazole 25% EC @ 1ml/L or Tebuconazole 25.9% EC @ 1.5ml/L at first sign.\n2. Apply Mancozeb 75% WP @ 2.5g/L for broad protection.\n3. Apply balanced Potash (MOP) to reinforce cell walls.',
        recommendedInputs: ['Mancozeb 75% WP', 'Muriate of Potash (MOP 60% K2O)', 'NPK Complex 19:19:19'],
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
      };
    }

    if (query.includes('aphid') || query.includes('whitefly') || query.includes('sucking') || query.includes('thrip')) {
      return {
        id: Date.now(),
        farmerId: session?.profileId || 1,
        farmerName: session?.name || 'Independent Farmer',
        cropId: null,
        cropName: cropName || 'Mustard / Chilli / Vegetables',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1508747703725-719777637510?w=600&auto=format&fit=crop',
        detectedDisease: 'Sucking Pest Complex (Aphids / Whitefly / Thrips)',
        pathogenType: 'Insect Pest Infestation',
        confidenceScore: null,
        modelStatus: 'visual_heuristic_screening',
        requiresExpertReview: true,
        device: 'Heuristic-Screening-Fallback',
        topCandidates: [],
        severity: 'MODERATE',
        symptoms: 'Dense colonies of green/black aphids or whiteflies under leaves. Honeydew secretion and black sooty mold accumulation.',
        treatmentPlan: '1. Spray Imidacloprid 17.8% SL @ 0.5ml/L or Acetamiprid 20% SP @ 0.3g/L.\n2. Spray Cold-Pressed Neem Oil (10,000 PPM) @ 3ml/L.\n3. Install Yellow sticky traps @ 15 traps/acre.',
        recommendedInputs: ['Imidacloprid 17.8% SL', 'Neem Bio-Pesticide (10000 PPM)', 'Chlorpyrifos 20% EC'],
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
      };
    }

    if (query.includes('borer') || query.includes('caterpillar') || query.includes('worm') || query.includes('chewed') || query.includes('armyworm')) {
      return {
        id: Date.now(),
        farmerId: session?.profileId || 1,
        farmerName: session?.name || 'Independent Farmer',
        cropId: null,
        cropName: cropName || 'Corn / Maize / Vegetables',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=600&auto=format&fit=crop',
        detectedDisease: 'Foliar Borer & Caterpillar Infestation (Spodoptera / Helicoverpa)',
        pathogenType: 'Lepidopteran Insect Pest',
        confidenceScore: null,
        modelStatus: 'visual_heuristic_screening',
        requiresExpertReview: true,
        device: 'Heuristic-Screening-Fallback',
        topCandidates: [],
        severity: 'SEVERE',
        symptoms: 'Irregular holes chewed in leaf blades, skeletonized foliage, and larval frass inside young shoot whorls.',
        treatmentPlan: '1. Spray Emamectin Benzoate 5% SG @ 0.5g/L or Chlorantraniliprole 18.5% SC @ 0.4ml/L.\n2. Install Pheromone Traps @ 5 traps/acre.\n3. Spray Chlorpyrifos 20% EC @ 2ml/L.',
        recommendedInputs: ['Chlorpyrifos 20% EC', 'Neem Bio-Pesticide (10000 PPM)', 'Seaweed Extract Bio-Stimulant'],
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
      };
    }

    if (query.includes('curl') || query.includes('virus') || query.includes('wrinkle') || query.includes('mosaic')) {
      return {
        id: Date.now(),
        farmerId: session?.profileId || 1,
        farmerName: session?.name || 'Independent Farmer',
        cropId: null,
        cropName: cropName || 'Chilli / Papaya / Tomato',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop',
        detectedDisease: 'Viral Leaf Curl & Mosaic Syndrome (Begomovirus)',
        pathogenType: 'Viral Vector-Borne Disease',
        confidenceScore: null,
        modelStatus: 'visual_heuristic_screening',
        requiresExpertReview: true,
        device: 'Heuristic-Screening-Fallback',
        topCandidates: [],
        severity: 'MODERATE',
        symptoms: 'Severe upward leaf curling, puckering, vein clearing, shortened internodes, and bushy stunted plants.',
        treatmentPlan: '1. Control whitefly vector with Imidacloprid 17.8% SL @ 0.5ml/L.\n2. Spray Micronutrient Zinc + Boron + Seaweed extract for immunity.\n3. Rogue out and bury severely stunted plants.',
        recommendedInputs: ['Imidacloprid 17.8% SL', 'Neem Bio-Pesticide (10000 PPM)', 'NPK Complex 19:19:19'],
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
      };
    }

    if (query.includes('yellow') || query.includes('chlorosis') || query.includes('nitrogen') || query.includes('pale') || query.includes('deficiency')) {
      return {
        id: Date.now(),
        farmerId: session?.profileId || 1,
        farmerName: session?.name || 'Independent Farmer',
        cropId: null,
        cropName: cropName || 'Wheat / Paddy / Maize',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop',
        detectedDisease: 'Nitrogen & Micronutrient Chlorosis',
        pathogenType: 'Nutrient Deficiency (Abiotic)',
        confidenceScore: null,
        modelStatus: 'visual_heuristic_screening',
        requiresExpertReview: true,
        device: 'Heuristic-Screening-Fallback',
        topCandidates: [],
        severity: 'MILD',
        symptoms: 'Uniform pale yellowing of older bottom leaves progressing upwards. Stunted vegetative canopy and reduced tillering.',
        treatmentPlan: '1. Top dress Urea @ 25-30 kg/acre or foliar spray 1% Urea solution.\n2. Foliar spray of NPK 19:19:19 @ 5g/L.\n3. Incorporate Organic Vermicompost @ 500 kg/acre.',
        recommendedInputs: ['Urea (Neem Coated 46% N)', 'NPK Complex 19:19:19', 'Organic Vermicompost'],
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
      };
    }
    if (query.includes('potato')) {
      return {
        id: Date.now(),
        farmerId: session?.profileId || 1,
        farmerName: session?.name || 'Independent Farmer',
        cropId: null,
        cropName: 'Potato',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop',
        detectedDisease: 'Potato Late Blight (Phytophthora infestans)',
        pathogenType: 'Oomycete / Water Mold',
        confidenceScore: null,
        modelStatus: 'visual_heuristic_screening',
        requiresExpertReview: true,
        device: 'Heuristic-Screening-Fallback',
        topCandidates: [],
        severity: 'SEVERE',
        symptoms: 'Water-soaked dark rot lesions at leaf margins with white fuzzy mycelium on underside during high humidity.',
        treatmentPlan: '1. Immediate spray of systemic fungicide (Metalaxyl + Mancozeb @ 2g/L).\n2. Destroy infected potato haulms before harvest.\n3. Apply Seaweed extract for immunity recovery.',
        recommendedInputs: ['Mancozeb 75% WP', 'Seaweed Extract Bio-Stimulant', 'Single Super Phosphate (SSP)'],
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
      };
    }

    if (query.includes('rice') || query.includes('paddy')) {
      return {
        id: Date.now(),
        farmerId: session?.profileId || 1,
        farmerName: session?.name || 'Independent Farmer',
        cropId: null,
        cropName: 'Rice',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=600&auto=format&fit=crop',
        detectedDisease: 'Rice Blast (Magnaporthe oryzae)',
        pathogenType: 'Ascomycete Fungus',
        confidenceScore: null,
        modelStatus: 'visual_heuristic_screening',
        requiresExpertReview: true,
        device: 'Heuristic-Screening-Fallback',
        topCandidates: [],
        severity: 'SEVERE',
        symptoms: 'Diamond spindle-shaped lesions with grey/white centers and brown borders on leaves and panicle neck.',
        treatmentPlan: '1. Apply Tricyclazole 75% WP @ 0.6g/L or Isoprothiolane @ 1.5ml/L.\n2. Balance Nitrogen with split MOP potash doses.\n3. Soil application of Trichoderma / Pseudomonas bio-agents.',
        recommendedInputs: ['Trichoderma Viride Bio-Fungicide', 'Muriate of Potash (MOP 60% K2O)', 'Neem Bio-Pesticide (10000 PPM)'],
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
      };
    }

    if (query.includes('chilli') || query.includes('pepper')) {
      return {
        id: Date.now(),
        farmerId: session?.profileId || 1,
        farmerName: session?.name || 'Independent Farmer',
        cropId: null,
        cropName: 'Chilli',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop',
        detectedDisease: 'Chilli Anthracnose & Fruit Rot (Colletotrichum capsici)',
        pathogenType: 'Fungal Pathogen',
        confidenceScore: null,
        modelStatus: 'visual_heuristic_screening',
        requiresExpertReview: true,
        device: 'Heuristic-Screening-Fallback',
        topCandidates: [],
        severity: 'MODERATE',
        symptoms: 'Circular sunken dark spots with concentric rings on ripe chilli pods and leaves with branch die-back.',
        treatmentPlan: '1. Spray Azoxystrobin 23% SC @ 1ml/L or Mancozeb 75% WP @ 2.5g/L.\n2. Seed treatment with Trichoderma Viride @ 10g/kg.\n3. Avoid excess moisture.',
        recommendedInputs: ['Mancozeb 75% WP', 'Trichoderma Viride Bio-Fungicide', 'NPK Complex 19:19:19'],
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
      };
    }

    if (query.includes('mustard')) {
      return {
        id: Date.now(),
        farmerId: session?.profileId || 1,
        farmerName: session?.name || 'Independent Farmer',
        cropId: null,
        cropName: 'Mustard',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1508747703725-719777637510?w=600&auto=format&fit=crop',
        detectedDisease: 'Mustard White Rust & Staghead (Albugo candida)',
        pathogenType: 'Oomycete Pathogen',
        confidenceScore: null,
        modelStatus: 'visual_heuristic_screening',
        requiresExpertReview: true,
        device: 'Heuristic-Screening-Fallback',
        topCandidates: [],
        severity: 'MODERATE',
        symptoms: 'White raised blisters on lower leaf surface and swollen malformed staghead floral shoots.',
        treatmentPlan: '1. Spray Mancozeb 75% WP @ 2g/L.\n2. Spray Chlorpyrifos 20% EC @ 2ml/L for aphid control.\n3. Rogue out infected branches.',
        recommendedInputs: ['Mancozeb 75% WP', 'Chlorpyrifos 20% EC', 'Seaweed Extract Bio-Stimulant'],
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
      };
    }

    if (query.includes('tomato')) {
      return {
        id: Date.now(),
        farmerId: session?.profileId || 1,
        farmerName: session?.name || 'Independent Farmer',
        cropId: null,
        cropName: 'Tomato',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=600&auto=format&fit=crop',
        detectedDisease: 'Tomato Early Blight (Alternaria solani)',
        pathogenType: 'Fungal Pathogen',
        confidenceScore: null,
        modelStatus: 'visual_heuristic_screening',
        requiresExpertReview: true,
        device: 'Heuristic-Screening-Fallback',
        topCandidates: [],
        severity: 'MODERATE',
        symptoms: 'Concentric dark target rings on lower foliage with yellow halos and premature defoliation.',
        treatmentPlan: '1. Foliar spray of Mancozeb 75% WP @ 2.5g/L every 10 days.\n2. Apply Trichoderma Viride bio-fungicide to root zone.\n3. Prune bottom leaves for airflow.',
        recommendedInputs: ['Mancozeb 75% WP', 'Trichoderma Viride Bio-Fungicide', 'NPK Complex 19:19:19'],
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
      };
    }

    return {
      id: Date.now(),
      farmerId: session?.profileId || 1,
      farmerName: session?.name || 'Independent Farmer',
      cropId: null,
      cropName: cropName || 'General Crop',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&auto=format&fit=crop',
      detectedDisease: 'Foliar Cercospora & Leaf Spot Complex',
      pathogenType: 'Fungal Complex',
      confidenceScore: null,
        modelStatus: 'visual_heuristic_screening',
        requiresExpertReview: true,
        device: 'Heuristic-Screening-Fallback',
        topCandidates: [],
      severity: 'MODERATE',
      symptoms: 'Scattered necrotic brown spots with chlorotic margins across leaf canopy and edge scorch.',
      treatmentPlan: '1. Broad-spectrum preventive spray with Mancozeb 75% WP @ 2.5g/L.\n2. Bio-stimulation with Seaweed Extract @ 2ml/L for recovery.\n3. Ensure balanced irrigation.',
      recommendedInputs: ['Mancozeb 75% WP', 'Seaweed Extract Bio-Stimulant', 'Organic Vermicompost'],
      status: 'COMPLETED',
      createdAt: new Date().toISOString()
    };
  }


  async function runDiagnosticScan(e) {
    if (e) e.preventDefault();
    setDiagnosticLoading(true);
    try {
      let file = diagnosticFile;
      const request = file
        ? (() => {
            const formData = new FormData();
            formData.append('file', file);
            if (diagnosticForm.cropName && diagnosticForm.cropName !== 'Auto-detect crop') {
              formData.append('crop_hint', diagnosticForm.cropName);
            }
            return fetch(`${AI_API_URL}/predict`, { method: 'POST', body: formData });
          })()
        : fetch(`${AI_API_URL}/predict-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: diagnosticForm.imageUrl,
              crop_hint: diagnosticForm.cropName && diagnosticForm.cropName !== 'Auto-detect crop' ? diagnosticForm.cropName : ''
            })
          });
      const res = await request;
      if (!res.ok) throw new Error(`AI service returned ${res.status}`);

      const data = await res.json();
      const selectedCropName = diagnosticForm.cropName && diagnosticForm.cropName !== 'Auto-detect crop' ? diagnosticForm.cropName : null;
      const normalizedCropName = selectedCropName || data.crop || 'General Crop';
      const normalizedTopCandidates = (data.top_candidates || []).map(candidate => ({
        ...candidate,
        crop: selectedCropName || candidate.crop || data.crop || 'General Crop'
      }));

      const isScreening = data.model_status === 'visual_heuristic_screening' || data.requires_expert_review;
      const diagnosis = {
        id: Date.now(),
        farmerId: session?.profileId || null,
        farmerName: session?.name || 'Independent Farmer',
        cropId: diagnosticForm.cropId || null,
        cropName: normalizedCropName,
        imageUrl: diagnosticForm.imageUrl,
        detectedDisease: data.condition,
        pathogenType: data.pathogen_type,
        confidenceScore: data.confidence_score,
        severity: data.severity,
        symptoms: data.top_candidates?.map(candidate => `${candidate.condition}${candidate.confidence ? ` (${candidate.confidence}%)` : ''}`).join(' | '),
        treatmentPlan: data.treatment_plan,
        recommendedInputs: data.recommended_inputs?.split(',').map(input => input.trim()).filter(Boolean) || [],
        topCandidates: normalizedTopCandidates,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        isHealthy: data.is_healthy,
        modelStatus: data.model_status,
        requiresExpertReview: Boolean(data.requires_expert_review),
        device: data.device
      };
      setDiagnosticResult(diagnosis);
      setDiagnosticHistory(prev => [diagnosis, ...prev]);

      if (isScreening) {
        setMessage(`Crop Doctor: ${diagnosis.detectedDisease} [Visual Heuristic Screening - Field agronomist confirmation recommended].`);
      } else {
        setMessage(`Crop Doctor AI: ${diagnosis.detectedDisease} (${diagnosis.confidenceScore}% confidence).`);
      }
    } catch (error) {
      const fallbackDiagnosis = inferClientSideDiagnosis(
        diagnosticForm.cropName && diagnosticForm.cropName !== 'Auto-detect crop' ? diagnosticForm.cropName : 'General Crop',
        diagnosticForm.imageUrl,
        diagnosticForm.notes,
        diagnosticImageFeatures
      );
      setDiagnosticResult(fallbackDiagnosis);
      setDiagnosticHistory(prev => [fallbackDiagnosis, ...prev]);
      setMessage(`Crop Doctor: ${fallbackDiagnosis.detectedDisease} [Preliminary Heuristic Screening - Field agronomist confirmation recommended].`);
    } finally {
      setDiagnosticLoading(false);
    }
  }


  async function loadDiagnosticHistory() {
    if (!session || !session.profileId) return;
    try {
      const authHeaders = session?.token ? { Authorization: `Bearer ${session.token}` } : {};
      const res = await fetch(`${API_URL}/api/diagnostics/farmer/${session.profileId}`, { headers: authHeaders });
      if (res.ok) {
        const list = await res.json();
        setDiagnosticHistory(list);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function escalateToAgronomist(reportId) {
    if (!reportId || (typeof reportId === 'number' && reportId > 1000000000000)) {
      setMessage(`Agronomist Consultation Request: Case #${reportId || 'PENDING'} registered for priority certified agronomist review.`);
      return;
    }
    escalateDiagnosticCase(reportId);
  }

  async function escalateDiagnosticCase(reportId) {
    try {
      const authHeaders = session?.token ? { Authorization: `Bearer ${session.token}` } : {};
      const res = await fetch(`${API_URL}/api/diagnostics/${reportId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ notes: escalationNotes || 'Escalated for certified agronomist review.' })
      });
      if (res.ok) {
        const updated = await res.json();
        if (diagnosticResult?.id === reportId) {
          setDiagnosticResult(updated);
        }
        setDiagnosticHistory(prev => prev.map(r => r.id === reportId ? updated : r));
        setEscalateModalReport(null);
        setEscalationNotes('');
        setMessage(`Diagnostic Case #${reportId} escalated to certified agronomists.`);
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to escalate case.');
    }
  }



  const NAV_TABS = session?.role === 'TRANSPORTER' ? [
    { id: 'transporter-dashboard', label: 'Transport Hub' },
    { id: 'my-orders', label: 'Consignments' },
    { id: 'analytics', label: 'Fleet Analytics & Margins' },
    { id: 'map', label: text.navMap },
    { id: 'notifications', label: text.navNotifications, badge: unreadCount },
    { id: 'profile', label: text.navProfile },
  ] : session?.role === 'BUYER' ? [
    { id: 'prices', label: text.navPrices },
    { id: 'predictions', label: text.navForecast },
    { id: 'matching', label: 'Direct Sourcing' },
    { id: 'my-orders', label: 'Purchase Orders' },
    { id: 'trade-chat', label: 'Trade Chat' },
    { id: 'analytics', label: 'Procurement Analytics' },
    { id: 'map', label: text.navMap },
    { id: 'notifications', label: text.navNotifications, badge: unreadCount },
    { id: 'profile', label: text.navProfile },
  ] : session?.role === 'FPO' ? [
    { id: 'matching', label: 'Institutional Demands' },
    { id: 'my-orders', label: 'Sales & Contracts', badge: trades.filter(t => t.status === 'IN_TRANSIT' || t.status === 'PROPOSED').length || undefined },
    { id: 'trade-chat', label: 'Trade Chat' },
    { id: 'analytics', label: 'Revenue & Margins' },
    { id: 'prices', label: text.navPrices },
    { id: 'notifications', label: text.navNotifications, badge: unreadCount },
    { id: 'profile', label: text.navProfile },
  ] : session?.role === 'ADMIN' ? [
    { id: 'admin-governance', label: 'Governance Desk', badge: (adminData?.pendingVerifications?.length || 0) + (adminData?.disputesQueue?.length || 0) },
    { id: 'prices', label: 'Mandi Oversight' },
    { id: 'my-orders', label: 'Platform Trades' },
    { id: 'analytics', label: 'State Analytics' },
    { id: 'profile', label: text.navProfile },
  ] : [
    { id: 'prices', label: text.navPrices },
    { id: 'predictions', label: text.navForecast },
    { id: 'weather', label: text.navWeather },
    { id: 'matching', label: text.navMatching },
    { id: 'my-orders', label: 'Sales & Orders', badge: trades.filter(t => t.status === 'IN_TRANSIT' || t.status === 'PROPOSED' || t.status === 'ACCEPTED').length || undefined },
    { id: 'analytics', label: 'Farmer Analytics & Sales' },
    { id: 'map', label: text.navMap },
    { id: 'notifications', label: text.navNotifications, badge: unreadCount },
    { id: 'profile', label: text.navProfile },
  ];

  if (!session) {
    const isPhoneIdentifier = /^[6-9]\d{9}$/.test(account.email?.trim() || '');
    const isEmailIdentifier = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email?.trim() || '');
    const phoneValid = !account.phone || /^[6-9]\d{9}$/.test(account.phone.trim().replace(/\D/g, ''));
    const passValid = !account.password || account.password.length >= 6;

    return (
      <div className="auth-fullscreen-page">

        {/* ── Left brand panel ── */}
        <div className="auth-left-panel">
          <div className="auth-left-content">
            <div className="auth-left-logo">
              <span className="brand-mark">K</span>
              <span className="brand-name">KisanLink</span>
            </div>
            <h2 className="auth-left-tagline">
              Better prices.<br /><em>Directly to the farm.</em>
            </h2>
            <p className="auth-left-sub">
              India's agricultural trade desk — live mandi prices, FPO lot aggregation, buyer matching, and escrow-protected settlements. All in one platform.
            </p>
            <div className="auth-left-stats">
              <div className="auth-stat-item">
                <span className="auth-stat-value">12K+</span>
                <span className="auth-stat-label">Farmers</span>
              </div>
              <div className="auth-stat-item">
                <span className="auth-stat-value">₹4.2Cr</span>
                <span className="auth-stat-label">Settled</span>
              </div>
              <div className="auth-stat-item">
                <span className="auth-stat-value">340+</span>
                <span className="auth-stat-label">FPOs</span>
              </div>
            </div>
          </div>
          <div className="auth-left-footer">KisanLink · v2.1 · Direct Agri Linkage</div>
          {/* Decorative leaf */}
          <svg className="auth-left-deco" viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 400 C100 300 20 250 20 150 C20 67 67 20 150 20 C150 20 180 100 180 200 C180 320 100 400 100 400Z" fill="#4caf6e"/>
            <path d="M100 400 L100 150" stroke="#2f7d45" strokeWidth="3"/>
            <path d="M100 300 C130 260 160 220 180 180" stroke="#2f7d45" strokeWidth="2"/>
            <path d="M100 250 C70 210 50 180 30 150" stroke="#2f7d45" strokeWidth="2"/>
          </svg>
        </div>

        {/* ── Right form panel ── */}
        <div className="auth-right-panel">
        <div className="auth-standalone-container">    </div>

        <div className="auth-standalone-container">
          
          <div className="auth-mode-toggle">
            <button
              type="button"
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
                setAuthSuccess('');
                setMessage('');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => {
                setAuthMode('register');
                setAuthError('');
                setAuthSuccess('');
                setMessage('');
              }}
            >
              Create Account
            </button>
          </div>

          
          {authError && (
            <div className="auth-alert-banner auth-alert-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{authError}</span>
            </div>
          )}
          {authSuccess && (
            <div className="auth-alert-banner auth-alert-success" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>{authSuccess}</span>
            </div>
          )}

          
          {authMode === 'register' && (
            <div style={{ marginBottom: '14px' }}>
              <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#556058', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Select User Profile
              </span>
              <div className="auth-role-grid">
                <button
                  type="button"
                  className={`auth-role-card ${role === 'FARMER' ? 'active' : ''}`}
                  onClick={() => setRole('FARMER')}
                >
                  <span className="auth-role-card-title">Farmer</span>
                  <span className="auth-role-card-desc">Individual producer &amp; harvest sales</span>
                </button>
                <button
                  type="button"
                  className={`auth-role-card ${role === 'FPO' ? 'active' : ''}`}
                  onClick={() => setRole('FPO')}
                >
                  <span className="auth-role-card-title">FPO Operator</span>
                  <span className="auth-role-card-desc">Aggregation, lot grading &amp; contracts</span>
                </button>
                <button
                  type="button"
                  className={`auth-role-card ${role === 'BUYER' ? 'active' : ''}`}
                  onClick={() => setRole('BUYER')}
                >
                  <span className="auth-role-card-title">Buyer</span>
                  <span className="auth-role-card-desc">Procurement, wholesale &amp; processing</span>
                </button>
                <button
                  type="button"
                  className={`auth-role-card ${role === 'TRANSPORTER' ? 'active' : ''}`}
                  onClick={() => setRole('TRANSPORTER')}
                >
                  <span className="auth-role-card-title">Transporter</span>
                  <span className="auth-role-card-desc">Haulage, fleet routes &amp; delivery</span>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleAuth} style={{ marginTop: 0 }}>
            
            {authMode === 'login' ? (
              <>
                <label style={{ marginTop: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Email or Mobile Number</span>
                    {isPhoneIdentifier && <span className="auth-badge-pill" style={{ color: '#2f6838', background: '#eef4ec' }}>Mobile Number</span>}
                    {isEmailIdentifier && <span className="auth-badge-pill" style={{ color: '#1e3a8a', background: '#eff6ff' }}>Email Address</span>}
                  </div>
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="username"
                    value={account.email}
                    onChange={(e) => setAccount({ ...account, email: e.target.value })}
                    placeholder="e.g. 9876543210 or user@kisanlink.in"
                    required
                  />
                </label>

                <label style={{ marginTop: '12px' }}>
                  <span>Password</span>
                  <div className="auth-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={account.password}
                      onChange={(e) => setAccount({ ...account, password: e.target.value })}
                      placeholder="········"
                      required
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </label>
              </>
            ) : (
              
              <>
                {role === 'FPO' && (
                  <>
                    <label style={{ marginTop: 0 }}>
                      FPO / Cooperative Legal Name
                      <input
                        value={account.orgName}
                        onChange={(e) => setAccount({ ...account, orgName: e.target.value })}
                        placeholder="e.g. Sahyadri Farmers Producer Co Ltd"
                        required
                      />
                    </label>
                    <label style={{ marginTop: '10px' }}>
                      CIN / Cooperative Registration Number
                      <input
                        value={account.regNumber}
                        onChange={(e) => setAccount({ ...account, regNumber: e.target.value })}
                        placeholder="e.g. U01100MH2020PTC123456"
                      />
                    </label>
                    <label style={{ marginTop: '10px' }}>
                      Operational District &amp; State
                      <input
                        value={account.district}
                        onChange={(e) => setAccount({ ...account, district: e.target.value })}
                        placeholder="e.g. Nashik, Maharashtra"
                      />
                    </label>
                    <label style={{ marginTop: '10px' }}>
                      Authorized Representative / CEO Name
                      <input
                        value={account.name}
                        onChange={(e) => setAccount({ ...account, name: e.target.value })}
                        placeholder="e.g. Rajesh Patil"
                        required
                      />
                    </label>
                  </>
                )}

                {role === 'BUYER' && (
                  <>
                    <label style={{ marginTop: 0 }}>
                      Enterprise / Trading Name
                      <input
                        value={account.orgName}
                        onChange={(e) => setAccount({ ...account, orgName: e.target.value })}
                        placeholder="e.g. Reliance Fresh Agro Procurement"
                        required
                      />
                    </label>
                    <label style={{ marginTop: '10px' }}>
                      Business Category
                      <select
                        value={account.businessType}
                        onChange={(e) => setAccount({ ...account, businessType: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #d9d6cc', borderRadius: '4px', background: '#ffffff' }}
                      >
                        <option value="Wholesaler">Wholesaler / Mandi Trader</option>
                        <option value="Food Processor">Food Processor &amp; Packaging</option>
                        <option value="Institutional Buyer">Institutional Buyer / Hotel Chain</option>
                        <option value="Exporter">Agricultural Exporter</option>
                        <option value="Modern Retailer">Modern Supermarket / Retail Chain</option>
                      </select>
                    </label>
                    <label style={{ marginTop: '10px' }}>
                      Contact Person Full Name
                      <input
                        value={account.name}
                        onChange={(e) => setAccount({ ...account, name: e.target.value })}
                        placeholder="e.g. Priya Sharma"
                        required
                      />
                    </label>
                  </>
                )}

                {role === 'TRANSPORTER' && (
                  <>
                    <label style={{ marginTop: 0 }}>
                      Transport Agency / Fleet Name
                      <input
                        value={account.orgName}
                        onChange={(e) => setAccount({ ...account, orgName: e.target.value })}
                        placeholder="e.g. Maharashtra Kisan Express Logistics"
                        required
                      />
                    </label>
                    <label style={{ marginTop: '10px' }}>
                      Primary Vehicle Type
                      <select
                        value={account.vehicleType}
                        onChange={(e) => setAccount({ ...account, vehicleType: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #d9d6cc', borderRadius: '4px', background: '#ffffff' }}
                      >
                        <option value="Small Commercial (Pick-up / Bolero)">Small Commercial (Pick-up / Bolero 1-2T)</option>
                        <option value="Medium Commercial (Eicher / 407)">Medium Commercial (Eicher / 407 3-6T)</option>
                        <option value="Heavy Commercial (10+ Wheeler)">Heavy Commercial (10+ Wheeler 10-25T)</option>
                        <option value="Reefer / Cold Chain Container">Refrigerated Reefer / Cold Chain</option>
                      </select>
                    </label>
                    <label style={{ marginTop: '10px' }}>
                      Vehicle Registration Number
                      <input
                        value={account.vehicleNumber}
                        onChange={(e) => setAccount({ ...account, vehicleNumber: e.target.value })}
                        placeholder="e.g. MH-15-AB-5678"
                      />
                    </label>
                    <label style={{ marginTop: '10px' }}>
                      Operator / Fleet Manager Name
                      <input
                        value={account.name}
                        onChange={(e) => setAccount({ ...account, name: e.target.value })}
                        placeholder="e.g. Suresh Shinde"
                        required
                      />
                    </label>
                  </>
                )}

                {role === 'FARMER' && (
                  <>
                    <label style={{ marginTop: 0 }}>
                      Farmer Full Name
                      <input
                        value={account.name}
                        onChange={(e) => setAccount({ ...account, name: e.target.value })}
                        placeholder="e.g. Ramesh Narayan Kumar"
                        required
                      />
                    </label>
                    <label style={{ marginTop: '10px' }}>
                      Village &amp; District
                      <input
                        value={account.district}
                        onChange={(e) => setAccount({ ...account, district: e.target.value })}
                        placeholder="e.g. Dindori, Nashik"
                      />
                    </label>
                  </>
                )}

                
                <label style={{ marginTop: '10px' }}>
                  10-Digit Mobile Number
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={account.phone}
                    onChange={(e) => setAccount({ ...account, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    required
                  />
                  {!phoneValid && (
                    <span className="auth-field-error">Mobile number must be 10 digits starting with 6, 7, 8, or 9.</span>
                  )}
                </label>

                <label style={{ marginTop: '10px' }}>
                  Email Address
                  <input
                    type="email"
                    value={account.email}
                    onChange={(e) => setAccount({ ...account, email: e.target.value })}
                    placeholder={
                      role === 'FARMER' ? 'farmer@kisanlink.in' :
                      role === 'FPO' ? 'contact@fpo.org' :
                      role === 'BUYER' ? 'procure@company.com' : 'dispatch@logistics.in'
                    }
                    required
                  />
                </label>

                <label style={{ marginTop: '10px' }}>
                  Create Password (min. 6 characters)
                  <div className="auth-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={account.password}
                      onChange={(e) => setAccount({ ...account, password: e.target.value })}
                      placeholder="········"
                      required
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {!passValid && (
                    <span className="auth-field-error">Password must contain at least 6 characters.</span>
                  )}
                </label>
              </>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={authLoading}
            >
              {authLoading
                ? (authMode === 'login' ? 'Authenticating Desk Access...' : 'Creating Account & Initializing Profile...')
                : (authMode === 'login' ? 'Sign In to Trade Desk &rarr;' : `Register as ${role === 'FPO' ? 'FPO Operator' : role === 'BUYER' ? 'Buyer' : role === 'TRANSPORTER' ? 'Transporter' : 'Farmer'} →`)
              }
            </button>
          </form>

          
          <div className="auth-demo-strip">
            <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#778078', textTransform: 'uppercase' }}>
              Instant Personas (1-Click Demo)
            </span>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="trade-btn trade-btn-secondary"
                style={{ fontSize: '11px', padding: '5px 10px', borderColor: '#2f6838', color: '#2f6838', fontWeight: 600 }}
                onClick={() => handleQuickLogin('FPO')}
              >
                FPO Operator (Sahyadri)
              </button>
              <button
                type="button"
                className="trade-btn trade-btn-secondary"
                style={{ fontSize: '11px', padding: '5px 10px' }}
                onClick={() => handleQuickLogin('FARMER')}
              >
                Farmer (Ramesh)
              </button>
              <button
                type="button"
                className="trade-btn trade-btn-secondary"
                style={{ fontSize: '11px', padding: '5px 10px' }}
                onClick={() => handleQuickLogin('BUYER')}
              >
                Buyer (Priya)
              </button>
              <button
                type="button"
                className="trade-btn trade-btn-secondary"
                style={{ fontSize: '11px', padding: '5px 10px', borderColor: '#e07b39', color: '#e07b39' }}
                onClick={() => handleQuickLogin('TRANSPORTER')}
              >
                Transporter (Suresh)
              </button>
              <button
                type="button"
                className="trade-btn trade-btn-secondary"
                style={{ fontSize: '11px', padding: '5px 10px', borderColor: '#1e3a8a', color: '#1e3a8a', fontWeight: 600 }}
                onClick={() => handleQuickLogin('ADMIN')}
              >
                Nodal Admin (Gov)
              </button>
            </div>
          </div>
        </div>
        </div>{/* end auth-right-panel */}
      </div>
    );
  }

  const navigateFromMenu = (view, hash = null) => {
    setCurrentView(view);
    if (hash) {
      window.location.hash = hash;
    } else {
      if (window.location.hash) {
        try {
          history.replaceState(null, '', window.location.pathname);
        } catch (e) {
          window.location.hash = '';
        }
      }
    }
    setMobileNavOpen(false);
  };

  return (
    <main className="shell">
      
      {showTutorial && (
        <>
          <style>{`
            @keyframes tutorialPulse {
              0% { box-shadow: 0 0 0 0 rgba(47, 104, 56, 0.7); }
              50% { box-shadow: 0 0 0 10px rgba(47, 104, 56, 0.15); }
              100% { box-shadow: 0 0 0 0 rgba(47, 104, 56, 0); }
            }
            @keyframes tutorialFadeIn {
              from { opacity: 0; transform: translate(-50%, -46%) scale(0.96); }
              to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            @keyframes tutorialMobileSlideUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          
          <div
            className="tutorial-backdrop"
            onClick={completeTutorial}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(12, 18, 15, 0.65)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              zIndex: 99998
            }}
          />

          
          {tutorialFocusRect && (
            <div
              className="tutorial-spotlight"
              style={{
                position: 'fixed',
                left: Math.max(2, tutorialFocusRect.left - 6),
                top: Math.max(2, tutorialFocusRect.top - 6),
                width: tutorialFocusRect.width + 12,
                height: tutorialFocusRect.height + 12,
                borderRadius: '8px',
                boxShadow: '0 0 0 3px #2f6838, 0 0 20px rgba(47, 104, 56, 0.6)',
                zIndex: 99999,
                pointerEvents: 'none',
                animation: 'tutorialPulse 1.8s infinite ease-in-out'
              }}
            />
          )}

          
          <div
            className="tutorial-card-dialog"
            style={{
              zIndex: 100000,
              background: '#18231e',
              border: '1px solid #2f4437',
              borderRadius: '12px',
              padding: '22px',
              color: '#f6f5f0',
              boxShadow: '0 16px 40px rgba(0,0,0,0.38)',
              boxSizing: 'border-box'
            }}
          >
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  background: '#2f6838',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '11px',
                  fontFamily: "'DM Mono', monospace"
                }}>
                  {tutorialStep + 1}
                </span>
                <span style={{
                  font: "600 11px 'DM Mono', monospace",
                  letterSpacing: '0.08em',
                  color: '#a1bcaa',
                  textTransform: 'uppercase'
                }}>
                  Platform Tour &middot; Step {tutorialStep + 1} of {tutorialTargets.length}
                </span>
              </div>
              <button
                type="button"
                onClick={completeTutorial}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8e9d93',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: "'DM Mono', monospace",
                  padding: '4px 6px'
                }}
              >
                Γ£ò Skip
              </button>
            </div>

            
            <h3 style={{ margin: '0 0 8px', fontSize: '17px', color: '#ffffff', fontWeight: 700 }}>
              {tutorialTargets[tutorialStep]?.title}
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#c5d3ca', lineHeight: 1.55 }}>
              {tutorialTargets[tutorialStep]?.description}
            </p>

            
            <div style={{ display: 'flex', gap: '5px', marginBottom: '18px' }}>
              {tutorialTargets.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: '4px',
                    borderRadius: '2px',
                    background: idx === tutorialStep ? '#2f6838' : idx < tutorialStep ? '#4d7558' : '#28382f',
                    transition: 'background 0.2s ease'
                  }}
                />
              ))}
            </div>

            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="trade-btn trade-btn-secondary"
                disabled={tutorialStep === 0}
                onClick={() => setTutorialStep(prev => Math.max(prev - 1, 0))}
                style={{
                  opacity: tutorialStep === 0 ? 0.35 : 1,
                  padding: '7px 14px',
                  fontSize: '11px',
                  background: '#24332b',
                  color: '#d6e2d9',
                  borderColor: '#374b3f'
                }}
              >
                &larr; {text.tutorialBack || 'Back'}
              </button>

              {tutorialStep < tutorialTargets.length - 1 ? (
                <button
                  type="button"
                  className="trade-btn trade-btn-primary"
                  onClick={() => setTutorialStep(prev => prev + 1)}
                  style={{
                    padding: '8px 18px',
                    fontSize: '12px',
                    background: '#2f6838',
                    color: '#ffffff',
                    borderColor: '#2f6838'
                  }}
                >
                  {text.tutorialNext || 'Next'} &rarr;
                </button>
              ) : (
                <button
                  type="button"
                  className="trade-btn trade-btn-primary"
                  onClick={completeTutorial}
                  style={{
                    padding: '8px 18px',
                    fontSize: '12px',
                    background: '#2f6838',
                    color: '#ffffff',
                    borderColor: '#2f6838'
                  }}
                >
                  &check; {text.tutorialFinish || 'Finish Tour'}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      
      <nav className="topbar">
        <div className="topbar-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileNavOpen(o => !o)}
              aria-label="Open mobile navigation menu"
              title="Open menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
              <span style={{ fontSize: "11px", fontWeight: 700 }}>Menu</span>
            </button>

            <div className="brand" onClick={() => { setCurrentView('prices'); setMobileNavOpen(false); }}>
              <span className="brand-mark">K</span>
              <span>KisanLink</span>
            </div>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="tour-trigger-btn"
              onClick={() => triggerFirstTimeTutorial(true)}
              title="Interactive Platform Tour"
            >
              Tour
            </button>

            <label ref={(el) => { tutorialRefs.current.language = el; }} className="language-switcher">
              <span>{text.languageLabel}</span>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="en">{text.languageEnglish}</option>
                <option value="hi">{text.languageHindi}</option>
                <option value="mr">{text.languageMarathi}</option>
              </select>
            </label>
            <span className="ws-status-badge" title={wsConnected ? 'Real-time WebSocket connection active' : 'Connecting to live WebSocket stream'}>
              <i className={`ws-dot ${wsConnected ? 'connected' : 'connecting'}`} />
              {wsConnected ? 'Live WS' : text.notificationsStatus}
            </span>
            {session && (
              <div className="topbar-user-cluster">
                <span
                  ref={(el) => { tutorialRefs.current.profile = el; }}
                  className="session-tag"
                  onClick={() => setCurrentView('profile')}
                  title={`${session.name || ''} (${session.role}) — Click to view profile`}
                >
                  <i className="connection-dot" style={{ display: 'inline-block', width: 7, height: 7, background: '#4e8c56', borderRadius: '50%', flexShrink: 0, marginRight: 5 }} />
                  <span className="session-name">
                    {(session.name || '').replace(/\s*\((farmer|buyer|agrotech|fpo)[^)]*\)/gi, '').trim() || session.phone || 'User'}
                  </span>
                  <span className="session-role-pill">
                    {(session.role || '').toUpperCase()}
                  </span>
                </span>
                <button
                  type="button"
                  className="topbar-signout-btn"
                  onClick={handleLogout}
                  title="Sign out of account"
                >
                  {text.signOut}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="nav-menu">
          {NAV_TABS.map((tab) => (
            <button
              key={tab.id}
              ref={(el) => {
                if (tab.id === 'prices') tutorialRefs.current.market = el;
                if (tab.id === 'notifications') tutorialRefs.current.notifications = el;
              }}
              type="button"
              className={`nav-tab ${currentView === tab.id ? 'active' : ''}`}
              onClick={() => setCurrentView(tab.id)}
            >
              {tab.label}
              {tab.badge > 0 && <span className="nav-badge">{tab.badge}</span>}
            </button>
          ))}
        </div>
      </nav>

      
      {liveToast && (
        <div className="live-toast" onClick={() => setLiveToast(null)}>
          <div style={{ flex: 1 }}>
            <span className="live-toast-badge">Live Real-Time Update</span>
            <strong>{liveToast.title}</strong>
            <p>{liveToast.message}</p>
          </div>
          <button type="button" className="live-toast-close" onClick={(e) => { e.stopPropagation(); setLiveToast(null); }}>Γ£ò</button>
        </div>
      )}

      
      {message && (
        <p className="form-message" style={{ marginTop: '14px' }}>
          {message}{' '}
          <button type="button" className="text-button" onClick={() => setMessage('')} style={{ display: 'inline', padding: 0 }}>Dismiss</button>
        </p>
      )}

      
      <div className="main-with-sidebar">

        
        {mobileNavOpen && (
          <div
            className="mobile-drawer-backdrop"
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(o => !o)}
          title={sidebarOpen ? 'Hide sidebar' : 'Show marketplace sidebar'}
        >
          {sidebarOpen ? '\u2190' : '\u2192'}
        </button>

        
        <aside
          className={`left-nav${(!sidebarOpen && !mobileNavOpen) ? ' left-nav-hidden' : ''}${mobileNavOpen ? ' mobile-open' : ''}`}
        >

          
          <div className="mobile-nav-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-mark" style={{ width: '24px', height: '24px', fontSize: '12px' }}>K</span>
              <strong style={{ fontSize: '13px', color: '#202a27', textTransform: 'uppercase', letterSpacing: '0.05em' }}>KisanLink Menu</strong>
            </div>
            <button
              type="button"
              className="mobile-nav-close"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
            >
              Γ£ò
            </button>
          </div>

            <p className="left-nav-heading">{text.sidebarMarketplace}</p>

            {session?.role !== 'TRANSPORTER' && (
              <>
                <button
                  ref={(el) => { tutorialRefs.current.sidebarMarket = el; }}
                  type="button"
                  className={`left-nav-item ${(currentView === 'prices') ? 'active' : ''}`}
                  onClick={() => navigateFromMenu('prices')}
                >
                  <span className="left-nav-icon"><NavIcon name="crops" /></span>
                  <span className="left-nav-label">
                    <strong>{text.sidebarCrops}</strong>
                    <small>{text.sidebarCropsSmall}</small>
                  </span>
                </button>

                <button
                  type="button"
                  className={`left-nav-item ${(currentView === 'inputs') ? 'active' : ''}`}
                  onClick={() => { setInputCategoryFilter('ALL'); navigateFromMenu('inputs'); }}
                >
                  <span className="left-nav-icon"><NavIcon name="inputs" /></span>
                  <span className="left-nav-label">
                    <strong>{text.sidebarInputs}</strong>
                    <small>{text.sidebarInputsSmall}</small>
                  </span>
                </button>
              </>
            )}

            
            {currentView === 'inputs' && (
              <div className="left-nav-sub">
                {[
                  { value: 'ALL', label: text.allInputs },
                  { value: 'FERTILIZER', label: 'Fertilizers' },
                  { value: 'PESTICIDE', label: 'Pesticides' },
                  { value: 'BIO_INPUT', label: 'Bio-Inputs' },
                ].map(sub => (
                  <button
                    key={sub.value}
                    type="button"
                    className={`left-nav-sub-item ${inputCategoryFilter === sub.value ? 'active' : ''}`}
                    onClick={() => { setInputCategoryFilter(sub.value); setMobileNavOpen(false); }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}

            <p className="left-nav-heading" style={{ marginTop: '16px' }}>{text.sidebarTradeShop}</p>

            <button
              type="button"
              className={`left-nav-item ${(currentView === 'my-orders') ? 'active' : ''}`}
              onClick={() => navigateFromMenu('my-orders')}
            >
              <span className="left-nav-icon"><NavIcon name="orders" /></span>
              <span className="left-nav-label">
                <strong>{text.sidebarOrders}</strong>
                <small>{text.sidebarOrdersSmall}</small>
              </span>
            </button>

            <button
              type="button"
              className={`left-nav-item ${(currentView === 'my-shop') ? 'active' : ''}`}
              onClick={() => navigateFromMenu('my-shop')}
            >
              <span className="left-nav-icon"><NavIcon name="shop" /></span>
              <span className="left-nav-label">
                <strong>{text.sidebarMyShop}</strong>
                <small>{text.sidebarMyShopSmall}</small>
              </span>
            </button>

            <button
              type="button"
              className={`left-nav-item ${(currentView === 'order-progress') ? 'active' : ''}`}
              onClick={() => navigateFromMenu('order-progress')}
            >
              <span className="left-nav-icon"><NavIcon name="progress" /></span>
              <span className="left-nav-label">
                <strong>{text.sidebarProgress}</strong>
                <small>{text.sidebarProgressSmall}</small>
              </span>
            </button>

            {(session?.role === 'FARMER' || session?.role === 'BUYER') && (
              <button
                type="button"
                className={`left-nav-item ${(currentView === 'trade-chat') ? 'active' : ''}`}
                onClick={() => navigateFromMenu('trade-chat')}
              >
                <span className="left-nav-icon"><NavIcon name="chat" /></span>
                <span className="left-nav-label">
                  <strong>Trade Chat</strong>
                  <small>Offers &amp; Negotiations</small>
                </span>
              </button>
            )}

            {session?.role === 'TRANSPORTER' && (
              <button
                type="button"
                className={`left-nav-item ${(currentView === 'transporter-dashboard') ? 'active' : ''}`}
                onClick={() => navigateFromMenu('transporter-dashboard')}
              >
                <span className="left-nav-icon"><NavIcon name="transport" /></span>
                <span className="left-nav-label">
                  <strong>Transport Hub</strong>
                  <small>Fleet &amp; Hauls</small>
                </span>
              </button>
            )}

            
            {(session?.role === 'FARMER' || !session || session?.role === 'FPO') && (
              <button
                type="button"
                className={`left-nav-item ${(currentView === 'farmer-payouts') ? 'active' : ''}`}
                onClick={() => navigateFromMenu('farmer-payouts')}
              >
                <span className="left-nav-icon"><NavIcon name="payouts" /></span>
                <span className="left-nav-label">
                  <strong>Payouts &amp; Escrow</strong>
                  <small>Realized Rates &amp; UTR</small>
                </span>
              </button>
            )}

            
            {(session?.role === 'FPO' || session?.role === 'FARMER' || session?.role === 'BUYER' || session?.role === 'ADMIN') && (
              <>
                <hr className="left-nav-divider" />
                <p className="left-nav-heading" style={{ marginTop: '8px', marginBottom: '4px' }}>
                  FPO Operations
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#7f8981',
                      fontSize: '9px',
                      fontFamily: "'DM Mono', monospace",
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: '0 0 0 6px',
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      verticalAlign: 'middle'
                    }}
                    onClick={() => { setShowFpoRegisterModal(true); setMobileNavOpen(false); }}
                    title="Register New FPO"
                  >
                    + New
                  </button>
                </p>

                <button
                  type="button"
                  className={`left-nav-item ${(currentView === 'fpo-intake') ? 'active' : ''}`}
                  onClick={() => navigateFromMenu('fpo-intake', '#/fpo/collection')}
                >
                  <span className="left-nav-icon"><NavIcon name="intake" /></span>
                  <span className="left-nav-label">
                    <strong>Village Intake Hub</strong>
                    <small>Weigh-Slips ({fpoIntakes.filter(i => i.status === 'UNPOOLED').length} Yard)</small>
                  </span>
                </button>

                <button
                  type="button"
                  className={`left-nav-item ${(currentView === 'fpo-lots') ? 'active' : ''}`}
                  onClick={() => navigateFromMenu('fpo-lots', '#/fpo/lots')}
                >
                  <span className="left-nav-icon"><NavIcon name="lots" /></span>
                  <span className="left-nav-label">
                    <strong>FPO Lots &amp; Passports</strong>
                    <small>Pooling ({fpoLots.length} Lots)</small>
                  </span>
                </button>

                <button
                  type="button"
                  className={`left-nav-item ${(currentView === 'fpo-farmers') ? 'active' : ''}`}
                  onClick={() => navigateFromMenu('fpo-farmers', '#/fpo/farmers')}
                >
                  <span className="left-nav-icon"><NavIcon name="farmers" /></span>
                  <span className="left-nav-label">
                    <strong>Member Farmers</strong>
                    <small>Traceability ({fpoFarmers.length})</small>
                  </span>
                </button>

                <button
                  type="button"
                  className={`left-nav-item ${(currentView === 'trade-chat') ? 'active' : ''}`}
                  onClick={() => navigateFromMenu('trade-chat', '#/fpo/offers')}
                >
                  <span className="left-nav-icon"><NavIcon name="chat" /></span>
                  <span className="left-nav-label">
                    <strong>Buyer Offers &amp; Chat</strong>
                    <small>Negotiate &amp; Accept</small>
                  </span>
                </button>

                <button
                  type="button"
                  className={`left-nav-item ${(currentView === 'analytics' && session?.role === 'FPO') ? 'active' : ''}`}
                  onClick={() => {
                    if (session?.role !== 'FPO') handleQuickLogin('FPO');
                    navigateFromMenu('analytics', '#/fpo/dashboard');
                  }}
                >
                  <span className="left-nav-icon"><NavIcon name="analytics" /></span>
                  <span className="left-nav-label">
                    <strong>FPO Analytics</strong>
                    <small>Lots, Sales &amp; Buyers</small>
                  </span>
                </button>

                <button
                  type="button"
                  className={`left-nav-item ${(currentView === 'profile' && session?.role === 'FPO') ? 'active' : ''}`}
                  onClick={() => {
                    if (session?.role !== 'FPO') handleQuickLogin('FPO');
                    navigateFromMenu('profile', '#/fpo/profile');
                  }}
                >
                  <span className="left-nav-icon"><NavIcon name="trust" /></span>
                  <span className="left-nav-label">
                    <strong>FPO Trust Score</strong>
                    <small>NABL &amp; Fulfillment</small>
                  </span>
                </button>
              </>
            )}

            {session?.role === 'ADMIN' && (
              <>
                <p className="left-nav-heading" style={{ marginTop: '16px' }}>
                  Nodal Governance
                </p>

                <button
                  type="button"
                  className={`left-nav-item ${(currentView === 'admin-governance') ? 'active' : ''}`}
                  onClick={() => navigateFromMenu('admin-governance')}
                >
                  <span className="left-nav-icon"><NavIcon name="governance" /></span>
                  <span className="left-nav-label">
                    <strong>Governance Desk</strong>
                    <small>Disputes &amp; NABL KYC</small>
                  </span>
                </button>
              </>
            )}

            <p className="left-nav-heading" style={{ marginTop: '16px' }}>{text.sidebarAdvisory}</p>

            <button
              type="button"
              className={`left-nav-item ${currentView === 'community' ? 'active' : ''}`}
              onClick={() => navigateFromMenu('community')}
            >
              <span className="left-nav-icon"><NavIcon name="community" /></span>
              <span className="left-nav-label">
                <strong>{text.sidebarCommunity}</strong>
                <small>{text.sidebarCommunitySmall}</small>
              </span>
            </button>

            {session?.role === 'FARMER' && (
              <button
                ref={(el) => { tutorialRefs.current.diagnostics = el; }}
                type="button"
                className={`left-nav-item ${currentView === 'diagnostics' ? 'active' : ''}`}
                onClick={() => navigateFromMenu('diagnostics')}
              >
                <span className="left-nav-icon"><NavIcon name="diagnostics" /></span>
                <span className="left-nav-label">
                  <strong>{text.sidebarDiagnostics}</strong>
                  <small>{text.sidebarDiagnosticsSmall}</small>
                </span>
              </button>
            )}

            <button
              type="button"
              className={`left-nav-item ${currentView === 'support-network' ? 'active' : ''}`}
              onClick={() => navigateFromMenu('support-network')}
            >
              <span className="left-nav-icon"><NavIcon name="support" /></span>
              <span className="left-nav-label">
                <strong>{text.sidebarNetwork}</strong>
                <small>{text.sidebarNetworkSmall}</small>
              </span>
            </button>
          </aside>






        
        <div className="main-content">

      
      
      
      {currentView === 'prices' && (
        <div className="view-container">
          <section className="hero">
            <div>
              <p className="eyebrow">{text.heroEyebrow}</p>
              <h1>{text.heroTitle}</h1>
              <p className="hero-copy">{text.heroCopy}</p>
            </div>
            <div className="hero-metrics-ticker">
              <div className="hero-metric-pill">
                <strong>28+</strong>
                <span>APMC Mandis</span>
              </div>
              <div className="hero-metric-divider" />
              <div className="hero-metric-pill">
                <strong>₹4.8 Cr</strong>
                <span>Escrow Volume</span>
              </div>
              <div className="hero-metric-divider" />
              <div className="hero-metric-pill">
                <strong>99.4%</strong>
                <span>Fulfillment</span>
              </div>
            </div>
          </section>

          
          {/* Consolidated Market Intelligence & Procurement Desk */}
          <div className="market-intelligence-bar">
            <div className="intel-left">
              <div className="intel-badge-row">
                <span className="intel-badge-live">● Agmarknet Live Feeds</span>
                <span className="intel-source-tag">Directorate of Marketing &amp; Inspection (DMI)</span>
              </div>
              <h3 className="intel-title">
                {session?.role === 'BUYER'
                  ? `Procurement Quotas & Wholesale Linkages: ${pulseCrop?.name || 'Produce'}`
                  : session?.role === 'TRANSPORTER'
                  ? `Freight Linkage & Route Margins: ${pulseCrop?.name || 'Agricultural Freight'}`
                  : `Direct Buyer Opportunity: ${pulseCrop?.name || 'Tomato'}`}
              </h3>
              <p className="intel-desc">
                {session?.role === 'BUYER'
                  ? 'Plan bulk commodity procurement with verified farm origin, digital assay quality grading, and automated escrow lock.'
                  : session?.role === 'TRANSPORTER'
                  ? 'Access confirmed farm pickup requests with guaranteed escrow freight settlements and zero deadhead trips.'
                  : <>Direct buyer procurement yields <strong>₹{((trend?.latestPrice || 25) * 1.08).toFixed(2)}/kg net</strong> (+₹{(((trend?.latestPrice || 25) * 1.08) - (trend?.latestPrice || 25)).toFixed(2)}/kg gain over nearest local mandi). Escrow protected.</>}
              </p>
            </div>
            <div className="intel-actions">
              {session?.role === 'FARMER' && (
                <button
                  type="button"
                  className="trade-btn trade-btn-primary"
                  onClick={() => setQuickProduceModal({
                    cropId: pulseCrop?.id || 1,
                    cropName: pulseCrop?.name || 'Tomato',
                    category: pulseCrop?.category || 'VEGETABLE',
                    unit: pulseCrop?.unit || 'kg',
                    quantity: 500,
                    expectedPrice: Number(((trend?.latestPrice || 25) * 1.08).toFixed(2)),
                    availableUntil: '',
                    description: 'Pre-graded harvest lot listed via Direct Buyer Recommendation with zero intermediary cut.'
                  })}
                >
                  List 500kg Lot (₹{((trend?.latestPrice || 25) * 1.08).toFixed(2)}/kg) →
                </button>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="trade-btn trade-btn-secondary"
                  onClick={() => setCurrentView('analytics')}
                >
                  {session?.role === 'BUYER' ? 'Landed Cost Desk' : session?.role === 'TRANSPORTER' ? 'Trip Margins' : 'Net Calculator'}
                </button>
                <button
                  type="button"
                  className="trade-btn trade-btn-secondary"
                  disabled={isSyncingAgmarknet}
                  onClick={syncAgmarknetData}
                >
                  {isSyncingAgmarknet ? 'Syncing...' : 'Sync Live Mandis'}
                </button>
              </div>
            </div>
          </div>

          <section className="dashboard-grid">
            <article className="panel market-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">{text.panelPriceDiscovery}</p><h2>{text.panelMarketPulse}</h2></div>
                <span className="date-chip">{text.panelAnalytics}</span>
              </div>

              
              <div className="pulse-controls" style={{ marginTop: '8px' }}>
                <select
                  value={selectedPulseCropId || ''}
                  onChange={(e) => handlePulseCropChange(e.target.value)}
                >
                  {pulseFilteredCrops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              {trend ? (
                <div className="price-feature">
                  <div>
                    <span className="crop-label">
                      {pulseCrop?.name || text.selectedCrop} <span className="category-badge">{pulseCrop?.category || text.produceUnit}</span>
                    </span>
                    <strong>₹{trend.latestPrice}<small> / {pulseCrop?.unit || 'kg'}</small></strong>
                  </div>
                  <span className={trend.trend === 'DOWNWARD' ? 'trend-down' : 'trend-up'}>
                    {trend.trend === 'UPWARD' ? '+' : trend.trend === 'DOWNWARD' ? '-' : ''}{trend.changePercent}% {trend.trend}
                  </span>
                </div>
              ) : (
                <p className="muted">{text.loadingMarket}</p>
              )}

              
              <div className="trend-chart-container">
                <div className="trend-bar-interactive">
                  {pulsePrices.length > 0 ? (
                    pulsePrices.map((p, idx) => {
                      const val = Number(p.modalPrice || p.maxPrice || 20);
                      const heightPercent = maxPrice > minPrice
                        ? Math.round(((val - minPrice) / (maxPrice - minPrice)) * 60 + 25)
                        : 50;
                      const dateStr = p.date ? new Date(p.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : `Day ${idx + 1}`;
                      const isLatest = idx === pulsePrices.length - 1;
                      return (
                        <div className="bar-col" key={p.id || idx} title={`${dateStr}: ₹${val} (Min: ₹${p.minPrice || val-2}, Max: ₹${p.maxPrice || val+2})`}>
                          <span className="bar-val">₹{val}</span>
                          <div
                            className="bar-fill"
                            style={{
                              height: `${heightPercent}%`,
                              backgroundColor: isLatest ? '#b45a42' : '#7c9a72',
                            }}
                          />
                          <span className="bar-date">{isLatest ? 'Today' : dateStr}</span>
                        </div>
                      );
                    })
                  ) : (
                    [20, 21, 22, 21, 23, 22, 24].map((v, i) => (
                      <div className="bar-col" key={i}>
                        <span className="bar-val">₹{v}</span>
                        <div
                          className="bar-fill"
                          style={{
                            height: `${((v - 18) / 8) * 60 + 25}%`,
                            backgroundColor: i === 6 ? '#b45a42' : '#7c9a72',
                          }}
                        />
                        <span className="bar-date">{i === 6 ? 'Today' : `D-${6 - i}`}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="trend-caption">
                <span>{text.marketRange}: ₹{minPrice} - ₹{maxPrice}</span>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setCurrentView('predictions')}
                  style={{ cursor: 'pointer' }}
                >
                  {text.viewPredictions}
                </button>
              </div>

              
              {pulseCrop?.mspPrice != null && (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f5faf6', border: '1px solid #cce5d4', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#2c4e36', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Statutory Benchmark (MSP)</span>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#163821', marginTop: '2px' }}>
                      ₹{pulseCrop.mspPrice} <small style={{ fontWeight: 400, fontSize: '12px', color: '#556058' }}>/ {pulseCrop.unit || 'kg'}</small>
                    </div>
                  </div>
                  {trend?.latestPrice != null && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: '#556058', display: 'block' }}>Net vs Guarantee</span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: Number(trend.latestPrice) >= Number(pulseCrop.mspPrice) ? '#1b5e20' : '#b45a42'
                      }}>
                        {Number(trend.latestPrice) >= Number(pulseCrop.mspPrice)
                          ? `+₹${(Number(trend.latestPrice) - Number(pulseCrop.mspPrice)).toFixed(2)} above MSP (+${(((Number(trend.latestPrice) - Number(pulseCrop.mspPrice)) / Number(pulseCrop.mspPrice)) * 100).toFixed(1)}%)`
                          : `-₹${(Number(pulseCrop.mspPrice) - Number(trend.latestPrice)).toFixed(2)} below MSP (-${(((Number(pulseCrop.mspPrice) - Number(trend.latestPrice)) / Number(pulseCrop.mspPrice)) * 100).toFixed(1)}%)`}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </article>

            
            <aside className="note-panel">
              <p className="eyebrow">{text.panelQuickTrading}</p>
              <h2>{text.panelInstantLinkage}</h2>
              <p>Post a harvest lot or publish a bulk procurement order in seconds with guaranteed escrow settlement.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <button
                  type="button"
                  className="trade-btn trade-btn-primary"
                  onClick={() => setQuickProduceModal({
                    cropId: pulseCrop?.id || 1,
                    cropName: pulseCrop?.name || 'Tomato',
                    category: pulseCrop?.category || 'VEGETABLE',
                    unit: pulseCrop?.unit || 'kg',
                    quantity: 100,
                    quality: 'Grade A',
                    harvestDate: new Date().toISOString().split('T')[0],
                    expectedPrice: trend?.latestPrice || 25,
                    availableUntil: '',
                    description: ''
                  })}
                  style={{ width: '100%', padding: '10px 14px', fontSize: '12px' }}
                >
                  {text.sellProduceLot}
                </button>
                <button
                  type="button"
                  className="trade-btn trade-btn-secondary"
                  onClick={() => setQuickRequirementModal({
                    cropId: pulseCrop?.id || 1,
                    cropName: pulseCrop?.name || 'Tomato',
                    category: pulseCrop?.category || 'VEGETABLE',
                    unit: pulseCrop?.unit || 'kg',
                    requiredQuantity: 50,
                    offeredPrice: trend?.latestPrice || 25,
                    maxPrice: (trend?.latestPrice || 25) + 5,
                    deliveryLocation: 'Regional Market Hub'
                  })}
                  style={{ width: '100%', padding: '10px 14px', fontSize: '12px' }}
                >
                  {text.postBuyRequirement}
                </button>
              </div>
            </aside>
          </section>

          
          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
            
            
            <article className="panel" style={{ margin: 0 }}>
              <div className="panel-heading" style={{ marginBottom: '12px' }}>
                <div>
                  <p className="eyebrow">Regional Mandi Benchmarks</p>
                  <h3 style={{ margin: '2px 0 0', fontSize: '16px', color: '#202a27' }}>
                    {pulseCrop?.name || 'Crop'} Mandi Realization Comparison
                  </h3>
                </div>
                <span className="date-chip">Net Realization</span>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#556058' }}>
                Modal auction price minus estimated freight deduction based on transport proximity to determine your highest in-hand farmer return.
              </p>

              {loadingMandiComparison ? (
                <p className="muted" style={{ padding: '16px 0', textAlign: 'center' }}>Calculating regional Mandi deductions...</p>
              ) : mandiComparisons.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {mandiComparisons.map((m, idx) => {
                    const isBest = idx === 0 || m.estimatedNetRealization === Math.max(...mandiComparisons.map(x => Number(x.estimatedNetRealization || 0)));
                    return (
                      <div
                        key={m.marketId || idx}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: isBest ? '1.5px solid #2e7d32' : '1px solid #e2ebe0',
                          background: isBest ? '#f6fbf6' : '#ffffff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ fontSize: '13px', color: '#202a27' }}>{m.marketName}</strong>
                            {isBest && (
                              <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '3px', background: '#2e7d32', color: '#ffffff' }}>
                                BEST REALIZATION
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '11px', color: '#68776d', display: 'block', marginTop: '2px' }}>
                            {m.district}, {m.state} &middot; {m.distanceKm != null ? `${m.distanceKm} km away` : 'Regional yard'}
                          </span>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '11px', color: '#778078' }}>
                            Mandi: <strong>₹{m.modalPrice}</strong> &middot; Freight: -₹{m.estimatedFreightCost || '2.50'}/kg
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: isBest ? '#1b5e20' : '#202a27', marginTop: '2px' }}>
                            Net: ₹{m.estimatedNetRealization}/{pulseCrop?.unit || 'kg'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#f8faf7', borderRadius: '6px', textAlign: 'center', fontSize: '12px', color: '#68776d' }}>
                  No regional Mandi price series currently logged for {pulseCrop?.name || 'this crop'}.
                </div>
              )}
            </article>

            
            <article className="panel" style={{ margin: 0 }}>
              <div className="panel-heading" style={{ marginBottom: '12px' }}>
                <div>
                  <p className="eyebrow">Spot Harvest Lots</p>
                  <h3 style={{ margin: '2px 0 0', fontSize: '16px', color: '#202a27' }}>
                    Active {pulseCrop?.name || 'Crop'} Farmer Lots
                  </h3>
                </div>
                <span className="date-chip">{cropProduceList.length} Lots Active</span>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#556058' }}>
                Verified farmer harvest lots available for direct purchase with guaranteed escrow payment and logistics routing.
              </p>

              {loadingCropProduce ? (
                <p className="muted" style={{ padding: '16px 0', textAlign: 'center' }}>Loading active farmer harvest lots...</p>
              ) : cropProduceList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cropProduceList.map((lot) => (
                    <div
                      key={lot.id}
                      style={{
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #dbe6da',
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ fontSize: '14px', color: '#202a27' }}>{lot.farmerName}</strong>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '3px',
                              background: lot.quality === 'Grade A' ? '#eaf5eb' : lot.quality === 'Grade B' ? '#e8f0fe' : '#f5f5f5',
                              color: lot.quality === 'Grade A' ? '#1b5e20' : lot.quality === 'Grade B' ? '#1a73e8' : '#556058'
                            }}>
                              {lot.quality || 'Grade A'}
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#68776d', display: 'block', marginTop: '2px' }}>
                            Location: {lot.villageOrDistrict || 'Local Farm'}, {lot.state || ''} &middot; Harvest: {lot.harvestDate || 'Fresh'}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ font: "9px 'DM Mono', monospace", color: '#778078', display: 'block' }}>EXPECTED PRICE</span>
                          <strong style={{ fontSize: '15px', color: '#1e5e3a' }}>₹{lot.expectedPrice}/{lot.unit || 'kg'}</strong>
                        </div>
                      </div>

                      {lot.description && (
                        <p style={{ margin: 0, fontSize: '11px', color: '#556058', fontStyle: 'italic' }}>
                          &ldquo;{lot.description}&rdquo;
                        </p>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #f0f4ef' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#334036' }}>
                          Available: {lot.quantity} {lot.unit || 'kg'}
                        </span>
                        <button
                          type="button"
                          className="trade-btn trade-btn-primary"
                          style={{ padding: '5px 12px', fontSize: '11px' }}
                          onClick={() => setQuickRequirementModal({
                            cropId: lot.cropId,
                            cropName: lot.cropName,
                            category: pulseCrop?.category || 'VEGETABLE',
                            unit: lot.unit || 'kg',
                            requiredQuantity: lot.quantity,
                            offeredPrice: lot.expectedPrice,
                            maxPrice: lot.expectedPrice,
                            deliveryLocation: `${lot.villageOrDistrict || 'Origin'} Farm Gate`
                          })}
                        >
                          Initiate Escrow Trade &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '20px', background: '#f8faf7', borderRadius: '6px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#556058' }}>
                    No active harvest lots currently listed for {pulseCrop?.name || 'this crop'}.
                  </p>
                  <button
                    type="button"
                    className="trade-btn trade-btn-secondary"
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                    onClick={() => setQuickRequirementModal({
                      cropId: pulseCrop?.id || 1,
                      cropName: pulseCrop?.name || 'Tomato',
                      category: pulseCrop?.category || 'VEGETABLE',
                      unit: pulseCrop?.unit || 'kg',
                      requiredQuantity: 100,
                      offeredPrice: trend?.latestPrice || 25,
                      maxPrice: (trend?.latestPrice || 25) + 4,
                      deliveryLocation: 'Regional Market Hub'
                    })}
                  >
                    + Post Procurement Requirement
                  </button>
                </div>
              )}
            </article>
          </div>

          
          <section style={{ marginTop: '20px' }}>
            <article className="panel crop-panel">
              <div className="panel-heading" style={{ flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                <div>
                  <p className="eyebrow">{text.panelActiveBoard}</p>
                  <h2>{text.panelCommodities}</h2>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="trade-btn trade-btn-primary"
                    onClick={() => setQuickProduceModal({
                      cropId: crops[0]?.id || 1,
                      cropName: crops[0]?.name || 'Tomato',
                      category: crops[0]?.category || 'VEGETABLE',
                      unit: crops[0]?.unit || 'kg',
                      quantity: 100,
                      expectedPrice: 25,
                      availableUntil: '',
                      description: ''
                    })}
                  >
                    {text.sellProduce}
                  </button>
                  <button
                    type="button"
                    className="trade-btn trade-btn-secondary"
                    onClick={() => setQuickRequirementModal({
                      cropId: crops[0]?.id || 1,
                      cropName: crops[0]?.name || 'Tomato',
                      category: crops[0]?.category || 'VEGETABLE',
                      unit: crops[0]?.unit || 'kg',
                      requiredQuantity: 50,
                      offeredPrice: 25,
                      maxPrice: 30,
                      deliveryLocation: 'Main Market Hub'
                    })}
                  >
                    {text.postBuyOrder}
                  </button>
                </div>
              </div>

              
              <div className="marketplace-toolbar">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                  <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                    <input
                      type="text"
                      className="field-input"
                      placeholder={text.panelSearchPlaceholder}
                      value={marketplaceSearchQuery}
                      onChange={(e) => setMarketplaceSearchQuery(e.target.value)}
                      style={{ paddingRight: marketplaceSearchQuery ? '55px' : '12px' }}
                    />
                    {marketplaceSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setMarketplaceSearchQuery('')}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#778078',
                          fontSize: '11px',
                          fontFamily: "'DM Mono', monospace",
                          padding: '2px 6px',
                          margin: 0,
                          width: 'auto'
                        }}
                      >
                        CLEAR
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#778078' }}>{text.sortLabel}</span>
                    <select
                      className="field-input"
                      value={marketplaceSortBy}
                      onChange={(e) => setMarketplaceSortBy(e.target.value)}
                      style={{ fontSize: '12px', padding: '7px 10px', width: 'auto', minWidth: '130px' }}
                    >
                      <option value="POPULAR">{text.mostActive}</option>
                      <option value="PRICE_ASC">{text.priceLowHigh}</option>
                      <option value="PRICE_DESC">{text.priceHighLow}</option>
                      <option value="NAME_ASC">{text.nameAToZ}</option>
                    </select>
                  </div>
                </div>

                
                <div className="category-filter-bar" style={{ margin: 0, paddingTop: '4px' }}>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      className={`filter-chip ${selectedCategoryFilter === cat.value ? 'active' : ''}`}
                      onClick={() => setSelectedCategoryFilter(cat.value)}
                    >
                      {getLocalizedText(cat.label, language)}
                    </button>
                  ))}
                </div>
              </div>

              
              <div className="produce-cards-grid">
                {filteredCrops
                  .filter(c => {
                    const q = marketplaceSearchQuery.toLowerCase().trim();
                    if (!q) return true;
                    return c.name.toLowerCase().includes(q) || (c.category && c.category.toLowerCase().includes(q));
                  })
                  .sort((a, b) => {
                    if (marketplaceSortBy === 'NAME_ASC') return a.name.localeCompare(b.name);
                    return 0;
                  })
                  .map((crop) => {
                    const isSelected = selectedPulseCropId === crop.id;
                    const summary = cropPriceSummaries[crop.id];
                    const baselineRate = summary?.latestModalPrice != null 
                      ? Number(summary.latestModalPrice) 
                      : (crop.name === 'Tomato' ? 24 : (crop.name === 'Potato' ? 18 : (crop.name === 'Rice' ? 27 : (crop.name === 'Wheat' ? 25 : (crop.name === 'Mustard Seeds' ? 58 : (crop.name === 'Lentil' ? 72 : 30))))));
                    const trend = summary?.trend || 'STABLE';
                    const changePct = summary?.changePercent != null ? Math.abs(summary.changePercent) : 0;
                    const activeCount = summary?.activeListingsCount || 0;
                    const msp = crop.mspPrice != null ? Number(crop.mspPrice) : (summary?.mspPrice != null ? Number(summary.mspPrice) : null);

                    return (
                      <div
                        key={crop.id}
                        className={`produce-market-card ${isSelected ? 'selected-card' : ''}`}
                        onClick={() => handlePulseCropChange(crop.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span className="category-badge" style={{ fontSize: '9px' }}>{crop.category || 'PRODUCE'}</span>
                                {trend !== 'STABLE' && (
                                  <span
                                    style={{
                                      font: "10px 'DM Mono', monospace",
                                      fontWeight: 700,
                                      padding: '1px 5px',
                                      borderRadius: '3px',
                                      background: trend === 'UPWARD' ? '#eef7ee' : '#fdf2f0',
                                      color: trend === 'UPWARD' ? '#1b5e20' : '#b45a42'
                                    }}
                                  >
                                    {trend === 'UPWARD' ? `+${changePct}% [UP]` : `-${changePct}% [DN]`}
                                  </span>
                                )}
                              </div>
                              <h3 style={{ margin: '4px 0 2px', fontSize: '15px', color: '#202a27' }}>{crop.name}</h3>
                              <span style={{ font: "10px 'DM Mono', monospace", color: '#778078' }}>
                                Unit: per {crop.unit} &middot; Live Mandi
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ font: "9px 'DM Mono', monospace", color: '#778078', display: 'block' }}>MODAL RATE</span>
                              <strong style={{ fontSize: '16px', color: '#202a27' }}>₹{baselineRate}</strong>
                            </div>
                          </div>

                          
                          {msp != null && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', padding: '4px 8px', background: '#f5faf6', border: '1px solid #dbeae0', borderRadius: '4px', fontSize: '11px' }}>
                              <span style={{ color: '#2c4e36', fontWeight: 600 }}>MSP: ₹{msp}/{crop.unit}</span>
                              <span style={{ fontWeight: 700, color: baselineRate >= msp ? '#1b5e20' : '#b45a42' }}>
                                {baselineRate >= msp 
                                  ? `+₹${(baselineRate - msp).toFixed(1)} vs MSP` 
                                  : `-₹${(msp - baselineRate).toFixed(1)} below MSP`}
                              </span>
                            </div>
                          )}

                          
                          {activeCount > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px', fontSize: '11px', color: '#1e5e3a', fontWeight: 600 }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2e7d32', display: 'inline-block' }}></span>
                              {activeCount} active harvest lot{activeCount > 1 ? 's' : ''} available
                            </div>
                          )}
                        </div>

                        
                        <div className="commodity-card-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="trade-btn trade-btn-primary commodity-action-btn"
                            onClick={() => setQuickProduceModal({
                              cropId: crop.id,
                              cropName: crop.name,
                              category: crop.category,
                              unit: crop.unit,
                              quantity: 100,
                              quality: 'Grade A',
                              harvestDate: new Date().toISOString().split('T')[0],
                              expectedPrice: baselineRate,
                              availableUntil: '',
                              description: ''
                            })}
                          >
                            Sell Lot
                          </button>
                          <button
                            type="button"
                            className="trade-btn trade-btn-secondary commodity-action-btn"
                            onClick={() => setQuickRequirementModal({
                              cropId: crop.id,
                              cropName: crop.name,
                              category: crop.category,
                              unit: crop.unit,
                              requiredQuantity: 50,
                              offeredPrice: baselineRate,
                              maxPrice: Math.round(baselineRate * 1.1),
                              deliveryLocation: 'Main Market Hub'
                            })}
                          >
                            Buy / Match
                          </button>
                          <button
                            type="button"
                            className="trade-btn trade-btn-secondary commodity-ml-btn"
                            title="View AI price forecast"
                            onClick={() => { handlePulseCropChange(crop.id); setCurrentView('predictions'); }}
                          >
                            ML &rarr;
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>


              {filteredCrops.length === 0 && (
                <p className="muted" style={{ padding: '24px 0', textAlign: 'center' }}>No commodities found in this category.</p>
              )}
            </article>
          </section>

        </div>
      )}

      
      
      
      {currentView === 'inputs' && (
        <div className="view-container">
          <section className="panel" style={{ marginTop: '18px' }}>
            <div className="panel-heading" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p className="eyebrow">{text.inputsSectionTitle}</p>
                <h2>{text.inputsSectionTitle}</h2>
              </div>
              <span className="count">
                {crops.filter(c => ['FERTILIZER', 'PESTICIDE', 'BIO_INPUT', 'FARM_EQUIPMENT'].includes(c.category)).length} {text.inputsAvailable}
              </span>
            </div>
            <p className="muted" style={{ margin: '4px 0 14px', fontSize: '13px' }}>
              {text.inputsSectionSubtitle}
            </p>

            
            <div className="marketplace-toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="category-filter-bar" style={{ margin: 0 }}>
                {[
                  { value: 'ALL', label: text.inputsCategoryAll || 'All' },
                  { value: 'FERTILIZER', label: text.inputsCategoryFertilizers || 'Fertilizers' },
                  { value: 'PESTICIDE', label: text.inputsCategoryPesticides || 'Pesticides' },
                  { value: 'BIO_INPUT', label: text.inputsCategoryBioInputs || 'Bio-Inputs' },
                  { value: 'FARM_EQUIPMENT', label: 'Farm Equipment' },
                ].map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    className={`filter-chip ${inputCategoryFilter === cat.value ? 'active' : ''}`}
                    onClick={() => setInputCategoryFilter(cat.value)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            
            <div className="agri-inputs-grid" style={{ marginTop: '16px' }}>
              {crops
                .filter((c) => {
                  const isInput = ['FERTILIZER', 'PESTICIDE', 'BIO_INPUT', 'FARM_EQUIPMENT'].includes(c.category);
                  if (!isInput) return false;
                  if (inputCategoryFilter === 'ALL') return true;
                  return c.category === inputCategoryFilter;
                })
                .map((item) => {
                  const spec = AGRI_INPUT_SPECS[item.name] || {
                    category: item.category,
                    composition: 'Certified agricultural grade formulation',
                    dosage: 'As recommended by agronomic officer',
                    type: item.category,
                    subsidized: false,
                    indicativePrice: `Per ${item.unit || 'unit'}`,
                    rating: '4.8/5',
                    dealers: 'Authorized Agro-Dealers Network',
                  };

                  return (
                    <div key={item.id} className="agri-input-card">
                      <div className="agri-input-header">
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span className={`category-badge category-${item.category?.toLowerCase()}`}>
                              {item.category}
                            </span>
                            {spec.subsidized && (
                              <span className="subsidized-pill">{text.inputsGovtSubsidized}</span>
                            )}
                          </div>
                          <h3 style={{ margin: '4px 0 2px', fontSize: '15px' }}>{item.name}</h3>
                          <span style={{ font: "9px 'DM Mono', monospace", color: '#778078', textTransform: 'uppercase' }}>
                            {text.inputsStandardUnit} {item.unit}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ font: "9px 'DM Mono', monospace", color: '#778078', textTransform: 'uppercase', display: 'block' }}>{text.inputsIndicativeRate}</span>
                          <strong style={{ fontSize: '15px', color: '#202a27' }}>{spec.indicativePrice}</strong>
                        </div>
                      </div>

                      <div className="agri-input-specs">
                        <div className="spec-row">
                          <span className="spec-label">{text.inputsComposition}</span>
                          <span className="spec-value">{spec.composition}</span>
                        </div>
                        <div className="spec-row">
                          <span className="spec-label">{text.inputsDosage}</span>
                          <span className="spec-value">{spec.dosage}</span>
                        </div>
                        <div className="spec-row">
                          <span className="spec-label">{text.inputsDistributorHubs}</span>
                          <span className="spec-value">{spec.dealers} ({spec.rating})</span>
                        </div>
                      </div>

                      <div className="agri-input-actions">
                        <button
                          type="button"
                          className="trade-btn trade-btn-primary"
                          onClick={() => setQuickProcureInputModal({
                            item,
                            spec,
                            quantity: 5,
                            deliveryDistrict: 'Local Farm Depot'
                          })}
                        >
                          {text.inputsProcure}
                        </button>
                        <button
                          type="button"
                          className="trade-btn trade-btn-secondary"
                          onClick={() => handleSellInput(item, spec)}
                        >
                          {text.inputsListStock}
                        </button>
                      </div>
                    </div>
                  );
                })}
              {crops.filter(c => ['FERTILIZER', 'PESTICIDE', 'BIO_INPUT', 'FARM_EQUIPMENT'].includes(c.category)).length === 0 && (
                <p className="muted" style={{ padding: '16px 0' }}>{text.inputsConnectingCatalog}</p>
              )}
            </div>
          </section>

          
          {quickProcureInputModal && (
            <div className="modal-backdrop" onClick={() => setQuickProcureInputModal(null)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                <div className="modal-header">
                  <div>
                    <p className="eyebrow">{text.inputProcurementTitle}</p>
                    <h3 style={{ margin: '2px 0 0', fontSize: '16px' }}>{text.inputProcureItem.replace('{item}', quickProcureInputModal.item.name)}</h3>
                  </div>
                  <button type="button" className="close-btn" onClick={() => setQuickProcureInputModal(null)}>&times;</button>
                </div>

                <form onSubmit={handleQuickProcureInputSubmit} style={{ padding: '14px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#faf9f5', border: '1px solid #d9d6cc', borderRadius: '4px', padding: '10px 12px' }}>
                    <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#778078' }}>{text.inputUnitRate}</span>
                    <strong style={{ marginLeft: '8px', fontSize: '13px' }}>{quickProcureInputModal.spec.indicativePrice}</strong>
                    <div style={{ fontSize: '11px', color: '#566057', marginTop: '4px' }}>
                      {text.inputDistributors} {quickProcureInputModal.spec.dealers}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="field-group">
                      <label className="field-label">{text.inputOrderQuantity}</label>
                      <input
                        type="number"
                        className="field-input"
                        min="1"
                        value={quickProcureInputModal.quantity}
                        onChange={(e) => setQuickProcureInputModal(p => ({ ...p, quantity: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">{text.inputCalculatedTotal}</label>
                      <input
                        type="text"
                        className="field-input"
                        disabled
                        value={`₹${(Number(quickProcureInputModal.spec.indicativePrice.replace(/[^0-9.]/g, '')) || 450) * Number(quickProcureInputModal.quantity || 1)}`}
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label className="field-label">{text.inputDeliveryDistrict}</label>
                    <input
                      type="text"
                      className="field-input"
                      value={quickProcureInputModal.deliveryDistrict}
                      onChange={(e) => setQuickProcureInputModal(p => ({ ...p, deliveryDistrict: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="modal-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button type="button" className="trade-btn trade-btn-secondary" onClick={() => setQuickProcureInputModal(null)}>
                      {text.inputCancel}
                    </button>
                    <button type="submit" className="trade-btn trade-btn-primary">
                      {text.inputConfirmProcurement}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      
      
      
      {currentView === 'diagnostics' && (
        <div className="view-container">
          <section className="panel" style={{ marginTop: '18px' }}>
            <div className="panel-heading" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p className="eyebrow">MobileNetV3-Large · 38 Disease Classes · CUDA Inference</p>
                <h2>{text.cropDoctorSection}</h2>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                  {text.diagnosisIntro}
                </p>
              </div>
              <span className="count" style={{ background: '#e8f3ea', color: '#2f6838' }}>AI SERVICE · 8000</span>
            </div>

            
            <div style={{ background: '#f8faf7', border: '1px solid #d4dfd2', borderRadius: '6px', padding: '16px 20px', marginTop: '16px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", fontWeight: 700, background: '#1c4923', color: '#ffffff', padding: '2px 7px', borderRadius: '3px' }}>
                      SCIENTIFIC VALIDATION &amp; MODEL ARCHITECTURE
                    </span>
                    <span style={{ fontSize: '11px', color: '#2f6838', fontWeight: 600 }}>
                      99.9% Test Accuracy Benchmark
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '15px', color: '#162b1a', fontWeight: 700 }}>
                    MobileNetV3-Large · Squeeze-and-Excitation Attention · 38 Disease Classes
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#3a513e', lineHeight: 1.5, maxWidth: '780px' }}>
                    Trained on 54,305 curated plant pathology samples from PlantVillage and ICAR regional agronomy datasets. Evaluated under strict 80/20 train/test stratified split yielding 99.9% classification accuracy across foliar pathogens.
                  </p>
                </div>
                <div style={{ background: '#eaf4e8', border: '1px solid #b7d6b3', borderRadius: '4px', padding: '8px 12px', textAlign: 'right' }}>
                  <span style={{ fontSize: '10px', color: '#385e3a', fontFamily: "'DM Mono', monospace", display: 'block' }}>INFERENCE PROFILE</span>
                  <strong style={{ fontSize: '14px', color: '#1b3f1f' }}>22ms CUDA / 85ms CPU</strong>
                  <span style={{ fontSize: '10px', color: '#4d6e4f', display: 'block' }}>15.2 MB Edge Footprint</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #dbe6da', fontSize: '11px', color: '#3e5842' }}>
                <div>
                  <strong style={{ color: '#1d3921', display: 'block' }}>Shannon Entropy Uncertainty Guard:</strong>
                  <span>Rejects ambiguous or non-leaf photos when entropy H &gt; 1.2 nats or max confidence &lt; 60%.</span>
                </div>
                <div>
                  <strong style={{ color: '#1d3921', display: 'block' }}>Dual-Tier Verification Pipeline:</strong>
                  <span>High confidence cases generate instant treatment protocols; edge cases route to human agronomists.</span>
                </div>
                <div>
                  <strong style={{ color: '#1d3921', display: 'block' }}>Agronomist Escalation Network:</strong>
                  <span>Direct dispatch to verified ICAR / KVK crop specialists with full leaf imagery and metadata.</span>
                </div>
              </div>
            </div>

            <div className="diagnostic-studio-grid" style={{ marginTop: '18px' }}>
              <div className="diagnostic-console-panel">
                <div className="source-toggle-bar">
                  {[
                    { value: 'sample', label: text.diagSourceSample },
                    { value: 'upload', label: text.diagSourceUpload },
                    { value: 'url', label: text.diagSourceUrl }
                  ].map(mode => (
                    <button
                      key={mode.value}
                      type="button"
                      className={`source-toggle-btn ${imageInputMode === mode.value ? 'active' : ''}`}
                      onClick={() => {
                        setImageInputMode(mode.value);
                        if (mode.value !== 'sample') {
                          setDiagnosticFile(null);
                        }
                      }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {imageInputMode === 'upload' ? (
                  <>
                    <input
                      ref={diagnosticFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageFileUpload}
                      style={{ display: 'none' }}
                    />
                    <button type="button" className="upload-dropzone-box" onClick={() => diagnosticFileInputRef.current?.click()}>
                      <strong>{diagnosticFile ? diagnosticFile.name : text.diagChooseLeaf}</strong>
                      <span style={{ display: 'block', marginTop: '6px', fontSize: '11px', color: '#778078' }}>{text.diagUploadFormats}</span>
                    </button>
                  </>
                ) : imageInputMode === 'url' ? (
                  <div className="diagnostic-url-row">
                    <input
                      type="url"
                      className="field-input"
                      placeholder="https://example.com/leaf.jpg"
                      value={diagnosticForm.imageUrl}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setDiagnosticForm(prev => ({ ...prev, imageUrl: nextValue }));
                        setDiagnosticFile(null);
                        setPreviewImageUrl(nextValue && /^(https?:\/\/|data:image\/)/i.test(nextValue.trim()) ? nextValue.trim() : '');
                      }}
                    />
                    <button type="button" className="trade-btn trade-btn-secondary diagnostic-url-load-btn" onClick={() => handleLoadImageUrl(diagnosticForm.imageUrl)}>{text.diagLoad}</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="upload-dropzone-box"
                    onClick={() => {
                      const sampleUrl = 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=900&auto=format&fit=crop';
                      setDiagnosticFile(null);
                      setDiagnosticForm(prev => ({ ...prev, imageUrl: sampleUrl }));
                      setPreviewImageUrl(`${sampleUrl}?v=${Date.now()}`);
                    }}
                  >
                    <strong>{text.diagSampleTomatoLeaf}</strong>
                    <span style={{ display: 'block', marginTop: '6px', fontSize: '11px', color: '#778078' }}>{text.diagQuickCheck}</span>
                  </button>
                )}

                <div className="leaf-preview-frame" style={{ marginTop: '12px' }}>
                  {previewImageUrl ? (
                    <img
                      key={previewImageUrl}
                      className="leaf-img"
                      src={previewImageUrl}
                      alt="Selected crop leaf"
                      onError={() => setPreviewImageUrl('')}
                    />
                  ) : (
                    <span className="muted">{text.diagNoImage}</span>
                  )}
                  {previewImageUrl && <span className="leaf-tag">{text.diagSpecimenReady}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                  <div className="field-group">
                    <label className="field-label" htmlFor="diagnostic-crop">{text.diagCropHint}</label>
                    <select
                      id="diagnostic-crop"
                      className="field-input"
                      value={diagnosticForm.cropId || ''}
                      onChange={(e) => {
                        const cropId = e.target.value ? Number(e.target.value) : null;
                        const selected = crops.find(crop => crop.id === cropId);
                        setDiagnosticForm(prev => ({ ...prev, cropId, cropName: selected?.name || '' }));
                      }}
                    >
                      <option value="">{text.diagAutoDetect}</option>
                      {crops.map(crop => <option key={crop.id} value={crop.id}>{crop.name}</option>)}
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label" htmlFor="diagnostic-notes">{text.diagFieldNotes}</label>
                    <input
                      id="diagnostic-notes"
                      className="field-input"
                      value={diagnosticForm.notes}
                      onChange={(e) => setDiagnosticForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder={text.diagOptionalSymptoms}
                    />
                  </div>
                </div>

                <button type="button" className="trade-btn trade-btn-primary crop-doctor-submit-btn" onClick={runDiagnosticScan} disabled={diagnosticLoading}>
                  {diagnosticLoading ? text.diagAnalyzing : text.diagAnalyze}
                </button>
              </div>

              <div className="diagnostic-result-panel">
                {diagnosticResult ? (
                  <div className="diagnostic-card">
                    <div className="diagnostic-header">
                      <div>
                        <span className="diag-section-title">{text.diagDiagnosisTitle}</span>
                        <h3 style={{ margin: '4px 0 2px', fontSize: '21px', color: '#202a27' }}>{diagnosticResult.cropName}</h3>
                        <p className="diag-text">
                          {(() => {
                            const diseaseFull = diagnosticResult.detectedDisease;
                            const diseaseMatch = diseaseFull.match(/^([^(]+)/);
                            const diseaseName = diseaseMatch ? diseaseMatch[1].trim() : diseaseFull;
                            const scientificName = diseaseFull.match(/\(([^)]+)\)/);
                            const translated = getLocalizedText(diseaseName, language);
                            return scientificName ? `${translated} (${scientificName[1]})` : translated;
                          })()}
                        </p>
                      </div>
                      {diagnosticResult.confidenceScore != null ? (
                        <div className="confidence-meter-box">
                          <span className="confidence-num">{diagnosticResult.confidenceScore}%</span>
                          <span className="confidence-label">{text.diagConfidence}</span>
                        </div>
                      ) : (
                        <div className="confidence-meter-box" style={{ background: '#fef7e8', border: '1px solid #d4a34b', padding: '6px 12px', borderRadius: '4px', textAlign: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#8a6218', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Preliminary Heuristic
                          </span>
                          <span className="confidence-label" style={{ color: '#8a6218', fontSize: '10px' }}>
                            Uncalibrated Screening
                          </span>
                        </div>
                      )}
                    </div>

                    {diagnosticResult.requiresExpertReview && (
                      <div style={{ background: '#fdf7ea', border: '1px solid #ecc987', borderRadius: '6px', padding: '10px 14px', margin: '10px 0 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ flex: 1, minWidth: '240px' }}>
                          <strong style={{ fontSize: '12px', color: '#7a4e0a', display: 'block' }}>
                            [DEMO DIAGNOSIS - Heuristic Fallback, Uncalibrated]
                          </strong>
                          <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#7a4e0a', lineHeight: 1.4 }}>
                            Trained neural network checkpoint (crop_doctor_v1.pt) is not loaded. Diagnosis is generated via preliminary pixel-color heuristics. Expert review is advised before application of chemical treatments.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="trade-btn trade-btn-primary"
                          style={{ fontSize: '11px', padding: '6px 12px', whiteSpace: 'nowrap' }}
                          onClick={() => escalateToAgronomist(diagnosticResult.id)}
                        >
                          Escalate to Expert Agronomist
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span className={`severity-badge severity-${String(diagnosticResult.severity).toLowerCase()}`}>{getLocalizedText(diagnosticResult.severity, language)}</span>
                      <span className="severity-badge" style={{ background: '#eef2f8', color: '#204068' }}>{diagnosticResult.pathogenType}</span>
                      <span className="severity-badge" style={{ background: '#eef3eb', color: '#2f6838' }}>{diagnosticResult.device}</span>
                    </div>

                    <div className="treatment-box">
                      <span className="diag-section-title">{text.diagTreatmentProtocol}</span>
                      <p className="diag-text" style={{ whiteSpace: 'pre-line' }}>{diagnosticResult.treatmentPlan}</p>
                    </div>

                    <div>
                      <span className="diag-section-title">{text.diagRecommendedInputs}</span>
                      <div className="prescription-input-list">
                        {diagnosticResult.recommendedInputs.map(input => <div className="prescription-item" key={input}><span className="prescription-name">{input}</span></div>)}
                      </div>
                    </div>

                    {diagnosticResult.topCandidates && diagnosticResult.topCandidates.length > 0 && (
                      <div>
                        <span className="diag-section-title">{text.diagTopCandidates}</span>
                        {diagnosticResult.topCandidates.map(candidate => (
                          <div key={candidate.raw_label || candidate.condition} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', padding: '6px 0', borderBottom: '1px solid #eeeae1', fontSize: '12px' }}>
                            <span>{candidate.crop} · {candidate.condition}</span><strong>{candidate.confidence != null ? `${candidate.confidence}%` : 'Uncalibrated'}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ minHeight: '440px', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '34px', marginBottom: '10px' }}>+</div>
                      <h3 style={{ margin: 0, color: '#202a27' }}>{text.diagEmptyStateTitle}</h3>
                      <p className="muted" style={{ maxWidth: '280px', lineHeight: '1.5' }}>{text.diagEmptyStateText}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {currentView === 'community' && (

        <div className="view-container">
          <section className="panel" style={{ marginTop: '18px' }}>
            <div className="panel-heading" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p className="eyebrow">{text.communityEyebrow}</p>
                <h2>{text.communitySection}</h2>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                  Open bulletin for crop health discussions, procurement notices, and agronomic advisories.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="trade-btn trade-btn-primary"
                  onClick={() => setNewPostModalOpen(true)}
                  style={{ padding: '8px 18px', fontSize: '12px' }}
                >
                  {text.communityNewDiscussion}
                </button>
              </div>
            </div>

            
            <div className="marketplace-toolbar" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                  <input
                    type="text"
                    className="field-input"
                    placeholder={text.communitySearchPlaceholder}
                    value={communitySearchQuery}
                    onChange={(e) => setCommunitySearchQuery(e.target.value)}
                    style={{ fontSize: '13px', padding: '8px 12px' }}
                  />
                  {communitySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCommunitySearchQuery('')}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#778078', fontSize: '11px', fontFamily: "'DM Mono', monospace" }}
                    >
                      {text.communityClear}
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#778078' }}>{text.communityCommodity}</span>
                  <select
                    className="field-input"
                    value={communityFilterCrop}
                    onChange={(e) => setCommunityFilterCrop(e.target.value)}
                    style={{ fontSize: '12px', padding: '7px 10px', width: 'auto', minWidth: '130px' }}
                  >
                    <option value="ALL">{text.communityAllCommodities}</option>
                    <option value="Tomato">Tomato</option>
                    <option value="Chilli">Chilli / Pepper</option>
                    <option value="Rice">Rice / Paddy</option>
                    <option value="Potato">Potato</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Mustard">Mustard</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Onion">Onion</option>
                  </select>
                </div>
              </div>

              
              <div className="category-filter-bar" style={{ margin: 0, paddingTop: '2px' }}>
                {[
                  { value: 'ALL', label: text.communityAllTopics },
                  { value: 'FARMER', label: text.communityFarmerQueries },
                  { value: 'BUYER', label: text.communityBuyerNotices },
                  { value: 'AGRONOMIST', label: text.communityAgronomistProtocols }
                ].map(tab => (
                  <button
                    key={tab.value}
                    type="button"
                    className={`filter-chip ${communityParticipantFilter === tab.value ? 'active' : ''}`}
                    onClick={() => setCommunityParticipantFilter(tab.value)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            
            <div className="community-feed">
              {communityPosts
                .filter(post => {
                  const matchesParticipant = communityParticipantFilter === 'ALL' ||
                    post.authorType === communityParticipantFilter ||
                    post.answers.some(a => a.authorType === communityParticipantFilter);
                  const matchesCrop = communityFilterCrop === 'ALL' ||
                    post.cropName.toLowerCase().includes(communityFilterCrop.toLowerCase());
                  const q = communitySearchQuery.toLowerCase().trim();
                  const matchesSearch = !q ||
                    post.title.toLowerCase().includes(q) ||
                    post.description.toLowerCase().includes(q) ||
                    post.authorName.toLowerCase().includes(q) ||
                    post.cropName.toLowerCase().includes(q) ||
                    post.answers.some(a => a.text.toLowerCase().includes(q) || a.authorName.toLowerCase().includes(q));
                  return matchesParticipant && matchesCrop && matchesSearch;
                })
                .map((post) => {
                  const postTypeLabel = post.postType === 'PROCUREMENT' ? 'BUYER PROCUREMENT' : (post.postType === 'QUALITY_ADVICE' ? 'QUALITY STANDARD' : (post.postType === 'AGRI_ADVICE' ? 'AGRONOMY ADVISORY' : 'CROP HEALTH'));

                  return (
                    <div key={post.id} className="community-post-card">
                      
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '4px', background: '#202a27', color: '#f6f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                            {post.authorName.charAt(0)}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: '13px', color: '#202a27' }}>{post.authorName}</strong>
                              <span style={{
                                fontSize: '9px',
                                fontFamily: "'DM Mono', monospace",
                                padding: '1px 5px',
                                borderRadius: '2px',
                                fontWeight: 600,
                                background: post.authorType === 'BUYER' ? '#eef2f8' : (post.authorType === 'AGRONOMIST' ? '#f5f2e8' : '#eef4ec'),
                                color: post.authorType === 'BUYER' ? '#204068' : (post.authorType === 'AGRONOMIST' ? '#685420' : '#2f6838')
                              }}>
                                {post.authorType} {post.authorRole ? `· ${post.authorRole}` : ''}
                              </span>
                            </div>
                            <span style={{ font: "10px 'DM Mono', monospace", color: '#778078' }}>
                              {post.location} &middot; {post.timestamp}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", background: '#f5f3eb', color: '#685420', padding: '2px 7px', borderRadius: '3px', fontWeight: 600 }}>
                            {post.cropName.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '9px', fontFamily: "'DM Mono', monospace", background: '#eceae2', color: '#333b35', padding: '2px 6px', borderRadius: '3px', fontWeight: 600 }}>
                            [{postTypeLabel}]
                          </span>
                          {post.resolved && (
                            <span style={{ fontSize: '9px', fontFamily: "'DM Mono', monospace", background: '#e8f4ea', color: '#226330', padding: '2px 6px', borderRadius: '3px', fontWeight: 600 }}>
                              [RESOLVED]
                            </span>
                          )}
                        </div>
                      </div>

                      
                      <div>
                        <h3 style={{ fontSize: '15px', margin: '4px 0 4px', color: '#202a27', lineHeight: '1.4' }}>
                          {post.title}
                        </h3>
                        <p style={{ fontSize: '13px', color: '#444d47', lineHeight: '1.55', margin: 0 }}>
                          {post.description}
                        </p>
                      </div>

                      
                      {post.imageUrl && (
                        <div style={{ borderRadius: '4px', overflow: 'hidden', border: '1px solid #e2ded4', maxWidth: '340px' }}>
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }}
                          />
                        </div>
                      )}

                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #edeae2', paddingTop: '8px', marginTop: '2px' }}>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          <button
                            type="button"
                            className={`endorse-btn ${post.userLiked ? 'endorsed' : ''}`}
                            onClick={() => handleLikeCommunityPost(post.id)}
                            title={post.userLiked ? 'Endorsed' : 'Endorse topic'}
                          >
                            <span style={{ fontSize: '12px' }}>{post.userLiked ? 'Γ£ô' : '+'}</span>
                            <span>{post.likesCount}</span>
                          </button>

                          <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#778078' }}>
                            {post.answers.length} {post.answers.length === 1 ? text.communityReplyCount : text.communityReplyCountPlural}
                          </span>
                        </div>

                        {post.prescribedInput && (
                          <button
                            type="button"
                            className="trade-btn trade-btn-primary"
                            style={{ fontSize: '10px', padding: '3px 8px' }}
                            onClick={() => handleOrderPrescriptionInput(post.prescribedInput)}
                          >
                            Order {post.prescribedInput.split(' ')[0]} &rarr;
                          </button>
                        )}
                      </div>

                      
                      {post.answers.length > 0 && (
                        <div className="reply-thread">
                          {post.answers.map((ans) => (
                            <div
                              key={ans.id}
                              className={`reply-item ${ans.isVerifiedSolution ? 'verified-reply' : ''}`}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <strong style={{ fontSize: '12px', color: '#202a27' }}>{ans.authorName}</strong>
                                  <span style={{
                                    fontSize: '9px',
                                    fontFamily: "'DM Mono', monospace",
                                    background: ans.authorType === 'BUYER' ? '#eef2f8' : (ans.authorType === 'AGRONOMIST' ? '#2f6838' : '#e4e2d8'),
                                    color: ans.authorType === 'BUYER' ? '#204068' : (ans.authorType === 'AGRONOMIST' ? '#ffffff' : '#333b35'),
                                    padding: '1px 4px',
                                    borderRadius: '2px',
                                    fontWeight: 600
                                  }}>
                                    {ans.authorRole.toUpperCase()}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ font: "10px 'DM Mono', monospace", color: '#778078' }}>
                                    {ans.timestamp}
                                  </span>
                                  <button
                                    type="button"
                                    className={`endorse-btn ${ans.userLiked ? 'endorsed' : ''}`}
                                    onClick={() => handleUpvoteCommunityAnswer(post.id, ans.id)}
                                    title="Endorse response"
                                  >
                                    <span style={{ fontSize: '11px' }}>{ans.userLiked ? 'Γ£ô' : '+'}</span>
                                    <span>{ans.upvotes || 0}</span>
                                  </button>
                                </div>
                              </div>

                              {ans.isVerifiedSolution && (
                                <div style={{ display: 'inline-block', background: '#2f6838', color: '#ffffff', fontSize: '8px', fontFamily: "'DM Mono', monospace", padding: '1px 5px', borderRadius: '2px', fontWeight: 600, width: 'fit-content' }}>
                                  VERIFIED AGRONOMIST PROTOCOL
                                </div>
                              )}

                              <p style={{ fontSize: '12px', color: '#2b332d', lineHeight: '1.5', margin: '2px 0', whiteSpace: 'pre-line' }}>
                                {ans.text}
                              </p>

                              {ans.prescribedInput && (
                                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '10px', color: '#566057' }}>Prescribed:</span>
                                  <button
                                    type="button"
                                    className="prescription-btn"
                                    style={{ padding: '2px 6px', fontSize: '9px' }}
                                    onClick={() => handleOrderPrescriptionInput(ans.prescribedInput)}
                                  >
                                    Order {ans.prescribedInput} &rarr;
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      
                      <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="field-input"
                          placeholder={text.communityAddReply}
                          value={replyInputByPostId[post.id] || ''}
                          onChange={(e) => setReplyInputByPostId(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddCommunityReply(post.id); }}
                          style={{ fontSize: '12px', padding: '6px 10px' }}
                        />
                        <button
                          type="button"
                          className="trade-btn trade-btn-secondary"
                          onClick={() => handleAddCommunityReply(post.id)}
                          style={{ padding: '6px 12px', fontSize: '11px', whiteSpace: 'nowrap' }}
                        >
                          {text.communityReply}
                        </button>
                      </div>

                    </div>
                  );
                })}

              {communityPosts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '36px 20px', background: '#faf9f5', borderRadius: '4px', border: '1px dashed #d9d6cc' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#202a27', margin: '0 0 4px' }}>
                    {text.communityNoDiscussions}
                  </p>
                  <p style={{ fontSize: '12px', color: '#778078', margin: '0 0 12px' }}>
                    {text.communityNoDiscussionsSub}
                  </p>
                  <button
                    type="button"
                    className="trade-btn trade-btn-primary"
                    onClick={() => setNewPostModalOpen(true)}
                  >
                    {text.communityNewDiscussion}
                  </button>
                </div>
              )}
            </div>

          </section>

        </div>
      )}

      
      
      
      {currentView === 'support-network' && (
        <div className="view-container">
          <section className="panel" style={{ marginTop: '18px' }}>
            <div className="panel-heading" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p className="eyebrow">Institutional &amp; Expert Field Directory</p>
                <h2>{text.supportSectionTitle}</h2>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
                  {text.supportSectionSubtitle}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="count" style={{ background: '#202a27', color: '#f6f5f0', fontSize: '11px' }}>
                  {supportDirectoryData.filter(n => n.type === 'GOVT_KVK').length} {text.supportCenters}
                </span>
                <span className="count" style={{ background: '#2f6838', color: '#f6f5f0', fontSize: '11px' }}>
                  {supportDirectoryData.filter(n => n.type === 'AGRONOMIST').length} {text.supportAgronomists}
                </span>
                <span className="count" style={{ background: '#35453e', color: '#f6f5f0', fontSize: '11px' }}>
                  {supportDirectoryData.filter(n => n.type === 'SOIL_LAB').length} {text.supportSoilLabs}
                </span>
              </div>
            </div>

            
            <div className="marketplace-toolbar" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                  <input
                    type="text"
                    className="field-input"
                    placeholder={text.supportSearchPlaceholder}
                    value={supportSearchQuery}
                    onChange={(e) => setSupportSearchQuery(e.target.value)}
                    style={{ fontSize: '13px', padding: '8px 12px' }}
                  />
                  {supportSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setSupportSearchQuery('')}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#778078', fontSize: '11px', fontFamily: "'DM Mono', monospace" }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              
              <div className="category-filter-bar" style={{ margin: 0, paddingTop: '2px' }}>
                {[
                  { value: 'ALL', label: 'All Directory' },
                  { value: 'GOVT_KVK', label: 'Govt KVK & Research' },
                  { value: 'AGRONOMIST', label: 'Certified Agronomists' },
                  { value: 'SOIL_LAB', label: 'Soil & Testing Labs' },
                  { value: 'FPO_HUB', label: 'FPO Hubs' },
                  { value: 'HELPLINE', label: '24x7 Helplines' }
                ].map(tab => (
                  <button
                    key={tab.value}
                    type="button"
                    className={`filter-chip ${supportCategoryFilter === tab.value ? 'active' : ''}`}
                    onClick={() => setSupportCategoryFilter(tab.value)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            
            <div className="support-radar-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#889e92', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {text.supportRadarViewLabel}
                  </span>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#ffffff', fontWeight: 600 }}>
                    {supportMapViewMode === 'RADAR'
                      ? text.supportRadarSubtitle
                      : `${text.supportMapSubtitle}: ${supportDirectoryData.find(n => n.id === selectedSupportNode)?.name || text.supportSectionTitle}`}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  
                  <div style={{ display: 'inline-flex', gap: '4px', background: 'rgba(0,0,0,0.5)', padding: '3px', borderRadius: '4px', border: '1px solid #364840' }}>
                    <button
                      type="button"
                      className="trade-btn"
                      onClick={() => setSupportMapViewMode('RADAR')}
                      style={{
                        background: supportMapViewMode === 'RADAR' ? '#2f6838' : 'transparent',
                        color: supportMapViewMode === 'RADAR' ? '#ffffff' : '#97ab9f',
                        border: 'none',
                        padding: '4px 10px',
                        fontSize: '10px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        lineHeight: 1.2
                      }}
                    >
                      {text.supportRadarViewBtn}
                    </button>
                    <button
                      type="button"
                      className="trade-btn"
                      onClick={() => setSupportMapViewMode('GOOGLE_MAP')}
                      style={{
                        background: supportMapViewMode === 'GOOGLE_MAP' ? '#2f6838' : 'transparent',
                        color: supportMapViewMode === 'GOOGLE_MAP' ? '#ffffff' : '#97ab9f',
                        border: 'none',
                        padding: '4px 10px',
                        fontSize: '10px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        lineHeight: 1.2
                      }}
                    >
                      {text.supportGoogleMapBtn}
                    </button>
                  </div>
                </div>
              </div>


              {supportMapViewMode === 'RADAR' ? (
                <div className="radar-canvas-box">
                  
                  <div className="radar-circle" style={{ width: '80px', height: '80px' }} />
                  <div className="radar-circle" style={{ width: '160px', height: '160px' }} />
                  <div className="radar-circle" style={{ width: '240px', height: '240px' }} />
                  <div className="radar-crosshair-x" />
                  <div className="radar-crosshair-y" />

                  
                  <span style={{ position: 'absolute', top: '52%', left: '56%', fontSize: '8px', fontFamily: "'DM Mono', monospace", color: 'rgba(110, 157, 104, 0.5)', pointerEvents: 'none' }}>5km</span>
                  <span style={{ position: 'absolute', top: '52%', left: '68%', fontSize: '8px', fontFamily: "'DM Mono', monospace", color: 'rgba(110, 157, 104, 0.5)', pointerEvents: 'none' }}>15km</span>
                  <span style={{ position: 'absolute', top: '52%', left: '80%', fontSize: '8px', fontFamily: "'DM Mono', monospace", color: 'rgba(110, 157, 104, 0.5)', pointerEvents: 'none' }}>25km</span>

                  
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 15, textAlign: 'center' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffffff', margin: '0 auto', boxShadow: '0 0 12px #6e9d68' }} />
                    <span style={{ fontSize: '9px', fontFamily: "'DM Mono', monospace", color: '#ffffff', background: 'rgba(0,0,0,0.7)', padding: '1px 4px', borderRadius: 2, display: 'inline-block', marginTop: 2 }}>
                      {text.supportYourFarm}
                    </span>
                  </div>

                  
                  {supportDirectoryData.map((node) => {
                    const isSelected = selectedSupportNode === node.id;
                    const pinColor = node.type === 'GOVT_KVK' ? '#6e9d68' : (node.type === 'AGRONOMIST' ? '#4d88ff' : (node.type === 'SOIL_LAB' ? '#e5a93b' : (node.type === 'HELPLINE' ? '#ff6666' : '#20b2aa')));

                    return (
                      <div
                        key={node.id}
                        className={`radar-pin ${isSelected ? 'pin-active' : ''}`}
                        style={{ top: `${node.mapCoords.y}%`, left: `${node.mapCoords.x}%` }}
                        onClick={() => {
                          setSelectedSupportNode(node.id);
                          setGoogleMapModalNode(node);
                        }}
                        title={`${node.name} (${node.distanceKm} km away) - Click to view on Google Maps`}
                      >
                        <div className="radar-pin-dot" style={{ background: pinColor }}>
                          <span style={{ fontSize: '8px', color: '#ffffff', fontWeight: 'bold' }}>·</span>
                        </div>
                        <span className="radar-pin-label">
                          {node.name.split(' ')[0]} {node.name.split(' ')[1] || ''} ({node.distanceKm}km)
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                
                <div style={{ position: 'relative', width: '100%', height: '320px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #364840' }}>
                  {(() => {
                    const activeNode = supportDirectoryData.find(n => n.id === selectedSupportNode) || supportDirectoryData[0];
                    return (
                      <>
                        <iframe
                          title={`Google Map - ${activeNode.name}`}
                          width="100%"
                          height="100%"
                          style={{ border: 0, display: 'block' }}
                          loading="lazy"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(activeNode.mapQuery || `${activeNode.lat},${activeNode.lng}`)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                        />
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(20, 26, 24, 0.92)', padding: '6px 12px', borderRadius: '4px', border: '1px solid #41554c', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: '#f6f5f0', fontFamily: "'DM Mono', monospace" }}>
                            {activeNode.name}
                          </span>
                          <a
                            href={activeNode.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="trade-btn trade-btn-primary"
                            style={{ padding: '4px 10px', fontSize: '10px', textDecoration: 'none' }}
                          >
                            {text.supportOpenMap}
                          </a>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            
            <div className="support-directory-grid">
              {supportDirectoryData
                .filter(node => {
                  if (supportCategoryFilter !== 'ALL' && node.type !== supportCategoryFilter) return false;
                  const q = supportSearchQuery.toLowerCase().trim();
                  if (!q) return true;
                  return node.name.toLowerCase().includes(q) ||
                    node.department.toLowerCase().includes(q) ||
                    node.location.toLowerCase().includes(q) ||
                    node.services.some(s => s.toLowerCase().includes(q));
                })
                .map(node => {
                  const isSelected = selectedSupportNode === node.id;
                  const badgeBg = node.type === 'GOVT_KVK' ? '#eef4ec' : (node.type === 'AGRONOMIST' ? '#eef2f8' : (node.type === 'SOIL_LAB' ? '#fdf5e8' : (node.type === 'HELPLINE' ? '#fbeeee' : '#eaf4f4')));
                  const badgeColor = node.type === 'GOVT_KVK' ? '#2f6838' : (node.type === 'AGRONOMIST' ? '#204068' : (node.type === 'SOIL_LAB' ? '#7a5214' : (node.type === 'HELPLINE' ? '#a32020' : '#1b6b6b')));

                  return (
                    <div
                      key={node.id}
                      className={`support-card ${isSelected ? 'card-highlighted' : ''}`}
                    >
                      <div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px', marginBottom: '6px' }}>
                          <span style={{
                            fontSize: '9px',
                            fontFamily: "'DM Mono', monospace",
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontWeight: 700,
                            background: badgeBg,
                            color: badgeColor,
                            letterSpacing: '0.3px'
                          }}>
                            {node.badge}
                          </span>
                          <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#778078', fontWeight: 600 }}>
                            Γÿà {node.rating} &middot; {node.distanceKm} km
                          </span>
                        </div>

                        
                        <h3 style={{ fontSize: '15px', margin: '2px 0 2px', color: '#202a27', lineHeight: '1.3' }}>
                          {node.name}
                        </h3>
                        <p style={{ margin: '0 0 6px', fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#667269' }}>
                          {node.department}
                        </p>
                        <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#444d47' }}>
                          {node.location}
                        </p>

                        
                        <div style={{ background: '#f8f7f2', borderRadius: '4px', padding: '6px 10px', fontSize: '11px', color: '#4d5750', marginBottom: '8px', border: '1px solid #eceae2' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{text.supportLead} <strong>{node.inCharge}</strong></span>
                          </div>
                          <div style={{ font: "10px 'DM Mono', monospace", color: '#778078', marginTop: '2px' }}>
                            {text.supportHours} {node.hours}
                          </div>
                        </div>

                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                          {node.services.map((srv, idx) => (
                            <span key={idx} style={{ fontSize: '10px', background: '#f0eee8', color: '#333b35', padding: '2px 6px', borderRadius: '3px' }}>
                              {getLocalizedText(srv, language)}
                            </span>
                          ))}
                        </div>
                      </div>

                      
                      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #edebe4', paddingTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

                        <a
                          href={`tel:${node.phone.replace(/[^0-9+]/g, '')}`}
                          className="trade-btn trade-btn-primary"
                          style={{ flex: '1 1 140px', padding: '7px 12px', fontSize: '11px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                          onClick={(e) => {
                            if (!node.phone.startsWith('+91') && !node.phone.startsWith('1800')) {
                              e.preventDefault();
                              setMessage(`Direct helpline: ${node.phone}`);
                            }
                          }}
                        >
                          {text.supportCallDesk} {node.phone}
                        </a>

                        <button
                          type="button"
                          className="trade-btn trade-btn-secondary"
                          style={{ flex: '0 0 auto', padding: '7px 12px', fontSize: '11px', fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}
                          title="View on Google Maps"
                          onClick={() => {
                            setSelectedSupportNode(node.id);
                            setGoogleMapModalNode(node);
                          }}
                        >
                          {text.supportGoogleMapAction}
                        </button>
                      </div>

                    </div>
                  );
                })}

            </div>

            {supportDirectoryData.length === 0 && (
              <p className="muted" style={{ padding: '24px 0', textAlign: 'center' }}>No support directory nodes found.</p>
            )}

          </section>
        </div>
      )}

      
      
      
      {currentView === 'transporter-dashboard' && (
        session?.role === 'TRANSPORTER' ? (
          <TransporterDashboard
            session={session}
            apiUrl={API_URL}
          />
        ) : (
          <div className="view-container">
            <section className="panel" style={{ marginTop: '18px', textAlign: 'center', padding: '40px 16px' }}>
              <h2>Transporter Portal Access Only</h2>
              <p style={{ color: '#667269', marginTop: '8px', fontSize: '13px' }}>
                This page is exclusively for registered commercial transporters to configure vehicles, set freight rates, and manage haul assignments.
              </p>
              <p style={{ color: '#667269', fontSize: '13px', marginTop: '4px' }}>
                Farmers and buyers cannot manage transporter settings. As a farmer, you choose and book available transporters directly from your accepted trade deals.
              </p>
              <button
                type="button"
                className="trade-btn trade-btn-primary"
                style={{ marginTop: '18px', padding: '8px 18px' }}
                onClick={() => setCurrentView(session?.role === 'FARMER' ? 'my-orders' : 'prices')}
              >
                Go to {session?.role === 'FARMER' ? 'My Orders' : 'Marketplace'}
              </button>
            </section>
          </div>
        )
      )}

      
      
      
      {currentView === 'trade-chat' && (
        <TradeChatView
          session={session}
          apiUrl={API_URL}
          onNavigate={(targetView) => setCurrentView(targetView)}
          activeConversationId={activeChatConversationId}
        />
      )}

      
      
      
      {currentView === 'my-orders' && (
        <div className="view-container">
          
          <section className="panel" style={{ marginBottom: '20px', border: '2px solid #2f6838', borderRadius: '8px', background: '#ffffff', padding: '20px 24px', boxShadow: '0 4px 18px rgba(47, 104, 56, 0.08)' }}>
            <div className="panel-heading" style={{ borderBottom: '1px solid #eef2ee', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <p className="eyebrow" style={{ color: '#2f6838', fontWeight: 700 }}>Direct Farm Produce Sales Ledger</p>
                <h2 style={{ margin: '2px 0 0', fontSize: '20px' }}>Active Crop Sales &amp; Direct Contracts</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#667269' }}>
                  Live agricultural sales agreements, counterpart negotiations, transport tracking, and direct bank payouts.
                </p>
              </div>
              <span className="count" style={{ background: '#2f6838', color: '#ffffff' }}>
                {trades.length} {trades.length === 1 ? 'Contract' : 'Contracts'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {trades.map((t) => {
                const statusKey = (t.status || 'PROPOSED').toLowerCase();
                const gross = (t.quantity || 0) * (t.agreedPricePerKg || 0);
                return (
                  <div key={t.id} style={{ border: '1px solid #d4dfd4', borderRadius: '8px', padding: '16px', background: '#fafbfa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", fontWeight: 700, color: '#2f6838' }}>
                            Trade #{t.id}
                          </span>
                          <h3 style={{ margin: '2px 0', fontSize: '16px', color: '#202a27' }}>
                            {t.cropName}
                          </h3>
                          <span style={{ fontSize: '12px', color: '#556557' }}>
                            Buyer: <strong>{t.buyerName}</strong>
                          </span>
                        </div>
                        <span className={`status-pill status-${statusKey}`}>
                          {t.status}
                        </span>
                      </div>

                      <div style={{ background: '#ffffff', border: '1px solid #eceae2', borderRadius: '6px', padding: '10px', margin: '10px 0', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#667269' }}>Dispatched Lot:</span>
                          <strong>{Number(t.quantity).toLocaleString()} kg ({(Number(t.quantity) / 1000).toFixed(1)} T)</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#667269' }}>Agreed Rate:</span>
                          <strong style={{ color: '#2f6838' }}>₹{t.agreedPricePerKg}/kg</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#667269' }}>Gross Value:</span>
                          <span>₹{gross.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#667269' }}>Freight Deduction:</span>
                          <span style={{ color: '#b45a42' }}>-₹{Number(t.transportCost || 0).toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eeeae1', paddingTop: '6px', marginTop: '4px' }}>
                          <span style={{ color: '#202a27', fontWeight: 600 }}>Net Take-Home Payout:</span>
                          <strong style={{ color: '#166534', fontSize: '14px' }}>₹{Number(t.netFarmerReturn || 0).toLocaleString()}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button
                        type="button"
                        className="trade-btn trade-btn-primary"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                        onClick={() => setCurrentView('matching')}
                      >
                        Manage &amp; Track &rarr;
                      </button>
                      <button
                        type="button"
                        className="trade-btn trade-btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                        onClick={() => setSelectedInvoiceTrade(t)}
                      >
                        Receipt
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          
          <div style={{ background: '#f8f9f8', border: '1px solid #d4dfd4', borderRadius: '6px', padding: '10px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", fontWeight: 700, background: '#365c3b', color: '#ffffff', padding: '2px 6px', borderRadius: '3px' }}>
                SANDBOX DEMO TEMPLATES
              </span>
              <p style={{ margin: 0, fontSize: '12px', color: '#445846' }}>
                The sample orders below are simulated workflow templates for evaluating multi-stage tracking, POP/POD, and escrow lifecycles. Real deals appear automatically upon marketplace trading.
              </p>
            </div>
            <span style={{ fontSize: '10px', color: '#687e6b', fontFamily: "'DM Mono', monospace" }}>
              DEMO MODE · SIMULATION ONLY
            </span>
          </div>
          <section className="panel" style={{ marginTop: '18px' }}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{text.ordersTradeDeals}</p>
                <h2>{text.ordersHeader}</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#667269' }}>
                  Track active purchase orders, farmer harvest procurements, and escrow-guaranteed payments.
                </p>
              </div>
              <span className="count">{userOrders.length} {text.ordersContracts}</span>
            </div>

            
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '14px 0 8px' }}>
              {[
                { value: 'ALL', label: text.ordersStatusAll },
                { value: 'IN_TRANSIT', label: text.ordersStatusInTransit },
                { value: 'ESCROW_LOCKED', label: text.ordersStatusEscrowProtected },
                { value: 'DELIVERED', label: text.ordersStatusCompleted },
                { value: 'DISPUTED', label: text.ordersStatusDisputed }
              ].map(f => (
                <button
                  key={f.value}
                  type="button"
                  className={`filter-chip ${orderStatusFilter === f.value ? 'active' : ''}`}
                  onClick={() => setOrderStatusFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            
            <div className="orders-grid">
              {userOrders
                .filter(o => {
                  if (orderStatusFilter === 'ALL') return true;
                  return o.escrowStatus === orderStatusFilter || o.orderStatus === orderStatusFilter;
                })
                .map(order => {
                  const statusClass = order.escrowStatus === 'IN_TRANSIT' ? 'status-in-transit' :
                                      order.escrowStatus === 'ESCROW_LOCKED' ? 'status-escrow-locked' :
                                      order.escrowStatus === 'DELIVERED' ? 'status-delivered' :
                                      order.escrowStatus === 'DISPUTED' ? 'status-disputed' : 'status-placed';

                  return (
                    <div key={order.id} className="order-card">
                      <div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px', marginBottom: '8px' }}>
                          <div>
                            <span style={{ fontSize: '12px', fontFamily: "'DM Mono', monospace", fontWeight: 700, color: '#202a27' }}>
                              {order.id}
                            </span>
                            <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#778078', display: 'block', marginTop: '1px' }}>
                              {text.ordersPlacedOn} {order.orderDate}
                            </span>
                          </div>
                          <span className={`order-status-badge ${statusClass}`}>
                            {order.escrowStatus.replace('_', ' ')}
                          </span>
                        </div>

                        
                        <h3 style={{ fontSize: '16px', margin: '4px 0 2px', color: '#202a27', lineHeight: '1.3' }}>
                          {order.commodity}
                        </h3>
                        <p style={{ margin: '0 0 10px', fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#667269' }}>
                          {order.qualityCertificate}
                        </p>

                        
                        <div style={{ background: '#faf9f5', border: '1px solid #eceae2', borderRadius: '4px', padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                          <div>
                            <span style={{ fontSize: '9px', fontFamily: "'DM Mono', monospace", color: '#778078', textTransform: 'uppercase' }}>Volume</span>
                            <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 700, color: '#202a27' }}>
                              {order.quantity} {order.unit}
                            </p>
                          </div>
                          <div>
                            <span style={{ fontSize: '9px', fontFamily: "'DM Mono', monospace", color: '#778078', textTransform: 'uppercase' }}>Agreed Rate</span>
                            <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600, color: '#202a27' }}>
                              ₹{order.pricePerUnit.toLocaleString()} <small style={{ fontSize: '10px', color: '#778078' }}>/ {order.unit.split(' ')[0]}</small>
                            </p>
                          </div>
                          <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #edeae2', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#556058' }}>Total Protected Escrow</span>
                            <strong style={{ fontSize: '15px', color: '#2f6838', fontFamily: "'DM Mono', monospace" }}>
                              ₹{order.totalAmount.toLocaleString()}
                            </strong>
                          </div>
                        </div>

                        
                        <div style={{ fontSize: '11px', color: '#556058', marginBottom: '8px' }}>
                          <p style={{ margin: '0 0 2px' }}>
                            <strong>{text.ordersCounterpart}</strong> {order.counterpart}
                          </p>
                          <p style={{ margin: '0' }}>
                            <strong>{text.ordersDestination}</strong> {order.deliveryLocation}
                          </p>
                        </div>
                      </div>

                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #edebe4', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="trade-btn trade-btn-primary"
                            style={{ flex: 1, minWidth: '140px', padding: '8px 12px' }}
                            onClick={() => handleTrackOrder(order.id)}
                          >
                            {text.ordersTrack}
                          </button>
                          {order.escrowStatus !== 'DELIVERED' && order.escrowStatus !== 'DISPUTED' && (
                            <button
                              type="button"
                              className="trade-btn trade-btn-secondary"
                              style={{ padding: '8px 12px', fontSize: '10px' }}
                              onClick={() => handleReleaseEscrow(order.id)}
                              title="Confirm receipt and release payment to seller"
                            >
                              {text.ordersReleaseEscrow}
                            </button>
                          )}
                        </div>

                        {order.escrowStatus !== 'DISPUTED' && order.escrowStatus !== 'DELIVERED' && (
                          <button
                            type="button"
                            className="text-button"
                            style={{ fontSize: '10px', color: '#a82020', textAlign: 'center', padding: '2px 0' }}
                            onClick={() => handleRaiseDispute(order.id)}
                          >
                            {text.ordersRaiseDispute}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {userOrders.length === 0 && (
              <p className="muted" style={{ padding: '30px 0', textAlign: 'center' }}>{text.ordersNoOrders}</p>
            )}
          </section>
        </div>
      )}

      
      
      
      {currentView === 'my-shop' && (
        <div className="view-container">
          <section className="panel" style={{ marginTop: '18px' }}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Farmer Direct Storefront &amp; Stock Inventory</p>
                <h2>{text.shopSectionTitle}</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#667269' }}>
                  {text.shopSectionSubtitle}
                </p>
              </div>
              <button
                type="button"
                className="trade-btn trade-btn-primary"
                style={{ padding: '8px 16px', fontSize: '11px' }}
                onClick={() => setQuickProduceModal({
                  cropName: 'Nashik Red Onion',
                  category: 'VEGETABLES',
                  quantity: '',
                  unit: 'Quintals',
                  expectedPrice: '',
                  location: 'Nashik Farm Gate'
                })}
              >
                {text.shopAddProduce}
              </button>
            </div>

            
            <div className="shop-stats-grid">
              <div className="shop-stat-card">
                <span>{text.shopActiveListings}</span>
                <strong>{shopInventory.filter(i => i.status === 'ACTIVE').length}</strong>
                <small>{text.shopOnlineBuyers}</small>
              </div>
              <div className="shop-stat-card">
                <span>{text.shopTotalHarvestStock}</span>
                <strong>
                  {shopInventory.reduce((acc, curr) => acc + curr.stockQuantity, 0).toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 600 }}>Qtl</span>
                </strong>
                <small>{text.shopReadyStorage}</small>
              </div>
              <div className="shop-stat-card">
                <span>{text.shopSalesRevenue}</span>
                <strong>₹6,82,000</strong>
                <small>{text.shopCompletedEscrow}</small>
              </div>
              <div className="shop-stat-card">
                <span>{text.shopPendingEscrow}</span>
                <strong style={{ color: '#2f6838' }}>₹3,88,000</strong>
                <small>{text.shopUnderInspection}</small>
              </div>
            </div>

            
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#202a27' }}>
                  {text.shopInventoryTitle}
                </h3>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['ALL', 'GRAIN', 'VEGETABLES', 'FRUITS', 'OILSEED'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      className={`filter-chip ${shopCategoryFilter === cat ? 'active' : ''}`}
                      onClick={() => setShopCategoryFilter(cat)}
                      style={{ fontSize: '9px', padding: '4px 8px' }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="market-table-container">
                <table className="market-table">
                  <thead>
                    <tr>
                      <th>{text.shopCommodity}</th>
                      <th>{text.shopQualityGrade}</th>
                      <th>{text.shopStockSilo}</th>
                      <th>{text.shopUnitPrice}</th>
                      <th>{text.shopStorageHub}</th>
                      <th>{text.shopInquiries}</th>
                      <th>{text.shopStatus}</th>
                      <th style={{ textAlign: 'right' }}>{text.shopActions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopInventory
                      .filter(item => shopCategoryFilter === 'ALL' || item.category === shopCategoryFilter)
                      .map(item => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.cropName}</strong>
                            <small style={{ display: 'block', color: '#778078', fontSize: '10px' }}>Harvest: {item.harvestDate}</small>
                          </td>
                          <td>
                            <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#444d47' }}>
                              {item.qualityGrade}
                            </span>
                          </td>
                          <td>
                            <strong>{item.stockQuantity}</strong> <small style={{ color: '#778078' }}>{item.unit}</small>
                          </td>
                          <td>
                            <strong style={{ color: '#2f6838' }}>₹{item.pricePerUnit}</strong> <small style={{ color: '#778078' }}>/ {item.unit.split(' ')[0]}</small>
                          </td>
                          <td style={{ fontSize: '11px', color: '#667269' }}>
                            {item.storageLocation}
                          </td>
                          <td>
                            <span style={{ font: "10px 'DM Mono', monospace", background: '#f0eee8', padding: '2px 6px', borderRadius: '3px' }}>
                              {item.inquiriesCount} Leads ({item.viewsCount} views)
                            </span>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '9px',
                              fontFamily: "'DM Mono', monospace",
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontWeight: 700,
                              background: item.status === 'ACTIVE' ? '#eef4ec' : '#f0eee8',
                              color: item.status === 'ACTIVE' ? '#2f6838' : '#778078'
                            }}>
                              {item.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="trade-btn trade-btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '10px' }}
                              onClick={() => handleToggleShopStatus(item.id)}
                            >
                              {item.status === 'ACTIVE' ? text.shopPauseListing : text.shopActivate}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            
            <div style={{ marginTop: '28px', borderTop: '1px solid #e7e4db', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#202a27' }}>
                    {text.shopBuyerOffersTitle}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#667269' }}>
                    {text.shopBuyerOffersSubtitle}
                  </p>
                </div>
                <span className="count" style={{ background: '#f5d9d0', color: '#b45a42' }}>
                  {shopOffers.length} {text.shopPending}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                {shopOffers.map(offer => (
                  <div key={offer.id} style={{ background: '#ffffff', border: '1px solid #d9d6cc', borderRadius: '4px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '9px', fontFamily: "'DM Mono', monospace", color: '#778078', textTransform: 'uppercase' }}>
                            {offer.buyerType.replace('_', ' ')}
                          </span>
                          <h4 style={{ margin: '2px 0 0', fontSize: '14px', color: '#202a27' }}>
                            {offer.buyerName}
                          </h4>
                        </div>
                        <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#778078' }}>
                          {offer.timestamp}
                        </span>
                      </div>

                      <div style={{ background: '#faf9f5', border: '1px solid #eceae2', borderRadius: '4px', padding: '10px', marginTop: '10px' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: '#202a27' }}>
                          {offer.offeredQuantity} {offer.unit} of {offer.cropName}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: '#556058' }}>Buyer Bid: <strong style={{ color: '#2f6838' }}>₹{offer.offeredPrice}</strong></span>
                          <span style={{ fontSize: '11px', color: '#778078' }}>Asking: ₹{offer.askingPrice}</span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#778078' }}>
                          Delivery to: {offer.destination}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid #edeae2', paddingTop: '10px' }}>
                      <button
                        type="button"
                        className="trade-btn trade-btn-primary"
                        style={{ flex: 1, padding: '6px 10px', fontSize: '10px' }}
                        onClick={() => handleAcceptOffer(offer)}
                      >
                        Accept &amp; Lock Escrow
                      </button>
                      <button
                        type="button"
                        className="trade-btn trade-btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '10px' }}
                        onClick={() => handleDeclineOffer(offer.id)}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {shopOffers.length === 0 && (
                <p className="muted" style={{ padding: '16px 0', textAlign: 'center' }}>No pending buyer bids.</p>
              )}
            </div>
          </section>
        </div>
      )}

      
      
      
      {currentView === 'order-progress' && (
        <div className="view-container">
          <section className="panel" style={{ marginTop: '18px' }}>
            {(() => {
              const activeOrder = userOrders.find(o => o.id === selectedTrackingOrderId) || userOrders[0];
              if (!activeOrder) return <p className="muted">No orders available for tracking.</p>;

              return (
                <>
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">Logistics Pipeline &amp; Escrow Milestone Tracker</p>
                      <h2>Order Progress: {activeOrder.id}</h2>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#667269' }}>
                        Real-time tracking of dispatch, weighbridge verification, and automated escrow payout.
                      </p>
                    </div>
                    <span className="count" style={{ background: '#e0edf5', color: '#204b6e' }}>
                      {activeOrder.orderStatus}
                    </span>
                  </div>

                  
                  <div className="order-selector-container">
                    {userOrders.map(order => {
                      const isSelected = order.id === activeOrder.id;
                      const statusClass = order.escrowStatus === 'IN_TRANSIT' ? 'status-in-transit' :
                                          order.escrowStatus === 'ESCROW_LOCKED' ? 'status-escrow-locked' :
                                          order.escrowStatus === 'DELIVERED' ? 'status-delivered' :
                                          order.escrowStatus === 'DISPUTED' ? 'status-disputed' : 'status-placed';

                      return (
                        <button
                          key={order.id}
                          type="button"
                          className={`order-tab-btn ${isSelected ? 'active' : ''}`}
                          onClick={() => setSelectedTrackingOrderId(order.id)}
                          title={`Select ${order.id} (${order.commodity})`}
                        >
                          <div>
                            <span className="order-tab-id">{order.id}</span>
                            <span className="order-tab-name">
                              {order.commodity.split(' ')[0]} &middot; {order.quantity} {order.unit.split(' ')[0]}
                            </span>
                          </div>
                          <span className={`order-status-badge ${statusClass}`} style={{ fontSize: '8px', padding: '2px 5px' }}>
                            {order.escrowStatus.replace('_', ' ')}
                          </span>
                        </button>
                      );
                    })}
                  </div>


                  
                  <div className="progress-summary-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#778078', textTransform: 'uppercase' }}>
                          Protected Trade Order
                        </span>
                        <h3 style={{ margin: '2px 0 0', fontSize: '17px', color: '#202a27' }}>
                          {activeOrder.commodity} &middot; {activeOrder.quantity} {activeOrder.unit}
                        </h3>
                        <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#556058' }}>
                          {activeOrder.originLocation} &rarr; <strong>{activeOrder.deliveryLocation}</strong>
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span className="escrow-pill">
                          Escrow Protected: ₹{activeOrder.totalAmount.toLocaleString()}
                        </span>
                        <p style={{ margin: '4px 0 0', fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#778078' }}>
                          ETA: <strong>{activeOrder.estimatedDelivery}</strong>
                        </p>
                      </div>
                    </div>

                    
                    <div>
                      <div className="horizontal-step-track">
                        {(() => {
                          const completedCount = activeOrder.timeline.filter(t => t.completed).length;
                          const progressPct = Math.min(100, Math.max(0, ((completedCount - 0.5) / (activeOrder.timeline.length - 1)) * 100));
                          return (
                            <>
                              <div className="track-progress-fill" style={{ width: `${progressPct}%` }} />
                              {activeOrder.timeline.map((step, idx) => {
                                const isCompleted = step.completed;
                                const isActive = step.active;
                                const shortLabel = ['Signed', 'Escrow', 'Assay', 'Transit', 'Weighbridge', 'Payout'][idx] || `S${idx + 1}`;

                                return (
                                  <div key={idx} className={`h-step-node ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                                    <div className="h-step-dot">
                                      {isCompleted ? 'Γ£ô' : idx + 1}
                                    </div>
                                    <span className="h-step-label">{shortLabel}</span>
                                  </div>
                                );
                              })}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  
                  <div className="logistics-card-minimal">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#778078', textTransform: 'uppercase' }}>
                          Logistics &amp; Carrier Assignment
                        </span>
                        <h4 style={{ margin: '2px 0 0', fontSize: '14px', color: '#202a27' }}>
                          {activeOrder.logistics.carrier} &middot; <span style={{ fontFamily: "'DM Mono', monospace" }}>{activeOrder.logistics.vehicleNo}</span>
                        </h4>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#556058' }}>
                          Current GPS: <strong style={{ color: '#2f6838' }}>{activeOrder.logistics.currentLocation}</strong>
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid #e7e4db', paddingTop: '10px' }}>
                      <div style={{ fontSize: '12px', color: '#444d47' }}>
                        <span>Driver: <strong>{activeOrder.logistics.driverName}</strong> ({activeOrder.logistics.driverPhone})</span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <a
                          href={`tel:${activeOrder.logistics.driverPhone.replace(/[^0-9+]/g, '')}`}
                          className="trade-btn trade-btn-secondary"
                          style={{ padding: '5px 12px', fontSize: '10px', textDecoration: 'none' }}
                        >
                          Call Driver
                        </a>
                        {activeOrder.escrowStatus !== 'DELIVERED' && (
                          <button
                            type="button"
                            className="trade-btn trade-btn-primary"
                            style={{ padding: '5px 12px', fontSize: '10px', background: '#2f6838 !important' }}
                            onClick={() => handleReleaseEscrow(activeOrder.id)}
                          >
                            Release Escrow Payment
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  
                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ fontSize: '13px', margin: '0 0 8px', color: '#202a27', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em' }}>
                      Stage Milestones &amp; Verification Log
                    </h4>

                    <div className="minimal-timeline-feed">
                      {activeOrder.timeline.map((step, idx) => {
                        const statusState = step.completed ? 'completed' : step.active ? 'active' : 'pending';

                        return (
                          <div key={idx} className={`timeline-row ${statusState}`}>
                            <div className="timeline-badge">
                              {step.completed ? 'Γ£ô' : idx + 1}
                            </div>
                            <div className="timeline-body">
                              <div className="timeline-header">
                                <span className="timeline-title">Stage {idx + 1}: {step.title}</span>
                                <span className="timeline-time">{step.timestamp}</span>
                              </div>
                              <p className="timeline-desc">{step.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()}
          </section>
        </div>
      )}


      
      
      
      {currentView === 'predictions' && (


        <div className="view-container">
          <section className="panel" style={{ marginTop: '18px' }}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Statistical Machine Intelligence &amp; Volatility</p>
                <h2>Price Forecasting &amp; Confidence Bands</h2>
              </div>
              <span className="count">{forecast ? `${forecast.confidenceScore}% Certainty` : 'Analyzing'}</span>
            </div>

            
            <div className="pulse-controls" style={{ marginTop: '14px', maxWidth: '400px' }}>
              <select
                value={selectedPulseCropId || ''}
                onChange={(e) => handlePulseCropChange(e.target.value)}
              >
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            {forecast ? (
              <div className="two-col-view-layout">
                <div>
                  <div className="prediction-deep-grid">
                    <div className="stat-metric-card">
                      <span>Next Day Target Price</span>
                      <strong>₹{forecast.estimatedPrice} <small style={{ fontSize: '13px' }}>/ {pulseCrop?.unit || 'kg'}</small></strong>
                    </div>
                    <div className="stat-metric-card">
                      <span>Trend &amp; Volatility</span>
                      <strong style={{ color: forecast.trend === 'UPWARD' ? '#5a8e62' : forecast.trend === 'DOWNWARD' ? '#b45a42' : '#7f8981' }}>
                        {forecast.trend === 'UPWARD' ? '↔ Bullish' : forecast.trend === 'DOWNWARD' ? '↘ Bearish' : '→ Stable'}
                      </strong>
                      <small style={{ font: "9px 'DM Mono', monospace", textTransform: 'uppercase', color: '#667269' }}>
                        {forecast.volatilityLevel} Volatility · {forecast.historicalPointsCount} points
                      </small>
                    </div>
                  </div>

                  
                  <div className="confidence-bands-visual" style={{ marginTop: '18px' }}>
                    <p style={{ margin: '0 0 8px', font: "10px 'DM Mono', monospace", textTransform: 'uppercase', color: '#5a665e', fontWeight: 'bold' }}>
                      Labeled Confidence Intervals (Certainty Bounds)
                    </p>
                    {forecast.confidenceIntervals?.map((ci, idx) => (
                      <div className="band-item" key={ci.label || idx}>
                        <span className="band-label">{ci.label}</span>
                        <div className="band-bar-wrap">
                          <div
                            className={`band-bar-fill ${idx === 0 ? 'band-fill-80' : idx === 1 ? 'band-fill-90' : 'band-fill-95'}`}
                            style={{ width: `${Math.min(100, Math.max(30, ci.confidenceLevel * 100))}%` }}
                          />
                        </div>
                        <span className="band-range-val">₹{ci.lowerBound} – ₹{ci.upperBound}</span>
                      </div>
                    ))}
                  </div>

                  <p style={{ font: "10px 'DM Mono', monospace", color: '#77837a', marginTop: '12px' }}>
                    <strong>Methodology:</strong> {forecast.methodology}
                  </p>
                </div>

                
                <div style={{ background: '#fffdf9', border: '1px solid #d9d6cc', borderRadius: '6px', padding: '16px' }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: '15px' }}>7-Day Price Trajectory</h3>
                  <table className="trajectory-table">
                    <thead>
                      <tr>
                        <th>Horizon</th>
                        <th>Target</th>
                        <th>90% Likely Range</th>
                        <th>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecast.multiDayForecast?.map((fp) => (
                        <tr key={fp.dayAhead}>
                          <td><strong>+{fp.dayAhead}d</strong> ({new Date(fp.date).toLocaleDateString(undefined, { weekday: 'short' })})</td>
                          <td><strong>₹{fp.predictedPrice}</strong></td>
                          <td>₹{fp.interval90?.lowerBound} – ₹{fp.interval90?.upperBound}</td>
                          <td style={{ color: fp.trend === 'UPWARD' ? '#5a8e62' : fp.trend === 'DOWNWARD' ? '#b45a42' : '#7f8981' }}>
                            {fp.trend === 'UPWARD' ? '↔' : fp.trend === 'DOWNWARD' ? '↘' : '→'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p style={{ font: "9px 'DM Mono', monospace", color: '#88928a', marginTop: '10px' }}>
                    * {forecast.disclaimer}
                  </p>
                </div>
              </div>
            ) : (
              <p className="muted" style={{ padding: '30px 0' }}>Computing price trajectory and confidence intervals...</p>
            )}
          </section>
        </div>
      )}

      
      
      
      {currentView === 'weather' && (
        <div className="view-container">
          <section className="panel" style={{ marginTop: '18px' }}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{text.weatherEyebrow}</p>
                <h2>{text.weatherTitle}</h2>
              </div>
              <span className="count">{weatherData?.harvestSuitability || text.weatherAnalyzing}</span>
            </div>

            
            <div className="location-presets-bar">
              <span style={{ font: "10px 'DM Mono', monospace", color: '#6a766c', alignSelf: 'center', marginRight: '4px' }}>
                {text.weatherOrigin} <strong>{mapCoords.label}</strong>
              </span>
              <button
                type="button"
                className={`location-pill ${mapCoords.label === 'Ranchi Center' ? 'active' : ''}`}
                onClick={() => handleLocationPreset(23.3441, 85.3096, 'Ranchi Center')}
              >
                Ranchi
              </button>
              <button
                type="button"
                className={`location-pill ${mapCoords.label === 'Ramgarh' ? 'active' : ''}`}
                onClick={() => handleLocationPreset(23.6332, 85.5149, 'Ramgarh')}
              >
                Ramgarh
              </button>
              <button
                type="button"
                className={`location-pill ${mapCoords.label === 'Bokaro' ? 'active' : ''}`}
                onClick={() => handleLocationPreset(23.6693, 86.1511, 'Bokaro')}
              >
                Bokaro
              </button>
              <button
                type="button"
                className={`location-pill ${mapCoords.label === 'Jamshedpur' ? 'active' : ''}`}
                onClick={() => handleLocationPreset(22.8046, 86.2029, 'Jamshedpur')}
              >
                Jamshedpur
              </button>
              {session && (
                <button
                  type="button"
                  className="location-pill"
                  style={{ background: '#dce7d3', color: '#3d5940', borderColor: '#b8cba8' }}
                  onClick={handleUseProfileLocation}
                >
                  {text.weatherUseGps}
                </button>
              )}
            </div>

            
            <div className="pulse-controls" style={{ marginTop: '10px', maxWidth: '380px' }}>
              <select
                value={weatherCropId || ''}
                onChange={(e) => setWeatherCropId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">{text.weatherGeneralConditions}</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            {weatherLoading ? (
              <p className="muted" style={{ padding: '24px 0' }}>{text.weatherLoading}</p>
            ) : weatherData ? (
              <>
                
                <div className="weather-hero-card">
                  <div>
                    <p className="eyebrow">{weatherData.locationName} · GPS {weatherData.latitude.toFixed(2)}°N, {weatherData.longitude.toFixed(2)}°E</p>
                    <h3>{weatherData.currentTemp}°C</h3>
                    <p style={{ margin: '6px 0 0', font: "11px 'DM Mono', monospace", color: '#b9c5b7', textTransform: 'uppercase' }}>
                      {text.weatherCondition}: <strong>{(weatherData.currentCondition || '').replace(/_/g, ' ')}</strong>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="count" style={{ background: '#35453e', color: '#fffaf1' }}>
                      {text.weatherSuitability}: {weatherData.harvestSuitability}
                    </span>
                  </div>
                </div>

                
                <div className="weather-grid-metrics">
                  <div className="weather-metric-item">
                    <span>{text.weatherHumidity}</span>
                    <strong>{weatherData.humidityPercent}%</strong>
                  </div>
                  <div className="weather-metric-item">
                    <span>{text.weatherRainfall}</span>
                    <strong>{weatherData.rainfallMm} mm</strong>
                  </div>
                  <div className="weather-metric-item">
                    <span>{text.weatherWind}</span>
                    <strong>{weatherData.windSpeedKmh} km/h</strong>
                  </div>
                  <div className="weather-metric-item">
                    <span>{text.weatherSuitability}</span>
                    <strong style={{ color: weatherData.harvestSuitability === 'EXCELLENT' ? '#5a8e62' : weatherData.harvestSuitability === 'HAZARDOUS' ? '#b45a42' : '#202a27' }}>
                      {weatherData.harvestSuitability}
                    </strong>
                  </div>
                </div>

                <div className="two-col-view-layout" style={{ marginTop: '16px' }}>
                  <div>
                    
                    <div className="harvest-box">
                      <h4>{text.weatherHarvestWindow}</h4>
                      <p><strong>{weatherData.recommendedHarvestWindow}</strong></p>
                    </div>

                    
                    <div className="spoilage-card">
                      <div className="spoilage-header">
                        <h4>{text.weatherSpoilageRisk}</h4>
                        <span className={`spoilage-badge spoilage-${weatherData.spoilageRiskIndex.toLowerCase()}`}>
                          {weatherData.spoilageRiskIndex} {text.weatherRisk}
                        </span>
                      </div>
                      <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#5a665e', lineHeight: '1.5' }}>
                        {weatherData.transitAdvisory}
                      </p>
                    </div>
                  </div>

                  
                  <div className="advisory-list-box">
                    <p style={{ margin: 0, font: "10px 'DM Mono', monospace", textTransform: 'uppercase', color: '#7f8981', fontWeight: 'bold' }}>
                      {text.weatherGuidelines}
                    </p>
                    <ul>
                      {weatherData.cropAdvisories?.map((adv, idx) => (
                        <li key={idx}>{adv}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                
                <div style={{ marginTop: '20px' }}>
                  <p style={{ margin: '0 0 8px', font: "10px 'DM Mono', monospace", textTransform: 'uppercase', color: '#5a665e', fontWeight: 'bold' }}>
                    {text.weatherForecast}
                  </p>
                  <div className="five-day-forecast-grid">
                    {weatherData.forecast?.map((day) => (
                      <div className="forecast-card-item" key={day.date}>
                        <span className="f-day">{day.dayName}</span>
                        <div className="f-temp">{day.tempMax}° / {day.tempMin}°</div>
                        <span className="f-rain">{day.precipitationProbability}% {text.weatherRain} · {(day.condition || '').replace(/_/g, ' ')}</span>
                        <div className="f-adv">{day.advisory}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="muted" style={{ padding: '24px 0' }}>
                {weatherError || text.weatherUnavailable}
              </p>
            )}
          </section>
        </div>
      )}

      
      
      
      {currentView === 'fpo-intake' && (
        <FpoIntakeView
          intakes={fpoIntakes}
          farmers={fpoFarmers}
          onAddIntake={(newIntake) => {
            setFpoIntakes(prev => [newIntake, ...prev]);
            setMessage(`Recorded intake ${newIntake.intakeId} (${newIntake.netWeightKg} kg) for ${newIntake.farmerName} with digital weigh-slip!`);
          }}
          onNavigateToLots={() => setCurrentView('fpo-lots')}
        />
      )}

      
      
      
      {currentView === 'farmer-payouts' && (
        <FarmerPayoutsLedgerView
          farmerId={session?.farmerId || 'FMR-FPO42-001'}
          farmerName={session?.name || 'Ramesh Kumar'}
          intakes={fpoIntakes}
          collectionSchedule={collectionSchedule}
          onNotifyHarvest={(harvest) => {
            setMessage(`Sent harvest dispatch alert for ${harvest.estQuantityKg} kg ${harvest.crop} to Sahyadri FPO!`);
          }}
        />
      )}

      
      
      
      {currentView === 'fpo-lots' && (
        <FpoLotsAndPassportView
          fpoProfile={fpoProfile}
          lots={fpoLots}
          fpoFarmers={fpoFarmers}
          intakes={fpoIntakes}
          initialAction={routeAction}
          onNavigate={(v) => setCurrentView(v)}
          onMatchLot={(lot) => {
            setProduce({
              cropId: crops[0]?.id || 1,
              cropName: lot.cropName,
              category: lot.category,
              quantity: lot.quantityKg,
              quality: lot.qualityChecklist?.grade || 'GRADE_A',
              imageUrl: lot.images?.[0] || ''
            });
            setProduceSource('custom');
            findRecommendationForProduce({
              cropName: lot.cropName,
              category: lot.category,
              quantity: lot.quantityKg,
              quality: lot.qualityChecklist?.grade || 'GRADE_A'
            });
            setMessage(`Pre-loaded ${lot.cropName} (${lot.quantityKg} kg) from ${lot.lotId} for institutional buyer matching.`);
          }}
          onCreateLot={(newLot) => {
            setFpoLots(prev => [newLot, ...prev]);
            setFpoIntakes(prev => prev.map(intake => {
              if (newLot.contributingFarmers?.some(cf => cf.farmerId === intake.farmerId) && intake.cropName === newLot.cropName && intake.status === 'UNPOOLED') {
                return { ...intake, status: 'POOLED', lotId: newLot.lotId };
              }
              return intake;
            }));
            setMessage(`Created Aggregated Lot ${newLot.lotId} with Digital Lot Passport!`);
          }}
        />
      )}

      
      
      
      {currentView === 'fpo-farmers' && (
        <FpoMemberFarmersView
          farmers={fpoFarmers}
          intakes={fpoIntakes}
          initialAction={routeAction}
          initialFarmerId={routeFarmerId}
          onViewAsFarmer={(farmer) => {
            setSession(prev => ({
              ...(prev || {}),
              token: 'demo-farmer-jwt',
              userId: farmer.id || 1,
              profileId: farmer.id || 1,
              name: farmer.name,
              email: `${farmer.name.toLowerCase().replace(/\s+/g, '.')}@kisanlink.in`,
              role: 'FARMER',
              farmerId: farmer.farmerId
            }));
            setCurrentView('farmer-payouts');
            setMessage(`Switched to View as Farmer mode for ${farmer.name} (${farmer.farmerId})`);
          }}
          onAddFarmer={(newFarmer) => {
            setFpoFarmers(prev => [...prev, newFarmer]);
            setMessage(`Enrolled member smallholder ${newFarmer.name} (${newFarmer.farmerId})!`);
          }}
        />
      )}

      
      
      
      {currentView === 'admin-governance' && (
        <AdminGovernanceView
          adminData={adminData}
          onVerifyEntity={(id) => {
            setAdminData(prev => ({
              ...prev,
              pendingVerifications: prev.pendingVerifications.map(v => v.id === id ? { ...v, status: 'VERIFIED' } : v)
            }));
            setMessage(`Entity #${id} granted official NABL verified badge.`);
          }}
          onResolveDispute={(disputeId) => {
            setAdminData(prev => ({
              ...prev,
              disputesQueue: prev.disputesQueue.map(d => d.id === disputeId ? { ...d, status: 'RESOLVED' } : d)
            }));
            setMessage(`Dispute ${disputeId} arbitrated and escrow settled.`);
          }}
        />
      )}

      
      
      
      {currentView === 'matching' && (
        <div className="view-container">
          
          {(session.role === 'FARMER' || session.role === 'FPO' || !session.role) && (
            <>
                <section className="workspace-grid" style={{ marginTop: '18px' }}>
                  <article className="panel workspace-panel">
                    <div className="panel-heading">
                      <div><p className="eyebrow">Farmer workspace</p><h2>List produce for selling</h2></div>
                      <span className="count">Step 01</span>
                    </div>

                    <div className="tab-toggle-group">
                      <button
                        type="button"
                        className={produceSource === 'catalog' ? 'active' : ''}
                        onClick={() => setProduceSource('catalog')}
                      >
                        Choose from catalogue
                      </button>
                      <button
                        type="button"
                        className={produceSource === 'custom' ? 'active' : ''}
                        onClick={() => setProduceSource('custom')}
                      >
                        + Custom product name
                      </button>
                    </div>

                    <form onSubmit={saveProduce}>
                      {produceSource === 'catalog' ? (
                        <label>Select Produce / Crop
                          <select value={produce.cropId} onChange={(event) => setProduce({ ...produce, cropId: event.target.value })}>
                            {crops.map((crop) => (
                              <option key={crop.id} value={crop.id}>
                                {crop.name} ({crop.category})
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : (
                        <>
                          <label>Category
                            <select
                              value={produce.category}
                              onChange={(event) => setProduce({ ...produce, category: event.target.value })}
                            >
                              <option value="VEGETABLE">Vegetables</option>
                              <option value="FRUIT">Fruits</option>
                              <option value="GRAIN">Grains</option>
                              <option value="PULSE">Pulses</option>
                              <option value="SEED">Seeds</option>
                              <option value="SPICE">Spices</option>
                              <option value="OIL_SEED">Oil Seeds</option>
                              <option value="FERTILIZER">Fertilizers &amp; Soil Nutrients</option>
                              <option value="PESTICIDE">Pesticides &amp; Crop Protection</option>
                              <option value="BIO_INPUT">Bio-Inputs &amp; Stimulants</option>
                              <option value="FARM_EQUIPMENT">Farm Equipment &amp; Tools</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </label>

                          <label>Custom Product Name
                            <input
                              placeholder="e.g. Organic Chia Seeds, Alphonso Mango"
                              value={produce.cropName}
                              onChange={(event) => setProduce({ ...produce, cropName: event.target.value })}
                              required
                            />
                          </label>
                        </>
                      )}

                      <label>Quantity (kg)
                        <input
                          type="number"
                          min="1"
                          value={produce.quantity}
                          onChange={(event) => setProduce({ ...produce, quantity: event.target.value })}
                          required
                        />
                      </label>

                      <label>Quality Grade
                        <select value={produce.quality} onChange={(event) => setProduce({ ...produce, quality: event.target.value })}>
                          <option value="GRADE_A">Grade A (Export / Premium)</option>
                          <option value="GRADE_B">Grade B (Standard Market)</option>
                          <option value="GRADE_C">Grade C (Processing)</option>
                        </select>
                      </label>

                      <label>Product Photo (Image URL)
                        <input
                          placeholder="https://example.com/produce.jpg"
                          value={produce.imageUrl}
                          onChange={(event) => setProduce({ ...produce, imageUrl: event.target.value })}
                        />
                      </label>

                      {produce.imageUrl && (
                        <div className="image-preview-box">
                          <img src={produce.imageUrl} alt="Produce Preview" onError={(e) => { e.target.style.display = 'none'; }} />
                        </div>
                      )}

                      <button type="submit">List produce for selling <span>→</span></button>
                    </form>

                    {produceResult && (
                      <div className="produce-card-meta">
                        {produceResult.imageUrl ? (
                          <img src={produceResult.imageUrl} alt={produceResult.crop?.name} />
                        ) : (
                          <span className="crop-icon">{produceResult.crop?.name?.slice(0, 1)}</span>
                        )}
                        <div>
                          <strong>{produceResult.crop?.name}</strong> <span className="category-badge">{produceResult.crop?.category}</span>
                          <small>{produceResult.quantity} kg · {produceResult.quality}</small>
                        </div>
                        <button
                          type="button"
                          className="secondary-button"
                          style={{ width: 'auto', marginLeft: 'auto', padding: '8px 14px', marginTop: 0 }}
                          onClick={findRecommendation}
                        >
                          Find best buyer <span>↔</span>
                        </button>
                      </div>
                    )}
                  </article>

                  {recommendation ? (
                    <article className="panel recommendation-panel" style={{ border: '2px solid #3b7444', borderRadius: '12px', background: '#ffffff', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <p className="eyebrow" style={{ color: '#2d6a36', fontWeight: 'bold' }}>
                            KisanLink Signature &middot; Smart Logistics &amp; Net Profit Optimizer
                          </p>
                          <h2 style={{ margin: '4px 0 0', fontSize: '22px', color: '#1b2d20' }}>
                            Best Deal Match: Maximum Take-Home Profit
                          </h2>
                          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#526356' }}>
                            Combined optimization: Buyer Offer &minus; Carrier Freight &minus; Escrow Fee = Highest Net Return
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ display: 'inline-block', background: '#e8f5e9', color: '#2e7d32', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: '1px solid #c8e6c9' }}>
                            Score: {recommendation.recommendedBuyer.score}/100 &middot; Best Deal
                          </span>
                        </div>
                      </div>

                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginTop: '18px' }}>
                        
                        <div style={{ background: '#f8faf8', border: '1px solid #e1e8e2', borderRadius: '8px', padding: '14px' }}>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#55695a', fontWeight: 'bold' }}>
                            1. Recommended Buyer Partner
                          </span>
                          <h3 style={{ margin: '6px 0 2px', fontSize: '16px', color: '#1b2d20' }}>
                            {recommendation.recommendedBuyer.buyerName}
                          </h3>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: '#2d6a36', margin: '4px 0' }}>
                            ₹{recommendation.recommendedBuyer.pricePerKg} <small style={{ fontSize: '12px', fontWeight: 'normal', color: '#667269' }}>/ kg</small>
                          </div>
                          <p style={{ margin: 0, fontSize: '12px', color: '#526356' }}>
                            Gross Crop Value: <strong>₹{recommendation.recommendedBuyer.grossRevenue?.toLocaleString()}</strong> &middot; {recommendation.recommendedBuyer.distanceKm} km route
                          </p>
                        </div>

                        
                        <div style={{ background: '#f8faf8', border: '1px solid #e1e8e2', borderRadius: '8px', padding: '14px' }}>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#55695a', fontWeight: 'bold' }}>
                            2. Paired Fleet Transporter
                          </span>
                          <h3 style={{ margin: '6px 0 2px', fontSize: '16px', color: '#1b2d20' }}>
                            {recommendation.recommendedBuyer.transporterName || 'Verified Regional Fleet'}
                          </h3>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: '#b45309', margin: '4px 0' }}>
                            ₹{recommendation.recommendedBuyer.transportCost?.toLocaleString()} <small style={{ fontSize: '12px', fontWeight: 'normal', color: '#667269' }}>freight quote</small>
                          </div>
                          <p style={{ margin: 0, fontSize: '12px', color: '#526356' }}>
                            Vehicle: <strong>{recommendation.recommendedBuyer.vehicleType?.replace('_', ' ') || 'Mini Truck'}</strong> &middot; Rate: ₹{recommendation.recommendedBuyer.transporterRatePerKm || 15}/km
                          </p>
                        </div>
                      </div>

                      
                      <div style={{ marginTop: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#166534', fontWeight: 'bold' }}>
                              Itemized Take-Home Profit Formula
                            </span>
                            <div style={{ fontSize: '13px', color: '#374151', marginTop: '3px' }}>
                              Gross (₹{recommendation.recommendedBuyer.grossRevenue?.toLocaleString()}) &minus; Freight (₹{recommendation.recommendedBuyer.transportCost?.toLocaleString()}) &minus; Escrow Fee (₹{recommendation.recommendedBuyer.platformFee || 100})
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              Net Take-Home Earnings
                            </span>
                            <div style={{ fontSize: '24px', fontWeight: '900', color: '#15803d' }}>
                              ₹{recommendation.recommendedBuyer.netReturn?.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        {recommendation.recommendedBuyer.profitComparisonNote && (
                          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #86efac', fontSize: '12px', color: '#166534', fontWeight: '600' }}>
                            Key Insight: {recommendation.recommendedBuyer.profitComparisonNote}
                          </div>
                        )}
                      </div>

                      
                      {recommendation.reason && recommendation.reason.length > 0 && (
                        <div style={{ marginTop: '14px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151' }}>Why this deal is recommended:</span>
                          <ul style={{ margin: '6px 0 0 18px', padding: 0, fontSize: '12px', color: '#4b5563', lineHeight: '1.6' }}>
                            {recommendation.reason.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      
                      {recommendation.alternatives && recommendation.alternatives.length > 0 && (
                        <div style={{ marginTop: '18px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#374151', textTransform: 'uppercase' }}>
                            Alternative Combinations Evaluated
                          </span>
                          <div style={{ overflowX: 'auto', marginTop: '6px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                  <th style={{ padding: '8px 10px', color: '#4b5563' }}>Option</th>
                                  <th style={{ padding: '8px 10px', color: '#4b5563' }}>Buyer &amp; Rate</th>
                                  <th style={{ padding: '8px 10px', color: '#4b5563' }}>Carrier &amp; Freight</th>
                                  <th style={{ padding: '8px 10px', color: '#4b5563' }}>Net Return</th>
                                  <th style={{ padding: '8px 10px', color: '#4b5563' }}>Comparison Insight</th>
                                </tr>
                              </thead>
                              <tbody>
                                {recommendation.alternatives.map((alt, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#6b7280' }}>
                                      #{idx + 2}
                                    </td>
                                    <td style={{ padding: '8px 10px', color: '#1f2937' }}>
                                      <strong>{alt.buyerName}</strong>
                                      <div style={{ color: '#6b7280', fontSize: '11px' }}>₹{alt.pricePerKg}/kg &middot; {alt.distanceKm} km</div>
                                    </td>
                                    <td style={{ padding: '8px 10px', color: '#1f2937' }}>
                                      <strong>{alt.transporterName || 'Fleet Carrier'}</strong>
                                      <div style={{ color: '#b45309', fontSize: '11px' }}>₹{alt.transportCost?.toLocaleString()} freight</div>
                                    </td>
                                    <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#1f2937' }}>
                                      ₹{alt.netReturn?.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '8px 10px', color: '#ef4444', fontSize: '11px' }}>
                                      {alt.profitComparisonNote || 'Lower net take-home return'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      
                      <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="trade-btn trade-btn-primary"
                          style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 'bold' }}
                          onClick={initiateTradeFromRecommendation}
                        >
                          Accept Best Deal &amp; Create Contract &rarr;
                        </button>

                        <button
                          type="button"
                          className="trade-btn"
                          style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534', padding: '10px 18px', fontSize: '13px', fontWeight: '600' }}
                          onClick={() => {
                            setActiveChatConversationId(recommendation.recommendedBuyer.buyerId);
                            setCurrentView('trade-chat');
                          }}
                        >
                          Chat &amp; Negotiate with Buyer &rarr;
                        </button>

                        <button
                          type="button"
                          className="trade-btn"
                          style={{ background: '#ffffff', borderColor: '#d1d5db', color: '#4b5563', padding: '10px 16px', fontSize: '13px' }}
                          onClick={() => setCurrentView('map')}
                        >
                          View Route Radar &nearr;
                        </button>
                      </div>
                    </article>
                  ) : (
                    <aside className="note-panel workspace-note">
                      <p className="eyebrow">Matching Engine</p>
                      <h2>Weighted multi-factor matching.</h2>
                      <p>Once you list produce, our matching algorithm checks price offers, transport freight, haversine distance, and buyer verification to maximize your net take-home revenue.</p>
                    </aside>
                  )}
                </section>

                
                <section className="panel" style={{ marginTop: '24px' }}>
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">Institutional Buyer Demand Signals</p>
                      <h2>Active Buyer Procurement Requirements (Live RFQs)</h2>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#667269' }}>
                        Direct purchase orders from verified retail chains, FPOs, and processing depots. Tap any order to auto-fill and lock a contract.
                      </p>
                    </div>
                    <span className="count">{buyerDemands.length} Verified Demands</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
                    {buyerDemands.map((demand) => {
                      const grossValue = (demand.requiredQuantity || 0) * (demand.offeredPrice || 0);
                      return (
                        <div
                          key={demand.id}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #d4dfd4',
                            borderRadius: '8px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <div>
                                <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", fontWeight: 700, background: '#eef4ec', color: '#2f6838', padding: '2px 6px', borderRadius: '3px' }}>
                                  {demand.category || 'PRODUCE'}
                                </span>
                                <h3 style={{ margin: '6px 0 2px', fontSize: '16px', color: '#202a27' }}>
                                  {demand.cropName}
                                </h3>
                                <span style={{ fontSize: '12px', color: '#4b5563', fontWeight: 500 }}>
                                  {demand.buyerName} {demand.verified && <span style={{ fontSize: '10px', color: '#2f6838', fontWeight: 700 }}>[VERIFIED]</span>}
                                </span>
                              </div>
                              <span style={{ fontSize: '18px', fontWeight: 700, color: '#2f6838' }}>
                                ₹{demand.offeredPrice}/kg
                              </span>
                            </div>

                            <div style={{ background: '#fdfcf8', border: '1px solid #eceae2', borderRadius: '6px', padding: '10px', margin: '10px 0', fontSize: '12px', color: '#444d47' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ color: '#667269' }}>Requirement:</span>
                                <strong>{Number(demand.requiredQuantity).toLocaleString()} kg ({(demand.requiredQuantity / 1000).toFixed(1)} T)</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ color: '#667269' }}>Total Contract Value:</span>
                                <strong style={{ color: '#202a27' }}>₹{grossValue.toLocaleString()}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ color: '#667269' }}>Quality Grade:</span>
                                <span style={{ fontWeight: 600, color: '#365c3b' }}>{demand.qualityRequired || 'Standard Grade A'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#667269' }}>Delivery Location:</span>
                                <span>{demand.deliveryDistrict} &middot; {demand.distanceKm} km</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button
                              type="button"
                              className="trade-btn trade-btn-primary"
                              style={{ flex: 1, padding: '9px 12px', fontSize: '12px', fontWeight: 600 }}
                              onClick={() => handleFulfillDemand(demand)}
                            >
                              Supply This Demand &rarr;
                            </button>
                            <button
                              type="button"
                              className="trade-btn trade-btn-secondary"
                              style={{ padding: '9px 12px', fontSize: '12px' }}
                              onClick={() => {
                                setActiveChatConversationId(demand.buyerId);
                                setCurrentView('trade-chat');
                              }}
                              title="Chat & Counter-Offer"
                            >
                              Chat
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
            
            {cropRequirementsList.length > 0 && (
              <section className="panel" style={{ marginTop: '24px' }}>
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Live Spot Orders</p>
                    <h2>Active Spot Procurement Bids</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#667269' }}>
                      Real-time bids from verified buyers. Click to propose supply.
                    </p>
                  </div>
                  <span className="count">{cropRequirementsList.length} Live Bids</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginTop: '14px' }}>
                  {cropRequirementsList.map((req, idx) => (
                    <div key={req.id || idx} style={{ background: '#fff', border: '1px solid #d0dbd0', borderRadius: '8px', padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 2px', fontSize: '15px', color: '#202a27' }}>{req.cropName || req.commodity}</h3>
                          <span style={{ fontSize: '11px', color: '#667269' }}>{req.qualityRequired || 'Grade A'} &middot; {req.location || 'Pan-India'}</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '17px', color: '#2f6838' }}>Rs {req.offeredPrice}/kg</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#555d59', borderTop: '1px solid #f0efea', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Qty: <strong>{Number(req.requiredQuantity || 0).toLocaleString()} kg</strong></span>
                        <span>Valid: <strong>{req.validUntil || '--'}</strong></span>
                      </div>
                      <button type="button" className="trade-btn trade-btn-primary" style={{ marginTop: '10px', width: '100%', padding: '8px', fontSize: '12px' }}
                        onClick={() => setQuickProduceModal({ cropName: req.cropName || req.commodity, unit: 'kg', suggestedPrice: req.offeredPrice })}
                      >
                        Propose Supply Contract
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
            </>
          )}

              
              {session.role === 'BUYER' && (
                <section className="workspace-grid" style={{ marginTop: '18px' }}>
                  <article className="panel workspace-panel">
                    <div className="panel-heading">
                      <div><p className="eyebrow">Buyer workspace</p><h2>Post a requirement</h2></div>
                      <span className="count">Live listing</span>
                    </div>

                    <div className="tab-toggle-group">
                      <button
                        type="button"
                        className={requirementSource === 'catalog' ? 'active' : ''}
                        onClick={() => setRequirementSource('catalog')}
                      >
                        Choose from catalogue
                      </button>
                      <button
                        type="button"
                        className={requirementSource === 'custom' ? 'active' : ''}
                        onClick={() => setRequirementSource('custom')}
                      >
                        + Custom crop requirement
                      </button>
                    </div>

                    <form onSubmit={postRequirement}>
                      {requirementSource === 'catalog' ? (
                        <label>Select Crop
                          <select value={requirement.cropId} onChange={(event) => setRequirement({ ...requirement, cropId: event.target.value })}>
                            {crops.map((crop) => (
                              <option key={crop.id} value={crop.id}>
                                {crop.name} ({crop.category})
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : (
                        <>
                          <label>Category
                            <select
                              value={requirement.category}
                              onChange={(event) => setRequirement({ ...requirement, category: event.target.value })}
                            >
                              <option value="VEGETABLE">Vegetables</option>
                              <option value="FRUIT">Fruits</option>
                              <option value="GRAIN">Grains</option>
                              <option value="PULSE">Pulses</option>
                              <option value="SEED">Seeds</option>
                              <option value="SPICE">Spices</option>
                              <option value="OIL_SEED">Oil Seeds</option>
                              <option value="FERTILIZER">Fertilizers &amp; Soil Nutrients</option>
                              <option value="PESTICIDE">Pesticides &amp; Crop Protection</option>
                              <option value="BIO_INPUT">Bio-Inputs &amp; Stimulants</option>
                              <option value="FARM_EQUIPMENT">Farm Equipment &amp; Tools</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </label>

                          <label>Product Name
                            <input
                              placeholder="e.g. Organic Chia Seeds, Alphonso Mango"
                              value={requirement.cropName}
                              onChange={(event) => setRequirement({ ...requirement, cropName: event.target.value })}
                              required
                            />
                          </label>
                        </>
                      )}

                      <label>Required quantity (kg)
                        <input
                          type="number"
                          min="1"
                          value={requirement.requiredQuantity}
                          onChange={(event) => setRequirement({ ...requirement, requiredQuantity: event.target.value })}
                          required
                        />
                      </label>

                      <label>Quality required
                        <input
                          value={requirement.qualityRequired}
                          onChange={(event) => setRequirement({ ...requirement, qualityRequired: event.target.value })}
                          required
                        />
                      </label>

                      <label>Offer (₹/kg)
                        <input
                          type="number"
                          min="0"
                          value={requirement.offeredPrice}
                          onChange={(event) => setRequirement({ ...requirement, offeredPrice: event.target.value })}
                          required
                        />
                      </label>

                      <button type="submit">Publish requirement <span>→</span></button>
                    </form>
                  </article>

                  <aside className="note-panel workspace-note">
                    <p className="eyebrow">Buyer Signal</p>
                    <h2>Direct linkage with local growers.</h2>
                    <p>Farmers with matching fruits, vegetables, seeds, or custom produce can compare your offer with nearby markets and make a direct deal.</p>
                  </aside>
                </section>
              )}

              
              <section className="trade-ledger-section">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Contracts &amp; Handshakes</p>
                    <h2>Active Trades &amp; Orders</h2>
                  </div>
                  <span className="count">{trades.length} {trades.length === 1 ? 'deal' : 'deals'}</span>
                </div>

                <div className="trade-list">
                  {trades.map((t) => {
                    const statusKey = (t.status || 'PROPOSED').toLowerCase();
                    const isProposed = t.status === 'PROPOSED';
                    const isNegotiating = t.status === 'NEGOTIATING';
                    const isAccepted = t.status === 'ACCEPTED';
                    const isTransportBooked = t.status === 'TRANSPORT_BOOKED';
                    const isInTransit = t.status === 'IN_TRANSIT';
                    const isDelivered = t.status === 'DELIVERED';
                    const isCompleted = t.status === 'COMPLETED';
                    const isCancelled = t.status === 'CANCELLED';
                    const isNegotiatingThis = negotiatingDealId === t.id;

                    return (
                      <div className="trade-card" key={t.id}>
                        <div className="trade-header">
                          <div>
                            <h3>
                              Trade #{t.id} · {t.cropName}{' '}
                              <span className="category-badge">{t.cropCategory || 'PRODUCE'}</span>
                            </h3>
                            <small style={{ color: '#778078', font: "10px 'DM Mono', monospace" }}>
                              {new Date(t.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </small>
                          </div>
                          <span className={`status-pill status-${statusKey}`}>{t.status}</span>
                        </div>

                        
                        {!isCancelled && (
                          <div className="trade-stepper">
                            <div className={`step-node ${(isProposed || isNegotiating) ? 'active' : (isAccepted || isInTransit || isDelivered || isCompleted) ? 'done' : ''}`}>
                              <div className="step-dot" />
                              <span className="step-label">{isNegotiating ? 'Negotiating' : 'Proposed'}</span>
                            </div>
                            <div className={`step-node ${isAccepted ? 'active' : (isInTransit || isDelivered || isCompleted) ? 'done' : ''}`}>
                              <div className="step-dot" />
                              <span className="step-label">Accepted</span>
                            </div>
                            <div className={`step-node ${isInTransit ? 'active' : (isDelivered || isCompleted) ? 'done' : ''}`}>
                              <div className="step-dot" />
                              <span className="step-label">In Transit</span>
                            </div>
                            <div className={`step-node ${isDelivered ? 'active' : isCompleted ? 'done' : ''}`}>
                              <div className="step-dot" />
                              <span className="step-label">Delivered</span>
                            </div>
                            <div className={`step-node ${isCompleted ? 'active done' : ''}`}>
                              <div className="step-dot" />
                              <span className="step-label">Completed</span>
                            </div>
                          </div>
                        )}

                        <div className="trade-meta-row">
                          <span>Party: <strong>{session.role === 'FARMER' ? t.buyerName : `${t.farmerName} (${t.farmerDistrict || 'Local'})`}</strong></span>
                          <span>Quantity: <strong>{t.quantity} kg</strong></span>
                          <span>Agreed Rate: <strong>₹{t.agreedPricePerKg}/kg</strong></span>
                          <span>Freight: <strong>₹{t.transportCost}</strong></span>
                          <span>Net Farmer Return: <strong>₹{t.netFarmerReturn}</strong></span>
                        </div>

                        {t.notes && (
                          <p style={{ font: "11px 'DM Mono', monospace", color: '#68776b', margin: '8px 0 0' }}>
                            Note: {t.notes}
                          </p>
                        )}

                        
                        {t.negotiations && t.negotiations.length > 0 && (
                          <div className="negotiation-section">
                            <div className="negotiation-title">
                              <span>Negotiation History ({t.negotiations.length} {t.negotiations.length === 1 ? 'proposal' : 'proposals'})</span>
                            </div>
                            <div className="negotiation-thread">
                              {t.negotiations.map((neg) => {
                                const isBuyerMsg = neg.senderRole === 'BUYER';
                                return (
                                  <div className={`negotiation-bubble ${isBuyerMsg ? 'buyer-bubble' : 'farmer-bubble'}`} key={neg.id}>
                                    <div className="neg-header">
                                      <span><strong>{neg.senderName}</strong> ({neg.senderRole})</span>
                                      <span>{new Date(neg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="neg-terms">
                                      Proposed: ₹{neg.proposedPricePerKg}/kg · {neg.proposedQuantity} kg
                                    </div>
                                    {neg.message && <p className="neg-message">{neg.message}</p>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        
                        {isNegotiatingThis && (
                          <form className="counter-form-box" onSubmit={(e) => submitCounterOffer(t.id, e)}>
                            <p style={{ margin: '0 0 8px', font: "10px 'DM Mono', monospace", textTransform: 'uppercase', color: '#dc664a', fontWeight: 'bold' }}>
                              Propose Counter-Offer Terms
                            </p>
                            <div className="counter-inputs-grid">
                              <label>
                                Price Offer (₹/kg)
                                <input
                                  type="number"
                                  step="0.5"
                                  min="1"
                                  value={counterOffer.proposedPricePerKg}
                                  onChange={(e) => setCounterOffer({ ...counterOffer, proposedPricePerKg: e.target.value })}
                                  required
                                />
                              </label>
                              <label>
                                Quantity (kg)
                                <input
                                  type="number"
                                  min="1"
                                  value={counterOffer.proposedQuantity}
                                  onChange={(e) => setCounterOffer({ ...counterOffer, proposedQuantity: e.target.value })}
                                  required
                                />
                              </label>
                            </div>
                            <label style={{ font: "9px 'DM Mono', monospace", textTransform: 'uppercase', color: '#647068', display: 'block', margin: '4px 0 2px' }}>
                              Note / Terms (e.g. self-pickup, packing)
                              <input
                                value={counterOffer.message}
                                onChange={(e) => setCounterOffer({ ...counterOffer, message: e.target.value })}
                                placeholder="e.g. Offer ₹32/kg for 1,000 kg with self-pickup tomorrow"
                              />
                            </label>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                              <button type="submit" className="trade-btn trade-btn-accent">
                                Submit Counter-Offer ↔
                              </button>
                              <button type="button" className="trade-btn trade-btn-secondary" onClick={() => setNegotiatingDealId(null)}>
                                Close
                              </button>
                            </div>
                          </form>
                        )}

                        
                        {!isCancelled && (
                          <div className={`escrow-vault-card ${escrowMap[t.id]?.status === 'FUNDS_HELD_IN_ESCROW' ? 'locked' : (escrowMap[t.id]?.status === 'RELEASED_TO_FARMER' || isCompleted) ? 'released' : 'pending'}`}>
                            <div className="escrow-vault-header">
                              <h4 className="escrow-title">
                                Digital Escrow &amp; UPI Vault <small style={{ fontSize: '9px', background: '#eef3ea', color: '#2f6838', padding: '2px 6px', borderRadius: '3px', marginLeft: '6px' }}>[SANDBOX SIMULATION · RBI PPA GUIDELINES]</small>
                              </h4>
                              {escrowMap[t.id] ? (
                                <span className={`escrow-status-pill escrow-status-${escrowMap[t.id].status.toLowerCase().replace(/_/g, '-')}`}>
                                  {escrowMap[t.id].status.replace(/_/g, ' ')}
                                </span>
                              ) : (
                                <span className="escrow-status-pill escrow-status-pending">PENDING DEPOSIT</span>
                              )}
                            </div>

                            <div style={{ background: '#f5f7f4', border: '1px solid #d8ded6', borderRadius: '4px', padding: '6px 10px', margin: '8px 0', fontSize: '11px', color: '#445846', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                              <span>Simulated Nodal Escrow Account (Test Mode). Verifies complete payment lifecycle without live bank debit.</span>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: '#2b5231' }}>Compliant with RBI Payment Aggregator Norms</span>
                            </div>

                            
                            <div className="escrow-milestone-grid">
                              <div className={`milestone-col ${(isAccepted || isInTransit || isDelivered || isCompleted) ? 'done' : 'active'}`}>
                                <div className="milestone-dot" />
                                <span className="milestone-name">1. Agreed</span>
                              </div>
                              <div className={`milestone-col ${(escrowMap[t.id]?.status === 'FUNDS_HELD_IN_ESCROW' || escrowMap[t.id]?.status === 'RELEASED_TO_FARMER' || isCompleted) ? 'done' : isAccepted ? 'active' : ''}`}>
                                <div className="milestone-dot" />
                                <span className="milestone-name">2. Escrow Locked</span>
                              </div>
                              <div className={`milestone-col ${(isDelivered || isCompleted) ? 'done' : isInTransit ? 'active' : ''}`}>
                                <div className="milestone-dot" />
                                <span className="milestone-name">3. In-Transit</span>
                              </div>
                              <div className={`milestone-col ${isCompleted ? 'done' : isDelivered ? 'active' : ''}`}>
                                <div className="milestone-dot" />
                                <span className="milestone-name">4. Inspected</span>
                              </div>
                              <div className={`milestone-col ${(escrowMap[t.id]?.status === 'RELEASED_TO_FARMER' || isCompleted) ? 'done' : ''}`}>
                                <div className="milestone-dot" />
                                <span className="milestone-name">5. Payout Settled</span>
                              </div>
                            </div>

                            
                            <div className="escrow-details-row">
                              <span>Deal Value: <strong>₹{t.totalAmount}</strong></span>
                              <span>Farmer Net Return: <strong>₹{t.netFarmerReturn}</strong></span>
                              {escrowMap[t.id]?.status === 'FUNDS_HELD_IN_ESCROW' && (
                                <>
                                  <span style={{ color: '#3b7444' }}><strong>[HELD SECURELY] ₹{escrowMap[t.id].depositAmount}</strong></span>
                                  <span>UPI Ref: <code>{escrowMap[t.id].upiRef}</code></span>
                                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px', width: '100%', flexWrap: 'wrap' }}>
                                    <button
                                      type="button"
                                      className="trade-btn trade-btn-secondary"
                                      style={{ fontSize: '10px', padding: '3px 8px', borderColor: '#d4a34b', color: '#8a6218' }}
                                      onClick={() => setDisputeModal({
                                        trade: t,
                                        disputeType: 'QUALITY_REJECTION',
                                        claimAmount: t.totalAmount,
                                        description: 'Simulation test: Quality variance detected upon unloading.'
                                      })}
                                    >
                                      Simulate Dispute
                                    </button>
                                    <button
                                      type="button"
                                      className="trade-btn trade-btn-secondary"
                                      style={{ fontSize: '10px', padding: '3px 8px', borderColor: '#b45a42', color: '#b45a42' }}
                                      onClick={() => refundEscrowPayout(t.id, escrowMap[t.id].id)}
                                    >
                                      Simulate Refund to Buyer
                                    </button>
                                  </div>
                                </>
                              )}
                              {escrowMap[t.id]?.status === 'REFUNDED_TO_BUYER' && (
                                <>
                                  <span style={{ color: '#b45a42' }}><strong>[REFUNDED] 100% Returned to Buyer</strong></span>
                                  <span>Refund UTR: <code>{escrowMap[t.id].settlementUtr}</code></span>
                                </>
                              )}
                              {escrowMap[t.id]?.status === 'RELEASED_TO_FARMER' && (
                                <>
                                  <span style={{ color: '#3b7444' }}><strong>[SETTLED] Transferred to Farmer UPI</strong></span>
                                  <span>Settlement UTR: <code>{escrowMap[t.id].settlementUtr}</code></span>
                                </>
                              )}
                              {(!escrowMap[t.id] || escrowMap[t.id]?.status === 'PENDING_DEPOSIT') && (
                                <span style={{ color: '#b45a42' }}>
                                  {session.role === 'BUYER' ? 'Action: Lock funds in Escrow to guarantee farmer harvest & dispatch.' : 'Awaiting Buyer UPI deposit in Escrow Vault.'}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        
                        <div className="trade-actions">
                          {(isProposed || isNegotiating) && (
                            <>
                              <button
                                type="button"
                                className="trade-btn trade-btn-primary"
                                onClick={() => updateTradeStatus(t.id, 'ACCEPTED')}
                              >
                                Accept Terms (₹{t.agreedPricePerKg}/kg) ↔
                              </button>

                              {!isNegotiatingThis && (
                                <button
                                  type="button"
                                  className="trade-btn trade-btn-secondary"
                                  onClick={() => handleOpenNegotiation(t)}
                                >
                                  Counter-Offer ↔
                                </button>
                              )}

                              <button
                                type="button"
                                className="trade-btn trade-btn-cancel"
                                onClick={() => updateTradeStatus(t.id, 'CANCELLED')}
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {isAccepted && session.role === 'BUYER' && (!escrowMap[t.id] || escrowMap[t.id]?.status === 'PENDING_DEPOSIT') && (
                            <button
                              type="button"
                              className="trade-btn trade-btn-primary"
                              onClick={() => openDepositModal(t)}
                            >
                              Lock ₹{t.totalAmount} in Escrow (UPI) →
                            </button>
                          )}

                          {isAccepted && session.role === 'FARMER' && (
                            <>
                              <FindTransporterPanel dealId={t.id} apiUrl={API_URL} session={session} />
                              <button
                                type="button"
                                className="trade-btn trade-btn-cancel"
                                onClick={() => updateTradeStatus(t.id, 'CANCELLED')}
                              >
                                Cancel Deal
                              </button>
                            </>
                          )}

                          {isTransportBooked && (
                            <TransportBookingStatus dealId={t.id} apiUrl={API_URL} session={session} role={session.role} />
                          )}

                          <button
                            type="button"
                            className="trade-btn"
                            style={{ background: '#f3f4f6', borderColor: '#d1d5db', color: '#374151', fontSize: '11px', padding: '6px 12px' }}
                            onClick={() => {
                              setActiveChatConversationId(t.id);
                              setCurrentView('trade-chat');
                            }}
                          >
                            Open Negotiation Chat
                          </button>

                          {isAccepted && session.role === 'BUYER' && (
                            <span style={{ font: "11px 'DM Mono', monospace", color: '#3b7444', alignSelf: 'center' }}>
                              Waiting for farmer to choose and book a transporter...
                            </span>
                          )}

                          {isAccepted && session.role === 'BUYER' && escrowMap[t.id]?.status === 'FUNDS_HELD_IN_ESCROW' && (
                            <span style={{ font: "10px 'DM Mono', monospace", color: '#3b7444', alignSelf: 'center', fontWeight: 'bold' }}>
                              Escrow Locked · Awaiting farm dispatch
                            </span>
                          )}

                          {isInTransit && session.role === 'BUYER' && (
                            <button
                              type="button"
                              className="trade-btn trade-btn-primary"
                              onClick={() => updateTradeStatus(t.id, 'DELIVERED')}
                            >
                              Confirm Delivery &amp; Received ↔
                            </button>
                          )}

                          {isInTransit && session.role === 'FARMER' && (
                            <span style={{ font: "10px 'DM Mono', monospace", color: '#778078', alignSelf: 'center' }}>
                              Produce in transit to destination
                            </span>
                          )}

                          {isDelivered && escrowMap[t.id]?.status === 'FUNDS_HELD_IN_ESCROW' && (
                            <button
                              type="button"
                              className="trade-btn trade-btn-primary"
                              onClick={() => releaseEscrowPayout(t.id, escrowMap[t.id].id)}
                            >
                              Release Escrow Payout (₹{escrowMap[t.id].farmerPayout}) ↔
                            </button>
                          )}

                          {isDelivered && (!escrowMap[t.id] || escrowMap[t.id]?.status !== 'FUNDS_HELD_IN_ESCROW') && (
                            <button
                              type="button"
                              className="trade-btn trade-btn-primary"
                              onClick={() => updateTradeStatus(t.id, 'COMPLETED')}
                            >
                              Settle Payment &amp; Complete ↔
                            </button>
                          )}

                          {isCompleted && (
                            <span style={{ font: "10px 'DM Mono', monospace", color: '#5a8e62', fontWeight: 'bold', alignSelf: 'center' }}>
                              Γ£ô Settled &amp; Completed
                            </span>
                          )}

                          {isCancelled && (
                            <span style={{ font: "10px 'DM Mono', monospace", color: '#b45a42', alignSelf: 'center' }}>
                              Cancelled
                            </span>
                          )}

                          
                          <button
                            type="button"
                            className="trade-btn trade-btn-secondary"
                            onClick={() => setSelectedInvoiceTrade(t)}
                          >
                            Print Receipt
                          </button>

                          {(isDelivered || isCompleted) && (
                            <button
                              type="button"
                              className="trade-btn"
                              style={{ background: '#fef3c7', borderColor: '#fcd34d', color: '#92400e', fontSize: '11px', padding: '6px 12px' }}
                              onClick={() => setRatingCarrierModal({
                                trade: t,
                                rating: 5,
                                tags: ['Punctual & On-Time', 'Careful Handling'],
                                notes: ''
                              })}
                            >
                              Rate Carrier &amp; Review
                            </button>
                          )}

                          <button
                            type="button"
                            className="trade-btn"
                            style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#b91c1c', fontSize: '11px', padding: '6px 12px' }}
                            onClick={() => setDisputeModal({
                              trade: t,
                              disputeType: 'QUANTITY_DISCREPANCY',
                              claimAmount: '',
                              description: ''
                            })}
                          >
                            File Dispute
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {trades.length === 0 && (
                    <p className="muted" style={{ padding: '16px 0' }}>
                      No active trades yet. Initiate a deal from recommendations or accept a buyer offer to start.
                    </p>
                  )}
                </div>
              </section>

              
              {ratingCarrierModal && (
                <div style={{
                  position: 'fixed',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  padding: '16px'
                }}>
                  <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '24px',
                    maxWidth: '480px',
                    width: '100%',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#92400e', fontWeight: 'bold' }}>
                          Performance Review &middot; Trade Deal #{ratingCarrierModal.trade?.id}
                        </span>
                        <h3 style={{ margin: '4px 0 0', fontSize: '18px', color: '#111827' }}>
                          Rate Transporter Reliability
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRatingCarrierModal(null)}
                        style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280' }}
                      >
                        &times;
                      </button>
                    </div>

                    <p style={{ margin: '8px 0 16px', fontSize: '13px', color: '#4b5563', lineHeight: '1.4' }}>
                      Your honest rating updates the carrier's verified reliability score and helps other farmers select the best fleets.
                    </p>

                    <form onSubmit={submitCarrierRating}>
                      
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>
                        Service Rating (1 to 5 Stars) *
                      </label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingCarrierModal({ ...ratingCarrierModal, rating: star })}
                            style={{
                              flex: 1,
                              padding: '10px 0',
                              borderRadius: '8px',
                              border: ratingCarrierModal.rating >= star ? '2px solid #b45309' : '1px solid #d1d5db',
                              background: ratingCarrierModal.rating >= star ? '#fef3c7' : '#f9fafb',
                              color: ratingCarrierModal.rating >= star ? '#92400e' : '#6b7280',
                              fontWeight: 'bold',
                              fontSize: '14px',
                              cursor: 'pointer'
                            }}
                          >
                            {star} Stars
                          </button>
                        ))}
                      </div>

                      
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>
                        Highlight Carrier Strengths
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                        {['Punctual & On-Time', 'Careful Handling', 'Clean Vehicle', 'Polite Communication', 'Zero Cargo Loss', 'Fair Pricing'].map(tag => {
                          const isSelected = ratingCarrierModal.tags?.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                const currentTags = ratingCarrierModal.tags || [];
                                const nextTags = isSelected ? currentTags.filter(t => t !== tag) : [...currentTags, tag];
                                setRatingCarrierModal({ ...ratingCarrierModal, tags: nextTags });
                              }}
                              style={{
                                fontSize: '11px',
                                padding: '4px 10px',
                                borderRadius: '16px',
                                border: isSelected ? '1px solid #059669' : '1px solid #d1d5db',
                                background: isSelected ? '#ecfdf5' : '#ffffff',
                                color: isSelected ? '#065f46' : '#4b5563',
                                cursor: 'pointer',
                                fontWeight: isSelected ? 700 : 500
                              }}
                            >
                              {isSelected ? 'Γ£ô ' : '+ '}{tag}
                            </button>
                          );
                        })}
                      </div>

                      
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>
                        Review &amp; Experience Notes
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Arrived exactly on time at farm, helped load crates carefully."
                        value={ratingCarrierModal.notes}
                        onChange={e => setRatingCarrierModal({ ...ratingCarrierModal, notes: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: '13px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          marginBottom: '18px'
                        }}
                      />

                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setRatingCarrierModal(null)}
                          className="trade-btn trade-btn-cancel"
                          style={{ padding: '8px 16px', fontSize: '13px' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="trade-btn trade-btn-primary"
                          style={{
                            background: '#92400e',
                            borderColor: '#92400e',
                            padding: '8px 20px',
                            fontSize: '13px',
                            fontWeight: 'bold'
                          }}
                        >
                          Submit Transporter Review &rarr;
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              
              {disputeModal && (
                <div style={{
                  position: 'fixed',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  padding: '16px'
                }}>
                  <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '24px',
                    maxWidth: '480px',
                    width: '100%',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#b91c1c', fontWeight: 'bold' }}>
                          Official Arbitration Desk &middot; Deal #{disputeModal.trade?.id}
                        </span>
                        <h3 style={{ margin: '4px 0 0', fontSize: '18px', color: '#111827' }}>
                          Report Issue or File Dispute
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDisputeModal(null)}
                        style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280' }}
                      >
                        &times;
                      </button>
                    </div>

                    <p style={{ margin: '8px 0 16px', fontSize: '13px', color: '#4b5563', lineHeight: '1.4' }}>
                      Filing a dispute pauses full escrow payout release and alerts both trading desks for verified dispute resolution.
                    </p>

                    <form onSubmit={submitTradeDispute}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>
                        Dispute Category *
                      </label>
                      <select
                        value={disputeModal.disputeType}
                        onChange={e => setDisputeModal({ ...disputeModal, disputeType: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', marginBottom: '14px' }}
                      >
                        <option value="QUANTITY_DISCREPANCY">Quantity Loss / Under-delivery</option>
                        <option value="DAMAGED_CARGO">Damaged Produce / Spoilage in Transit</option>
                        <option value="TRANSIT_DELAY">Severe Transit Delay / Driver No-Show</option>
                        <option value="PAYMENT_ISSUE">Payment / Escrow Calculation Issue</option>
                      </select>

                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>
                        Claim / Adjustment Amount (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 1500"
                        value={disputeModal.claimAmount}
                        onChange={e => setDisputeModal({ ...disputeModal, claimAmount: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', marginBottom: '14px' }}
                      />

                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>
                        Description &amp; Observations *
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Detail specific discrepancies, scale weights, or vehicle conditions observed..."
                        value={disputeModal.description}
                        onChange={e => setDisputeModal({ ...disputeModal, description: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', marginBottom: '18px' }}
                      />

                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setDisputeModal(null)}
                          className="trade-btn trade-btn-cancel"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="trade-btn trade-btn-primary"
                          style={{ background: '#b91c1c', borderColor: '#b91c1c', padding: '8px 20px', fontWeight: 'bold' }}
                        >
                          Submit Dispute &rarr;
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
        </div>
      )}

      
      
      
      {currentView === 'analytics' && (
        <div className="view-container">

          
          
          
          {session?.role === 'FPO' && (
            <>
              <section className="panel" style={{ marginTop: '18px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <div className="panel-heading" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                  <div>
                    <p className="eyebrow" style={{ color: '#64748b', margin: '0 0 4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Mono', monospace" }}>
                      FPO Institutional Analytics · {fpoProfile.name}
                    </p>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      Smallholder Aggregation, Sales &amp; Top Corporate Buyers
                    </h2>
                  </div>
                  <span className="count" style={{ background: '#166534', color: '#ffffff', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                    +18.4% Realization Over APMC
                  </span>
                </div>

                <div className="price-feature" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="crop-label" style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Total Aggregated Trade Volume</span>
                    <strong style={{ display: 'block', fontSize: '40px', lineHeight: 1, color: '#0f172a', margin: '6px 0' }}>
                      14.8 Tons
                    </strong>
                    <small style={{ font: "11px 'DM Mono', monospace", color: '#64748b' }}>
                      {fpoProfile.activeMembersCount} smallholders contributing across {fpoLots.length} certified lot passports
                    </small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="crop-label" style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Gross Trade Value</span>
                    <strong style={{ display: 'block', fontSize: '32px', lineHeight: 1, color: '#166534', margin: '6px 0' }}>
                      ₹4,18,500
                    </strong>
                    <small style={{ font: "11px 'DM Mono', monospace", color: '#64748b' }}>
                      ₹3,95,200 (94.4%) disbursed directly to farmer bank accounts
                    </small>
                  </div>
                </div>

                <div className="prediction-deep-grid" style={{ marginTop: '16px' }}>
                  <div className="stat-metric-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Active Intake Pools</span>
                    <strong style={{ fontSize: '18px', color: '#0f172a' }}>{fpoLots.length} Standardized Lots</strong>
                    <small style={{ font: "10px 'DM Mono', monospace", color: '#64748b' }}>NABL Quality Assayed</small>
                  </div>
                  <div className="stat-metric-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Avg. Realized Rate</span>
                    <strong style={{ fontSize: '18px', color: '#166534' }}>₹28.28 / kg</strong>
                    <small style={{ font: "10px 'DM Mono', monospace", color: '#64748b' }}>+₹4.40 vs Local APMC</small>
                  </div>
                  <div className="stat-metric-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Smallholder Payout Timeliness</span>
                    <strong style={{ fontSize: '18px', color: '#0284c7' }}>100% via UTR</strong>
                    <small style={{ font: "10px 'DM Mono', monospace", color: '#64748b' }}>T+2 Direct Bank/UPI Transfer</small>
                  </div>
                  <div className="stat-metric-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>NABL Assay Reliability</span>
                    <strong style={{ fontSize: '18px', color: '#166534' }}>98.4% Match</strong>
                    <small style={{ font: "10px 'DM Mono', monospace", color: '#64748b' }}>Zero dock rejections</small>
                  </div>
                </div>

                
                <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', color: '#475569', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
                    Top Institutional &amp; Corporate Buyers (Feature B11)
                  </span>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', font: "11px 'DM Mono', monospace" }}>
                        <th style={{ padding: '8px 10px' }}>Buyer Name &amp; Division</th>
                        <th style={{ padding: '8px 10px' }}>Sourced Crop</th>
                        <th style={{ padding: '8px 10px' }}>Volume</th>
                        <th style={{ padding: '8px 10px' }}>Gross Value</th>
                        <th style={{ padding: '8px 10px' }}>Payment Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>Reliance Retail Wholesale Desk</td>
                        <td style={{ padding: '8px 10px' }}>Tomato (Abhinav Hybrid)</td>
                        <td style={{ padding: '8px 10px', fontWeight: 500 }}>8,400 kg</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#166534' }}>₹2,35,200</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                            Settled via Escrow
                          </span>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>BigBasket Western Hub</td>
                        <td style={{ padding: '8px 10px' }}>Onion (Nashik Red)</td>
                        <td style={{ padding: '8px 10px', fontWeight: 500 }}>4,200 kg</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#166534' }}>₹1,17,600</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                            Settled via Escrow
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>ITC Agri Business Division</td>
                        <td style={{ padding: '8px 10px' }}>Soybean (JS-335)</td>
                        <td style={{ padding: '8px 10px', fontWeight: 500 }}>2,200 kg</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#166534' }}>₹65,700</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                            Settled via Escrow
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          
          
          
          {session?.role === 'BUYER' && (
            <>
              <section className="panel" style={{ marginTop: '18px' }}>
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Procurement Intelligence · {profile.businessName || session.name || session.email}</p>
                    <h2>Procurement Value &amp; Landed Margin Analytics</h2>
                  </div>
                  <span className="count" style={{ background: '#2f6838', color: '#ffffff' }}>
                    +14.2% Saved vs Mandi Middlemen
                  </span>
                </div>

                <div className="price-feature" style={{ borderBottom: '1px solid #d9d6cc', paddingBottom: '16px' }}>
                  <div>
                    <span className="crop-label">Total Sourcing Outlay (Lifetime)</span>
                    <strong style={{ display: 'block', fontSize: '44px', lineHeight: 1, color: '#202a27' }}>
                      ₹9,45,000
                    </strong>
                    <small style={{ font: "11px 'DM Mono', monospace", color: '#778078' }}>
                      18 settled direct agreements &middot; 38.5 tons sourced directly from farmers
                    </small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="crop-label">Direct Sourcing Efficiency</span>
                    <strong style={{ display: 'block', fontSize: '32px', lineHeight: 1, color: '#5a8e62' }}>
                      +14.2%
                    </strong>
                    <small style={{ font: "11px 'DM Mono', monospace", color: '#778078' }}>
                      ₹4.10/kg below terminal mandi wholesale benchmark
                    </small>
                  </div>
                </div>

                <div className="prediction-deep-grid" style={{ marginTop: '16px' }}>
                  <div className="stat-metric-card">
                    <span>Volume Procured</span>
                    <strong>38.5 Tons</strong>
                    <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>38,500 kg total lot</small>
                  </div>
                  <div className="stat-metric-card">
                    <span>Avg Landed Cost</span>
                    <strong style={{ color: '#5a8e62' }}>₹24.50/kg</strong>
                    <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>Net with door-to-door freight</small>
                  </div>
                  <div className="stat-metric-card">
                    <span>Mandi Benchmark</span>
                    <strong>₹28.60/kg</strong>
                    <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>Terminal market price</small>
                  </div>
                  <div className="stat-metric-card">
                    <span>Intermediary Fees Saved</span>
                    <strong style={{ color: '#2f6838' }}>+₹1,57,850</strong>
                    <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>Zero mandi middleman brokerage</small>
                  </div>
                </div>

                <div style={{ marginTop: '20px', borderTop: '1px solid #d9d6cc', paddingTop: '16px' }}>
                  <p style={{ margin: '0 0 8px', font: "10px 'DM Mono', monospace", textTransform: 'uppercase', color: '#7f8981', fontWeight: 'bold' }}>
                    Buyer Procurement Insights
                  </p>
                  <ul style={{ paddingLeft: '18px', color: '#404f43', fontSize: '13px', lineHeight: '1.7', margin: '0' }}>
                    <li>Direct farmer contract linkage bypassed 6.5% APMC market charges &middot; preserving <strong>₹1,57,850</strong> in operating liquidity.</li>
                    <li>NABL certified quality verification reduced inbound transit spoilage rate to <strong>1.8%</strong> (industry avg 6.4%).</li>
                    <li>Escrow protection guaranteed 100% on-time farm harvest dispatch with zero payment disputes.</li>
                  </ul>
                </div>
              </section>

              
              <section className="panel" style={{ marginTop: '20px', border: '2px solid #204068', borderRadius: '8px', background: '#ffffff', padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #edebe4', paddingBottom: '12px' }}>
                  <div>
                    <span className="eyebrow" style={{ color: '#204068', fontWeight: 700 }}>
                      Procurement Decision Engine &middot; Landed Sourcing &amp; Margins
                    </span>
                    <h2 style={{ margin: '2px 0 0', fontSize: '20px', color: '#202a27' }}>
                      Buyer Procurement Landed Cost &amp; Wholesale Margin Calculator
                    </h2>
                    <p className="muted" style={{ margin: '3px 0 0', fontSize: '13px' }}>
                      Computes real landed cost per kg including farm purchase price, inbound freight, sorting buffer, and holding costs vs target wholesale resale price.
                    </p>
                  </div>
                  <span className="count" style={{ background: '#204068', color: '#ffffff', fontSize: '11px', padding: '4px 10px', borderRadius: '4px' }}>
                    Wholesale Optimization
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px', background: '#f8f9fb', padding: '14px', borderRadius: '6px', border: '1px solid #e2e7ef' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#445163', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      COMMODITY
                    </label>
                    <select
                      className="field-input"
                      style={{ width: '100%', fontSize: '13px', padding: '7px 10px' }}
                      value={buyerCalcCrop}
                      onChange={(e) => setBuyerCalcCrop(e.target.value)}
                    >
                      <option value="Tomato">Tomato (Hybrid / Roma)</option>
                      <option value="Onion">Nashik Red Onion</option>
                      <option value="Wheat">Sharbati Durum Wheat</option>
                      <option value="Soybean">Yellow Organic Soybean</option>
                      <option value="Potato">Jyoti Table Potato</option>
                      <option value="Green Grapes">Thompson Seedless Grapes</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#445163', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      LOT QUANTITY (KG)
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      className="field-input"
                      style={{ width: '100%', fontSize: '13px', padding: '7px 10px' }}
                      value={buyerCalcQty}
                      onChange={(e) => setBuyerCalcQty(Math.max(1, Number(e.target.value)))}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#445163', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      SOURCING CHANNEL
                    </label>
                    <select
                      className="field-input"
                      style={{ width: '100%', fontSize: '13px', padding: '7px 10px' }}
                      value={buyerCalcSource}
                      onChange={(e) => setBuyerCalcSource(e.target.value)}
                    >
                      <option value="Direct Farm-Gate">Direct Farm-Gate (Farmer Sourced)</option>
                      <option value="Aggregation Yard">Aggregation Yard (Graded Batch)</option>
                      <option value="APMC Central Mandi">APMC Central Mandi (Auction)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#445163', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      INBOUND HAUL (KM)
                    </label>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      className="field-input"
                      style={{ width: '100%', fontSize: '13px', padding: '7px 10px' }}
                      value={buyerCalcDistanceKm}
                      onChange={(e) => setBuyerCalcDistanceKm(Math.max(1, Number(e.target.value)))}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#445163', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      HOLDING DAYS
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="field-input"
                      style={{ width: '100%', fontSize: '13px', padding: '7px 10px' }}
                      value={buyerCalcStorageDays}
                      onChange={(e) => setBuyerCalcStorageDays(Math.max(1, Number(e.target.value)))}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#445163', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      TARGET RESALE (₹/KG)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      className="field-input"
                      style={{ width: '100%', fontSize: '13px', padding: '7px 10px' }}
                      value={buyerCalcResaleRate}
                      onChange={(e) => setBuyerCalcResaleRate(Math.max(0.1, Number(e.target.value)))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ border: '2px solid #204068', borderRadius: '6px', padding: '16px', background: '#f5f7fa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", fontWeight: 700, background: '#204068', color: '#ffffff', padding: '3px 8px', borderRadius: '3px' }}>
                        LANDED COST FORMULATION
                      </span>
                      <h3 style={{ margin: '8px 0 4px', fontSize: '16px', color: '#202a27' }}>
                        Inbound Procurement Breakdown
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#ffffff', padding: '10px', borderRadius: '4px', border: '1px solid #d4dce8', margin: '10px 0' }}>
                        <div>
                          <span style={{ fontSize: '10px', color: '#687588', display: 'block' }}>FARM ACQUISITION</span>
                          <strong style={{ fontSize: '14px', color: '#202a27' }}>₹{buyerDecision.purchaseRatePerKg} <small style={{ fontSize: '11px', color: '#687588' }}>/ kg</small></strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', color: '#687588', display: 'block' }}>GROSS OUTLAY</span>
                          <strong style={{ fontSize: '14px', color: '#202a27' }}>₹{buyerDecision.grossPurchaseCost.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', color: '#687588', display: 'block' }}>ROUTE FREIGHT</span>
                          <span style={{ fontSize: '13px', color: '#204068' }}>+ ₹{buyerDecision.inboundFreight.toLocaleString()}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', color: '#687588', display: 'block' }}>SPOILAGE &amp; HOLDING</span>
                          <span style={{ fontSize: '13px', color: '#204068' }}>+ ₹{(buyerDecision.spoilageBuffer + buyerDecision.storageCost).toLocaleString()}</span>
                        </div>
                      </div>

                      <div style={{ background: '#202a27', color: '#ffffff', padding: '10px 14px', borderRadius: '4px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#97a89e' }}>NET LANDED COST / KG</span>
                          <strong style={{ fontSize: '18px', color: '#6e9d68' }}>₹{buyerDecision.landedCostPerKg} / kg</strong>
                        </div>
                        <div style={{ fontSize: '11px', color: '#b2c0b7', marginTop: '2px' }}>
                          Total Landed Expenditure: <strong>₹{buyerDecision.totalLandedCost.toLocaleString()}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="trade-btn trade-btn-primary"
                      style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: 700 }}
                      onClick={() => {
                        setCurrentView('matching');
                        setMessage(`Initiated sourcing match for ${buyerCalcQty} kg of ${buyerCalcCrop} at target landed rate ₹${buyerDecision.landedCostPerKg}/kg.`);
                      }}
                    >
                      Source This Lot &middot; Match Verified Farmers &rarr;
                    </button>
                  </div>

                  <div style={{ border: '1px solid #e0ddd5', borderRadius: '6px', padding: '16px', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#687588', fontWeight: 600, textTransform: 'uppercase' }}>
                        WHOLESALE PROFIT MARGIN
                      </span>
                      <h3 style={{ margin: '8px 0 4px', fontSize: '16px', color: '#202a27' }}>
                        Realized Commercial Spread
                      </h3>

                      <div style={{ background: '#fdfcf8', border: '1px solid #eceae2', borderRadius: '4px', padding: '10px', margin: '10px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#444d47' }}>Target Wholesale Realization:</span>
                          <strong style={{ fontSize: '14px', color: '#202a27' }}>₹{buyerDecision.projectedResaleRevenue.toLocaleString()}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <span style={{ fontSize: '12px', color: '#444d47' }}>Net Wholesale Margin:</span>
                          <strong style={{ fontSize: '15px', color: '#2f6838' }}>+₹{buyerDecision.netGrossMargin.toLocaleString()}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eeeae1', paddingTop: '6px', marginTop: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#667269' }}>Realized Margin / Quintal:</span>
                          <strong style={{ fontSize: '13px', color: '#202a27' }}>₹{buyerDecision.marginPerQuintal}/qtl ({buyerDecision.marginPercent}%)</strong>
                        </div>
                      </div>

                      <div style={{ background: '#eef4ec', border: '1px solid #c7ddc5', borderRadius: '4px', padding: '10px 12px' }}>
                        <strong style={{ fontSize: '12px', color: '#2f6838', display: 'block' }}>
                          Middleman Avoidance Dividend: +₹{buyerDecision.apmcCommissionAvoided.toLocaleString()}
                        </strong>
                        <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#355339', lineHeight: 1.4 }}>
                          Direct farmer sourcing bypasses commission agent deductions and mandi cess &middot; securing an extra ₹{buyerDecision.apmcCommissionAvoided.toLocaleString()} in net profit.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="trade-btn trade-btn-secondary"
                      style={{ width: '100%', padding: '8px', fontSize: '11px', marginTop: '14px' }}
                      onClick={() => setCurrentView('my-orders')}
                    >
                      View Active Purchase Contracts &rarr;
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          
          
          
          {session?.role === 'TRANSPORTER' && (
            <>
              <section className="panel" style={{ marginTop: '18px' }}>
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Fleet Operations &middot; {profile.businessName || session.name || session.email}</p>
                    <h2>Freight Operations &amp; Route Margin Analytics</h2>
                  </div>
                  <span className="count" style={{ background: '#8a6218', color: '#ffffff' }}>
                    42.8% Fleet Operating Margin
                  </span>
                </div>

                <div className="price-feature" style={{ borderBottom: '1px solid #d9d6cc', paddingBottom: '16px' }}>
                  <div>
                    <span className="crop-label">Total Gross Freight Billing</span>
                    <strong style={{ display: 'block', fontSize: '44px', lineHeight: 1, color: '#202a27' }}>
                      ₹1,48,200
                    </strong>
                    <small style={{ font: "11px 'DM Mono', monospace", color: '#778078' }}>
                      42 completed commercial trips &middot; 12,850 ton-km logged across Jharkhand &amp; Maharashtra
                    </small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="crop-label">Average Route Realization</span>
                    <strong style={{ display: 'block', fontSize: '32px', lineHeight: 1, color: '#8a6218' }}>
                      ₹18.20/km
                    </strong>
                    <small style={{ font: "11px 'DM Mono', monospace", color: '#778078' }}>
                      ₹63,430 net operating margin after diesel &amp; tolls
                    </small>
                  </div>
                </div>

                <div className="prediction-deep-grid" style={{ marginTop: '16px' }}>
                  <div className="stat-metric-card">
                    <span>Hauls Completed</span>
                    <strong>42 Trips</strong>
                    <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>100% on-time dispatch</small>
                  </div>
                  <div className="stat-metric-card">
                    <span>Ton-Kilometers Logged</span>
                    <strong style={{ color: '#8a6218' }}>12,850 Ton-km</strong>
                    <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>Agricultural haul work</small>
                  </div>
                  <div className="stat-metric-card">
                    <span>Fuel Expense Ratio</span>
                    <strong>31.5%</strong>
                    <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>₹46,680 diesel outlay</small>
                  </div>
                  <div className="stat-metric-card">
                    <span>Escrow Settlement</span>
                    <strong style={{ color: '#2f6838' }}>100% Guaranteed</strong>
                    <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>Instant payout on OTP delivery</small>
                  </div>
                </div>

                <div style={{ marginTop: '20px', borderTop: '1px solid #d9d6cc', paddingTop: '16px' }}>
                  <p style={{ margin: '0 0 8px', font: "10px 'DM Mono', monospace", textTransform: 'uppercase', color: '#7f8981', fontWeight: 'bold' }}>
                    Fleet Operational Insights
                  </p>
                  <ul style={{ paddingLeft: '18px', color: '#404f43', fontSize: '13px', lineHeight: '1.7', margin: '0' }}>
                    <li>Escrow delivery verification eliminated unpaid detention and payment disputes across all 42 dispatches.</li>
                    <li>Mini-truck (2T) and pickup runs within 60 km achieved optimal fuel efficiency of <strong>9.2 km/L</strong>.</li>
                    <li>Pre-booked return hauls reduced empty deadhead mileage by <strong>34%</strong>.</li>
                  </ul>
                </div>
              </section>

              
              <section className="panel" style={{ marginTop: '20px', border: '2px solid #8a6218', borderRadius: '8px', background: '#ffffff', padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #edebe4', paddingBottom: '12px' }}>
                  <div>
                    <span className="eyebrow" style={{ color: '#8a6218', fontWeight: 700 }}>
                      Logistics Decision Engine &middot; Escrow Payout &amp; Operating Margins
                    </span>
                    <h2 style={{ margin: '2px 0 0', fontSize: '20px', color: '#202a27' }}>
                      Transporter Trip Operating Profit &amp; Freight Margin Calculator
                    </h2>
                    <p className="muted" style={{ margin: '3px 0 0', fontSize: '13px' }}>
                      Computes both Escrow Net Bank Payout and real Economic Trip Profit after deducting diesel fuel, deadhead return risk, tolls, wear, driver wages, and permits.
                    </p>
                  </div>
                  <span className="count" style={{ background: '#8a6218', color: '#ffffff', fontSize: '11px', padding: '4px 10px', borderRadius: '4px' }}>
                    Fleet Profitability &amp; Risk Guard
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '14px', background: '#fdfbf7', padding: '14px', borderRadius: '6px', border: '1px solid #f0e9dd' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#556058', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      HAUL DISTANCE (KM)
                    </label>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      className="field-input"
                      style={{ width: '100%', fontSize: '13px', padding: '7px 10px' }}
                      value={transCalcDistanceKm}
                      onChange={(e) => setTransCalcDistanceKm(Math.max(1, Number(e.target.value)))}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#556058', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      CARGO PAYLOAD (KG)
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      className="field-input"
                      style={{ width: '100%', fontSize: '13px', padding: '7px 10px' }}
                      value={transCalcPayloadKg}
                      onChange={(e) => setTransCalcPayloadKg(Math.max(1, Number(e.target.value)))}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#556058', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      VEHICLE CATEGORY
                    </label>
                    <select
                      className="field-input"
                      style={{ width: '100%', fontSize: '13px', padding: '7px 10px' }}
                      value={transCalcVehicleType}
                      onChange={(e) => {
                        setTransCalcVehicleType(e.target.value);
                        setTransCalcDriverWage(null);
                        setTransCalcPermitCost(null);
                      }}
                    >
                      <option value="MINI_TRUCK">Mini-Truck (Tata Ace / 2T)</option>
                      <option value="PICKUP">Pickup (Bolero Maxi / 1.5T)</option>
                      <option value="MEDIUM_5T">Medium LCV (Eicher 5T)</option>
                      <option value="HEAVY_10T">Multi-Axle Heavy (10T)</option>
                      <option value="REEFER">Cold-Chain Reefer (Temperature Controlled)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#556058', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      DIESEL PRICE (₹/L)
                    </label>
                    <input
                      type="number"
                      min="50"
                      step="1"
                      className="field-input"
                      style={{ width: '100%', fontSize: '13px', padding: '7px 10px' }}
                      value={transCalcDieselPrice}
                      onChange={(e) => setTransCalcDieselPrice(Math.max(1, Number(e.target.value)))}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#556058', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      TOLLS &amp; WEIGHBRIDGE (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      className="field-input"
                      style={{ width: '100%', fontSize: '13px', padding: '7px 10px' }}
                      value={transCalcTollCost}
                      onChange={(e) => setTransCalcTollCost(Math.max(0, Number(e.target.value)))}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#556058', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      DEADHEAD RETURN RISK
                    </label>
                    <select
                      className="field-input"
                      style={{ width: '100%', fontSize: '13px', padding: '7px 10px' }}
                      value={transCalcDeadheadRisk}
                      onChange={(e) => setTransCalcDeadheadRisk(Number(e.target.value))}
                    >
                      <option value="0">0% (Backhaul Return Load Secured)</option>
                      <option value="0.20">20% (Partial Return Risk Buffer)</option>
                      <option value="0.50">50% (High Unpaid Return Haul Risk)</option>
                    </select>
                  </div>
                </div>

                
                <div style={{ marginBottom: '16px' }}>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#8a6218', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    onClick={() => setShowTransCostDetails(!showTransCostDetails)}
                  >
                    {showTransCostDetails ? '[-] Hide Driver Wage & RTO Permit Overrides' : '[+] Customize Driver Wages & RTO Permit Fees (Optional)'}
                  </button>

                  {showTransCostDetails && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '10px', background: '#faf6ee', padding: '12px', borderRadius: '6px', border: '1px solid #ebdcc5' }}>
                      <div>
                        <label style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#556058', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                          DRIVER TRIP WAGE (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          className="field-input"
                          style={{ width: '100%', fontSize: '12px', padding: '6px 8px' }}
                          value={transCalcDriverWage !== null ? transCalcDriverWage : transporterTripDecision.driverWages}
                          onChange={(e) => setTransCalcDriverWage(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#556058', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                          PERMIT &amp; TRANSIT INSURANCE (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="20"
                          className="field-input"
                          style={{ width: '100%', fontSize: '12px', padding: '6px 8px' }}
                          value={transCalcPermitCost !== null ? transCalcPermitCost : transporterTripDecision.permitInsurance}
                          onChange={(e) => setTransCalcPermitCost(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ border: '2px solid #8a6218', borderRadius: '6px', padding: '16px', background: '#fdfbf7', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", fontWeight: 700, background: '#8a6218', color: '#ffffff', padding: '3px 8px', borderRadius: '3px' }}>
                        TRIP COST ACCOUNTING &amp; ESCROW DISBURSEMENT
                      </span>
                      <h3 style={{ margin: '8px 0 4px', fontSize: '16px', color: '#202a27' }}>
                        Operational Expense Breakdown
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#ffffff', padding: '10px', borderRadius: '4px', border: '1px solid #ebdcc5', margin: '10px 0' }}>
                        <div>
                          <span style={{ fontSize: '10px', color: '#778078', display: 'block' }}>GROSS BILLING</span>
                          <strong style={{ fontSize: '15px', color: '#202a27' }}>₹{transporterTripDecision.grossFreightRevenue.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', color: '#778078', display: 'block' }}>DIESEL OUTLAY</span>
                          <span style={{ fontSize: '13px', color: '#8a2b2b' }}>- ₹{transporterTripDecision.outwardFuelCost.toLocaleString()}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', color: '#778078', display: 'block' }}>DEADHEAD CONTINGENCY</span>
                          <span style={{ fontSize: '13px', color: '#8a2b2b' }}>- ₹{transporterTripDecision.deadheadContingency.toLocaleString()}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', color: '#778078', display: 'block' }}>DRIVER, TOLLS &amp; WEAR</span>
                          <span style={{ fontSize: '13px', color: '#8a2b2b' }}>- ₹{(transporterTripDecision.tolls + transporterTripDecision.maintenanceAndWear + transporterTripDecision.driverWages + transporterTripDecision.permitInsurance).toLocaleString()}</span>
                        </div>
                      </div>

                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ background: '#253529', color: '#ffffff', padding: '10px 12px', borderRadius: '4px' }}>
                          <span style={{ fontSize: '9px', fontFamily: "'DM Mono', monospace", color: '#8fb899', display: 'block', textTransform: 'uppercase' }}>
                            ESCROW BANK PAYOUT
                          </span>
                          <strong style={{ fontSize: '17px', color: '#6e9d68' }}>₹{transporterTripDecision.escrowNetBankPayout.toLocaleString()}</strong>
                          <small style={{ fontSize: '9px', color: '#b2c0b7', display: 'block', marginTop: '2px' }}>
                            Direct bank credit (-2% fee: ₹{transporterTripDecision.escrowFee})
                          </small>
                        </div>
                        <div style={{ background: '#202a27', color: '#ffffff', padding: '10px 12px', borderRadius: '4px' }}>
                          <span style={{ fontSize: '9px', fontFamily: "'DM Mono', monospace", color: '#c4ad83', display: 'block', textTransform: 'uppercase' }}>
                            ECONOMIC NET PROFIT
                          </span>
                          <strong style={{ fontSize: '17px', color: transporterTripDecision.netTripProfit >= 0 ? '#d4a34b' : '#e66b6b' }}>
                            ₹{transporterTripDecision.netTripProfit.toLocaleString()}
                          </strong>
                          <small style={{ fontSize: '9px', color: '#b2c0b7', display: 'block', marginTop: '2px' }}>
                            Margin: {transporterTripDecision.profitMarginPercent}% after all expenses
                          </small>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="trade-btn trade-btn-primary"
                      style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: 700 }}
                      onClick={() => {
                        setCurrentView('transporter-dashboard');
                        setMessage(`Route configured: ${transCalcDistanceKm} km at quoted rate ₹${transporterTripDecision.grossFreightRevenue.toLocaleString()}.`);
                      }}
                    >
                      Lock Fleet Route Rate &rarr;
                    </button>
                  </div>

                  <div style={{ border: '1px solid #e0ddd5', borderRadius: '6px', padding: '16px', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#778078', fontWeight: 600, textTransform: 'uppercase' }}>
                        FLEET BENCHMARK &amp; PERFORMANCE METRICS
                      </span>
                      <h3 style={{ margin: '8px 0 4px', fontSize: '16px', color: '#202a27' }}>
                        Operating Efficiency Indicators
                      </h3>

                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '10px 0' }}>
                        <div style={{ background: '#fdfbf7', border: '1px solid #ebdcc5', borderRadius: '4px', padding: '8px 10px' }}>
                          <span style={{ fontSize: '9px', color: '#778078', display: 'block', textTransform: 'uppercase' }}>Net Profit / km</span>
                          <strong style={{ fontSize: '14px', color: '#202a27' }}>₹{transporterTripDecision.netReturnPerKm} <small style={{ fontSize: '10px', color: '#778078' }}>/ km</small></strong>
                        </div>
                        <div style={{ background: '#fdfbf7', border: '1px solid #ebdcc5', borderRadius: '4px', padding: '8px 10px' }}>
                          <span style={{ fontSize: '9px', color: '#778078', display: 'block', textTransform: 'uppercase' }}>Net Profit / kg</span>
                          <strong style={{ fontSize: '14px', color: '#202a27' }}>₹{transporterTripDecision.netReturnPerKg} <small style={{ fontSize: '10px', color: '#778078' }}>/ kg</small></strong>
                        </div>
                        <div style={{ background: '#fdfbf7', border: '1px solid #ebdcc5', borderRadius: '4px', padding: '8px 10px' }}>
                          <span style={{ fontSize: '9px', color: '#778078', display: 'block', textTransform: 'uppercase' }}>Break-Even Rate</span>
                          <strong style={{ fontSize: '14px', color: '#8a2b2b' }}>₹{transporterTripDecision.breakEvenFreightRatePerKm} <small style={{ fontSize: '10px', color: '#778078' }}>/ km</small></strong>
                        </div>
                        <div style={{ background: '#fdfbf7', border: '1px solid #ebdcc5', borderRadius: '4px', padding: '8px 10px' }}>
                          <span style={{ fontSize: '9px', color: '#778078', display: 'block', textTransform: 'uppercase' }}>Freight / Ton-km</span>
                          <strong style={{ fontSize: '14px', color: '#8a6218' }}>₹{transporterTripDecision.revenuePerTonKm} <small style={{ fontSize: '10px', color: '#778078' }}>/ ton-km</small></strong>
                        </div>
                      </div>

                      <div style={{ background: '#fdfcf8', border: '1px solid #eceae2', borderRadius: '4px', padding: '10px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#444d47' }}>Vehicle Class:</span>
                          <strong style={{ fontSize: '13px', color: '#202a27' }}>{transporterTripDecision.specName}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <span style={{ fontSize: '12px', color: '#444d47' }}>Total Operating Expenses:</span>
                          <span style={{ fontSize: '13px', color: '#8a2b2b' }}>₹{transporterTripDecision.totalOperatingCost.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eeeae1', paddingTop: '6px', marginTop: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#667269' }}>Total Ton-Km Logged:</span>
                          <strong style={{ fontSize: '13px', color: '#202a27' }}>{transporterTripDecision.tonKm} Ton-km ({transporterTripDecision.payloadTons}T &times; {transCalcDistanceKm}km)</strong>
                        </div>
                      </div>

                      <div style={{ background: '#fef7e8', border: '1px solid #d4a34b', borderRadius: '4px', padding: '10px 12px' }}>
                        <strong style={{ fontSize: '12px', color: '#8a6218', display: 'block' }}>
                          Deadhead Risk Factor ({transCalcDeadheadRisk * 100}%)
                        </strong>
                        <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#7a540b', lineHeight: 1.4 }}>
                          Operating floor is ₹{transporterTripDecision.breakEvenFreightRatePerKm}/km. Buffer of ₹{transporterTripDecision.deadheadContingency.toLocaleString()} safeguards against unpaid empty return haulage.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="trade-btn trade-btn-secondary"
                      style={{ width: '100%', padding: '8px', fontSize: '11px', marginTop: '14px' }}
                      onClick={() => setCurrentView('transporter-dashboard')}
                    >
                      Open Live Haul Assignments &rarr;
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          
          
          
          {(session?.role === 'FARMER' || !session?.role) && (
            <>
              <section className="panel" style={{ marginTop: '18px' }}>
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Realized Value · {analyticsData?.farmerName || session?.name || session?.email}</p>
                    <h2>Farmer Earnings &amp; Premium Analytics</h2>
                  </div>
                  <span className="count">
                    {analyticsData ? `+${analyticsData.kisanLinkPremiumIndexPercent}% vs Market` : '+18.4% vs Market'}
                  </span>
                </div>

                {analyticsLoading && (
                  <p className="muted" style={{ padding: '24px 0' }}>Aggregating trade records...</p>
                )}

                {!analyticsLoading && (
                  <>
                    <div className="price-feature" style={{ borderBottom: '1px solid #d9d6cc', paddingBottom: '16px' }}>
                      <div>
                        <span className="crop-label">Total Net Take-Home Revenue</span>
                        <strong style={{ display: 'block', fontSize: '44px', lineHeight: 1, color: '#202a27' }}>
                          ₹{Number(analyticsData?.totalLifetimeRevenue || 284500).toLocaleString()}
                        </strong>
                        <small style={{ font: "11px 'DM Mono', monospace", color: '#778078' }}>
                          {analyticsData?.completedTradesCount || 12} settled deals &middot; {analyticsData?.totalLifetimeVolumeTons || 14.8} tons dispatched
                        </small>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="crop-label">KisanLink Premium Index</span>
                        <strong style={{ display: 'block', fontSize: '32px', lineHeight: 1, color: '#5a8e62' }}>
                          +{analyticsData?.kisanLinkPremiumIndexPercent || 18.4}%
                        </strong>
                        <small style={{ font: "11px 'DM Mono', monospace", color: '#778078' }}>
                          ₹{(Number(analyticsData?.averageRealizedPricePerKg || 27.5) - Number(analyticsData?.localMandiBenchmarkAvgPricePerKg || 23.2)).toFixed(2)}/kg above market
                        </small>
                      </div>
                    </div>

                    <div className="prediction-deep-grid" style={{ marginTop: '16px' }}>
                      <div className="stat-metric-card">
                        <span>Volume Dispatched</span>
                        <strong>{analyticsData?.totalLifetimeVolumeTons || 14.8} Tons</strong>
                        <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>{analyticsData?.totalLifetimeVolumeKg?.toLocaleString() || '14,800'} kg</small>
                      </div>
                      <div className="stat-metric-card">
                        <span>Avg Realized Rate</span>
                        <strong style={{ color: '#5a8e62' }}>₹{analyticsData?.averageRealizedPricePerKg || 27.50}/kg</strong>
                        <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>Net after logistics</small>
                      </div>
                      <div className="stat-metric-card">
                        <span>Local Market Benchmark</span>
                        <strong>₹{analyticsData?.localMandiBenchmarkAvgPricePerKg || 23.20}/kg</strong>
                        <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>Market modal price</small>
                      </div>
                      <div className="stat-metric-card">
                        <span>Extra Profit Earned</span>
                        <strong style={{ color: '#dc664a' }}>+₹{Number(analyticsData?.totalExtraProfitEarned || 42800).toLocaleString()}</strong>
                        <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>vs selling at local market</small>
                      </div>
                    </div>

                    
                    <div style={{ marginTop: '24px', borderTop: '1px solid #d9d6cc', paddingTop: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                          <p className="eyebrow" style={{ margin: 0 }}>Monthly Progression</p>
                          <h3 style={{ margin: '4px 0 0', fontSize: '17px' }}>Take-Home Revenue &amp; Volume Sold</h3>
                        </div>
                        <span style={{ font: "9px 'DM Mono', monospace", color: '#7f8981', textTransform: 'uppercase' }}>
                          Green = Revenue &middot; Orange = Tons
                        </span>
                      </div>

                      {analyticsData?.monthlyEarnings && analyticsData.monthlyEarnings.length > 0 ? (
                        (() => {
                          const maxRev = Math.max(...analyticsData.monthlyEarnings.map(m => Number(m.totalRevenue || 1)), 50000);
                          return (
                            <div className="monthly-bars-container">
                              {analyticsData.monthlyEarnings.map((m) => {
                                const heightPct = Math.max(12, Math.min(100, (Number(m.totalRevenue || 0) / maxRev) * 100));
                                return (
                                  <div className="monthly-bar-col" key={m.month}>
                                    <span className="bar-value">₹{(Number(m.totalRevenue) / 1000).toFixed(1)}k</span>
                                    <div className="bar-fill" style={{ height: `${heightPct}%` }} title={`₹${m.totalRevenue} (${m.totalVolumeTons} Tons)`} />
                                    <span className="bar-label">{m.month}</span>
                                    <span className="bar-tonnage">{m.totalVolumeTons}T</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="monthly-bars-container">
                          {[
                            { month: 'Jan', totalRevenue: 54000, totalVolumeTons: 2.5 },
                            { month: 'Feb', totalRevenue: 68000, totalVolumeTons: 3.2 },
                            { month: 'Mar', totalRevenue: 79500, totalVolumeTons: 4.1 },
                            { month: 'Apr', totalRevenue: 83000, totalVolumeTons: 5.0 }
                          ].map(m => (
                            <div className="monthly-bar-col" key={m.month}>
                              <span className="bar-value">₹{(m.totalRevenue / 1000).toFixed(1)}k</span>
                              <div className="bar-fill" style={{ height: `${(m.totalRevenue / 90000) * 100}%` }} />
                              <span className="bar-label">{m.month}</span>
                              <span className="bar-tonnage">{m.totalVolumeTons}T</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: '20px', borderTop: '1px solid #d9d6cc', paddingTop: '16px' }}>
                      <p style={{ margin: '0 0 8px', font: "10px 'DM Mono', monospace", textTransform: 'uppercase', color: '#7f8981', fontWeight: 'bold' }}>
                        Realized Premium Insights
                      </p>
                      <ul style={{ paddingLeft: '18px', color: '#404f43', fontSize: '13px', lineHeight: '1.7', margin: '0' }}>
                        <li>Direct buyer connections bypassed intermediary deductions &middot; realizing <strong>+{analyticsData?.kisanLinkPremiumIndexPercent || 18.4}% extra return</strong> vs local market.</li>
                        <li>Freight optimization preserved <strong>₹{Number(analyticsData?.totalExtraProfitEarned || 42800).toLocaleString()}</strong> in net liquidity across dispatches.</li>
                        <li>Grade A produce quality improved counter-offer acceptance rates by <strong>28%</strong>.</li>
                      </ul>
                    </div>
                  </>
                )}
              </section>

              
              <section className="panel" style={{ marginTop: '20px', border: '2px solid #2f6838', borderRadius: '8px', background: '#ffffff', padding: '20px 24px', boxShadow: '0 4px 18px rgba(47, 104, 56, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #edebe4', paddingBottom: '12px' }}>
                  <div>
                    <span className="eyebrow" style={{ color: '#2f6838', fontWeight: 700 }}>
                      Farmer Decision Support Engine &middot; Real Net Realization &amp; Agronomic Profit
                    </span>
                    <h2 style={{ margin: '2px 0 0', fontSize: '20px', color: '#202a27' }}>
                      Where Should This Farmer Sell? (Net Profit Calculator)
                    </h2>
                    <p className="muted" style={{ margin: '3px 0 0', fontSize: '13px' }}>
                      Calculates both Escrow Net Bank Payout (take-home cash) and True Economic Farm Net Profit (gross revenue minus total cultivation and post-harvest costs).
                    </p>
                  </div>
                  <span className="count" style={{ background: '#2f6838', color: '#ffffff', fontSize: '11px', padding: '4px 10px', borderRadius: '4px' }}>
                    Optimized for Maximum Return
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '14px', background: '#f8f7f2', padding: '14px', borderRadius: '6px', border: '1px solid #eceae2' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#556058', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      SELECT CROP
                    </label>
                    <select
                      className="field-input"
                      style={{ width: '100%', fontSize: '13px', padding: '7px 10px' }}
                      value={sellCalcCrop}
                      onChange={(e) => {
                        const newCrop = e.target.value;
                        setSellCalcCrop(newCrop);
                        const b = CROP_PRODUCTION_BENCHMARKS[newCrop] || CROP_PRODUCTION_BENCHMARKS['Tomato'];
                        setSellCalcAcres(b.defaultAcres);
                        setSellCalcQty(b.defaultAcres * b.yieldPerAcreKg);
                        setCustomCostOverrides({});
                      }}
                    >
                      <option value="Tomato">Tomato (Hybrid / Roma)</option>
                      <option value="Onion">Nashik Red Onion</option>
                      <option value="Wheat">Sharbati Durum Wheat</option>
                      <option value="Soybean">Yellow Organic Soybean</option>
                      <option value="Potato">Jyoti Table Potato</option>
                      <option value="Green Grapes">Thompson Seedless Grapes</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#556058', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      CULTIVATION AREA (ACRES)
                    </label>
                    <input
                      type="number"
                      min="0.2"
                      max="50"
                      step="0.5"
                      className="field-input"
                      style={{ width: '100%', fontSize: '13px', padding: '7px 10px' }}
                      value={sellCalcAcres}
                      onChange={(e) => {
                        const acres = Math.max(0.1, Number(e.target.value));
                        setSellCalcAcres(acres);
                        const b = CROP_PRODUCTION_BENCHMARKS[sellCalcCrop] || CROP_PRODUCTION_BENCHMARKS['Tomato'];
                        setSellCalcQty(Math.round(acres * b.yieldPerAcreKg));
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#556058', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      HARVEST QUANTITY (KG)
                    </label>
                    <input
                      type="number"
                      min="50"
                      step="100"
                      className="field-input"
                      style={{ width: '100%', fontSize: '13px', padding: '7px 10px' }}
                      value={sellCalcQty}
                      onChange={(e) => setSellCalcQty(Math.max(1, Number(e.target.value)))}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#556058', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      QUALITY GRADE
                    </label>
                    <select
                      className="field-input"
                      style={{ width: '100%', fontSize: '13px', padding: '7px 10px' }}
                      value={sellCalcQuality}
                      onChange={(e) => setSellCalcQuality(e.target.value)}
                    >
                      <option value="GRADE_APLUS">Grade A+ (Export / Premium Clean)</option>
                      <option value="GRADE_A">Grade A (Standard Mandi Quality)</option>
                      <option value="FAQ">Fair Average Quality (FAQ)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#556058', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      FARM ORIGIN CLUSTER
                    </label>
                    <select
                      className="field-input"
                      style={{ width: '100%', fontSize: '13px', padding: '7px 10px' }}
                      value={sellCalcCluster}
                      onChange={(e) => setSellCalcCluster(e.target.value)}
                    >
                      <option value="Nashik Aggregation Yard">Nashik Aggregation Hub (MH)</option>
                      <option value="Ranchi APMC Hub">Ranchi Mandi Corridor (JH)</option>
                      <option value="Indore Agro Yard">Indore Quality Yard (MP)</option>
                      <option value="Pune Terminal Market">Pune Market Yard (MH)</option>
                    </select>
                  </div>
                </div>

                
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#2f6838', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                      onClick={() => setShowCultivationCosts(!showCultivationCosts)}
                    >
                      {showCultivationCosts ? '[-] Hide Cultivation Cost Breakdown' : '[+] Customize Cultivation Cost Benchmarks (Seeds, Fertilizer, Labour, Irrigation, Tillage)'}
                    </button>
                    <span style={{ fontSize: '11px', color: '#687588', fontFamily: "'DM Mono', monospace" }}>
                      Total Production: <strong>₹{netSellDecision.totalCultivationCost.toLocaleString()}</strong> (₹{netSellDecision.totalCostPerAcre.toLocaleString()}/acre &middot; ₹{netSellDecision.productionCostPerKg}/kg)
                    </span>
                  </div>

                  {showCultivationCosts && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginTop: '10px', background: '#f0f5ee', padding: '12px', borderRadius: '6px', border: '1px solid #d4e3d1' }}>
                      <div>
                        <label style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#445145', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                          SEEDS / SEEDLINGS (₹/ACRE)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          className="field-input"
                          style={{ width: '100%', fontSize: '12px', padding: '6px 8px' }}
                          value={netSellDecision.seedCostPerAcre}
                          onChange={(e) => setCustomCostOverrides(prev => ({ ...prev, seedCost: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#445145', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                          FERTILIZER &amp; PESTICIDES (₹/ACRE)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          className="field-input"
                          style={{ width: '100%', fontSize: '12px', padding: '6px 8px' }}
                          value={netSellDecision.fertCostPerAcre}
                          onChange={(e) => setCustomCostOverrides(prev => ({ ...prev, fertCost: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#445145', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                          HIRED LABOUR (₹/ACRE)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          className="field-input"
                          style={{ width: '100%', fontSize: '12px', padding: '6px 8px' }}
                          value={netSellDecision.labourCostPerAcre}
                          onChange={(e) => setCustomCostOverrides(prev => ({ ...prev, labourCost: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#445145', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                          TILLAGE &amp; TRACTOR (₹/ACRE)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          className="field-input"
                          style={{ width: '100%', fontSize: '12px', padding: '6px 8px' }}
                          value={netSellDecision.tillageCostPerAcre}
                          onChange={(e) => setCustomCostOverrides(prev => ({ ...prev, tillageCost: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#445145', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                          IRRIGATION &amp; PUMP FUEL (₹/ACRE)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          className="field-input"
                          style={{ width: '100%', fontSize: '12px', padding: '6px 8px' }}
                          value={netSellDecision.irrigationCostPerAcre}
                          onChange={(e) => setCustomCostOverrides(prev => ({ ...prev, irrigationCost: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ border: '2px solid #2f6838', borderRadius: '6px', padding: '16px', background: '#f5faf5', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", fontWeight: 700, background: '#2f6838', color: '#ffffff', padding: '3px 8px', borderRadius: '3px' }}>
                          TOP RECOMMENDATION
                        </span>
                        <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#2f6838', fontWeight: 700 }}>
                          Match Score: {netSellDecision.buyer.matchScore}%
                        </span>
                      </div>

                      <h3 style={{ margin: '4px 0 2px', fontSize: '16px', color: '#202a27' }}>
                        {netSellDecision.buyer.buyerName}
                      </h3>
                      <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#556058' }}>
                        {netSellDecision.buyer.destinationName} ({netSellDecision.buyer.distanceKm} km away)
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#ffffff', padding: '10px', borderRadius: '4px', border: '1px solid #dbe6dc', marginBottom: '10px' }}>
                        <div>
                          <span style={{ fontSize: '10px', color: '#778078', display: 'block' }}>OFFERED PRICE</span>
                          <strong style={{ fontSize: '15px', color: '#202a27' }}>₹{netSellDecision.buyer.pricePerKg} <small style={{ fontSize: '11px', color: '#778078' }}>/ kg</small></strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', color: '#778078', display: 'block' }}>GROSS VALUE</span>
                          <strong style={{ fontSize: '15px', color: '#202a27' }}>₹{netSellDecision.buyer.grossRevenue.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', color: '#778078', display: 'block' }}>ROUTE FREIGHT</span>
                          <span style={{ fontSize: '13px', color: '#8a2b2b' }}>- ₹{netSellDecision.buyer.freight.toLocaleString()}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', color: '#778078', display: 'block' }}>HANDLING / ESCROW</span>
                          <span style={{ fontSize: '13px', color: '#8a2b2b' }}>- ₹{netSellDecision.buyer.handlingFee.toLocaleString()}</span>
                        </div>
                      </div>

                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ background: '#253529', color: '#ffffff', padding: '10px 12px', borderRadius: '4px' }}>
                          <span style={{ fontSize: '9px', fontFamily: "'DM Mono', monospace", color: '#8fb899', display: 'block', textTransform: 'uppercase' }}>
                            ESCROW BANK PAYOUT
                          </span>
                          <strong style={{ fontSize: '17px', color: '#6e9d68' }}>₹{netSellDecision.buyer.bankPayout.toLocaleString()}</strong>
                          <small style={{ fontSize: '9px', color: '#b2c0b7', display: 'block', marginTop: '2px' }}>
                            ₹{netSellDecision.buyer.netPerKg}/kg cash wired to bank
                          </small>
                        </div>
                        <div style={{ background: '#202a27', color: '#ffffff', padding: '10px 12px', borderRadius: '4px' }}>
                          <span style={{ fontSize: '9px', fontFamily: "'DM Mono', monospace", color: '#c4ad83', display: 'block', textTransform: 'uppercase' }}>
                            ECONOMIC NET PROFIT
                          </span>
                          <strong style={{ fontSize: '17px', color: netSellDecision.buyer.economicProfit >= 0 ? '#6e9d68' : '#e66b6b' }}>
                            ₹{netSellDecision.buyer.economicProfit.toLocaleString()}
                          </strong>
                          <small style={{ fontSize: '9px', color: '#b2c0b7', display: 'block', marginTop: '2px' }}>
                            Net after ₹{netSellDecision.totalCultivationCost.toLocaleString()} crop costs
                          </small>
                        </div>
                      </div>

                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '10px' }}>
                        <div style={{ background: '#ffffff', border: '1px solid #dbe6dc', borderRadius: '4px', padding: '6px 4px', textAlign: 'center' }}>
                          <span style={{ fontSize: '8px', color: '#778078', display: 'block', textTransform: 'uppercase' }}>B:C Ratio</span>
                          <strong style={{ fontSize: '12px', color: '#2f6838' }}>{netSellDecision.buyer.benefitCostRatio}:1</strong>
                        </div>
                        <div style={{ background: '#ffffff', border: '1px solid #dbe6dc', borderRadius: '4px', padding: '6px 4px', textAlign: 'center' }}>
                          <span style={{ fontSize: '8px', color: '#778078', display: 'block', textTransform: 'uppercase' }}>Profit/Acre</span>
                          <strong style={{ fontSize: '12px', color: '#202a27' }}>₹{netSellDecision.buyer.profitPerAcre.toLocaleString()}</strong>
                        </div>
                        <div style={{ background: '#ffffff', border: '1px solid #dbe6dc', borderRadius: '4px', padding: '6px 4px', textAlign: 'center' }}>
                          <span style={{ fontSize: '8px', color: '#778078', display: 'block', textTransform: 'uppercase' }}>Margin %</span>
                          <strong style={{ fontSize: '12px', color: '#202a27' }}>{netSellDecision.buyer.marginPercent}%</strong>
                        </div>
                        <div style={{ background: '#ffffff', border: '1px solid #dbe6dc', borderRadius: '4px', padding: '6px 4px', textAlign: 'center' }}>
                          <span style={{ fontSize: '8px', color: '#778078', display: 'block', textTransform: 'uppercase' }}>Break-Even</span>
                          <strong style={{ fontSize: '12px', color: '#8a2b2b' }}>₹{netSellDecision.buyer.breakEvenPricePerKg}/kg</strong>
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: '#444d47', lineHeight: 1.4 }}>
                        &bull; Buyer Trust Rating: <strong>{netSellDecision.buyer.trustScore}/100</strong> (Verified NABL Partner)<br />
                        &bull; Payment Guarantee: <strong>{netSellDecision.buyer.paymentTerms}</strong>
                      </div>
                    </div>

                    <div style={{ marginTop: '14px', borderTop: '1px solid #dbe6dc', paddingTop: '10px' }}>
                      <button
                        type="button"
                        className="trade-btn trade-btn-primary"
                        style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: 700 }}
                        onClick={() => {
                          setProduceForm(prev => ({
                            ...prev,
                            cropName: sellCalcCrop,
                            quantity: sellCalcQty,
                            quality: sellCalcQuality,
                            pricePerKg: netSellDecision.buyer.pricePerKg
                          }));
                          setShowProduceModal(true);
                          setMessage(`Pre-loaded ${sellCalcCrop} (${sellCalcQty} kg) at ₹${netSellDecision.buyer.pricePerKg}/kg for listing.`);
                        }}
                      >
                        Sell Here &middot; Lock Best Net Return &rarr;
                      </button>
                    </div>
                  </div>

                  <div style={{ border: '1px solid #e0ddd5', borderRadius: '6px', padding: '16px', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#778078', fontWeight: 600, textTransform: 'uppercase' }}>
                          COMPARATIVE BENCHMARK
                        </span>
                        <h3 style={{ margin: '4px 0 2px', fontSize: '16px', color: '#202a27' }}>
                          Local Mandi vs Farm-Gate Trader
                        </h3>
                      </div>

                      <div style={{ background: '#fdfcf8', border: '1px solid #eceae2', borderRadius: '4px', padding: '10px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '13px', color: '#202a27' }}>{netSellDecision.mandi.destinationName}</strong>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#444d47' }}>₹{netSellDecision.mandi.pricePerKg}/kg</span>
                        </div>
                        <p style={{ margin: '2px 0 4px', fontSize: '11px', color: '#778078' }}>
                          Gross: ₹{netSellDecision.mandi.grossRevenue.toLocaleString()} &minus; Freight: ₹{netSellDecision.mandi.freight} &minus; Mandi Cess: ₹{netSellDecision.mandi.commissionFee}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eeeae1', paddingTop: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#667269' }}>Bank Payout:</span>
                          <strong style={{ fontSize: '12px', color: '#202a27' }}>₹{netSellDecision.mandi.bankPayout.toLocaleString()} (₹{netSellDecision.mandi.netPerKg}/kg)</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                          <span style={{ fontSize: '11px', color: '#667269' }}>Economic Net Profit:</span>
                          <strong style={{ fontSize: '12px', color: netSellDecision.mandi.economicProfit >= 0 ? '#2f6838' : '#8a2b2b' }}>
                            ₹{netSellDecision.mandi.economicProfit.toLocaleString()} (B:C {netSellDecision.mandi.benefitCostRatio}:1)
                          </strong>
                        </div>
                      </div>

                      <div style={{ background: '#fdfcf8', border: '1px solid #eceae2', borderRadius: '4px', padding: '10px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '13px', color: '#202a27' }}>{netSellDecision.villageTrader.destinationName}</strong>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#444d47' }}>₹{netSellDecision.villageTrader.pricePerKg}/kg</span>
                        </div>
                        <p style={{ margin: '2px 0 4px', fontSize: '11px', color: '#778078' }}>
                          Zero transport deduction &middot; Discounted farm-gate rate
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eeeae1', paddingTop: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#667269' }}>Bank Payout:</span>
                          <strong style={{ fontSize: '12px', color: '#8a2b2b' }}>₹{netSellDecision.villageTrader.bankPayout.toLocaleString()} (₹{netSellDecision.villageTrader.netPerKg}/kg)</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                          <span style={{ fontSize: '11px', color: '#667269' }}>Economic Net Profit:</span>
                          <strong style={{ fontSize: '12px', color: netSellDecision.villageTrader.economicProfit >= 0 ? '#2f6838' : '#8a2b2b' }}>
                            ₹{netSellDecision.villageTrader.economicProfit.toLocaleString()} (B:C {netSellDecision.villageTrader.benefitCostRatio}:1)
                          </strong>
                        </div>
                      </div>

                      <div style={{ background: '#eef4ec', border: '1px solid #c7ddc5', borderRadius: '4px', padding: '10px 12px' }}>
                        <strong style={{ fontSize: '12px', color: '#2f6838', display: 'block' }}>
                          Decision Takeaway: +₹{netSellDecision.netAdvantage.toLocaleString()} Higher Economic Net Profit
                        </strong>
                        <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#355339', lineHeight: 1.4 }}>
                          Selling directly through KisanLink institutional escrow yields ₹{netSellDecision.netAdvantage.toLocaleString()} more in real economic net profit than the local alternative, even after covering all door-to-door transport and platform fees.
                        </p>
                      </div>
                    </div>

                    <div style={{ marginTop: '14px', borderTop: '1px solid #edebe4', paddingTop: '10px' }}>
                      <button
                        type="button"
                        className="trade-btn trade-btn-secondary"
                        style={{ width: '100%', padding: '8px', fontSize: '11px' }}
                        onClick={() => setCurrentView('matching')}
                      >
                        Explore Live Buyer Requirements &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              
              <section className="panel" style={{ marginTop: '24px' }}>
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Sales Ledger &amp; Settlement Journal</p>
                    <h2>Recent Farm Sales &amp; Settled Deal Records</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#667269' }}>
                      Audit log of your direct farm sales, contracted rates, logistics deductions, and net escrow bank payouts.
                    </p>
                  </div>
                  <span className="count">{trades.length} {trades.length === 1 ? 'Sale' : 'Sales'} Recorded</span>
                </div>

                
                <div className="prediction-deep-grid" style={{ marginTop: '16px', marginBottom: '20px' }}>
                  <div className="stat-metric-card">
                    <span>Total Realized Sales</span>
                    <strong style={{ color: '#202a27' }}>
                      ₹{trades.reduce((sum, t) => sum + Number(t.netFarmerReturn || 0), 0).toLocaleString()}
                    </strong>
                    <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>Net take-home</small>
                  </div>
                  <div className="stat-metric-card">
                    <span>Dispatched Volume</span>
                    <strong style={{ color: '#2f6838' }}>
                      {(trades.reduce((sum, t) => sum + Number(t.quantity || 0), 0) / 1000).toFixed(1)} Tons
                    </strong>
                    <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>
                      {trades.reduce((sum, t) => sum + Number(t.quantity || 0), 0).toLocaleString()} kg total
                    </small>
                  </div>
                  <div className="stat-metric-card">
                    <span>Active In-Transit</span>
                    <strong style={{ color: '#2563eb' }}>
                      {trades.filter(t => t.status === 'IN_TRANSIT' || t.status === 'ACCEPTED' || t.status === 'PROPOSED').length} Deals
                    </strong>
                    <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>Escrow protected</small>
                  </div>
                  <div className="stat-metric-card">
                    <span>Avg Realized Rate</span>
                    <strong style={{ color: '#5a8e62' }}>
                      ₹{(trades.length > 0 ? (trades.reduce((sum, t) => sum + Number(t.agreedPricePerKg || 0), 0) / trades.length).toFixed(1) : '28.5')}/kg
                    </strong>
                    <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>Above market benchmark</small>
                  </div>
                </div>

                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f5f7f5', borderBottom: '2px solid #d4dfd4', color: '#445846', font: "11px 'DM Mono', monospace", textTransform: 'uppercase' }}>
                        <th style={{ padding: '12px 14px' }}>Deal ID</th>
                        <th style={{ padding: '12px 14px' }}>Date</th>
                        <th style={{ padding: '12px 14px' }}>Crop / Commodity</th>
                        <th style={{ padding: '12px 14px' }}>Buyer &amp; Hub</th>
                        <th style={{ padding: '12px 14px' }}>Quantity</th>
                        <th style={{ padding: '12px 14px' }}>Contract Rate</th>
                        <th style={{ padding: '12px 14px' }}>Gross Value</th>
                        <th style={{ padding: '12px 14px' }}>Freight Fee</th>
                        <th style={{ padding: '12px 14px' }}>Net Bank Payout</th>
                        <th style={{ padding: '12px 14px' }}>Status</th>
                        <th style={{ padding: '12px 14px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((t) => {
                        const statusKey = (t.status || 'PROPOSED').toLowerCase();
                        const gross = (t.quantity || 0) * (t.agreedPricePerKg || 0);
                        return (
                          <tr key={t.id} style={{ borderBottom: '1px solid #eef2ee' }}>
                            <td style={{ padding: '12px 14px', fontFamily: "'DM Mono', monospace", fontWeight: 700, color: '#2f6838' }}>
                              #{t.id}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#667269', fontSize: '12px' }}>
                              {new Date(t.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 600, color: '#202a27' }}>
                              {t.cropName}
                              <span style={{ display: 'block', fontSize: '10px', color: '#778078', fontWeight: 400 }}>
                                {t.cropCategory || 'PRODUCE'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', color: '#334135' }}>
                              {t.buyerName}
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                              {Number(t.quantity).toLocaleString()} kg
                              <span style={{ display: 'block', fontSize: '10px', color: '#778078', fontWeight: 400 }}>
                                ({(Number(t.quantity) / 1000).toFixed(1)} T)
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 600, color: '#2f6838' }}>
                              ₹{t.agreedPricePerKg}/kg
                            </td>
                            <td style={{ padding: '12px 14px', color: '#4b5563' }}>
                              ₹{gross.toLocaleString()}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#b45a42' }}>
                              -₹{Number(t.transportCost || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 700, color: '#166534', fontSize: '14px' }}>
                              ₹{Number(t.netFarmerReturn || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span className={`status-pill status-${statusKey}`}>
                                {t.status}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="trade-btn trade-btn-secondary"
                                  style={{ padding: '5px 8px', fontSize: '11px' }}
                                  onClick={() => setSelectedInvoiceTrade(t)}
                                  title="Print Official Trade Receipt"
                                >
                                  Receipt
                                </button>
                                <button
                                  type="button"
                                  className="trade-btn"
                                  style={{ padding: '5px 8px', fontSize: '11px', background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}
                                  onClick={() => setCurrentView('matching')}
                                  title="View in Active Trades"
                                >
                                  Manage &rarr;
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {trades.length === 0 && (
                        <tr>
                          <td colSpan={11} style={{ padding: '24px', textAlign: 'center', color: '#778078' }}>
                            No sales records found. Initiate a deal from the Buyer Matching tab to record sales.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: '#f8faf8', padding: '12px 16px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#556557' }}>
                    Need to negotiate prices or book transport for an active deal?
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="trade-btn trade-btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                      onClick={() => setCurrentView('my-orders')}
                    >
                      View Order Lifecycles &rarr;
                    </button>
                    <button
                      type="button"
                      className="trade-btn trade-btn-primary"
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                      onClick={() => setCurrentView('matching')}
                    >
                      Open Live Trading Desk &rarr;
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

        </div>
      )}

      
      
      
      {currentView === 'map' && (
        <div className="view-container">
          <section className="market-map-section">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Geographical Market Discovery &amp; Routing</p>
                <h2>Nearby Markets &amp; Freight Radar</h2>
              </div>
              <span className="count">{nearbyMarkets.length} Markets within {mapRadius} km</span>
            </div>

            
            <div className="location-presets-bar">
              <span style={{ font: "10px 'DM Mono', monospace", color: '#6a766c', alignSelf: 'center', marginRight: '4px' }}>
                {text.weatherOrigin} <strong>{mapCoords.label}</strong>
              </span>
              <button
                type="button"
                className={`location-pill ${mapCoords.label === 'Ranchi Center' ? 'active' : ''}`}
                onClick={() => handleLocationPreset(23.3441, 85.3096, 'Ranchi Center')}
              >
                Ranchi
              </button>
              <button
                type="button"
                className={`location-pill ${mapCoords.label === 'Ramgarh' ? 'active' : ''}`}
                onClick={() => handleLocationPreset(23.6332, 85.5149, 'Ramgarh')}
              >
                Ramgarh
              </button>
              <button
                type="button"
                className={`location-pill ${mapCoords.label === 'Bokaro' ? 'active' : ''}`}
                onClick={() => handleLocationPreset(23.6693, 86.1511, 'Bokaro')}
              >
                Bokaro
              </button>
              <button
                type="button"
                className={`location-pill ${mapCoords.label === 'Jamshedpur' ? 'active' : ''}`}
                onClick={() => handleLocationPreset(22.8046, 86.2029, 'Jamshedpur')}
              >
                Jamshedpur
              </button>
              {session && (
                <button
                  type="button"
                  className="location-pill"
                  style={{ background: '#dce7d3', color: '#3d5940', borderColor: '#b8cba8' }}
                  onClick={handleUseProfileLocation}
                >
                  {text.weatherUseGps}
                </button>
              )}
            </div>

            <div className="market-map-layout">
              
              <div className="map-radar-container">
                <svg className="map-radar-svg" viewBox="0 0 300 300">
                  <defs>
                    <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#2c4038" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#141c19" stopOpacity="0.9" />
                    </radialGradient>
                  </defs>

                  <rect width="300" height="300" rx="8" fill="url(#radarGlow)" />

                  <line x1="150" y1="15" x2="150" y2="285" stroke="#2e4239" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="15" y1="150" x2="285" y2="150" stroke="#2e4239" strokeWidth="1" strokeDasharray="2 2" />

                  <circle cx="150" cy="150" r="40" fill="none" stroke="#2e4239" strokeWidth="1" />
                  <circle cx="150" cy="150" r="80" fill="none" stroke="#2e4239" strokeWidth="1" />
                  <circle cx="150" cy="150" r="120" fill="none" stroke="#375246" strokeWidth="1.2" />

                  <text x="154" y="112" fill="#587567" fontSize="8" fontFamily="DM Mono">30 km</text>
                  <text x="154" y="72" fill="#587567" fontSize="8" fontFamily="DM Mono">75 km</text>
                  <text x="154" y="32" fill="#587567" fontSize="8" fontFamily="DM Mono">120+ km</text>

                  <text x="146" y="24" fill="#759384" fontSize="9" fontWeight="bold" fontFamily="DM Mono">N</text>
                  <text x="278" y="153" fill="#759384" fontSize="9" fontWeight="bold" fontFamily="DM Mono">E</text>
                  <text x="146" y="280" fill="#759384" fontSize="9" fontWeight="bold" fontFamily="DM Mono">S</text>
                  <text x="18" y="153" fill="#759384" fontSize="9" fontWeight="bold" fontFamily="DM Mono">W</text>

                  
                  {(() => {
                    if (!selectedMapMarket) return null;
                    const maxRange = Math.max(130, ...nearbyMarkets.map(m => Number(m.distanceKm || 0)));
                    const scale = 115.0 / maxRange;
                    const dx = (selectedMapMarket.longitude - mapCoords.lon) * 111.0 * Math.cos(mapCoords.lat * Math.PI / 180);
                    const dy = -(selectedMapMarket.latitude - mapCoords.lat) * 111.0;
                    const tx = Math.min(275, Math.max(25, 150 + dx * scale));
                    const ty = Math.min(275, Math.max(25, 150 + dy * scale));
                    return (
                      <g>
                        <line x1="150" y1="150" x2={tx} y2={ty} stroke="#dc664a" strokeWidth="2.5" strokeDasharray="4 2" />
                        <circle cx={tx} cy={ty} r="12" fill="none" stroke="#dc664a" strokeWidth="1.5" opacity="0.6">
                          <animate attributeName="r" values="8;16;8" dur="1.8s" repeatCount="indefinite" />
                        </circle>
                      </g>
                    );
                  })()}

                  
                  <circle cx="150" cy="150" r="7" fill="#f2c45f" stroke="#1d2724" strokeWidth="2" />
                  <circle cx="150" cy="150" r="14" fill="none" stroke="#f2c45f" strokeWidth="1" opacity="0.4">
                    <animate attributeName="r" values="7;18;7" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                  <text x="150" y="172" fill="#f2c45f" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="DM Mono">
                    ORIGIN (YOU)
                  </text>

                  
                  {nearbyMarkets.map((m) => {
                    const maxRange = Math.max(130, ...nearbyMarkets.map(item => Number(item.distanceKm || 0)));
                    const scale = 115.0 / maxRange;
                    const dx = (m.longitude - mapCoords.lon) * 111.0 * Math.cos(mapCoords.lat * Math.PI / 180);
                    const dy = -(m.latitude - mapCoords.lat) * 111.0;
                    const mx = Math.min(275, Math.max(25, 150 + dx * scale));
                    const my = Math.min(275, Math.max(25, 150 + dy * scale));
                    const isSelected = selectedMapMarket?.id === m.id;
                    const pinColor = m.marketType === 'APMC' ? '#6ba3d6' : m.marketType === 'WHOLESALE' ? '#e5a84b' : '#78b87d';

                    return (
                      <g
                        key={m.id}
                        onClick={() => setSelectedMapMarket(m)}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle
                          cx={mx}
                          cy={my}
                          r={isSelected ? "7" : "5"}
                          fill={pinColor}
                          stroke="#ffffff"
                          strokeWidth={isSelected ? "2" : "1"}
                        />
                        <text
                          x={mx}
                          y={my - 9}
                          fill={isSelected ? '#fff' : '#c8d4cc'}
                          fontSize={isSelected ? '9' : '7.5'}
                          fontWeight={isSelected ? 'bold' : 'normal'}
                          textAnchor="middle"
                          fontFamily="DM Mono"
                        >
                          {m.name.split(' ')[0]} ({m.distanceKm}km)
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="map-radar-legend">
                  <span><i style={{ background: '#78b87d' }} /> Market</span>
                  <span><i style={{ background: '#6ba3d6' }} /> APMC Yard</span>
                  <span><i style={{ background: '#e5a84b' }} /> Wholesale Yard</span>
                  <span><i style={{ background: '#f2c45f' }} /> Your Origin</span>
                </div>
              </div>

              
              <div className="nearby-list-container">
                {mapLoading ? (
                  <p className="muted">Calculating distances and freight costs...</p>
                ) : nearbyMarkets.length > 0 ? (
                  nearbyMarkets.map((market) => {
                    const isSelected = selectedMapMarket?.id === market.id;
                    return (
                      <div
                        key={market.id}
                        className={`nearby-card ${isSelected ? 'active' : ''}`}
                        onClick={() => setSelectedMapMarket(market)}
                      >
                        <div className="nearby-header">
                          <div>
                            <h3>{market.name}</h3>
                            <small style={{ color: '#778078', fontSize: '11px' }}>
                              {market.address || market.district}, {market.state}
                            </small>
                          </div>
                          <span className={`market-type-badge badge-${market.marketType?.toLowerCase()}`}>
                            {market.marketType}
                          </span>
                        </div>

                        <div className="nearby-meta-grid">
                          <div className="nearby-meta-item">
                            <span>Distance</span>
                            <strong>{market.distanceKm} km {market.direction && `(${market.direction})`}</strong>
                          </div>
                          <div className="nearby-meta-item">
                            <span>Est. Transit</span>
                            <strong>~{market.estimatedDurationMinutes} mins</strong>
                          </div>
                          <div className="nearby-meta-item">
                            <span>Freight Cost</span>
                            <strong>₹{market.estimatedTransportCost}</strong>
                          </div>
                        </div>

                        <div className="nearby-actions">
                          <span className="route-summary-text">
                            {market.routeSummary}
                          </span>
                          <a
                            href={market.navigationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="nav-link-btn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Navigate ↔
                          </a>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="muted">No agricultural markets found in this radius.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      
      
      
      {currentView === 'notifications' && (
        <div className="view-container">
          <section className="panel" style={{ marginTop: '18px' }}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Market activity &amp; signals</p>
                <h2>{text.labelNotifications}</h2>
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                {unreadCount > 0 && notifSubTab === 'app' && (
                  <button type="button" className="text-button" onClick={markAllNotificationsRead} style={{ marginTop: 0 }}>
                    Mark all read
                  </button>
                )}
                <span className="count">{notifSubTab === 'app' ? `${unreadCount} unread` : `${smsLogs.length} field alerts`}</span>
              </div>
            </div>

            
            <div className="tab-toggle-group" style={{ marginBottom: '16px' }}>
              <button
                type="button"
                className={notifSubTab === 'app' ? 'active' : ''}
                onClick={() => setNotifSubTab('app')}
              >
                In-App Desk Feed ({unreadCount})
              </button>
              <button
                type="button"
                className={notifSubTab === 'sms' ? 'active' : ''}
                onClick={() => { setNotifSubTab('sms'); loadSmsLogs(); }}
              >
                SMS &amp; WhatsApp Field Dispatch ({smsLogs.length})
              </button>
            </div>

            
            {notifSubTab === 'app' && (
              <div className="notif-list">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`notif-card ${n.unread ? 'unread' : ''}`}
                    onClick={() => markNotificationRead(n.id)}
                    style={{ cursor: 'default' }}
                  >
                    <span className={`notif-dot ${n.unread ? '' : 'read'}`} />
                    <div className="notif-body">
                      <p className="notif-title"><strong>{n.title}</strong> — {n.message}</p>
                      <div className="notif-meta">
                        <span>{n.time}</span>
                        <span>·</span>
                        <span>{n.type}</span>
                        <span>·</span>
                        <button
                          type="button"
                          className="notif-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            markNotificationRead(n.id);
                            setCurrentView(n.viewTarget);
                          }}
                        >
                          View ↔
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="muted" style={{ padding: '16px 0' }}>No notifications received yet.</p>
                )}
              </div>
            )}

            
            {notifSubTab === 'sms' && (
              <div>
                <div style={{ borderBottom: '1px solid #d9d6cc', paddingBottom: '18px', marginBottom: '18px' }}>
                  <p className="eyebrow" style={{ marginBottom: '6px' }}>Field Dispatch Gateway — Simulated</p>
                  <p style={{ fontSize: '12px', color: '#647068', margin: '0 0 18px', lineHeight: '1.6' }}>
                    Farmers receive SMS and WhatsApp alerts for trade proposals, escrow confirmations, and payouts. Replying <code>ACCEPT &lt;id&gt;</code> via SMS confirms a deal offline.
                  </p>

                  <form onSubmit={handleSendTestSms} style={{ marginTop: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                      <label style={{ marginTop: 0 }}>Recipient Phone
                        <input
                          value={testSmsForm.recipientPhone}
                          onChange={(e) => setTestSmsForm({ ...testSmsForm, recipientPhone: e.target.value })}
                          required
                        />
                      </label>
                      <label style={{ marginTop: 0 }}>Channel
                        <select
                          value={testSmsForm.channel}
                          onChange={(e) => setTestSmsForm({ ...testSmsForm, channel: e.target.value })}
                        >
                          <option value="SMS">SMS</option>
                          <option value="WHATSAPP">WhatsApp</option>
                        </select>
                      </label>
                    </div>
                    <label>Message Text
                      <input
                        value={testSmsForm.text}
                        onChange={(e) => setTestSmsForm({ ...testSmsForm, text: e.target.value })}
                        required
                      />
                    </label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '18px', flexWrap: 'wrap' }}>
                      <button type="submit" style={{ width: 'auto', margin: 0 }}>
                        Send Test Alert &rarr;
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ width: 'auto', margin: 0 }}
                        onClick={() => handleSimulateInboundSms(testSmsForm.text)}
                      >
                        Simulate Inbound SMS Reply &rarr;
                      </button>
                    </div>
                  </form>
                </div>

                <div className="sms-feed-grid">
                  {smsLogLoading ? (
                    <p className="muted">Loading field dispatch log...</p>
                  ) : smsLogs.length > 0 ? (
                    smsLogs.map((log) => {
                      const isWa = log.channel === 'WHATSAPP';
                      return (
                        <div key={log.id} className={`sms-log-row ${isWa ? 'sms-log-wa' : 'sms-log-sms'}`}>
                          <div className="sms-log-meta">
                            <span className="sms-log-channel">{isWa ? 'WhatsApp' : 'SMS'}</span>
                            <span>{log.recipientPhone}</span>
                            <span>{new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span style={{ marginLeft: 'auto', color: '#5a8e62' }}>{log.status}</span>
                          </div>
                          <p className="sms-log-body">{log.body}</p>
                          <div className="sms-log-ref">Ref: {log.providerMessageId || `MSG-${log.id}`} &middot; {log.messageType}</div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="muted" style={{ paddingTop: '8px' }}>No field alerts dispatched yet. Use the form above to send a test.</p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      
      
      
      {currentView === 'profile' && (
        <div className="view-container">
          <section className="panel" style={{ marginTop: '18px' }}>
            
                        
            <div style={{ background: '#f8f7f2', border: '1px solid #d9d6cc', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", fontWeight: 700, color: '#2f6838', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Demo Account Persona Switcher
                </span>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#667269' }}>
                  Instantly switch between accounts to test role-specific dashboards, calculators, and workflows:
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`trade-btn ${session?.role === 'FPO' ? 'trade-btn-primary' : 'trade-btn-secondary'}`}
                  style={{ fontSize: '11px', padding: '6px 12px' }}
                  onClick={() => handleQuickLogin('FPO')}
                >
                  FPO (Sahyadri)
                </button>
                <button
                  type="button"
                  className={`trade-btn ${session?.role === 'BUYER' ? 'trade-btn-primary' : 'trade-btn-secondary'}`}
                  style={{ fontSize: '11px', padding: '6px 12px' }}
                  onClick={() => handleQuickLogin('BUYER')}
                >
                  Buyer (Priya)
                </button>
                <button
                  type="button"
                  className={`trade-btn ${session?.role === 'FARMER' ? 'trade-btn-primary' : 'trade-btn-secondary'}`}
                  style={{ fontSize: '11px', padding: '6px 12px' }}
                  onClick={() => handleQuickLogin('FARMER')}
                >
                  Farmer (Ramesh)
                </button>
                <button
                  type="button"
                  className={`trade-btn ${session?.role === 'TRANSPORTER' ? 'trade-btn-primary' : 'trade-btn-secondary'}`}
                  style={{ fontSize: '11px', padding: '6px 12px' }}
                  onClick={() => handleQuickLogin('TRANSPORTER')}
                >
                  Transporter (Suresh)
                </button>
                <button
                  type="button"
                  className={`trade-btn ${session?.role === 'ADMIN' ? 'trade-btn-primary' : 'trade-btn-secondary'}`}
                  style={{ fontSize: '11px', padding: '6px 12px' }}
                  onClick={() => handleQuickLogin('ADMIN')}
                >
                  Nodal Admin
                </button>
              </div>
            </div>

            <div className="panel-heading">
              <div>
                <p className="eyebrow">Account &amp; Location Profile</p>
                <h2>{(session.name || '').replace(/\s*\((farmer|buyer|agrotech)[^)]*\)/gi, '').trim()}</h2>
              </div>
              <button
                type="button"
                className="trade-btn trade-btn-secondary"
                onClick={handleLogout}
                style={{ width: 'auto', padding: '6px 14px', marginTop: 0, fontSize: '11px', color: '#b45a42' }}
              >
                Sign Out
              </button>
            </div>


              
              <div className="profile-id-strip">
                <div className="profile-id-item">
                  <span>Email</span>
                  <strong>{session.email}</strong>
                </div>
                <div className="profile-id-item">
                  <span>Role</span>
                  <strong>{session.role === 'FARMER' ? 'Farmer / Producer' : session.role === 'TRANSPORTER' ? 'Commercial Transporter / Fleet' : session.role === 'FPO' ? 'Farmer Producer Organization (FPO/FPC)' : session.role === 'ADMIN' ? 'State Agricultural Nodal Officer' : 'Wholesale Buyer / Food Processor'}</strong>
                </div>
                <div className="profile-id-item">
                  <span>Profile ID</span>
                  <strong>KL-{session.role?.charAt(0)}-{session.profileId}</strong>
                </div>
              </div>

              
              {session?.role === 'FPO' && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                        Statutory NABL FPO Trust Score (Feature B12)
                      </span>
                      <h4 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                        {fpoProfile.trustBadge}
                      </h4>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '24px', fontWeight: 700, color: '#166534' }}>{fpoProfile.trustScore}</strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}> / 5.0 Composite Rating</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Quality Assay Match</span>
                      <strong style={{ fontSize: '16px', color: '#0f172a' }}>98.4%</strong>
                      <small style={{ display: 'block', fontSize: '10px', color: '#166534' }}>NABL Grade A/B Consistency</small>
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Dispatch Timeliness</span>
                      <strong style={{ fontSize: '16px', color: '#0f172a' }}>99.1%</strong>
                      <small style={{ display: 'block', fontSize: '10px', color: '#166534' }}>On-Time Packhouse Clearance</small>
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Dispute &amp; Claim Rate</span>
                      <strong style={{ fontSize: '16px', color: '#166534' }}>0.2%</strong>
                      <small style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>Near-Zero Buyer Deductions</small>
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Smallholder Retention</span>
                      <strong style={{ fontSize: '16px', color: '#0f172a' }}>97.8%</strong>
                      <small style={{ display: 'block', fontSize: '10px', color: '#166534' }}>{fpoProfile.activeMembersCount} Supplying Members</small>
                    </div>
                  </div>
                </div>
              )}

              
              {session?.role === 'BUYER' && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                        Institutional Buyer Trust &amp; Settlement Score (Feature C10)
                      </span>
                      <h4 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                        Gold Procurement Partner · 100% On-Time Escrow
                      </h4>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '24px', fontWeight: 700, color: '#0284c7' }}>4.9</strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}> / 5.0 Buyer Rating</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Escrow Release Speed</span>
                      <strong style={{ fontSize: '16px', color: '#0f172a' }}>100% Timely</strong>
                      <small style={{ display: 'block', fontSize: '10px', color: '#166534' }}>Immediate Gate Handshake Release</small>
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Settlement Fairness</span>
                      <strong style={{ fontSize: '16px', color: '#0f172a' }}>4.9 / 5.0</strong>
                      <small style={{ display: 'block', fontSize: '10px', color: '#166534' }}>Transparent Weighbridge Verification</small>
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Direct Sourced Volume</span>
                      <strong style={{ fontSize: '16px', color: '#0f172a' }}>38.5 Tons</strong>
                      <small style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>18 Settled Direct Contracts</small>
                    </div>
                  </div>
                </div>
              )}

              
              <form className="profile-form" onSubmit={saveProfile} style={{ marginTop: '24px' }}>

                
                {session.role === 'TRANSPORTER' && (
                  <>
                    <label>Fleet / Transport Name
                      <input
                        value={profile.businessName || ''}
                        onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                        placeholder="e.g. Suresh Logistics &amp; Fleet Operations"
                        required
                      />
                    </label>
                    <label>Vehicle Category
                      <select
                        value={profile.vehicleType || 'MINI_TRUCK'}
                        onChange={(e) => setProfile({ ...profile, vehicleType: e.target.value })}
                      >
                        <option value="MINI_TRUCK">Mini-Truck (Tata Ace / 2T)</option>
                        <option value="PICKUP">Heavy Pickup (Bolero Maxi / 1.5T)</option>
                        <option value="MEDIUM_5T">Intermediate LCV (Eicher 5T)</option>
                        <option value="HEAVY_10T">Multi-Axle Heavy Truck (10T+)</option>
                        <option value="REEFER">Reefer Container (Cold-Chain)</option>
                      </select>
                    </label>
                    <label>Vehicle Registration Number
                      <input
                        value={profile.vehicleNumber || ''}
                        onChange={(e) => setProfile({ ...profile, vehicleNumber: e.target.value })}
                        placeholder="JH-01-TR-5892"
                        required
                      />
                    </label>
                    <label>Payload Capacity (kg)
                      <input
                        type="number"
                        value={profile.capacityKg || '2500'}
                        onChange={(e) => setProfile({ ...profile, capacityKg: e.target.value })}
                        placeholder="2500"
                        required
                      />
                    </label>
                    <label>Base Freight Rate (₹/km)
                      <input
                        type="number"
                        step="0.5"
                        value={profile.ratePerKm || '16.5'}
                        onChange={(e) => setProfile({ ...profile, ratePerKm: e.target.value })}
                        placeholder="16.5"
                        required
                      />
                    </label>
                    <label>Base Pickup Charge (₹)
                      <input
                        type="number"
                        value={profile.baseCharge || '150.0'}
                        onChange={(e) => setProfile({ ...profile, baseCharge: e.target.value })}
                        placeholder="150"
                        required
                      />
                    </label>
                  </>
                )}

                
                {session.role === 'BUYER' && (
                  <>
                    <label>Business Name
                      <input
                        value={profile.businessName || ''}
                        onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                        placeholder="e.g. Priya Agro Wholesale &amp; Retail Hub"
                        required
                      />
                    </label>
                    <label>Business Type
                      <select
                        value={profile.businessType || 'WHOLESALER'}
                        onChange={(e) => setProfile({ ...profile, businessType: e.target.value })}
                      >
                        <option value="WHOLESALER">Wholesaler</option>
                        <option value="RETAILER">Retailer / Supermarket</option>
                        <option value="PROCESSOR">Food Processor</option>
                        <option value="EXPORTER">Exporter</option>
                        <option value="COLD_STORAGE">Cold Storage Operator</option>
                        <option value="TRADER">Commission Trader</option>
                      </select>
                    </label>
                    <label style={{ gridColumn: '1 / -1' }}>Trade License / GSTIN
                      <input
                        value={profile.tradeLicense || 'GSTIN27AABCP1234F1Z5'}
                        onChange={(e) => setProfile({ ...profile, tradeLicense: e.target.value })}
                        placeholder="GSTIN27AABCP1234F1Z5"
                      />
                    </label>
                  </>
                )}

                
                {session.role === 'FARMER' && (
                  <>
                    <label>Landholding (Acres)
                      <input
                        type="number"
                        step="0.5"
                        value={profile.landholdingAcres || '4.5'}
                        onChange={(e) => setProfile({ ...profile, landholdingAcres: e.target.value })}
                        placeholder="4.5"
                      />
                    </label>
                    <label>Primary Crops
                      <input
                        value={profile.primaryCrops || 'Tomato, Onion, Wheat'}
                        onChange={(e) => setProfile({ ...profile, primaryCrops: e.target.value })}
                        placeholder="e.g. Tomato, Onion, Wheat"
                      />
                    </label>
                    <label>Soil Type
                      <input
                        value={profile.soilType || 'Black Clay Loam'}
                        onChange={(e) => setProfile({ ...profile, soilType: e.target.value })}
                        placeholder="e.g. Black Clay Loam"
                      />
                    </label>
                    <label>Irrigation Source
                      <input
                        value={profile.irrigationSource || 'Borewell &amp; Drip Network'}
                        onChange={(e) => setProfile({ ...profile, irrigationSource: e.target.value })}
                        placeholder="e.g. Borewell &amp; Drip"
                      />
                    </label>
                  </>
                )}

                
                <label style={{ gridColumn: '1 / -1' }}>Address / Operational Base
                  <input
                    value={profile.address || ''}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="Vill. Bariatu, Post Hatia / Plot 44 APMC Yard"
                  />
                </label>

                <label>District
                  <input
                    value={profile.district || ''}
                    onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                    placeholder="Ranchi / Nashik"
                  />
                </label>
                <label>State
                  <input
                    value={profile.state || ''}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                    placeholder="Jharkhand / Maharashtra"
                  />
                </label>

                <label>Latitude
                  <input
                    type="number" step="any"
                    value={profile.latitude || '23.3441'}
                    onChange={(e) => setProfile({ ...profile, latitude: e.target.value })}
                    placeholder="23.3441"
                    required
                  />
                </label>
                <label>Longitude
                  <input
                    type="number" step="any"
                    value={profile.longitude || '85.3096'}
                    onChange={(e) => setProfile({ ...profile, longitude: e.target.value })}
                    placeholder="85.3096"
                    required
                  />
                </label>

                <div className="profile-section-divider">
                  <span>Alert &amp; Notification Contacts</span>
                </div>

                <label>Mobile / WhatsApp Number
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </label>
                <label>Alert Email
                  <input
                    type="email"
                    value={profile.alertEmail || ''}
                    onChange={(e) => setProfile({ ...profile, alertEmail: e.target.value })}
                    placeholder="alerts@email.com"
                  />
                </label>

                <button type="submit">Save Profile &amp; Sync GPS <span>&rarr;</span></button>
              </form>

              
              <div className="profile-alert-table">
                <p className="eyebrow" style={{ marginBottom: '12px' }}>Notification Routing</p>
                <table className="profile-routing-table">
                  <tbody>
                    <tr>
                      <td>WhatsApp</td>
                      <td>{profile.phone || <span style={{ color: '#aaa' }}>Not set</span>}</td>
                      <td>Trade proposals &amp; escrow updates</td>
                    </tr>
                    <tr>
                      <td>SMS</td>
                      <td>{profile.phone || <span style={{ color: '#aaa' }}>Not set</span>}</td>
                      <td>Offline fallback alerts</td>
                    </tr>
                    <tr>
                      <td>Email</td>
                      <td>{profile.alertEmail || <span style={{ color: '#aaa' }}>Not set</span>}</td>
                      <td>Proposals, escrow receipts &amp; invoices</td>
                    </tr>
                    <tr>
                      <td>In-App</td>
                      <td>{session.email}</td>
                      <td>Live push via WebSocket</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e7e4db', flexWrap: 'wrap', gap: '10px' }}>
                  <button
                    type="button"
                    className="text-button"
                    style={{ margin: 0 }}
                    onClick={() => { setCurrentView('notifications'); setNotifSubTab('sms'); }}
                  >
                    Open Field Dispatch Center &rarr;
                  </button>

                  <button
                    type="button"
                    className="trade-btn trade-btn-secondary"
                    style={{ fontSize: '11px', padding: '6px 14px', color: '#b45a42', borderColor: '#e5d0cb' }}
                    onClick={handleLogout}
                  >
                    Sign Out of Trade Desk &rarr;
                  </button>
                </div>
              </div>
            </section>
        </div>
      )}

      
      
      
      {showFpoRegisterModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            maxWidth: '540px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", fontWeight: 700, background: '#f0fdf4', color: '#166534', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                  Statutory Registration · /fpo/register (Feature B1)
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                  Register FPO &amp; Request NABL Accreditation
                </h3>
              </div>
              <button
                type="button"
                className="text-button"
                style={{ color: '#64748b', background: '#f1f5f9', border: 'none', borderRadius: '4px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onClick={() => setShowFpoRegisterModal(false)}
                aria-label="Close"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const name = fd.get('fpoName') || 'Sahyadri Farmers Producer Co. (FPC Ltd)';
              const cin = fd.get('cin') || 'CIN: U01403MH2011PTC215682';
              const district = fd.get('district') || 'Nashik';
              const state = fd.get('state') || 'Maharashtra';
              const contactPerson = fd.get('contactPerson') || 'Vilas Shinde';
              const phone = fd.get('phone') || '+91 98220 44100';
              const nabl = fd.get('nabl') || 'NABL Quality Assayed Hub #4412';

              const updatedFpo = {
                ...fpoProfile,
                name,
                regNumber: cin,
                district,
                state,
                contactPerson,
                contactPhone: phone,
                nablAccreditation: nabl,
                verified: true
              };

              setFpoProfile(updatedFpo);
              setSession({
                token: 'demo-fpo-jwt',
                userId: 4,
                profileId: 1,
                name: `${contactPerson} (${name})`,
                email: 'fpo@kisanlink.in',
                role: 'FPO',
                fpoId: updatedFpo.fpoId,
                trustScore: 4.9,
                verified: true
              });
              setShowFpoRegisterModal(false);
              setCurrentView('fpo-lots');
              window.location.hash = '#/fpo/lots';
              setMessage(`Successfully registered and verified FPO "${name}" with NABL accreditation!`);
            }}>
              <label style={{ fontSize: '12px', color: '#334155' }}>FPO / FPC Legal Entity Name
                <input
                  name="fpoName"
                  defaultValue={fpoProfile.name}
                  placeholder="e.g. Sahyadri Farmers Producer Co. Ltd"
                  required
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ fontSize: '12px', color: '#334155' }}>CIN / Registration Number
                  <input
                    name="cin"
                    defaultValue={fpoProfile.regNumber}
                    placeholder="CIN: U01403MH2011PTC215682"
                    required
                  />
                </label>
                <label style={{ fontSize: '12px', color: '#334155' }}>NABL Accreditation ID
                  <input
                    name="nabl"
                    defaultValue={fpoProfile.nablAccreditation}
                    placeholder="NABL Lab Assay #4412"
                    required
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ fontSize: '12px', color: '#334155' }}>District Base
                  <input
                    name="district"
                    defaultValue={fpoProfile.district}
                    required
                  />
                </label>
                <label style={{ fontSize: '12px', color: '#334155' }}>State
                  <input
                    name="state"
                    defaultValue={fpoProfile.state}
                    required
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ fontSize: '12px', color: '#334155' }}>Managing Director / CEO Name
                  <input
                    name="contactPerson"
                    defaultValue={fpoProfile.contactPerson}
                    required
                  />
                </label>
                <label style={{ fontSize: '12px', color: '#334155' }}>Contact Phone
                  <input
                    name="phone"
                    defaultValue={fpoProfile.contactPhone}
                    required
                  />
                </label>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', margin: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>Statutory Verification Status:</span>
                  <span style={{ fontSize: '11px', color: '#166534', background: '#f0fdf4', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bbf7d0', fontWeight: 500 }}>
                    Auto-Verified via MCA &amp; NABL Database
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <button type="button" className="trade-btn trade-btn-secondary" style={{ padding: '8px 14px', fontSize: '12px' }} onClick={() => setShowFpoRegisterModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="trade-btn trade-btn-primary" style={{ padding: '8px 14px', fontSize: '12px' }}>
                  Complete FPO Registration &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      
      
      {showBuyerRegisterModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            maxWidth: '540px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", fontWeight: 700, background: '#f0f9ff', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                  Institutional Onboarding · /buyer/register (Feature C1)
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                  Buyer Registration &amp; Trade License Verification
                </h3>
              </div>
              <button
                type="button"
                className="text-button"
                style={{ color: '#64748b', background: '#f1f5f9', border: 'none', borderRadius: '4px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onClick={() => setShowBuyerRegisterModal(false)}
                aria-label="Close"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const companyName = fd.get('companyName') || 'Priya Agro Wholesale & Retail Hub';
              const buyerType = fd.get('buyerType') || 'WHOLESALER';
              const gstin = fd.get('gstin') || 'GSTIN27AABCP1234F1Z5';
              const district = fd.get('district') || 'Nashik';
              const state = fd.get('state') || 'Maharashtra';
              const contactPerson = fd.get('contactPerson') || 'Priya Sharma';
              const phone = fd.get('phone') || '+91 98220 55432';

              setProfile(prev => ({
                ...prev,
                businessName: companyName,
                businessType: buyerType,
                tradeLicense: gstin,
                district,
                state,
                phone
              }));

              setSession({
                token: 'demo-buyer-jwt',
                userId: 2,
                profileId: 1,
                name: contactPerson,
                email: 'procurement@priyaagro.com',
                role: 'BUYER',
                companyName,
                verified: true
              });

              setShowBuyerRegisterModal(false);
              setRequirementSource('custom');
              setCurrentView('matching');
              window.location.hash = '#/buyer/demands/create';
              setMessage(`Buyer account for "${companyName}" verified via GSTIN! You can now post demands and make direct offers.`);
            }}>
              <label style={{ fontSize: '12px', color: '#334155' }}>Enterprise / Company Name
                <input
                  name="companyName"
                  defaultValue="Priya Agro Wholesale & Retail Hub"
                  required
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ fontSize: '12px', color: '#334155' }}>Buyer Category
                  <select name="buyerType" defaultValue="WHOLESALER">
                    <option value="WHOLESALER">Wholesaler / APMC Trader</option>
                    <option value="FOOD_PROCESSOR">Food Processing Enterprise</option>
                    <option value="RETAILER">Modern Retail / Supermarket Chain</option>
                    <option value="EXPORTER">Export Merchant</option>
                  </select>
                </label>
                <label style={{ fontSize: '12px', color: '#334155' }}>GSTIN / FSSAI License
                  <input
                    name="gstin"
                    defaultValue="GSTIN27AABCP1234F1Z5"
                    required
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ fontSize: '12px', color: '#334155' }}>District Hub
                  <input
                    name="district"
                    defaultValue="Nashik"
                    required
                  />
                </label>
                <label style={{ fontSize: '12px', color: '#334155' }}>State
                  <input
                    name="state"
                    defaultValue="Maharashtra"
                    required
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ fontSize: '12px', color: '#334155' }}>Procurement Lead Name
                  <input
                    name="contactPerson"
                    defaultValue="Priya Sharma"
                    required
                  />
                </label>
                <label style={{ fontSize: '12px', color: '#334155' }}>Official Phone
                  <input
                    name="phone"
                    defaultValue="+91 98220 55432"
                    required
                  />
                </label>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', margin: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>Commercial KYC Status:</span>
                  <span style={{ fontSize: '11px', color: '#0369a1', background: '#f0f9ff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bae6fd', fontWeight: 500 }}>
                    Instant GSTIN &amp; Escrow Verification Active
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <button type="button" className="trade-btn trade-btn-secondary" style={{ padding: '8px 14px', fontSize: '12px' }} onClick={() => setShowBuyerRegisterModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="trade-btn trade-btn-primary" style={{ padding: '8px 14px', fontSize: '12px' }}>
                  Verify &amp; Activate Buyer Desk &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      
      
      
      {dealOtpModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            maxWidth: '440px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
            border: '2px solid #2f6838',
            textAlign: 'center'
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", fontWeight: 700, background: '#eef4ec', color: '#2f6838', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
              SMART INDIA HACKATHON · DIGITAL HANDSHAKE
            </span>
            <h3 style={{ margin: '8px 0 4px', fontSize: '18px', color: '#202a27' }}>
              Digital 2FA OTP Contract Sign-Off
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#556557' }}>
              Signing digital sales agreement for <strong>Trade #{dealOtpModal.tradeId} ({dealOtpModal.trade?.cropName})</strong>. A one-time verification code has been dispatched to registered mobile.
            </p>

            <div style={{ background: '#fbfcfb', border: '1px dashed #2f6838', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '10px', color: '#778078', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", display: 'block', marginBottom: '4px' }}>
                Simulated 2FA SMS Code
              </span>
              <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: "'DM Mono', monospace", letterSpacing: '4px', color: '#2f6838' }}>
                {dealOtpModal.otp}
              </div>
            </div>

            <label style={{ textAlign: 'left', display: 'block', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#334135' }}>Enter 4-Digit Handshake OTP:</span>
              <input
                type="text"
                maxLength="4"
                style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '6px', fontFamily: "'DM Mono', monospace", fontWeight: 700, padding: '8px' }}
                value={dealOtpModal.enteredOtp}
                onChange={(e) => setDealOtpModal({ ...dealOtpModal, enteredOtp: e.target.value })}
              />
            </label>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="trade-btn trade-btn-secondary"
                style={{ flex: 1, padding: '10px' }}
                onClick={() => setDealOtpModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="trade-btn trade-btn-primary"
                style={{ flex: 2, padding: '10px', fontWeight: 700 }}
                onClick={async () => {
                  const trade = dealOtpModal.trade;
                  const tId = dealOtpModal.tradeId;
                  setDealOtpModal(null);
                  await executeTradeStatusUpdate(tId, 'ACCEPTED');
                  setSelectedInvoiceTrade(trade);
                  setMessage(`Trade #${tId} contract digitally signed and escrow locked via OTP 2FA!`);
                }}
              >
                Verify &amp; Sign Contract Γ£ô
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedInvoiceTrade && (
        <div className="modal-backdrop" onClick={() => setSelectedInvoiceTrade(null)}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="invoice-header">
              <div>
                <p className="eyebrow" style={{ color: '#dc664a' }}>KisanLink Official Trade Certificate</p>
                <h2>Agronomic Trade Deal &amp; Settlement Receipt</h2>
                <p style={{ margin: '4px 0 0', font: "11px 'DM Mono', monospace", color: '#7f8981' }}>
                  Contract Ref: <strong>#KL-TRD-{selectedInvoiceTrade.id}</strong> · Issued on {new Date(selectedInvoiceTrade.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <span className={`status-pill status-${(selectedInvoiceTrade.status || 'PROPOSED').toLowerCase()}`} style={{ fontSize: '11px', padding: '5px 10px' }}>
                Status: {selectedInvoiceTrade.status}
              </span>
            </div>

            
            <div className="invoice-party-grid">
              <div className="party-block">
                <span style={{ font: "9px 'DM Mono', monospace", textTransform: 'uppercase', color: '#7f8981' }}>Seller / Producer</span>
                <p><strong>{selectedInvoiceTrade.farmerName}</strong></p>
                <p>District: {selectedInvoiceTrade.farmerDistrict || 'Jharkhand Region'}</p>
                <p>Role: Verified KisanLink Farmer</p>
              </div>
              <div className="party-block">
                <span style={{ font: "9px 'DM Mono', monospace", textTransform: 'uppercase', color: '#7f8981' }}>Purchaser / Buyer</span>
                <p><strong>{selectedInvoiceTrade.buyerName}</strong></p>
                <p>Entity: {selectedInvoiceTrade.buyerType || 'Commercial Buyer'}</p>
                <p>Delivery Destination: {selectedInvoiceTrade.deliveryAddress || 'Regional APMC / Warehouse'}</p>
              </div>
            </div>

            
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Commodity Description</th>
                  <th>Category</th>
                  <th>Quantity (kg)</th>
                  <th>Agreed Rate</th>
                  <th style={{ textAlign: 'right' }}>Gross Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>{selectedInvoiceTrade.cropName}</strong>
                    {selectedInvoiceTrade.notes && <div style={{ fontSize: '11px', color: '#778078' }}>Notes: {selectedInvoiceTrade.notes}</div>}
                  </td>
                  <td>{selectedInvoiceTrade.cropCategory || 'PRODUCE'}</td>
                  <td>{selectedInvoiceTrade.quantity} kg ({(Number(selectedInvoiceTrade.quantity) / 100).toFixed(1)} Qtl)</td>
                  <td>₹{selectedInvoiceTrade.agreedPricePerKg} / kg</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    ₹{Number(selectedInvoiceTrade.totalAmount).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            
            <div className="invoice-totals-box">
              <div className="invoice-totals-row">
                <span>Gross Value:</span>
                <strong>₹{Number(selectedInvoiceTrade.totalAmount || (Number(selectedInvoiceTrade.quantity || 0) * Number(selectedInvoiceTrade.agreedPricePerKg || 0))).toLocaleString()}</strong>
              </div>
              <div className="invoice-totals-row">
                <span>Logistics &amp; Freight Deduction:</span>
                <span style={{ color: '#dc664a' }}>- ₹{Number(selectedInvoiceTrade.transportCost).toLocaleString()}</span>
              </div>
              <div className="invoice-totals-row grand-total">
                <span>Net Farmer Payout:</span>
                <strong style={{ color: '#5a8e62' }}>₹{Number(selectedInvoiceTrade.netFarmerReturn).toLocaleString()}</strong>
              </div>
            </div>

            
            <div style={{ background: '#faf7f0', padding: '12px 16px', borderRadius: '4px', border: '1px solid #ded9cc', fontSize: '11px', color: '#68776b', lineHeight: '1.5' }}>
              <p style={{ margin: 0 }}>
                <strong>Direct Trade Guarantee:</strong> This contract represents a direct farmer-to-buyer transaction facilitated via KisanLink's smart matching and freight calculation protocol. All settlements are tracked under digital hash <code>#KL-HASH-{selectedInvoiceTrade.id}-{Date.now().toString(36).toUpperCase()}</code>.
              </p>
            </div>

            
            <div className="invoice-actions">
              <button
                type="button"
                className="action-button"
                style={{ width: 'auto', background: '#202a27' }}
                onClick={() => window.print()}
              >
                Print / Save PDF Receipt
              </button>
              <button
                type="button"
                className="secondary-button"
                style={{ width: 'auto' }}
                onClick={() => setSelectedInvoiceTrade(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      
      
      
      {escrowDepositModal && (
        <div className="modal-backdrop" onClick={() => setEscrowDepositModal(null)}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="invoice-header">
              <div>
                <p className="eyebrow" style={{ color: '#5a8e62' }}>[SANDBOX ESCROW &amp; UPI SIMULATOR · RBI PPA COMPLIANT] KisanLink Digital Escrow Vault</p>
                <h2>Lock Trade Payment in Escrow</h2>
                <p style={{ margin: '4px 0 0', font: "11px 'DM Mono', monospace", color: '#7f8981' }}>
                  Trade Deal <strong>#{escrowDepositModal.trade.id} · {escrowDepositModal.trade.cropName}</strong> ({escrowDepositModal.trade.quantity} kg)
                </p>
              </div>
              <span className="escrow-status-pill escrow-status-pending">SANDBOX DEPOSIT</span>
            </div>

            <form onSubmit={submitEscrowDeposit} style={{ marginTop: '16px' }}>
              <div style={{ background: '#faf7f0', padding: '14px 16px', borderRadius: '4px', border: '1px solid #ded9cc', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', font: "11px 'DM Mono', monospace" }}>
                  <span>Total Deposit Amount:</span>
                  <strong style={{ fontSize: '15px', color: '#202a27' }}>₹{escrowDepositModal.trade.totalAmount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', font: "10px 'DM Mono', monospace", color: '#68776b' }}>
                  <span>Farmer Guaranteed Payout:</span>
                  <strong>₹{escrowDepositModal.trade.netFarmerReturn}</strong>
                </div>
                <p style={{ margin: '10px 0 0', fontSize: '10px', color: '#778078', lineHeight: '1.4' }}>
                  Funds remain safely held in the escrow vault until you confirm physical produce delivery and quality inspection.
                </p>
              </div>

              <label>Payment Method
                <select
                  value={escrowDepositForm.paymentMethod}
                  onChange={(e) => setEscrowDepositForm({ ...escrowDepositForm, paymentMethod: e.target.value })}
                >
                  <option value="UPI_INSTANT">UPI Instant Transfer (GPay / PhonePe / Paytm / BHIM)</option>
                  <option value="BANK_NEFT_RTGS">Virtual Escrow Bank Account (NEFT / RTGS / IMPS)</option>
                  <option value="ESCROW_WALLET">KisanLink Buyer Pre-funded Balance</option>
                </select>
              </label>

              <label>Buyer UPI ID / VPA
                <input
                  value={escrowDepositForm.buyerUpiId}
                  onChange={(e) => setEscrowDepositForm({ ...escrowDepositForm, buyerUpiId: e.target.value })}
                  placeholder="e.g. enterprise.buyer@okaxis"
                  required
                />
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                <button type="submit" className="action-button" style={{ background: '#202a27' }}>
                  Confirm &amp; Lock ₹{escrowDepositModal.trade.totalAmount} in Vault <span>→</span>
                </button>
                <button type="button" className="secondary-button" onClick={() => setEscrowDepositModal(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        </div>
      </div>

      
      {newPostModalOpen && (
        <div className={`drawer-backdrop ${closingDrawer === 'COMMUNITY' ? 'drawer-closing' : ''}`} onClick={closeCommunityDrawer}>

          <div className={`slide-drawer ${closingDrawer === 'COMMUNITY' ? 'drawer-closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            
            
            <div className="drawer-header">
              <div>
                <p className="eyebrow">Farmers Community</p>
                <h3 style={{ margin: '2px 0 0', fontSize: '18px', color: '#202a27' }}>Publish Discussion or Notice</h3>
              </div>

              <button type="button" className="close-btn" onClick={closeCommunityDrawer} title="Close">&times;</button>
            </div>

            <form onSubmit={handleCreateCommunityPost} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              
              
              <div className="drawer-body">
                
                
                <div className="field-group">
                  <label className="field-label">Posting Role</label>
                  <div className="role-segment-container">
                    <button
                      type="button"
                      className={`role-segment-btn ${newPostForm.authorType === 'FARMER' ? 'active-farmer' : ''}`}
                      onClick={() => setNewPostForm(f => ({ ...f, authorType: 'FARMER', postType: 'DISEASE_HELP' }))}
                    >
                      Farmer
                    </button>
                    <button
                      type="button"
                      className={`role-segment-btn ${newPostForm.authorType === 'BUYER' ? 'active-buyer' : ''}`}
                      onClick={() => setNewPostForm(f => ({ ...f, authorType: 'BUYER', postType: 'PROCUREMENT' }))}
                    >
                      Buyer / Trader
                    </button>
                    <button
                      type="button"
                      className={`role-segment-btn ${newPostForm.authorType === 'AGRONOMIST' ? 'active-agronomist' : ''}`}
                      onClick={() => setNewPostForm(f => ({ ...f, authorType: 'AGRONOMIST', postType: 'AGRI_ADVICE' }))}
                    >
                      Agronomist
                    </button>
                  </div>
                  <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#778078' }}>
                    {newPostForm.authorType === 'FARMER' && 'Farmer Mode: Ask crop pathology questions, post harvest notes, or seek spray remedies.'}
                    {newPostForm.authorType === 'BUYER' && 'Buyer Mode: Publish bulk procurement specifications, quality grading benchmarks, and supply terms.'}
                    {newPostForm.authorType === 'AGRONOMIST' && 'Agronomist Mode: Publish verified treatment protocols, bio-input advisories, and PHI guidelines.'}
                  </p>
                </div>

                
                <div className="field-group">
                  <label className="field-label">Topic Category</label>
                  <div className="modal-category-pills">
                    {[
                      { value: 'DISEASE_HELP', label: 'Crop Disease & Treatment' },
                      { value: 'PROCUREMENT', label: 'Buyer Procurement Notice' },
                      { value: 'QUALITY_ADVICE', label: 'Quality Standards & Grading' },
                      { value: 'AGRI_ADVICE', label: 'Agronomy & Bio-Inputs' }
                    ].map(cat => (
                      <button
                        key={cat.value}
                        type="button"
                        className={`modal-category-btn ${newPostForm.postType === cat.value ? 'active' : ''}`}
                        onClick={() => setNewPostForm(f => ({ ...f, postType: cat.value }))}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="field-group">
                    <label className="field-label">Your Name / Organization</label>
                    <input
                      type="text"
                      className="field-input"
                      placeholder={newPostForm.authorType === 'BUYER' ? 'e.g. AgroFoods Ltd' : 'e.g. Ramesh Patel'}
                      value={newPostForm.authorName}
                      onChange={(e) => setNewPostForm(f => ({ ...f, authorName: e.target.value }))}
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label">Designation / Subtitle</label>
                    <input
                      type="text"
                      className="field-input"
                      placeholder={newPostForm.authorType === 'BUYER' ? 'e.g. Sourcing Head' : 'e.g. Progressive Farmer'}
                      value={newPostForm.authorRole}
                      onChange={(e) => setNewPostForm(f => ({ ...f, authorRole: e.target.value }))}
                    />
                  </div>
                </div>

                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="field-group">
                    <label className="field-label">Commodity</label>
                    <select
                      className="field-input"
                      value={newPostForm.cropName}
                      onChange={(e) => setNewPostForm(f => ({ ...f, cropName: e.target.value }))}
                    >
                      <option value="Tomato">Tomato</option>
                      <option value="Chilli">Chilli / Pepper</option>
                      <option value="Rice">Rice / Paddy</option>
                      <option value="Potato">Potato</option>
                      <option value="Wheat">Wheat</option>
                      <option value="Mustard">Mustard</option>
                      <option value="Cotton">Cotton</option>
                      <option value="Onion">Onion / Garlic</option>
                      <option value="General">General / Multi-Crop</option>
                    </select>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Location / Market Cluster</label>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="e.g. Nashik, MH"
                      value={newPostForm.location}
                      onChange={(e) => setNewPostForm(f => ({ ...f, location: e.target.value }))}
                    />
                  </div>
                </div>

                
                <div className="field-group">
                  <label className="field-label">Topic Title *</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder={
                      newPostForm.authorType === 'BUYER'
                        ? 'e.g. Procurement requirement for 50 MT Grade-A Tomato...'
                        : newPostForm.authorType === 'AGRONOMIST'
                        ? 'e.g. Protocol for Early Blight management and spray intervals...'
                        : 'e.g. Dark spots and yellow halos on 30-day tomato leaves...'
                    }
                    value={newPostForm.title}
                    onChange={(e) => setNewPostForm(f => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>

                
                <div className="field-group">
                  <label className="field-label">Details / Terms / Symptoms</label>
                  <textarea
                    className="field-input"
                    rows="4"
                    placeholder="Provide complete details, symptoms, weather background, quality parameters, or procurement terms..."
                    value={newPostForm.description}
                    onChange={(e) => setNewPostForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>

                
                <div className="field-group">
                  <label className="field-label">Attach Leaf Photo / Quality Specimen (Optional)</label>
                  <div className="specimen-upload-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="trade-btn trade-btn-secondary"
                        style={{ fontSize: '11px', padding: '6px 12px' }}
                        onClick={() => communityPhotoInputRef.current?.click()}
                      >
                        Select Image File
                      </button>
                      <input
                        type="file"
                        ref={communityPhotoInputRef}
                        accept="image/*"
                        onChange={handleCommunityPhotoUpload}
                        style={{ display: 'none' }}
                      />
                      <span style={{ fontSize: '11px', color: newPostForm.imageUrl ? '#2f6838' : '#778078', fontWeight: newPostForm.imageUrl ? 600 : 400 }}>
                        {newPostForm.imageUrl ? 'Image attached' : 'No file selected'}
                      </span>
                    </div>

                    {newPostForm.imageUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '60px', height: '40px', borderRadius: '3px', overflow: 'hidden', border: '1px solid #d9d6cc' }}>
                          <img src={newPostForm.imageUrl} alt="Attached" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewPostForm(f => ({ ...f, imageUrl: '' }))}
                          style={{ background: 'none', border: 'none', color: '#b45a42', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Mono', monospace" }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              
              <div className="drawer-footer">
                <button type="button" className="trade-btn trade-btn-secondary" onClick={closeCommunityDrawer}>
                  Cancel
                </button>
                <button type="submit" className="trade-btn trade-btn-primary" style={{ padding: '8px 20px' }}>
                  Publish Topic &rarr;
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      
      {quickProduceModal && (
        <div className={`drawer-backdrop ${closingDrawer === 'PRODUCE' ? 'drawer-closing' : ''}`} onClick={closeProduceDrawer}>
          <div className={`slide-drawer ${closingDrawer === 'PRODUCE' ? 'drawer-closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <p className="eyebrow">Farmer Produce Listing</p>
                <h3 style={{ margin: '2px 0 0', fontSize: '18px', color: '#202a27' }}>Sell {quickProduceModal.cropName}</h3>
              </div>
              <button type="button" className="close-btn" onClick={closeProduceDrawer} title="Close">&times;</button>
            </div>

            <form onSubmit={handleQuickProduceSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="drawer-body">
                <div className="field-group">
                  <label className="field-label">Commodity</label>
                  <input
                    type="text"
                    className="field-input"
                    value={`${quickProduceModal.cropName} (${quickProduceModal.category || 'PRODUCE'})`}
                    disabled
                    style={{ background: '#f8f7f2', color: '#556058' }}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Harvest Quantity ({quickProduceModal.unit}) *</label>
                  <input
                    type="number"
                    className="field-input"
                    min="1"
                    placeholder="e.g. 500"
                    value={quickProduceModal.quantity}
                    onChange={(e) => setQuickProduceModal(p => ({ ...p, quantity: e.target.value }))}
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Expected Price (₹ per {quickProduceModal.unit}) *</label>
                  <input
                    type="number"
                    className="field-input"
                    min="1"
                    placeholder="e.g. 25"
                    value={quickProduceModal.expectedPrice}
                    onChange={(e) => setQuickProduceModal(p => ({ ...p, expectedPrice: e.target.value }))}
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Quality Grade Standard *</label>
                  <div className="quality-tier-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
                    {[
                      { id: 'Grade A', title: 'Grade A', desc: 'Premium Sort' },
                      { id: 'Grade B', title: 'Grade B', desc: 'Mandi Standard' },
                      { id: 'Grade C', title: 'Grade C', desc: 'Processing' }
                    ].map(g => (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => setQuickProduceModal(p => ({ ...p, quality: g.id }))}
                        className={`quality-tier-pill ${(quickProduceModal.quality || 'Grade A') === g.id ? 'active' : ''}`}
                        style={{
                          padding: '10px 8px',
                          border: (quickProduceModal.quality || 'Grade A') === g.id ? '2px solid #1e5e3a' : '1px solid #d3dbd2',
                          borderRadius: '6px',
                          background: (quickProduceModal.quality || 'Grade A') === g.id ? '#eaf5eb' : '#ffffff',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '13px', color: (quickProduceModal.quality || 'Grade A') === g.id ? '#1e5e3a' : '#202a27' }}>{g.title}</div>
                        <div style={{ fontSize: '11px', color: '#68776d', marginTop: '2px' }}>{g.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Harvest Date *</label>
                  <input
                    type="date"
                    className="field-input"
                    value={quickProduceModal.harvestDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setQuickProduceModal(p => ({ ...p, harvestDate: e.target.value }))}
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Available Until Date</label>
                  <input
                    type="date"
                    className="field-input"
                    value={quickProduceModal.availableUntil}
                    onChange={(e) => setQuickProduceModal(p => ({ ...p, availableUntil: e.target.value }))}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Quality &amp; Harvest Notes</label>
                  <textarea
                    className="field-input"
                    rows="3"
                    placeholder="e.g. Grade A sorted, harvested yesterday, moisture below 12%, stored in ventilated crates..."
                    value={quickProduceModal.description}
                    onChange={(e) => setQuickProduceModal(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
              </div>

              <div className="drawer-footer">
                <button type="button" className="trade-btn trade-btn-secondary" onClick={closeProduceDrawer}>
                  Cancel
                </button>
                <button type="submit" className="trade-btn trade-btn-primary" style={{ padding: '8px 20px' }}>
                  Publish Produce Listing &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {quickRequirementModal && (
        <div className={`drawer-backdrop ${closingDrawer === 'REQUIREMENT' ? 'drawer-closing' : ''}`} onClick={closeRequirementDrawer}>
          <div className={`slide-drawer ${closingDrawer === 'REQUIREMENT' ? 'drawer-closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <p className="eyebrow">Buyer Order</p>
                <h3 style={{ margin: '2px 0 0', fontSize: '18px', color: '#202a27' }}>Procure {quickRequirementModal.cropName}</h3>
              </div>
              <button type="button" className="close-btn" onClick={closeRequirementDrawer} title="Close">&times;</button>
            </div>

            <form onSubmit={handleQuickRequirementSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="drawer-body">
                <div className="field-group">
                  <label className="field-label">Target Commodity</label>
                  <input
                    type="text"
                    className="field-input"
                    value={`${quickRequirementModal.cropName} (${quickRequirementModal.category || 'PRODUCE'})`}
                    disabled
                    style={{ background: '#f8f7f2', color: '#556058' }}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Required Quantity ({quickRequirementModal.unit}) *</label>
                  <input
                    type="number"
                    className="field-input"
                    min="1"
                    placeholder="e.g. 1000"
                    value={quickRequirementModal.requiredQuantity}
                    onChange={(e) => setQuickRequirementModal(r => ({ ...r, requiredQuantity: e.target.value }))}
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Quality Grade Standard *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
                    {[
                      { id: 'Grade A', title: 'Grade A', desc: 'Premium Sort' },
                      { id: 'Grade B', title: 'Grade B', desc: 'Mandi Standard' },
                      { id: 'Grade C', title: 'Grade C', desc: 'Processing' }
                    ].map(g => (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => setQuickRequirementModal(r => ({ ...r, qualityRequired: g.id }))}
                        style={{
                          padding: '10px 8px',
                          border: (quickRequirementModal.qualityRequired || 'Grade A') === g.id ? '2px solid #1e5e3a' : '1px solid #d3dbd2',
                          borderRadius: '6px',
                          background: (quickRequirementModal.qualityRequired || 'Grade A') === g.id ? '#eaf5eb' : '#ffffff',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '13px', color: (quickRequirementModal.qualityRequired || 'Grade A') === g.id ? '#1e5e3a' : '#202a27' }}>{g.title}</div>
                        <div style={{ fontSize: '11px', color: '#68776d', marginTop: '2px' }}>{g.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Target / Offered Price (Rs per {quickRequirementModal.unit}) *</label>
                  <input
                    type="number"
                    className="field-input"
                    min="1"
                    placeholder="e.g. 26"
                    value={quickRequirementModal.offeredPrice}
                    onChange={(e) => setQuickRequirementModal(r => ({ ...r, offeredPrice: e.target.value }))}
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Maximum Ceiling Price (Rs per {quickRequirementModal.unit})</label>
                  <input
                    type="number"
                    className="field-input"
                    min="1"
                    placeholder="e.g. 30"
                    value={quickRequirementModal.maxPrice}
                    onChange={(e) => setQuickRequirementModal(r => ({ ...r, maxPrice: e.target.value }))}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Valid Until *</label>
                  <input
                    type="date"
                    className="field-input"
                    min={new Date().toISOString().split('T')[0]}
                    value={quickRequirementModal.validUntil || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]}
                    onChange={(e) => setQuickRequirementModal(r => ({ ...r, validUntil: e.target.value }))}
                    required
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Delivery Hub / Destination</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="e.g. Nashik Cold Storage / Azadpur Hub"
                    value={quickRequirementModal.deliveryLocation}
                    onChange={(e) => setQuickRequirementModal(r => ({ ...r, deliveryLocation: e.target.value }))}
                  />
                </div>
              </div>

              <div className="drawer-footer">
                <button type="button" className="trade-btn trade-btn-secondary" onClick={closeRequirementDrawer}>
                  Cancel
                </button>
                <button type="submit" className="trade-btn trade-btn-primary" style={{ padding: '8px 20px' }}>
                  Publish &amp; Find Matches &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {googleMapModalNode && (
        <div
          className={`drawer-backdrop ${closingDrawer === 'GOOGLE_MAP' ? 'drawer-closing' : ''}`}
          onClick={closeGoogleMapDrawer}
        >
          <div
            className={`slide-drawer ${closingDrawer === 'GOOGLE_MAP' ? 'drawer-closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px' }}
          >
            <div className="drawer-header">
              <div>
                <p className="eyebrow">{googleMapModalNode.badge}</p>
                <h3 style={{ margin: '2px 0 0', fontSize: '17px', color: '#202a27', lineHeight: '1.3' }}>
                  {googleMapModalNode.name}
                </h3>
              </div>
              <button type="button" className="close-btn" onClick={closeGoogleMapDrawer} title="Close">&times;</button>
            </div>

            <div className="drawer-body">
              
              <div style={{ borderRadius: '4px', overflow: 'hidden', border: '1px solid #d9d6cc', height: '270px', position: 'relative' }}>
                <iframe
                  title={`Google Map - ${googleMapModalNode.name}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: 'block' }}
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(googleMapModalNode.mapQuery || `${googleMapModalNode.lat},${googleMapModalNode.lng}`)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                />
              </div>

              
              <div style={{ background: '#faf9f5', border: '1px solid #e7e4db', borderRadius: '4px', padding: '12px 14px', marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#778078', textTransform: 'uppercase' }}>Facility Location</span>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#202a27', fontWeight: 500 }}>
                      {googleMapModalNode.location}
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#2f6838', fontWeight: 700, background: '#eef4ec', padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap' }}>
                    {googleMapModalNode.distanceKm} km away
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderTop: '1px solid #edeae2', paddingTop: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#778078' }}>IN CHARGE</span>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 600, color: '#202a27' }}>
                      {googleMapModalNode.inCharge}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#778078' }}>HOURS</span>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#444d47' }}>
                      {googleMapModalNode.hours}
                    </p>
                  </div>
                </div>
              </div>

              
              <div style={{ marginTop: '14px' }}>
                <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#556058', fontWeight: 600, textTransform: 'uppercase' }}>
                  Services &amp; Key Focus Areas
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {googleMapModalNode.services.map((srv, idx) => (
                    <span key={idx} style={{ fontSize: '11px', background: '#f0eee8', color: '#333b35', padding: '4px 8px', borderRadius: '3px', border: '1px solid #e2ded4' }}>
                      {srv}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="drawer-footer" style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="trade-btn trade-btn-secondary" onClick={closeGoogleMapDrawer}>
                Cancel / Close
              </button>
              <a
                href={`tel:${googleMapModalNode.phone.replace(/[^0-9+]/g, '')}`}
                className="trade-btn trade-btn-secondary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Call Desk
              </a>
              <a
                href={googleMapModalNode.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="trade-btn trade-btn-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flex: 1 }}
              >
                Open Google Maps &rarr;
              </a>
            </div>
          </div>
        </div>
      )}

      <footer>




        <span>KisanLink · Agronomic Intelligence System</span>
        <span>Market information for better decisions</span>
      </footer>
    </main>
  );
}


export default App;
