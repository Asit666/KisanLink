/**
 * KisanLink Lightweight STOMP over WebSocket Client
 * Supports connection lifecycle, topic subscriptions, and automatic reconnect.
 */
export class KisanLinkWebSocketClient {
  constructor(url, onStatusChange) {
    this.url = url;
    this.onStatusChange = onStatusChange || (() => {});
    this.socket = null;
    this.connected = false;
    this.subscriptions = new Map(); // id -> { destination, callback }
    this.subCounter = 0;
    this.reconnectTimeout = null;
    this.reconnectDelay = 2000;
    this.maxReconnectDelay = 15000;
  }

  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        // Send STOMP CONNECT frame
        this.sendFrame('CONNECT', { 'accept-version': '1.1,1.0', 'heart-beat': '10000,10000' });
      };

      this.socket.onmessage = (event) => {
        this.handleRawMessage(event.data);
      };

      this.socket.onerror = (err) => {
        console.warn('[WS] Error:', err);
      };

      this.socket.onclose = () => {
        this.connected = false;
        this.onStatusChange(false);
        this.scheduleReconnect();
      };
    } catch (e) {
      console.warn('[WS] Connection failed:', e);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
      this.connect();
    }, this.reconnectDelay);
  }

  sendFrame(command, headers = {}, body = '') {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    let frame = command + '\n';
    for (const [k, v] of Object.entries(headers)) {
      frame += `${k}:${v}\n`;
    }
    frame += '\n' + body + '\0';
    this.socket.send(frame);
  }

  handleRawMessage(data) {
    // Basic STOMP frame parser
    const frames = data.split('\0');
    for (const raw of frames) {
      const trimmed = raw.trim();
      if (!trimmed) continue;

      const lines = trimmed.split('\n');
      const command = lines[0].trim();
      const headers = {};
      let i = 1;
      while (i < lines.length && lines[i].trim() !== '') {
        const idx = lines[i].indexOf(':');
        if (idx !== -1) {
          headers[lines[i].substring(0, idx).trim()] = lines[i].substring(idx + 1).trim();
        }
        i++;
      }
      const body = lines.slice(i + 1).join('\n');

      if (command === 'CONNECTED') {
        this.connected = true;
        this.reconnectDelay = 2000;
        this.onStatusChange(true);
        // Resubscribe to all registered topics upon (re)connection
        for (const [subId, sub] of this.subscriptions.entries()) {
          this.sendFrame('SUBSCRIBE', { id: subId, destination: sub.destination });
        }
      } else if (command === 'MESSAGE') {
        const subId = headers['subscription'];
        const sub = this.subscriptions.get(subId);
        if (sub && sub.callback) {
          try {
            const parsed = body ? JSON.parse(body) : null;
            sub.callback(parsed, headers);
          } catch {
            sub.callback(body, headers);
          }
        }
      }
    }
  }

  subscribe(destination, callback) {
    const subId = 'sub-' + (++this.subCounter);
    this.subscriptions.set(subId, { destination, callback });

    if (this.connected) {
      this.sendFrame('SUBSCRIBE', { id: subId, destination });
    }

    return () => {
      this.subscriptions.delete(subId);
      if (this.connected) {
        this.sendFrame('UNSUBSCRIBE', { id: subId });
      }
    };
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.connected) {
      this.sendFrame('DISCONNECT');
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
    this.onStatusChange(false);
  }
}
