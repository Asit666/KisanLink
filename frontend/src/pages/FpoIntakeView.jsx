import React, { useState } from 'react';

export default function FpoIntakeView({
  intakes,
  farmers,
  onAddIntake,
  onNavigateToLots
}) {
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [isAddingIntake, setIsAddingIntake] = useState(false);
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'UNPOOLED' | 'POOLED'

  const [form, setForm] = useState({
    farmerId: farmers?.[0]?.farmerId || '',
    cropName: 'Tomato',
    variety: 'Hybrid Desi 1057',
    category: 'VEGETABLE',
    grossWeightKg: 500,
    tareWeightKg: 25,
    grade: 'GRADE_A',
    moisturePercent: 11.2,
    defectsPercent: 1.0,
    collectionPoint: 'Pimpalgaon Village Collection Hub #1',
    indicativeBaseRate: 17.5,
    photoUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=60'
  });

  const netWeight = Math.max(0, Number(form.grossWeightKg) - Number(form.tareWeightKg));
  const estimatedAmount = netWeight * Number(form.indicativeBaseRate || 0);

  const filteredIntakes = (intakes || []).filter(item => {
    if (filterTab === 'UNPOOLED') return item.status === 'UNPOOLED';
    if (filterTab === 'POOLED') return item.status === 'POOLED';
    return true;
  });

  const totalVolume = (intakes || []).reduce((sum, i) => sum + Number(i.netWeightKg || 0), 0);
  const unpooledVolume = (intakes || []).filter(i => i.status === 'UNPOOLED').reduce((sum, i) => sum + Number(i.netWeightKg || 0), 0);
  const unpooledCount = (intakes || []).filter(i => i.status === 'UNPOOLED').length;

  function handleSubmit(e) {
    e.preventDefault();
    const selectedFarmer = farmers.find(f => f.farmerId === form.farmerId) || farmers[0];
    const intakeNum = (intakes?.length || 0) + 1;
    const padNum = intakeNum < 10 ? `940${intakeNum}` : `94${intakeNum}`;
    const newIntakeId = `INT-2026-${padNum}`;

    const newRecord = {
      id: Date.now(),
      intakeId: newIntakeId,
      farmerId: selectedFarmer.farmerId,
      farmerName: selectedFarmer.name,
      farmerPhone: selectedFarmer.phone,
      village: selectedFarmer.village,
      cropName: form.cropName,
      variety: form.variety,
      category: form.category,
      grossWeightKg: Number(form.grossWeightKg),
      tareWeightKg: Number(form.tareWeightKg),
      netWeightKg: netWeight,
      grade: form.grade,
      moisturePercent: Number(form.moisturePercent),
      defectsPercent: Number(form.defectsPercent),
      collectionPoint: form.collectionPoint,
      photoUrl: form.photoUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=60',
      intakeTimestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      indicativeBaseRate: Number(form.indicativeBaseRate),
      grossBuyerRate: null,
      fpoFeeRate: 1.0,
      netFarmerRate: Number(form.indicativeBaseRate) - 1.0,
      totalPayoutDue: estimatedAmount,
      status: 'UNPOOLED',
      lotId: null,
      buyerName: null,
      payoutStatus: 'PENDING_POOLING',
      paymentMethod: selectedFarmer.bankName ? `Direct Bank Disbursal (${selectedFarmer.bankName})` : 'IMPS Direct Bank Disbursal',
      utrNumber: null,
      payoutDate: null,
      smsStatus: 'DELIVERED',
      weighSlipHash: `WS-${padNum}-VERIFIED`
    };

    onAddIntake(newRecord);
    setIsAddingIntake(false);
    setSelectedSlip(newRecord);
  }

  return (
    <div className="view-container">
      {/* Header Banner */}
      <div style={{
        background: 'rgba(255, 252, 245, 0.85)',
        border: '1px solid #d9d6cc',
        borderRadius: '6px',
        padding: '16px 20px',
        marginBottom: '18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: '#dce7d3',
            color: '#3e6445',
            width: '38px',
            height: '38px',
            borderRadius: '4px',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 700,
            fontSize: '11px',
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '.04em',
            flexShrink: 0
          }}>
            HUB
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#202a27' }}>
                Village Intake Hub &amp; Digital Weigh-Slip Desk
              </h3>
              <span style={{
                fontSize: '10px',
                fontFamily: "'DM Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '.04em',
                background: '#e5ecdb',
                color: '#446849',
                border: '1px solid #cad6c2',
                padding: '2px 8px',
                borderRadius: '3px',
                fontWeight: 600
              }}>
                Direct Smallholder Inflow
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#667269' }}>
              Weighbridge tare certification, quality assay, and instantaneous digital weigh-slips eliminating mandi distress sales.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="trade-btn trade-btn-primary"
            style={{ padding: '8px 14px' }}
            onClick={() => setIsAddingIntake(true)}
          >
            + Log Smallholder Intake
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-metrics-grid" style={{ marginBottom: '20px' }}>
        <div style={{ background: '#fffdf9', border: '1px solid #d9d6cc', borderRadius: '6px', padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '10px', color: '#667269', display: 'block', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: "'DM Mono', monospace" }}>
            Total Inflow Recorded
          </span>
          <strong style={{ display: 'block', fontSize: '20px', fontWeight: 700, color: '#202a27', margin: '4px 0 2px' }}>
            {(totalVolume / 1000).toFixed(2)} Tons
          </strong>
          <small style={{ fontSize: '11px', color: '#7b827a' }}>
            {intakes.length} certified weigh-slips
          </small>
        </div>

        <div style={{ background: '#fffdf9', border: '1px solid #d9d6cc', borderRadius: '6px', padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '10px', color: '#667269', display: 'block', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: "'DM Mono', monospace" }}>
            Unpooled Batches in Yard
          </span>
          <strong style={{ display: 'block', fontSize: '20px', fontWeight: 700, color: '#b45a42', margin: '4px 0 2px' }}>
            {unpooledCount} Batches ({(unpooledVolume / 1000).toFixed(2)} T)
          </strong>
          <small style={{ fontSize: '11px', color: '#7b827a' }}>
            Ready for institutional lot aggregation
          </small>
        </div>

        <div style={{ background: '#fffdf9', border: '1px solid #d9d6cc', borderRadius: '6px', padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '10px', color: '#667269', display: 'block', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: "'DM Mono', monospace" }}>
            Weighbridge Precision
          </span>
          <strong style={{ display: 'block', fontSize: '20px', fontWeight: 700, color: '#2f6838', margin: '4px 0 2px' }}>
            100% Tare Audited
          </strong>
          <small style={{ fontSize: '11px', color: '#7b827a' }}>
            Net = Gross minus crate tare
          </small>
        </div>

        <div style={{ background: '#fffdf9', border: '1px solid #d9d6cc', borderRadius: '6px', padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '10px', color: '#667269', display: 'block', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: "'DM Mono', monospace" }}>
            Payment Escrow Lock
          </span>
          <strong style={{ display: 'block', fontSize: '20px', fontWeight: 700, color: '#202a27', margin: '4px 0 2px' }}>
            Direct Bank Disbursal
          </strong>
          <small style={{ fontSize: '11px', color: '#7b827a' }}>
            NPCI IMPS / UPI automated split
          </small>
        </div>
      </div>

      {/* Main Registry Panel */}
      <section className="panel" style={{ background: 'rgba(255, 252, 245, 0.65)', border: '1px solid #d9d6cc', borderRadius: '6px', padding: '22px' }}>
        <div className="panel-heading" style={{ borderBottom: '1px solid #e6e2d8', paddingBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#202a27', margin: 0 }}>
              Smallholder Produce Delivery Ledger
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#667269' }}>
              Filter by pooling status to aggregate pending deliveries into institutional lots.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              background: '#e8e2d5',
              padding: '3px',
              borderRadius: '6px',
              border: '1px solid #d9d6cc',
              boxSizing: 'border-box'
            }}>
              <button
                type="button"
                style={{
                  margin: 0,
                  width: 'auto',
                  height: '26px',
                  lineHeight: '26px',
                  padding: '0 12px',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: filterTab === 'ALL' ? '#202a27' : 'transparent',
                  color: filterTab === 'ALL' ? '#fffaf1' : '#667269',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontFamily: "'DM Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => setFilterTab('ALL')}
              >
                All ({intakes.length})
              </button>
              <button
                type="button"
                style={{
                  margin: 0,
                  width: 'auto',
                  height: '26px',
                  lineHeight: '26px',
                  padding: '0 12px',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: filterTab === 'UNPOOLED' ? '#202a27' : 'transparent',
                  color: filterTab === 'UNPOOLED' ? '#fffaf1' : '#667269',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontFamily: "'DM Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => setFilterTab('UNPOOLED')}
              >
                Unpooled ({unpooledCount})
              </button>
              <button
                type="button"
                style={{
                  margin: 0,
                  width: 'auto',
                  height: '26px',
                  lineHeight: '26px',
                  padding: '0 12px',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: filterTab === 'POOLED' ? '#202a27' : 'transparent',
                  color: filterTab === 'POOLED' ? '#fffaf1' : '#667269',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontFamily: "'DM Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => setFilterTab('POOLED')}
              >
                Pooled ({intakes.length - unpooledCount})
              </button>
            </div>
          </div>
        </div>

        {/* Intakes Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #d9d6cc', borderRadius: '6px', background: '#fffdf9', marginTop: '14px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f5f0e7', borderBottom: '1px solid #d9d6cc' }}>
                <th style={{ padding: '10px 12px', font: "600 10px 'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.06em', color: '#667269', whiteSpace: 'nowrap' }}>Weigh-Slip ID</th>
                <th style={{ padding: '10px 12px', font: "600 10px 'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.06em', color: '#667269', whiteSpace: 'nowrap' }}>Farmer</th>
                <th style={{ padding: '10px 12px', font: "600 10px 'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.06em', color: '#667269', whiteSpace: 'nowrap' }}>Crop &amp; Variety</th>
                <th style={{ padding: '10px 12px', font: "600 10px 'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.06em', color: '#667269', whiteSpace: 'nowrap' }}>Certified Weight</th>
                <th style={{ padding: '10px 12px', font: "600 10px 'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.06em', color: '#667269', whiteSpace: 'nowrap' }}>Quality Assay</th>
                <th style={{ padding: '10px 12px', font: "600 10px 'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.06em', color: '#667269', whiteSpace: 'nowrap' }}>Depot &amp; Time</th>
                <th style={{ padding: '10px 12px', font: "600 10px 'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.06em', color: '#667269', whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ padding: '10px 12px', font: "600 10px 'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '.06em', color: '#667269', textAlign: 'right', whiteSpace: 'nowrap' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredIntakes.map((item) => {
                const isPooled = item.status === 'POOLED';
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #ece7dc' }} onMouseEnter={e => e.currentTarget.style.background = '#faf6ee'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '10px 12px', fontFamily: "'DM Mono', monospace", fontWeight: 600, color: '#404f43', fontSize: '11px', whiteSpace: 'nowrap' }}>
                      {item.intakeId}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontWeight: 600, color: '#202a27', display: 'block', fontSize: '13px' }}>{item.farmerName}</span>
                      <span style={{ fontSize: '11px', color: '#667269', whiteSpace: 'nowrap' }}>{item.village}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          background: '#dce7d3',
                          display: 'grid',
                          placeItems: 'center',
                          border: '1px solid #cad6c2',
                          flexShrink: 0
                        }}>
                          {item.photoUrl ? (
                            <img
                              src={item.photoUrl}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span style={{ font: "700 11px 'DM Mono', monospace", color: '#3e6445' }}>
                              {item.cropName?.charAt(0) || 'C'}
                            </span>
                          )}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: '#202a27', display: 'block', fontSize: '12px' }}>{item.cropName}</span>
                          <span style={{ display: 'block', fontSize: '10px', color: '#667269', whiteSpace: 'nowrap' }}>{item.variety}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <strong style={{ fontSize: '13px', color: '#202a27', display: 'block' }}>{item.netWeightKg} kg</strong>
                      <span style={{ fontSize: '10px', color: '#7b827a', fontFamily: "'DM Mono', monospace" }}>
                        {item.grossWeightKg}g - {item.tareWeightKg}t
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{ background: '#e5ecdb', color: '#446849', border: '1px solid #cad6c2', padding: '1px 6px', borderRadius: '3px', fontWeight: 600, fontSize: '10px', fontFamily: "'DM Mono', monospace", display: 'inline-block', letterSpacing: '.04em' }}>
                        {item.grade?.replace(/_/g, ' ')}
                      </span>
                      <span style={{ display: 'block', fontSize: '10px', color: '#667269', marginTop: '2px' }}>
                        M:{item.moisturePercent}% · D:{item.defectsPercent}%
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#667269', maxWidth: '200px' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: '#202a27', fontWeight: 500, lineHeight: 1.3 }}>{item.collectionPoint}</span>
                      <span style={{ fontSize: '10px', color: '#7b827a', fontFamily: "'DM Mono', monospace", display: 'block', marginTop: '2px' }}>{item.intakeTimestamp}</span>
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      {isPooled ? (
                        <div>
                          <span style={{
                            background: '#e5ecdb',
                            color: '#3e6445',
                            border: '1px solid #cad6c2',
                            padding: '2px 7px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: 600,
                            fontFamily: "'DM Mono', monospace",
                            textTransform: 'uppercase',
                            letterSpacing: '.04em',
                            display: 'inline-block'
                          }}>
                            POOLED
                          </span>
                          <span style={{ display: 'block', fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#7b827a', marginTop: '2px' }}>
                            {item.lotId}
                          </span>
                        </div>
                      ) : (
                        <span style={{
                          background: '#fae4df',
                          color: '#8f3422',
                          border: '1px solid #eccbc2',
                          padding: '2px 7px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: 600,
                          fontFamily: "'DM Mono', monospace",
                          textTransform: 'uppercase',
                          letterSpacing: '.04em',
                          display: 'inline-block'
                        }}>
                          UNPOOLED
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="trade-btn trade-btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '10px' }}
                        onClick={() => setSelectedSlip(item)}
                      >
                        Slip
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Digital Weigh-Slip & SMS Verification Modal */}
      {selectedSlip && (
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
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <span style={{
                  fontSize: '10px',
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 700,
                  background: '#f1f5f9',
                  color: '#334155',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}>
                  Official Delivery Challan &amp; Weigh-Slip
                </span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                  {selectedSlip.intakeId}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Recorded at {selectedSlip.collectionPoint}
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
                onClick={() => setSelectedSlip(null)}
                aria-label="Close"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Weighbridge Specs */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '12px 14px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Gross Weight</span>
                  <strong style={{ fontSize: '14px', color: '#334155' }}>{selectedSlip.grossWeightKg} kg</strong>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Tare (Crates)</span>
                  <strong style={{ fontSize: '14px', color: '#dc2626' }}>-{selectedSlip.tareWeightKg} kg</strong>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Net Certified</span>
                  <strong style={{ fontSize: '16px', color: '#166534' }}>{selectedSlip.netWeightKg} kg</strong>
                </div>
              </div>
            </div>

            {/* Physical Intake Batch Photo Inspection Proof */}
            {selectedSlip.photoUrl && (
              <div style={{
                marginBottom: '16px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                overflow: 'hidden',
                background: '#f8fafc'
              }}>
                <div style={{ position: 'relative', height: '140px', background: '#0f172a' }}>
                  <img
                    src={selectedSlip.photoUrl}
                    alt="Intake Batch Photo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <span style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontFamily: "'DM Mono', monospace",
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}>
                    Physical Batch Inspection Proof · {selectedSlip.intakeId}
                  </span>
                </div>
              </div>
            )}

            {/* Farmer & Payout Overview */}
            <div style={{ fontSize: '12px', marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Member Farmer:</span>
                <strong style={{ color: '#0f172a' }}>{selectedSlip.farmerName} ({selectedSlip.farmerId})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Registered Village &amp; Phone:</span>
                <span style={{ color: '#334155' }}>{selectedSlip.village} · {selectedSlip.farmerPhone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Assayed Grade &amp; Moisture:</span>
                <span style={{ color: '#334155', fontWeight: 500 }}>{selectedSlip.grade?.replace(/_/g, ' ')} · {selectedSlip.moisturePercent}% Moisture</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Indicative Base Rate:</span>
                <strong style={{ color: '#0f172a' }}>₹{selectedSlip.indicativeBaseRate} / kg</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f0fdf4' }}>
                <span style={{ color: '#166534', fontWeight: 600 }}>Estimated Farmer Realization:</span>
                <strong style={{ color: '#166534', fontSize: '14px' }}>₹{Number(selectedSlip.totalPayoutDue).toLocaleString()}</strong>
              </div>
            </div>

            {/* Real-world SMS / WhatsApp simulation */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '12px 14px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>
                  Automated SMS / WhatsApp Notification Slip
                </span>
                <span style={{ fontSize: '10px', color: '#166534', fontWeight: 600 }}>
                  Delivered to {selectedSlip.farmerPhone}
                </span>
              </div>
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                padding: '10px 12px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '11px',
                color: '#1e293b',
                lineHeight: 1.5
              }}>
                "KisanLink: Sahyadri FPO received {selectedSlip.netWeightKg} kg {selectedSlip.cropName} ({selectedSlip.variety}) from {selectedSlip.farmerName}. Slip ID: {selectedSlip.intakeId}. Grade: {selectedSlip.grade?.replace(/_/g, ' ')}. Base rate: ₹{selectedSlip.indicativeBaseRate}/kg. Est. payout: ₹{Number(selectedSlip.totalPayoutDue).toLocaleString()}. Payout will be disbursed directly via Escrow upon buyer lot settlement."
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <button
                type="button"
                className="trade-btn trade-btn-secondary"
                style={{ padding: '8px 14px', fontSize: '12px' }}
                onClick={() => window.print()}
              >
                Print Weigh-Slip
              </button>
              {selectedSlip.status === 'UNPOOLED' && onNavigateToLots && (
                <button
                  type="button"
                  className="trade-btn trade-btn-primary"
                  style={{ padding: '8px 14px', fontSize: '12px' }}
                  onClick={() => {
                    setSelectedSlip(null);
                    onNavigateToLots();
                  }}
                >
                  Pool into Lot Passport &rarr;
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Log New Intake Modal */}
      {isAddingIntake && (
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
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <p className="eyebrow" style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>
                  Village Collection Yard
                </p>
                <h3 style={{ margin: '2px 0 0', fontSize: '17px', fontWeight: 600, color: '#0f172a' }}>
                  Record Smallholder Delivery &amp; Weigh
                </h3>
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
                onClick={() => setIsAddingIntake(false)}
                aria-label="Close"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label style={{ fontSize: '12px', color: '#334155' }}>Select Member Farmer
                <select
                  value={form.farmerId}
                  onChange={(e) => setForm({ ...form, farmerId: e.target.value })}
                  required
                >
                  {(farmers || []).map((f) => (
                    <option key={f.farmerId} value={f.farmerId}>
                      {f.name} ({f.village} · {f.farmerId})
                    </option>
                  ))}
                </select>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ fontSize: '12px', color: '#334155' }}>Crop
                  <select
                    value={form.cropName}
                    onChange={(e) => setForm({ ...form, cropName: e.target.value })}
                  >
                    <option value="Tomato">Tomato</option>
                    <option value="Onion">Onion</option>
                    <option value="Soybean">Soybean</option>
                    <option value="Grapes">Grapes</option>
                    <option value="Wheat">Wheat</option>
                  </select>
                </label>
                <label style={{ fontSize: '12px', color: '#334155' }}>Variety / Hybrid
                  <input
                    value={form.variety}
                    onChange={(e) => setForm({ ...form, variety: e.target.value })}
                    required
                  />
                </label>
              </div>

              {/* Tare Scale Entry */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', margin: '10px 0' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                  Scale Weighing Entry (Tare Subtraction)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#475569' }}>Gross Scale Reading (kg)
                    <input
                      type="number"
                      step="0.5"
                      value={form.grossWeightKg}
                      onChange={(e) => setForm({ ...form, grossWeightKg: e.target.value })}
                      required
                    />
                  </label>
                  <label style={{ fontSize: '11px', color: '#475569' }}>Crates Tare Weight (kg)
                    <input
                      type="number"
                      step="0.5"
                      value={form.tareWeightKg}
                      onChange={(e) => setForm({ ...form, tareWeightKg: e.target.value })}
                      required
                    />
                  </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Calculated Net Certified Weight:</span>
                  <strong style={{ fontSize: '15px', color: '#166534' }}>{netWeight} kg</strong>
                </div>
              </div>

              {/* Quality & Grade */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <label style={{ fontSize: '11px', color: '#334155' }}>Assayed Grade
                  <select
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  >
                    <option value="GRADE_A">Grade A (Premium)</option>
                    <option value="GRADE_B">Grade B (Standard)</option>
                    <option value="GRADE_C">Grade C (Processing)</option>
                  </select>
                </label>
                <label style={{ fontSize: '11px', color: '#334155' }}>Moisture %
                  <input
                    type="number"
                    step="0.1"
                    value={form.moisturePercent}
                    onChange={(e) => setForm({ ...form, moisturePercent: e.target.value })}
                    required
                  />
                </label>
                <label style={{ fontSize: '11px', color: '#334155' }}>Defects %
                  <input
                    type="number"
                    step="0.1"
                    value={form.defectsPercent}
                    onChange={(e) => setForm({ ...form, defectsPercent: e.target.value })}
                    required
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ fontSize: '12px', color: '#334155' }}>Collection Hub Location
                  <input
                    value={form.collectionPoint}
                    onChange={(e) => setForm({ ...form, collectionPoint: e.target.value })}
                    required
                  />
                </label>
                <label style={{ fontSize: '12px', color: '#334155' }}>Indicative Base Rate (₹/kg)
                  <input
                    type="number"
                    step="0.5"
                    value={form.indicativeBaseRate}
                    onChange={(e) => setForm({ ...form, indicativeBaseRate: e.target.value })}
                    required
                  />
                </label>
              </div>

              {/* Crop Batch Photo Upload & Presets */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', margin: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#0f172a' }}>
                    Physical Inspection Photo Proof (Feature B3)
                  </span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    NABL Traceability
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                  {form.photoUrl && (
                    <img
                      src={form.photoUrl}
                      alt="Batch Preview"
                      style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #cbd5e1', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      id="intake-photo-file"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            setForm(prev => ({ ...prev, photoUrl: evt.target.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="intake-photo-file"
                      className="trade-btn trade-btn-secondary"
                      style={{ display: 'inline-block', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', margin: '0 8px 0 0' }}
                    >
                      Upload Device Photo
                    </label>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Or choose sample:</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Tomato Batch', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=60' },
                    { label: 'Graded Crates', url: 'https://images.unsplash.com/photo-1546470427-227c7369a9b9?w=800&auto=format&fit=crop&q=60' },
                    { label: 'Onion Sacks', url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&auto=format&fit=crop&q=60' },
                    { label: 'Field Harvest', url: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=800&auto=format&fit=crop&q=60' }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      style={{
                        fontSize: '10px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: form.photoUrl === preset.url ? '1px solid #166534' : '1px solid #cbd5e1',
                        background: form.photoUrl === preset.url ? '#f0fdf4' : '#ffffff',
                        color: form.photoUrl === preset.url ? '#166534' : '#475569',
                        cursor: 'pointer'
                      }}
                      onClick={() => setForm(prev => ({ ...prev, photoUrl: preset.url }))}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px', borderRadius: '4px', margin: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: '#166534' }}>Estimated Disbursal to Farmer:</span>
                <strong style={{ color: '#166534', fontSize: '14px' }}>₹{estimatedAmount.toLocaleString()}</strong>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <button type="button" className="trade-btn trade-btn-secondary" style={{ padding: '8px 14px', fontSize: '12px' }} onClick={() => setIsAddingIntake(false)}>
                  Cancel
                </button>
                <button type="submit" className="trade-btn trade-btn-primary" style={{ padding: '8px 14px', fontSize: '12px' }}>
                  Issue Weigh-Slip &amp; Send Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
