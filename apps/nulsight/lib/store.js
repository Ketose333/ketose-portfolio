const { loadKV, canUseKV, tryKV, APP_NAMESPACE, LEGACY_NAMESPACE, namespaced, withLegacy, aliasGlobalStore } = require('./storage-config');

const kv = loadKV();
const mem = aliasGlobalStore('__portfolio_nulsight_room_store', '__nulsight_room_store', () => new Map());

const ROOM_PREFIX = ['room'];
const ROOM_META_PREFIX = ['roommeta'];
const ROOM_GAME_PREFIX = ['roomgame'];
const ROOM_FINAL_PREFIX = ['roomfinal'];
const ROOM_PRESENCE_PREFIX = ['roompresence'];
const INACTIVE_TIMEOUT_MS = 24 * 60 * 60 * 1000;
const ROOM_TTL_SEC = 60 * 60 * 24;
const PRESENCE_TTL_SEC = 60 * 60 * 24;

function hasKV() {
  return canUseKV(kv);
}

function roomKeys(roomId) {
  return withLegacy([...ROOM_PREFIX, roomId]);
}

function roomMetaKeys(roomId) {
  return withLegacy([...ROOM_META_PREFIX, roomId]);
}

function roomGameKeys(roomId) {
  return withLegacy([...ROOM_GAME_PREFIX, roomId]);
}

function roomFinalKeys(roomId) {
  return withLegacy([...ROOM_FINAL_PREFIX, roomId]);
}

function roomPresenceKeys(roomId) {
  return withLegacy([...ROOM_PRESENCE_PREFIX, roomId]);
}

function roomPattern(prefix, namespace = APP_NAMESPACE) {
  return `${namespaced(prefix, namespace)}:*`;
}

async function getByKey(key) {
  if (hasKV()) return tryKV(() => kv.get(key), () => mem.get(key) || null);
  return mem.get(key) || null;
}

async function getByCandidates(candidates = []) {
  for (const key of candidates) {
    const value = await getByKey(key);
    if (value != null) return value;
  }
  return null;
}

async function setStructuredValue(keys, value, ttlSec = ROOM_TTL_SEC) {
  const [primaryKey] = keys;
  if (hasKV()) {
    await tryKV(() => kv.set(primaryKey, value, { ex: ttlSec }), () => mem.set(primaryKey, value));
    return;
  }
  mem.set(primaryKey, value);
}

async function deleteStructuredValue(keys) {
  const [primaryKey, legacyKey] = keys;
  if (hasKV() && typeof kv.del === 'function') {
    await tryKV(() => kv.del(primaryKey, legacyKey), () => {
      mem.delete(primaryKey);
      if (legacyKey) mem.delete(legacyKey);
    });
    return;
  }
  mem.delete(primaryKey);
  if (legacyKey) mem.delete(legacyKey);
}

function normalizePresence(raw) {
  const lastSeen = raw && typeof raw === 'object' && raw.lastSeen && typeof raw.lastSeen === 'object'
    ? raw.lastSeen
    : {};
  return {
    lastSeen: Object.fromEntries(
      Object.entries(lastSeen)
        .map(([agentId, ts]) => [String(agentId || '').trim(), Number(ts || 0)])
        .filter(([agentId, ts]) => agentId && Number.isFinite(ts) && ts > 0)
    ),
  };
}

function normalizeLegacyRoom(room, roomIdValue) {
  if (!room || typeof room !== 'object') return null;
  return {
    ...room,
    roomId: room.roomId || roomIdValue,
    agents: Array.isArray(room.agents) ? room.agents.map(String) : [],
    game: room.game || null,
    finalGame: room.finalGame || null,
    finalGameAt: room.finalGameAt || null,
    endedBy: room.endedBy || null,
    lastSeen: room.lastSeen && typeof room.lastSeen === 'object' ? room.lastSeen : {},
  };
}

