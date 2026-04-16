const { initGame, applyAction, assertGameState } = require('../lib/game');
const sharedCards = require('../lib/generated/shared-cards.cjs');
const { buildStarterDeck } = require('../lib/starter-deck');

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

function makeScenarioState(seed = 1234) {
  return withSeededRandom(seed, () => {
    const state = initGame(`scenario_${seed}`, 'alpha', 'beta', {
      alpha: buildStarterDeck(),
      beta: buildStarterDeck(),
    });

    state.turn = 2;
    state.phase = 'main';
    state.activeAgentId = 'alpha';
    state.firstAgentId = 'alpha';
    state.winnerId = null;
    state.stack = [];
    state.priority = { holderId: 'alpha', passCount: 0 };
    state.pendingAdvance = false;
    state.effectUsage = { alpha: {}, beta: {} };
    state.log = [];
    state.units = {};

    for (const agentId of ['alpha', 'beta']) {
      state.agents[agentId].mana = 10;
      state.agents[agentId].manaMax = 10;
      state.agents[agentId].hand = [];
      state.agents[agentId].monsterZone = [null, null, null];
      state.agents[agentId].spellZone = [null, null, null, null];
      state.agents[agentId].graveyard = [];
      state.agents[agentId].banished = [];
    }

    assertGameState(state, `scenario:init:${seed}`);
    return state;
  });
}

function placeUnit(state, agentId, zoneIndex, key, overrides = {}) {
  const normalizedKey = normalizeCardKey(key);
  const def = getCardDef(normalizedKey) || {};
  const unitId = overrides.id || `${normalizedKey}_${zoneIndex}_${agentId}`;
  const maxHp = Number(overrides.maxHp ?? def.hp ?? 1);
  const hp = Number(overrides.hp ?? maxHp);
  state.units[unitId] = {
    id: unitId,
    key: normalizedKey,
    name: normalizedKey,
    cost: getCardCost(normalizedKey),
    atk: Number(overrides.atk ?? def.atk ?? 1),
    hp,
    maxHp,
    ownerId: agentId,
    exhausted: Boolean(overrides.exhausted ?? false),
    summonTurn: Number(overrides.summonTurn ?? Math.max(1, state.turn - 1)),
    cannotAttackThisTurn: Boolean(overrides.cannotAttackThisTurn ?? false),
  };
  state.agents[agentId].monsterZone[zoneIndex] = unitId;
  return unitId;
}

function assertResult(result, expectedOk, expectedReason) {
  if (result.ok !== expectedOk) {
    throw new Error(`expected ok=${expectedOk} but got ok=${result.ok} (${result.reason || 'no reason'})`);
  }
  if (expectedReason && result.reason !== expectedReason) {
    throw new Error(`expected reason=${expectedReason} but got ${result.reason}`);
  }
}

