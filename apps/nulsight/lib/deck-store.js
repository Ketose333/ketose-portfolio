const { randomUUID } = require('node:crypto');
const { loadKV, canUseKV, tryKV, aliasGlobalStore, APP_NAMESPACE, LEGACY_NAMESPACE, namespaced, withLegacy } = require('./storage-config');
const { buildStarterDeck } = require('./starter-deck');

const kv = loadKV();
const mem = aliasGlobalStore('__portfolio_nulsight_deck_store', '__nulsight_deck_store', () => new Map());
const deckLocks = aliasGlobalStore('__portfolio_nulsight_deck_lock_store', '__nulsight_deck_lock_store', () => new Map());
const MAX_SLOTS = 10;
const SLOT_NAME_MAX = 24;
const DECK_LOCK_TTL_MS = 3000;
const DECK_LOCK_WAIT_MS = 1200;
const DECK_LOCK_POLL_MS = 35;

function hasKV() {
  return canUseKV(kv);
}

function keyCandidates(agentId) {
  return withLegacy(['deck', agentId]);
}

function normalizeDeck(deck = []) {
  return (Array.isArray(deck) ? deck : []).map(String).filter(Boolean);
}

function normalizeSlotName(name = '', fallback = '덱 슬롯') {
  const trimmed = String(name || '').trim().slice(0, SLOT_NAME_MAX);
  return trimmed || fallback;
}

function nowIso() {
  return new Date().toISOString();
}

