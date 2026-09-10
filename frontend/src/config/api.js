// ─────────────────────────────────────────────────────────────────────────────
// KisanLink Centralized API Configuration & Fail-Safe Client
// Prevents silent localhost fallbacks in production environments
// ─────────────────────────────────────────────────────────────────────────────

const isProd = Boolean(import.meta.env.PROD);

const configuredApiUrl = import.meta.env.VITE_API_URL;
const configuredAiUrl = import.meta.env.VITE_AI_API_URL;
const configuredWsUrl = import.meta.env.VITE_WS_URL;
const browserHost = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalBrowserHost = browserHost === 'localhost' || browserHost === '127.0.0.1' || browserHost === '';
const runtimeApiUrl = isLocalBrowserHost ? 'http://localhost:8080' : `http://${browserHost}:8080`;

if (isProd) {
  if (!configuredApiUrl || configuredApiUrl.includes('localhost') || configuredApiUrl.includes('127.0.0.1')) {
    console.warn(
      '[KisanLink Configuration Alert]: Running in production build, but VITE_API_URL is missing or pointing to localhost. Configure VITE_API_URL in your deployment environment.'
    );
  }
  if (!configuredAiUrl || configuredAiUrl.includes('localhost') || configuredAiUrl.includes('127.0.0.1')) {
    console.warn(
      '[KisanLink Configuration Alert]: Running in production build, but VITE_AI_API_URL is missing or pointing to localhost. Configure VITE_AI_API_URL in your deployment environment.'
    );
  }
}

// In Vite development, proxy API calls through the frontend port so phones do
// not need direct access to the backend port through the local firewall.
export const API_URL = configuredApiUrl || (import.meta.env.DEV ? '' : runtimeApiUrl);
export const AI_API_URL = configuredAiUrl || 'http://localhost:8000';
export const WS_URL = configuredWsUrl || (API_URL
  ? `${API_URL.replace(/^http/, 'ws')}/ws-connect`
  : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`);

/**
 * Safe fetch wrapper with timeout and standardized error trapping.
 */
export async function safeFetch(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
