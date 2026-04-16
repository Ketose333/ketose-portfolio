const { initGame, applyAction, assertGameState } = require('../lib/game');
const sharedCards = require('../lib/generated/shared-cards.cjs');

const {
  getCardDef,
  getCardCost,
  getCardType,
  normalizeCardKey,
} = sharedCards;

function withSeededRandom(seed, fn) {
  const original = Math.random;
  let state = seed >>> 0;
  Math.random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

function firstOccupied(zone = []) {
  return zone.find((id) => id != null) || null;
}

function chooseTargetUnitId(state, actorId, effectAction = {}) {
  const target = String(effectAction.target || '').trim();
  const selfZone = state.agents[actorId]?.monsterZone || [];
  const oppId = Object.keys(state.agents || {}).find((id) => id !== actorId) || null;
  const oppZone = state.agents[oppId]?.monsterZone || [];

  const ownUnit = firstOccupied(selfZone);
  const enemyUnit = firstOccupied(oppZone);

  if (target === 'self_unit' || target === 'ally_front') return ownUnit;
  if (target === 'enemy_front') return enemyUnit;

  switch (effectAction.kind) {
    case 'attach_equipment':
    case 'heal_unit':
    case 'self_destroy_unit':
    case 'release_unit':
    case 'lock_attack_this_turn':
      return ownUnit;
    case 'deal_damage_to_unit':
    case 'banish_unit':
      return enemyUnit;
    default:
      return null;
  }
}

function choosePlayCardAction(state, actorId) {
  const actor = state.agents[actorId];
  if (!actor) return null;

  for (let handIndex = 0; handIndex < actor.hand.length; handIndex += 1) {
    const key = normalizeCardKey(actor.hand[handIndex]);
    const def = getCardDef(key) || {};
    const cost = Number(getCardCost(key) || 0);
    if (actor.mana < cost) continue;

    if (getCardType(key) === 'monster') {
      const zoneIndex = actor.monsterZone.findIndex((slot) => slot === null);
      if (zoneIndex < 0) continue;
      return {
        type: 'play_card',
        actorId,
        payload: { handIndex, zoneIndex },
      };
    }

    const spellKind = def.spellKind || 'normal';
    const requiresSlot = spellKind === 'continuous' || spellKind === 'equip';
    const payload = { handIndex };

    if (requiresSlot) {
      const zoneIndex = actor.spellZone.findIndex((slot) => slot === null);
      if (zoneIndex < 0) continue;
      payload.zoneIndex = zoneIndex;
    }

    const onPlayEffects = Array.isArray(def.effects) ? def.effects.filter((effect) => effect?.timing === 'on_play') : [];
    const selectedEffectIndexes = onPlayEffects
      .map((effect, index) => (effect?.mode === 'optional' ? index : null))
      .filter((index) => Number.isInteger(index));
    if (selectedEffectIndexes.length > 0) payload.selectedEffectIndexes = selectedEffectIndexes;

    const firstTargetingEffect = onPlayEffects.find((effect) => effect?.action && chooseTargetUnitId(state, actorId, effect.action));
    const targetUnitId = firstTargetingEffect ? chooseTargetUnitId(state, actorId, firstTargetingEffect.action) : null;
    if (firstTargetingEffect && !targetUnitId) continue;
    if (targetUnitId) payload.targetUnitId = targetUnitId;

    return {
      type: 'play_card',
      actorId,
      payload,
    };
  }

  return null;
}

function chooseAttackAction(state, actorId) {
  const actor = state.agents[actorId];
  const oppId = Object.keys(state.agents || {}).find((id) => id !== actorId) || null;
  if (!actor || !oppId) return null;

  for (const attackerId of actor.monsterZone) {
    if (!attackerId) continue;
    const attacker = state.units[attackerId];
    if (!attacker || attacker.exhausted) continue;
    if (attacker.cannotAttackThisTurn && Number(attacker.summonTurn) === Number(state.turn)) continue;

    const opponentUnits = (state.agents[oppId]?.monsterZone || []).filter(Boolean);
    if (opponentUnits.length > 0) {
      return {
        type: 'attack',
        actorId,
        payload: { attackerId, targetUnitId: opponentUnits[0] },
      };
    }

    return {
      type: 'attack',
      actorId,
      payload: { attackerId },
    };
  }

  return null;
}

function chooseAction(state) {
  if (state.winnerId) return null;

  const actorId = state.activeAgentId;
  const priorityHolder = state.priority?.holderId || actorId;

  if ((state.stack || []).length > 0 || state.pendingAdvance) {
    return { type: 'priority_pass', actorId: priorityHolder };
  }

  if (state.phase === 'draw' || state.phase === 'end') {
    return { type: 'end_phase', actorId };
  }

  if (state.phase === 'main') {
    return choosePlayCardAction(state, actorId) || { type: 'end_phase', actorId };
  }

  if (state.phase === 'battle') {
    return chooseAttackAction(state, actorId) || { type: 'end_phase', actorId };
  }

  return { type: 'end_phase', actorId };
}

function simulateGame(seed, maxSteps = 160) {
  return withSeededRandom(seed, () => {
    let state = initGame(`smoke_${seed}`, 'alpha', 'beta');
    assertGameState(state, `smoke:init:${seed}`);

    let steps = 0;
    for (; steps < maxSteps && !state.winnerId; steps += 1) {
      const action = chooseAction(state);
      if (!action) break;
      const result = applyAction(state, action);
      if (!result.ok) {
        throw new Error(`simulation action failed at step ${steps}: ${result.reason}`);
      }
      state = result.state;
      assertGameState(state, `smoke:step:${seed}:${steps}:${action.type}`);
    }

    return {
      seed,
      ended: Boolean(state.winnerId),
      winnerId: state.winnerId,
      turn: state.turn,
      steps,
      logTail: state.log.slice(-6),
    };
  });
}

function main() {
  const seeds = [1, 7, 19, 42, 99];
  const results = seeds.map((seed) => simulateGame(seed));
  console.log(JSON.stringify({ ok: true, runs: results }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
