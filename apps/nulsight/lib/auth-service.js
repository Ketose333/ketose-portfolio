const { createAccountStore, createCookieSessionAuth } = require('@portfolio/server-auth');
const { APP_NAMESPACE, LEGACY_NAMESPACE } = require('./storage-config');

// Thin app wrapper: Nulsight picks names and cookie policy, shared packages do the heavy lifting.
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

module.exports = {
  ...accountStore,
  ...cookieAuth,
};