function makeSlotId() {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function deckLockKey(agentId) {
  return namespaced(['decklock', String(agentId || '').trim()], APP_NAMESPACE);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tryAcquireMemDeckLock(key, token, ttlMs) {
  const now = Date.now();
  const current = deckLocks.get(key);
  if (current && current.expiresAt > now && current.token !== token) return false;
  deckLocks.set(key, { token, expiresAt: now + ttlMs });
  return true;
}

async function tryAcquireDeckLock(agentId, token, ttlMs = DECK_LOCK_TTL_MS) {
  const key = deckLockKey(agentId);
  if (hasKV()) {
    return tryKV(
      async () => {
        const result = await kv.set(key, token, { nx: true, px: ttlMs });
        return result === 'OK';
      },
      () => tryAcquireMemDeckLock(key, token, ttlMs)
    );
  }
  return tryAcquireMemDeckLock(key, token, ttlMs);
}

async function releaseDeckLock(agentId, token) {
  const key = deckLockKey(agentId);
  if (hasKV()) {
    await tryKV(
      async () => {
        const current = await kv.get(key);
        if (current === token && typeof kv.del === 'function') await kv.del(key);
      },
      () => {
        const current = deckLocks.get(key);
        if (current?.token === token) deckLocks.delete(key);
      }
    );
    return;
  }
  const current = deckLocks.get(key);
  if (current?.token === token) deckLocks.delete(key);
}

async function withDeckMutationLock(agentId, fn, options = {}) {
  const normalizedAgentId = String(agentId || '').trim();
  if (!normalizedAgentId) throw new Error('agentId required');

  const waitMs = Number(options.waitMs || DECK_LOCK_WAIT_MS);
  const ttlMs = Number(options.ttlMs || DECK_LOCK_TTL_MS);
  const pollMs = Number(options.pollMs || DECK_LOCK_POLL_MS);
  const token = randomUUID();
  const start = Date.now();

  while ((Date.now() - start) <= waitMs) {
    if (await tryAcquireDeckLock(normalizedAgentId, token, ttlMs)) {
      try {
        return await fn();
      } finally {
        await releaseDeckLock(normalizedAgentId, token);
      }
    }
    await sleep(pollMs);
  }

  const err = new Error('deck busy');
  err.code = 'DECK_BUSY';
  throw err;
}

function starterDeck() {
  return buildStarterDeck();
}

function shouldHydrateStarterSlot(slot, index, totalSlots) {
  const normalizedName = String(slot?.name || '').trim();
  if (!Array.isArray(slot?.deck) || slot.deck.length > 0) return false;
  if (String(slot?.source || '') === 'starter') return true;
  if (normalizedName === '기본 덱') return true;
  return totalSlots === 1 && index === 0;
}

function defaultModel(deck = null) {
  const slotId = makeSlotId();
  const resolvedDeck = Array.isArray(deck) && deck.length ? deck : starterDeck();
  return {
    activeSlotId: slotId,
    slots: [{ id: slotId, name: '기본 덱', deck: normalizeDeck(resolvedDeck), updatedAt: nowIso(), source: 'starter' }]
  };
}

function ensureModel(raw) {
  const obj = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
  const rawSlots = Array.isArray(obj.slots)
    ? obj.slots.map((s, i) => ({
      id: String(s?.id || `slot_${i + 1}`),
      name: normalizeSlotName(s?.name, `덱 ${i + 1}`),
      deck: normalizeDeck(s?.deck || []),
      updatedAt: String(s?.updatedAt || nowIso()),
      source: String(s?.source || 'manual')
    })).slice(0, MAX_SLOTS)
    : [];
  const slots = rawSlots.map((slot, index) => (
    shouldHydrateStarterSlot(slot, index, rawSlots.length)
      ? { ...slot, deck: starterDeck(), source: 'starter', updatedAt: slot.updatedAt || nowIso() }
      : slot
  ));
  if (!slots.length) return defaultModel();
  const activeSlotId = slots.some((s) => s.id === obj.activeSlotId) ? String(obj.activeSlotId) : slots[0].id;
  return { activeSlotId, slots };
}

function activeSlot(model) {
  const m = ensureModel(model);
  return m.slots.find((s) => s.id === m.activeSlotId) || m.slots[0];
}

function validateDeck(deck = []) {
  const d = normalizeDeck(deck);
  if (d.length < 30) return { ok: false, reason: 'deck must have at least 30 cards' };
  const count = {};
  for (const k of d) {
    count[k] = (count[k] || 0) + 1;
    if (count[k] > 3) return { ok: false, reason: `card copy limit exceeded: ${k}` };
  }
  return { ok: true };
}

async function _getRaw(agentId) {
  if (hasKV()) {
    return tryKV(async () => {
      const [primaryKey, legacyKey] = keyCandidates(agentId);
      return (await kv.get(primaryKey)) || (await kv.get(legacyKey)) || null;
    }, () => mem.get(String(agentId || '').trim()) || null);
  }
  return mem.get(String(agentId || '').trim()) || null;
}

async function _setRaw(agentId, raw) {
  const agentKey = String(agentId || '').trim();
  if (hasKV()) {
    const [primaryKey] = keyCandidates(agentId);
    await tryKV(() => kv.set(primaryKey, raw, { ex: 60 * 60 * 24 * 30 }), () => mem.set(agentKey, raw));
    return;
  }
  mem.set(agentKey, raw);
}

async function getDeck(agentId) {
  const raw = await _getRaw(agentId);
  const model = ensureModel(raw || {});
  return normalizeDeck(activeSlot(model)?.deck || []);
}

async function setDeck(agentId, deck) {
  return withDeckMutationLock(agentId, async () => {
    const raw = await _getRaw(agentId);
    const model = ensureModel(raw || {});
    const current = activeSlot(model);
    current.deck = normalizeDeck(deck);
    current.updatedAt = nowIso();
    current.source = 'manual';
    model.slots = model.slots.map((s) => (s.id === current.id ? current : s));
    await _setRaw(agentId, model);
    return model;
  });
}

async function getDeckSlots(agentId) {
  const raw = await _getRaw(agentId);
  const model = ensureModel(raw || {});
  return model;
}

async function setActiveSlot(agentId, slotId) {
  return withDeckMutationLock(agentId, async () => {
    const model = await getDeckSlots(agentId);
    if (!model.slots.some((s) => s.id === slotId)) return null;
    model.activeSlotId = slotId;
    await _setRaw(agentId, model);
    return model;
  });
}

async function createSlot(agentId, name = '') {
  return withDeckMutationLock(agentId, async () => {
    const model = await getDeckSlots(agentId);
    if (model.slots.length >= MAX_SLOTS) return null;
    const id = makeSlotId();
    model.slots.push({ id, name: normalizeSlotName(name, `덱 ${model.slots.length + 1}`), deck: [], updatedAt: nowIso(), source: 'manual' });
    model.activeSlotId = id;
    await _setRaw(agentId, model);
    return model;
  });
}

async function deleteSlot(agentId, slotId) {
  return withDeckMutationLock(agentId, async () => {
    const model = await getDeckSlots(agentId);
    if (model.slots.length <= 1) return null;
    const next = model.slots.filter((s) => s.id !== slotId);
    if (next.length === model.slots.length) return null;
    model.slots = next;
    if (model.activeSlotId === slotId) model.activeSlotId = next[0].id;
    await _setRaw(agentId, model);
    return model;
  });
}

async function importDeckToNewSlot(agentId, deck, name = '허브 가져온 덱') {
  return withDeckMutationLock(agentId, async () => {
    const model = await getDeckSlots(agentId);
    if (model.slots.length >= MAX_SLOTS) return null;
    const id = makeSlotId();
    model.slots.push({ id, name: normalizeSlotName(name, '허브 가져온 덱'), deck: normalizeDeck(deck), updatedAt: nowIso(), source: 'import' });
    model.activeSlotId = id;
    await _setRaw(agentId, model);
    return model;
  });
}

async function clearAllDecks() {
  if (hasKV() && typeof kv.keys === 'function') {
    return tryKV(async () => {
      const keyGroups = await Promise.all([
        kv.keys(`${namespaced(['deck'], APP_NAMESPACE)}:*`),
        kv.keys(`${namespaced(['deck'], LEGACY_NAMESPACE)}:*`),
      ]);
      const mergedKeys = keyGroups.flatMap((keys) => (Array.isArray(keys) ? keys : []));
      if (mergedKeys.length > 0 && typeof kv.del === 'function') {
        await kv.del(...mergedKeys);
        return { ok: true, cleared: mergedKeys.length, backend: 'kv' };
      }
      return { ok: true, cleared: 0, backend: 'kv' };
    }, async () => {
      let cleared = 0;
      for (const key of mem.keys()) {
        mem.delete(key);
        cleared += 1;
      }
      return { ok: true, cleared, backend: 'mem' };
    });
  }

  let cleared = 0;
  for (const key of mem.keys()) {
    mem.delete(key);
    cleared += 1;
  }
  return { ok: true, cleared, backend: 'mem' };
}

module.exports = {
  getDeck,
  setDeck,
  getDeckSlots,
  setActiveSlot,
  createSlot,
  deleteSlot,
  importDeckToNewSlot,
  validateDeck,
  normalizeDeck,
  clearAllDecks,
  withDeckMutationLock,
  SLOT_NAME_MAX,
};
