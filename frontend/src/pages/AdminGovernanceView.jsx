import React, { useState } from 'react';

export default function AdminGovernanceView({
  adminData,
  onVerifyEntity,
  onResolveDispute
}) {
  const [activeTab, setActiveTab] = useState('disputes'); // 'disputes' | 'verifications' | 'stats'
  const [verifications, setVerifications] = useState(adminData?.pendingVerifications || []);
  const [disputes, setDisputes] = useState(adminData?.disputesQueue || []);
  const [resolutionNotice, setResolutionNotice] = useState('');

  function handleVerify(id) {
    setVerifications(prev => prev.map(v => v.id === id ? { ...v, status: 'VERIFIED' } : v));
    if (onVerifyEntity) onVerifyEntity(id);
    setResolutionNotice(`Entity ID #${id} officially verified and granted NABL Green Badge.`);
  }

  function handleResolve(disputeId) {
    setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status: 'RESOLVED' } : d));
    if (onResolveDispute) onResolveDispute(disputeId);
    setResolutionNotice(`Dispute ${disputeId} arbitrated successfully: Escrow funds disbursed per Nodal Officer order.`);
  }

  return (
    <div className="view-container">
      {/* Nodal Officer Banner */}
      <div style={{ background: '#f6f7f6', border: '1px solid #d4dfd4', borderRadius: '8px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#1e3a8a', color: '#fff', width: '44px', height: '44px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px' }}>
            GOV
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#1e293b' }}>
                State Agricultural Marketing Board &amp; Nodal Authority Desk
              </h3>
              <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                REGULATORY OVERSIGHT
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
              Autonomous monitoring of FPO compliance, institutional buyer licenses, quality dispute arbitration, and digital escrow solvency.
            </p>
          </div>
        </div>

        <span style={{ font: "11px 'DM Mono', monospace", color: '#475569', background: '#e2e8f0', padding: '4px 10px', borderRadius: '4px', fontWeight: 600 }}>
          Admin ID: ADM-GOV-MH-01
        </span>
      </div>

      {resolutionNotice && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{resolutionNotice}</span>
          <button type="button" className="text-button" style={{ color: '#065f46' }} onClick={() => setResolutionNotice('')}>Close</button>
        </div>
      )}

      {/* Platform Statistics Tiles */}
      <div className="prediction-deep-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-metric-card">
          <span>Registered FPOs</span>
          <strong style={{ color: '#1e293b' }}>{adminData?.platformStats?.totalFpos || 18}</strong>
          <small style={{ font: "9px 'DM Mono', monospace", color: '#15803d' }}>
            {adminData?.platformStats?.verifiedFpos || 15} NABL Verified
          </small>
        </div>
        <div className="stat-metric-card">
          <span>Institutional Buyers</span>
          <strong style={{ color: '#2563eb' }}>{adminData?.platformStats?.totalBuyers || 42}</strong>
          <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>Retail, Processors &amp; Exporters</small>
        </div>
        <div className="stat-metric-card">
          <span>Circulating Lots</span>
          <strong style={{ color: '#2f6838' }}>{adminData?.platformStats?.activePooledLots || 24} Lots</strong>
          <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>182 Tons Aggregated</small>
        </div>
        <div className="stat-metric-card">
          <span>Total Escrow Settled</span>
          <strong style={{ color: '#166534' }}>₹{((adminData?.platformStats?.totalEscrowSettled || 4890000) / 100000).toFixed(1)} Lakhs</strong>
          <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>100% Protected Payouts</small>
        </div>
        <div className="stat-metric-card">
          <span>Dispute Queue</span>
          <strong style={{ color: disputes.filter(d => d.status === 'UNDER_REVIEW').length > 0 ? '#dc2626' : '#15803d' }}>
            {disputes.filter(d => d.status === 'UNDER_REVIEW').length} Open
          </strong>
          <small style={{ font: "9px 'DM Mono', monospace", color: '#7f8981' }}>Arbitration Queue</small>
        </div>
      </div>

      {/* Navigation Tabs for Admin */}
      <div className="tab-toggle-group" style={{ marginBottom: '18px' }}>
        <button
          type="button"
          className={activeTab === 'disputes' ? 'active' : ''}
          onClick={() => setActiveTab('disputes')}
        >
          Dispute Arbitration ({disputes.length})
        </button>
        <button
          type="button"
          className={activeTab === 'verifications' ? 'active' : ''}
          onClick={() => setActiveTab('verifications')}
        >
          Entity Verification Queue ({verifications.length})
        </button>
      </div>

      {/* TAB 1: DISPUTE ARBITRATION DESK */}
      {activeTab === 'disputes' && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Quasi-Judicial Mandi Dispute Resolution</p>
              <h2>Active Escrow Disputes &amp; Settlement Orders</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#667269' }}>
                Review certified weighbridge scale audit slips, transit shrinkage claims, and order digital escrow release.
              </p>
            </div>
            <span className="count">{disputes.length} Disputes</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            {disputes.map((d) => {
              const isResolved = d.status === 'RESOLVED';
              return (
                <div
                  key={d.id}
                  style={{
                    border: isResolved ? '1px solid #d4dfd4' : '2px solid #ef4444',
                    borderRadius: '8px',
                    padding: '18px',
                    background: isResolved ? '#fafbfa' : '#ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", fontWeight: 700, background: isResolved ? '#e2ece1' : '#fee2e2', color: isResolved ? '#2f6838' : '#b91c1c', padding: '2px 8px', borderRadius: '4px' }}>
                          {d.id}
                        </span>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#202a27' }}>
                          {d.dealRef}
                        </h3>
                      </div>
                      <span style={{ fontSize: '12px', color: '#68776b', display: 'block', marginTop: '2px' }}>
                        Claimant: <strong>{d.claimantName}</strong> vs Respondent: <strong>{d.respondentName}</strong>
                      </span>
                    </div>

                    <span style={{ background: isResolved ? '#dcfce7' : '#fef2f2', color: isResolved ? '#15803d' : '#b91c1c', fontSize: '11px', padding: '3px 10px', borderRadius: '4px', fontWeight: 700 }}>
                      {d.status?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', marginBottom: '14px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#64748b' }}>Dispute Category:</span>
                      <strong>{d.type?.replace(/_/g, ' ')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#64748b' }}>Claim Amount:</span>
                      <strong style={{ color: '#dc2626' }}>₹{Number(d.claimAmount).toLocaleString()}</strong>
                    </div>
                    <p style={{ margin: '6px 0 0', color: '#334155', lineHeight: 1.5 }}>
                      <strong>Claimant Statement:</strong> {d.description}
                    </p>
                  </div>

                  {/* Proposed Resolution */}
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '12px', marginBottom: '14px', fontSize: '12px', color: '#166534' }}>
                    <strong style={{ display: 'block', marginBottom: '2px' }}>Recommended Nodal Officer Resolution:</strong>
                    <span>{d.proposedResolution}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    {!isResolved ? (
                      <button
                        type="button"
                        className="trade-btn trade-btn-primary"
                        style={{ padding: '8px 16px', fontSize: '12px' }}
                        onClick={() => handleResolve(d.id)}
                      >
                        Approve Resolution &amp; Disburse Escrow &rarr;
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 600 }}>
                        Resolution executed on digital ledger. Escrow settled.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: ENTITY VERIFICATION QUEUE */}
      {activeTab === 'verifications' && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">KYC &amp; Statutory Compliance Review</p>
              <h2>Pending FPO &amp; Institutional Buyer Accreditations</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#667269' }}>
                Audit incorporation certificates, FSSAI licenses, and APMC trader bonds before issuing platform trading permission.
              </p>
            </div>
            <span className="count">{verifications.length} Pending</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginTop: '16px' }}>
            {verifications.map((v) => {
              const isVerified = v.status === 'VERIFIED';
              return (
                <div
                  key={v.id}
                  style={{
                    border: '1px solid #d4dfd4',
                    borderRadius: '8px',
                    padding: '16px',
                    background: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", fontWeight: 700, background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '3px' }}>
                          {v.type}
                        </span>
                        <h3 style={{ margin: '4px 0 2px', fontSize: '16px', color: '#202a27' }}>
                          {v.name}
                        </h3>
                        <span style={{ fontSize: '12px', color: '#68776b' }}>
                          {v.district} · {v.regNo}
                        </span>
                      </div>
                      <span style={{ background: isVerified ? '#dcfce7' : '#fef3c7', color: isVerified ? '#15803d' : '#92400e', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        {v.status}
                      </span>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '8px 10px', margin: '10px 0', fontSize: '11px' }}>
                      <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Submitted Documents:</span>
                      {(v.docs || []).map((doc, idx) => (
                        <span key={idx} style={{ display: 'block', color: '#2563eb' }}>
                          Doc: {doc} (Signed)
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    {!isVerified ? (
                      <button
                        type="button"
                        className="trade-btn trade-btn-primary"
                        style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                        onClick={() => handleVerify(v.id)}
                      >
                        Verify &amp; Issue NABL Green Badge
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="trade-btn trade-btn-secondary"
                        style={{ width: '100%', padding: '8px', fontSize: '12px', color: '#15803d' }}
                        disabled
                      >
                        Verified &amp; Accredited
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
