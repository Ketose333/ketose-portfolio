const { loadKV, canUseKV, tryKV, createNamespaceTools, aliasGlobalStore } = require('@portfolio/server-storage');

const APP_NAMESPACE = process.env.PORTFOLIO_KV_NAMESPACE || 'portfolio:nulsight';
const LEGACY_NAMESPACE = 'nulsight';
// NULSIGHT keeps namespace policy local while delegating storage mechanics to the shared package.
const keyspace = createNamespaceTools({
  namespace: APP_NAMESPACE,
  legacyNamespace: LEGACY_NAMESPACE,
});

module.exports = {
  loadKV,
  canUseKV,
  tryKV,
  aliasGlobalStore,
  APP_NAMESPACE,
  LEGACY_NAMESPACE,
  namespaced: keyspace.namespaced,
  withLegacy: keyspace.withLegacy,
  pattern: keyspace.pattern,
};
