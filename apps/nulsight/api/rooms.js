const { randomUUID } = require('node:crypto');
const { send, parseBody, sendServerError } = require('../lib/http');
const {
  getRoom,
  setRoom,
  clearRoomsByOwner,
  clearInactiveRooms,
  clearAllRooms,
  replaceRoomPresence,
  touchRoomPresence,
  withRoomMutationLock,
} = require('../lib/store');
const { getUserPublic, requireAuth, requireMaintenanceAccess } = require('../lib/auth-service');
const { isMatchLive, getResultSnapshot, startMatch, markMatchEnded, toRoomStatePayload } = require('../lib/match-state');

const INACTIVE_TIMEOUT_MS = 120 * 1000;
const ROOM_ID_RE = /^[0-9a-f]{6}$/;
const MAX_ROOM_ID_ATTEMPTS = 12;

async function buildAgentNames(agents = []) {
  const names = {};
  await Promise.all((Array.isArray(agents) ? agents : []).map(async (agentId) => {
    const user = await getUserPublic(agentId);
    names[agentId] = user?.displayName || agentId;
  }));
  return names;
}

function applyInactiveForfeit(room, viewerId) {
  if (!room?.game || room.game.winnerId) return false;
  const agents = Array.isArray(room.agents) ? room.agents : [];
  if (agents.length !== 2 || !agents.includes(viewerId)) return false;

  const now = Date.now();
  const lastSeen = room.lastSeen && typeof room.lastSeen === 'object' ? room.lastSeen : {};
  const selfSeen = Number(lastSeen[viewerId] || 0);
  if (!selfSeen || (now - selfSeen) >= INACTIVE_TIMEOUT_MS) return false;

  const opponentId = agents.find((id) => id !== viewerId);
  const oppSeen = Number(lastSeen[opponentId] || 0);
  if (!opponentId || !oppSeen) return false;
  if ((now - oppSeen) < INACTIVE_TIMEOUT_MS) return false;

  room.game.winnerId = viewerId;
  room.game.log = Array.isArray(room.game.log) ? room.game.log : [];
  room.game.log.push(`${opponentId} timeout`);
  room.updatedAt = now;
  return true;
}

function isValidRoomId(roomId) {
  return ROOM_ID_RE.test(String(roomId || '').trim());
}

async function createUniqueRoom(ownerId) {
  for (let attempt = 0; attempt < MAX_ROOM_ID_ATTEMPTS; attempt += 1) {
    const candidate = randomUUID().replace(/-/g, '').slice(0, 6);
    try {
      const result = await withRoomMutationLock(candidate, async () => {
        const existing = await getRoom(candidate);
        if (existing) return null;
        const now = Date.now();
        const room = { roomId: candidate, ownerId, agents: [ownerId], game: null, createdAt: now, updatedAt: now };
        await setRoom(candidate, room);
        await replaceRoomPresence(candidate, { [ownerId]: now });
        return { room, now };
      });
      if (result) return result;
    } catch (error) {
      if (error?.code === 'ROOM_BUSY') continue;
      throw error;
    }
  }
  return null;
}

async function refreshMemberRoomState(roomId, viewerId, presence) {
  try {
    return await withRoomMutationLock(roomId, async () => {
      const latestRoom = await getRoom(roomId);
      if (!latestRoom) return null;

      const room = { ...latestRoom, lastSeen: presence.lastSeen };
      let finalGame = getResultSnapshot(room);
      let shouldPersist = false;
      const changed = applyInactiveForfeit(room, viewerId);

      if (room.game?.winnerId) {
        finalGame = room.game;
        markMatchEnded(room, finalGame, Date.now());
        shouldPersist = true;
      } else if (isMatchLive(room) && room.finalGame) {
        startMatch(room, room.game);
        shouldPersist = true;
      }

      if (changed) room.endedBy = 'inactive_timeout';
      if (shouldPersist) await setRoom(roomId, room);

      return { room, finalGame };
    });
  } catch (error) {
    if (error?.code === 'ROOM_BUSY') return null;
    throw error;
  }
}

