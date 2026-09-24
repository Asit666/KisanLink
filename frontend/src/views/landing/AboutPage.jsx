import React, { useState } from 'react';
import './AboutPage.css';
import { ABOUT_TRANSLATIONS } from './aboutTranslations';

export default function AboutPage({
  session = null,
  language: externalLanguage,
  onLanguageChange,
  onLaunchApp = () => {},
  onSignIn = () => {},
  onSignUp = () => {},
  onBackToApp = () => {}
}) {
  const [internalLang, setInternalLang] = useState(() => {
    try {
      return localStorage.getItem('kisanlinkLanguage') || 'en';
    } catch {
      return 'en';
    }
  });

  const lang = externalLanguage || internalLang;

  const handleLangChange = (newLang) => {
    setInternalLang(newLang);
    try {
      localStorage.setItem('kisanlinkLanguage', newLang);
      document.documentElement.className = 'lang-' + newLang;
      document.documentElement.setAttribute('lang', newLang);
    } catch {
      // ignore
    }
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
  };

  const t = ABOUT_TRANSLATIONS[lang] || ABOUT_TRANSLATIONS.en;
  const [activePillar, setActivePillar] = useState('farmer');
  const [isExiting, setIsExiting] = useState(false);

  const activeLangIndex = lang === 'mr' ? 2 : lang === 'hi' ? 1 : 0;

  const scrollToAnchor = (id) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSignInTransition = (mode = 'login') => {
    if (mode === 'register') {
      onSignUp();
    } else {
      onSignIn();
    }
  };

  return (
    <div className={`kl-orig-root kl-lang-scope-${lang} ${isExiting ? 'kl-about-exiting' : ''}`}>
      {/* Session Return Bar if Authenticated */}
      {session && (
        <aside className="kl-orig-session-bar" aria-label="Session status">
          <div>
            {t.sessionLoggedIn} <strong>{session.name || session.phone || 'User'}</strong> ({session.role || 'Member'})
          </div>
          <button type="button" className="kl-orig-btn-signin" style={{ padding: '4px 12px', fontSize: '11px' }} onClick={onBackToApp}>
            {t.navReturnMarket}
          </button>
        </aside>
      )}

      {/* Navigation Header Matching Original Theme */}
      <header className="kl-orig-nav-wrapper">
        <div className="kl-orig-nav-inner">
          <div className="kl-orig-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="kl-orig-brand-mark">K</div>
            <span className="kl-orig-brand-name">KisanLink</span>
          </div>

          <nav className="kl-orig-nav-menu" aria-label="Main Navigation">
            <button type="button" className="kl-orig-nav-link" onClick={() => scrollToAnchor('problem')}>
              {t.navProblem}
            </button>
            <button type="button" className="kl-orig-nav-link" onClick={() => scrollToAnchor('offering')}>
              {t.navOffering}
            </button>
            <button type="button" className="kl-orig-nav-link" onClick={() => scrollToAnchor('who-its-for')}>
              {t.navWhoItsFor}
            </button>
          </nav>

          <div className="kl-orig-nav-actions">
            {/* Language Switcher with Sliding Indicator */}
            <div className="kl-lang-switch" role="group" aria-label="Language selector">
              <span
                className="kl-lang-slider"
                style={{ transform: `translateX(${activeLangIndex * 100}%)` }}
                aria-hidden="true"
              />
              <button
                type="button"
                className={`kl-lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => handleLangChange('en')}
                title="English"
              >
                EN
              </button>
              <button
                type="button"
                className={`kl-lang-btn ${lang === 'hi' ? 'active' : ''}`}
                onClick={() => handleLangChange('hi')}
                title="हिन्दी"
              >
                हिन्दी
              </button>
              <button
                type="button"
                className={`kl-lang-btn ${lang === 'mr' ? 'active' : ''}`}
                onClick={() => handleLangChange('mr')}
                title="मराठी"
              >
                मराठी
              </button>
            </div>

            {session ? (
              <button type="button" className="kl-orig-btn-primary" onClick={onBackToApp}>
                <span>{t.navMarketDesk}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            ) : (
              <>
                <button type="button" className="kl-orig-btn-signin" onClick={() => handleSignInTransition('login')}>
                  {t.navSignIn}
                </button>
                <button type="button" className="kl-orig-btn-primary" onClick={() => handleSignInTransition('register')}>
                  <span>{t.navExplore}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content with Silky Smooth Language Transition */}
      <main key={lang} className="kl-lang-animated-content">
        {/* Hero Stage - Clean, Elegant, Focused */}
        <section className="kl-orig-hero-stage">
        {/* Decorative leaf watermark SVG */}
        <svg className="kl-orig-hero-leaf-deco" viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M100 400 C100 300 20 250 20 150 C20 67 67 20 150 20 C150 20 180 100 180 200 C180 320 100 400 100 400Z" fill="#4caf6e" />
          <path d="M100 400 L100 150" stroke="#2f7d45" strokeWidth="3" />
          <path d="M100 300 C130 260 160 220 180 180" stroke="#2f7d45" strokeWidth="2" />
          <path d="M100 250 C70 210 50 180 30 150" stroke="#2f7d45" strokeWidth="2" />
        </svg>

        <div className="kl-orig-hero-inner">
          <h1 className="kl-orig-hero-tagline">
            {t.heroTagline1}<br />
            <em>{t.heroTagline2}</em>
          </h1>

          <p className="kl-orig-hero-sub">
            {t.heroSub}
          </p>

          <div className="kl-orig-hero-cta-group">
            <button
              type="button"
              className="kl-orig-btn-primary kl-btn-hero-primary"
              onClick={() => (session ? onBackToApp() : onLaunchApp('FARMER'))}
            >
              <span>{t.heroCtaExplore}</span>
            </button>

            <button
              type="button"
              className="kl-orig-btn-signin kl-btn-hero-secondary"
              onClick={() => scrollToAnchor('problem')}
            >
              <span>{t.heroCtaProblem}</span>
            </button>
          </div>

          <div className="kl-hero-feature-pills">
            <span className="kl-hero-feature-pill">{t.pillRates}</span>
            <span className="kl-hero-feature-pill">{t.pillProfit}</span>
            <span className="kl-hero-feature-pill">{t.pillPayment}</span>
            <span className="kl-hero-feature-pill">{t.pillBulk}</span>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          SECTION 1: THE PROBLEM WE ARE SOLVING
          ========================================================================== */}
      <section id="problem" className="kl-orig-section">
        <span className="kl-orig-section-tag">{t.sec1Tag}</span>
        <h2 className="kl-orig-section-h2">{t.sec1Title}</h2>
        <p className="kl-orig-section-desc">
          {t.sec1Desc}
        </p>

        {/* 3 Core Problem Cards */}
        <div className="kl-problem-cards-grid">
          <div className="kl-problem-card">
            <div className="kl-problem-card-num">{t.prob1Num}</div>
            <h3>{t.prob1Title}</h3>
            <p>{t.prob1Desc}</p>
            <div className="kl-problem-tag">{t.prob1Tag}</div>
          </div>

          <div className="kl-problem-card">
            <div className="kl-problem-card-num">{t.prob2Num}</div>
            <h3>{t.prob2Title}</h3>
            <p>{t.prob2Desc}</p>
            <div className="kl-problem-tag">{t.prob2Tag}</div>
          </div>

          <div className="kl-problem-card">
            <div className="kl-problem-card-num">{t.prob3Num}</div>
            <h3>{t.prob3Title}</h3>
            <p>{t.prob3Desc}</p>
            <div className="kl-problem-tag">{t.prob3Tag}</div>
          </div>
        </div>
      </section>

      <div className="kl-orig-divider" />

      {/* ==========================================================================
          SECTION 2: WHAT WE OFFER
          ========================================================================== */}
      <section id="offering" className="kl-orig-section">
        <span className="kl-orig-section-tag">{t.sec2Tag}</span>
        <h2 className="kl-orig-section-h2">{t.sec2Title}</h2>
        <p className="kl-orig-section-desc">
          {t.sec2Desc}
        </p>

        {/* 4 Innovation Pillars Grid */}
        <div className="kl-offering-grid">
          <div className="kl-offering-card">
            <div className="kl-offering-badge">{t.offering1Badge}</div>
            <h3>{t.offering1Title}</h3>
            <p>{t.offering1Desc}</p>
            <div className="kl-offering-highlight">
              {t.offering1Hl}
            </div>
          </div>

          <div className="kl-offering-card">
            <div className="kl-offering-badge">{t.offering2Badge}</div>
            <h3>{t.offering2Title}</h3>
            <p>{t.offering2Desc}</p>
            <div className="kl-offering-highlight">
              {t.offering2Hl}
            </div>
          </div>

          <div className="kl-offering-card">
            <div className="kl-offering-badge">{t.offering3Badge}</div>
            <h3>{t.offering3Title}</h3>
            <p>{t.offering3Desc}</p>
            <div className="kl-offering-highlight">
              {t.offering3Hl}
            </div>
          </div>

          <div className="kl-offering-card">
            <div className="kl-offering-badge">{t.offering4Badge}</div>
            <h3>{t.offering4Title}</h3>
            <p>{t.offering4Desc}</p>
            <div className="kl-offering-highlight">
              {t.offering4Hl}
            </div>
          </div>
        </div>
      </section>

      <div className="kl-orig-divider" />

      {/* ==========================================================================
          SECTION 3: WHO IT'S FOR
          ========================================================================== */}
      <section id="who-its-for" className="kl-orig-section">
        <span className="kl-orig-section-tag">{t.sec3Tag}</span>
        <h2 className="kl-orig-section-h2">{t.sec3Title}</h2>
        <p className="kl-orig-section-desc">
          {t.sec3Desc}
        </p>

        {/* Role Cards Grid */}
        <div className="kl-role-grid">
          <button
            type="button"
            className={`kl-role-card ${activePillar === 'farmer' ? 'active' : ''}`}
            onClick={() => setActivePillar('farmer')}
          >
            <span className="kl-role-card-title">{t.roleFarmer}</span>
            <span className="kl-role-card-desc">{t.roleFarmerSub}</span>
          </button>
          <button
            type="button"
            className={`kl-role-card ${activePillar === 'fpo' ? 'active' : ''}`}
            onClick={() => setActivePillar('fpo')}
          >
            <span className="kl-role-card-title">{t.roleFpo}</span>
            <span className="kl-role-card-desc">{t.roleFpoSub}</span>
          </button>
          <button
            type="button"
            className={`kl-role-card ${activePillar === 'buyer' ? 'active' : ''}`}
            onClick={() => setActivePillar('buyer')}
          >
            <span className="kl-role-card-title">{t.roleBuyer}</span>
            <span className="kl-role-card-desc">{t.roleBuyerSub}</span>
          </button>
          <button
            type="button"
            className={`kl-role-card ${activePillar === 'transporter' ? 'active' : ''}`}
            onClick={() => setActivePillar('transporter')}
          >
            <span className="kl-role-card-title">{t.roleTransporter}</span>
            <span className="kl-role-card-desc">{t.roleTransporterSub}</span>
          </button>
        </div>

        {/* Role Detail Stage */}
        <div className="kl-orig-pillar-stage">
          {activePillar === 'farmer' && (
            <>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
                  {t.farmerDeskTitle}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
                  {t.farmerDeskDesc}
                </p>
                <ul className="kl-orig-checklist">
                  <li className="kl-orig-check-item">
                    <span className="kl-orig-check-mark">&#10003;</span>
                    <span><strong>{t.farmerCheck1Title}</strong> {t.farmerCheck1Text}</span>
                  </li>
                  <li className="kl-orig-check-item">
                    <span className="kl-orig-check-mark">&#10003;</span>
                    <span><strong>{t.farmerCheck2Title}</strong> {t.farmerCheck2Text}</span>
                  </li>
                  <li className="kl-orig-check-item">
                    <span className="kl-orig-check-mark">&#10003;</span>
                    <span><strong>{t.farmerCheck3Title}</strong> {t.farmerCheck3Text}</span>
                  </li>
                  <li className="kl-orig-check-item">
                    <span className="kl-orig-check-mark">&#10003;</span>
                    <span><strong>{t.farmerCheck4Title}</strong> {t.farmerCheck4Text}</span>
                  </li>
                </ul>
                <button type="button" className="kl-orig-btn-primary" onClick={() => onLaunchApp('FARMER')}>
                  {t.farmerDeskBtn}
                </button>
              </div>

              <div className="kl-orig-summary-card">
                <div className="kl-summary-card-header">
                  <span className="kl-summary-card-title">{t.farmerSlipTitle}</span>
                  <span className="kl-summary-card-status">{t.farmerSlipStatus}</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.farmerSlipProducerLabel}</span>
                  <span className="value">{t.farmerSlipProducerValue}</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.farmerSlipBatchLabel}</span>
                  <span className="value">{t.farmerSlipBatchValue}</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.farmerSlipRateLabel}</span>
                  <span className="value">&#8377;23.50 / kg</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.farmerSlipFreightLabel}</span>
                  <span className="value" style={{ color: '#dc2626' }}>-&#8377;1.00 / kg</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.farmerSlipNetLabel}</span>
                  <span className="value" style={{ color: '#2f6838', fontWeight: 700 }}>&#8377;22.50 / kg</span>
                </div>
                <div className="kl-summary-total-box">
                  <div>
                    <div className="total-label">{t.farmerSlipTotalLabel}</div>
                    <div style={{ fontSize: '11px', color: '#2f6838', fontWeight: 600 }}>{t.farmerSlipTotalSub}</div>
                  </div>
                  <div className="total-value">&#8377;45,000</div>
                </div>
              </div>
            </>
          )}

          {activePillar === 'fpo' && (
            <>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
                  {t.fpoDeskTitle}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
                  {t.fpoDeskDesc}
                </p>
                <ul className="kl-orig-checklist">
                  <li className="kl-orig-check-item">
                    <span className="kl-orig-check-mark">&#10003;</span>
                    <span><strong>{t.fpoCheck1Title}</strong> {t.fpoCheck1Text}</span>
                  </li>
                  <li className="kl-orig-check-item">
                    <span className="kl-orig-check-mark">&#10003;</span>
                    <span><strong>{t.fpoCheck2Title}</strong> {t.fpoCheck2Text}</span>
                  </li>
                  <li className="kl-orig-check-item">
                    <span className="kl-orig-check-mark">&#10003;</span>
                    <span><strong>{t.fpoCheck3Title}</strong> {t.fpoCheck3Text}</span>
                  </li>
                  <li className="kl-orig-check-item">
                    <span className="kl-orig-check-mark">&#10003;</span>
                    <span><strong>{t.fpoCheck4Title}</strong> {t.fpoCheck4Text}</span>
                  </li>
                </ul>
                <button type="button" className="kl-orig-btn-primary" onClick={() => onLaunchApp('FPO')}>
                  {t.fpoDeskBtn}
                </button>
              </div>

              <div className="kl-orig-summary-card">
                <div className="kl-summary-card-header">
                  <span className="kl-summary-card-title">{t.fpoSlipTitle}</span>
                  <span className="kl-summary-card-status">{t.fpoSlipStatus}</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.fpoSlipCoopLabel}</span>
                  <span className="value">{t.fpoSlipCoopValue}</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.fpoSlipLotsLabel}</span>
                  <span className="value">{t.fpoSlipLotsValue}</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.fpoSlipVolLabel}</span>
                  <span className="value">{t.fpoSlipVolValue}</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.fpoSlipOfferLabel}</span>
                  <span className="value" style={{ color: '#2f6838', fontWeight: 700 }}>&#8377;46.20 / kg</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.fpoSlipMandiLabel}</span>
                  <span className="value">&#8377;41.50 / kg</span>
                </div>
                <div className="kl-summary-total-box">
                  <div>
                    <div className="total-label">{t.fpoSlipTotalLabel}</div>
                    <div style={{ fontSize: '11px', color: '#2f6838', fontWeight: 600 }}>{t.fpoSlipTotalSub}</div>
                  </div>
                  <div className="total-value">+&#8377;58,750</div>
                </div>
              </div>
            </>
          )}

          {activePillar === 'buyer' && (
            <>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
                  {t.buyerDeskTitle}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
                  {t.buyerDeskDesc}
                </p>
                <ul className="kl-orig-checklist">
                  <li className="kl-orig-check-item">
                    <span className="kl-orig-check-mark">&#10003;</span>
                    <span><strong>{t.buyerCheck1Title}</strong> {t.buyerCheck1Text}</span>
                  </li>
                  <li className="kl-orig-check-item">
                    <span className="kl-orig-check-mark">&#10003;</span>
                    <span><strong>{t.buyerCheck2Title}</strong> {t.buyerCheck2Text}</span>
                  </li>
                  <li className="kl-orig-check-item">
                    <span className="kl-orig-check-mark">&#10003;</span>
                    <span><strong>{t.buyerCheck3Title}</strong> {t.buyerCheck3Text}</span>
                  </li>
                  <li className="kl-orig-check-item">
                    <span className="kl-orig-check-mark">&#10003;</span>
                    <span><strong>{t.buyerCheck4Title}</strong> {t.buyerCheck4Text}</span>
                  </li>
                </ul>
                <button type="button" className="kl-orig-btn-primary" onClick={() => onLaunchApp('BUYER')}>
                  {t.buyerDeskBtn}
                </button>
              </div>

              <div className="kl-orig-summary-card">
                <div className="kl-summary-card-header">
                  <span className="kl-summary-card-title">{t.buyerSlipTitle}</span>
                  <span className="kl-summary-card-status">{t.buyerSlipStatus}</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.buyerSlipBuyerLabel}</span>
                  <span className="value">{t.buyerSlipBuyerValue}</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.buyerSlipLotLabel}</span>
                  <span className="value">{t.buyerSlipLotValue}</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.buyerSlipFarmRateLabel}</span>
                  <span className="value">&#8377;16.50 / kg</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.buyerSlipLogisticsLabel}</span>
                  <span className="value">&#8377;1.80 / kg</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.buyerSlipLandedLabel}</span>
                  <span className="value" style={{ fontWeight: 700 }}>&#8377;18.30 / kg</span>
                </div>
                <div className="kl-summary-total-box">
                  <div>
                    <div className="total-label">{t.buyerSlipTotalLabel}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{t.buyerSlipTotalSub}</div>
                  </div>
                  <div className="total-value" style={{ color: '#0f172a' }}>&#8377;1,83,000</div>
                </div>
              </div>
            </>
          )}

          {activePillar === 'transporter' && (
            <>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
                  {t.transDeskTitle}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
                  {t.transDeskDesc}
                </p>
                <ul className="kl-orig-checklist">
                  <li className="kl-orig-check-item">
                    <span className="kl-orig-check-mark">&#10003;</span>
                    <span><strong>{t.transCheck1Title}</strong> {t.transCheck1Text}</span>
                  </li>
                  <li className="kl-orig-check-item">
                    <span className="kl-orig-check-mark">&#10003;</span>
                    <span><strong>{t.transCheck2Title}</strong> {t.transCheck2Text}</span>
                  </li>
                  <li className="kl-orig-check-item">
                    <span className="kl-orig-check-mark">&#10003;</span>
                    <span><strong>{t.transCheck3Title}</strong> {t.transCheck3Text}</span>
                  </li>
                  <li className="kl-orig-check-item">
                    <span className="kl-orig-check-mark">&#10003;</span>
                    <span><strong>{t.transCheck4Title}</strong> {t.transCheck4Text}</span>
                  </li>
                </ul>
                <button type="button" className="kl-orig-btn-primary" onClick={() => onLaunchApp('TRANSPORTER')}>
                  {t.transDeskBtn}
                </button>
              </div>

              <div className="kl-orig-summary-card">
                <div className="kl-summary-card-header">
                  <span className="kl-summary-card-title">{t.transSlipTitle}</span>
                  <span className="kl-summary-card-status">{t.transSlipStatus}</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.transSlipHaulerLabel}</span>
                  <span className="value">{t.transSlipHaulerValue}</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.transSlipRouteLabel}</span>
                  <span className="value">{t.transSlipRouteValue}</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.transSlipCargoLabel}</span>
                  <span className="value">{t.transSlipCargoValue}</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.transSlipRevLabel}</span>
                  <span className="value">&#8377;5,400</span>
                </div>
                <div className="kl-summary-row">
                  <span className="label">{t.transSlipCostLabel}</span>
                  <span className="value" style={{ color: '#dc2626' }}>-&#8377;2,680</span>
                </div>
                <div className="kl-summary-total-box">
                  <div>
                    <div className="total-label">{t.transSlipTotalLabel}</div>
                    <div style={{ fontSize: '11px', color: '#2f6838', fontWeight: 600 }}>{t.transSlipTotalSub}</div>
                  </div>
                  <div className="total-value">&#8377;2,720</div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
      </main>

      {/* ==========================================================================
          CLEAN, FOCUSED FOOTER
          ========================================================================== */}
      <footer className="kl-orig-footer">
        <div className="kl-orig-footer-inner">
          <div className="kl-footer-simple-row">
            <div className="kl-footer-brand-cluster">
              <div className="kl-orig-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <div className="kl-orig-brand-mark">K</div>
                <span className="kl-orig-brand-name">KisanLink</span>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#a7c4b5', maxWidth: '420px', lineHeight: 1.6 }}>
                {t.footerBrandDesc}
              </p>
            </div>

            <div className="kl-footer-links-cluster">
              <button type="button" className="kl-orig-nav-link" onClick={() => scrollToAnchor('problem')}>
                {t.navProblem}
              </button>
              <button type="button" className="kl-orig-nav-link" onClick={() => scrollToAnchor('offering')}>
                {t.navOffering}
              </button>
              <button type="button" className="kl-orig-nav-link" onClick={() => scrollToAnchor('who-its-for')}>
                {t.navWhoItsFor}
              </button>

              {/* Language Switcher in Footer with Sliding Indicator */}
              <div className="kl-lang-switch kl-lang-switch-footer" role="group" aria-label="Language selector footer">
                <span
                  className="kl-lang-slider"
                  style={{ transform: `translateX(${activeLangIndex * 100}%)` }}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  className={`kl-lang-btn ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => handleLangChange('en')}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={`kl-lang-btn ${lang === 'hi' ? 'active' : ''}`}
                  onClick={() => handleLangChange('hi')}
                >
                  हिन्दी
                </button>
                <button
                  type="button"
                  className={`kl-lang-btn ${lang === 'mr' ? 'active' : ''}`}
                  onClick={() => handleLangChange('mr')}
                >
                  मराठी
                </button>
              </div>

              <button
                type="button"
                className="kl-orig-btn-signin kl-btn-footer-signin"
                onClick={session ? onBackToApp : () => handleSignInTransition('login')}
              >
                {session ? t.navMarketDesk : t.navSignIn}
              </button>
              <button
                type="button"
                className="kl-orig-btn-primary kl-btn-footer-primary"
                onClick={() => handleSignInTransition('register')}
              >
                {t.navExplore}
              </button>
            </div>
          </div>

          <div className="kl-orig-footer-bottom" style={{ marginTop: '28px' }}>
            <div>
              {t.footerCopy}
            </div>
            <button
              type="button"
              className="kl-footer-back-to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {t.footerBackToTop}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
