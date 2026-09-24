import React, { useState } from 'react';
import { getLocalizedText } from '../../i18n/translations';

/**
 * SupportNetworkView — Institutional & Expert Field Directory (KVK, Agronomists, Soil Labs)
 */
export default function SupportNetworkView({
  text = {},
  language = 'en',
  supportDirectoryData = [],
  selectedSupportNode,
  onSelectSupportNode,
  onOpenGoogleMapModal,
  onShowMessage
}) {
  const [supportCategoryFilter, setSupportCategoryFilter] = useState('ALL');
  const [supportSearchQuery, setSupportSearchQuery] = useState('');
  const [supportMapViewMode, setSupportMapViewMode] = useState('RADAR');

  return (
    <div className="view-container">
      <section className="panel" style={{ marginTop: '18px' }}>
        <div className="panel-heading" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p className="eyebrow">{text.supportSectionTitle || 'INSTITUTIONAL & EXPERT FIELD DIRECTORY'}</p>
            <h2>{text.supportSectionTitle || 'Agronomic Support Network & KVKs'}</h2>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
              {text.supportSectionSubtitle || 'Verified public Krishi Vigyan Kendras, certified agronomists, and government soil testing laboratories.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="count" style={{ background: '#202a27', color: '#f6f5f0', fontSize: '11px' }}>
              {supportDirectoryData.filter(n => n.type === 'GOVT_KVK').length} {text.supportCenters || 'KVK Centers'}
            </span>
            <span className="count" style={{ background: '#2f6838', color: '#f6f5f0', fontSize: '11px' }}>
              {supportDirectoryData.filter(n => n.type === 'AGRONOMIST').length} {text.supportAgronomists || 'Agronomists'}
            </span>
            <span className="count" style={{ background: '#35453e', color: '#f6f5f0', fontSize: '11px' }}>
              {supportDirectoryData.filter(n => n.type === 'SOIL_LAB').length} {text.supportSoilLabs || 'Soil Labs'}
            </span>
          </div>
        </div>

        <div className="marketplace-toolbar" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <input
                type="text"
                className="field-input"
                placeholder={text.supportSearchPlaceholder || 'Search center name, district, specialist, or service...'}
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
                {text.supportRadarViewLabel || 'PROXIMITY & FIELD COVERAGE RADAR'}
              </span>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#ffffff', fontWeight: 600 }}>
                {supportMapViewMode === 'RADAR'
                  ? (text.supportRadarSubtitle || 'Interactive Proximity Map of Agronomic Support within 30km radius')
                  : `${text.supportMapSubtitle || 'Live Google Maps Location'}: ${supportDirectoryData.find(n => n.id === selectedSupportNode)?.name || text.supportSectionTitle || 'Center'}`}
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
                  {text.supportRadarViewBtn || 'Radius Radar'}
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
                  {text.supportGoogleMapBtn || 'Google Maps View'}
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
                  {text.supportYourFarm || 'Your Farm'}
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
                      if (onSelectSupportNode) onSelectSupportNode(node.id);
                      if (onOpenGoogleMapModal) onOpenGoogleMapModal(node);
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
                if (!activeNode) return null;
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
                        {text.supportOpenMap || 'Open Google Maps ↗'}
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
                        ★ {node.rating} &middot; {node.distanceKm} km
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
                        <span>{text.supportLead || 'Desk In-Charge:'} <strong>{node.inCharge}</strong></span>
                      </div>
                      <div style={{ font: "10px 'DM Mono', monospace", color: '#778078', marginTop: '2px' }}>
                        {text.supportHours || 'Operating Hours:'} {node.hours}
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
                          if (onShowMessage) onShowMessage(`Direct helpline: ${node.phone}`);
                        }
                      }}
                    >
                      {text.supportCallDesk || 'Call'} {node.phone}
                    </a>

                    <button
                      type="button"
                      className="trade-btn trade-btn-secondary"
                      style={{ flex: '0 0 auto', padding: '7px 12px', fontSize: '11px', fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}
                      title="View on Google Maps"
                      onClick={() => {
                        if (onSelectSupportNode) onSelectSupportNode(node.id);
                        if (onOpenGoogleMapModal) onOpenGoogleMapModal(node);
                      }}
                    >
                      {text.supportGoogleMapAction || 'Google Maps'}
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
  );
}