module.exports = async (req, res) => {
  try {
    const auth = await requireAuth(req, res, send);
    if (!auth) return;
    const action = String((req.query && req.query.action) || '').trim();

    if (req.method === 'GET') {
      if (action !== 'state') return send(res, 400, { ok: false, error: 'action required' });

      const roomId = String(req.query.roomId || '').trim();
      if (!roomId) return send(res, 400, { ok: false, error: 'roomId required' });
      if (!isValidRoomId(roomId)) return send(res, 400, { ok: false, error: 'invalid roomId' });

      let room = await getRoom(roomId);
      if (!room) return send(res, 404, { ok: false, error: 'room not found' });

      const agents = Array.isArray(room.agents) ? room.agents : [];
      const isMember = agents.includes(auth.username);
      let finalGame = getResultSnapshot(room);
      let shouldPersist = false;

      if (isMember) {
      const presence = await touchRoomPresence(roomId, auth.username);
      room = { ...room, lastSeen: presence.lastSeen };

      if (room.game || room.finalGame) {
        const refreshed = await refreshMemberRoomState(roomId, auth.username, presence);
        if (refreshed) {
          room = refreshed.room;
          finalGame = refreshed.finalGame;
          shouldPersist = false;
        } else {
          const latestRoom = await getRoom(roomId);
          if (latestRoom) {
            room = { ...latestRoom, lastSeen: presence.lastSeen };
            finalGame = getResultSnapshot(latestRoom);
          }
        }
      } else {
        const changed = applyInactiveForfeit(room, auth.username);
        if (room.game?.winnerId) {
          finalGame = room.game;
          markMatchEnded(room, finalGame, Date.now());
          shouldPersist = true;
        }
        if (changed) room.endedBy = 'inactive_timeout';
      }
      if (shouldPersist) await setRoom(roomId, room);
    }

      const agentNames = await buildAgentNames(agents);

      if (!isMember) {
        return send(res, 200, toRoomStatePayload(room, {
          includeAgents: [],
          hideGame: true,
          restricted: true,
          includeOwner: false,
          agentNames: {},
        }));
      }

      return send(res, 200, toRoomStatePayload({ ...room, finalGame }, {
        includeAgents: room.agents,
        hideGame: false,
        restricted: false,
        agentNames,
      }));
    }

    if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method not allowed' });
    const body = parseBody(req);

    if (action === 'create') {
      const agentId = auth.username;
      const created = await createUniqueRoom(agentId);
      if (!created) return send(res, 503, { ok: false, error: 'room allocation failed' });
      const room = created.room;
      const agentNames = await buildAgentNames(room.agents);
      return send(res, 201, toRoomStatePayload(room, {
        includeAgents: room.agents,
        hideGame: false,
        restricted: false,
        agentNames,
      }));
    }

    if (action === 'join') {
      const { initGame, assertGameState } = require('../lib/game');
      const { getDeck, validateDeck } = require('../lib/deck-store');
      const roomId = String(body.roomId || '').trim();
      const agentId = auth.username;
      if (!roomId) return send(res, 400, { ok: false, error: 'roomId required' });
      if (!isValidRoomId(roomId)) return send(res, 400, { ok: false, error: 'invalid roomId' });

      try {
        const result = await withRoomMutationLock(roomId, async () => {
          const room = await getRoom(roomId);
          if (!room) return { status: 404, body: { ok: false, error: 'room not found' } };

          const alreadyJoined = room.agents.includes(agentId);
          if (!alreadyJoined) {
            if (room.agents.length >= 2) return { status: 409, body: { ok: false, error: 'room full' } };
            room.agents.push(agentId);
          }

          if (room.agents.length === 2 && !room.game) {
            const [a1, a2] = room.agents;
            if (!a1 || !a2 || a1 === a2) {
              return { status: 409, body: { ok: false, error: 'two distinct agents required' } };
            }
          const d1 = await getDeck(a1);
          const d2 = await getDeck(a2);
          const decksByAgent = {};
          if (d1 && validateDeck(d1).ok) decksByAgent[a1] = d1;
          if (d2 && validateDeck(d2).ok) decksByAgent[a2] = d2;
          const nextGame = initGame(room.roomId, a1, a2, decksByAgent);
          assertGameState(nextGame, 'join-init');
          startMatch(room, nextGame);
        }

          const now = Date.now();
          room.updatedAt = now;
          await setRoom(roomId, room);
          await touchRoomPresence(roomId, agentId, now);
          const agentNames = await buildAgentNames(room.agents);
          return {
            status: 200,
            body: {
              ok: true,
              roomId,
              ownerId: room.ownerId,
              agents: room.agents,
              started: !!room.game,
              joined: !alreadyJoined,
              waitingForOpponent: room.agents.length < 2,
              agentNames,
            },
          };
        });
        return send(res, result.status, result.body);
      } catch (error) {
        if (error?.code === 'ROOM_BUSY') return send(res, 409, { ok: false, error: 'room busy' });
        console.error('[nulsight][rooms][join]', error);
        return sendServerError(res, 'ROOMS_SERVER_ERROR');
      }
    }

    if (action === 'reset') {
      const roomId = String(body.roomId || '').trim();
      const agents = Array.isArray(body.agents) && body.agents.length ? body.agents.map(String).slice(0, 2) : null;
      if (!roomId) return send(res, 400, { ok: false, error: 'roomId required' });
      if (!isValidRoomId(roomId)) return send(res, 400, { ok: false, error: 'invalid roomId' });
      if (!agents) return send(res, 400, { ok: false, error: 'agents required' });

      try {
        const result = await withRoomMutationLock(roomId, async () => {
          const room = await getRoom(roomId);
          if (!room) return { status: 404, body: { ok: false, error: 'room not found' } };
          if (room.ownerId !== auth.username) return { status: 403, body: { ok: false, error: 'only owner can reset room' } };
          const now = Date.now();
          const next = { roomId, ownerId: room.ownerId, agents, game: null, finalGame: null, finalGameAt: null, createdAt: room.createdAt || now, updatedAt: now };
          await setRoom(roomId, next);
          await replaceRoomPresence(roomId, { [auth.username]: now });
          const agentNames = await buildAgentNames(next.agents);
          return {
            status: 200,
            body: { ok: true, roomId, agents: next.agents, game: null, reset: true, agentNames },
          };
        });
        return send(res, result.status, result.body);
      } catch (error) {
        if (error?.code === 'ROOM_BUSY') return send(res, 409, { ok: false, error: 'room busy' });
        console.error('[nulsight][rooms][reset]', error);
        return sendServerError(res, 'ROOMS_SERVER_ERROR');
      }
    }

    if (action === 'clear') {
      const result = await clearRoomsByOwner(auth.username);
      return send(res, 200, { ok: true, ...result, clearedMine: true });
    }

    if (action === 'clear_inactive') {
      if (!requireMaintenanceAccess(req, res, send, body)) return;
      const result = await clearInactiveRooms();
      return send(res, 200, { ok: true, ...result, clearedInactive: true });
    }

    if (action === 'clear_all') {
      if (!requireMaintenanceAccess(req, res, send, body)) return;
      const confirm = String(body.confirm || '').trim();
      if (confirm !== 'CONFIRM_ALL_ROOMS') return send(res, 400, { ok: false, error: 'confirm token required' });
      const result = await clearAllRooms();
      return send(res, 200, { ok: true, ...result, clearedAll: true });
    }

    return send(res, 400, { ok: false, error: 'unsupported action' });
  } catch (error) {
    console.error('[nulsight][rooms][outer]', error);
    return sendServerError(res, 'ROOMS_SERVER_ERROR');
  }
};
