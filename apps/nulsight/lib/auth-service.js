const { timingSafeEqual } = require('node:crypto');
const { createAccountStore, createCookieSessionAuth } = require('@portfolio/server-auth');
const { APP_NAMESPACE, LEGACY_NAMESPACE } = require('./storage-config');

// Thin app wrapper: NULSIGHT picks names and cookie policy, shared packages do the heavy lifting.
const accountStore = createAccountStore({
  namespace: APP_NAMESPACE,
  legacyNamespace: LEGACY_NAMESPACE,
  globalStoreName: '__portfolio_nulsight_auth_store',
  legacyGlobalStoreName: '__nulsight_auth_store',
});

const cookieAuth = createCookieSessionAuth({
  cookieName: 'bp_session',
  getSession: accountStore.getSession,
});

function secureEqual(left, right) {
  const a = Buffer.from(String(left || ''), 'utf8');
  const b = Buffer.from(String(right || ''), 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function readMaintenanceToken(req, body = {}) {
  const headerValue = req?.headers?.['x-portfolio-maintenance-token'];
  if (typeof headerValue === 'string' && headerValue.trim()) return headerValue.trim();
  if (Array.isArray(headerValue) && headerValue[0]) return String(headerValue[0]).trim();
  return String(body.maintenanceToken || '').trim();
}

function requireMaintenanceAccess(req, res, send, body = {}) {
  const configured = String(process.env.PORTFOLIO_MAINTENANCE_TOKEN || '').trim();
  if (!configured) {
    send(res, 403, { ok: false, error: 'maintenance disabled' });
    return false;
  }
  const provided = readMaintenanceToken(req, body);
  if (!provided || !secureEqual(provided, configured)) {
    send(res, 403, { ok: false, error: 'maintenance token required' });
    return false;
  }
  return true;
}

module.exports = {
  ...accountStore,
  ...cookieAuth,
  requireMaintenanceAccess,
};
