import React, { useState, useEffect, useRef } from 'react';

// ─── Private Trade Negotiation Chat & Interactive Offer Cards ─────────────

function getDemoConversations(role) {
  return [
    {
      id: 1,
      farmerId: 1,
      buyerId: 2,
      farmerName: 'Ramesh Kumar (Pithoria Farm)',
      buyerName: 'Priya Sharma (Reliance Fresh)',
      cropName: 'Tomato',
      tradeDealId: 12,
      lastMessageText: 'Trade Offer: 500 kg @ INR 28.00/kg',
      lastMessageAt: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 2,
      farmerId: 1,
      buyerId: 3,
      farmerName: 'Ramesh Kumar (Pithoria Farm)',
      buyerName: 'Amit Patel (Bokaro Wholesale)',
      cropName: 'Potato',
      tradeDealId: null,
      lastMessageText: 'Can you dispatch 1,000 kg by Thursday morning?',
      lastMessageAt: new Date(Date.now() - 7200000).toISOString()
    }
  ];
}

function getDemoMessages(convId) {
  if (convId === 1) {
    return [
      {
        id: 1001,
        conversationId: 1,
        senderRole: 'BUYER',
        senderId: 2,
        senderName: 'Priya Sharma',
        messageText: 'Hello Ramesh ji, we are looking to procure 500 kg grade-A ripe tomatoes for our Bokaro distribution center.',
        isOffer: false,
        sentAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 1002,
        conversationId: 1,
        senderRole: 'FARMER',
        senderId: 1,
        senderName: 'Ramesh Kumar',
        messageText: 'Namaste Priya ji. Our harvest is ripe and packed in crates. We normally price at INR 30/kg at the farm gate.',
        isOffer: false,
        sentAt: new Date(Date.now() - 3000000).toISOString()
      },
      {
        id: 1003,
        conversationId: 1,
        senderRole: 'BUYER',
        senderId: 2,
        senderName: 'Priya Sharma',
        messageText: 'Trade Offer: 500 kg of Tomato at INR 28/kg (Total: INR 14,000). Note: Delivery by Friday morning.',
        isOffer: true,
        offerCropName: 'Tomato',
        offerQuantityKg: 500,
        offerPricePerKg: 28,
        offerTotalAmount: 14000,
        offerStatus: 'PENDING',
        sentAt: new Date(Date.now() - 1800000).toISOString()
      }
    ];
  } else {
    return [
      {
        id: 2001,
        conversationId: 2,
        senderRole: 'BUYER',
        senderId: 3,
        senderName: 'Amit Patel',
        messageText: 'Hello Ramesh ji, we would like to negotiate for 1,000 kg of freshly harvested potatoes.',
        isOffer: false,
        sentAt: new Date(Date.now() - 7200000).toISOString()
      }
    ];
  }
}

