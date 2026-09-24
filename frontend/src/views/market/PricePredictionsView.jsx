import React from 'react';

/**
 * PricePredictionsView — ML 7-Day Price Forecasts & Confidence Interval Bands
 */
export default function PricePredictionsView({
  forecast,
  crops = [],
  selectedPulseCropId,
  pulseCrop,
  onCropChange
}) {
  return (
    <div className="view-container">
      <section className="panel" style={{ marginTop: '18px' }}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Statistical Machine Intelligence &amp; Volatility</p>
            <h2>Price Forecasting &amp; Confidence Bands</h2>
          </div>
          <span className="count">{forecast ? `${forecast.confidenceScore}% Certainty` : 'Analyzing'}</span>
        </div>

        <div className="pulse-controls" style={{ marginTop: '14px', maxWidth: '400px' }}>
          <select
            value={selectedPulseCropId || ''}
            onChange={(e) => onCropChange && onCropChange(e.target.value)}
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
                    {forecast.trend === 'UPWARD' ? '↔ Bullish' : forecast.trend === 'DOWNWARD' ? '↘ Bearish' : '→ Stable'}
                  </strong>
                  <small style={{ font: "9px 'DM Mono', monospace", textTransform: 'uppercase', color: '#667269' }}>
                    {forecast.volatilityLevel} Volatility · {forecast.historicalPointsCount} points
                  </small>
                </div>
              </div>

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
                <strong>Methodology:</strong> {forecast.methodology}
              </p>
            </div>

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
                        {fp.trend === 'UPWARD' ? '↔' : fp.trend === 'DOWNWARD' ? '↘' : '→'}
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
  );
}