async function getRoom(roomId) {
  const roomIdValue = String(roomId || '').trim();
  if (!roomIdValue) return null;

  const meta = await getByCandidates(roomMetaKeys(roomIdValue));
  if (meta && typeof meta === 'object') {
    const [game, finalState, presence] = await Promise.all([
      getByCandidates(roomGameKeys(roomIdValue)),
      getByCandidates(roomFinalKeys(roomIdValue)),
      getByCandidates(roomPresenceKeys(roomIdValue)),
    ]);
    const normalizedPresence = normalizePresence(presence);
    return {
      roomId: roomIdValue,
      ownerId: meta.ownerId,
      agents: Array.isArray(meta.agents) ? meta.agents.map(String) : [],
      game: game || null,
      finalGame: finalState?.finalGame || null,
      finalGameAt: finalState?.finalGameAt || null,
      endedBy: finalState?.endedBy || null,
      createdAt: meta.createdAt || null,
      updatedAt: meta.updatedAt || null,
      lastSeen: normalizedPresence.lastSeen,
    };
  }

  return normalizeLegacyRoom(await getByCandidates(roomKeys(roomIdValue)), roomIdValue);
}

async function setRoom(roomId, room, options = {}) {
  const roomIdValue = String(roomId || '').trim();
  if (!roomIdValue || !room || typeof room !== 'object') return;

  const includePresence = !!options.includePresence;
  const meta = {
    roomId: roomIdValue,
    ownerId: room.ownerId || null,
    agents: Array.isArray(room.agents) ? room.agents.map(String) : [],
    createdAt: room.createdAt || null,
    updatedAt: room.updatedAt || Date.now(),
  };

  await setStructuredValue(roomMetaKeys(roomIdValue), meta, ROOM_TTL_SEC);

  if (room.game != null) await setStructuredValue(roomGameKeys(roomIdValue), room.game, ROOM_TTL_SEC);
  else await deleteStructuredValue(roomGameKeys(roomIdValue));

  if (room.finalGame || room.finalGameAt || room.endedBy) {
    await setStructuredValue(roomFinalKeys(roomIdValue), {
      finalGame: room.finalGame || null,
      finalGameAt: room.finalGameAt || null,
      endedBy: room.endedBy || null,
    }, ROOM_TTL_SEC);
  } else {
    await deleteStructuredValue(roomFinalKeys(roomIdValue));
  }

  if (includePresence) {
    await replaceRoomPresence(roomIdValue, room.lastSeen || {});
  }
}

async function getRoomPresence(roomId) {
  const roomIdValue = String(roomId || '').trim();
  if (!roomIdValue) return { lastSeen: {} };

  const raw = await getByCandidates(roomPresenceKeys(roomIdValue));
  if (raw) return normalizePresence(raw);

  const legacyRoom = normalizeLegacyRoom(await getByCandidates(roomKeys(roomIdValue)), roomIdValue);
  return normalizePresence({ lastSeen: legacyRoom?.lastSeen || {} });
}

async function replaceRoomPresence(roomId, lastSeen = {}) {
  const roomIdValue = String(roomId || '').trim();
  if (!roomIdValue) return { lastSeen: {} };
  const normalized = normalizePresence({ lastSeen });
  await setStructuredValue(roomPresenceKeys(roomIdValue), normalized, PRESENCE_TTL_SEC);
  return normalized;
}

async function touchRoomPresence(roomId, agentId, now = Date.now()) {
  const roomIdValue = String(roomId || '').trim();
  const agentKey = String(agentId || '').trim();
  if (!roomIdValue || !agentKey) return getRoomPresence(roomIdValue);
  const current = await getRoomPresence(roomIdValue);
  current.lastSeen[agentKey] = now;
  await replaceRoomPresence(roomIdValue, current.lastSeen);
  return current;
}

