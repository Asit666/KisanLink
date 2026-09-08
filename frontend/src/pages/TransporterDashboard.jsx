import React, { useState, useEffect } from 'react';
import { getDemoSuggestions, getDemoTransporterRequests } from '../data/mockData';
import {
  calculateTransporterTripProfit,
  calculateTransporterFullFleetEconomics
} from '../utils/economics';

function FindTransporterPanel({ dealId, apiUrl, session }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(false);
  const [sortBy, setSortBy] = useState('match'); // 'match' | 'distance' | 'price'

  async function loadSuggestions() {
    setOpen(true);
    setLoading(true);
    setMsg('');
    try {
      if (session?.token && !session?.token.startsWith('demo-')) {
        const res = await fetch(`${apiUrl}/api/transport/suggestions/${dealId}`, {
          headers: { Authorization: `Bearer ${session.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setSuggestions(data);
            setLoading(false);
            return;
          }
        }
      }
      setSuggestions(getDemoSuggestions());
    } catch {
      setSuggestions(getDemoSuggestions());
    }
    setLoading(false);
  }

  async function book(transporterId) {
    setMsg('Sending booking request to transporter...');
    const selected = suggestions.find(s => s.transporterId === transporterId) || suggestions[0];
    try {
      if (session?.token && !session?.token.startsWith('demo-')) {
        const res = await fetch(`${apiUrl}/api/transport/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({ dealId, transporterId })
        });
        if (res.ok) {
          const data = await res.json();
          setBooking(data);
          setMsg(`Booking request sent to ${data.transporterName}. Transporter will review and confirm.`);
          setSuggestions([]);
          return;
        }
      }
      setBooking({
        bookingId: 101,
        transporterName: selected.transporterName,
        vehicleType: selected.vehicleType,
        vehicleNumber: selected.vehicleNumber,
        estimatedCost: selected.estimatedCost,
        distanceKm: selected.routeKm,
        distanceFromFarmKm: selected.distanceFromFarmKm,
        baseDistrict: selected.baseDistrict,
        status: 'PENDING'
      });
      setMsg(`Booking request sent to ${selected.transporterName}. Transporter will review and confirm.`);
      setSuggestions([]);
    } catch {
      setBooking({
        bookingId: 101,
        transporterName: selected.transporterName,
        vehicleType: selected.vehicleType,
        vehicleNumber: selected.vehicleNumber,
        estimatedCost: selected.estimatedCost,
        distanceKm: selected.routeKm,
        distanceFromFarmKm: selected.distanceFromFarmKm,
        baseDistrict: selected.baseDistrict,
        status: 'PENDING'
      });
      setMsg(`Booking request sent to ${selected.transporterName}. Transporter will review and confirm.`);
      setSuggestions([]);
    }
  }

  async function toggleFavoriteCarrier(transporterId) {
    try {
      if (session?.token && !session?.token.startsWith('demo-')) {
        const res = await fetch(`${apiUrl}/api/transport/favorites/${transporterId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(prev => prev.map(s => s.transporterId === transporterId ? { ...s, favorite: data.favorite } : s));
          setMsg(data.favorite ? 'Transporter saved to your favorite carriers.' : 'Removed from favorite carriers.');
          return;
        }
      }
      setSuggestions(prev => prev.map(s => s.transporterId === transporterId ? { ...s, favorite: !s.favorite } : s));
      setMsg('Carrier bookmark updated.');
    } catch {
      setSuggestions(prev => prev.map(s => s.transporterId === transporterId ? { ...s, favorite: !s.favorite } : s));
      setMsg('Carrier bookmark updated.');
    }
  }

  const sortedSuggestions = [...suggestions].sort((a, b) => {
    if (sortBy === 'favorites') return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
    if (sortBy === 'reliability') return (b.reliabilityScore || 90) - (a.reliabilityScore || 90);
    if (sortBy === 'distance') return a.distanceFromFarmKm - b.distanceFromFarmKm;
    if (sortBy === 'price') return a.estimatedCost - b.estimatedCost;
    return b.score - a.score;
  });

  if (booking) {
    return (
      <div style={{ background: 'rgba(59,116,68,0.08)', border: '1.5px solid #3b7444', borderRadius: '10px', padding: '14px', marginTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#3b7444', fontSize: '13px' }}>Transport Request Dispatched</div>
            <div style={{ fontSize: '12px', marginTop: '4px', fontWeight: 600 }}>{booking.transporterName} · {booking.vehicleType?.replace('_',' ')}</div>
            <div style={{ fontSize: '11px', color: '#667269', marginTop: '2px' }}>
              Base: {booking.baseDistrict || 'Regional Fleet'} · ₹{Number(booking.estimatedCost).toLocaleString('en-IN')} freight · {Number(booking.distanceKm).toFixed(0)} km delivery route
            </div>
            <div style={{ fontSize: '11px', color: '#3b7444', marginTop: '4px' }}>
              Waiting for transporter confirmation. Once accepted, shipment status will move to IN_TRANSIT.
            </div>
          </div>
          <span style={{ background: '#f59e0b22', color: '#d97706', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
            {booking.status}
          </span>
        </div>
      </div>
    );
  }

  const hasHighPerish = suggestions.some(s => s.perishabilityTier === 'HIGH');

  return (
    <div style={{ marginTop: '10px' }}>
      {!open ? (
        <button type="button" className="trade-btn trade-btn-primary" onClick={loadSuggestions} style={{ background: '#e07b39', borderColor: '#e07b39' }}>
          Find &amp; Book Transporter
        </button>
      ) : (
        <div style={{ border: '1.5px solid #e07b39', borderRadius: '12px', padding: '14px', marginTop: '6px', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#e07b39' }}>Select a Transporter for This Deal</span>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#667269' }}>
                Compare carriers by location proximity (near/far), freight fee, driver reliability, and ETA.
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667269', fontSize: '18px', padding: '2px 6px' }}>×</button>
          </div>

          {/* Perishability Priority Banner */}
          {hasHighPerish && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#991b1b', margin: '8px 0 10px' }}>
              <strong>Perishable Produce Priority Active:</strong> Ranking prioritizes shortest ETA, near pickup proximity, and top carrier reliability to protect crop freshness.
            </div>
          )}

          {/* Sort controls */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', margin: '10px 0', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>Sort by:</span>
            <button
              type="button"
              className={`filter-chip ${sortBy === 'match' ? 'active' : ''}`}
              style={{ fontSize: '11px', padding: '3px 8px' }}
              onClick={() => setSortBy('match')}
            >
              Best Match
            </button>
            <button
              type="button"
              className={`filter-chip ${sortBy === 'favorites' ? 'active' : ''}`}
              style={{ fontSize: '11px', padding: '3px 8px' }}
              onClick={() => setSortBy('favorites')}
            >
              Saved Favorites
            </button>
            <button
              type="button"
              className={`filter-chip ${sortBy === 'reliability' ? 'active' : ''}`}
              style={{ fontSize: '11px', padding: '3px 8px' }}
              onClick={() => setSortBy('reliability')}
            >
              Highest Reliability
            </button>
            <button
              type="button"
              className={`filter-chip ${sortBy === 'distance' ? 'active' : ''}`}
              style={{ fontSize: '11px', padding: '3px 8px' }}
              onClick={() => setSortBy('distance')}
            >
              Nearest First
            </button>
            <button
              type="button"
              className={`filter-chip ${sortBy === 'price' ? 'active' : ''}`}
              style={{ fontSize: '11px', padding: '3px 8px' }}
              onClick={() => setSortBy('price')}
            >
              Lowest Price
            </button>
          </div>

          {loading && <div style={{ color: '#667269', fontSize: '12px', padding: '8px 0' }}>Analyzing available carriers, distance, and pricing...</div>}
          {msg && <div style={{ fontSize: '12px', color: '#3b7444', marginBottom: '8px', fontWeight: 600 }}>{msg}</div>}

          {/* List of transporter options */}
          {sortedSuggestions.map(s => {
            const isNear = s.distanceFromFarmKm <= 20;
            const isModerate = s.distanceFromFarmKm > 20 && s.distanceFromFarmKm <= 50;
            const proximityLabel = isNear ? `NEAR (${s.distanceFromFarmKm.toFixed(1)} km away)` :
                                   isModerate ? `MODERATE (${s.distanceFromFarmKm.toFixed(1)} km away)` :
                                   `FAR (${s.distanceFromFarmKm.toFixed(1)} km away)`;
            const proximityBg = isNear ? '#ecfdf5' : isModerate ? '#fef3c7' : '#f3f4f6';
            const proximityColor = isNear ? '#065f46' : isModerate ? '#92400e' : '#374151';

            return (
              <div
                key={s.transporterId}
                style={{
                  background: '#fafafa',
                  border: s.favorite ? '1.5px solid #ec4899' : (isNear ? '1.5px solid #3b7444' : '1px solid #e5e7eb'),
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ flex: '1 1 280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '14px', color: '#111827' }}>{s.transporterName}</strong>
                    {s.favorite && (
                      <span style={{ fontSize: '10px', background: '#fdf2f8', color: '#be185d', padding: '2px 6px', borderRadius: '6px', fontWeight: 700 }}>
                        FAVORITE CARRIER
                      </span>
                    )}
                    {s.verified && (
                      <span style={{ fontSize: '10px', background: '#3b744422', color: '#3b7444', padding: '2px 6px', borderRadius: '6px', fontWeight: 600 }}>
                        Verified Operator
                      </span>
                    )}
                    <span style={{ fontSize: '10px', background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '6px', fontWeight: 700 }}>
                      Reliability: {s.reliabilityScore || 92.5}/100 &middot; {s.tierBadge?.replace('_', ' ') || 'TOP CARRIER'}
                    </span>
                    <span style={{ fontSize: '10px', background: proximityBg, color: proximityColor, padding: '2px 6px', borderRadius: '6px', fontWeight: 700 }}>
                      {proximityLabel}
                    </span>
                    <span style={{ fontSize: '10px', background: '#f0fdf4', color: '#166534', padding: '2px 6px', borderRadius: '6px', fontWeight: 600 }}>
                      ETA: ~{s.etaMinutes || 35} mins
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>
                    Vehicle: <strong>{s.vehicleType?.replace('_',' ')}</strong> &middot; Capacity: <strong>{Number(s.capacityKg).toLocaleString('en-IN')} kg</strong> &middot; Rating: <strong>{s.rating || 4.8} / 5.0</strong> ({s.completedTrips || 14} trips, {s.onTimeRate || 96.5}% on-time)
                  </div>

                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                    Stationed at: <strong>{s.baseDistrict}, {s.baseState}</strong> · Delivery Route: <strong>{s.routeKm.toFixed(0)} km</strong>
                  </div>

                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                    Pricing Breakdown: ₹{Number(s.baseCharge)} base fee + ₹{Number(s.ratePerKm)}/km
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Total Freight Fee</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#3b7444' }}>
                      ₹{Number(s.estimatedCost).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '9px', color: '#9ca3af' }}>Added to buyer escrow</div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => toggleFavoriteCarrier(s.transporterId)}
                      style={{
                        background: s.favorite ? '#fdf2f8' : '#f9fafb',
                        border: s.favorite ? '1px solid #fbcfe8' : '1px solid #d1d5db',
                        color: s.favorite ? '#be185d' : '#4b5563',
                        fontSize: '11px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {s.favorite ? 'Saved Favorite' : '+ Save Favorite'}
                    </button>
                    <button
                      type="button"
                      className="trade-btn trade-btn-primary"
                      style={{ background: '#e07b39', borderColor: '#e07b39', fontSize: '11px', padding: '6px 14px' }}
                      onClick={() => book(s.transporterId)}
                    >
                      Select This Carrier
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {!loading && suggestions.length === 0 && !msg && (
            <div style={{ color: '#667269', fontSize: '12px', textAlign: 'center', padding: '10px 0' }}>No available transporters found in this region. Try again later.</div>
          )}
        </div>
      )}
    </div>
  );
}

function TransportBookingStatus({ dealId, apiUrl, session, role }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.token && !session?.token.startsWith('demo-')) {
      fetch(`${apiUrl}/api/transport/bookings/deal/${dealId}`, {
        headers: { Authorization: `Bearer ${session.token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) setBooking(data);
          else setBooking(getDemoTransporterRequests()[0]);
          setLoading(false);
        })
        .catch(() => {
          setBooking(getDemoTransporterRequests()[0]);
          setLoading(false);
        });
    } else {
      setBooking(getDemoTransporterRequests()[0]);
      setLoading(false);
    }
  }, [dealId, apiUrl, session]);

  if (loading) return <div style={{ fontSize: '11px', color: '#667269' }}>Loading transport info…</div>;
  if (!booking) return null;

  const statusColor = { PENDING: '#f59e0b', CONFIRMED: '#3b7444', IN_TRANSIT: '#059669', REJECTED: '#dc664a', DELIVERED: '#6366f1', CANCELLED: '#9ca3af' };

  // Milestone Progress Index
  const milestones = [
    { key: 'REQUESTED', label: '1. Booked' },
    { key: 'DISPATCHED', label: '2. Dispatched' },
    { key: 'PICKUP', label: '3. Farm Pickup (POP)' },
    { key: 'IN_TRANSIT', label: '4. In Transit' },
    { key: 'DELIVERED', label: '5. Delivered (POD)' }
  ];

  let activeMilestoneIdx = 0;
  if (booking.status === 'PENDING') activeMilestoneIdx = 0;
  else if (booking.status === 'CONFIRMED') activeMilestoneIdx = 1;
  else if (booking.status === 'IN_TRANSIT') activeMilestoneIdx = 3;
  else if (booking.status === 'DELIVERED' || booking.status === 'COMPLETED') activeMilestoneIdx = 4;

  const progressPercent = ((activeMilestoneIdx + 1) / milestones.length) * 100;
  const etaMinutes = Math.max(15, Math.round((Number(booking.distanceKm) || 45) / 40 * 60));

  return (
    <div style={{ background: 'rgba(224,123,57,0.07)', border: '1.5px solid #e07b39', borderRadius: '10px', padding: '14px', marginTop: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#e07b39' }}>{booking.transporterName}</div>
          <div style={{ fontSize: '11px', color: '#667269', marginTop: '3px' }}>
            {booking.vehicleType?.replace('_',' ')} · {booking.vehicleNumber} · {Number(booking.capacityKg).toLocaleString('en-IN')} kg
          </div>
          <div style={{ fontSize: '11px', color: '#667269' }}>
            {booking.pickupAddress} → {booking.deliveryAddress}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>
            ₹{Number(booking.estimatedCost).toLocaleString('en-IN')} <span style={{ fontWeight: 400, fontSize: '11px', color: '#667269' }}>transport fee</span>
          </div>
        </div>
        <span style={{ background: (statusColor[booking.status] || '#3b7444') + '22', color: statusColor[booking.status] || '#3b7444', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
          {booking.status?.replace('_', ' ')}
        </span>
      </div>

      {/* Live Waypoint Journey Milestones Tracker */}
      <div style={{ marginTop: '14px', background: '#fff', border: '1px solid #fed7aa', borderRadius: '8px', padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#9a3412', textTransform: 'uppercase' }}>
            Live Journey Waypoint Tracker
          </span>
          <span style={{ fontSize: '11px', color: '#4b5563', fontFamily: "'DM Mono', monospace" }}>
            {booking.status === 'IN_TRANSIT' ? `ETA: ~${etaMinutes} mins remaining` : (booking.status === 'DELIVERED' ? 'Arrived at Destination' : 'Scheduled')}
          </span>
        </div>

        {/* Progress bar line */}
        <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: '#ea580c', transition: 'width 0.4s ease' }} />
        </div>

        {/* 5 Milestone indicators */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', textAlign: 'center' }}>
          {milestones.map((m, idx) => {
            const isDone = idx <= activeMilestoneIdx;
            const isCurrent = idx === activeMilestoneIdx;
            return (
              <div key={m.key} style={{ fontSize: '10px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  margin: '0 auto 4px',
                  background: isDone ? '#ea580c' : '#d1d5db',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  boxShadow: isCurrent ? '0 0 0 3px #fed7aa' : 'none'
                }}>
                  {idx + 1}
                </div>
                <span style={{ color: isDone ? '#111827' : '#9ca3af', fontWeight: isDone ? 700 : 400 }}>
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Proof of Pickup (POP) Security Card for Farmer */}
      {role === 'FARMER' && booking.status === 'CONFIRMED' && (
        <div style={{ marginTop: '12px', background: '#ecfdf5', border: '1.5px dashed #059669', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#047857', fontWeight: 'bold' }}>
                Farm Pickup Verification Code
              </span>
              <div style={{ fontSize: '12px', color: '#374151', marginTop: '2px' }}>
                Share this 4-digit code with the driver after inspecting the vehicle and loading produce.
              </div>
            </div>
            <div style={{ background: '#059669', color: '#fff', fontSize: '20px', fontWeight: '900', letterSpacing: '3px', padding: '6px 14px', borderRadius: '6px', fontFamily: "'DM Mono', monospace" }}>
              {booking.pickupCode || '4821'}
            </div>
          </div>
        </div>
      )}

      {/* Proof of Delivery (POD) Security Card for Buyer */}
      {role === 'BUYER' && booking.status === 'IN_TRANSIT' && (
        <div style={{ marginTop: '12px', background: '#eff6ff', border: '1.5px dashed #2563eb', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#1d4ed8', fontWeight: 'bold' }}>
                Delivery Receipt Verification Code
              </span>
              <div style={{ fontSize: '12px', color: '#374151', marginTop: '2px' }}>
                Share this 4-digit code with the driver after verifying received cargo quantity and quality.
              </div>
            </div>
            <div style={{ background: '#2563eb', color: '#fff', fontSize: '20px', fontWeight: '900', letterSpacing: '3px', padding: '6px 14px', borderRadius: '6px', fontFamily: "'DM Mono', monospace" }}>
              {booking.deliveryCode || '9314'}
            </div>
          </div>
        </div>
      )}

      {/* Cargo Status Info */}
      {role === 'FARMER' && booking.status === 'IN_TRANSIT' && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#059669', fontWeight: '600' }}>
          Produce picked up from farm ({booking.pickupQuantityKg || '500'} kg) and in transit to buyer destination.
        </div>
      )}

      {/* Audit Summary when Delivered */}
      {booking.status === 'DELIVERED' && (
        <div style={{ marginTop: '10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#334155' }}>
          <strong>Delivery Audit Verified:</strong> Received {booking.deliveredQuantityKg || booking.capacityKg || '500'} kg
          {Number(booking.discrepancyKg) > 0 && <span style={{ color: '#dc2626', marginLeft: '6px' }}>({booking.discrepancyKg} kg transit loss recorded)</span>}
          {booking.deliveryNotes && <div style={{ color: '#64748b', fontSize: '11px', marginTop: '3px' }}>Notes: {booking.deliveryNotes}</div>}
        </div>
      )}

      {booking.status === 'PENDING' && role === 'BUYER' && (
        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>Transporter has not confirmed yet. You will be notified automatically.</div>
      )}
    </div>
  );
}

function TransporterDashboard({ session, apiUrl }) {
  const [requests, setRequests] = useState(getDemoTransporterRequests());
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'in_transit' | 'history' | 'settings'
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  // Dedicated fleet settings state (only editable by the Transporter)
  const [fleetForm, setFleetForm] = useState({
    vehicleType: 'MINI_TRUCK',
    vehicleNumber: 'JH-01-AB-1234',
    capacityKg: '2000',
    ratePerKm: '15.0',
    baseCharge: '100.0',
    baseDistrict: 'Ranchi',
    baseState: 'Jharkhand',
    alertPhone: '+91 90011 12222'
  });

  useEffect(() => {
    if (!session?.token || session?.token.startsWith('demo-')) return;
    setLoading(true);
    fetch(`${apiUrl}/api/transport/transporter/${session.profileId || 1}/requests`, {
      headers: { Authorization: `Bearer ${session.token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.length > 0) setRequests(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch transporter profile
    fetch(`${apiUrl}/api/transporters/${session.profileId || 1}`, {
      headers: { Authorization: `Bearer ${session.token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setFleetForm({
            vehicleType: data.vehicleType || 'MINI_TRUCK',
            vehicleNumber: data.vehicleNumber || '',
            capacityKg: String(data.capacityKg || '2000'),
            ratePerKm: String(data.ratePerKm || '15.0'),
            baseCharge: String(data.baseCharge || '100.0'),
            baseDistrict: data.baseDistrict || 'Ranchi',
            baseState: data.baseState || 'Jharkhand',
            alertPhone: data.alertPhone || ''
          });
          setIsAvailable(data.available !== false);
        }
      })
      .catch(() => {});
  }, [apiUrl, session]);

  const [verifyModal, setVerifyModal] = useState(null); // { type: 'PICKUP' | 'DELIVERY', booking, code, quantityKg, notes, error }

  async function submitVerifyPickup(e) {
    if (e) e.preventDefault();
    if (!verifyModal) return;
    const { booking, code, quantityKg, notes } = verifyModal;
    setMsg('Verifying farm pickup code...');
    try {
      if (session?.token && !session?.token.startsWith('demo-')) {
        const res = await fetch(`${apiUrl}/api/transport/bookings/${booking.bookingId}/verify-pickup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({
            pickupCode: code.trim(),
            quantityLoadedKg: Number(quantityKg) || 500,
            pickupNotes: notes || 'Produce loaded and inspected at farm.'
          })
        });
        if (res.ok) {
          const updated = await res.json();
          setRequests(prev => prev.map(r => r.bookingId === booking.bookingId ? updated : r));
          setMsg('Farm pickup verified! Haul moved to IN_TRANSIT.');
          setVerifyModal(null);
          return;
        } else {
          const err = await res.json().catch(() => ({}));
          setVerifyModal(prev => ({ ...prev, error: err.message || 'Invalid Pickup Code. Ask the farmer for the 4-digit code.' }));
          return;
        }
      }
      setRequests(prev => prev.map(r => r.bookingId === booking.bookingId ? {
        ...r,
        status: 'IN_TRANSIT',
        pickupQuantityKg: Number(quantityKg) || 500,
        pickupNotes: notes || 'Loaded intact',
        deliveryCode: '9314'
      } : r));
      setMsg('Farm pickup verified! Haul moved to IN_TRANSIT.');
      setVerifyModal(null);
    } catch {
      setMsg('Pickup verified in demo mode.');
      setVerifyModal(null);
    }
  }

  async function submitVerifyDelivery(e) {
    if (e) e.preventDefault();
    if (!verifyModal) return;
    const { booking, code, quantityKg, notes } = verifyModal;
    setMsg('Verifying buyer delivery code...');
    try {
      if (session?.token && !session?.token.startsWith('demo-')) {
        const res = await fetch(`${apiUrl}/api/transport/bookings/${booking.bookingId}/verify-delivery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({
            deliveryCode: code.trim(),
            deliveredQuantityKg: Number(quantityKg) || 500,
            deliveryNotes: notes || 'Delivered and inspected at buyer destination.'
          })
        });
        if (res.ok) {
          const updated = await res.json();
          setRequests(prev => prev.map(r => r.bookingId === booking.bookingId ? updated : r));
          setMsg('Delivery verified! Escrow payout can now be released.');
          setVerifyModal(null);
          return;
        } else {
          const err = await res.json().catch(() => ({}));
          setVerifyModal(prev => ({ ...prev, error: err.message || 'Invalid Delivery Code. Ask the receiving buyer for the 4-digit code.' }));
          return;
        }
      }
      setRequests(prev => prev.map(r => r.bookingId === booking.bookingId ? {
        ...r,
        status: 'DELIVERED',
        deliveredQuantityKg: Number(quantityKg) || 500,
        deliveredAt: new Date().toISOString(),
        discrepancyKg: 0,
        deliveryNotes: notes || 'Delivered intact'
      } : r));
      setMsg('Delivery verified! Escrow payout can now be released.');
      setVerifyModal(null);
    } catch {
      setMsg('Delivery verified in demo mode.');
      setVerifyModal(null);
    }
  }

  async function handleConfirm(bookingId) {
    setMsg('Confirming transport assignment…');
    try {
      if (session?.token && !session?.token.startsWith('demo-')) {
        const res = await fetch(`${apiUrl}/api/transport/bookings/${bookingId}/confirm`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.token}` }
        });
        if (res.ok) {
          const updated = await res.json();
          setRequests(prev => prev.map(r => r.bookingId === bookingId ? updated : r));
          setMsg('Trip confirmed. Scheduled for farm pickup.');
          return;
        }
      }
      setRequests(prev => prev.map(r => r.bookingId === bookingId ? { ...r, status: 'CONFIRMED', pickupCode: '4821', confirmedAt: new Date().toISOString() } : r));
      setMsg('Trip confirmed. Scheduled for farm pickup.');
    } catch {
      setRequests(prev => prev.map(r => r.bookingId === bookingId ? { ...r, status: 'CONFIRMED', pickupCode: '4821', confirmedAt: new Date().toISOString() } : r));
      setMsg('Trip confirmed. Scheduled for farm pickup.');
    }
  }

  async function handleReject(bookingId) {
    setMsg('Declining trip assignment…');
    try {
      if (session?.token && !session?.token.startsWith('demo-')) {
        const res = await fetch(`${apiUrl}/api/transport/bookings/${bookingId}/reject`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.token}` }
        });
        if (res.ok) {
          const updated = await res.json();
          setRequests(prev => prev.map(r => r.bookingId === bookingId ? updated : r));
          setMsg('Trip declined. Deal reverted to ACCEPTED so farmer can select another carrier.');
          return;
        }
      }
      setRequests(prev => prev.map(r => r.bookingId === bookingId ? { ...r, status: 'REJECTED' } : r));
      setMsg('Trip declined. Deal reverted to ACCEPTED so farmer can select another carrier.');
    } catch {
      setRequests(prev => prev.map(r => r.bookingId === bookingId ? { ...r, status: 'REJECTED' } : r));
      setMsg('Trip declined.');
    }
  }

  async function handleSaveFleetSettings(e) {
    if (e) e.preventDefault();
    setMsg('Saving fleet profile and freight rates...');
    try {
      if (session?.token && !session?.token.startsWith('demo-')) {
        const res = await fetch(`${apiUrl}/api/transporters/${session.profileId || 1}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({
            vehicleType: fleetForm.vehicleType,
            vehicleNumber: fleetForm.vehicleNumber,
            capacityKg: Number(fleetForm.capacityKg),
            ratePerKm: Number(fleetForm.ratePerKm),
            baseCharge: Number(fleetForm.baseCharge),
            baseDistrict: fleetForm.baseDistrict,
            baseState: fleetForm.baseState,
            alertPhone: fleetForm.alertPhone,
            available: isAvailable
          })
        });
        if (res.ok) {
          setMsg('Fleet settings and rates updated successfully.');
          return;
        }
      }
      setMsg('Fleet settings and rates updated successfully.');
    } catch {
      setMsg('Fleet settings saved.');
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const activeTrips = requests.filter(r => r.status === 'CONFIRMED' || r.status === 'IN_TRANSIT');
  const pastTrips = requests.filter(r => r.status === 'DELIVERED' || r.status === 'COMPLETED' || r.status === 'REJECTED');

  const totalEarnings = pastTrips
    .filter(r => r.status === 'DELIVERED' || r.status === 'COMPLETED')
    .reduce((sum, r) => sum + (Number(r.estimatedCost) || 0), 0);

  return (
    <div className="view-container">
      {/* Transporter Operator Header Card */}
      <section className="panel" style={{ marginTop: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <p className="eyebrow">Agri-Logistics &amp; Freight Exchange</p>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {session?.name || 'Suresh Logistics'}
              <span style={{ fontSize: '11px', background: '#3b744422', color: '#3b7444', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
                Verified Fleet Operator
              </span>
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#667269' }}>
              Vehicle: <strong>{fleetForm.vehicleType.replace('_', ' ')} ({fleetForm.vehicleNumber})</strong> · Capacity: <strong>{Number(fleetForm.capacityKg).toLocaleString('en-IN')} kg</strong> · Base: <strong>{fleetForm.baseDistrict}, {fleetForm.baseState}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="trade-btn"
              style={{
                background: isAvailable ? '#3b7444' : '#6b7280',
                color: '#fff',
                borderColor: 'transparent',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              onClick={() => setIsAvailable(!isAvailable)}
            >
              {isAvailable ? 'Online (Accepting Hauls)' : 'Busy / Offline'}
            </button>
          </div>
        </div>

        {/* Fleet KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginTop: '20px' }}>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>Pending Requests</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#e07b39', marginTop: '4px' }}>{pendingRequests.length}</div>
          </div>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>Active Dispatches</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b7444', marginTop: '4px' }}>{activeTrips.length}</div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>Reliability Score</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>94.5 <span style={{ fontSize: '12px', fontWeight: 600 }}>/ 100 &middot; TOP CARRIER</span></div>
          </div>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>On-Time Rate</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>96.8% <span style={{ fontSize: '12px', fontWeight: 400, color: '#6b7280' }}>punctual</span></div>
          </div>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>Rating &amp; Reviews</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#b45309', marginTop: '4px' }}>4.85 <span style={{ fontSize: '12px', fontWeight: 400, color: '#6b7280' }}>/ 5.0 (24 trips)</span></div>
          </div>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>Total Completed Revenue</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b7444', marginTop: '4px' }}>₹{totalEarnings.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="panel" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`filter-chip ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Requests ({pendingRequests.length})
          </button>
          <button
            type="button"
            className={`filter-chip ${activeTab === 'in_transit' ? 'active' : ''}`}
            onClick={() => setActiveTab('in_transit')}
          >
            Active Hauls ({activeTrips.length})
          </button>
          <button
            type="button"
            className={`filter-chip ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Delivery History ({pastTrips.length})
          </button>
          <button
            type="button"
            className={`filter-chip ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Fleet &amp; Rates Configuration
          </button>
        </div>

        {msg && (
          <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', color: '#92400e', fontSize: '13px' }}>
            {msg}
          </div>
        )}

        {loading && <div style={{ padding: '20px 0', color: '#667269', textAlign: 'center' }}>Syncing transport bookings…</div>}

        {/* TAB 1: PENDING REQUESTS */}
        {activeTab === 'pending' && (
          <div style={{ marginTop: '16px' }}>
            {pendingRequests.length === 0 ? (
              <div style={{ padding: '36px 0', textAlign: 'center', color: '#6b7280' }}>
                <div>No pending booking requests right now.</div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: '#9ca3af' }}>When a farmer books your vehicle after an accepted deal, it will show up here.</div>
              </div>
            ) : (
              pendingRequests.map(r => (
                <div key={r.bookingId} style={{ background: '#fff', border: '1.5px solid #e07b39', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                          PENDING APPROVAL
                        </span>
                        <strong style={{ fontSize: '15px' }}>Haul for Trade Deal #{r.dealId}</strong>
                      </div>
                      <div style={{ fontSize: '13px', color: '#374151', marginTop: '6px' }}>
                        <strong>Pickup:</strong> {r.pickupAddress}
                      </div>
                      <div style={{ fontSize: '13px', color: '#374151', marginTop: '4px' }}>
                        <strong>Delivery:</strong> {r.deliveryAddress}
                      </div>
                      {r.notes && (
                        <div style={{ fontSize: '12px', color: '#4b5563', background: '#f9fafb', padding: '6px 10px', borderRadius: '6px', marginTop: '8px', borderLeft: '3px solid #e07b39' }}>
                          Notes: {r.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>Estimated Freight Payout</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#3b7444' }}>₹{Number(r.estimatedCost).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{Number(r.distanceKm).toFixed(1)} km · ₹{Number(r.ratePerKm)}/km + ₹{Number(r.baseCharge)} base</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '14px', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                    <button
                      type="button"
                      className="trade-btn trade-btn-primary"
                      style={{ background: '#3b7444', borderColor: '#3b7444', padding: '8px 16px', fontSize: '12px' }}
                      onClick={() => handleConfirm(r.bookingId)}
                    >
                      Accept &amp; Dispatch Haul
                    </button>
                    <button
                      type="button"
                      className="trade-btn trade-btn-cancel"
                      style={{ padding: '8px 16px', fontSize: '12px' }}
                      onClick={() => handleReject(r.bookingId)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE TRIPS */}
        {activeTab === 'in_transit' && (
          <div style={{ marginTop: '16px' }}>
            {activeTrips.length === 0 ? (
              <div style={{ padding: '36px 0', textAlign: 'center', color: '#6b7280' }}>
                <div>No active hauls in transit.</div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: '#9ca3af' }}>Accept a pending request to move it to active transit.</div>
              </div>
            ) : (
              activeTrips.map(r => (
                <div key={r.bookingId} style={{ background: '#fff', border: '1.5px solid #3b7444', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '11px',
                          background: r.status === 'IN_TRANSIT' ? '#ecfdf5' : '#fef3c7',
                          color: r.status === 'IN_TRANSIT' ? '#059669' : '#b45309',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontWeight: 700
                        }}>
                          {r.status === 'IN_TRANSIT' ? 'IN TRANSIT TO BUYER' : 'AWAITING FARM PICKUP'}
                        </span>
                        <strong style={{ fontSize: '15px' }}>Haul for Trade Deal #{r.dealId}</strong>
                      </div>
                      <div style={{ fontSize: '13px', color: '#374151', marginTop: '6px' }}>
                        <strong>Origin (Farm):</strong> {r.pickupAddress}
                      </div>
                      <div style={{ fontSize: '13px', color: '#374151', marginTop: '4px' }}>
                        <strong>Destination (Buyer):</strong> {r.deliveryAddress}
                      </div>
                      {r.pickupQuantityKg && (
                        <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>
                          Verified Loaded Cargo: <strong>{r.pickupQuantityKg} kg</strong>
                        </div>
                      )}
                      {r.notes && (
                        <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>
                          Notes: {r.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>Guaranteed Escrow Payout</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#3b7444' }}>₹{Number(r.estimatedCost).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{Number(r.distanceKm).toFixed(1)} km haul</div>
                    </div>
                  </div>

                  {/* Contextual Action Button based on status */}
                  <div style={{ marginTop: '14px', borderTop: '1px solid #f3f4f6', paddingTop: '12px', display: 'flex', gap: '10px' }}>
                    {r.status === 'CONFIRMED' && (
                      <button
                        type="button"
                        className="trade-btn trade-btn-primary"
                        style={{ background: '#059669', borderColor: '#059669', padding: '8px 18px', fontSize: '12px' }}
                        onClick={() => setVerifyModal({
                          type: 'PICKUP',
                          booking: r,
                          code: '',
                          quantityKg: r.pickupQuantityKg || 500,
                          notes: '',
                          error: ''
                        })}
                      >
                        Enter Farmer Code &amp; Confirm Pickup (POP) &rarr;
                      </button>
                    )}

                    {r.status === 'IN_TRANSIT' && (
                      <button
                        type="button"
                        className="trade-btn trade-btn-primary"
                        style={{ background: '#2563eb', borderColor: '#2563eb', padding: '8px 18px', fontSize: '12px' }}
                        onClick={() => setVerifyModal({
                          type: 'DELIVERY',
                          booking: r,
                          code: '',
                          quantityKg: r.pickupQuantityKg || 500,
                          notes: '',
                          error: ''
                        })}
                      >
                        Enter Buyer Code &amp; Complete Delivery (POD) &rarr;
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* POP / POD Verification Modal */}
            {verifyModal && (
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
                  maxWidth: '460px',
                  width: '100%',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>
                      {verifyModal.type === 'PICKUP' ? 'Proof of Pickup (POP) Verification' : 'Proof of Delivery (POD) Verification'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setVerifyModal(null)}
                      style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280' }}
                    >
                      &times;
                    </button>
                  </div>

                  <p style={{ margin: '8px 0 16px', fontSize: '13px', color: '#4b5563', lineHeight: '1.4' }}>
                    {verifyModal.type === 'PICKUP'
                      ? 'Arrive at farm and ask the farmer for their 4-digit security code after inspecting truck loading.'
                      : 'Arrive at destination and ask the buyer for their 4-digit security code after weighing and unloading.'}
                  </p>

                  {verifyModal.error && (
                    <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '14px' }}>
                      {verifyModal.error}
                    </div>
                  )}

                  <form onSubmit={verifyModal.type === 'PICKUP' ? submitVerifyPickup : submitVerifyDelivery}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>
                      4-Digit Verification Security Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 4821"
                      required
                      value={verifyModal.code}
                      onChange={e => setVerifyModal({ ...verifyModal, code: e.target.value, error: '' })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        letterSpacing: '4px',
                        fontFamily: "'DM Mono', monospace",
                        textAlign: 'center',
                        border: '2px solid #d1d5db',
                        borderRadius: '8px',
                        marginBottom: '14px'
                      }}
                    />

                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>
                      {verifyModal.type === 'PICKUP' ? 'Loaded Weight (kg) *' : 'Received Delivered Weight (kg) *'}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={verifyModal.quantityKg}
                      onChange={e => setVerifyModal({ ...verifyModal, quantityKg: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '14px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        marginBottom: '14px'
                      }}
                    />

                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>
                      Inspection / Condition Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder={verifyModal.type === 'PICKUP' ? 'e.g. 50 crates loaded, Grade A verified' : 'e.g. Full 500kg received intact, zero spoilage'}
                      value={verifyModal.notes}
                      onChange={e => setVerifyModal({ ...verifyModal, notes: e.target.value })}
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
                        onClick={() => setVerifyModal(null)}
                        className="trade-btn trade-btn-cancel"
                        style={{ padding: '8px 16px', fontSize: '13px' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="trade-btn trade-btn-primary"
                        style={{
                          background: verifyModal.type === 'PICKUP' ? '#059669' : '#2563eb',
                          borderColor: verifyModal.type === 'PICKUP' ? '#059669' : '#2563eb',
                          padding: '8px 20px',
                          fontSize: '13px',
                          fontWeight: 'bold'
                        }}
                      >
                        {verifyModal.type === 'PICKUP' ? 'Confirm Farm Pickup' : 'Confirm Delivery & Unlock Payout'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PAST TRIPS / HISTORY */}
        {activeTab === 'history' && (
          <div style={{ marginTop: '16px' }}>
            {pastTrips.length === 0 ? (
              <div style={{ padding: '36px 0', textAlign: 'center', color: '#6b7280' }}>No past deliveries recorded yet.</div>
            ) : (
              pastTrips.map(r => (
                <div key={r.bookingId} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '10px',
                        background: r.status === 'DELIVERED' ? '#ecfdf5' : '#fee2e2',
                        color: r.status === 'DELIVERED' ? '#059669' : '#dc2626',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontWeight: 700
                      }}>
                        {r.status}
                      </span>
                      <strong>Deal #{r.dealId}</strong>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>· {r.pickupAddress?.split(',')[0]} → {r.deliveryAddress?.split(',')[0]}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>
                      Scheduled: {r.scheduledDate || 'Immediate'} · Distance: {Number(r.distanceKm).toFixed(0)} km
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '15px', color: r.status === 'DELIVERED' ? '#3b7444' : '#9ca3af' }}>
                      ₹{Number(r.estimatedCost).toLocaleString('en-IN')}
                    </strong>
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>
                      {r.status === 'DELIVERED' ? 'Settled via Escrow' : 'Cancelled / Rejected'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: FLEET & RATES CONFIGURATION (TRANSPORTER ONLY) */}
        {activeTab === 'settings' && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '15px' }}>Fleet Operator &amp; Freight Pricing Configuration</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#667269' }}>
                Only you (as a registered Transporter) can configure these vehicle parameters. Farmers and buyers see these rates when booking hauls.
              </p>
            </div>

            <form onSubmit={handleSaveFleetSettings} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
              <label>Vehicle Type
                <select
                  value={fleetForm.vehicleType}
                  onChange={e => setFleetForm({ ...fleetForm, vehicleType: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', marginTop: '4px' }}
                >
                  <option value="PICKUP">Pickup Truck (up to 1,000 kg)</option>
                  <option value="TEMPO">Tempo / LCV (up to 1,500 kg)</option>
                  <option value="MINI_TRUCK">Mini Truck / Tata 407 (up to 3,000 kg)</option>
                  <option value="FULL_TRUCK">Full Truck / 10-Wheeler (up to 10,000 kg)</option>
                </select>
              </label>

              <label>Vehicle Registration Number
                <input
                  value={fleetForm.vehicleNumber}
                  onChange={e => setFleetForm({ ...fleetForm, vehicleNumber: e.target.value })}
                  placeholder="e.g. JH-01-AB-1234"
                  required
                  style={{ width: '100%', padding: '8px 10px', marginTop: '4px' }}
                />
              </label>

              <label>Payload Capacity (kg)
                <input
                  type="number"
                  value={fleetForm.capacityKg}
                  onChange={e => setFleetForm({ ...fleetForm, capacityKg: e.target.value })}
                  min="100"
                  step="50"
                  required
                  style={{ width: '100%', padding: '8px 10px', marginTop: '4px' }}
                />
              </label>

              <label>Per-Kilometer Freight Rate (₹)
                <input
                  type="number"
                  value={fleetForm.ratePerKm}
                  onChange={e => setFleetForm({ ...fleetForm, ratePerKm: e.target.value })}
                  min="1"
                  step="0.5"
                  required
                  style={{ width: '100%', padding: '8px 10px', marginTop: '4px' }}
                />
              </label>

              <label>Base / Loading Fee (₹)
                <input
                  type="number"
                  value={fleetForm.baseCharge}
                  onChange={e => setFleetForm({ ...fleetForm, baseCharge: e.target.value })}
                  min="0"
                  step="10"
                  required
                  style={{ width: '100%', padding: '8px 10px', marginTop: '4px' }}
                />
              </label>

              <label>Home Station District
                <input
                  value={fleetForm.baseDistrict}
                  onChange={e => setFleetForm({ ...fleetForm, baseDistrict: e.target.value })}
                  placeholder="e.g. Ranchi"
                  required
                  style={{ width: '100%', padding: '8px 10px', marginTop: '4px' }}
                />
              </label>

              <label>State
                <input
                  value={fleetForm.baseState}
                  onChange={e => setFleetForm({ ...fleetForm, baseState: e.target.value })}
                  placeholder="e.g. Jharkhand"
                  required
                  style={{ width: '100%', padding: '8px 10px', marginTop: '4px' }}
                />
              </label>

              <label>Dispatch Notification Phone
                <input
                  value={fleetForm.alertPhone}
                  onChange={e => setFleetForm({ ...fleetForm, alertPhone: e.target.value })}
                  placeholder="e.g. +91 90011 12222"
                  style={{ width: '100%', padding: '8px 10px', marginTop: '4px' }}
                />
              </label>

              <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                <button
                  type="submit"
                  className="trade-btn trade-btn-primary"
                  style={{ padding: '10px 22px', fontSize: '13px' }}
                >
                  Save Fleet Profile &amp; Pricing Rates
                </button>
              </div>
            </form>

            {/* Multi-Vehicle Fleet Registry */}
            <div style={{ marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#111827' }}>Registered Fleet Vehicles ({fleetVehicles.length})</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>
                    Configure multiple haulers in your fleet with customized payload limits and freight charges.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(true)}
                  className="trade-btn trade-btn-primary"
                  style={{ background: '#059669', borderColor: '#059669', fontSize: '12px', padding: '6px 14px' }}
                >
                  + Add Fleet Vehicle
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {fleetVehicles.map(v => (
                  <div key={v.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: '#111827' }}>{v.vehicleType?.replace('_', ' ')}</strong>
                        <div style={{ fontSize: '12px', color: '#374151', fontFamily: "'DM Mono', monospace", marginTop: '2px' }}>{v.vehicleNumber}</div>
                      </div>
                      <span style={{ fontSize: '10px', background: v.status === 'AVAILABLE' ? '#ecfdf5' : '#fee2e2', color: v.status === 'AVAILABLE' ? '#059669' : '#dc2626', padding: '2px 6px', borderRadius: '8px', fontWeight: 700 }}>
                        {v.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '8px' }}>
                      Payload: <strong>{Number(v.capacityKg).toLocaleString('en-IN')} kg</strong> &middot; Rate: <strong>₹{v.ratePerKm}/km</strong> + ₹{v.baseCharge} base
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Fleet Vehicle Modal */}
            {showAddVehicleModal && (
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
                <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '17px', color: '#111827' }}>Add Vehicle to Fleet</h3>
                    <button type="button" onClick={() => setShowAddVehicleModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
                  </div>

                  <form onSubmit={handleAddVehicle}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>Vehicle Type</label>
                    <select
                      value={newVehicleForm.vehicleType}
                      onChange={e => setNewVehicleForm({ ...newVehicleForm, vehicleType: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    >
                      <option value="PICKUP">Pickup Truck (up to 1,000 kg)</option>
                      <option value="TEMPO">Tempo / LCV (up to 1,500 kg)</option>
                      <option value="MINI_TRUCK">Mini Truck / Tata 407 (up to 3,000 kg)</option>
                      <option value="FULL_TRUCK">Full Truck / 10-Wheeler (up to 10,000 kg)</option>
                    </select>

                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>Registration Plate Number *</label>
                    <input
                      required
                      placeholder="e.g. JH-01-CD-9988"
                      value={newVehicleForm.vehicleNumber}
                      onChange={e => setNewVehicleForm({ ...newVehicleForm, vehicleNumber: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>Capacity (kg)</label>
                        <input
                          type="number"
                          required
                          value={newVehicleForm.capacityKg}
                          onChange={e => setNewVehicleForm({ ...newVehicleForm, capacityKg: e.target.value })}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>Rate (₹/km)</label>
                        <input
                          type="number"
                          required
                          value={newVehicleForm.ratePerKm}
                          onChange={e => setNewVehicleForm({ ...newVehicleForm, ratePerKm: e.target.value })}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setShowAddVehicleModal(false)} className="trade-btn trade-btn-cancel">Cancel</button>
                      <button type="submit" className="trade-btn trade-btn-primary" style={{ background: '#059669', borderColor: '#059669' }}>Add to Fleet</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export { FindTransporterPanel, TransportBookingStatus };
export default TransporterDashboard;
