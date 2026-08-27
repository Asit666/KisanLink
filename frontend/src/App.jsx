import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8080';

function App() {
  const [crops, setCrops] = useState([]);
  const [trend, setTrend] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [role, setRole] = useState('FARMER');
  const [account, setAccount] = useState({ name: '', email: '', password: '', phone: '' });
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('kisanlinkSession') || 'null'));
  const [produce, setProduce] = useState({ cropId: 1, quantity: 500, quality: 'GRADE_A', harvestDate: '', availableUntil: '', expectedPrice: '' });
  const [requirement, setRequirement] = useState({ cropId: 1, requiredQuantity: 2000, qualityRequired: 'GRADE_A', offeredPrice: 27, validUntil: '', location: '' });
  const [produceResult, setProduceResult] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [profile, setProfile] = useState({ businessName: '', businessType: '', address: '', district: '', state: '', latitude: '', longitude: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMarketData() {
      try {
        const cropResponse = await fetch(`${API_URL}/api/crops`);
        const cropData = await cropResponse.json();
        setCrops(cropData);
        if (cropData[0]) {
          const trendResponse = await fetch(`${API_URL}/api/prices/${cropData[0].id}/trend`);
          setTrend(await trendResponse.json());
        }
      } catch {
        setMessage('Backend is unavailable. Start KisanLink on port 8080.');
      } finally {
        setLoading(false);
      }
    }
    loadMarketData();
  }, []);

  async function authenticate(event) {
    event.preventDefault();
    setMessage('');
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = authMode === 'login' ? { email: account.email, password: account.password } : { ...account, role };
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('auth');
      const data = await response.json();
      localStorage.setItem('kisanlinkToken', data.token);
      localStorage.setItem('kisanlinkSession', JSON.stringify(data));
      setSession(data);
      setMessage(authMode === 'login' ? `Welcome back, ${data.name}.` : 'Your market desk is ready.');
    } catch {
      setMessage(authMode === 'login' ? 'Login failed. Check your email and password.' : 'Registration failed. This email may already be registered.');
    }
  }

  async function addProduce(event) {
    event.preventDefault();
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/api/farmers/${session.profileId}/produce`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ ...produce, cropId: Number(produce.cropId), quantity: Number(produce.quantity), expectedPrice: produce.expectedPrice ? Number(produce.expectedPrice) : null }),
      });
      if (!response.ok) throw new Error('produce');
      const data = await response.json();
      setProduceResult(data);
      setMessage('Produce added. You can now request a buyer recommendation.');
    } catch { setMessage('Could not add produce. Check the crop and your session.'); }
  }

  async function findRecommendation() {
    if (!produceResult) return;
    try {
      const response = await fetch(`${API_URL}/api/recommendations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ farmerId: session.profileId, produceId: produceResult.id }),
      });
      if (!response.ok) throw new Error('recommendation');
      setRecommendation(await response.json());
    } catch { setMessage('No compatible buyer found yet. Ask a buyer to post a matching requirement.'); }
  }

  async function postRequirement(event) {
    event.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/buyers/${session.profileId}/requirements`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ ...requirement, cropId: Number(requirement.cropId), requiredQuantity: Number(requirement.requiredQuantity), offeredPrice: Number(requirement.offeredPrice) }),
      });
      if (!response.ok) throw new Error('requirement');
      setMessage('Requirement published for matching farmers.');
    } catch { setMessage('Could not publish the requirement. Check your buyer session.'); }
  }

  async function saveProfile(event) {
    event.preventDefault();
    try {
      const path = session.role === 'FARMER' ? 'farmers' : 'buyers';
      const body = session.role === 'FARMER'
        ? { address: profile.address, district: profile.district, state: profile.state, latitude: Number(profile.latitude), longitude: Number(profile.longitude) }
        : { ...profile, latitude: Number(profile.latitude), longitude: Number(profile.longitude) };
      const response = await fetch(`${API_URL}/api/${path}/${session.profileId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('profile');
      setMessage('Profile and location saved.');
    } catch { setMessage('Could not save profile. Check the location values.'); }
  }

  function signOut() {
    localStorage.removeItem('kisanlinkToken');
    localStorage.removeItem('kisanlinkSession');
    setSession(null);
    setRecommendation(null);
    setProduceResult(null);
    setMessage('You have been signed out.');
  }

  return (
    <main className="shell">
      <nav className="topbar">
        <div className="brand"><span className="brand-mark">K</span><span>KisanLink</span></div>
        <span className="connection"><i /> {loading ? 'Connecting' : 'Market desk live'}</span>
      </nav>

      <section className="hero">
        <div>
          <p className="eyebrow">Farmer market intelligence</p>
          <h1>Sell with a clearer view of the market.</h1>
          <p className="hero-copy">Compare today&apos;s prices, spot movement early, and keep your produce ready for the right buyer.</p>
        </div>
        <div className="hero-stamp"><strong>01</strong><span>market<br />desk</span></div>
      </section>

      <section className="dashboard-grid">
        <article className="panel market-panel">
          <div className="panel-heading"><div><p className="eyebrow">Live snapshot</p><h2>Market pulse</h2></div><span className="date-chip">Today</span></div>
          {trend ? <div className="price-feature"><div><span className="crop-label">{crops[0]?.name}</span><strong>₹{trend.latestPrice}<small> / kg</small></strong></div><span className="trend-up">↗ {trend.changePercent}%</span></div> : <p className="muted">Loading market data...</p>}
          <div className="trend-bar"><span /><span /><span /><span /><span /><span /><span /></div>
          <div className="trend-caption"><span>Price trend</span><strong>{trend?.trend || '—'}</strong></div>
        </article>

        <article className="panel login-panel">
          {!session ? <><div className="panel-heading"><div><p className="eyebrow">Farmer and buyer access</p><h2>{authMode === 'login' ? 'Open your desk' : 'Create your desk'}</h2></div><span className="lock">⌁</span></div>
            <div className="mode-switch"><button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Sign in</button><button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>Register</button></div>
            <form onSubmit={authenticate}>
              {authMode === 'register' && <><label>Name<input placeholder="Your name" value={account.name} onChange={(event) => setAccount({ ...account, name: event.target.value })} required /></label><label>Phone<input placeholder="Phone number" value={account.phone} onChange={(event) => setAccount({ ...account, phone: event.target.value })} /></label><label>Role<select value={role} onChange={(event) => setRole(event.target.value)}><option value="FARMER">Farmer</option><option value="BUYER">Buyer</option></select></label></>}
              <label>Email<input type="email" placeholder="you@example.com" value={account.email} onChange={(event) => setAccount({ ...account, email: event.target.value })} required /></label>
              <label>Password<input type="password" placeholder="Your password" value={account.password} onChange={(event) => setAccount({ ...account, password: event.target.value })} required /></label>
              <button type="submit">{authMode === 'login' ? 'Sign in' : 'Create account'} <span>→</span></button>
            </form></> : <><div className="panel-heading"><div><p className="eyebrow">Active session</p><h2>{session.name}</h2></div><button className="text-button" onClick={signOut}>Sign out</button></div><p className="session-copy">{session.role === 'FARMER' ? 'Your farmer workspace is ready for produce and buyer matching.' : 'Your buyer workspace is ready for requirements.'}</p></>}
          {message && <p className="form-message">{message}</p>}
        </article>
      </section>

      <section className="lower-grid">
        <article className="panel crop-panel"><div className="panel-heading"><div><p className="eyebrow">Available now</p><h2>Crop board</h2></div><span className="count">{crops.length} listed</span></div><div className="crop-list">{crops.map((crop) => <div className="crop-row" key={crop.id}><span className="crop-icon">{crop.name.slice(0, 1)}</span><span><strong>{crop.name}</strong><small>{crop.category} · per {crop.unit}</small></span><span className="row-arrow">→</span></div>)}</div></article>
        <aside className="note-panel"><p className="eyebrow">Next move</p><h2>Add your produce to see practical buyer options.</h2><p>Once you sign in, your quantity and quality become the starting point for net-return recommendations.</p><span className="note-line">Farmer first / decision support</span></aside>
      </section>
      {session?.role === 'FARMER' && <section className="workspace-grid"><article className="panel workspace-panel"><div className="panel-heading"><div><p className="eyebrow">Farmer workspace</p><h2>List your produce</h2></div><span className="count">Step 01</span></div><form onSubmit={addProduce}><label>Crop<select value={produce.cropId} onChange={(event) => setProduce({ ...produce, cropId: event.target.value })}>{crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}</select></label><label>Quantity (kg)<input type="number" min="1" value={produce.quantity} onChange={(event) => setProduce({ ...produce, quantity: event.target.value })} required /></label><label>Quality<input value={produce.quality} onChange={(event) => setProduce({ ...produce, quality: event.target.value })} required /></label><button type="submit">Save produce <span>→</span></button></form>{produceResult && <button className="secondary-button" onClick={findRecommendation}>Find best buyer <span>↗</span></button>}</article>{recommendation && <article className="panel recommendation-panel"><p className="eyebrow">Recommended option</p><h2>{recommendation.recommendedBuyer.buyerName}</h2><strong className="recommendation-price">₹{recommendation.recommendedBuyer.pricePerKg}<small> / kg</small></strong><div className="return-row"><span>Estimated net return</span><strong>₹{recommendation.recommendedBuyer.netReturn}</strong></div><ul>{recommendation.reason.map((reason) => <li key={reason}>{reason}</li>)}</ul></article>}</section>}
      {session && <section className="profile-band"><div><p className="eyebrow">Location profile</p><h2>Help the desk measure distance.</h2></div><form className="profile-form" onSubmit={saveProfile}>{session.role === 'BUYER' && <label>Business name<input value={profile.businessName} onChange={(event) => setProfile({ ...profile, businessName: event.target.value })} required /></label>}<label>District<input value={profile.district} onChange={(event) => setProfile({ ...profile, district: event.target.value })} placeholder="Ranchi" /></label><label>State<input value={profile.state} onChange={(event) => setProfile({ ...profile, state: event.target.value })} placeholder="Jharkhand" /></label><label>Latitude<input type="number" step="any" value={profile.latitude} onChange={(event) => setProfile({ ...profile, latitude: event.target.value })} placeholder="23.3441" required /></label><label>Longitude<input type="number" step="any" value={profile.longitude} onChange={(event) => setProfile({ ...profile, longitude: event.target.value })} placeholder="85.3096" required /></label><button type="submit">Save profile <span>→</span></button></form></section>}
      {session?.role === 'BUYER' && <section className="workspace-grid"><article className="panel workspace-panel"><div className="panel-heading"><div><p className="eyebrow">Buyer workspace</p><h2>Post a requirement</h2></div><span className="count">Live listing</span></div><form onSubmit={postRequirement}><label>Crop<select value={requirement.cropId} onChange={(event) => setRequirement({ ...requirement, cropId: event.target.value })}>{crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}</select></label><label>Required quantity (kg)<input type="number" min="1" value={requirement.requiredQuantity} onChange={(event) => setRequirement({ ...requirement, requiredQuantity: event.target.value })} required /></label><label>Quality required<input value={requirement.qualityRequired} onChange={(event) => setRequirement({ ...requirement, qualityRequired: event.target.value })} required /></label><label>Offer (₹/kg)<input type="number" min="0" value={requirement.offeredPrice} onChange={(event) => setRequirement({ ...requirement, offeredPrice: event.target.value })} required /></label><button type="submit">Publish requirement <span>→</span></button></form></article><aside className="note-panel workspace-note"><p className="eyebrow">Buyer signal</p><h2>Clear requirements create better matches.</h2><p>Farmers can compare your offer with nearby markets and make a more confident decision.</p></aside></section>}
      <footer><span>KisanLink</span><span>Market information for better decisions</span></footer>
    </main>
  );
}

export default App;
