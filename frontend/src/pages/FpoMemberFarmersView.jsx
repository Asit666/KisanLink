import React, { useState, useEffect } from 'react';

export default function FpoMemberFarmersView({
  farmers,
  onAddFarmer,
  intakes = [],
  onViewAsFarmer,
  initialAction,
  initialFarmerId
}) {
  const [isAddingFarmer, setIsAddingFarmer] = useState(initialAction === 'ADD');
  const [selectedFarmerHistory, setSelectedFarmerHistory] = useState(null);

  useEffect(() => {
    if (initialAction === 'ADD') {
      setIsAddingFarmer(true);
    }
    if (initialFarmerId && farmers) {
      const match = farmers.find(f => f.farmerId === initialFarmerId || String(f.id) === String(initialFarmerId));
      if (match) {
        setSelectedFarmerHistory(match);
      }
    }
  }, [initialAction, initialFarmerId, farmers]);

  const [farmerForm, setFarmerForm] = useState({
    name: '',
    phone: '',
    village: '',
    district: 'Nashik',
    crops: 'Tomato, Onion',
    landSizeAcres: 3.0,
    bankName: 'State Bank of India',
    accountNumber: '',
    ifscCode: 'SBIN0001234',
    upiId: ''
  });

  const totalLand = (farmers || []).reduce((sum, f) => sum + Number(f.landSizeAcres || 0), 0);
  const totalVolume = (farmers || []).reduce((sum, f) => sum + Number(f.totalSuppliedKg || 0), 0);

  function handleSubmit(e) {
    e.preventDefault();
    const nextNum = (farmers?.length || 0) + 1;
    const padNum = nextNum < 10 ? `00${nextNum}` : `0${nextNum}`;
    const mask = farmerForm.accountNumber ? `**** **** ${farmerForm.accountNumber.slice(-4)}` : '**** **** 8812';
    const newFarmer = {
      id: Date.now(),
      farmerId: `FMR-FPO42-${padNum}`,
      name: farmerForm.name,
      phone: farmerForm.phone,
      village: farmerForm.village,
      district: farmerForm.district,
      crops: farmerForm.crops.split(',').map(c => c.trim()),
      landSizeAcres: Number(farmerForm.landSizeAcres),
      totalSuppliedKg: 0,
      trustScore: 5.0,
      status: 'ACTIVE',
      bankName: farmerForm.bankName,
      accountNumberMasked: mask,
      ifscCode: farmerForm.ifscCode,
      upiId: farmerForm.upiId || `${farmerForm.name.toLowerCase().replace(/\s+/g, '.')}@upi`,
      kycStatus: 'VERIFIED'
    };
    onAddFarmer(newFarmer);
    setIsAddingFarmer(false);
    setFarmerForm({ name: '', phone: '', village: '', district: 'Nashik', crops: 'Tomato, Onion', landSizeAcres: 3.0, bankName: 'State Bank of India', accountNumber: '', ifscCode: 'SBIN0001234', upiId: '' });
  }

  return (
    <div className="view-container">
      <section className="panel" style={{ background: 'rgba(255, 252, 245, 0.65)', border: '1px solid #d9d6cc', borderRadius: '6px', padding: '22px' }}>
        <div className="panel-heading" style={{ borderBottom: '1px solid #e6e2d8', paddingBottom: '14px' }}>
          <div>
            <p className="eyebrow" style={{ color: '#b45a42', margin: '0 0 4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: "'DM Mono', monospace" }}>
              FPO Member Governance · Traceability Registry
            </p>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#202a27', margin: 0 }}>
              Enrolled Smallholder Farmers &amp; Harvest Supply History
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#667269' }}>
              Individual farmer profiles, village land holdings, and cumulative crop contributions for audited escrow payouts.
            </p>
          </div>
          <button
            type="button"
            className="trade-btn trade-btn-primary"
            style={{ padding: '8px 14px' }}
            onClick={() => setIsAddingFarmer(true)}
          >
            + Enroll Member Farmer
          </button>
        </div>

        {/* Minimal KPI Strip */}
        <div className="kpi-metrics-grid" style={{
          marginTop: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ background: '#fffdf9', border: '1px solid #d9d6cc', borderRadius: '6px', padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '10px', color: '#667269', display: 'block', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: "'DM Mono', monospace" }}>
              Enrolled Smallholders
            </span>
            <strong style={{ display: 'block', fontSize: '20px', fontWeight: 700, color: '#202a27', margin: '4px 0 2px' }}>
              {farmers?.length || 0} Farmers
            </strong>
            <small style={{ fontSize: '11px', color: '#7b827a' }}>
              Active FPO voting members
            </small>
          </div>

          <div style={{ background: '#fffdf9', border: '1px solid #d9d6cc', borderRadius: '6px', padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '10px', color: '#667269', display: 'block', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: "'DM Mono', monospace" }}>
              Combined Land Area
            </span>
            <strong style={{ display: 'block', fontSize: '20px', fontWeight: 700, color: '#202a27', margin: '4px 0 2px' }}>
              {totalLand.toFixed(1)} Acres
            </strong>
            <small style={{ fontSize: '11px', color: '#7b827a' }}>
              Aggregated production base
            </small>
          </div>

          <div style={{ background: '#fffdf9', border: '1px solid #d9d6cc', borderRadius: '6px', padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '10px', color: '#667269', display: 'block', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: "'DM Mono', monospace" }}>
              Cumulative Harvest Pooled
            </span>
            <strong style={{ display: 'block', fontSize: '20px', fontWeight: 700, color: '#202a27', margin: '4px 0 2px' }}>
              {(totalVolume / 1000).toFixed(1)} Tons
            </strong>
            <small style={{ fontSize: '11px', color: '#7b827a' }}>
              {totalVolume.toLocaleString()} kg supplied
            </small>
          </div>

          <div style={{ background: '#fffdf9', border: '1px solid #d9d6cc', borderRadius: '6px', padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '10px', color: '#667269', display: 'block', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: "'DM Mono', monospace" }}>
              Escrow Disbursal Accuracy
            </span>
            <strong style={{ display: 'block', fontSize: '20px', fontWeight: 700, color: '#2f6838', margin: '4px 0 2px' }}>
              100% Direct
            </strong>
            <small style={{ fontSize: '11px', color: '#7b827a' }}>
              Zero middleman deductions
            </small>
          </div>
        </div>

        {/* Member Farmers Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #d9d6cc', borderRadius: '6px', background: '#fffdf9', marginTop: '4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f5f0e7', borderBottom: '1px solid #d9d6cc', color: '#667269' }}>
                <th style={{ padding: '10px 10px', fontWeight: 600, fontSize: '11px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>Farmer ID</th>
                <th style={{ padding: '10px 10px', fontWeight: 600, fontSize: '11px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.06em' }}>Name &amp; Location</th>
                <th style={{ padding: '10px 10px', fontWeight: 600, fontSize: '11px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.06em' }}>Crops &amp; Land</th>
                <th style={{ padding: '10px 10px', fontWeight: 600, fontSize: '11px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>Bank Account</th>
                <th style={{ padding: '10px 10px', fontWeight: 600, fontSize: '11px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>Total Supplied</th>
                <th style={{ padding: '10px 10px', fontWeight: 600, fontSize: '11px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>Trust / Status</th>
                <th style={{ padding: '10px 10px', fontWeight: 600, fontSize: '11px', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.06em', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(farmers || []).map((farmer) => (
                <tr key={farmer.id} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '10px 14px', fontFamily: "'DM Mono', monospace", fontWeight: 600, color: '#404f43', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {farmer.farmerId}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontWeight: 600, color: '#202a27', display: 'block', fontSize: '13px' }}>{farmer.name}</span>
                    <span style={{ fontSize: '11px', color: '#667269', display: 'block', marginTop: '1px' }}>{farmer.village}, {farmer.district}</span>
                    <span style={{ fontSize: '11px', color: '#88928a', display: 'block', marginTop: '2px', fontFamily: "'DM Mono', monospace" }}>{farmer.phone}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      {(Array.isArray(farmer.crops) ? farmer.crops : [farmer.crops]).slice(0, 2).map((c, i) => (
                        <span key={i} style={{ background: '#f0f4f0', color: '#404f43', fontSize: '11px', padding: '2px 6px', borderRadius: '3px', fontWeight: 500 }}>
                          {c}
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: '11px', color: '#667269' }}>{farmer.landSizeAcres} acres</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontWeight: 500, color: '#202a27', display: 'block', fontSize: '12px' }}>
                      {farmer.bankName || 'State Bank of India'}
                    </span>
                    <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#667269' }}>
                      {farmer.accountNumberMasked || '**** **** 4812'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontWeight: 700, color: '#202a27', display: 'block', fontSize: '14px' }}>
                      {(Number(farmer.totalSuppliedKg) / 1000).toFixed(1)} T
                    </span>
                    <span style={{ fontSize: '11px', color: '#667269' }}>
                      {Number(farmer.totalSuppliedKg).toLocaleString()} kg
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: 700, color: '#202a27', fontSize: '13px' }}>
                        {farmer.trustScore || '5.0'}<span style={{ fontSize: '10px', color: '#99a39b', fontWeight: 400 }}>/5.0</span>
                      </span>
                      <span style={{ background: '#eef4ec', color: '#2f6838', border: '1px solid #c3dcc5', fontSize: '10px', padding: '2px 7px', borderRadius: '3px', fontWeight: 600, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', display: 'inline-block', letterSpacing: '.04em' }}>
                        {farmer.status || 'ACTIVE'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="trade-btn trade-btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '11px' }}
                        onClick={() => setSelectedFarmerHistory(farmer)}
                      >
                        History
                      </button>
                      <button
                        type="button"
                        className="trade-btn trade-btn-primary"
                        style={{ padding: '5px 10px', fontSize: '11px' }}
                        onClick={() => { if (onViewAsFarmer) onViewAsFarmer(farmer); }}
                      >
                        View &rarr;
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* B6 & B8: Farmer Delivery & Payout History Statement Modal */}
      {selectedFarmerHistory && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", fontWeight: 700, background: '#f1f5f9', color: '#334155', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                  Member Farmer Statement &amp; History
                </span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                  {selectedFarmerHistory.name} · {selectedFarmerHistory.farmerId}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {selectedFarmerHistory.village}, {selectedFarmerHistory.district} · {selectedFarmerHistory.phone} · Bank: {selectedFarmerHistory.bankName} ({selectedFarmerHistory.accountNumberMasked})
                </span>
              </div>
              <button
                type="button"
                className="text-button"
                style={{
                  color: '#64748b',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '4px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedFarmerHistory(null)}
                aria-label="Close"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Farmer History Table */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', margin: '0 0 8px', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>
                Deliveries &amp; Escrow Disbursal Records
              </h4>
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }}>Weigh-Slip</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }}>Crop</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }}>Net kg</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }}>Linked Lot</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }}>Net Rate</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Payout (₹)</th>
                      <th style={{ padding: '8px 10px', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intakes.filter(i => i.farmerId === selectedFarmerHistory.farmerId).map((intake) => (
                      <tr key={intake.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>{intake.intakeId}</td>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>{intake.intakeTimestamp}</td>
                        <td style={{ padding: '8px 10px' }}>{intake.cropName} ({intake.grade?.replace(/_/g, ' ')})</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{intake.netWeightKg} kg</td>
                        <td style={{ padding: '8px 10px', fontFamily: "'DM Mono', monospace", color: '#0369a1' }}>{intake.lotId || 'Awaiting Lot'}</td>
                        <td style={{ padding: '8px 10px', color: '#166534', fontWeight: 600 }}>₹{intake.netFarmerRate ? intake.netFarmerRate.toFixed(2) : '17.00'}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>₹{Number(intake.totalPayoutDue).toLocaleString()}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '3px', background: intake.payoutStatus === 'PAID' ? '#f0fdf4' : '#fef3c7', color: intake.payoutStatus === 'PAID' ? '#166534' : '#92400e' }}>
                            {intake.payoutStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {intakes.filter(i => i.farmerId === selectedFarmerHistory.farmerId).length === 0 && (
                      <tr>
                        <td colSpan="8" style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                          No delivery intakes recorded yet for this member farmer.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <button
                type="button"
                className="trade-btn trade-btn-secondary"
                style={{ padding: '8px 14px', fontSize: '12px' }}
                onClick={() => window.print()}
              >
                Print Statement
              </button>
              <button
                type="button"
                className="trade-btn trade-btn-primary"
                style={{ padding: '8px 14px', fontSize: '12px' }}
                onClick={() => {
                  const f = selectedFarmerHistory;
                  setSelectedFarmerHistory(null);
                  if (onViewAsFarmer) onViewAsFarmer(f);
                }}
              >
                Open in "View as Farmer" Mode &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Enroll Farmer Modal */}
      {isAddingFarmer && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#0f172a' }}>
                Enroll Member Smallholder
              </h3>
              <button
                type="button"
                className="text-button"
                style={{
                  color: '#64748b',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '4px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => setIsAddingFarmer(false)}
                aria-label="Close"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label style={{ fontSize: '12px', color: '#334155' }}>Farmer Full Name
                <input
                  placeholder="e.g. Ramesh Kumar"
                  value={farmerForm.name}
                  onChange={(e) => setFarmerForm({ ...farmerForm, name: e.target.value })}
                  required
                />
              </label>

              <label style={{ fontSize: '12px', color: '#334155' }}>Mobile Number
                <input
                  type="tel"
                  placeholder="e.g. +91 98220 12345"
                  value={farmerForm.phone}
                  onChange={(e) => setFarmerForm({ ...farmerForm, phone: e.target.value })}
                  required
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ fontSize: '12px', color: '#334155' }}>Village / Cluster
                  <input
                    placeholder="e.g. Pimpalgaon"
                    value={farmerForm.village}
                    onChange={(e) => setFarmerForm({ ...farmerForm, village: e.target.value })}
                    required
                  />
                </label>
                <label style={{ fontSize: '12px', color: '#334155' }}>Land Holding (Acres)
                  <input
                    type="number"
                    step="0.1"
                    value={farmerForm.landSizeAcres}
                    onChange={(e) => setFarmerForm({ ...farmerForm, landSizeAcres: e.target.value })}
                    required
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ fontSize: '12px', color: '#334155' }}>Settlement Bank Name
                  <input
                    placeholder="e.g. State Bank of India"
                    value={farmerForm.bankName}
                    onChange={(e) => setFarmerForm({ ...farmerForm, bankName: e.target.value })}
                    required
                  />
                </label>
                <label style={{ fontSize: '12px', color: '#334155' }}>Bank Account Number
                  <input
                    placeholder="e.g. 3821094812"
                    value={farmerForm.accountNumber}
                    onChange={(e) => setFarmerForm({ ...farmerForm, accountNumber: e.target.value })}
                    required
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ fontSize: '12px', color: '#334155' }}>Bank IFSC Code
                  <input
                    placeholder="e.g. SBIN0001234"
                    value={farmerForm.ifscCode}
                    onChange={(e) => setFarmerForm({ ...farmerForm, ifscCode: e.target.value })}
                    required
                  />
                </label>
                <label style={{ fontSize: '12px', color: '#334155' }}>UPI VPA (Optional)
                  <input
                    placeholder="e.g. ramesh@oksbi"
                    value={farmerForm.upiId}
                    onChange={(e) => setFarmerForm({ ...farmerForm, upiId: e.target.value })}
                  />
                </label>
              </div>

              <label style={{ fontSize: '12px', color: '#334155' }}>Primary Crops (Comma separated)
                <input
                  placeholder="e.g. Tomato, Onion, Soybean"
                  value={farmerForm.crops}
                  onChange={(e) => setFarmerForm({ ...farmerForm, crops: e.target.value })}
                  required
                />
              </label>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <button type="button" className="trade-btn trade-btn-secondary" style={{ padding: '8px 14px', fontSize: '12px' }} onClick={() => setIsAddingFarmer(false)}>
                  Cancel
                </button>
                <button type="submit" className="trade-btn trade-btn-primary" style={{ padding: '8px 14px', fontSize: '12px' }}>
                  Enroll Farmer &amp; Generate ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
