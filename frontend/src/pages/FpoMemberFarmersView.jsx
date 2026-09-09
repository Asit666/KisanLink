import React, { useState } from 'react';

export default function FpoMemberFarmersView({
  farmers,
  onAddFarmer
}) {
  const [isAddingFarmer, setIsAddingFarmer] = useState(false);
  const [farmerForm, setFarmerForm] = useState({
    name: '',
    phone: '',
    village: '',
    district: 'Nashik',
    crops: 'Tomato, Onion',
    landSizeAcres: 3.0
  });

  const totalLand = (farmers || []).reduce((sum, f) => sum + Number(f.landSizeAcres || 0), 0);
  const totalVolume = (farmers || []).reduce((sum, f) => sum + Number(f.totalSuppliedKg || 0), 0);

  function handleSubmit(e) {
    e.preventDefault();
    const nextNum = (farmers?.length || 0) + 1;
    const padNum = nextNum < 10 ? `00${nextNum}` : `0${nextNum}`;
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
      status: 'ACTIVE'
    };
    onAddFarmer(newFarmer);
    setIsAddingFarmer(false);
    setFarmerForm({ name: '', phone: '', village: '', district: 'Nashik', crops: 'Tomato, Onion', landSizeAcres: 3.0 });
  }

  return (
    <div className="view-container">
      <section className="panel" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <div className="panel-heading" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
          <div>
            <p className="eyebrow" style={{ color: '#64748b', margin: '0 0 4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Mono', monospace" }}>
              FPO Member Governance · Traceability Registry
            </p>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Enrolled Smallholder Farmers &amp; Harvest Supply History
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              Individual farmer profiles, village land holdings, and cumulative crop contributions for audited escrow payouts.
            </p>
          </div>
          <button
            type="button"
            className="trade-btn trade-btn-primary"
            style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 500 }}
            onClick={() => setIsAddingFarmer(true)}
          >
            + Enroll Member Farmer
          </button>
        </div>

        {/* Minimal KPI Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Mono', monospace" }}>
              Enrolled Smallholders
            </span>
            <strong style={{ display: 'block', fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '4px 0 2px' }}>
              {farmers?.length || 0} Farmers
            </strong>
            <small style={{ fontSize: '11px', color: '#64748b' }}>
              Active FPO voting members
            </small>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Mono', monospace" }}>
              Combined Land Area
            </span>
            <strong style={{ display: 'block', fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '4px 0 2px' }}>
              {totalLand.toFixed(1)} Acres
            </strong>
            <small style={{ fontSize: '11px', color: '#64748b' }}>
              Aggregated production base
            </small>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Mono', monospace" }}>
              Cumulative Harvest Pooled
            </span>
            <strong style={{ display: 'block', fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '4px 0 2px' }}>
              {(totalVolume / 1000).toFixed(1)} Tons
            </strong>
            <small style={{ fontSize: '11px', color: '#64748b' }}>
              {totalVolume.toLocaleString()} kg supplied
            </small>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Mono', monospace" }}>
              Escrow Disbursal Accuracy
            </span>
            <strong style={{ display: 'block', fontSize: '18px', fontWeight: 700, color: '#166534', margin: '4px 0 2px' }}>
              100% Direct
            </strong>
            <small style={{ fontSize: '11px', color: '#64748b' }}>
              Zero middleman deductions
            </small>
          </div>
        </div>

        {/* Member Farmers Table */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', font: "11px 'DM Mono', monospace", textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Farmer ID</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Full Name</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Contact Phone</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Village / Cluster</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Land (Acres)</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Primary Crops</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Total Supplied</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Trust Rating</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(farmers || []).map((farmer) => (
                <tr key={farmer.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontFamily: "'DM Mono', monospace", fontWeight: 600, color: '#334155' }}>
                    {farmer.farmerId}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 500, color: '#0f172a' }}>
                    {farmer.name}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>
                    {farmer.phone}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#475569' }}>
                    {farmer.village}, {farmer.district}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 500, color: '#334155' }}>
                    {farmer.landSizeAcres} ac
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {(Array.isArray(farmer.crops) ? farmer.crops : [farmer.crops]).map((c, i) => (
                        <span key={i} style={{ background: '#f1f5f9', color: '#334155', fontSize: '11px', padding: '2px 6px', borderRadius: '3px', fontWeight: 500 }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>
                    {Number(farmer.totalSuppliedKg).toLocaleString()} kg
                    <span style={{ display: 'block', fontSize: '10px', color: '#64748b', fontWeight: 400 }}>
                      ({(Number(farmer.totalSuppliedKg) / 1000).toFixed(1)} T)
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{farmer.trustScore || '5.0'}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '3px' }}>/ 5.0</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
                      {farmer.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
