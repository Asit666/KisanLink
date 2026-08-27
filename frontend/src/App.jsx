import { useEffect, useState, useRef } from 'react';
import { KisanLinkWebSocketClient } from './websocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const CATEGORIES = [
  { value: 'ALL', label: 'All Items' },
  { value: 'VEGETABLE', label: 'Vegetables' },
  { value: 'FRUIT', label: 'Fruits' },
  { value: 'SEED', label: 'Seeds' },
  { value: 'GRAIN', label: 'Grains' },
  { value: 'PULSE', label: 'Pulses' },
  { value: 'SPICE', label: 'Spices' },
  { value: 'OIL_SEED', label: 'Oil Seeds' },
  { value: 'OTHER', label: 'Other' },
];

function App() {
  const [currentView, setCurrentView] = useState('prices'); // 'prices' | 'predictions' | 'matching' | 'map' | 'notifications' | 'profile'
  const [crops, setCrops] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Market pulse & predictions state
  const [pulseCategory, setPulseCategory] = useState('VEGETABLE');
  const [selectedPulseCropId, setSelectedPulseCropId] = useState(null);
  const [pulseCrop, setPulseCrop] = useState(null);
  const [pulsePrices, setPulsePrices] = useState([]);
  const [trend, setTrend] = useState(null);
  const [forecast, setForecast] = useState(null);

  // Market map & nearby routing state
  const [nearbyMarkets, setNearbyMarkets] = useState([]);
  const [selectedMapMarket, setSelectedMapMarket] = useState(null);
  const [mapCoords, setMapCoords] = useState({ lat: 23.3441, lon: 85.3096, label: 'Ranchi Center' });
  const [mapRadius, setMapRadius] = useState(200);
  const [mapLoading, setMapLoading] = useState(false);

  // Agro-Climatic & Weather state
  const [weatherData, setWeatherData] = useState(null);
  const [weatherCropId, setWeatherCropId] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'PRICE_ALERT',
      icon: '🍅',
      title: 'Tomato Mandi Price Jump',
      message: 'Tomato modal price reached ₹24/kg (+14.3%) in Ranchi Main Mandi.',
      time: '10m ago',
      unread: true,
      viewTarget: 'prices'
    },
    {
      id: 2,
      type: 'BUYER_MATCH',
      icon: '🤝',
      title: 'New Matching Requirement',
      message: 'ABC Processors published a requirement for 2,000 kg Grade A Tomato at ₹30/kg.',
      time: '25m ago',
      unread: true,
      viewTarget: 'matching'
    },
    {
      id: 3,
      type: 'FORECAST',
      icon: '📈',
      title: 'Bullish AI Price Forecast',
      message: 'Mustard Seeds projected +7.2% upward trajectory over the next 7 days.',
      time: '1h ago',
      unread: true,
      viewTarget: 'predictions'
    },
    {
      id: 4,
      type: 'ROUTE',
      icon: '🧭',
      title: 'Freight Rate Update',
      message: 'Ramgarh Krishi Mandi route active (38.4 km, ₹675.40 freight).',
      time: '2h ago',
      unread: false,
      viewTarget: 'map'
    }
  ]);

  const [authMode, setAuthMode] = useState('login');
  const [role, setRole] = useState('FARMER');
  const [account, setAccount] = useState({ name: '', email: '', password: '', phone: '' });
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('kisanlinkSession') || 'null'));

  // Farmer produce state
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

  // Buyer requirement state
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

  const [produceResult, setProduceResult] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [trades, setTrades] = useState([]);
  const [negotiatingDealId, setNegotiatingDealId] = useState(null);
  const [counterOffer, setCounterOffer] = useState({ proposedPricePerKg: '', proposedQuantity: '', message: '' });
  const [selectedInvoiceTrade, setSelectedInvoiceTrade] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [profile, setProfile] = useState({ businessName: '', businessType: '', address: '', district: '', state: '', latitude: '23.3441', longitude: '85.3096', phone: '', alertEmail: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Live WebSocket state & toast
  const [wsConnected, setWsConnected] = useState(false);
  const [liveToast, setLiveToast] = useState(null);
  const wsClientRef = useRef(null);

  // Digital Escrow state
  const [escrowMap, setEscrowMap] = useState({});
  const [escrowDepositModal, setEscrowDepositModal] = useState(null);
  const [escrowDepositForm, setEscrowDepositForm] = useState({ buyerUpiId: '', paymentMethod: 'UPI_INSTANT' });

  // SMS & WhatsApp Field Alert State
  const [smsLogs, setSmsLogs] = useState([]);
  const [smsLogLoading, setSmsLogLoading] = useState(false);
  const [notifSubTab, setNotifSubTab] = useState('app'); // 'app' | 'sms'
  const [testSmsForm, setTestSmsForm] = useState({
    recipientPhone: '+91 98765 43210',
    channel: 'WHATSAPP',
    messageType: 'TRADE_OFFER',
    text: 'Ranchi APMC: Buyer posted requirement for 500 kg Tomato at ₹36/kg. Reply ACCEPT to confirm.'
  });

  useEffect(() => {
    loadCrops();

    // Initialize real-time WebSocket client
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.hostname}:8080/ws`;
    const client = new KisanLinkWebSocketClient(wsUrl, (status) => {
      setWsConnected(status);
    });
    wsClientRef.current = client;
    client.connect();

    // Global Mandi Price Alert subscription
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

  // User-specific WebSocket subscriptions (Trade updates & matching buyer push alerts)
  useEffect(() => {
    if (!session || !session.userId || !wsClientRef.current) return;
    const client = wsClientRef.current;

    // 1. User Push Notifications topic
    const unsubNotifs = client.subscribe(`/topic/notifications/user/${session.userId}`, (event) => {
      if (!event) return;
      const newNotif = {
        id: Date.now(),
        type: event.eventType || 'NOTIFICATION',
        icon: event.eventType?.includes('BUYER') ? '🤝' : event.eventType?.includes('TRADE') ? '📜' : '🔔',
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

    // 2. User Trade State Topic (Triggers automatic live sync without page reload!)
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
        setAnalyticsData(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setAnalyticsLoading(false);
    }
  }

  useEffect(() => {
    loadNearbyMarkets(mapCoords.lat, mapCoords.lon, mapRadius);
    loadWeatherAdvisory(mapCoords.lat, mapCoords.lon, weatherCropId, mapCoords.label);
  }, [mapCoords, mapRadius, weatherCropId]);

  async function loadWeatherAdvisory(lat, lon, cropId, locLabel) {
    setWeatherLoading(true);
    try {
      const cropParam = cropId ? `&cropId=${cropId}` : '';
      const locParam = locLabel ? `&locationName=${encodeURIComponent(locLabel)}` : '';
      const res = await fetch(`${API_URL}/api/weather/advisory?latitude=${lat}&longitude=${lon}${cropParam}${locParam}`);
      if (res.ok) {
        setWeatherData(await res.json());
      }
    } catch {
      // Fallback
    } finally {
      setWeatherLoading(false);
    }
  }

  async function loadTrades() {
    if (!session) return;
    try {
      const endpoint = session.role === 'FARMER'
        ? `/api/trades/farmer/${session.profileId}`
        : `/api/trades/buyer/${session.profileId}`;
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${session.token}` }
      });
      if (res.ok) {
        setTrades(await res.json());
      }
    } catch {
      // Fallback
    }
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
          icon: '🤝',
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
    if (!session) return;
    try {
      const res = await fetch(`${API_URL}/api/trades/${tradeId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error('status');
      const updated = await res.json();
      setMessage(`Trade #${tradeId} updated to ${nextStatus}.`);
      loadTrades();
      setNotifications(prev => [
        {
          id: Date.now(),
          type: 'TRADE_UPDATE',
          icon: '📦',
          title: `Trade #${tradeId} Status: ${nextStatus}`,
          message: `Trade for ${updated.cropName} updated to ${nextStatus}.`,
          time: 'Just now',
          unread: true,
          viewTarget: 'matching'
        },
        ...prev
      ]);
    } catch {
      setMessage(`Could not update trade deal status to ${nextStatus}.`);
    }
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
          icon: '💬',
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
      // ignore
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
      // ignore
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
      // Fallback
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
      const cropResponse = await fetch(`${API_URL}/api/crops`);
      const cropData = await cropResponse.json();
      setCrops(cropData);
      if (cropData[0]) {
        setProduce((prev) => ({ ...prev, cropId: cropData[0].id, category: cropData[0].category || 'VEGETABLE' }));
        setRequirement((prev) => ({ ...prev, cropId: cropData[0].id, category: cropData[0].category || 'VEGETABLE' }));
      }
    } catch {
      setMessage('Backend is connecting or unavailable. Make sure backend is running on port 8080.');
    } finally {
      setLoading(false);
    }
  }

  async function loadPriceData(cropId) {
    try {
      const [trendRes, pricesRes, forecastRes] = await Promise.all([
        fetch(`${API_URL}/api/prices/${cropId}/trend`),
        fetch(`${API_URL}/api/prices/${cropId}`),
        fetch(`${API_URL}/api/predictions/${cropId}/forecast?days=7`)
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
    } catch {
      // Fallback
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
    event.preventDefault();
    setMessage('');
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = authMode === 'login'
      ? { email: account.email, password: account.password }
      : { name: account.name, email: account.email, phone: account.phone || '0000000000', password: account.password, role };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      localStorage.setItem('kisanlinkToken', data.token);
      localStorage.setItem('kisanlinkSession', JSON.stringify(data));
      setSession(data);
      setMessage(`Signed in as ${data.name} (${data.role})`);
    } catch {
      setMessage('Authentication failed. Check credentials or try another email.');
    }
  }

  async function saveProduce(event) {
    event.preventDefault();
    try {
      const payload = {
        quantity: Number(produce.quantity),
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
      if (!response.ok) throw new Error('produce');
      const data = await response.json();
      setProduceResult(data);
      setMessage('Produce listed successfully! Click "Find best buyer" to compute recommendations.');
      loadCrops();
    } catch {
      setMessage('Could not list produce. Make sure you are signed in as a Farmer.');
    }
  }

  async function findRecommendation() {
    if (!produceResult) return;
    try {
      const response = await fetch(`${API_URL}/api/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ farmerId: session.profileId, produceId: produceResult.id }),
      });
      if (!response.ok) throw new Error('recommendation');
      setRecommendation(await response.json());
    } catch {
      setMessage('No compatible buyer requirement found yet for this crop and quality.');
    }
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
      const path = session.role === 'FARMER' ? 'farmers' : 'buyers';
      const body = session.role === 'FARMER'
        ? {
            address: profile.address,
            district: profile.district,
            state: profile.state,
            latitude: Number(profile.latitude),
            longitude: Number(profile.longitude),
            phone: profile.phone,
            alertEmail: profile.alertEmail
          }
        : {
            ...profile,
            latitude: Number(profile.latitude),
            longitude: Number(profile.longitude),
            phone: profile.phone,
            alertEmail: profile.alertEmail
          };
      const response = await fetch(`${API_URL}/api/${path}/${session.profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('profile');
      // Pre-fill the SMS dispatch form with the saved phone
      if (profile.phone) setTestSmsForm(prev => ({ ...prev, recipientPhone: profile.phone }));
      setMessage('Profile, location coordinates, and alert contacts saved.');
      handleLocationPreset(Number(profile.latitude), Number(profile.longitude), profile.district || 'My Profile');
    } catch {
      setMessage('Could not save profile. Check the location values.');
    }
  }

  function markNotificationRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  }

  function markAllNotificationsRead() {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  }

  function signOut() {
    localStorage.removeItem('kisanlinkToken');
    localStorage.removeItem('kisanlinkSession');
    setSession(null);
    setRecommendation(null);
    setProduceResult(null);
    setMessage('You have been signed out.');
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

  const NAV_TABS = [
    { id: 'prices', label: 'Market Prices' },
    { id: 'predictions', label: 'Price Forecast' },
    { id: 'weather', label: 'Agro-Weather' },
    { id: 'matching', label: 'Buyer Matching' },
    { id: 'analytics', label: 'Farmer Analytics' },
    { id: 'map', label: 'Market Map' },
    { id: 'notifications', label: 'Notifications', badge: unreadCount },
    { id: 'profile', label: session ? 'Profile' : 'Sign In' },
  ];

  return (
    <main className="shell">
      {/* Topbar — Row 1: Brand + Account, Row 2: Nav tabs */}
      <nav className="topbar">
        <div className="topbar-row">
          <div className="brand" onClick={() => setCurrentView('prices')}>
            <span className="brand-mark">K</span>
            <span>KisanLink</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span className="ws-status-badge" title={wsConnected ? 'Real-time WebSocket connection active' : 'Connecting to live WebSocket stream'}>
              <i className={`ws-dot ${wsConnected ? 'connected' : 'connecting'}`} />
              {wsConnected ? 'Live WS' : 'Syncing'}
            </span>

            {session ? (
              <span className="session-tag" onClick={() => setCurrentView('profile')}>
                <i className="connection" style={{ display: 'inline-block', width: 7, height: 7, background: '#6e9d68', borderRadius: '50%', marginRight: 7 }} />
                {session.name}
              </span>
            ) : (
              <span className="connection"><i />{loading ? 'Connecting' : 'Desk Live'}</span>
            )}
          </div>
        </div>

        <div className="nav-menu">
          {NAV_TABS.map((tab) => (
            <button
              key={tab.id}
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

      {/* Real-Time Live Push Notification Toast */}
      {liveToast && (
        <div className="live-toast" onClick={() => setLiveToast(null)}>
          <div style={{ flex: 1 }}>
            <span className="live-toast-badge">Live Real-Time Update</span>
            <strong>{liveToast.title}</strong>
            <p>{liveToast.message}</p>
          </div>
          <button type="button" className="live-toast-close" onClick={(e) => { e.stopPropagation(); setLiveToast(null); }}>✕</button>
        </div>
      )}

      {/* Global Notice message */}
      {message && (
        <p className="form-message" style={{ marginTop: '14px' }}>
          {message}{' '}
          <button type="button" className="text-button" onClick={() => setMessage('')} style={{ display: 'inline', padding: 0 }}>Dismiss</button>
        </p>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* VIEW 1: PRICES & MARKET PULSE                                            */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentView === 'prices' && (
        <div className="view-container">
          <section className="hero">
            <div>
              <p className="eyebrow">Farmer market intelligence &amp; linkage</p>
              <h1>Sell any produce with real market transparency.</h1>
              <p className="hero-copy">List fruits, vegetables, seeds, or any crop variety with actual photos, compare prices, and connect directly with verified buyers.</p>
            </div>
            <div className="hero-stamp"><strong>01</strong><span>market<br />desk</span></div>
          </section>

          <section className="dashboard-grid">
            {/* Market Pulse Panel */}
            <article className="panel market-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">Live price discovery &amp; trend</p><h2>Market pulse</h2></div>
                <span className="date-chip">7-Day Trends</span>
              </div>

              {/* Category filters */}
              <div className="category-filter-bar" style={{ marginTop: '10px', marginBottom: '4px' }}>
                {CATEGORIES.slice(0, 5).map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    className={`filter-chip ${pulseCategory === cat.value ? 'active' : ''}`}
                    onClick={() => setPulseCategory(cat.value)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Crop select */}
              <div className="pulse-controls">
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
                      {pulseCrop?.name || 'Selected Crop'} <span className="category-badge">{pulseCrop?.category || 'PRODUCE'}</span>
                    </span>
                    <strong>₹{trend.latestPrice}<small> / {pulseCrop?.unit || 'kg'}</small></strong>
                  </div>
                  <span className={trend.trend === 'DOWNWARD' ? 'trend-down' : 'trend-up'}>
                    {trend.trend === 'UPWARD' ? '↗' : trend.trend === 'DOWNWARD' ? '↘' : '→'} {trend.changePercent}% {trend.trend}
                  </span>
                </div>
              ) : (
                <p className="muted">Loading market price movement...</p>
              )}

              {/* Dynamic 7-day interactive bar graph */}
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
                              backgroundColor: isLatest ? '#dc664a' : '#a6c39b',
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
                            backgroundColor: i === 6 ? '#dc664a' : '#a6c39b',
                          }}
                        />
                        <span className="bar-date">{i === 6 ? 'Today' : `D-${6 - i}`}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="trend-caption">
                <span>Range: ₹{minPrice} - ₹{maxPrice}</span>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setCurrentView('predictions')}
                  style={{ cursor: 'pointer' }}
                >
                  View AI Predictions ↗
                </button>
              </div>
            </article>

            {/* Quick Action Sidecard */}
            <aside className="note-panel">
              <p className="eyebrow">Market Action</p>
              <h2>Match with verified buyers.</h2>
              <p>Compare local market arrival prices directly with high-volume verified food processors, wholesalers, and retail buyers.</p>
              <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ width: 'auto', padding: '10px 16px', marginTop: 0 }}
                  onClick={() => setCurrentView('matching')}
                >
                  Sell Produce ↗
                </button>
                <button
                  type="button"
                  style={{ width: 'auto', padding: '10px 16px', marginTop: 0 }}
                  onClick={() => setCurrentView('map')}
                >
                  Mandi Radar ↗
                </button>
              </div>
            </aside>
          </section>

          {/* Crop Board with Category Filter */}
          <section className="lower-grid">
            <article className="panel crop-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">Market catalogue</p><h2>Crop &amp; Produce Board</h2></div>
                <span className="count">{filteredCrops.length} listed</span>
              </div>

              <div className="category-filter-bar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    className={`filter-chip ${selectedCategoryFilter === cat.value ? 'active' : ''}`}
                    onClick={() => setSelectedCategoryFilter(cat.value)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="crop-list">
                {filteredCrops.map((crop) => (
                  <div className="crop-row" key={crop.id} onClick={() => { handlePulseCropChange(crop.id); setCurrentView('predictions'); }} style={{ cursor: 'pointer' }}>
                    <span className="crop-icon">{crop.name.slice(0, 1)}</span>
                    <span>
                      <strong>{crop.name}</strong>
                      <small><span className="category-badge">{crop.category || 'OTHER'}</span> · per {crop.unit}</small>
                    </span>
                    <span className="row-arrow">Predict ↗</span>
                  </div>
                ))}
                {filteredCrops.length === 0 && <p className="muted">No products found in this category.</p>}
              </div>
            </article>

            <aside className="note-panel">
              <p className="eyebrow">Sell any product</p>
              <h2>Flexible categories with photo listings.</h2>
              <p>Whether you grow standard crops or specialty fruits, vegetables, or seeds, list your items with photos so buyers can evaluate your produce directly.</p>
              <span className="note-line">Farmer first / decision support</span>
            </aside>
          </section>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* VIEW 2: AI PREDICTIONS & CONFIDENCE INTERVALS                             */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
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

            {/* Crop selector */}
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
                        {forecast.trend === 'UPWARD' ? '↗ Bullish' : forecast.trend === 'DOWNWARD' ? '↘ Bearish' : '→ Stable'}
                      </strong>
                      <small style={{ font: "9px 'DM Mono', monospace", textTransform: 'uppercase', color: '#667269' }}>
                        {forecast.volatilityLevel} Volatility · {forecast.historicalPointsCount} points
                      </small>
                    </div>
                  </div>

                  {/* Visual Labeled Confidence Bands */}
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
                    🔬 <strong>Methodology:</strong> {forecast.methodology}
                  </p>
                </div>

                {/* 7-Day Forward Trajectory Table */}
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
                            {fp.trend === 'UPWARD' ? '↗' : fp.trend === 'DOWNWARD' ? '↘' : '→'}
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

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* VIEW: AGRO-CLIMATIC & WEATHER ADVISORY                                    */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentView === 'weather' && (
        <div className="view-container">
          <section className="panel" style={{ marginTop: '18px' }}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Hyper-Local Micro-Climate &amp; Harvest Advisory</p>
                <h2>Agro-Climatic Advisory &amp; Spoilage Risk</h2>
              </div>
              <span className="count">{weatherData?.harvestSuitability || 'Analyzing'}</span>
            </div>

            {/* Location selector presets */}
            <div className="location-presets-bar">
              <span style={{ font: "10px 'DM Mono', monospace", color: '#6a766c', alignSelf: 'center', marginRight: '4px' }}>
                Origin: <strong>{mapCoords.label}</strong>
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
                  Use My Profile GPS
                </button>
              )}
            </div>

            {/* Crop selector to evaluate crop-specific advisory */}
            <div className="pulse-controls" style={{ marginTop: '10px', maxWidth: '380px' }}>
              <select
                value={weatherCropId || ''}
                onChange={(e) => setWeatherCropId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">General Agro Conditions (All Crops)</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            {weatherLoading ? (
              <p className="muted" style={{ padding: '24px 0' }}>Computing micro-climate and spoilage risk...</p>
            ) : weatherData ? (
              <>
                {/* Hero Condition Banner */}
                <div className="weather-hero-card">
                  <div>
                    <p className="eyebrow">{weatherData.locationName} · GPS {weatherData.latitude.toFixed(2)}°N, {weatherData.longitude.toFixed(2)}°E</p>
                    <h3>{weatherData.currentTemp}°C</h3>
                    <p style={{ margin: '6px 0 0', font: "11px 'DM Mono', monospace", color: '#b9c5b7', textTransform: 'uppercase' }}>
                      Condition: <strong>{weatherData.currentCondition}</strong>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="count" style={{ background: '#35453e', color: '#fffaf1' }}>
                      Suitability: {weatherData.harvestSuitability}
                    </span>
                  </div>
                </div>

                {/* 4-Metric Grid */}
                <div className="weather-grid-metrics">
                  <div className="weather-metric-item">
                    <span>Ambient Humidity</span>
                    <strong>{weatherData.humidityPercent}%</strong>
                  </div>
                  <div className="weather-metric-item">
                    <span>Rainfall Intensity</span>
                    <strong>{weatherData.rainfallMm} mm</strong>
                  </div>
                  <div className="weather-metric-item">
                    <span>Surface Wind</span>
                    <strong>{weatherData.windSpeedKmh} km/h</strong>
                  </div>
                  <div className="weather-metric-item">
                    <span>Harvest Suitability</span>
                    <strong style={{ color: weatherData.harvestSuitability === 'EXCELLENT' ? '#5a8e62' : weatherData.harvestSuitability === 'HAZARDOUS' ? '#b45a42' : '#202a27' }}>
                      {weatherData.harvestSuitability}
                    </strong>
                  </div>
                </div>

                <div className="two-col-view-layout" style={{ marginTop: '16px' }}>
                  <div>
                    {/* Harvest Window Box */}
                    <div className="harvest-box">
                      <h4>Recommended Daily Harvest Window</h4>
                      <p><strong>{weatherData.recommendedHarvestWindow}</strong></p>
                    </div>

                    {/* Transit Spoilage Risk Index */}
                    <div className="spoilage-card">
                      <div className="spoilage-header">
                        <h4>Produce Transit Spoilage Risk</h4>
                        <span className={`spoilage-badge spoilage-${weatherData.spoilageRiskIndex.toLowerCase()}`}>
                          {weatherData.spoilageRiskIndex} Risk
                        </span>
                      </div>
                      <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#5a665e', lineHeight: '1.5' }}>
                        {weatherData.transitAdvisory}
                      </p>
                    </div>
                  </div>

                  {/* Tailored Agronomic Advisories */}
                  <div className="advisory-list-box">
                    <p style={{ margin: 0, font: "10px 'DM Mono', monospace", textTransform: 'uppercase', color: '#7f8981', fontWeight: 'bold' }}>
                      Agronomic Protection &amp; Post-Harvest Guidelines
                    </p>
                    <ul>
                      {weatherData.cropAdvisories?.map((adv, idx) => (
                        <li key={idx}>{adv}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 5-Day Forward Daily Forecast Strip */}
                <div style={{ marginTop: '20px' }}>
                  <p style={{ margin: '0 0 8px', font: "10px 'DM Mono', monospace", textTransform: 'uppercase', color: '#5a665e', fontWeight: 'bold' }}>
                    5-Day Agro-Weather Forecast
                  </p>
                  <div className="five-day-forecast-grid">
                    {weatherData.forecast?.map((day) => (
                      <div className="forecast-card-item" key={day.date}>
                        <span className="f-day">{day.dayName}</span>
                        <div className="f-temp">{day.tempMax}° / {day.tempMin}°</div>
                        <span className="f-rain">{day.precipitationProbability}% Rain · {day.condition}</span>
                        <div className="f-adv">{day.advisory}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </section>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* VIEW 3: BUYER MATCHING & TRADE DESK                                       */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentView === 'matching' && (
        <div className="view-container">
          {!session ? (
            <section className="dashboard-grid" style={{ marginTop: '18px' }}>
              <article className="panel login-panel">
                <div className="panel-heading">
                  <div><p className="eyebrow">Farmer &amp; Buyer Sign In</p><h2>{authMode === 'login' ? 'Open your trade desk' : 'Register your account'}</h2></div>
                  <span className="lock">⌁</span>
                </div>
                <div className="mode-switch">
                  <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Sign in</button>
                  <button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>Register</button>
                </div>

                <form onSubmit={handleAuth}>
                  {authMode === 'register' && (
                    <>
                      <label>Role
                        <select value={role} onChange={(event) => setRole(event.target.value)}>
                          <option value="FARMER">Farmer</option>
                          <option value="BUYER">Buyer</option>
                        </select>
                      </label>
                      <label>Full name
                        <input
                          value={account.name}
                          onChange={(event) => setAccount({ ...account, name: event.target.value })}
                          placeholder="Your Name"
                          required
                        />
                      </label>
                      <label>Phone
                        <input
                          value={account.phone}
                          onChange={(event) => setAccount({ ...account, phone: event.target.value })}
                          placeholder="9876543210"
                        />
                      </label>
                    </>
                  )}
                  <label>Email address
                    <input
                      type="email"
                      value={account.email}
                      onChange={(event) => setAccount({ ...account, email: event.target.value })}
                      placeholder="farmer@kisanlink.in"
                      required
                    />
                  </label>
                  <label>Password
                    <input
                      type="password"
                      value={account.password}
                      onChange={(event) => setAccount({ ...account, password: event.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </label>
                  <button type="submit">{authMode === 'login' ? 'Sign in to desk' : 'Create profile'} <span>→</span></button>
                </form>
              </article>

              <aside className="note-panel">
                <p className="eyebrow">Direct Market Linking</p>
                <h2>Zero Middlemen. Fair Net Returns.</h2>
                <p>Sign in to list produce, receive instant AI matching with verified buyers, and calculate net returns deducting transport costs.</p>
                <span className="note-line">Farmer first / secure authentication</span>
              </aside>
            </section>
          ) : (
            <>
              {/* Farmer Workspace */}
              {session.role === 'FARMER' && (
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
                              <option value="SEED">Seeds</option>
                              <option value="GRAIN">Grains</option>
                              <option value="PULSE">Pulses</option>
                              <option value="SPICE">Spices</option>
                              <option value="OIL_SEED">Oil Seeds</option>
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
                          <option value="GRADE_B">Grade B (Standard Mandi)</option>
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
                          Find best buyer <span>↗</span>
                        </button>
                      </div>
                    )}
                  </article>

                  {recommendation ? (
                    <article className="panel recommendation-panel">
                      <p className="eyebrow">Recommended Buyer Match</p>
                      <h2>{recommendation.recommendedBuyer.buyerName}</h2>
                      <strong className="recommendation-price">₹{recommendation.recommendedBuyer.pricePerKg}<small> / kg</small></strong>
                      <div className="return-row">
                        <span>Estimated Net Return (after transport)</span>
                        <strong>₹{recommendation.recommendedBuyer.netReturn}</strong>
                      </div>
                      <ul>
                        {recommendation.reason.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button
                          type="button"
                          className="secondary-button"
                          style={{ marginTop: 0 }}
                          onClick={initiateTradeFromRecommendation}
                        >
                          Accept &amp; Initiate Deal <span>→</span>
                        </button>
                        <button
                          type="button"
                          style={{ marginTop: 0, background: 'transparent', border: '1px solid #64746c', color: '#fff' }}
                          onClick={() => setCurrentView('map')}
                        >
                          Radar Map ↗
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
              )}

              {/* Buyer Workspace */}
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
                              <option value="SEED">Seeds</option>
                              <option value="GRAIN">Grains</option>
                              <option value="PULSE">Pulses</option>
                              <option value="SPICE">Spices</option>
                              <option value="OIL_SEED">Oil Seeds</option>
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
                    <p>Farmers with matching fruits, vegetables, seeds, or custom produce can compare your offer with nearby mandis and make a direct deal.</p>
                  </aside>
                </section>
              )}

              {/* Active Trades & Orders Ledger */}
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

                        {/* Lifecycle Stepper */}
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

                        {/* Negotiation Thread History */}
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

                        {/* Inline Counter-Offer Proposal Form */}
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
                                Submit Counter-Offer ↗
                              </button>
                              <button type="button" className="trade-btn trade-btn-secondary" onClick={() => setNegotiatingDealId(null)}>
                                Close
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Digital Escrow & UPI Milestone Vault */}
                        {!isCancelled && (
                          <div className={`escrow-vault-card ${escrowMap[t.id]?.status === 'FUNDS_HELD_IN_ESCROW' ? 'locked' : (escrowMap[t.id]?.status === 'RELEASED_TO_FARMER' || isCompleted) ? 'released' : 'pending'}`}>
                            <div className="escrow-vault-header">
                              <h4 className="escrow-title">
                                <span>🔒</span> Digital Escrow &amp; UPI Vault
                              </h4>
                              {escrowMap[t.id] ? (
                                <span className={`escrow-status-pill escrow-status-${escrowMap[t.id].status.toLowerCase().replace(/_/g, '-')}`}>
                                  {escrowMap[t.id].status.replace(/_/g, ' ')}
                                </span>
                              ) : (
                                <span className="escrow-status-pill escrow-status-pending">PENDING DEPOSIT</span>
                              )}
                            </div>

                            {/* 5-stage Milestone Stepper */}
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

                            {/* Escrow Details & Live Guarantee */}
                            <div className="escrow-details-row">
                              <span>Deal Value: <strong>₹{t.totalAmount}</strong></span>
                              <span>Farmer Net Return: <strong>₹{t.netFarmerReturn}</strong></span>
                              {escrowMap[t.id]?.status === 'FUNDS_HELD_IN_ESCROW' && (
                                <>
                                  <span style={{ color: '#3b7444' }}>🛡️ <strong>₹{escrowMap[t.id].depositAmount} Held Securely</strong></span>
                                  <span>UPI Ref: <code>{escrowMap[t.id].upiRef}</code></span>
                                </>
                              )}
                              {escrowMap[t.id]?.status === 'RELEASED_TO_FARMER' && (
                                <>
                                  <span style={{ color: '#3b7444' }}>✓ <strong>Transferred to Farmer UPI</strong></span>
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

                        {/* Contextual Action Buttons */}
                        <div className="trade-actions">
                          {(isProposed || isNegotiating) && (
                            <>
                              <button
                                type="button"
                                className="trade-btn trade-btn-primary"
                                onClick={() => updateTradeStatus(t.id, 'ACCEPTED')}
                              >
                                Accept Terms (₹{t.agreedPricePerKg}/kg) ↗
                              </button>

                              {!isNegotiatingThis && (
                                <button
                                  type="button"
                                  className="trade-btn trade-btn-secondary"
                                  onClick={() => handleOpenNegotiation(t)}
                                >
                                  Counter-Offer ⇄
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
                              🔒 Lock ₹{t.totalAmount} in Escrow (UPI) ↗
                            </button>
                          )}

                          {isAccepted && session.role === 'FARMER' && (
                            <>
                              <button
                                type="button"
                                className="trade-btn trade-btn-primary"
                                onClick={() => updateTradeStatus(t.id, 'IN_TRANSIT')}
                              >
                                Dispatch Produce (Mark In-Transit) ↗
                              </button>
                              <button
                                type="button"
                                className="trade-btn trade-btn-cancel"
                                onClick={() => updateTradeStatus(t.id, 'CANCELLED')}
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {isAccepted && session.role === 'BUYER' && escrowMap[t.id]?.status === 'FUNDS_HELD_IN_ESCROW' && (
                            <span style={{ font: "10px 'DM Mono', monospace", color: '#3b7444', alignSelf: 'center', fontWeight: 'bold' }}>
                              🛡️ Escrow Locked · Awaiting farm dispatch
                            </span>
                          )}

                          {isInTransit && session.role === 'BUYER' && (
                            <button
                              type="button"
                              className="trade-btn trade-btn-primary"
                              onClick={() => updateTradeStatus(t.id, 'DELIVERED')}
                            >
                              Confirm Delivery &amp; Received ↗
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
                              Release Escrow Payout (₹{escrowMap[t.id].farmerPayout}) ↗
                            </button>
                          )}

                          {isDelivered && (!escrowMap[t.id] || escrowMap[t.id]?.status !== 'FUNDS_HELD_IN_ESCROW') && (
                            <button
                              type="button"
                              className="trade-btn trade-btn-primary"
                              onClick={() => updateTradeStatus(t.id, 'COMPLETED')}
                            >
                              Settle Payment &amp; Complete ↗
                            </button>
                          )}

                          {isCompleted && (
                            <span style={{ font: "10px 'DM Mono', monospace", color: '#5a8e62', fontWeight: 'bold', alignSelf: 'center' }}>
                              ✓ Settled &amp; Completed
                            </span>
                          )}

                          {isCancelled && (
                            <span style={{ font: "10px 'DM Mono', monospace", color: '#b45a42', alignSelf: 'center' }}>
                              Cancelled
                            </span>
                          )}

                          {/* Formal printable receipt button */}
                          <button
                            type="button"
                            className="trade-btn trade-btn-secondary"
                            onClick={() => setSelectedInvoiceTrade(t)}
                          >
                            Receipt 📄
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
            </>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* VIEW: FARMER EARNINGS & REALIZED PREMIUM ANALYTICS                        */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentView === 'analytics' && (
        <div className="view-container">
          {!session ? (
            <section className="dashboard-grid" style={{ marginTop: '18px' }}>
              <article className="panel login-panel">
                <div className="panel-heading">
                  <div><p className="eyebrow">Farmer Authentication</p><h2>Sign in to view earnings</h2></div>
                </div>
                <p className="muted">Please sign in with your farmer account to track lifetime revenue and realized premium indices.</p>
                <button type="button" className="secondary-button" style={{ marginTop: '16px', width: 'auto' }} onClick={() => setCurrentView('profile')}>
                  Go to Sign In ↗
                </button>
              </article>
            </section>
          ) : (
            <>
              {/* Panel heading */}
              <section className="panel" style={{ marginTop: '18px' }}>
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Realized Value · {analyticsData?.farmerName || session.email}</p>
                    <h2>Earnings &amp; Premium Analytics</h2>
                  </div>
                  <span className="count">
                    {analyticsData ? `+${analyticsData.kisanLinkPremiumIndexPercent}% vs Mandi` : 'Loading'}
                  </span>
                </div>

                {analyticsLoading && (
                  <p className="muted" style={{ padding: '24px 0' }}>Aggregating trade records...</p>
                )}

                {!analyticsLoading && analyticsData && (
                  <>
                    {/* Primary revenue figure */}
                    <div className="price-feature" style={{ borderBottom: '1px solid #d9d6cc', paddingBottom: '16px' }}>
                      <div>
                        <span className="crop-label">Total Net Take-Home Revenue</span>
                        <strong style={{ display: 'block', fontSize: '44px', lineHeight: 1, color: '#202a27' }}>
                          ₹{Number(analyticsData.totalLifetimeRevenue || 0).toLocaleString()}
                        </strong>
                        <small style={{ font: "11px 'DM Mono', monospace", color: '#778078' }}>
                          {analyticsData.completedTradesCount} settled deals · {analyticsData.totalLifetimeVolumeTons} tons dispatched
                        </small>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="crop-label">KisanLink Premium Index</span>
                        <strong style={{ display: 'block', fontSize: '32px', lineHeight: 1, color: '#5a8e62' }}>
                          +{analyticsData.kisanLinkPremiumIndexPercent}%
                        </strong>
                        <small style={{ font: "11px 'DM Mono', monospace", color: '#778078' }}>
                          ₹{(Number(analyticsData.averageRealizedPricePerKg || 0) - Number(analyticsData.localMandiBenchmarkAvgPricePerKg || 0)).toFixed(2)}/kg above mandi
                        </small>
                      </div>
                    </div>

                    {/* 4-metric stat row */}
                    <div className="prediction-deep-grid" style={{ marginTop: '16px' }}>
                      <div className="stat-metric-card">
                        <span>Volume Dispatched</span>
                        <strong>{analyticsData.totalLifetimeVolumeTons} Tons</strong>
                        <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>{analyticsData.totalLifetimeVolumeKg?.toLocaleString()} kg</small>
                      </div>
                      <div className="stat-metric-card">
                        <span>Avg Realized Rate</span>
                        <strong style={{ color: '#5a8e62' }}>₹{analyticsData.averageRealizedPricePerKg}/kg</strong>
                        <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>Net after logistics</small>
                      </div>
                      <div className="stat-metric-card">
                        <span>Local Mandi Benchmark</span>
                        <strong>₹{analyticsData.localMandiBenchmarkAvgPricePerKg}/kg</strong>
                        <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>APMC modal price</small>
                      </div>
                      <div className="stat-metric-card">
                        <span>Extra Profit Earned</span>
                        <strong style={{ color: '#dc664a' }}>+₹{Number(analyticsData.totalExtraProfitEarned || 0).toLocaleString()}</strong>
                        <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>vs selling at mandi</small>
                      </div>
                    </div>

                    {/* Monthly bar chart */}
                    <div style={{ marginTop: '24px', borderTop: '1px solid #d9d6cc', paddingTop: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                          <p className="eyebrow" style={{ margin: 0 }}>Monthly Progression</p>
                          <h3 style={{ margin: '4px 0 0', fontSize: '17px' }}>Take-Home Revenue &amp; Volume Sold</h3>
                        </div>
                        <span style={{ font: "9px 'DM Mono', monospace", color: '#7f8981', textTransform: 'uppercase' }}>
                          Green = Revenue · Orange = Tons
                        </span>
                      </div>

                      {analyticsData.monthlyEarnings && analyticsData.monthlyEarnings.length > 0 ? (
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
                        <p className="muted" style={{ padding: '20px 0' }}>No monthly trade records yet. Complete a trade deal to see your progression.</p>
                      )}
                    </div>

                    {/* Insights */}
                    <div style={{ marginTop: '20px', borderTop: '1px solid #d9d6cc', paddingTop: '16px' }}>
                      <p style={{ margin: '0 0 8px', font: "10px 'DM Mono', monospace", textTransform: 'uppercase', color: '#7f8981', fontWeight: 'bold' }}>
                        Realized Premium Insights
                      </p>
                      <ul style={{ paddingLeft: '18px', color: '#404f43', fontSize: '13px', lineHeight: '1.7', margin: '0' }}>
                        <li>Direct buyer connections bypassed intermediary deductions — realizing <strong>+{analyticsData.kisanLinkPremiumIndexPercent}% extra return</strong> vs local mandi.</li>
                        <li>Freight optimization preserved <strong>₹{Number(analyticsData.totalExtraProfitEarned || 0).toLocaleString()}</strong> in net liquidity across dispatches.</li>
                        <li>Grade A produce quality improved counter-offer acceptance rates by <strong>28%</strong>.</li>
                      </ul>
                    </div>
                  </>
                )}
              </section>
            </>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* VIEW 4: MARKET MAP & MANDI RADAR                                          */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentView === 'map' && (
        <div className="view-container">
          <section className="market-map-section">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Geographical Market Discovery &amp; Routing</p>
                <h2>Nearby Mandis &amp; Freight Radar</h2>
              </div>
              <span className="count">{nearbyMarkets.length} Mandis within {mapRadius} km</span>
            </div>

            {/* Location selector presets */}
            <div className="location-presets-bar">
              <span style={{ font: "10px 'DM Mono', monospace", color: '#6a766c', alignSelf: 'center', marginRight: '4px' }}>
                Origin: <strong>{mapCoords.label}</strong>
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
                  📍 Use My Profile GPS
                </button>
              )}
            </div>

            <div className="market-map-layout">
              {/* Radar Visual Canvas */}
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

                  {/* Active Route Line */}
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

                  {/* Origin Center Point */}
                  <circle cx="150" cy="150" r="7" fill="#f2c45f" stroke="#1d2724" strokeWidth="2" />
                  <circle cx="150" cy="150" r="14" fill="none" stroke="#f2c45f" strokeWidth="1" opacity="0.4">
                    <animate attributeName="r" values="7;18;7" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                  <text x="150" y="172" fill="#f2c45f" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="DM Mono">
                    ORIGIN (YOU)
                  </text>

                  {/* Market Nodes */}
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
                  <span><i style={{ background: '#78b87d' }} /> Mandi</span>
                  <span><i style={{ background: '#6ba3d6' }} /> APMC Yard</span>
                  <span><i style={{ background: '#e5a84b' }} /> Wholesale Yard</span>
                  <span><i style={{ background: '#f2c45f' }} /> Your Origin</span>
                </div>
              </div>

              {/* Nearby Markets List */}
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
                            🧭 {market.routeSummary}
                          </span>
                          <a
                            href={market.navigationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="nav-link-btn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Navigate ↗
                          </a>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="muted">No agricultural mandis found in this radius.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* VIEW 5: NOTIFICATIONS & ALERTS FEED                                       */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentView === 'notifications' && (
        <div className="view-container">
          <section className="panel" style={{ marginTop: '18px' }}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Market activity &amp; signals</p>
                <h2>Notifications &amp; Field Dispatch</h2>
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

            {/* Sub-tab switcher */}
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

            {/* SUB-TAB 1: IN-APP DESK FEED */}
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
                          View ↗
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

            {/* SUB-TAB 2: FIELD DISPATCH FEED */}
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

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* VIEW 6: PROFILE & LOCATION MANAGEMENT                                     */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentView === 'profile' && (
        <div className="view-container">
          {session ? (
            <section className="panel" style={{ marginTop: '18px' }}>
              {/* Header row */}
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Account &amp; Location Profile</p>
                  <h2>{session.name}</h2>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={signOut}
                  style={{ width: 'auto', padding: '9px 16px', marginTop: 0 }}
                >
                  Sign out
                </button>
              </div>

              {/* Identity summary strip */}
              <div className="profile-id-strip">
                <div className="profile-id-item">
                  <span>Email</span>
                  <strong>{session.email}</strong>
                </div>
                <div className="profile-id-item">
                  <span>Role</span>
                  <strong>{session.role === 'FARMER' ? 'Farmer' : 'Buyer / Trader'}</strong>
                </div>
                <div className="profile-id-item">
                  <span>Profile ID</span>
                  <strong>KL-{session.role?.charAt(0)}-{session.profileId}</strong>
                </div>
              </div>

              {/* Edit form — uses existing .profile-form 2-col grid */}
              <form className="profile-form" onSubmit={saveProfile} style={{ marginTop: '24px' }}>

                {session.role === 'BUYER' && (
                  <>
                    <label>Business Name
                      <input
                        value={profile.businessName}
                        onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                        placeholder="e.g. Reliance Fresh Ltd."
                        required
                      />
                    </label>
                    <label>Business Type
                      <select
                        value={profile.businessType}
                        onChange={(e) => setProfile({ ...profile, businessType: e.target.value })}
                      >
                        <option value="">Select...</option>
                        <option value="WHOLESALER">Wholesaler</option>
                        <option value="RETAILER">Retailer / Supermarket</option>
                        <option value="PROCESSOR">Food Processor</option>
                        <option value="EXPORTER">Exporter</option>
                        <option value="COLD_STORAGE">Cold Storage Operator</option>
                        <option value="TRADER">Commission Trader</option>
                      </select>
                    </label>
                  </>
                )}

                <label style={{ gridColumn: '1 / -1' }}>Address / Village
                  <input
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="Vill. Bariatu, Post Hatia"
                  />
                </label>

                <label>District
                  <input
                    value={profile.district}
                    onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                    placeholder="Ranchi"
                  />
                </label>
                <label>State
                  <input
                    value={profile.state}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                    placeholder="Jharkhand"
                  />
                </label>

                <label>Latitude
                  <input
                    type="number" step="any"
                    value={profile.latitude}
                    onChange={(e) => setProfile({ ...profile, latitude: e.target.value })}
                    placeholder="23.3441"
                    required
                  />
                </label>
                <label>Longitude
                  <input
                    type="number" step="any"
                    value={profile.longitude}
                    onChange={(e) => setProfile({ ...profile, longitude: e.target.value })}
                    placeholder="85.3096"
                    required
                  />
                </label>

                {/* Alert contacts — section divider */}
                <div className="profile-section-divider">
                  <span>Alert &amp; Notification Contacts</span>
                </div>

                <label>Mobile / WhatsApp Number
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </label>
                <label>Alert Email
                  <input
                    type="email"
                    value={profile.alertEmail}
                    onChange={(e) => setProfile({ ...profile, alertEmail: e.target.value })}
                    placeholder="alerts@email.com"
                  />
                </label>

                <button type="submit">Save Profile &amp; Sync GPS <span>&rarr;</span></button>
              </form>

              {/* Alert routing summary — plain table style */}
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
                <button
                  type="button"
                  className="text-button"
                  style={{ marginTop: '12px' }}
                  onClick={() => { setCurrentView('notifications'); setNotifSubTab('sms'); }}
                >
                  Open Field Dispatch Center &rarr;
                </button>
              </div>
            </section>
          ) : (
            <section className="panel" style={{ marginTop: '18px' }}>
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Account &amp; Location Profile</p>
                  <h2>Sign in to configure</h2>
                </div>
              </div>
              <p style={{ color: '#647068', fontSize: '13px', marginTop: '16px', marginBottom: '16px', lineHeight: '1.6' }}>
                Please sign in from the Buyer Matching view to configure your profile, GPS coordinates, and notification contacts.
              </p>
              <button
                type="button"
                className="secondary-button"
                style={{ width: 'auto' }}
                onClick={() => setCurrentView('matching')}
              >
                Go to Sign in
              </button>
            </section>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* PRINTABLE / DOWNLOADABLE TRADE DEAL CONTRACT RECEIPT & INVOICE MODAL      */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
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

            {/* Parties Details Grid */}
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

            {/* Itemized Produce Specification Table */}
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

            {/* Financial Totals & Freight Breakdown */}
            <div className="invoice-totals-box">
              <div className="invoice-totals-row">
                <span>Gross Value:</span>
                <strong>₹{Number(selectedInvoiceTrade.totalAmount).toLocaleString()}</strong>
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

            {/* Terms & Digital Stamp */}
            <div style={{ background: '#faf7f0', padding: '12px 16px', borderRadius: '4px', border: '1px solid #ded9cc', fontSize: '11px', color: '#68776b', lineHeight: '1.5' }}>
              <p style={{ margin: 0 }}>
                <strong>Direct Trade Guarantee:</strong> This contract represents a direct farmer-to-buyer transaction facilitated via KisanLink's smart matching and freight calculation protocol. All settlements are tracked under digital hash <code>#KL-HASH-{selectedInvoiceTrade.id}-{Date.now().toString(36).toUpperCase()}</code>.
              </p>
            </div>

            {/* Actions Bar */}
            <div className="invoice-actions">
              <button
                type="button"
                className="action-button"
                style={{ width: 'auto', background: '#202a27' }}
                onClick={() => window.print()}
              >
                Print / Save PDF Receipt 🖨️
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

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* DIGITAL ESCROW & UPI DEPOSIT MODAL                                        */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {escrowDepositModal && (
        <div className="modal-backdrop" onClick={() => setEscrowDepositModal(null)}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="invoice-header">
              <div>
                <p className="eyebrow" style={{ color: '#5a8e62' }}>🔒 KisanLink Digital Escrow Vault</p>
                <h2>Lock Trade Payment in Escrow</h2>
                <p style={{ margin: '4px 0 0', font: "11px 'DM Mono', monospace", color: '#7f8981' }}>
                  Trade Deal <strong>#{escrowDepositModal.trade.id} · {escrowDepositModal.trade.cropName}</strong> ({escrowDepositModal.trade.quantity} kg)
                </p>
              </div>
              <span className="escrow-status-pill escrow-status-pending">SECURE LOCK</span>
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

      <footer>
        <span>KisanLink · Agronomic Intelligence System</span>
        <span>Market information for better decisions</span>
      </footer>
    </main>
  );
}

export default App;
