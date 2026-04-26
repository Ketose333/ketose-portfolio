const { randomUUID, scryptSync, timingSafeEqual } = require('node:crypto');
const { loadKV, canUseKV, tryKV, createNamespaceTools, aliasGlobalStore } = require('@portfolio/server-storage');

function createAccountStore({
  namespace,
  legacyNamespace = '',
  globalStoreName = '__portfolio_account_store',
  legacyGlobalStoreName = '',
  sessionTtlSec = 60 * 60 * 24 * 30,
} = {}) {
  // The shared store owns account persistence rules; each app only provides namespace and cookie choices.
  const keyspace = createNamespaceTools({ namespace, legacyNamespace });
  const kv = loadKV();
  const mem = aliasGlobalStore(globalStoreName, legacyGlobalStoreName, () => ({
    users: new Map(),
    sessions: new Map(),
  }));

  function hasKV() {
    return canUseKV(kv);
  }

  function normalizeUsername(value) {
    return String(value || '').trim().toLowerCase();
  }

  function userKeys(username) {
    return keyspace.withLegacy(['user', username]);
  }

  function sessionKeys(token) {
    return keyspace.withLegacy(['session', token]);
  }

  function hashPassword(password, salt = randomUUID()) {
    const hash = scryptSync(String(password), salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  function verifyPassword(password, packed) {
    const [salt, hex] = String(packed || '').split(':');
    if (!salt || !hex) return false;
    const got = scryptSync(String(password), salt, 64);
    const exp = Buffer.from(hex, 'hex');
    if (got.length !== exp.length) return false;
    return timingSafeEqual(got, exp);
  }

  async function getUser(username) {
    const normalized = normalizeUsername(username);
    if (!normalized) return null;
    if (hasKV()) {
      return tryKV(async () => {
        const [primaryKey, legacyKey] = userKeys(normalized);
        return (await kv.get(primaryKey)) || (await kv.get(legacyKey)) || null;
      }, () => mem.users.get(normalized) || null);
    }
    return mem.users.get(normalized) || null;
  }

  async function createUser(username, password, displayName = '') {
    const normalized = normalizeUsername(username);
    if (!normalized || normalized.length < 3) return { ok: false, error: 'username too short' };
    if (!/^[a-z0-9_]{3,24}$/.test(normalized)) return { ok: false, error: 'username format invalid (a-z0-9_)' };
    const rawPassword = String(password || '');
    if (rawPassword.length < 8) return { ok: false, error: 'password too short (min 8)' };
    if (!/[A-Za-z]/.test(rawPassword) || !/[0-9]/.test(rawPassword)) {
      return { ok: false, error: 'password must include letters and numbers' };
    }

    const resolvedDisplayName = String(displayName || '').trim().slice(0, 24) || normalized;
    const user = {
      username: normalized,
      displayName: resolvedDisplayName,
      passwordHash: hashPassword(rawPassword),
      createdAt: Date.now(),
    };

    if (hasKV()) {
      const [primaryKey, legacyKey] = userKeys(normalized);
      const legacyExists = legacyKey ? await tryKV(() => kv.exists(legacyKey), () => 0) : 0;
      if (legacyExists) return { ok: false, error: 'username already exists' };

      const inserted = await tryKV(
        () => kv.set(primaryKey, user, { nx: true }),
        () => {
          if (mem.users.has(normalized)) return null;
          mem.users.set(normalized, user);
          return 'OK';
        }
      );
      if (!inserted) return { ok: false, error: 'username already exists' };
    } else {
      if (mem.users.has(normalized)) return { ok: false, error: 'username already exists' };
      mem.users.set(normalized, user);
    }

    return { ok: true, user: { username: normalized, displayName: resolvedDisplayName } };
  }

  async function verifyUser(username, password) {
    const user = await getUser(username);
    if (!user) return null;
    return verifyPassword(password, user.passwordHash)
      ? { username: user.username, displayName: user.displayName || user.username }
      : null;
  }

  async function getUserPublic(username) {
    const user = await getUser(username);
    if (!user) return null;
    return { username: user.username, displayName: user.displayName || user.username };
  }

  async function createSession(username) {
    const token = randomUUID() + randomUUID();
    const payload = { username: normalizeUsername(username), createdAt: Date.now() };
    if (hasKV()) {
      const [primaryKey] = sessionKeys(token);
      await tryKV(() => kv.set(primaryKey, payload, { ex: sessionTtlSec }), () => mem.sessions.set(token, payload));
    } else {
      mem.sessions.set(token, payload);
    }
    return token;
  }

  async function getSession(token) {
    const normalized = String(token || '').trim();
    if (!normalized) return null;
    if (hasKV()) {
      return tryKV(async () => {
        const [primaryKey, legacyKey] = sessionKeys(normalized);
        return (await kv.get(primaryKey)) || (await kv.get(legacyKey)) || null;
      }, () => mem.sessions.get(normalized) || null);
    }
    return mem.sessions.get(normalized) || null;
  }

  async function deleteSession(token) {
    const normalized = String(token || '').trim();
    if (!normalized) return;
    if (hasKV() && typeof kv.del === 'function') {
      await tryKV(() => {
        const [primaryKey, legacyKey] = sessionKeys(normalized);
        return kv.del(primaryKey, legacyKey);
      }, () => {
        mem.sessions.delete(normalized);
      });
      return;
    }
    mem.sessions.delete(normalized);
  }

  return {
    namespace,
    legacyNamespace,
    hasKV,
    normalizeUsername,
    createUser,
    verifyUser,
    getUserPublic,
    createSession,
    getSession,
    deleteSession,
  };
}

function createCookieSessionAuth({ cookieName = 'bp_session', getSession, secureCookies = process.env.NODE_ENV === 'production' }) {
  function parseCookies(req) {
    const raw = String(req.headers?.cookie || '');
    const out = {};
    for (const part of raw.split(';')) {
      const index = part.indexOf('=');
      if (index <= 0) continue;
      const key = part.slice(0, index).trim();
      const value = decodeURIComponent(part.slice(index + 1).trim());
      out[key] = value;
    }
    return out;
  }

  function setSessionCookie(res, token) {
    const secureSuffix = secureCookies ? '; Secure' : '';
    res.setHeader(
      'Set-Cookie',
      `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${secureSuffix}`,
    );
  }

  function clearSessionCookie(res) {
    const secureSuffix = secureCookies ? '; Secure' : '';
    res.setHeader('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureSuffix}`);
  }

  async function getAuthUser(req) {
    // Cookie parsing stays small on purpose so API handlers can reuse it without framework-specific glue.
    const token = parseCookies(req)[cookieName] || '';
    const session = await getSession(token);
    if (!session?.username) return null;
    return { username: session.username, token };
  }

  async function requireAuth(req, res, send) {
    const user = await getAuthUser(req);
    if (!user) {
      send(res, 401, { ok: false, error: 'unauthorized' });
      return null;
    }
    return user;
  }

  return {
    COOKIE_NAME: cookieName,
    parseCookies,
    setSessionCookie,
    clearSessionCookie,
    getAuthUser,
    requireAuth,
  };
}

module.exports = {
  createAccountStore,
  createCookieSessionAuth,
};