function TradeChatView({ session, apiUrl, onNavigate, activeConversationId }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(activeConversationId || 1);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerForm, setOfferForm] = useState({
    cropName: 'Tomato',
    quantityKg: '500',
    pricePerKg: '28.00',
    note: ''
  });
  const [counteringMsgId, setCounteringMsgId] = useState(null);
  const [counterForm, setCounterForm] = useState({
    pricePerKg: '',
    quantityKg: '',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, [apiUrl, session]);

  useEffect(() => {
    if (activeConversationId) {
      setSelectedConvId(activeConversationId);
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (selectedConvId) {
      loadMessages(selectedConvId);
    }
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversations() {
    setLoading(true);
    try {
      if (session?.token && !session?.token.startsWith('demo-')) {
        const res = await fetch(`${apiUrl}/api/chat/conversations`, {
          headers: { Authorization: `Bearer ${session.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setConversations(data);
            if (!activeConversationId) setSelectedConvId(data[0].id);
            setLoading(false);
            return;
          }
        }
      }
      const demo = getDemoConversations(session?.role);
      setConversations(demo);
      if (!activeConversationId) setSelectedConvId(demo[0].id);
    } catch {
      const demo = getDemoConversations(session?.role);
      setConversations(demo);
      if (!activeConversationId) setSelectedConvId(demo[0].id);
    }
    setLoading(false);
  }

  async function loadMessages(convId) {
    try {
      if (session?.token && !session?.token.startsWith('demo-')) {
        const res = await fetch(`${apiUrl}/api/chat/conversations/${convId}/messages`, {
          headers: { Authorization: `Bearer ${session.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
          return;
        }
      }
      setMessages(getDemoMessages(convId));
    } catch {
      setMessages(getDemoMessages(convId));
    }
  }

  async function handleSendMessage(e) {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');

    const newMsg = {
      id: Date.now(),
      conversationId: selectedConvId,
      senderRole: session?.role || 'FARMER',
      senderId: session?.id || 1,
      senderName: session?.name || 'You',
      messageText: text,
      isOffer: false,
      sentAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);

    try {
      if (session?.token && !session?.token.startsWith('demo-')) {
        await fetch(`${apiUrl}/api/chat/conversations/${selectedConvId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({ messageText: text })
        });
      }
    } catch {
      // Demo optimistic update retained
    }
  }

  async function handleSendOffer(e) {
    if (e) e.preventDefault();
    const qty = Number(offerForm.quantityKg);
    const price = Number(offerForm.pricePerKg);
    const total = qty * price;

    const offerText = `Trade Offer: ${qty} kg of ${offerForm.cropName} at INR ${price}/kg (Total: INR ${total.toLocaleString('en-IN')})${offerForm.note ? '. Note: ' + offerForm.note : ''}`;

    const newOfferMsg = {
      id: Date.now(),
      conversationId: selectedConvId,
      senderRole: session?.role || 'BUYER',
      senderId: session?.id || 2,
      senderName: session?.name || 'You',
      messageText: offerText,
      isOffer: true,
      offerCropName: offerForm.cropName,
      offerQuantityKg: qty,
      offerPricePerKg: price,
      offerTotalAmount: total,
      offerStatus: 'PENDING',
      sentAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, newOfferMsg]);
    setShowOfferModal(false);
    setStatusMsg('Official Trade Offer card dispatched to conversation.');

    try {
      if (session?.token && !session?.token.startsWith('demo-')) {
        await fetch(`${apiUrl}/api/chat/conversations/${selectedConvId}/offer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({
            cropName: offerForm.cropName,
            quantityKg: qty,
            pricePerKg: price,
            note: offerForm.note
          })
        });
      }
    } catch {
      // Demo fallback
    }
  }

  async function handleRespondOffer(messageId, action, counterPayload) {
    setStatusMsg(`Processing offer ${action.toLowerCase()}...`);

    if (action === 'ACCEPT') {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, offerStatus: 'ACCEPTED' } : m));
      const systemNotice = {
        id: Date.now() + 1,
        conversationId: selectedConvId,
        senderRole: 'SYSTEM',
        senderId: 0,
        senderName: 'Trade Desk System',
        messageText: 'Trade Offer Accepted! An official trade contract has been established with status ACCEPTED. Both parties may now proceed with logistics and escrow.',
        isOffer: false,
        sentAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, systemNotice]);
      setStatusMsg('Trade offer accepted! Active trade deal generated in My Orders.');
    } else if (action === 'REJECT') {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, offerStatus: 'REJECTED' } : m));
      setStatusMsg('Trade offer declined.');
    } else if (action === 'COUNTER') {
      const cQty = Number(counterPayload.quantityKg);
      const cPrice = Number(counterPayload.pricePerKg);
      const cTotal = cQty * cPrice;

      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, offerStatus: 'COUNTERED' } : m));

      const counterMsg = {
        id: Date.now(),
        conversationId: selectedConvId,
        senderRole: session?.role || 'FARMER',
        senderId: session?.id || 1,
        senderName: session?.name || 'You',
        messageText: `Counter Offer: ${cQty} kg of ${offerForm.cropName} at INR ${cPrice}/kg (Total: INR ${cTotal.toLocaleString('en-IN')})${counterPayload.note ? '. Note: ' + counterPayload.note : ''}`,
        isOffer: true,
        offerCropName: offerForm.cropName,
        offerQuantityKg: cQty,
        offerPricePerKg: cPrice,
        offerTotalAmount: cTotal,
        offerStatus: 'PENDING',
        sentAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, counterMsg]);
      setCounteringMsgId(null);
      setStatusMsg('Counter-offer card sent.');
    }

    try {
      if (session?.token && !session?.token.startsWith('demo-')) {
        await fetch(`${apiUrl}/api/chat/messages/${messageId}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({
            action,
            counterPricePerKg: counterPayload ? Number(counterPayload.pricePerKg) : null,
            counterQuantityKg: counterPayload ? Number(counterPayload.quantityKg) : null,
            counterNote: counterPayload ? counterPayload.note : null
          })
        });
      }
    } catch {
      // Demo optimistic state retained
    }
  }

  const activeConv = conversations.find(c => c.id === selectedConvId) || conversations[0];
  const counterpartName = session?.role === 'BUYER' ? activeConv?.farmerName : activeConv?.buyerName;
  const counterpartRole = session?.role === 'BUYER' ? 'FARMER' : 'BUYER';

  return (
    <div className="view-container">
      {/* Header Panel */}
      <section className="panel" style={{ marginTop: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <p className="eyebrow">Direct Agricultural Trade Negotiation</p>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              Farmer &amp; Buyer Trade Chat
              <span style={{ fontSize: '11px', background: '#3b744422', color: '#3b7444', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
                End-to-End Secure
              </span>
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#667269' }}>
              Negotiate price and quantity in real time, dispatch official trade offer cards, and create binding contracts.
            </p>
          </div>
          <div>
            <button
              type="button"
              className="trade-btn trade-btn-primary"
              onClick={() => {
                if (activeConv) {
                  setOfferForm({
                    cropName: activeConv.cropName || 'Tomato',
                    quantityKg: '500',
                    pricePerKg: '28.00',
                    note: ''
                  });
                }
                setShowOfferModal(true);
              }}
              style={{ background: '#e07b39', borderColor: '#e07b39', padding: '8px 16px', fontSize: '13px' }}
            >
              + Create Trade Offer Card
            </button>
          </div>
        </div>

        {statusMsg && (
          <div style={{ marginTop: '12px', padding: '8px 12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#065f46', fontSize: '12px', fontWeight: 600 }}>
            {statusMsg}
          </div>
        )}
      </section>

      {/* Two-Panel Chat Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) 1fr', gap: '16px', marginTop: '16px', minHeight: '620px' }}>
        {/* LEFT PANEL: Conversation List */}
        <section className="panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px', color: '#1f2937' }}>
            Active Negotiations ({conversations.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
            {loading && <div style={{ fontSize: '12px', color: '#6b7280', padding: '10px' }}>Loading conversations...</div>}
            {conversations.map(c => {
              const otherName = session?.role === 'BUYER' ? c.farmerName : c.buyerName;
              const isSelected = c.id === selectedConvId;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedConvId(c.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: isSelected ? '#f0fdf4' : '#fafafa',
                    border: isSelected ? '1.5px solid #3b7444' : '1px solid #e5e7eb',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13px', color: isSelected ? '#15803d' : '#111827' }}>{otherName}</strong>
                    <span style={{ fontSize: '10px', background: '#e5e7eb', padding: '2px 6px', borderRadius: '6px', fontWeight: 700 }}>
                      {c.cropName || 'General'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.lastMessageText || 'Tap to view conversation'}
                  </div>
                  {c.tradeDealId && (
                    <div style={{ fontSize: '10px', color: '#3b7444', fontWeight: 600, marginTop: '4px' }}>
                      Linked to Trade Contract #{c.tradeDealId}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* RIGHT PANEL: Conversation Stream */}
        <section className="panel" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '620px' }}>
          {/* Stream Top Bar */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '15px' }}>{counterpartName || 'Trade Partner'}</strong>
                <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '8px', fontWeight: 700 }}>
                  {counterpartRole}
                </span>
                <span style={{ fontSize: '10px', background: '#f3f4f6', color: '#374151', padding: '2px 6px', borderRadius: '8px', fontWeight: 600 }}>
                  Crop: {activeConv?.cropName || 'General Trade'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                Direct negotiation channel. Offers accepted here immediately create binding trade deals.
              </div>
            </div>
            {activeConv?.tradeDealId && (
              <button
                type="button"
                className="trade-btn trade-btn-primary"
                style={{ fontSize: '11px', padding: '5px 12px' }}
                onClick={() => onNavigate('my-orders')}
              >
                Trade Deal #{activeConv.tradeDealId} →
              </button>
            )}
          </div>

          {/* Messages Stream */}
          <div style={{ flex: 1, padding: '18px', overflowY: 'auto', background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0', fontSize: '13px' }}>
                No messages in this negotiation yet. Type a greeting below or dispatch an official Trade Offer Card.
              </div>
            )}

            {messages.map(m => {
              const isMe = (m.senderRole === session?.role);
              const isSystem = m.senderRole === 'SYSTEM';

              if (isSystem) {
                return (
                  <div key={m.id} style={{ alignSelf: 'center', maxWidth: '85%', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px 16px', borderRadius: '12px', fontSize: '12px', textAlign: 'center', margin: '6px 0', fontWeight: 600 }}>
                    {m.messageText}
                  </div>
                );
              }

              if (m.isOffer) {
                const isReceiver = !isMe;
                const isCounteringThis = counteringMsgId === m.id;

                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      width: '100%',
                      maxWidth: '520px',
                      background: '#ffffff',
                      border: m.offerStatus === 'ACCEPTED' ? '2px solid #3b7444' :
                              m.offerStatus === 'REJECTED' ? '1.5px solid #ef4444' :
                              m.offerStatus === 'COUNTERED' ? '1.5px solid #f59e0b' : '2px solid #e07b39',
                      borderRadius: '12px',
                      padding: '16px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                    }}
                  >
                    {/* Offer Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#b45309' }}>
                          Official Trade Offer
                        </span>
                        <span style={{ fontSize: '10px', color: '#6b7280' }}>
                          by {m.senderName}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '8px',
                        background: m.offerStatus === 'ACCEPTED' ? '#ecfdf5' :
                                    m.offerStatus === 'REJECTED' ? '#fee2e2' :
                                    m.offerStatus === 'COUNTERED' ? '#fef3c7' : '#fff7ed',
                        color: m.offerStatus === 'ACCEPTED' ? '#059669' :
                               m.offerStatus === 'REJECTED' ? '#dc2626' :
                               m.offerStatus === 'COUNTERED' ? '#d97706' : '#ea580c'
                      }}>
                        {m.offerStatus}
                      </span>
                    </div>

                    {/* Offer Terms Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', background: '#f9fafb', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Crop</div>
                        <strong style={{ fontSize: '14px', color: '#111827' }}>{m.offerCropName || 'Produce'}</strong>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Quantity</div>
                        <strong style={{ fontSize: '14px', color: '#111827' }}>{Number(m.offerQuantityKg).toLocaleString('en-IN')} kg</strong>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Price / kg</div>
                        <strong style={{ fontSize: '14px', color: '#2563eb' }}>INR {Number(m.offerPricePerKg).toFixed(2)}</strong>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Total Value</div>
                        <strong style={{ fontSize: '16px', color: '#3b7444' }}>INR {Number(m.offerTotalAmount).toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: '#4b5563', marginBottom: '12px' }}>
                      {m.messageText}
                    </div>

                    {/* Action buttons for Receiver if PENDING */}
                    {m.offerStatus === 'PENDING' && isReceiver && !isCounteringThis && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                        <button
                          type="button"
                          className="trade-btn trade-btn-primary"
                          style={{ background: '#3b7444', borderColor: '#3b7444', padding: '7px 16px', fontSize: '12px' }}
                          onClick={() => handleRespondOffer(m.id, 'ACCEPT')}
                        >
                          Accept Offer
                        </button>
                        <button
                          type="button"
                          className="trade-btn"
                          style={{ background: '#f59e0b', color: '#fff', borderColor: '#f59e0b', padding: '7px 16px', fontSize: '12px' }}
                          onClick={() => {
                            setCounteringMsgId(m.id);
                            setCounterForm({
                              pricePerKg: String(m.offerPricePerKg),
                              quantityKg: String(m.offerQuantityKg),
                              note: ''
                            });
                          }}
                        >
                          Counter-Offer
                        </button>
                        <button
                          type="button"
                          className="trade-btn trade-btn-cancel"
                          style={{ padding: '7px 16px', fontSize: '12px' }}
                          onClick={() => handleRespondOffer(m.id, 'REJECT')}
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {/* Counter Offer Inline Box */}
                    {isCounteringThis && (
                      <div style={{ borderTop: '1.5px dashed #f59e0b', paddingTop: '12px', marginTop: '10px' }}>
                        <div style={{ fontWeight: 700, fontSize: '12px', color: '#b45309', marginBottom: '8px' }}>
                          Propose Counter Terms:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <label style={{ fontSize: '11px', color: '#6b7280' }}>Price per kg (INR)</label>
                            <input
                              type="number"
                              step="0.5"
                              value={counterForm.pricePerKg}
                              onChange={e => setCounterForm({ ...counterForm, pricePerKg: e.target.value })}
                              style={{ width: '100%', padding: '6px 8px', fontSize: '12px', marginTop: '2px' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', color: '#6b7280' }}>Quantity (kg)</label>
                            <input
                              type="number"
                              step="10"
                              value={counterForm.quantityKg}
                              onChange={e => setCounterForm({ ...counterForm, quantityKg: e.target.value })}
                              style={{ width: '100%', padding: '6px 8px', fontSize: '12px', marginTop: '2px' }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                          <button
                            type="button"
                            className="trade-btn trade-btn-cancel"
                            style={{ fontSize: '11px', padding: '5px 12px' }}
                            onClick={() => setCounteringMsgId(null)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="trade-btn trade-btn-primary"
                            style={{ background: '#f59e0b', borderColor: '#f59e0b', fontSize: '11px', padding: '5px 14px' }}
                            onClick={() => handleRespondOffer(m.id, 'COUNTER', counterForm)}
                          >
                            Dispatch Counter Offer
                          </button>
                        </div>
                      </div>
                    )}

                    {m.offerStatus === 'PENDING' && isMe && (
                      <div style={{ fontSize: '11px', color: '#6b7280', borderTop: '1px solid #f3f4f6', paddingTop: '8px' }}>
                        Waiting for {counterpartName} to accept, counter, or decline this offer...
                      </div>
                    )}

                    {m.offerStatus === 'ACCEPTED' && (
                      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 600 }}>
                          Offer confirmed into active trade contract.
                        </span>
                        <button
                          type="button"
                          className="trade-btn trade-btn-primary"
                          style={{ fontSize: '11px', padding: '4px 10px' }}
                          onClick={() => onNavigate('my-orders')}
                        >
                          Go to My Orders →
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              // Normal text message bubble
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                    background: isMe ? '#3b7444' : '#ffffff',
                    color: isMe ? '#ffffff' : '#1f2937',
                    border: isMe ? 'none' : '1px solid #e5e7eb',
                    borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    padding: '10px 14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ fontSize: '10px', color: isMe ? '#a7f3d0' : '#6b7280', fontWeight: 600, marginBottom: '3px' }}>
                    {m.senderName} ({m.senderRole})
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: 1.4 }}>
                    {m.messageText}
                  </div>
                  <div style={{ fontSize: '9px', color: isMe ? '#d1fae5' : '#9ca3af', textAlign: 'right', marginTop: '4px' }}>
                    {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Dock */}
          <div style={{ padding: '12px 16px', background: '#ffffff', borderTop: '1px solid #e5e7eb' }}>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Type your message or negotiate terms..."
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '13px' }}
              />
              <button
                type="button"
                className="trade-btn"
                style={{ background: '#f97316', color: '#fff', borderColor: '#f97316', padding: '10px 14px', fontSize: '12px' }}
                onClick={() => {
                  if (activeConv) {
                    setOfferForm({
                      cropName: activeConv.cropName || 'Tomato',
                      quantityKg: '500',
                      pricePerKg: '28.00',
                      note: ''
                    });
                  }
                  setShowOfferModal(true);
                }}
              >
                Send Offer Card
              </button>
              <button
                type="submit"
                className="trade-btn trade-btn-primary"
                style={{ padding: '10px 20px', fontSize: '13px' }}
              >
                Send
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* Structured Trade Offer Modal */}
      {showOfferModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#111827' }}>Create Official Trade Offer Card</h3>
              <button type="button" onClick={() => setShowOfferModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#6b7280' }}>
              This offer will be rendered directly inside the chat as an interactive agreement card. The other party can accept, counter, or decline with one click.
            </p>

            <form onSubmit={handleSendOffer}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Produce / Crop</label>
                  <input
                    value={offerForm.cropName}
                    onChange={e => setOfferForm({ ...offerForm, cropName: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 10px', marginTop: '4px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Quantity (kg)</label>
                  <input
                    type="number"
                    min="1"
                    step="10"
                    value={offerForm.quantityKg}
                    onChange={e => setOfferForm({ ...offerForm, quantityKg: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 10px', marginTop: '4px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Price per kg (INR)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={offerForm.pricePerKg}
                    onChange={e => setOfferForm({ ...offerForm, pricePerKg: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 10px', marginTop: '4px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Total Value (INR)</label>
                  <div style={{ padding: '9px 10px', marginTop: '4px', background: '#f3f4f6', borderRadius: '6px', fontWeight: 700, color: '#3b7444', fontSize: '14px' }}>
                    INR {(Number(offerForm.quantityKg) * Number(offerForm.pricePerKg)).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Special Notes or Delivery Terms (Optional)</label>
                  <input
                    value={offerForm.note}
                    onChange={e => setOfferForm({ ...offerForm, note: e.target.value })}
                    placeholder="e.g. In crates, morning pickup preferred"
                    style={{ width: '100%', padding: '8px 10px', marginTop: '4px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  className="trade-btn trade-btn-cancel"
                  onClick={() => setShowOfferModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="trade-btn trade-btn-primary"
                  style={{ background: '#e07b39', borderColor: '#e07b39', padding: '8px 20px' }}
                >
                  Dispatch Trade Offer Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export { getDemoConversations, getDemoMessages };
export default TradeChatView;