async function deleteRoomData(roomId) {
  const roomIdValue = String(roomId || '').trim();
  if (!roomIdValue) return;
  await Promise.all([
    deleteStructuredValue(roomKeys(roomIdValue)),
    deleteStructuredValue(roomMetaKeys(roomIdValue)),
    deleteStructuredValue(roomGameKeys(roomIdValue)),
    deleteStructuredValue(roomFinalKeys(roomIdValue)),
    deleteStructuredValue(roomPresenceKeys(roomIdValue)),
  ]);
}

function collectMemRooms() {
  const byRoomId = new Map();
  const validPrefixes = [
    `${namespaced(ROOM_PREFIX, APP_NAMESPACE)}:`,
    `${namespaced(ROOM_PREFIX, LEGACY_NAMESPACE)}:`,
    `${namespaced(ROOM_META_PREFIX, APP_NAMESPACE)}:`,
    `${namespaced(ROOM_META_PREFIX, LEGACY_NAMESPACE)}:`,
  ];
  for (const [key, value] of mem.entries()) {
    if (!validPrefixes.some((prefix) => key.startsWith(prefix)) || !value?.roomId || byRoomId.has(value.roomId)) continue;
    const room = value.game !== undefined || value.finalGame !== undefined || value.lastSeen !== undefined
      ? normalizeLegacyRoom(value, value.roomId)
      : null;
    if (room) {
      byRoomId.set(room.roomId, room);
      continue;
    }
    byRoomId.set(value.roomId, null);
  }
  return [...byRoomId.keys()];
}

async function listRoomKeys() {
  if (!hasKV() || typeof kv.keys !== 'function') return [];
  // Read both namespaces until all live rooms have been rewritten under the new prefix.
  const keyGroups = await Promise.all([
    kv.keys(roomPattern(ROOM_META_PREFIX, APP_NAMESPACE)),
    kv.keys(roomPattern(ROOM_META_PREFIX, LEGACY_NAMESPACE)),
    kv.keys(roomPattern(ROOM_PREFIX, APP_NAMESPACE)),
    kv.keys(roomPattern(ROOM_PREFIX, LEGACY_NAMESPACE)),
  ]);
  return keyGroups.flatMap((keys) => (Array.isArray(keys) ? keys : []));
}

async function listRooms() {
  if (hasKV() && typeof kv.keys === 'function') {
    return tryKV(async () => {
      const mergedKeys = await listRoomKeys();
      if (mergedKeys.length === 0) return [];
      const rows = await Promise.all(mergedKeys.map((k) => kv.get(k)));
      const roomIds = new Set();
      rows.filter(Boolean).forEach((row) => {
        if (row?.roomId) roomIds.add(row.roomId);
      });
      return (await Promise.all([...roomIds].map((roomId) => getRoom(roomId)))).filter(Boolean);
    }, async () => (await Promise.all(collectMemRooms().map((roomId) => getRoom(roomId)))).filter(Boolean));
  }

  return (await Promise.all(collectMemRooms().map((roomId) => getRoom(roomId)))).filter(Boolean);
}

async function clearRoomsByOwner(ownerId) {
  const owner = String(ownerId || '').trim();
  if (!owner) return { ok: false, cleared: 0, backend: hasKV() ? 'kv' : 'mem' };

  if (hasKV() && typeof kv.keys === 'function') {
    return tryKV(async () => {
      const mergedKeys = await listRoomKeys();
      if (mergedKeys.length === 0 || typeof kv.del !== 'function') return { ok: true, cleared: 0, backend: 'kv' };
      const rows = await Promise.all(mergedKeys.map((k) => kv.get(k)));
      const roomIds = [...new Set(rows.filter(Boolean).map((row) => row.roomId).filter(Boolean))];
      let cleared = 0;
      for (const roomId of roomIds) {
        const room = await getRoom(roomId);
        if (room?.ownerId === owner) {
          await deleteRoomData(roomId);
          cleared += 1;
        }
      }
      return { ok: true, cleared, backend: 'kv' };
    }, async () => {
      let cleared = 0;
      for (const roomId of collectMemRooms()) {
        const room = await getRoom(roomId);
        if (room?.ownerId === owner) {
          await deleteRoomData(roomId);
          cleared += 1;
        }
      }
      return { ok: true, cleared, backend: 'mem' };
    });
  }

  let cleared = 0;
  for (const roomId of collectMemRooms()) {
    const room = await getRoom(roomId);
    if (room?.ownerId === owner) {
      await deleteRoomData(roomId);
      cleared += 1;
    }
  }
  return { ok: true, cleared, backend: 'mem' };
}

