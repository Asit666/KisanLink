import React, { useState } from 'react';

export default function FarmerPayoutsLedgerView({
  farmerId = 'FMR-FPO42-001',
  farmerName = 'Ramesh Kumar',
  intakes,
  collectionSchedule,
  onNotifyHarvest
}) {
  const [selectedIntakeSlip, setSelectedIntakeSlip] = useState(null);
  const [isNotifyingHarvest, setIsNotifyingHarvest] = useState(false);
  const [harvestNotification, setHarvestNotification] = useState({
    crop: 'Tomato',
    estQuantityKg: 400,
    readyDate: '11 Sep 2026',
    pickupRequired: true,
    village: 'Pimpalgaon Baswant'
  });
  const [noticeMessage, setNoticeMessage] = useState('');

  // Filter intakes belonging to this farmer
  const myIntakes = (intakes || []).filter(i => i.farmerId === farmerId);

  const totalKg = myIntakes.reduce((sum, i) => sum + Number(i.netWeightKg || 0), 0);
  const totalPaid = myIntakes
    .filter(i => i.payoutStatus === 'PAID')
    .reduce((sum, i) => sum + Number(i.totalPayoutDue || 0), 0);
  const pendingAmount = myIntakes
    .filter(i => i.payoutStatus !== 'PAID')
    .reduce((sum, i) => sum + Number(i.totalPayoutDue || 0), 0);

  function handleHarvestSubmit(e) {
    e.preventDefault();
    if (onNotifyHarvest) {
      onNotifyHarvest(harvestNotification);
    }
    setNoticeMessage(`Harvest alert sent to Sahyadri FPO logistics desk! Expect pickup confirmation via SMS on ${harvestNotification.readyDate}.`);
    setIsNotifyingHarvest(false);
  }

  return (
    <div className="view-container">
      {/* Smallholder Account Banner */}
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
            fontSize: '13px'
          }}>
            FMR
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                {farmerName} · Harvest Ledger &amp; Escrow Disbursals
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
                ID: {farmerId}
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
                Bank KYC Verified
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
              Direct escrow settlement to State Bank of India (A/C: ****4812 · IFSC: SBIN0001234 · UPI: ramesh.farmer@oksbi)
            </p>
          </div>
        </div>

        <button
          type="button"
          className="trade-btn trade-btn-primary"
          style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 500 }}
          onClick={() => setIsNotifyingHarvest(true)}
        >
          + Notify Upcoming Harvest
        </button>
      </div>

      {noticeMessage && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#166534',
          padding: '10px 14px',
          borderRadius: '6px',
          fontSize: '12px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{noticeMessage}</span>
          <button
            type="button"
            className="text-button"
            style={{ color: '#166534', fontWeight: 600 }}
            onClick={() => setNoticeMessage('')}
          >
            Close
          </button>
        </div>
      )}

      {/* Financial Overview KPIs */}
      <div className="kpi-metrics-grid" style={{
        marginBottom: '20px'
      }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 14px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Mono', monospace" }}>
            Total Harvest Delivered
          </span>
          <strong style={{ display: 'block', fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '4px 0 2px' }}>
            {totalKg.toLocaleString()} kg ({(totalKg / 1000).toFixed(2)} T)
          </strong>
          <small style={{ fontSize: '11px', color: '#64748b' }}>
            {myIntakes.length} certified deliveries
          </small>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 14px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Mono', monospace" }}>
            Disbursed to Bank Account
          </span>
          <strong style={{ display: 'block', fontSize: '18px', fontWeight: 700, color: '#166534', margin: '4px 0 2px' }}>
            ₹{totalPaid.toLocaleString()}
          </strong>
          <small style={{ fontSize: '11px', color: '#64748b' }}>
            100% Direct via IMPS / UPI
          </small>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 14px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Mono', monospace" }}>
            In Escrow / Pending Sale
          </span>
          <strong style={{ display: 'block', fontSize: '18px', fontWeight: 700, color: '#0369a1', margin: '4px 0 2px' }}>
            ₹{pendingAmount.toLocaleString()}
          </strong>
          <small style={{ fontSize: '11px', color: '#64748b' }}>
            Locked in bank escrow
          </small>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 14px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "'DM Mono', monospace" }}>
            Net Rate Realization
          </span>
          <strong style={{ display: 'block', fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '4px 0 2px' }}>
            ₹17.00 / kg Avg
          </strong>
          <small style={{ fontSize: '11px', color: '#166534' }}>
            +18% higher than APMC Mandi
          </small>
        </div>
      </div>

      {/* Main Realization Ledger */}
      <section className="panel" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '20px' }}>
        <div className="panel-heading" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Harvest Inflows &amp; Transparent Payout Ledger
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
              Every rupee accounted for: Gross Institutional Buyer Price minus audited FPO operating charge.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', font: "11px 'DM Mono', monospace", textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Slip ID &amp; Date</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Crop &amp; Grade</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Net Delivered</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Institutional Lot &amp; Buyer</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Gross Price</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>FPO Fee</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Net Price / kg</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Total Payout</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>Disbursal Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {myIntakes.map((item) => {
                const isPaid = item.payoutStatus === 'PAID';
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: '#334155', display: 'block' }}>
                        {item.intakeId}
                      </span>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>{item.intakeTimestamp}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <strong style={{ color: '#0f172a' }}>{item.cropName}</strong>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                        {item.variety} · {item.grade?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                      {item.netWeightKg} kg
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {item.lotId ? (
                        <>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#0369a1', fontWeight: 600, display: 'block' }}>
                            {item.lotId}
                          </span>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>
                            {item.buyerName || 'Verified Institutional Buyer'}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Awaiting Pooling</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>
                      {item.grossBuyerRate ? `₹${item.grossBuyerRate.toFixed(2)}` : `₹${item.indicativeBaseRate.toFixed(2)} (Base)`}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#dc2626' }}>
                      -₹{item.fpoFeeRate.toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#166534' }}>
                      ₹{item.netFarmerRate ? item.netFarmerRate.toFixed(2) : (item.indicativeBaseRate - 1).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                      ₹{Number(item.totalPayoutDue).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {isPaid ? (
                        <div>
                          <span style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                            PAID
                          </span>
                          <span style={{ display: 'block', fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#64748b', marginTop: '2px' }}>
                            {item.utrNumber}
                          </span>
                        </div>
                      ) : (
                        <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>
                          {item.payoutStatus?.replace(/_/g, ' ')}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="trade-btn trade-btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => setSelectedIntakeSlip(item)}
                      >
                        Challan
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Upcoming Village Collection Schedule */}
      <section className="panel" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <div className="panel-heading" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Village Aggregation Drives &amp; Collection Schedule
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
              Planned collection dates at local village centers. Zero transportation to distant APMC mandis.
            </p>
          </div>
        </div>

        <div className="responsive-cards-grid" style={{ marginTop: '14px' }}>
          {(collectionSchedule || []).map((drive) => (
            <div key={drive.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>{drive.centerName}</strong>
                <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '3px', fontWeight: 600 }}>
                  {drive.status}
                </span>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#64748b' }}>
                {drive.address}
              </p>
              <div style={{ fontSize: '11px', color: '#334155', marginBottom: '4px' }}>
                <strong>Date &amp; Time:</strong> {drive.date} ({drive.timeSlot})
              </div>
              <div style={{ fontSize: '11px', color: '#334155', marginBottom: '6px' }}>
                <strong>Accepted Produce:</strong> {drive.targetCrops.join(', ')}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '6px' }}>
                Weigh Scale Operator: {drive.weighScaleOperator}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Slip Modal */}
      {selectedIntakeSlip && (
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
            padding: '24px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", fontWeight: 700, color: '#334155' }}>
                  Delivery Slip Reference
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '17px', color: '#0f172a' }}>{selectedIntakeSlip.intakeId}</h3>
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
                onClick={() => setSelectedIntakeSlip(null)}
                aria-label="Close"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div style={{ fontSize: '12px', lineHeight: 1.6, marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Crop &amp; Variety:</span>
                <strong>{selectedIntakeSlip.cropName} ({selectedIntakeSlip.variety})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Net Certified Weight:</span>
                <strong style={{ color: '#166534' }}>{selectedIntakeSlip.netWeightKg} kg</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Net Rate Credited:</span>
                <strong>₹{selectedIntakeSlip.netFarmerRate ? selectedIntakeSlip.netFarmerRate.toFixed(2) : '17.00'} / kg</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Total Payout:</span>
                <strong style={{ fontSize: '14px', color: '#166534' }}>₹{Number(selectedIntakeSlip.totalPayoutDue).toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Bank Settlement:</span>
                <span>{selectedIntakeSlip.paymentMethod}</span>
              </div>
              {selectedIntakeSlip.utrNumber && (
                <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '4px', marginTop: '6px', fontSize: '11px', fontFamily: "'DM Mono', monospace", color: '#334155' }}>
                  Banking Reference: {selectedIntakeSlip.utrNumber} (Settled on {selectedIntakeSlip.payoutDate})
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="trade-btn trade-btn-secondary"
                style={{ padding: '8px 14px', fontSize: '12px' }}
                onClick={() => window.print()}
              >
                Print Challan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notify Harvest Modal */}
      {isNotifyingHarvest && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a' }}>
                Notify FPO of Upcoming Harvest
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
                onClick={() => setIsNotifyingHarvest(false)}
                aria-label="Close"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleHarvestSubmit}>
              <label style={{ fontSize: '12px', color: '#334155' }}>Crop Ready for Harvest
                <select
                  value={harvestNotification.crop}
                  onChange={(e) => setHarvestNotification({ ...harvestNotification, crop: e.target.value })}
                >
                  <option value="Tomato">Tomato</option>
                  <option value="Onion">Onion</option>
                  <option value="Soybean">Soybean</option>
                  <option value="Grapes">Grapes</option>
                </select>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ fontSize: '12px', color: '#334155' }}>Estimated Quantity (kg)
                  <input
                    type="number"
                    step="50"
                    value={harvestNotification.estQuantityKg}
                    onChange={(e) => setHarvestNotification({ ...harvestNotification, estQuantityKg: e.target.value })}
                    required
                  />
                </label>
                <label style={{ fontSize: '12px', color: '#334155' }}>Target Ready Date
                  <input
                    value={harvestNotification.readyDate}
                    onChange={(e) => setHarvestNotification({ ...harvestNotification, readyDate: e.target.value })}
                    required
                  />
                </label>
              </div>

              <label style={{ fontSize: '12px', color: '#334155' }}>Village Farm Parcel Location
                <input
                  value={harvestNotification.village}
                  onChange={(e) => setHarvestNotification({ ...harvestNotification, village: e.target.value })}
                  required
                />
              </label>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <button type="button" className="trade-btn trade-btn-secondary" style={{ padding: '8px 14px', fontSize: '12px' }} onClick={() => setIsNotifyingHarvest(false)}>
                  Cancel
                </button>
                <button type="submit" className="trade-btn trade-btn-primary" style={{ padding: '8px 14px', fontSize: '12px' }}>
                  Send Harvest Alert to FPO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
