const { loadKV, canUseKV, tryKV, APP_NAMESPACE, LEGACY_NAMESPACE, namespaced, withLegacy, aliasGlobalStore } = require('./storage-config');

const kv = loadKV();
const mem = aliasGlobalStore('__portfolio_nulsight_room_store', '__nulsight_room_store', () => new Map());

const ROOM_PREFIX = ['room'];
const INACTIVE_TIMEOUT_MS = 24 * 60 * 60 * 1000;

function hasKV() {
  return canUseKV(kv);
}

function roomKeys(roomId) {
  return withLegacy([...ROOM_PREFIX, roomId]);
}

function roomPattern(namespace = APP_NAMESPACE) {
  return `${namespaced(ROOM_PREFIX, namespace)}:*`;
}

async function getByKey(key) {
  if (hasKV()) return tryKV(() => kv.get(key), () => mem.get(key) || null);
  return mem.get(key) || null;
}

async function getRoom(roomId) {
  const roomIdValue = String(roomId || '').trim();
  if (!roomIdValue) return null;
  const [primaryKey, legacyKey] = roomKeys(roomIdValue);
  return (await getByKey(primaryKey)) || (await getByKey(legacyKey)) || null;
}

async function setRoom(roomId, room) {
  const roomIdValue = String(roomId || '').trim();
  const [primaryKey] = roomKeys(roomIdValue);
  if (hasKV()) {
    await tryKV(() => kv.set(primaryKey, room, { ex: 60 * 60 * 24 }), () => mem.set(primaryKey, room));
    return;
  }
  mem.set(primaryKey, room);
}

function collectMemRooms() {
  const byRoomId = new Map();
  const validPrefixes = [
    `${namespaced(ROOM_PREFIX, APP_NAMESPACE)}:`,
    `${namespaced(ROOM_PREFIX, LEGACY_NAMESPACE)}:`,
  ];
  for (const [key, value] of mem.entries()) {
    if (validPrefixes.some((prefix) => key.startsWith(prefix)) && value?.roomId && !byRoomId.has(value.roomId)) {
      byRoomId.set(value.roomId, value);
    }
  }
  return [...byRoomId.values()];
}

async function listRoomKeys() {
  if (!hasKV() || typeof kv.keys !== 'function') return [];
  // Read both namespaces until all live rooms have been rewritten under the new prefix.
  const keyGroups = await Promise.all([
    kv.keys(roomPattern(APP_NAMESPACE)),
    kv.keys(roomPattern(LEGACY_NAMESPACE)),
  ]);
  return keyGroups.flatMap((keys) => (Array.isArray(keys) ? keys : []));
}

async function listRooms() {
  if (hasKV() && typeof kv.keys === 'function') {
    return tryKV(async () => {
      const mergedKeys = await listRoomKeys();
      if (mergedKeys.length === 0) return [];
      const rows = await Promise.all(mergedKeys.map((k) => kv.get(k)));
      const byRoomId = new Map();
      rows.filter(Boolean).forEach((room) => {
        if (room?.roomId && !byRoomId.has(room.roomId)) byRoomId.set(room.roomId, room);
      });
      return [...byRoomId.values()];
    }, () => collectMemRooms());
  }

  return collectMemRooms();
}

async function clearRoomsByOwner(ownerId) {
  const owner = String(ownerId || '').trim();
  if (!owner) return { ok: false, cleared: 0, backend: hasKV() ? 'kv' : 'mem' };

  if (hasKV() && typeof kv.keys === 'function') {
    return tryKV(async () => {
      const mergedKeys = await listRoomKeys();
      if (mergedKeys.length === 0 || typeof kv.del !== 'function') return { ok: true, cleared: 0, backend: 'kv' };
      const rows = await Promise.all(mergedKeys.map((k) => kv.get(k)));
      const delKeys = mergedKeys.filter((_, i) => rows[i]?.ownerId === owner);
      if (delKeys.length) await kv.del(...delKeys);
      return { ok: true, cleared: delKeys.length, backend: 'kv' };
    }, async () => {
      let cleared = 0;
      for (const [key, value] of mem.entries()) {
        if (value?.ownerId === owner) {
          mem.delete(key);
          cleared += 1;
        }
      }
      return { ok: true, cleared, backend: 'mem' };
    });
  }

  let cleared = 0;
  for (const [key, value] of mem.entries()) {
    if (value?.ownerId === owner) {
      mem.delete(key);
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
      const delKeys = mergedKeys.filter((_, i) => isInactive(rows[i]));
      if (delKeys.length) await kv.del(...delKeys);
      return { ok: true, cleared: delKeys.length, backend: 'kv' };
    }, async () => {
      let cleared = 0;
      for (const [key, value] of mem.entries()) {
        if (isInactive(value)) {
          mem.delete(key);
          cleared += 1;
        }
      }
      return { ok: true, cleared, backend: 'mem' };
    });
  }

  let cleared = 0;
  for (const [key, value] of mem.entries()) {
    if (isInactive(value)) {
      mem.delete(key);
      cleared += 1;
    }
  }
  return { ok: true, cleared, backend: 'mem' };
}

async function clearAllRooms() {
  if (hasKV() && typeof kv.keys === 'function') {
    return tryKV(async () => {
      const mergedKeys = await listRoomKeys();
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

module.exports = { getRoom, setRoom, listRooms, clearRoomsByOwner, clearInactiveRooms, clearAllRooms, hasKV };