async function clearInactiveRooms(timeoutMs = INACTIVE_TIMEOUT_MS) {
  const now = Date.now();
  const isInactive = (room) => {
    if (!room) return false;
    const agents = Array.isArray(room.agents) ? room.agents : [];
    const game = room.game || null;
    const lastSeen = (room && typeof room.lastSeen === 'object' && room.lastSeen) ? room.lastSeen : {};
    const roomTouchedAt = Number(room.updatedAt || room.createdAt || 0) || 0;

    if (!game || agents.length < 2 || game.winnerId) {
      if (!roomTouchedAt) return true;
      return (now - roomTouchedAt) >= timeoutMs;
    }

    return agents.every((agentId) => {
      const ts = Number(lastSeen[agentId] || 0);
      if (!ts) return true;
      return (now - ts) >= timeoutMs;
    });
  };

  if (hasKV() && typeof kv.keys === 'function') {
    return tryKV(async () => {
      const mergedKeys = await listRoomKeys();
      if (mergedKeys.length === 0 || typeof kv.del !== 'function') {
        return { ok: true, cleared: 0, backend: 'kv' };
      }
      const rows = await Promise.all(mergedKeys.map((k) => kv.get(k)));
      const roomIds = [...new Set(rows.filter(Boolean).map((row) => row.roomId).filter(Boolean))];
      let cleared = 0;
      for (const roomId of roomIds) {
        const room = await getRoom(roomId);
        if (isInactive(room)) {
          await deleteRoomData(roomId);
          cleared += 1;
        }
      }
      return { ok: true, cleared, backend: 'kv' };
    }, async () => {
      let cleared = 0;
      for (const roomId of collectMemRooms()) {
        const room = await getRoom(roomId);
        if (isInactive(room)) {
          await deleteRoomData(roomId);
          cleared += 1;
        }
      }
      return { ok: true, cleared, backend: 'mem' };
    });
  }

  let cleared = 0;
  for (const roomId of collectMemRooms()) {
    const room = await getRoom(roomId);
    if (isInactive(room)) {
      await deleteRoomData(roomId);
      cleared += 1;
    }
  }
  return { ok: true, cleared, backend: 'mem' };
}

async function clearAllRooms() {
  if (hasKV() && typeof kv.keys === 'function') {
    return tryKV(async () => {
      const mergedKeys = await listRoomKeys();
      const rows = await Promise.all(mergedKeys.map((k) => kv.get(k)));
      const roomIds = [...new Set(rows.filter(Boolean).map((row) => row.roomId).filter(Boolean))];
      if (roomIds.length > 0) {
        for (const roomId of roomIds) {
          await deleteRoomData(roomId);
        }
        return { ok: true, cleared: roomIds.length, backend: 'kv' };
      }
      return { ok: true, cleared: 0, backend: 'kv' };
    }, async () => {
      let cleared = 0;
      for (const roomId of collectMemRooms()) {
        await deleteRoomData(roomId);
        cleared += 1;
      }
      return { ok: true, cleared, backend: 'mem' };
    });
  }

  let cleared = 0;
  for (const roomId of collectMemRooms()) {
    await deleteRoomData(roomId);
    cleared += 1;
  }
  return { ok: true, cleared, backend: 'mem' };
}

module.exports = {
  getRoom,
  setRoom,
  listRooms,
  clearRoomsByOwner,
  clearInactiveRooms,
  clearAllRooms,
  getRoomPresence,
  replaceRoomPresence,
  touchRoomPresence,
  hasKV,
};
