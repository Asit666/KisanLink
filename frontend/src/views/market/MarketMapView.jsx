import React from 'react';

/**
 * MarketMapView — Geographical Market Discovery, Radar & Freight Navigation
 */
export default function MarketMapView({
  text = {},
  nearbyMarkets = [],
  mapRadius = 150,
  mapCoords = { label: 'Ranchi Center', lat: 23.3441, lon: 85.3096 },
  onLocationPreset,
  session,
  onUseProfileLocation,
  selectedMapMarket,
  onSelectMapMarket,
  mapLoading
}) {
  return (
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
            {text.weatherOrigin || 'Location:'} <strong>{mapCoords.label}</strong>
          </span>
          <button
            type="button"
            className={`location-pill ${mapCoords.label === 'Ranchi Center' ? 'active' : ''}`}
            onClick={() => onLocationPreset && onLocationPreset(23.3441, 85.3096, 'Ranchi Center')}
          >
            Ranchi
          </button>
          <button
            type="button"
            className={`location-pill ${mapCoords.label === 'Ramgarh' ? 'active' : ''}`}
            onClick={() => onLocationPreset && onLocationPreset(23.6332, 85.5149, 'Ramgarh')}
          >
            Ramgarh
          </button>
          <button
            type="button"
            className={`location-pill ${mapCoords.label === 'Bokaro' ? 'active' : ''}`}
            onClick={() => onLocationPreset && onLocationPreset(23.6693, 86.1511, 'Bokaro')}
          >
            Bokaro
          </button>
          <button
            type="button"
            className={`location-pill ${mapCoords.label === 'Jamshedpur' ? 'active' : ''}`}
            onClick={() => onLocationPreset && onLocationPreset(22.8046, 86.2029, 'Jamshedpur')}
          >
            Jamshedpur
          </button>
          {session && (
            <button
              type="button"
              className="location-pill"
              style={{ background: '#dce7d3', color: '#3d5940', borderColor: '#b8cba8' }}
              onClick={onUseProfileLocation}
            >
              {text.weatherUseGps || 'Use My GPS'}
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
                    onClick={() => onSelectMapMarket && onSelectMapMarket(m)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={mx}
                      cy={my}
                      r={isSelected ? '7' : '5'}
                      fill={pinColor}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? '2' : '1'}
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
                    onClick={() => onSelectMapMarket && onSelectMapMarket(market)}
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
  );
}
