import React from 'react';

/**
 * AgroWeatherView — Weather Advisory, Harvest Windows & 5-Day Forecast
 */
export default function AgroWeatherView({
  text = {},
  weatherData,
  weatherLoading,
  weatherError,
  mapCoords = { label: 'Ranchi Center', lat: 23.3441, lon: 85.3096 },
  onLocationPreset,
  session,
  onUseProfileLocation,
  weatherCropId,
  onWeatherCropChange,
  crops = []
}) {
  return (
    <div className="view-container">
      <section className="panel" style={{ marginTop: '18px' }}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{text.weatherEyebrow || 'Agricultural Meteorology & Harvest Advisories'}</p>
            <h2>{text.weatherTitle || 'Agro-Weather Intelligence'}</h2>
          </div>
          <span className="count">{weatherData?.harvestSuitability || text.weatherAnalyzing || 'Analyzing'}</span>
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

        <div className="pulse-controls" style={{ marginTop: '10px', maxWidth: '380px' }}>
          <select
            value={weatherCropId || ''}
            onChange={(e) => onWeatherCropChange && onWeatherCropChange(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{text.weatherGeneralConditions || 'General Conditions (All Crops)'}</option>
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.category})
              </option>
            ))}
          </select>
        </div>

        {weatherLoading ? (
          <p className="muted" style={{ padding: '24px 0' }}>{text.weatherLoading || 'Loading weather data...'}</p>
        ) : weatherData ? (
          <>
            <div className="weather-hero-card">
              <div>
                <p className="eyebrow">{weatherData.locationName} · GPS {weatherData.latitude.toFixed(2)}°N, {weatherData.longitude.toFixed(2)}°E</p>
                <h3>{weatherData.currentTemp}°C</h3>
                <p style={{ margin: '6px 0 0', font: "11px 'DM Mono', monospace", color: '#b9c5b7', textTransform: 'uppercase' }}>
                  {text.weatherCondition || 'Condition'}: <strong>{(weatherData.currentCondition || '').replace(/_/g, ' ')}</strong>
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="count" style={{ background: '#35453e', color: '#fffaf1' }}>
                  {text.weatherSuitability || 'Suitability'}: {weatherData.harvestSuitability}
                </span>
              </div>
            </div>

            <div className="weather-grid-metrics">
              <div className="weather-metric-item">
                <span>{text.weatherHumidity || 'Humidity'}</span>
                <strong>{weatherData.humidityPercent}%</strong>
              </div>
              <div className="weather-metric-item">
                <span>{text.weatherRainfall || 'Rainfall'}</span>
                <strong>{weatherData.rainfallMm} mm</strong>
              </div>
              <div className="weather-metric-item">
                <span>{text.weatherWind || 'Wind'}</span>
                <strong>{weatherData.windSpeedKmh} km/h</strong>
              </div>
              <div className="weather-metric-item">
                <span>{text.weatherSuitability || 'Suitability'}</span>
                <strong style={{ color: weatherData.harvestSuitability === 'EXCELLENT' ? '#5a8e62' : weatherData.harvestSuitability === 'HAZARDOUS' ? '#b45a42' : '#202a27' }}>
                  {weatherData.harvestSuitability}
                </strong>
              </div>
            </div>

            <div className="two-col-view-layout" style={{ marginTop: '16px' }}>
              <div>
                <div className="harvest-box">
                  <h4>{text.weatherHarvestWindow || 'Harvest Window'}</h4>
                  <p><strong>{weatherData.recommendedHarvestWindow}</strong></p>
                </div>

                <div className="spoilage-card">
                  <div className="spoilage-header">
                    <h4>{text.weatherSpoilageRisk || 'Transit Spoilage Risk'}</h4>
                    <span className={`spoilage-badge spoilage-${weatherData.spoilageRiskIndex?.toLowerCase() || 'low'}`}>
                      {weatherData.spoilageRiskIndex} {text.weatherRisk || 'Risk'}
                    </span>
                  </div>
                  <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#5a665e', lineHeight: '1.5' }}>
                    {weatherData.transitAdvisory}
                  </p>
                </div>
              </div>

              <div className="advisory-list-box">
                <p style={{ margin: 0, font: "10px 'DM Mono', monospace", textTransform: 'uppercase', color: '#7f8981', fontWeight: 'bold' }}>
                  {text.weatherGuidelines || 'Agronomic Advisories'}
                </p>
                <ul>
                  {weatherData.cropAdvisories?.map((adv, idx) => (
                    <li key={idx}>{adv}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <p style={{ margin: '0 0 8px', font: "10px 'DM Mono', monospace", textTransform: 'uppercase', color: '#5a665e', fontWeight: 'bold' }}>
                {text.weatherForecast || '5-Day Forecast'}
              </p>
              <div className="five-day-forecast-grid">
                {weatherData.forecast?.map((day) => (
                  <div className="forecast-card-item" key={day.date}>
                    <span className="f-day">{day.dayName}</span>
                    <div className="f-temp">{day.tempMax}° / {day.tempMin}°</div>
                    <span className="f-rain">{day.precipitationProbability}% {text.weatherRain || 'Rain'} · {(day.condition || '').replace(/_/g, ' ')}</span>
                    <div className="f-adv">{day.advisory}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="muted" style={{ padding: '24px 0' }}>
            {weatherError || text.weatherUnavailable || 'Weather advisory data temporarily unavailable.'}
          </p>
        )}
      </section>
    </div>
  );
}