function runTargetedScenarios() {
  const outputs = [];

  // 1. Guard prevents direct attack.
  {
    const state = makeScenarioState(2001);
    state.phase = 'battle';
    const attackerId = placeUnit(state, 'alpha', 0, 'gear_6_antikythera_core', { exhausted: false, summonTurn: 1, cannotAttackThisTurn: false });
    placeUnit(state, 'beta', 0, 'gear_guardian', { exhausted: false, summonTurn: 1, cannotAttackThisTurn: false, hp: 8, maxHp: 8 });
    assertGameState(state, 'target:guard:before');
    const result = applyAction(state, { type: 'attack', actorId: 'alpha', payload: { attackerId } });
    assertResult(result, false, 'guard blocks direct attack');
    assertGameState(result.state, 'target:guard:after');
    outputs.push({ name: 'guard_blocks_direct_attack', ok: true });
  }

  // 2. Equip moves to grave when attached unit dies.
  {
    const state = makeScenarioState(2002);
    state.phase = 'battle';
    const attackerId = placeUnit(state, 'alpha', 0, 'gear_6_antikythera_core', { exhausted: false, summonTurn: 1, cannotAttackThisTurn: false });
    const defenderId = placeUnit(state, 'beta', 0, 'gear_2_syncro', { exhausted: false, summonTurn: 1, hp: 4, maxHp: 4 });
    state.agents.beta.spellZone[0] = {
      key: 'balance_guardian_plating',
      attachedUnitId: defenderId,
      bonus: { atk: 0, hp: 2 },
    };
    assertGameState(state, 'target:equip-cleanup:before');
    const result = applyAction(state, { type: 'attack', actorId: 'alpha', payload: { attackerId, targetUnitId: defenderId } });
    assertResult(result, true);
    if (result.state.agents.beta.spellZone[0] !== null) {
      throw new Error('equip slot did not clear after attached unit death');
    }
    if (!result.state.agents.beta.graveyard.includes('balance_guardian_plating')) {
      throw new Error('equip did not move to graveyard');
    }
    assertGameState(result.state, 'target:equip-cleanup:after');
    outputs.push({ name: 'equip_moves_to_grave_on_owner_unit_death', ok: true });
  }

  // 3. Stack resolves before phase advances.
  {
    const state = makeScenarioState(2003);
    state.phase = 'main';
    state.turn = 2;
    state.activeAgentId = 'alpha';
    state.priority = { holderId: 'alpha', passCount: 0 };
    state.agents.alpha.mana = 2;
    state.agents.alpha.hand = ['abyss_direct_hit'];
    assertGameState(state, 'target:stack-pass:before');

    let result = applyAction(state, { type: 'play_card', actorId: 'alpha', payload: { handIndex: 0 } });
    assertResult(result, true);
    let next = result.state;
    if (next.stack.length !== 1) throw new Error('stack entry not created');
    if (!next.agents.alpha.graveyard.includes('abyss_direct_hit')) throw new Error('normal spell did not go to graveyard');

    result = applyAction(next, { type: 'end_phase', actorId: 'alpha' });
    assertResult(result, true);
    next = result.state;
    if (!next.pendingAdvance) throw new Error('pendingAdvance not opened while stack exists');

    result = applyAction(next, { type: 'priority_pass', actorId: 'alpha' });
    assertResult(result, true);
    next = result.state;
    result = applyAction(next, { type: 'priority_pass', actorId: 'beta' });
    assertResult(result, true);
    next = result.state;
    if (next.stack.length !== 0) throw new Error('stack did not resolve after double pass');
    if (next.agents.beta.hp !== 17) throw new Error(`expected beta hp 17 after stack resolve, got ${next.agents.beta.hp}`);
    if (!next.pendingAdvance) throw new Error('phase advance window should remain open after stack resolve');

    result = applyAction(next, { type: 'priority_pass', actorId: 'alpha' });
    assertResult(result, true);
    next = result.state;
    result = applyAction(next, { type: 'priority_pass', actorId: 'beta' });
    assertResult(result, true);
    next = result.state;
    if (next.phase !== 'battle') throw new Error(`expected battle phase after stack resolution, got ${next.phase}`);
    assertGameState(next, 'target:stack-pass:after');
    outputs.push({ name: 'stack_resolves_before_phase_advances', ok: true });
  }

  // 4. First player's first turn still blocks battle.
  {
    const state = makeScenarioState(2004);
    state.turn = 1;
    state.firstAgentId = 'alpha';
    state.activeAgentId = 'alpha';
    state.phase = 'battle';
    const attackerId = placeUnit(state, 'alpha', 0, 'gear_2_syncro', { exhausted: false, summonTurn: 1, cannotAttackThisTurn: false });
    assertGameState(state, 'target:first-turn-battle-block:before');
    const result = applyAction(state, { type: 'attack', actorId: 'alpha', payload: { attackerId } });
    assertResult(result, false, 'battle blocked');
    assertGameState(result.state, 'target:first-turn-battle-block:after');
    outputs.push({ name: 'first_turn_battle_is_blocked', ok: true });
  }

  return outputs;
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
  const targeted = runTargetedScenarios();
  console.log(JSON.stringify({ ok: true, runs: results, targeted }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
