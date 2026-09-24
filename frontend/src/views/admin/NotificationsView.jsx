import React, { useState } from 'react';

/**
 * NotificationsView — Real-Time Signal Feed, SMS & WhatsApp Field Alerts
 */
export default function NotificationsView({
  text = {},
  notifications = [],
  unreadCount = 0,
  smsLogs = [],
  smsLogLoading = false,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNavigateToView,
  onLoadSmsLogs,
  onSendTestSms,
  onSimulateInboundSms,
  notifSubTab: controlledSubTab,
  setNotifSubTab: controlledSetSubTab
}) {
  const [localSubTab, setLocalSubTab] = useState('app'); // 'app' | 'sms'
  const notifSubTab = controlledSubTab !== undefined ? controlledSubTab : localSubTab;
  const setNotifSubTab = controlledSetSubTab || setLocalSubTab;

  const [testSmsForm, setTestSmsForm] = useState({
    recipientPhone: '+919876543210',
    channel: 'SMS',
    text: 'DEAL-101 ACCEPTED: Escrow locked Rs 45,000 for 1500kg Wheat dispatch.'
  });

  function handleSubmitTestSms(e) {
    e.preventDefault();
    if (onSendTestSms) {
      onSendTestSms(testSmsForm);
    }
  }

  return (
    <div className="view-container">
      <section className="panel" style={{ marginTop: '18px' }}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Market activity &amp; signals</p>
            <h2>{text.labelNotifications || 'Notifications & Field Alerts'}</h2>
          </div>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            {unreadCount > 0 && notifSubTab === 'app' && (
              <button
                type="button"
                className="text-button"
                onClick={onMarkAllNotificationsRead}
                style={{ marginTop: 0 }}
              >
                Mark all read
              </button>
            )}
            <span className="count">
              {notifSubTab === 'app' ? `${unreadCount} unread` : `${smsLogs.length} field alerts`}
            </span>
          </div>
        </div>

        <div className="tab-toggle-group" style={{ marginBottom: '16px' }}>
          <button
            type="button"
            className={notifSubTab === 'app' ? 'active' : ''}
            onClick={() => setNotifSubTab('app')}
          >
            In-App Desk Feed ({unreadCount})
          </button>
          <button
            type="button"
            className={notifSubTab === 'sms' ? 'active' : ''}
            onClick={() => {
              setNotifSubTab('sms');
              if (onLoadSmsLogs) onLoadSmsLogs();
            }}
          >
            SMS &amp; WhatsApp Field Dispatch ({smsLogs.length})
          </button>
        </div>

        {notifSubTab === 'app' && (
          <div className="notif-list">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`notif-card ${n.unread ? 'unread' : ''}`}
                onClick={() => onMarkNotificationRead && onMarkNotificationRead(n.id)}
                style={{ cursor: 'default' }}
              >
                <span className={`notif-dot ${n.unread ? '' : 'read'}`} />
                <div className="notif-body">
                  <p className="notif-title"><strong>{n.title}</strong> — {n.message}</p>
                  <div className="notif-meta">
                    <span>{n.time}</span>
                    <span>·</span>
                    <span>{n.type}</span>
                    <span>·</span>
                    <button
                      type="button"
                      className="notif-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onMarkNotificationRead) onMarkNotificationRead(n.id);
                        if (onNavigateToView) onNavigateToView(n.viewTarget);
                      }}
                    >
                      View ↔
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="muted" style={{ padding: '16px 0' }}>No notifications received yet.</p>
            )}
          </div>
        )}

        {notifSubTab === 'sms' && (
          <div>
            <div style={{ borderBottom: '1px solid #d9d6cc', paddingBottom: '18px', marginBottom: '18px' }}>
              <p className="eyebrow" style={{ marginBottom: '6px' }}>Field Dispatch Gateway — Simulated</p>
              <p style={{ fontSize: '12px', color: '#647068', margin: '0 0 18px', lineHeight: '1.6' }}>
                Farmers receive SMS and WhatsApp alerts for trade proposals, escrow confirmations, and payouts. Replying <code>ACCEPT &lt;id&gt;</code> via SMS confirms a deal offline.
              </p>

              <form onSubmit={handleSubmitTestSms} style={{ marginTop: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                  <label style={{ marginTop: 0 }}>Recipient Phone
                    <input
                      value={testSmsForm.recipientPhone}
                      onChange={(e) => setTestSmsForm({ ...testSmsForm, recipientPhone: e.target.value })}
                      required
                    />
                  </label>
                  <label style={{ marginTop: 0 }}>Channel
                    <select
                      value={testSmsForm.channel}
                      onChange={(e) => setTestSmsForm({ ...testSmsForm, channel: e.target.value })}
                    >
                      <option value="SMS">SMS</option>
                      <option value="WHATSAPP">WhatsApp</option>
                    </select>
                  </label>
                </div>
                <label>Message Text
                  <input
                    value={testSmsForm.text}
                    onChange={(e) => setTestSmsForm({ ...testSmsForm, text: e.target.value })}
                    required
                  />
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '18px', flexWrap: 'wrap' }}>
                  <button type="submit" style={{ width: 'auto', margin: 0 }}>
                    Send Test Alert &rarr;
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ width: 'auto', margin: 0 }}
                    onClick={() => onSimulateInboundSms && onSimulateInboundSms(testSmsForm.text)}
                  >
                    Simulate Inbound SMS Reply &rarr;
                  </button>
                </div>
              </form>
            </div>

            <div className="sms-feed-grid">
              {smsLogLoading ? (
                <p className="muted">Loading field dispatch log...</p>
              ) : smsLogs.length > 0 ? (
                smsLogs.map((log) => {
                  const isWa = log.channel === 'WHATSAPP';
                  return (
                    <div key={log.id} className={`sms-log-row ${isWa ? 'sms-log-wa' : 'sms-log-sms'}`}>
                      <div className="sms-log-meta">
                        <span className="sms-log-channel">{isWa ? 'WhatsApp' : 'SMS'}</span>
                        <span>{log.recipientPhone}</span>
                        <span>{new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span style={{ marginLeft: 'auto', color: '#5a8e62' }}>{log.status}</span>
                      </div>
                      <p className="sms-log-body">{log.body}</p>
                      <div className="sms-log-ref">Ref: {log.providerMessageId || `MSG-${log.id}`} &middot; {log.messageType}</div>
                    </div>
                  );
                })
              ) : (
                <p className="muted" style={{ paddingTop: '8px' }}>No field alerts dispatched yet. Use the form above to send a test.</p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
