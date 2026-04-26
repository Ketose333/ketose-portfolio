function loadKV() {
  try {
    const mod = require('@vercel/kv');
    return mod && mod.kv ? mod.kv : null;
  } catch {
    return null;
  }
}

function canUseKV(kv) {
  if (!kv) return false;
  try {
    const hasFns = typeof kv.get === 'function' && typeof kv.set === 'function';
    const hasEnv = !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
    return !!(hasFns && hasEnv);
  } catch {
    return false;
  }
}

async function tryKV(fn, fallback) {
  try {
    return await fn();
  } catch {
    return typeof fallback === 'function' ? fallback() : fallback;
  }
}

function namespaced(parts = [], namespace = 'portfolio') {
  return [namespace, ...parts.map((part) => String(part || '').trim()).filter(Boolean)].join(':');
}

function withLegacy(parts = [], options = {}) {
  const namespace = String(options.namespace || 'portfolio').trim();
  const legacyNamespace = String(options.legacyNamespace || '').trim();
  const keys = [namespaced(parts, namespace)];
  if (legacyNamespace && legacyNamespace !== namespace) keys.push(namespaced(parts, legacyNamespace));
  return keys;
}

function pattern(parts = [], namespace = 'portfolio') {
  return `${namespaced(parts, namespace)}:*`;
}

function createNamespaceTools({ namespace = 'portfolio', legacyNamespace = '' } = {}) {
  return {
    namespace,
    legacyNamespace,
    namespaced: (parts = [], targetNamespace = namespace) => namespaced(parts, targetNamespace),
    withLegacy: (parts = []) => withLegacy(parts, { namespace, legacyNamespace }),
    pattern: (parts = [], targetNamespace = namespace) => pattern(parts, targetNamespace),
  };
}

function aliasGlobalStore(primaryName, legacyName, factory) {
  // Keep one in-memory store per process while tolerating older global names during migration.
  const current = globalThis[primaryName]
    || (legacyName ? globalThis[legacyName] : undefined)
    || (typeof factory === 'function' ? factory() : factory);
  globalThis[primaryName] = current;
  if (legacyName) globalThis[legacyName] = current;
  return current;
}

module.exports = {
  loadKV,
  canUseKV,
  tryKV,
  namespaced,
  withLegacy,
  pattern,
  createNamespaceTools,
  aliasGlobalStore,
};
