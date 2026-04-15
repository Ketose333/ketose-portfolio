// Source of truth for the browser gameplay runtime.
// build.mjs bundles this file back into public/js/game.js for deployment.
(() => {
  const $ = (id) => document.getElementById(id);
  const q = new URLSearchParams(location.search);

  globalThis.BP_NULSIGHT_GAME?.teardown?.();

  let me = null;
  let game = null;
  let selectedHand = null;
  let selectedAttacker = null;
  let selectedSpellTarget = null;
  let leavingGame = false;
  let hadLiveGame = false;
  let lastRenderSig = '';
  let lastPhaseKey = '';
  let autoAdvanceDrawKey = '';
  let autoAdvanceEndKey = '';
  let phaseFxTimer = null;
  let endRedirectTimer = null;
  let refreshTimer = null;
  let autoAdvanceDrawTimer = null;
  let autoAdvanceEndTimer = null;
  let isSpectator = q.get('spectator') === '1';
  let viewMeId = '';
  let viewOppId = '';
  let agentNames = {};
  let effectPickResolver = null;
  let queryOverlayResolver = null;
  let actInFlight = false;
  let refreshSeq = 0;
  let uiBusyCount = 0;
  let bootstrapPromise = null;

  const S = globalThis.BP_SHARED_CARDS || {};
  const normalizeCardKey = S.normalizeCardKey || ((k) => k);
  const getCardDef = S.getCardDef || ((k) => ({ name: k }));
  const getCardType = S.getCardType || (() => 'spell');
  const SESSION = globalThis.BP_GAME_SESSION || {};
  const FORMAT = globalThis.BP_GAME_FORMAT || {};
  const VIEW = globalThis.BP_GAME_VIEW || {};
  const pushHudState = (payload) => {
    try {
      globalThis.BP_NULSIGHT_GAME?.setHudState?.(payload);
    } catch {}
  };
  const pushSurfaceState = (payload) => {
    try {
      globalThis.BP_NULSIGHT_GAME?.setSurfaceState?.(payload);
    } catch {}
  };

  const ROOM_KEY = SESSION.ROOM_KEY || 'bp_last_room_id';
  const AGENT_KEY = SESSION.AGENT_KEY || 'bp_last_agent_id';
  const LOADING = globalThis.BP_LOADING || { show: () => {}, hide: () => {} };
  const T = globalThis.BP_TERMBOOK || {};

  const pid = () => (me?.username || (q.get('agentId') || '').trim() || loadSavedAgent()).trim();
  const rid = () => ((q.get('roomId') || '').trim() || loadSavedRoom()).trim();

  const loadSavedRoom = SESSION.loadSavedRoom || function () {
    try { return (sessionStorage.getItem(ROOM_KEY) || '').trim(); } catch { return ''; }
  };

  const saveRoom = SESSION.saveRoom || function (roomId) {
    const v = String(roomId || '').trim();
    if (!v) return;
    try { sessionStorage.setItem(ROOM_KEY, v); } catch {}
  };

  const loadSavedAgent = SESSION.loadSavedAgent || function () {
    try { return (sessionStorage.getItem(AGENT_KEY) || '').trim(); } catch { return ''; }
  };

  const saveAgent = SESSION.saveAgent || function (agentId) {
    const v = String(agentId || '').trim();
    if (!v) return;
    try { sessionStorage.setItem(AGENT_KEY, v); } catch {}
  };

  const esc = FORMAT.esc || function (v) {
    return String(v ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  };

  const phaseLabel = FORMAT.phaseLabel
    ? (p) => FORMAT.phaseLabel(p, T)
    : function (p) {
      if (typeof T.phaseLabel === 'function') return T.phaseLabel(p);
      return { draw: '드로우', main: '메인', battle: '배틀', end: '엔드' }[p] || p;
    };

  const gameSig = FORMAT.gameSig || function (g) {
    if (!g) return '';
    return [
      g.turn,
      g.phase,
      g.activeAgentId,
      g.winnerId || '-',
      (g.stack || []).length,
      JSON.stringify(g.agents || {})
    ].join('|');
  };

  function spellSlotKey(slot) {
    if (!slot) return '';
    if (typeof slot === 'string') return slot;
    return slot.key || slot.cardKey || '';
  }

  function cardDefByKey(key) {
    if (!key) return null;
    return getCardDef(normalizeCardKey(key)) || null;
  }

  const CARD_RENDER = window.BP_CARD_RENDER?.create?.({
    esc,
    normalizeCardKey,
    getCardDef,
    getCardType
  }) || null;
  const TERM = (key, fallback) => (S.TERMS && S.TERMS[key]) || fallback;
  const KW_GUARD = TERM('guard', '수호');
  const KW_CHAIN = TERM('chain', '연쇄');
  const KW_SEARCH = TERM('search', '탐색');
  const KW_RECRUIT = TERM('recruit', '징집');
  const KW_EQUIP = TERM('equip', '장착');
  const UNIT_TARGET_KINDS = new Set(['attach_equipment', 'heal_unit', 'deal_damage_to_unit', 'self_destroy_unit', 'release_unit', 'banish_unit', 'lock_attack_this_turn']);

  function getEffectUnitTargetSpec(effects = []) {
    const targets = (Array.isArray(effects) ? effects : []).filter(Boolean);
    if (!targets.length) return null;

    let wantsAlly = false;
    let wantsEnemy = false;
    let required = false;

    for (const e of targets) {
      if (!isConditionMetLocal(e?.condition || {})) continue;
      const action = e?.action || {};
      if (!UNIT_TARGET_KINDS.has(action.kind)) continue;
      if (action.target === 'ally_front') {
        wantsAlly = true;
        if ((e?.mode || 'forced') !== 'optional') required = true;
      }
      if (action.target === 'enemy_front') {
        wantsEnemy = true;
        if ((e?.mode || 'forced') !== 'optional') required = true;
      }
    }

    if (!wantsAlly && !wantsEnemy) return null;
    if (wantsAlly && wantsEnemy) return { side: 'any', required };
    return { side: wantsEnemy ? 'enemy' : 'ally', required };
  }

  function getPendingUnitTargetSpec() {
    const meAgent = game?.agents?.[pid()];
    const cardKey = selectedHand !== null ? meAgent?.hand?.[selectedHand] : null;
    if (!cardKey) return null;
    const timing = getCardType(cardKey) === 'monster' ? 'on_deploy' : 'on_play';
    const def = cardDefByKey(cardKey) || {};
    const effects = Array.isArray(def.effects) ? def.effects : [];
    const timed = effects.filter((e) => e && e.timing === timing);
    return getEffectUnitTargetSpec(timed);
  }


  function cardName(key) {
    const defName = cardDefByKey(key)?.name;
    if (defName) return defName;
    return '알 수 없는 카드';
  }

  function displayName(agentId) {
    if (typeof VIEW.displayName === 'function') {
      return VIEW.displayName(agentId, agentNames);
    }
    const id = String(agentId || '').trim();
    if (!id) return '플레이어';
    return String(agentNames[id] || id);
  }

  function actorLabel(agentId) {
    return displayName(agentId);
  }

  function reasonLabel(reason) {
    const map = {
      'not your turn': '지금은 내 턴이 아니에요.',
      'main only': '메인 페이즈에서만 사용할 수 있어요.',
      'battle only': '배틀 페이즈에서만 할 수 있어요.',
      'not enough mana': '마나가 부족해요.',
      'bad handIndex': '선택한 카드가 유효하지 않아요.',
      'monster zone full': '유닛 존이 가득 찼어요.',
      'spell zone full': '마법 존이 가득 찼어요.',
      'invalid attacker': '공격할 유닛을 다시 선택해 주세요.',
      'invalid target': '공격 대상이 유효하지 않아요.',
      'guard blocks direct attack': `상대 ${KW_GUARD} 유닛 때문에 직접 공격할 수 없어요.`,
      'stack empty': `해결할 ${KW_CHAIN}가 없어요.`,
      'stack payload missing': `${KW_CHAIN} 데이터가 없어 해결할 수 없어요.`,
      'stack not empty': '스택이 비어야 그 행동을 할 수 있어요.',
      'priority required': '지금은 우선권이 없어요.',
      'unsupported action': '지원하지 않는 행동이에요.',
      'game ended': '이미 게임이 끝났어요.',
      'unknown actor': '플레이어 정보를 찾을 수 없어요.',
      'battle blocked': '첫 턴에는 배틀이 제한돼요.',
      'opponent timeout': '상대 미응답으로 승리 처리됐어요.'
    };
    return map[String(reason || '')] || '지금은 그 행동을 할 수 없어요.';
  }


  function matchesCardFilterLocal(cardKey, filter = {}) {
    const k = normalizeCardKey(cardKey);
    const def = getCardDef(k) || {};
    if (filter.key && k !== filter.key) return false;
    if (filter.type && getCardType(k) !== filter.type) return false;
    if (filter.race && def.race !== filter.race) return false;
    if (filter.theme && def.theme !== filter.theme) return false;
    if (filter.element && def.element !== filter.element) return false;
    return true;
  }

  function isConditionMetLocal(condition = {}, context = {}) {
    if (!condition || typeof condition !== 'object' || !Object.keys(condition).length) return true;
    const meAgent = game?.agents?.[pid()];
    if (!meAgent) return false;

    const board = condition.actorBoardHas;
    if (board) {
      const min = Number(board.min || 1);
      const count = (meAgent.monsterZone || [])
        .map((uid) => uid && game?.units?.[uid])
        .filter(Boolean)
        .filter((u) => matchesCardFilterLocal(u.key, board))
        .length;
      if (count < min) return false;
    }

    if (condition.actorManaAtLeast != null) {
      if ((meAgent.mana || 0) < Number(condition.actorManaAtLeast)) return false;
    }

    return true;
  }

  function closeEffectPickOverlay(commit = false, picks = null) {
    pushSurfaceState({ effectPickVisible: false, effectPickCards: [] });
    if (globalThis.BP_NULSIGHT_GAME?.pickEffectIndex) {
      delete globalThis.BP_NULSIGHT_GAME.pickEffectIndex;
    }
    const done = effectPickResolver;
    effectPickResolver = null;
    if (typeof done === 'function') done(commit ? (Array.isArray(picks) ? picks : []) : null);
  }

  async function pickCardsFromOverlay(title, candidates = [], count = 1) {
    const titleEl = $('effectPickTitle');
    const guideEl = $('effectPickGuide');
    const listEl = $('effectPickList');
    if (!titleEl || !guideEl || !listEl) return null;

    const picks = [];
    let pool = [...candidates];

    return await new Promise((resolve) => {
      effectPickResolver = resolve;

      const render = () => {
        const guideText = `카드를 눌러 선택해줘. (${picks.length}/${count})`;
        pushSurfaceState({
          effectPickVisible: true,
          effectPickTitle: title,
          effectPickGuide: guideText,
          effectPickCards: pool.map((k, idx) => buildOverlayCardState({
            key: k,
            index: idx,
            className: 'effect-pick-overlay__item'
          }))
        });
        titleEl.textContent = title;
        guideEl.textContent = guideText;
        listEl.innerHTML = '';
        globalThis.BP_NULSIGHT_GAME = {
          ...(globalThis.BP_NULSIGHT_GAME || {}),
          pickEffectIndex: (idx) => {
            if (!Number.isInteger(idx) || idx < 0 || idx >= pool.length) return;
            picks.push(pool[idx]);
            pool.splice(idx, 1);
            if (picks.length >= count || !pool.length) {
              closeEffectPickOverlay(true, picks);
              return;
            }
            render();
          }
        };
      };

      render();
    });
  }



  function pickBestTargetUnitId(action = {}) {
    const meId = pid();
    const ids = Object.keys(game?.agents || {});
    const oppId = ids.find((x) => x !== meId);

    const allyUnits = (game?.agents?.[meId]?.monsterZone || [])
      .map((uid) => uid && game?.units?.[uid])
      .filter(Boolean);
    const enemyUnits = (game?.agents?.[oppId]?.monsterZone || [])
      .map((uid) => uid && game?.units?.[uid])
      .filter(Boolean);

    if (action.target === 'ally_front') {
      if (selectedSpellTarget && game?.units?.[selectedSpellTarget]?.ownerId === meId) return selectedSpellTarget;
      return null;
    }
    if (action.target === 'enemy_front') {
      if (selectedSpellTarget && game?.units?.[selectedSpellTarget]?.ownerId === oppId) return selectedSpellTarget;
      return enemyUnits[0]?.id || null;
    }
    if (action.target === 'self_unit') return allyUnits[0]?.id || null;
    return null;
  }

  async function buildEffectSelectionPayload(cardKey, timing, options = {}) {
    const def = cardDefByKey(cardKey) || {};
    const effects = Array.isArray(def.effects) ? def.effects : [];
    const targets = effects.filter((e) => e && e.timing === timing);
    if (!targets.length) return {};

    const meAgent = game?.agents?.[pid()];
    const deck = Array.isArray(meAgent?.deck) ? [...meAgent.deck] : [];

    const selectedEffectIndexes = [];
    const selectedEffectCardChoices = {};
    let targetUnitId = null;
    let didChooseAny = false;

    for (let i = 0; i < targets.length; i++) {
      const e = targets[i] || {};
      if (!isConditionMetLocal(e.condition || {})) continue;

      const manaCost = Number(e?.cost?.mana || 0);
      const manaNow = Number(meAgent?.mana || 0);
      const costHint = manaCost > 0 ? `마나 ${manaCost} 소모 (현재 ${manaNow})` : '마나 소모 없음';

      const isOptional = (e?.mode || 'forced') === 'optional';
      if (isOptional) {
        const ok = await promptConfirm(`선택 효과를 발동할까?\n${costHint}`, '선택 효과');
        if (!ok) continue;
        selectedEffectIndexes.push(i);
        didChooseAny = true;
      } else {
        didChooseAny = true;
      }

      const kind = e?.action?.kind;
      const count = Math.max(1, Number(e?.action?.count || 1));
      let candidates = [];

      if (kind === 'search_deck_to_hand') {
        candidates = deck.filter((k) => matchesCardFilterLocal(k, e?.action?.filter || {}));
      } else if (kind === 'deploy_from_deck') {
        candidates = deck.filter((k) => getCardType(k) === 'monster' && matchesCardFilterLocal(k, e?.action?.filter || {}));
      }

      if (candidates.length) {
        const unique = [];
        const seen = new Set();
        for (const k of candidates) {
          const nk = normalizeCardKey(k);
          if (seen.has(nk)) continue;
          seen.add(nk);
          unique.push(nk);
        }
        const baseTitle = kind === 'search_deck_to_hand' ? `덱 ${KW_SEARCH} 카드 선택` : `${KW_RECRUIT} 카드 선택`;
        const title = manaCost > 0 ? `${baseTitle} · 마나 ${manaCost}` : baseTitle;
        const picked = await pickCardsFromOverlay(title, unique, Math.min(count, unique.length));
        if (picked == null) {
          if (isOptional) continue;
          return null;
        }
        selectedEffectCardChoices[String(i)] = picked;
      }

      const pickedTarget = pickBestTargetUnitId(e?.action || {});
      if (pickedTarget) targetUnitId = pickedTarget;
    }

    if (!didChooseAny && options?.cancelIfEmpty) return null;

    const payload = {};
    payload.selectedEffectIndexes = selectedEffectIndexes;
    if (Object.keys(selectedEffectCardChoices).length) payload.selectedEffectCardChoices = selectedEffectCardChoices;
    if (targetUnitId) payload.targetUnitId = targetUnitId;
    return payload;
  }

  function actionKindLabel(kind = '') {
    const map = {
      self_destroy_unit: '자기 파괴',
      search_deck_to_hand: KW_SEARCH,
      release_unit: '희생',
      deploy_from_deck: KW_RECRUIT,
      banish_unit: '제외',
      attach_equipment: KW_EQUIP,
      heal_unit: '회복',
      deal_damage_to_unit: '피해',
      deal_damage_to_agent: '직격'
    };
    return map[String(kind || '')] || '사용';
  }

  function getActiveSourceActions(meAgent) {
    if (isSpectator || !game || game.activeAgentId !== pid() || game.phase !== 'main' || (game.stack || []).length > 0) {
      return [];
    }

    const out = [];
    const effectUsage = game?.effectUsage?.[pid()] || {};

    const pushAction = (cardKey, actionName, actionArg, usageKey) => {
      const def = cardDefByKey(cardKey) || {};
      const effects = Array.isArray(def.effects) ? def.effects.filter((e) => e && e.timing === 'active') : [];
      if (!effects.length) return;
      if (effectUsage?.[usageKey] === game.turn) return;

      const runnable = effects.filter((e) => isConditionMetLocal(e.condition || {}));
      if (!runnable.length) return;

      const labels = runnable.map((e) => actionKindLabel(e?.action?.kind)).filter(Boolean);
      const normalizedKey = normalizeCardKey(cardKey);
      out.push(typeof VIEW.buildActiveActionState === 'function'
        ? VIEW.buildActiveActionState({
          usageKey,
          cardKey: normalizedKey,
          cardName: cardName(cardKey),
          labels,
          actionName,
          actionArg
        })
        : {
          key: `${usageKey}:${normalizedKey}`,
          label: `${cardName(cardKey)} 사용`,
          detail: labels.join(' · '),
          action: { name: actionName, arg: actionArg }
        });
    };

    (meAgent?.monsterZone || []).forEach((unitId) => {
      const unit = unitId ? game?.units?.[unitId] : null;
      if (!unit?.key) return;
      pushAction(unit.key, 'activateUnitEffect', unitId, `active:unit:${unitId}`);
    });

    (meAgent?.spellZone || []).forEach((slot, spellZoneIndex) => {
      const cardKey = spellSlotKey(slot);
      if (!cardKey) return;
      pushAction(cardKey, 'activateSpellEffect', spellZoneIndex, `active:spell:${pid()}:${spellZoneIndex}`);
    });

    return out;
  }

  function winnerLabel(winnerId) {
    if (typeof VIEW.winnerLabel === 'function') {
      return VIEW.winnerLabel(winnerId, agentNames);
    }
    if (!winnerId) return '-';
    return actorLabel(winnerId);
  }

  function phaseAdvanceLabel(phase) {
    if (typeof VIEW.phaseAdvanceLabel === 'function') {
      return VIEW.phaseAdvanceLabel(phase);
    }
    const map = {
      draw: '메인으로',
      main: '배틀로',
      battle: '엔드로',
      end: '턴 종료'
    };
    return map[String(phase || '')] || 'Phase 진행';
  }

  function renderCardContent({ key = null, unit = null, hand = false } = {}) {
    if (CARD_RENDER?.renderCardContent) return CARD_RENDER.renderCardContent({ key, unit, hand });
    const baseKey = key || unit?.key || null;
    if (!baseKey) return `<div class="slot-empty"></div>`;
    const def = cardDefByKey(baseKey) || {};
    const name = def.name || baseKey;
    const effect = normalizeEffectText(def.effect || '');
    const type = getCardType(baseKey);
    const stat = unit
      ? `${unit.atk}/${unit.hp}`
      : (type === 'monster' && Number.isFinite(def.atk) && Number.isFinite(def.hp) ? `${def.atk}/${def.hp}` : '');
    const meta = [def.guard ? KW_GUARD : '', def.race, def.theme, def.element].filter(Boolean).join(' | ');

    const typeClass = type === 'monster' ? 'card-mini--unit' : 'card-mini--spell';
    return `
      <div class="card-mini ${typeClass} ${hand ? 'hand' : 'zone'}">
        <div class="card-mini__name">${esc(name)}</div>
        ${meta ? `<div class="card-mini__effect">${esc(meta)}</div>` : ''}
        ${effect ? `<div class="card-mini__effect">${esc(effect)}</div>` : '<div class="card-mini__effect muted">효과 없음</div>'}
        ${stat ? `<div class="card-mini__stat">${esc(stat)}</div>` : ''}
      </div>
    `;
  }

  const keywordDescMap = {
    ...(S.KEYWORD_TEXT || {}),
    [KW_GUARD]: (S.KEYWORD_TEXT && S.KEYWORD_TEXT[KW_GUARD]) || `상대 필드에 ${KW_GUARD} 유닛이 있으면 에이전트 직접 공격이 불가능하다.`
  };

  function keywordDescription(kw, def = {}) {
    const key = String(kw || '').trim();
    if (!key) return '설명이 없어요.';
    if (keywordDescMap[key]) return keywordDescMap[key];

    if (def?.race && key === String(def.race)) return '종족 태그: 일부 카드 효과의 조건으로 사용돼요.';
    if (def?.theme && key === String(def.theme)) return '테마 태그: 같은 테마 카드와의 시너지 조건으로 사용돼요.';
    if (def?.element && key === String(def.element)) return '속성 태그: 효과 조건/시너지 판정에 사용돼요.';

    return `카드 효과 텍스트 안의 키워드(${key})다.`;
  }

  function normalizeEffectText(raw = '') {
    return String(raw || '')
      .replace(/([^\s(])\(/g, '$1 (')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function normalizeKeywordToken(raw = '') {
    const token = String(raw || '')
      .split(':')[0]
      .replace(/\s*·\s*마나\s*\d+$/i, '')
      .trim();
    return token;
  }

  function cardKeywords(def = {}) {
    const out = new Set();
    const raw = String(def?.effect || '');
    const regex = /<([^>]+)>/g;
    let m;
    while ((m = regex.exec(raw)) !== null) {
      const src = String(m[1] || '');
      for (const part of src.split('/')) {
        const token = normalizeKeywordToken(part);
        if (token) out.add(token);
      }
    }
    if (def?.guard) out.add(KW_GUARD);
    for (const v of [def?.race, def?.theme, def?.element]) {
      if (v) out.add(String(v));
    }
    return Array.from(out);
  }

  function openCardOverlayByKey(cardKey) {
    const key = normalizeCardKey(cardKey);
    const def = cardDefByKey(key);
    if (!def) return;
    pushSurfaceState({
      cardOverlayVisible: true,
      cardOverlayCardKey: key
    });
  }

  function openCardOverlayByUnit(unitId) {
    const unit = unitId ? game?.units?.[unitId] : null;
    if (!unit?.key) return;
    openCardOverlayByKey(unit.key);
  }

  function closeCardOverlay() {
    pushSurfaceState({
      cardOverlayVisible: false,
      cardOverlayCardKey: ''
    });
  }


  function renderCardButton({
    key,
    className = '',
    style = '',
    attrs = '',
    onClick = '',
    onDoubleClick = ''
  } = {}) {
    if (CARD_RENDER?.renderCardButton) {
      return CARD_RENDER.renderCardButton({ key, className, style, attrs, onClick, onDoubleClick });
    }
    const cls = `hand-card ${className}`.trim();
    const styleAttr = style ? ` style="${style}"` : '';
    const clickAttr = onClick ? ` onclick="${onClick}"` : '';
    const dblClickAttr = onDoubleClick ? ` ondblclick="${onDoubleClick}"` : '';
    return `<button class="${cls}" type="button"${styleAttr}${attrs}${clickAttr}${dblClickAttr}>${renderCardContent({ key, hand: true })}</button>`;
  }

  function selectionText(meAgent) {
    if (isSpectator) return '관전 중이에요.';
    if (selectedHand !== null) {
      const k = meAgent?.hand?.[selectedHand];
      return `선택 카드: ${cardName(k)}`;
    }
    if (selectedAttacker) {
      const u = game?.units?.[selectedAttacker];
      return `공격 유닛: ${cardName(u?.key || selectedAttacker)}`;
    }
    if (selectedSpellTarget) {
      const u = game?.units?.[selectedSpellTarget];
      return `대상 유닛: ${cardName(u?.key || selectedSpellTarget)}`;
    }
    return '선택된 항목이 없어요.';
  }

  async function api(path, method = 'GET', body) {
    const opt = { method, headers: { 'content-type': 'application/json' } };
    if (body) opt.body = JSON.stringify(body);
    const r = await fetch(path, opt);
    return await r.json();
  }



  function setActionButtonsDisabled(disabled) {
    pushSurfaceState({ uiLocked: !!disabled });
  }

  function beginUiBusy(message = '처리 중이에요') {
    uiBusyCount += 1;
    setActionButtonsDisabled(true);
    if (uiBusyCount === 1) LOADING.show(message, { mode: 'spinner' });
  }

  function endUiBusy() {
    uiBusyCount = Math.max(0, uiBusyCount - 1);
    if (uiBusyCount === 0) {
      LOADING.hide();
      renderGame({});
    }
  }

  function slot(html, click, fn, extra = '', dataAttrs = '', onDoubleClick = '') {
    const cls = `slot ${click ? 'clickable' : ''} ${extra}`.trim();
    const dblClickAttr = onDoubleClick ? ` ondblclick="${onDoubleClick}"` : '';
    return `<button class="${cls}" type="button" ${fn ? `onclick="${fn}"` : ''}${dblClickAttr}${dataAttrs}>${html}</button>`;
  }

  function buildSlotState({
    key,
    html,
    clickable = false,
    extraClass = '',
    actionName = '',
    actionArg = null,
    inspectKey = '',
    inspectUnit = '',
    doubleActionName = '',
    doubleActionArg = null
  } = {}) {
    return {
      key: key || `${Date.now()}-${Math.random()}`,
      html,
      className: `slot ${clickable ? 'clickable' : ''} ${extraClass}`.trim(),
      inspectKey: inspectKey || '',
      inspectUnit: inspectUnit || '',
      action: actionName ? { name: actionName, arg: actionArg } : undefined,
      doubleAction: doubleActionName ? { name: doubleActionName, arg: doubleActionArg } : undefined
    };
  }

  function buildHandCardState({ key, index, selected = false } = {}) {
    return {
      key: `${normalizeCardKey(key)}-${index}`,
      cardKey: normalizeCardKey(key),
      index,
      className: `hand-card ${selected ? 'sel' : ''}`.trim(),
      html: renderCardContent({ key, hand: true })
    };
  }

  function buildOverlayCardState({ key, index = null, className = '' } = {}) {
    return {
      key: `${normalizeCardKey(key)}-${index ?? 'overlay'}`,
      cardKey: normalizeCardKey(key),
      className,
      pickIndex: Number.isInteger(index) ? index : undefined
    };
  }

  function describeStackAction(action = {}) {
    const kind = String(action?.kind || '').trim();
    const value = Number(action?.value || 0);
    switch (kind) {
      case 'deal_damage_to_agent':
        return `상대 본체에 ${value || 0} 피해`;
      case 'deal_damage_to_unit':
        return `대상 유닛에 ${value || 0} 피해`;
      case 'heal_unit':
        return `대상 유닛 회복`;
      case 'attach_equipment':
        return `${KW_EQUIP} 효과 적용`;
      case 'banish_unit':
        return '대상 유닛 제외';
      case 'deploy_from_deck':
        return `${KW_RECRUIT} 대기 중`;
      case 'search_deck_to_hand':
        return `${KW_SEARCH} 대기 중`;
      default:
        return kind ? `${kind} 해결 대기` : `${KW_CHAIN} 대기 중`;
    }
  }

  function buildStackEntryState(item, index = 0) {
    const key = normalizeCardKey(item?.sourceCardKey || item?.effectKey || `stack-${index}`);
    const title = cardLabel(key);
    const action = item?.payload?.action || getStackDefaultAction(item?.effectKey) || null;
    if (typeof VIEW.buildStackEntryState === 'function') {
      return VIEW.buildStackEntryState({
        id: item?.id,
        key,
        index,
        title,
        actorName: displayName(item?.actorId),
        action
      });
    }
    return {
      key: `${item?.id || key}-${index}`,
      actorText: `${displayName(item?.actorId)} · ${title}`,
      summaryText: describeStackAction(action),
      cardKey: key
    };
  }

  function closeQueryOverlay(result = null) {
    pushSurfaceState({ queryVisible: false, queryOptions: [] });
    if (globalThis.BP_NULSIGHT_GAME?.respondQueryOverlay) {
      delete globalThis.BP_NULSIGHT_GAME.respondQueryOverlay;
    }
    const done = queryOverlayResolver;
    queryOverlayResolver = null;
    if (typeof done === 'function') done(result);
  }

  function showQueryOverlay({ title = '확인', message = '', options = [{ label: '확인', value: 'ok', tone: 'primary' }] } = {}) {
    return new Promise((resolve) => {
      queryOverlayResolver = resolve;
      pushSurfaceState({
        queryVisible: true,
        queryTitle: title,
        queryMessage: message,
        queryOptions: options
      });
      globalThis.BP_NULSIGHT_GAME = {
        ...(globalThis.BP_NULSIGHT_GAME || {}),
        respondQueryOverlay: (value) => closeQueryOverlay(value)
      };
    });
  }

  async function promptConfirm(message, title = '확인') {
    const result = await showQueryOverlay({
      title,
      message,
      options: [
        { label: '취소', value: 'cancel' },
        { label: '확인', value: 'confirm', tone: 'primary' }
      ]
    });
    return result === 'confirm';
  }

  async function showInfo(message, title = '안내') {
    await showQueryOverlay({
      title,
      message,
      options: [{ label: '확인', value: 'ok', tone: 'primary' }]
    });
  }

  function showPhaseFx(text) {
    let el = $('phaseFx');
    if (!el) {
      el = document.createElement('div');
      el.id = 'phaseFx';
      el.className = 'phase-fx hidden';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.remove('hidden', 'show');
    void el.offsetWidth;
    el.classList.add('show');
    if (phaseFxTimer) clearTimeout(phaseFxTimer);
    phaseFxTimer = setTimeout(() => el.classList.remove('show'), 640);
  }

  const AUTO_END_REDIRECT = false;

  function scheduleEndRedirect(delay = 1500) {
    if (!AUTO_END_REDIRECT) return;
    if (endRedirectTimer) return;
    endRedirectTimer = setTimeout(() => {
      if (game?.winnerId) goLobby(true);
    }, delay);
  }

  function markEndedCooldown(ms = 8000) {
    const room = rid();
    if (!room) return;
    try {
      sessionStorage.setItem(`bp_room_end_cooldown_${room}`, String(Date.now() + ms));
    } catch { }
  }

  function hasLiveMatch() {
    return !isSpectator && !!(game && !game.winnerId);
  }

  function syncUrlWithState() {
    const room = rid();
    const agent = pid();
    if (!room || !agent) return;
    const u = new URL(location.href);
    let changed = false;
    if (!u.searchParams.get('roomId')) {
      u.searchParams.set('roomId', room);
      changed = true;
    }
    if (!u.searchParams.get('agentId')) {
      u.searchParams.set('agentId', agent);
      changed = true;
    }
    if (changed) history.replaceState(null, '', `${u.pathname}?${u.searchParams.toString()}`);
  }

  async function goLobby(force = false) {
    if (leavingGame) return;
    if (!force && hasLiveMatch()) {
      const ok = await promptConfirm('진행 중인 게임에서 나가면 복귀가 번거로울 수 있어요. 이동할까요?', '대기실 이동 확인');
      if (!ok) return;
    }
    if (game?.winnerId) markEndedCooldown();
    leavingGame = true;
    location.href = `/lobby?roomId=${encodeURIComponent(rid())}&agentId=${encodeURIComponent(pid())}${game?.winnerId ? '&ended=1' : ''}`;
  }

  function getHandOverlapPx(count, containerWidth = 0) {
    const n = Number(count || 0);
    if (n <= 1) return 0;

    const mobile = window.matchMedia?.('(max-width: 560px)')?.matches;
    const cardW = mobile ? 118 : 110;
    const available = Math.max(220, Number(containerWidth || 0));
    const total = cardW * n;
    const neededOverlap = Math.ceil((total - available) / (n - 1));
    return Math.max(0, Math.min(cardW - 34, neededOverlap));
  }

  function renderGame(r = {}) {
    if (r.game) game = r.game;
    if (r.agentNames && typeof r.agentNames === 'object') agentNames = r.agentNames;
    if (!game) return;

    const ids = Object.keys(game.agents || {});
    const participant = !!game.agents?.[pid()];
    isSpectator = isSpectator || !participant || !!r.spectator;

    const viewer = participant ? pid() : ids[0];
    const meAgent = game.agents?.[viewer];
    const oppId = ids.find((x) => x !== viewer);
    const opp = game.agents?.[oppId];
    viewMeId = viewer;
    viewOppId = oppId || '';
    const myTurn = game.activeAgentId === pid();
    const priorityHolder = game.priority?.holderId || game.activeAgentId;
    const myPriority = priorityHolder === pid();

    const phaseKey = `${game.turn}:${game.activeAgentId}:${game.phase}`;
    if (phaseKey !== lastPhaseKey) {
      showPhaseFx(`${phaseLabel(game.phase)} 페이즈`);
      lastPhaseKey = phaseKey;
    }

    const boardEl = document.querySelector('.board');
    if (boardEl) {
      const myZone = boardEl.querySelector('.zone-block.me');
      const oppZone = boardEl.querySelector('.zone-block.opp');
      const activeIsMe = game.activeAgentId === pid();
      myZone?.classList.toggle('is-active-turn', !!activeIsMe);
      myZone?.classList.toggle('is-waiting-turn', !activeIsMe);
      oppZone?.classList.toggle('is-active-turn', !activeIsMe);
      oppZone?.classList.toggle('is-waiting-turn', !!activeIsMe);
    }

    const hudState = typeof VIEW.buildHudState === 'function'
      ? VIEW.buildHudState({
        game,
        myTurn,
        myPriority,
        isSpectator,
        selectionText: selectionText(meAgent),
        agentNames,
        priorityHolderId: priorityHolder
      })
      : {
        turnText: `${displayName(game.activeAgentId)} 턴 · Turn ${game.turn}`,
        turnTone: myTurn ? 'me' : 'opp',
        phaseText: phaseLabel(game.phase),
        focusText: selectionText(meAgent),
        noticeText: isSpectator
          ? '관전 모드: 액션을 할 수 없어요.'
          : (myPriority
            ? '우선권이 있어요. 패스하거나 대응할 수 있어요.'
            : (myTurn ? '행동할 수 있어요.' : `${displayName(game.activeAgentId)} 턴을 기다리는 중이에요.`)),
        badges: [
          `Stack ${game.stack?.length || 0}`,
          `우선권 ${displayName(priorityHolder)}`,
          ...(game.winnerId ? [`승자 ${winnerLabel(game.winnerId)}`] : [])
        ]
      };
    pushHudState(hudState);

    const myMonsterSlots = (meAgent?.monsterZone || [null, null, null]).map((v, i) => {
      const u = v ? game?.units?.[v] : null;
      const selectedKey = selectedHand !== null ? meAgent?.hand?.[selectedHand] : null;
      const selectedDef = selectedKey ? cardDefByKey(selectedKey) : null;
      const targetSpec = getPendingUnitTargetSpec();
      const canSelectAttacker = !!(v && u && !u.exhausted && myTurn && game.phase === 'battle');
      const canEquipTarget = !!(v && selectedHand !== null && selectedDef?.spellKind === 'equip' && myTurn && game.phase === 'main');
      const canFieldTarget = !!(v && targetSpec && (targetSpec.side === 'ally' || targetSpec.side === 'any') && myTurn && game.phase === 'main');
      const canDeploy = selectedHand !== null && !v && getCardType(meAgent?.hand?.[selectedHand]) === 'monster' && myTurn && game.phase === 'main';
      const click = canSelectAttacker || canDeploy || canEquipTarget || canFieldTarget;
      const fn = canSelectAttacker
        ? `selectAttacker(${i})`
        : (canDeploy ? `placeSelectedToMonster(${i})` : ((canEquipTarget || canFieldTarget) ? `selectSpellTarget(${i})` : ''));
      const extra = [
        v && (canEquipTarget || canFieldTarget) ? 'targetable' : '',
        v && selectedSpellTarget === v ? 'target-picked' : '',
        v && selectedAttacker === v ? 'attacker-picked' : '',
        v && u?.exhausted ? 'exhausted' : ''
      ].filter(Boolean).join(' ');
      return buildSlotState({
        key: `my-mon-${v || i}`,
        html: renderCardContent({ unit: u }),
        clickable: click,
        extraClass: extra,
        actionName: canSelectAttacker
          ? 'selectAttacker'
          : (canDeploy ? 'placeSelectedToMonster' : ((canEquipTarget || canFieldTarget) ? 'selectSpellTarget' : '')),
        actionArg: click ? i : null,
        inspectUnit: v || '',
        doubleActionName: v ? 'openCardOverlayByUnit' : '',
        doubleActionArg: v || null
      });
    });

    const oppMonsterSlots = (opp?.monsterZone || [null, null, null]).map((v, i) => {
      const targetSpec = getPendingUnitTargetSpec();
      const canAttackTarget = !!(selectedAttacker && myTurn && game.phase === 'battle' && v);
      const canFieldTarget = !!(v && targetSpec && (targetSpec.side === 'enemy' || targetSpec.side === 'any') && myTurn && game.phase === 'main');
      const canTarget = canAttackTarget || canFieldTarget;
      const u = v ? game?.units?.[v] : null;
      const extra = [
        v && canFieldTarget ? 'targetable' : '',
        v && selectedSpellTarget === v ? 'target-picked' : ''
      ].filter(Boolean).join(' ');
      return buildSlotState({
        key: `opp-mon-${v || i}`,
        html: renderCardContent({ unit: u }),
        clickable: canTarget,
        extraClass: extra,
        actionName: canAttackTarget ? 'attackOpponentUnit' : (canFieldTarget ? 'selectOpponentFieldTarget' : ''),
        actionArg: canTarget ? i : null,
        inspectUnit: v || '',
        doubleActionName: v ? 'openCardOverlayByUnit' : '',
        doubleActionArg: v || null
      });
    });

    const mySpellSlots = (meAgent?.spellZone || [null, null, null, null]).map((v, i) => {
      const canDeploy = selectedHand !== null && !v && getCardType(meAgent?.hand?.[selectedHand]) === 'spell' && myTurn && game.phase === 'main';
      const spellKey = spellSlotKey(v);
      return buildSlotState({
        key: `my-spell-${spellKey || i}`,
        html: renderCardContent({ key: spellKey }),
        clickable: canDeploy,
        actionName: canDeploy ? 'placeSelectedToSpell' : '',
        actionArg: canDeploy ? i : null,
        inspectKey: spellKey || '',
        doubleActionName: spellKey ? 'openCardOverlayByKey' : '',
        doubleActionArg: spellKey || null
      });
    });

    const oppSpellSlots = (opp?.spellZone || [null, null, null, null]).map((v, i) => {
      const spellKey = spellSlotKey(v);
      return buildSlotState({
        key: `opp-spell-${spellKey || i}`,
        html: renderCardContent({ key: spellKey }),
        inspectKey: spellKey || '',
        doubleActionName: spellKey ? 'openCardOverlayByKey' : '',
        doubleActionArg: spellKey || null
      });
    });

    const myDeckLeft = Array.isArray(meAgent?.deck) ? meAgent.deck.length : '-';
    const oppDeckLeft = Array.isArray(opp?.deck) ? opp.deck.length : '-';
    const myHandCount = Array.isArray(meAgent?.hand) ? meAgent.hand.length : '-';
    const oppHandCount = Array.isArray(opp?.hand) ? opp.hand.length : '-';

    const myGrave = meAgent?.graveyard || [];
    const oppGrave = opp?.graveyard || [];
    const myBanish = meAgent?.banished || [];
    const oppBanish = opp?.banished || [];
    const stackEntries = (game.stack || []).map((item, index) => buildStackEntryState(item, index));
    const activeActions = getActiveSourceActions(meAgent);
    const surfaceMeta = typeof VIEW.buildSurfaceMeta === 'function'
      ? VIEW.buildSurfaceMeta({
        game,
        meAgent,
        oppAgent: opp,
        myHandCount,
        oppHandCount,
        myTurn,
        myPriority,
        isSpectator,
        selectedAttacker,
        stackCount: stackEntries.length
      })
      : {
        mySummary: {
          hp: String(meAgent?.hp ?? '-'),
          mana: `${meAgent?.mana ?? '-'}/${meAgent?.manaMax ?? '-'}`,
          hand: String(myHandCount)
        },
        oppSummary: {
          hp: String(opp?.hp ?? '-'),
          mana: `${opp?.mana ?? '-'}/${opp?.manaMax ?? '-'}`,
          hand: String(oppHandCount)
        },
        endButtonLabel: phaseAdvanceLabel(game.phase),
        endButtonDisabled: isSpectator || !myTurn || !myPriority,
        passButtonLabel: '우선권 패스',
        passButtonDisabled: isSpectator || !myPriority || (!((game.stack || []).length) && !game.pendingAdvance),
        concedeDisabled: isSpectator,
        attackDisabled: isSpectator || !myTurn || !myPriority || game.phase !== 'battle' || !selectedAttacker,
        stackActive: stackEntries.length > 0
      };
    pushSurfaceState({
      myDeckText: `덱 ${myDeckLeft}`,
      oppDeckText: `덱 ${oppDeckLeft}`,
      myGraveText: `무덤 ${myGrave.length}`,
      oppGraveText: `무덤 ${oppGrave.length}`,
      myBanishText: `제외 ${myBanish.length}`,
      oppBanishText: `제외 ${oppBanish.length}`,
      myGraveActive: myGrave.length > 0,
      oppGraveActive: oppGrave.length > 0,
      myBanishActive: myBanish.length > 0,
      oppBanishActive: oppBanish.length > 0,
      stackActive: surfaceMeta.stackActive,
      mySummary: surfaceMeta.mySummary,
      oppSummary: surfaceMeta.oppSummary,
      myMonsterSlots,
      oppMonsterSlots,
      mySpellSlots,
      oppSpellSlots,
      stackEntries,
      activeActions
    });

    if (!isSpectator) {
      const handCards = meAgent?.hand || [];
      const handEl = $('hand');
      const overlap = getHandOverlapPx(handCards.length, handEl?.clientWidth || 0);
      pushSurfaceState({
        handCards: handCards.map((k, i) => buildHandCardState({ key: k, index: i, selected: selectedHand === i })),
        handOverlapPx: overlap,
        handOverlapEnabled: overlap > 0,
        handEmptyText: ''
      });
    } else {
      pushSurfaceState({
        handCards: [],
        handOverlapPx: 0,
        handOverlapEnabled: false,
        handEmptyText: '관전 중이라 손패를 볼 수 없어요.'
      });
    }

    if (game.winnerId) {
      const meWin = game.winnerId === pid();
      pushSurfaceState({
        endOverlayVisible: true,
        endOverlayText: meWin ? '승리!' : '패배...'
      });
      markEndedCooldown();
      scheduleEndRedirect(1400);
    } else {
      pushSurfaceState({ endOverlayVisible: false });
    }

    pushSurfaceState({
      endButtonLabel: surfaceMeta.endButtonLabel,
      endButtonDisabled: surfaceMeta.endButtonDisabled,
      passButtonLabel: surfaceMeta.passButtonLabel,
      passButtonDisabled: surfaceMeta.passButtonDisabled,
      concedeDisabled: surfaceMeta.concedeDisabled,
      attackDisabled: surfaceMeta.attackDisabled
    });
  }


  async function refreshState(showToast = false) {
    const room = rid();
    if (leavingGame || !room) return;
    saveRoom(room);
    const meId = pid();
    if (meId) saveAgent(meId);
    if (showToast) beginUiBusy('동기화 중이에요');
    try {
      const seq = ++refreshSeq;
      const r = await api(`/api/rooms?action=state&roomId=${encodeURIComponent(room)}`);
      if (seq !== refreshSeq) return;
      if (!r.ok) return;

      if (!r.game) {
        if (hadLiveGame) {
          // 종료 오버레이를 본 상태(승패 확정)에서는 자동 로비 이동하지 않는다.
          if (game?.winnerId) return;
          return goLobby(true);
        }
        return;
      }

      hadLiveGame = true;
      const sig = gameSig(r.game);
      if (sig !== lastRenderSig || showToast) {
        renderGame(r);
        lastRenderSig = sig;
      }

    const isMyDrawPhase = !isSpectator && r.game?.activeAgentId === pid() && r.game?.phase === 'draw';
    if (isMyDrawPhase) {
      const key = `${r.game.turn}:${r.game.activeAgentId}:draw`;
      if (autoAdvanceDrawKey !== key) {
        autoAdvanceDrawKey = key;
        autoAdvanceDrawTimer = setTimeout(() => {
          if (game && game.activeAgentId === pid() && game.phase === 'draw' && !game.winnerId && !actInFlight) {
            act('end_phase', {}, { silent: true, source: 'auto-draw' });
          }
          autoAdvanceDrawTimer = null;
        }, 700);
      }
    }

    const isMyEndPhase = !isSpectator && r.game?.activeAgentId === pid() && r.game?.phase === 'end';
    if (isMyEndPhase) {
      const key = `${r.game.turn}:${r.game.activeAgentId}:end`;
      if (autoAdvanceEndKey !== key) {
        autoAdvanceEndKey = key;
        autoAdvanceEndTimer = setTimeout(() => {
          if (game && game.activeAgentId === pid() && game.phase === 'end' && !game.winnerId && !actInFlight) {
            act('end_phase', {}, { silent: true, source: 'auto-end' });
          }
          autoAdvanceEndTimer = null;
        }, 700);
      }
    }

    if (r.game?.winnerId) scheduleEndRedirect(1400);
    } finally {
      if (showToast) endUiBusy();
    }
  }

  async function act(type, payload, opts = {}) {
    if (isSpectator) return;
    if (actInFlight) return;
    actInFlight = true;
    if (!opts?.silent) beginUiBusy('행동 처리 중이에요');
    try {
      const r = await api('/api/game?action=action', 'POST', {
        roomId: rid(),
        action: { type, payload }
      });
      if (!r?.ok) {
        if (!opts?.silent) {
          const msg = reasonLabel(r?.reason);
          endUiBusy();
          await showInfo(msg, '게임 액션');
        }
        await refreshState(false);
        return false;
      }
      renderGame(r);
      lastRenderSig = gameSig(r.game);
      if (r?.matchEnded || r?.roomReset || r?.game?.winnerId) scheduleEndRedirect(1100);
      return true;
    } finally {
      actInFlight = false;
      if (!opts?.silent) endUiBusy();
    }
  }

  function selectHand(i) {
    if (!game || game.activeAgentId !== pid()) return;
    selectedHand = selectedHand === i ? null : i;
    selectedAttacker = null;
    selectedSpellTarget = null;
    renderGame({});
  }

  function selectAttacker(zoneIndex) {
    const meAgent = game?.agents?.[pid()];
    const id = meAgent?.monsterZone?.[zoneIndex];
    const unit = id ? game?.units?.[id] : null;
    if (!id || !unit || unit.exhausted || game.phase !== 'battle' || game.activeAgentId !== pid()) return;
    selectedAttacker = selectedAttacker === id ? null : id;
    selectedHand = null;
    selectedSpellTarget = null;
    renderGame({});
  }


  function selectSpellTarget(zoneIndex) {
    const meAgent = game?.agents?.[pid()];
    const unitId = meAgent?.monsterZone?.[zoneIndex];
    if (!unitId) return;
    selectedSpellTarget = selectedSpellTarget === unitId ? null : unitId;
    selectedAttacker = null;
    renderGame({});
  }

  function selectOpponentFieldTarget(zoneIndex) {
    const ids = Object.keys(game?.agents || {});
    const oppId = ids.find((x) => x !== pid());
    const unitId = game?.agents?.[oppId]?.monsterZone?.[zoneIndex];
    if (!unitId) return;
    selectedSpellTarget = selectedSpellTarget === unitId ? null : unitId;
    selectedAttacker = null;
    renderGame({});
  }

  async function placeSelectedToMonster(zoneIndex) {
    if (selectedHand === null) return;
    const meAgent = game?.agents?.[pid()];
    const k = meAgent?.hand?.[selectedHand];
    if (!k || getCardType(k) !== 'monster') return;
    if (game.activeAgentId !== pid() || game.phase !== 'main') return;
    const def = cardDefByKey(k) || {};
    const targetSpec = getPendingUnitTargetSpec();
    const payload = { handIndex: selectedHand, zoneIndex };
    if (targetSpec?.required && !selectedSpellTarget) {
      await showInfo('대상 유닛을 먼저 선택해 주세요.', '대상 선택');
      return;
    }
    if (def.spellKind === 'equip' && selectedSpellTarget) payload.targetUnitId = selectedSpellTarget;
    else if (targetSpec && selectedSpellTarget) payload.targetUnitId = selectedSpellTarget;
    const effectPick = await buildEffectSelectionPayload(k, 'on_deploy');
    if (effectPick === null) return;
    Object.assign(payload, effectPick);
    await act('play_card', payload);
    selectedHand = null;
    selectedSpellTarget = null;
    renderGame({});
  }

  async function placeSelectedToSpell(zoneIndex) {
    if (selectedHand === null) return;
    const meAgent = game?.agents?.[pid()];
    const k = meAgent?.hand?.[selectedHand];
    if (!k || getCardType(k) !== 'spell') return;
    if (game.activeAgentId !== pid() || game.phase !== 'main') return;
    const def = cardDefByKey(k) || {};
    const targetSpec = getPendingUnitTargetSpec();
    const payload = { handIndex: selectedHand, zoneIndex };

    if (targetSpec?.required && !selectedSpellTarget) {
      await showInfo('대상 유닛을 먼저 선택해 주세요.', '대상 선택');
      return;
    }

    if (def.spellKind === 'equip' && selectedSpellTarget) payload.targetUnitId = selectedSpellTarget;
    else if (targetSpec && selectedSpellTarget) payload.targetUnitId = selectedSpellTarget;
    const effectPick = await buildEffectSelectionPayload(k, 'on_play');
    if (effectPick === null) return;
    Object.assign(payload, effectPick);
    await act('play_card', payload);
    selectedHand = null;
    selectedSpellTarget = null;
    renderGame({});
  }

  async function activateUnitEffect(unitId) {
    if (!unitId || !game || game.activeAgentId !== pid() || game.phase !== 'main') return;
    const unit = game?.units?.[unitId];
    if (!unit || unit.ownerId !== pid()) return;
    const payload = { unitId };
    const effectPick = await buildEffectSelectionPayload(unit.key, 'active', { cancelIfEmpty: true });
    if (effectPick === null) return;
    Object.assign(payload, effectPick);
    const ok = await act('active_effect', payload);
    if (ok) {
      selectedSpellTarget = null;
      selectedHand = null;
      selectedAttacker = null;
    }
    renderGame({});
  }

  async function activateSpellEffect(spellZoneIndex) {
    if (!game || game.activeAgentId !== pid() || game.phase !== 'main') return;
    const meAgent = game?.agents?.[pid()];
    const slot = Number.isInteger(spellZoneIndex) ? meAgent?.spellZone?.[spellZoneIndex] : null;
    const cardKey = spellSlotKey(slot);
    if (!cardKey) return;
    const payload = { spellZoneIndex };
    const effectPick = await buildEffectSelectionPayload(cardKey, 'active', { cancelIfEmpty: true });
    if (effectPick === null) return;
    Object.assign(payload, effectPick);
    const ok = await act('active_effect', payload);
    if (ok) {
      selectedSpellTarget = null;
      selectedHand = null;
      selectedAttacker = null;
    }
    renderGame({});
  }

  async function attackOpponentUnit(zoneIndex) {
    if (!selectedAttacker || game.phase !== 'battle') return;
    const ids = Object.keys(game.agents || {});
    const oppId = ids.find((x) => x !== pid());
    const target = game.agents?.[oppId]?.monsterZone?.[zoneIndex];
    if (!target) return;
    await act('attack', { attackerId: selectedAttacker, targetUnitId: target });
    selectedAttacker = null;
    renderGame({});
  }

  async function attackOpponentAgent() {
    if (!selectedAttacker || game.phase !== 'battle') return;
    await act('attack', { attackerId: selectedAttacker });
    selectedAttacker = null;
    renderGame({});
  }

  function handleHandCardClick(event, i) {
    const meAgent = game?.agents?.[viewMeId || pid()];
    const key = meAgent?.hand?.[i];
    if (selectedHand === i && key) {
      openCardOverlayByKey(key);
      return;
    }
    selectHand(i);
  }

  function openPile(which, kind = 'graveyard') {
    if (!game) return;
    const targetId = which === 'opp' ? viewOppId : viewMeId;
    if (!targetId) return;
    const pileName = kind === 'banished' ? '제외' : '무덤';
    const title = `${displayName(targetId)} ${pileName}`;
    const pile = kind === 'banished'
      ? (Array.isArray(game.agents?.[targetId]?.banished) ? game.agents[targetId].banished : [])
      : (Array.isArray(game.agents?.[targetId]?.graveyard) ? game.agents[targetId].graveyard : []);
    const latestFirst = [...pile].reverse();
    pushSurfaceState({
      graveVisible: true,
      graveTitle: `${title} (${pile.length})`,
      graveCards: latestFirst.map((k, idx) => buildOverlayCardState({
        key: k,
        index: idx,
        className: 'grave-card'
      }))
    });
  }

  function openGrave(which) {
    openPile(which, 'graveyard');
  }

  function openBanish(which) {
    openPile(which, 'banished');
  }

  function closeGrave() {
    pushSurfaceState({ graveVisible: false, graveCards: [] });
  }

  function openStackOverlay() {
    pushSurfaceState({ stackVisible: true });
  }

  function closeStackOverlay() {
    pushSurfaceState({ stackVisible: false });
  }

  async function concedeAndExit() {
    const ok = await act('concede');
    if (ok) goLobby(true);
  }

  window.refreshState = refreshState;
  window.act = act;
  window.selectHand = selectHand;
  window.selectAttacker = selectAttacker;
  window.selectSpellTarget = selectSpellTarget;
  window.selectOpponentFieldTarget = selectOpponentFieldTarget;
  window.placeSelectedToMonster = placeSelectedToMonster;
  window.placeSelectedToSpell = placeSelectedToSpell;
  window.attackOpponentUnit = attackOpponentUnit;
  window.attackOpponentAgent = attackOpponentAgent;
  window.activateUnitEffect = activateUnitEffect;
  window.activateSpellEffect = activateSpellEffect;
  window.openGrave = openGrave;
  window.openBanish = openBanish;
  window.closeGrave = closeGrave;
  window.openStackOverlay = openStackOverlay;
  window.closeStackOverlay = closeStackOverlay;
  window.openCardOverlayByKey = openCardOverlayByKey;
  window.openCardOverlayByUnit = openCardOverlayByUnit;
  window.closeCardOverlay = closeCardOverlay;
  window.closeEffectPickOverlay = closeEffectPickOverlay;
  window.respondQueryOverlay = (value) => closeQueryOverlay(value);
  window.handleHandCardClick = handleHandCardClick;
  window.concedeAndExit = concedeAndExit;
  window.goLobby = goLobby;

  function teardown() {
    leavingGame = true;
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
    if (phaseFxTimer) {
      clearTimeout(phaseFxTimer);
      phaseFxTimer = null;
    }
    if (autoAdvanceDrawTimer) {
      clearTimeout(autoAdvanceDrawTimer);
      autoAdvanceDrawTimer = null;
    }
    if (autoAdvanceEndTimer) {
      clearTimeout(autoAdvanceEndTimer);
      autoAdvanceEndTimer = null;
    }
    if (endRedirectTimer) {
      clearTimeout(endRedirectTimer);
      endRedirectTimer = null;
    }
    pushSurfaceState({
      graveVisible: false,
      graveCards: [],
      stackVisible: false,
      stackEntries: [],
      cardOverlayVisible: false,
      cardOverlayCardKey: '',
      effectPickVisible: false,
      effectPickCards: [],
      queryVisible: false,
      queryOptions: [],
      endOverlayVisible: false
    });
    $('phaseFx')?.remove();
    effectPickResolver = null;
    queryOverlayResolver = null;
    removeEventListener('keydown', keydownHandler);
  }

  async function bootstrap() {
    LOADING.show('매치를 불러오는 중이에요', { mode: 'percent' });
    try {
      const m = await api('/api/auth?action=me');
      if (!m.ok) {
        location.href = `/login?next=${encodeURIComponent(location.pathname + location.search)}`;
        return;
      }
      me = m.user;
      saveAgent(me.username);
      const room = rid();
      const meId = pid();
      if (room) saveRoom(room);
      if (!room || !meId) {
        goLobby(true);
        return;
      }
      syncUrlWithState();
      await refreshState(false);
      refreshTimer = setInterval(() => refreshState(false), 2500);
    } finally {
      LOADING.hide();
    }
  }

  // 브라우저 기본 "사이트에서 나갈까요?" 경고를 사용하지 않는다.
  const keydownHandler = (e) => {
    if (e.key !== 'Escape') return;
    const effectPickOpen = !$('effectPickOverlay')?.classList.contains('hidden');
    if (effectPickOpen) {
      closeEffectPickOverlay(false);
      return;
    }
    const queryOpen = !$('queryOverlay')?.classList.contains('hidden');
    if (queryOpen) {
      closeQueryOverlay('cancel');
      return;
    }
    closeCardOverlay();
    closeGrave();
    closeStackOverlay();
  };

  function start() {
    if (!bootstrapPromise) {
      bootstrapPromise = bootstrap();
    }
    return bootstrapPromise;
  }

  addEventListener('keydown', keydownHandler);
  globalThis.BP_NULSIGHT_GAME = { ...(globalThis.BP_NULSIGHT_GAME || {}), bootstrap: start, teardown };
  void start();
})();
