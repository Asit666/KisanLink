import React, { useState } from 'react';

export default function FpoLotsAndPassportView({
  fpoProfile,
  lots,
  fpoFarmers,
  onNavigate,
  onMatchLot,
  onCreateLot
}) {
  const [selectedPassportLot, setSelectedPassportLot] = useState(null);
  const [isCreatingLot, setIsCreatingLot] = useState(false);
  const [newLotForm, setNewLotForm] = useState({
    cropName: 'Tomato',
    variety: 'Hybrid Desi 1057',
    category: 'VEGETABLE',
    quantityKg: 1000,
    harvestDateWindow: '10 Sep 2026 - 12 Sep 2026',
    pickupLocation: 'Sahyadri FPO Central Yard, Nashik',
    grade: 'GRADE_A',
    size: 'Medium (50mm - 60mm)',
    moisturePercent: 11.0,
    defectsPercent: 1.0,
    contributions: {}
  });

  const totalPooledKg = (lots || []).reduce((sum, l) => sum + Number(l.quantityKg || 0), 0);

  function handleCreateSubmit(e) {
    e.preventDefault();
    const contributingFarmers = Object.entries(newLotForm.contributions)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([farmerId, qty]) => {
        const f = fpoFarmers.find(farmer => farmer.farmerId === farmerId);
        return {
          farmerId,
          name: f ? f.name : 'Member Farmer',
          village: f ? f.village : 'Nashik',
          quantityKg: Number(qty),
          expectedPayout: Number(qty) * 32
        };
      });

    const lotIdNum = Date.now().toString().slice(-4);
    const newLot = {
      id: Date.now(),
      lotId: `LOT-FPO42-2026-${lotIdNum}`,
      passportId: `PASSPORT-LOT-${lotIdNum}`,
      fpoId: fpoProfile?.fpoId || 'FPO-MH-NAS-042',
      fpoName: fpoProfile?.name || 'Sahyadri Farmers Producer Co.',
      cropName: newLotForm.cropName,
      variety: newLotForm.variety,
      category: newLotForm.category,
      quantityKg: Number(newLotForm.quantityKg),
      harvestDateWindow: newLotForm.harvestDateWindow,
      pickupLocation: newLotForm.pickupLocation,
      status: 'READY_FOR_SALE',
      qualityChecklist: {
        grade: newLotForm.grade,
        size: newLotForm.size,
        color: 'Uniform Market Color',
        defectsPercent: Number(newLotForm.defectsPercent),
        moisturePercent: Number(newLotForm.moisturePercent),
        firmness: 'Firm Standard Grade',
        pesticideResidue: 'NABL Certified MRL Compliant'
      },
      images: [
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=60'
      ],
      contributingFarmers: contributingFarmers.length > 0 ? contributingFarmers : [
        { farmerId: 'FMR-FPO42-001', name: 'Ramesh Kumar', village: 'Pimpalgaon', quantityKg: Number(newLotForm.quantityKg), expectedPayout: Number(newLotForm.quantityKg) * 32 }
      ],
      qrCodeMock: `KL-VERIFIED-LOT-${lotIdNum}-NABL-GRADE-A`
    };

    onCreateLot(newLot);
    setIsCreatingLot(false);
    setSelectedPassportLot(newLot);
  }

  return (
    <div className="view-container">
      {/* Clean FPO Accreditation Header */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: '#1b4332',
            color: '#ffffff',
            width: '40px',
            height: '40px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '14px',
            letterSpacing: '0.5px'
          }}>
            FPO
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                {fpoProfile?.name || 'Sahyadri Farmers Producer Co. (FPC Ltd)'}
              </h3>
              <span style={{
                fontSize: '11px',
                fontFamily: "'DM Mono', monospace",
                background: '#f1f5f9',
                color: '#334155',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600
              }}>
                ID: {fpoProfile?.fpoId || 'FPO-MH-NAS-042'}
              </span>
              <span style={{
                fontSize: '11px',
                background: '#f0fdf4',
                color: '#166534',
                border: '1px solid #bbf7d0',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 500
              }}>
                NABL Lab Verified
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
              {fpoProfile?.regNumber || 'CIN: U01403MH2011PTC215682'} · {fpoProfile?.district || 'Nashik'}, {fpoProfile?.state || 'Maharashtra'} · Contact: {fpoProfile?.contactPerson || 'Vilas Shinde'} ({fpoProfile?.contactPhone || '+91 98220 44100'})
            </p>
          </div>
        </div>

        {/* Clean FPO Trust & Metric */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", fontWeight: 600, letterSpacing: '0.5px' }}>
            Trust Rating
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '4px', marginTop: '2px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
              {fpoProfile?.trustScore || '4.9'}
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>/ 5.0</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {fpoProfile?.trustBadge || 'High Trust · 98% Fulfillment'}
          </div>
        </div>
      </div>

      {/* Main Aggregated Lots Panel */}
      <section className="panel" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <div className="panel-heading" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
          <div>
            <p className="eyebrow" style={{ color: '#64748b', margin: '0 0 4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Mono', monospace" }}>
              Smart India Hackathon · Smallholder Pooling Engine
            </p>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Aggregated Quality-Aware Lots &amp; Lot Passports
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              Pooling fragmented smallholder harvests into standardized institutional trade lots with verifiable farm-to-fork origin.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="trade-btn trade-btn-primary"
              style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 500 }}
              onClick={() => setIsCreatingLot(true)}
            >
              + Create Aggregated Lot
            </button>
          </div>
        </div>

        {/* Minimal Summary KPI Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Mono', monospace" }}>
              Total Pooled Volume
            </span>
            <strong style={{ display: 'block', fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '4px 0 2px' }}>
              {(totalPooledKg / 1000).toFixed(1)} Tons
            </strong>
            <small style={{ fontSize: '11px', color: '#64748b' }}>
              {totalPooledKg.toLocaleString()} kg active
            </small>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Mono', monospace" }}>
              Active Lots Ready
            </span>
            <strong style={{ display: 'block', fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '4px 0 2px' }}>
              {lots?.length || 0} Lots
            </strong>
            <small style={{ fontSize: '11px', color: '#64748b' }}>
              Standardized &amp; Assayed
            </small>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Mono', monospace" }}>
              Contributing Farmers
            </span>
            <strong style={{ display: 'block', fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '4px 0 2px' }}>
              {fpoFarmers?.length || 5} Smallholders
            </strong>
            <small style={{ fontSize: '11px', color: '#64748b' }}>
              Traceability locked
            </small>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Mono', monospace" }}>
              Quality Compliance
            </span>
            <strong style={{ display: 'block', fontSize: '18px', fontWeight: 700, color: '#166534', margin: '4px 0 2px' }}>
              100% Grade A
            </strong>
            <small style={{ fontSize: '11px', color: '#64748b' }}>
              APMARK &amp; NABL standard
            </small>
          </div>
        </div>

        {/* Lots Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
          {(lots || []).map((lot) => {
            const isReady = lot.status === 'READY_FOR_SALE';
            return (
              <div
                key={lot.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: '#ffffff',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                <div>
                  {/* Card Header: Lot ID, Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span style={{
                        fontSize: '11px',
                        fontFamily: "'DM Mono', monospace",
                        fontWeight: 600,
                        background: '#f1f5f9',
                        color: '#334155',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {lot.lotId}
                      </span>
                      <h3 style={{ margin: '6px 0 2px', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                        {lot.cropName}
                      </h3>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Variety: <span style={{ color: '#334155', fontWeight: 500 }}>{lot.variety}</span> · {lot.category}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: isReady ? '#f0fdf4' : '#f8fafc',
                      color: isReady ? '#166534' : '#475569',
                      border: `1px solid ${isReady ? '#bbf7d0' : '#cbd5e1'}`
                    }}>
                      {lot.status?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Quantity & Dispatch Specs */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    margin: '10px 0',
                    fontSize: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ color: '#64748b' }}>Pooled Quantity:</span>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                        {Number(lot.quantityKg).toLocaleString()} kg ({(Number(lot.quantityKg) / 1000).toFixed(1)} T)
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ color: '#64748b' }}>Harvest Window:</span>
                      <span style={{ color: '#334155' }}>{lot.harvestDateWindow}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Dispatch Yard:</span>
                      <span style={{ textAlign: 'right', maxWidth: '200px', color: '#334155' }}>{lot.pickupLocation}</span>
                    </div>
                  </div>

                  {/* Quality Specifications */}
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontFamily: "'DM Mono', monospace",
                      textTransform: 'uppercase',
                      color: '#64748b',
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: '6px',
                      letterSpacing: '0.5px'
                    }}>
                      Quality Specifications (Assayed)
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
                        Grade: {lot.qualityChecklist?.grade?.replace(/_/g, ' ')}
                      </span>
                      <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>
                        Moisture: {lot.qualityChecklist?.moisturePercent}%
                      </span>
                      <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>
                        Size: {lot.qualityChecklist?.size}
                      </span>
                      <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#166534', fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>
                        Defects: &lt; {lot.qualityChecklist?.defectsPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Contributing Farmers Micro-list */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                        Contributing Smallholders ({lot.contributingFarmers?.length || 0}):
                      </span>
                      <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#166534', fontWeight: 500 }}>
                        100% Traceable
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {(lot.contributingFarmers || []).map((farmer, idx) => (
                        <span key={idx} style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '11px',
                          color: '#334155'
                        }}>
                          <span style={{ fontWeight: 600 }}>{farmer.name}</span>: {farmer.quantityKg} kg ({farmer.village})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clean Actions */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <button
                    type="button"
                    className="trade-btn trade-btn-secondary"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '12px', fontWeight: 500 }}
                    onClick={() => setSelectedPassportLot(lot)}
                  >
                    View Lot Passport
                  </button>
                  <button
                    type="button"
                    className="trade-btn trade-btn-primary"
                    style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 500 }}
                    onClick={() => {
                      if (onMatchLot) onMatchLot(lot);
                      onNavigate('matching');
                    }}
                  >
                    Match Buyers
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Clean Digital Lot Passport Modal */}
      {selectedPassportLot && (
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
            maxWidth: '640px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <span style={{
                  fontSize: '10px',
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 700,
                  background: '#f1f5f9',
                  color: '#334155',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Official Digital Lot Passport
                </span>
                <h2 style={{ margin: '6px 0 2px', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                  {selectedPassportLot.cropName} · {selectedPassportLot.variety}
                </h2>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Passport Ref: <strong style={{ color: '#334155' }}>{selectedPassportLot.passportId}</strong> · Lot ID: <strong style={{ color: '#334155' }}>{selectedPassportLot.lotId}</strong>
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
                onClick={() => setSelectedPassportLot(null)}
                aria-label="Close"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Traceability Hash Stamp */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                  Cryptographic Traceability Hash
                </span>
                <div style={{ font: "12px 'DM Mono', monospace", fontWeight: 600, color: '#0f172a', letterSpacing: '0.5px', marginTop: '2px' }}>
                  {selectedPassportLot.qrCodeMock}
                </div>
                <small style={{ fontSize: '10px', color: '#64748b' }}>
                  Issued by KisanLink NABL Quality Assurance Network
                </small>
              </div>
              <span style={{
                background: '#f0fdf4',
                color: '#166534',
                border: '1px solid #bbf7d0',
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '4px',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}>
                Verified Grade A+
              </span>
            </div>

            {/* Specifications Matrix */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px' }}>
                1. Assayed Quality Metrics
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 10px', borderRadius: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Commercial Grade</span>
                  <strong style={{ fontSize: '12px', color: '#0f172a' }}>{selectedPassportLot.qualityChecklist?.grade?.replace(/_/g, ' ')}</strong>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 10px', borderRadius: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Moisture Assay</span>
                  <strong style={{ fontSize: '12px', color: '#0f172a' }}>{selectedPassportLot.qualityChecklist?.moisturePercent}%</strong>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 10px', borderRadius: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Size / Diameter</span>
                  <strong style={{ fontSize: '12px', color: '#0f172a' }}>{selectedPassportLot.qualityChecklist?.size}</strong>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 10px', borderRadius: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Visual Defects</span>
                  <strong style={{ fontSize: '12px', color: '#166534' }}>&lt; {selectedPassportLot.qualityChecklist?.defectsPercent}%</strong>
                </div>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#64748b' }}>
                <strong style={{ color: '#334155' }}>Pesticide Compliance:</strong> {selectedPassportLot.qualityChecklist?.pesticideResidue}
              </p>
            </div>

            {/* Contributing Smallholder Traceability Table */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                  2. Contributing Smallholders (Traceability)
                </span>
                <span style={{ fontSize: '11px', color: '#334155', fontWeight: 600 }}>
                  Total Lot: {Number(selectedPassportLot.quantityKg).toLocaleString()} kg
                </span>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '7px 10px', fontWeight: 600 }}>Farmer ID</th>
                      <th style={{ padding: '7px 10px', fontWeight: 600 }}>Member Name</th>
                      <th style={{ padding: '7px 10px', fontWeight: 600 }}>Village</th>
                      <th style={{ padding: '7px 10px', fontWeight: 600 }}>Quantity</th>
                      <th style={{ padding: '7px 10px', fontWeight: 600 }}>Lot Share</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600 }}>Direct Payout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedPassportLot.contributingFarmers || []).map((f, i) => {
                      const sharePct = ((Number(f.quantityKg) / Number(selectedPassportLot.quantityKg)) * 100).toFixed(1);
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '7px 10px', fontFamily: "'DM Mono', monospace", color: '#334155' }}>{f.farmerId}</td>
                          <td style={{ padding: '7px 10px', fontWeight: 500, color: '#0f172a' }}>{f.name}</td>
                          <td style={{ padding: '7px 10px', color: '#64748b' }}>{f.village}</td>
                          <td style={{ padding: '7px 10px', fontWeight: 500 }}>{f.quantityKg} kg</td>
                          <td style={{ padding: '7px 10px', color: '#64748b' }}>{sharePct}%</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: '#166534' }}>
                            ₹{Number(f.expectedPayout || f.quantityKg * 32).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dispatch & Packhouse Details */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '10px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#475569',
              marginBottom: '16px'
            }}>
              <strong style={{ color: '#0f172a' }}>Logistics Hub &amp; Gate Entry:</strong> {selectedPassportLot.pickupLocation} · Ready for Insulated Freight Carrier Pickup.
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
              <button
                type="button"
                className="trade-btn trade-btn-secondary"
                style={{ padding: '8px 14px', fontSize: '12px' }}
                onClick={() => window.print()}
              >
                Print Lot Passport
              </button>
              <button
                type="button"
                className="trade-btn trade-btn-primary"
                style={{ padding: '8px 14px', fontSize: '12px' }}
                onClick={() => {
                  if (onMatchLot) onMatchLot(selectedPassportLot);
                  setSelectedPassportLot(null);
                  onNavigate('matching');
                }}
              >
                Match with Buyers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Create Lot Modal */}
      {isCreatingLot && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <p className="eyebrow" style={{ margin: 0, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>
                  FPO Aggregator
                </p>
                <h3 style={{ margin: '2px 0 0', fontSize: '17px', fontWeight: 600, color: '#0f172a' }}>
                  Create Aggregated Lot &amp; Passport
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
                onClick={() => setIsCreatingLot(false)}
                aria-label="Close"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ fontSize: '12px', color: '#334155' }}>Crop Name
                  <input
                    value={newLotForm.cropName}
                    onChange={(e) => setNewLotForm({ ...newLotForm, cropName: e.target.value })}
                    required
                  />
                </label>
                <label style={{ fontSize: '12px', color: '#334155' }}>Variety / Hybrid
                  <input
                    value={newLotForm.variety}
                    onChange={(e) => setNewLotForm({ ...newLotForm, variety: e.target.value })}
                    required
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ fontSize: '12px', color: '#334155' }}>Target Lot Quantity (kg)
                  <input
                    type="number"
                    min="100"
                    value={newLotForm.quantityKg}
                    onChange={(e) => setNewLotForm({ ...newLotForm, quantityKg: e.target.value })}
                    required
                  />
                </label>
                <label style={{ fontSize: '12px', color: '#334155' }}>Assayed Grade
                  <select
                    value={newLotForm.grade}
                    onChange={(e) => setNewLotForm({ ...newLotForm, grade: e.target.value })}
                  >
                    <option value="GRADE_A">Grade A (Premium / Institutional)</option>
                    <option value="GRADE_B">Grade B (Standard Market)</option>
                    <option value="GRADE_C">Grade C (Processing)</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ fontSize: '12px', color: '#334155' }}>Moisture Content (%)
                  <input
                    type="number"
                    step="0.1"
                    value={newLotForm.moisturePercent}
                    onChange={(e) => setNewLotForm({ ...newLotForm, moisturePercent: e.target.value })}
                    required
                  />
                </label>
                <label style={{ fontSize: '12px', color: '#334155' }}>Defect Tolerance (%)
                  <input
                    type="number"
                    step="0.1"
                    value={newLotForm.defectsPercent}
                    onChange={(e) => setNewLotForm({ ...newLotForm, defectsPercent: e.target.value })}
                    required
                  />
                </label>
              </div>

              <label style={{ fontSize: '12px', color: '#334155' }}>Harvest Date Window
                <input
                  value={newLotForm.harvestDateWindow}
                  onChange={(e) => setNewLotForm({ ...newLotForm, harvestDateWindow: e.target.value })}
                  required
                />
              </label>

              <label style={{ fontSize: '12px', color: '#334155' }}>Pickup Location
                <input
                  value={newLotForm.pickupLocation}
                  onChange={(e) => setNewLotForm({ ...newLotForm, pickupLocation: e.target.value })}
                  required
                />
              </label>

              {/* Select Contributing Farmers */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '8px' }}>
                  Assign Contributing Member Farmers (Smallholder Pooling):
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                  {(fpoFarmers || []).map((farmer) => (
                    <div key={farmer.farmerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '6px 10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      <div>
                        <strong style={{ fontSize: '12px', color: '#0f172a' }}>{farmer.name}</strong>
                        <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>{farmer.village} · {farmer.farmerId}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="number"
                          placeholder="kg"
                          style={{ width: '80px', padding: '4px 6px', fontSize: '11px' }}
                          value={newLotForm.contributions[farmer.farmerId] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewLotForm(prev => ({
                              ...prev,
                              contributions: { ...prev.contributions, [farmer.farmerId]: val }
                            }));
                          }}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <button type="button" className="trade-btn trade-btn-secondary" style={{ padding: '8px 14px', fontSize: '12px' }} onClick={() => setIsCreatingLot(false)}>
                  Cancel
                </button>
                <button type="submit" className="trade-btn trade-btn-primary" style={{ padding: '8px 14px', fontSize: '12px' }}>
                  Generate Lot &amp; Passport
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
