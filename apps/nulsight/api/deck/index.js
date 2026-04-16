const { send, parseBody } = require('../../lib/http');
const {
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
  SLOT_NAME_MAX,
} = require('../../lib/deck-store');
const { requireAuth, requireMaintenanceAccess } = require('../../lib/auth-service');

const SLOT_ID_RE = /^s_[a-z0-9]+_[a-z0-9]+$/i;

function isValidSlotId(value) {
  const normalized = String(value || '').trim();
  return SLOT_ID_RE.test(normalized);
}

module.exports = async (req, res) => {
  const auth = await requireAuth(req, res, send);
  if (!auth) return;
  const action = String((req.query && req.query.action) || '').trim();

  if (req.method === 'GET') {
    const agentId = String(req.query.agentId || auth.username).trim();
    if (agentId !== auth.username) return send(res, 403, { ok: false, error: 'forbidden' });

    if (action === 'slots') {
      const model = await getDeckSlots(agentId);
      return send(res, 200, { ok: true, agentId, ...model });
    }

    if (action) return send(res, 400, { ok: false, error: 'unsupported action' });

    const deck = await getDeck(agentId);
    return send(res, 200, { ok: true, agentId, deck: deck || null });
  }

  if (req.method === 'POST') {
    try {
      const body = parseBody(req);

      if (action === 'clear_all') {
        if (!requireMaintenanceAccess(req, res, send, body)) return;
        const confirm = String(body.confirm || '').trim();
        if (confirm !== 'CONFIRM_ALL_DECKS') return send(res, 400, { ok: false, error: 'confirm token required' });
        const r = await clearAllDecks();
        return send(res, 200, { ok: true, ...r, clearedAllDecks: true });
      }

      const agentId = String(body.agentId || auth.username).trim();
      if (agentId !== auth.username) return send(res, 403, { ok: false, error: 'forbidden' });

      if (action === 'switch_slot') {
        const slotId = String(body.slotId || '').trim();
        if (!isValidSlotId(slotId)) return send(res, 400, { ok: false, error: 'invalid slot' });
        const model = await setActiveSlot(agentId, slotId);
        if (!model) return send(res, 400, { ok: false, error: 'invalid slot' });
        return send(res, 200, { ok: true, agentId, ...model });
      }

      if (action === 'create_slot') {
        const name = String(body.name || '').trim();
        if (name.length > SLOT_NAME_MAX) return send(res, 400, { ok: false, error: `slot name must be <= ${SLOT_NAME_MAX} chars` });
        const model = await createSlot(agentId, name);
        if (!model) return send(res, 400, { ok: false, error: 'slot limit reached' });
        return send(res, 200, { ok: true, agentId, ...model });
      }

      if (action === 'delete_slot') {
        const slotId = String(body.slotId || '').trim();
        if (!isValidSlotId(slotId)) return send(res, 400, { ok: false, error: 'invalid slot' });
        const model = await deleteSlot(agentId, slotId);
        if (!model) return send(res, 400, { ok: false, error: 'cannot delete slot' });
        return send(res, 200, { ok: true, agentId, ...model });
      }

      if (action === 'import_slot') {
        const name = String(body.name || '허브 가져온 덱').trim();
        if (name.length > SLOT_NAME_MAX) return send(res, 400, { ok: false, error: `slot name must be <= ${SLOT_NAME_MAX} chars` });
        const deck = normalizeDeck(body.deck || []);
        const v = validateDeck(deck);
        if (!v.ok) return send(res, 400, { ok: false, error: v.reason });
        const model = await importDeckToNewSlot(agentId, deck, name);
        if (!model) return send(res, 400, { ok: false, error: 'slot limit reached' });
        return send(res, 200, { ok: true, agentId, ...model });
      }

      if (action) return send(res, 400, { ok: false, error: 'unsupported action' });

      const deck = normalizeDeck(body.deck || []);
      const v = validateDeck(deck);
      if (!v.ok) return send(res, 400, { ok: false, error: v.reason });

      await setDeck(agentId, deck);
      return send(res, 200, { ok: true, agentId, saved: deck.length });
    } catch (error) {
      if (error?.code === 'DECK_BUSY') return send(res, 409, { ok: false, error: 'deck busy' });
      throw error;
    }
  }

  return send(res, 405, { ok: false, error: 'method not allowed' });
};
