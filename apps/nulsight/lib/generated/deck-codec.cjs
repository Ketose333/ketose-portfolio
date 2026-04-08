var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/server/generated/deck-codec.ts
var deck_codec_exports = {};
__export(deck_codec_exports, {
  decodeDeckCodeSummary: () => decodeDeckCodeSummary
});
module.exports = __toCommonJS(deck_codec_exports);

// src/shared/shared-cards.js
(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.BP_SHARED_CARDS = factory();
})(typeof globalThis !== "undefined" ? globalThis : void 0, function() {
  const TERMS = {
    deploy: "\uC804\uAC1C",
    active: "\uC0AC\uC6A9",
    continuous: "\uC9C0\uC18D",
    forced: "\uC790\uB3D9",
    optional: "\uC120\uD0DD",
    search: "\uD0D0\uC0C9",
    recruit: "\uC9D5\uC9D1",
    heal: "\uCE58\uC720",
    overcharge: "\uCDA9\uC804",
    chain: "\uC5F0\uC1C4",
    targeting: "\uC9C0\uC815",
    pressure: "\uD53C\uD574",
    equip: "\uC7A5\uCC29",
    guard: "\uC218\uD638",
    release: "\uD76C\uC0DD",
    banish: "\uC81C\uC678",
    selfDestruct: "\uC790\uD3ED"
  };
  const KEYWORD_TEXT = {
    [TERMS.deploy]: "\uCE74\uB4DC\uB97C \uC874\uC5D0 \uBC30\uCE58\uD558\uACE0 \uAE30\uBCF8 \uBE44\uC6A9\uC744 \uC9C0\uBD88\uD55C\uB2E4.",
    [TERMS.active]: "\uBA54\uC778 \uD398\uC774\uC988\uC5D0 \uC218\uB3D9\uC73C\uB85C \uBC1C\uB3D9\uD558\uB294 \uD6A8\uACFC\uB2E4.",
    [TERMS.continuous]: "\uD544\uB4DC\uC5D0 \uB0A8\uC544 \uC788\uB294 \uB3D9\uC548 \uC601\uD5A5\uC774 \uC720\uC9C0\uB41C\uB2E4.",
    [TERMS.forced]: "\uC870\uAC74\uC744 \uB9CC\uC871\uD558\uBA74 \uC790\uB3D9\uC73C\uB85C \uC801\uC6A9\uB41C\uB2E4.",
    [TERMS.optional]: "\uC0AC\uC6A9\uC790\uAC00 \uC870\uAC74\uC744 \uBCF4\uACE0 \uBC1C\uB3D9 \uC5EC\uBD80\uB97C \uC120\uD0DD\uD55C\uB2E4.",
    [TERMS.search]: "\uB371\uC5D0\uC11C \uC870\uAC74\uC5D0 \uB9DE\uB294 \uCE74\uB4DC\uB97C \uCC3E\uC544 \uC190\uD328\uB85C \uAC00\uC838\uC628\uB2E4.",
    [TERMS.recruit]: "\uB371\uC5D0\uC11C \uC720\uB2DB\uC744 \uC989\uC2DC \uD544\uB4DC\uB85C \uC804\uAC1C\uD55C\uB2E4.",
    [TERMS.heal]: "\uC720\uB2DB \uCCB4\uB825\uC744 \uD68C\uBCF5\uD55C\uB2E4.",
    [TERMS.overcharge]: "\uC77C\uC2DC\uC801\uC73C\uB85C \uB9C8\uB098\uB97C \uD68D\uB4DD\uD55C\uB2E4.",
    [TERMS.chain]: "\uC2A4\uD0DD\uC5D0 \uC62C\uB9B0 \uB4A4 \uC2A4\uD0DD \uD574\uACB0 \uC2DC\uC810\uC5D0 \uD574\uACB0\uB41C\uB2E4.",
    [TERMS.targeting]: "\uC544\uAD70/\uC801\uAD70 \uC720\uB2DB \uC911 \uB300\uC0C1\uC744 \uC815\uD574 \uC801\uC6A9\uD55C\uB2E4.",
    [TERMS.pressure]: "\uC801 \uC720\uB2DB\uC774\uB098 \uC5D0\uC774\uC804\uD2B8\uC5D0\uAC8C \uC9C1\uC811 \uD53C\uD574\uB97C \uC900\uB2E4.",
    [TERMS.equip]: "\uC544\uAD70 \uC720\uB2DB\uC5D0 \uBD80\uCC29\uB418\uC5B4 \uB2A5\uB825\uCE58\uB97C \uAC15\uD654\uD55C\uB2E4.",
    [TERMS.guard]: "\uC0C1\uB300 \uD544\uB4DC\uC5D0 \uC218\uD638 \uC720\uB2DB\uC774 \uC788\uC73C\uBA74 \uBCF8\uCCB4 \uACF5\uACA9\uD560 \uC218 \uC5C6\uB2E4.",
    [TERMS.release]: "\uC544\uAD70 \uC720\uB2DB\uC744 \uD76C\uC0DD\uD574 \uCD94\uAC00 \uD6A8\uACFC\uC758 \uCF54\uC2A4\uD2B8\uB85C \uC0AC\uC6A9\uD55C\uB2E4.",
    [TERMS.banish]: "\uB300\uC0C1 \uC720\uB2DB\uC744 \uBB34\uB364 \uB300\uC2E0 \uC81C\uC678 \uC601\uC5ED\uC73C\uB85C \uBCF4\uB0B8\uB2E4.",
    [TERMS.selfDestruct]: "\uC790\uC2E0 \uC720\uB2DB\uC744 \uC989\uC2DC \uD30C\uAD34\uD55C\uB2E4."
  };
  const ACTION_KEYWORD = {
    heal_self: TERMS.heal,
    search_deck_to_hand: TERMS.search,
    deploy_from_deck: TERMS.recruit,
    gain_mana: TERMS.overcharge,
    enqueue_stack: TERMS.chain,
    deal_damage_to_unit: TERMS.pressure,
    heal_unit: TERMS.targeting,
    deal_damage_to_agent: TERMS.pressure,
    attach_equipment: TERMS.equip,
    self_destroy_unit: TERMS.selfDestruct,
    release_unit: TERMS.release,
    banish_unit: TERMS.banish,
    summon_gear5_route: TERMS.recruit,
    lock_attack_this_turn: TERMS.guard
  };
  const STACK_EFFECT_DEFAULTS = {
    abyss_direct_hit: { kind: "deal_damage_to_agent", target: "opponent", value: 3 }
  };
  const CARD_RACES = ["\uC778\uAC04\uC871", "\uAE30\uACC4\uC871", "\uC57C\uC218\uC871", "\uC815\uB839\uC871", "\uAE30\uC0AC\uC871", "\uC220\uBC95"];
  const CARD_THEMES = ["\uADE0\uD615", "\uAE30\uC5B4", "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", "\uC2EC\uC5F0", "\uBCF4\uAE09", "\uC758\uC2DD"];
  const CARD_ELEMENTS = ["\uBD88", "\uBB3C", "\uBC14\uB78C", "\uB545", "\uBE5B", "\uC5B4\uB460"];
  const META_DEFAULTS = {
    monster: { race: "\uC778\uAC04\uC871", theme: "\uADE0\uD615", element: "\uBE5B" },
    spell: { race: "\uC220\uBC95", theme: "\uADE0\uD615", element: "\uBE5B" }
  };
  const CARD_META_OVERRIDES = {
    balance_observer: { race: "\uC778\uAC04\uC871", theme: "\uADE0\uD615", element: "\uBC14\uB78C" },
    balance_guard_researcher: { race: "\uC778\uAC04\uC871", theme: "\uADE0\uD615", element: "\uB545" },
    alchemista_tank_rabbit: { race: "\uAE30\uACC4\uC871", theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", element: "\uBE5B" },
    alchemista_rabbit_white: { race: "\uAE30\uACC4\uC871", theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", element: "\uBE5B" },
    alchemista_rabbit_black: { race: "\uAE30\uACC4\uC871", theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", element: "\uC5B4\uB460" },
    alchemista_alice: { race: "\uC778\uAC04\uC871", theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", element: "\uBE5B" },
    abyss_direct_hit: { race: "\uC220\uBC95", theme: "\uC2EC\uC5F0", element: "\uBD88" },
    alchemista_workshop: { race: "\uC220\uBC95", theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", element: "\uBE5B" },
    alchemista_fixed_experiment: { race: "\uC220\uBC95", theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", element: "\uBE5B" },
    abyss_suppression_fire: { race: "\uC220\uBC95", theme: "\uC2EC\uC5F0", element: "\uBD88" },
    alchemista_tuktak: { race: "\uC220\uBC95", theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", element: "\uBE5B" },
    abyss_chain_burst: { race: "\uC220\uBC95", theme: "\uC2EC\uC5F0", element: "\uC5B4\uB460" },
    balance_reserve_call: { race: "\uC220\uBC95", theme: "\uADE0\uD615", element: "\uBC14\uB78C" },
    abyss_tactical_volley: { race: "\uC220\uBC95", theme: "\uC2EC\uC5F0", element: "\uBD88" },
    balance_reinforced_blade: { race: "\uC220\uBC95", theme: "\uADE0\uD615", element: "\uBD88" },
    balance_guardian_plating: { race: "\uC220\uBC95", theme: "\uADE0\uD615", element: "\uB545" },
    element_resonance: { race: "\uC220\uBC95", theme: "\uADE0\uD615", element: "\uBE5B" },
    alchemista_recovery_rite: { race: "\uC220\uBC95", theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", element: "\uBE5B" },
    alchemista_core_tuner: { race: "\uAE30\uACC4\uC871", theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", element: "\uBE5B" },
    alchemista_overlock_formula: { race: "\uC220\uBC95", theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", element: "\uC5B4\uB460" },
    abyss_whisper: { race: "\uC220\uBC95", theme: "\uC2EC\uC5F0", element: "\uC5B4\uB460" },
    abyss_scout: { race: "\uC57C\uC218\uC871", theme: "\uC2EC\uC5F0", element: "\uC5B4\uB460" },
    abyss_rift_stalker: { race: "\uC57C\uC218\uC871", theme: "\uC2EC\uC5F0", element: "\uBC14\uB78C" },
    abyss_dark_ritual_field: { race: "\uC220\uBC95", theme: "\uC2EC\uC5F0", element: "\uC5B4\uB460" },
    abyss_mark: { race: "\uC220\uBC95", theme: "\uC2EC\uC5F0", element: "\uBD88" },
    abyss_doomsday_count: { race: "\uC220\uBC95", theme: "\uC2EC\uC5F0", element: "\uBE5B" },
    supply_field_pack: { race: "\uC220\uBC95", theme: "\uBCF4\uAE09", element: "\uBE5B" },
    supply_mana_converter: { race: "\uC220\uBC95", theme: "\uBCF4\uAE09", element: "\uBC14\uB78C" },
    supply_recycle_protocol: { race: "\uC220\uBC95", theme: "\uBCF4\uAE09", element: "\uB545" },
    supply_quartermaster: { race: "\uC778\uAC04\uC871", theme: "\uBCF4\uAE09", element: "\uB545" },
    supply_emergency_ration: { race: "\uC220\uBC95", theme: "\uBCF4\uAE09", element: "\uBE5B" },
    ritual_spark: { race: "\uC220\uBC95", theme: "\uC758\uC2DD", element: "\uBD88" },
    ritual_echo_chant: { race: "\uC220\uBC95", theme: "\uC758\uC2DD", element: "\uC5B4\uB460" },
    ritual_null_seal: { race: "\uC220\uBC95", theme: "\uC758\uC2DD", element: "\uC5B4\uB460" },
    ritual_adept: { race: "\uC815\uB839\uC871", theme: "\uC758\uC2DD", element: "\uC5B4\uB460" },
    ritual_cataclysm_count: { race: "\uC220\uBC95", theme: "\uC758\uC2DD", element: "\uBE5B" },
    gear_r_reverse: { race: "\uAE30\uACC4\uC871", theme: "\uAE30\uC5B4", element: "\uB545" },
    gear_1_clutch: { race: "\uAE30\uACC4\uC871", theme: "\uAE30\uC5B4", element: "\uB545" },
    gear_2_syncro: { race: "\uAE30\uACC4\uC871", theme: "\uAE30\uC5B4", element: "\uB545" },
    gear_3_downshift: { race: "\uAE30\uACC4\uC871", theme: "\uAE30\uC5B4", element: "\uB545" },
    gear_4_overdrive: { race: "\uAE30\uACC4\uC871", theme: "\uAE30\uC5B4", element: "\uB545" },
    gear_5_chronomesh: { race: "\uAE30\uACC4\uC871", theme: "\uAE30\uC5B4", element: "\uB545" },
    gear_6_antikythera_core: { race: "\uAE30\uACC4\uC871", theme: "\uAE30\uC5B4", element: "\uB545" },
    gear_guardian: { race: "\uAE30\uACC4\uC871", theme: "\uAE30\uC5B4", element: "\uB545" },
    gear_phase_signal: { race: "\uC220\uBC95", theme: "\uAE30\uC5B4", element: "\uB545" },
    gear_train_assembly: { race: "\uC220\uBC95", theme: "\uAE30\uC5B4", element: "\uB545" }
  };
  const CARD_BLUEPRINTS = {
    balance_observer: {
      name: "\uC815\uC870\uC900\uC218",
      type: "monster",
      cost: 2,
      atk: 2,
      hp: 2,
      effects: [
        { timing: "on_deploy", cost: { mana: 1 }, action: { kind: "search_deck_to_hand", filter: { theme: "\uADE0\uD615", type: "spell" }, count: 1, label: "theme" } }
      ]
    },
    balance_guard_researcher: { name: "\uBC29\uD638\uB300", type: "monster", cost: 4, atk: 3, hp: 5, guard: true, effects: [] },
    alchemista_tank_rabbit: { name: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0 \uAE30\uAC04\uD0F1\uD06C \uB798\uBE57", type: "monster", cost: 6, atk: 6, hp: 6, effects: [{ timing: "on_deploy", mode: "optional", action: { kind: "deal_damage_to_unit", target: "enemy_front", value: 2 } }, { timing: "on_deploy", mode: "optional", action: { kind: "deal_damage_to_agent", target: "opponent", value: 2 } }] },
    abyss_direct_hit: {
      name: "\uC9C1\uACA9\uD0C4",
      type: "spell",
      spellKind: "normal",
      cost: 2,
      effects: [
        { timing: "on_play", action: { kind: "enqueue_stack", effectKey: "abyss_direct_hit" } }
      ]
    },
    alchemista_workshop: {
      name: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0 \uACF5\uBC29",
      type: "spell",
      spellKind: "normal",
      cost: 2,
      effects: [
        { timing: "on_play", mode: "optional", cost: { mana: 3 }, condition: { actorBoardHas: { theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", min: 1 } }, action: { kind: "search_deck_to_hand", filter: { race: "\uAE30\uACC4\uC871", type: "monster" }, count: 2, label: "race" } }
      ]
    },
    alchemista_fixed_experiment: {
      name: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0 \uACE0\uC815 \uC2E4\uD5D8",
      type: "spell",
      spellKind: "equip",
      cost: 2,
      effects: [
        { timing: "on_play", action: { kind: "attach_equipment", target: "ally_front", bonus: { atk: 1, hp: 1 } } },
        { timing: "on_play", mode: "optional", cost: { mana: 2 }, action: { kind: "heal_unit", target: "ally_front", value: 2 } }
      ]
    },
    alchemista_rabbit_white: {
      name: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0 \uB798\uBE57 \uD654\uC774\uD2B8",
      type: "monster",
      cost: 2,
      atk: 2,
      hp: 3,
      effects: [
        { timing: "on_deploy", mode: "optional", cost: { mana: 1 }, action: { kind: "heal_unit", target: "ally_front", value: 2 } },
        { timing: "on_deploy", mode: "optional", action: { kind: "search_deck_to_hand", filter: { race: "\uAE30\uACC4\uC871", type: "monster" }, count: 1, label: "race" } }
      ]
    },
    alchemista_rabbit_black: {
      name: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0 \uB798\uBE57 \uBE14\uB799",
      type: "monster",
      cost: 4,
      atk: 3,
      hp: 2,
      effects: [
        { timing: "on_deploy", mode: "optional", cost: { mana: 5 }, action: { kind: "search_deck_to_hand", filter: { theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", type: "monster" }, count: 1, label: "theme" } }
      ]
    },
    alchemista_alice: {
      name: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0 \uC568\uB9AC\uC2A4",
      type: "monster",
      cost: 4,
      atk: 4,
      hp: 3,
      effects: [
        { timing: "on_deploy", mode: "optional", condition: { actorBoardHas: { theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", min: 2 } }, action: { kind: "deploy_from_deck", filter: { theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", type: "monster" }, count: 1 } },
        { timing: "on_deploy", mode: "optional", action: { kind: "search_deck_to_hand", filter: { theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", type: "spell" }, count: 1, label: "theme" } }
      ]
    },
    abyss_suppression_fire: {
      name: "\uC81C\uC555\uC0AC\uACA9",
      type: "spell",
      spellKind: "normal",
      cost: 2,
      effects: [
        { timing: "on_play", action: { kind: "deal_damage_to_unit", target: "enemy_front", value: 2 } }
      ]
    },
    alchemista_tuktak: {
      name: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0 \uB69D\uB531\uB69D\uB531!",
      type: "spell",
      spellKind: "equip",
      cost: 3,
      effects: [
        { timing: "on_play", action: { kind: "attach_equipment", target: "ally_front", bonus: { atk: 2, hp: 0 } } },
        { timing: "on_play", mode: "optional", cost: { mana: 3 }, action: { kind: "attach_equipment", target: "ally_front", bonus: { atk: -1, hp: 3 } } }
      ]
    },
    abyss_chain_burst: {
      name: "\uC5F0\uC1C4\uD3ED\uD30C",
      type: "spell",
      spellKind: "normal",
      cost: 3,
      effects: [
        { timing: "on_play", action: { kind: "enqueue_stack", effectKey: "abyss_chain_burst", stackAction: { kind: "deal_damage_to_agent", target: "opponent", value: 3 } } }
      ]
    },
    balance_reserve_call: {
      name: "\uC608\uBE44\uC18C\uC9D1",
      type: "spell",
      spellKind: "continuous",
      cost: 2,
      effects: [
        { timing: "on_play", action: { kind: "deploy_from_deck", filter: { theme: "\uADE0\uD615", type: "monster" }, count: 1 } },
        { timing: "on_play", mode: "optional", cost: { mana: 1 }, action: { kind: "search_deck_to_hand", filter: { theme: "\uADE0\uD615", type: "monster" }, count: 1, label: "theme" } }
      ]
    },
    balance_reinforced_blade: {
      name: "\uAC15\uD654\uAC80",
      type: "spell",
      spellKind: "equip",
      cost: 2,
      effects: [
        { timing: "on_play", action: { kind: "attach_equipment", target: "ally_front", bonus: { atk: 2, hp: 0 } } }
      ]
    },
    balance_guardian_plating: {
      name: "\uC218\uD638\uC7A5\uAC11",
      type: "spell",
      spellKind: "equip",
      cost: 2,
      effects: [
        { timing: "on_play", action: { kind: "attach_equipment", target: "ally_front", bonus: { atk: 0, hp: 2 } } }
      ]
    },
    alchemista_recovery_rite: {
      name: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0 \uBCF5\uC6D0\uC220",
      type: "spell",
      spellKind: "normal",
      cost: 2,
      effects: [
        { timing: "on_play", condition: { actorBoardHas: { theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", min: 1 } }, action: { kind: "search_deck_to_hand", filter: { theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", type: "spell" }, count: 1, label: "theme" } },
        { timing: "on_play", condition: { actorBoardHas: { theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", min: 2 } }, action: { kind: "heal_unit", target: "ally_front", value: 2 } }
      ]
    },
    alchemista_core_tuner: {
      name: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0 \uCF54\uC5B4 \uD29C\uB108",
      type: "monster",
      cost: 3,
      atk: 2,
      hp: 3,
      effects: [
        { timing: "on_deploy", mode: "optional", action: { kind: "search_deck_to_hand", filter: { theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", type: "spell" }, count: 1, label: "theme" } },
        { timing: "on_deploy", mode: "optional", condition: { actorBoardHas: { theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", min: 2 } }, action: { kind: "heal_unit", target: "ally_front", value: 1 } }
      ]
    },
    alchemista_overlock_formula: {
      name: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0 \uC624\uBC84\uB85D \uACF5\uC2DD",
      type: "spell",
      spellKind: "equip",
      cost: 3,
      effects: [
        { timing: "on_play", action: { kind: "attach_equipment", target: "ally_front", bonus: { atk: 1, hp: 1 } } },
        { timing: "on_play", mode: "optional", cost: { mana: 1 }, action: { kind: "search_deck_to_hand", filter: { theme: "\uC54C\uCF00\uBBF8\uC2A4\uD0C0", type: "monster" }, count: 1, label: "theme" } }
      ]
    },
    abyss_whisper: {
      name: "\uC2EC\uC5F0\uC758 \uC18D\uC0AD\uC784",
      type: "spell",
      spellKind: "normal",
      cost: 2,
      effects: [
        { timing: "on_play", condition: { actorBoardHas: { theme: "\uC2EC\uC5F0", min: 1 } }, action: { kind: "deal_damage_to_unit", target: "enemy_front", value: 2 } },
        { timing: "on_play", condition: { actorBoardHas: { theme: "\uC2EC\uC5F0", min: 2 } }, action: { kind: "deal_damage_to_agent", target: "opponent", value: 1 } }
      ]
    },
    abyss_tactical_volley: {
      name: "\uC804\uC220 \uC77C\uC81C\uC0AC\uACA9",
      type: "spell",
      spellKind: "normal",
      cost: 4,
      effects: [
        { timing: "on_play", action: { kind: "deal_damage_to_unit", target: "enemy_front", value: 3 } },
        { timing: "on_play", action: { kind: "deal_damage_to_agent", target: "opponent", value: 1 } }
      ]
    },
    abyss_scout: {
      name: "\uC2EC\uC5F0 \uCC99\uD6C4\uBCD1",
      type: "monster",
      cost: 2,
      atk: 2,
      hp: 2,
      effects: [
        { timing: "on_deploy", mode: "optional", condition: { actorBoardHas: { theme: "\uC2EC\uC5F0", min: 1 } }, action: { kind: "deal_damage_to_agent", target: "opponent", value: 1 } }
      ]
    },
    abyss_rift_stalker: {
      name: "\uADE0\uC5F4 \uC7A0\uBCF5\uC790",
      type: "monster",
      cost: 3,
      atk: 3,
      hp: 2,
      effects: [
        { timing: "on_deploy", action: { kind: "deal_damage_to_unit", target: "enemy_front", value: 1 } },
        { timing: "on_deploy", mode: "optional", cost: { mana: 1 }, action: { kind: "enqueue_stack", effectKey: "abyss_direct_hit", stackAction: { kind: "deal_damage_to_agent", target: "opponent", value: 1 } } }
      ]
    },
    abyss_dark_ritual_field: {
      name: "\uC554\uD751 \uC608\uC2DD",
      type: "spell",
      spellKind: "continuous",
      cost: 2,
      effects: [
        { timing: "on_play", action: { kind: "deal_damage_to_unit", target: "enemy_front", value: 1 } },
        { timing: "on_play", mode: "optional", cost: { mana: 1 }, action: { kind: "deal_damage_to_agent", target: "opponent", value: 1 } }
      ]
    },
    abyss_mark: {
      name: "\uC2EC\uC5F0 \uD45C\uC2DD",
      type: "spell",
      spellKind: "equip",
      cost: 2,
      effects: [
        { timing: "on_play", action: { kind: "attach_equipment", target: "ally_front", bonus: { atk: 1, hp: 1 } } },
        { timing: "on_play", mode: "optional", cost: { mana: 1 }, action: { kind: "deal_damage_to_agent", target: "opponent", value: 1 } }
      ]
    },
    abyss_doomsday_count: {
      name: "\uC885\uB9D0 \uCE74\uC6B4\uD2B8",
      type: "spell",
      spellKind: "normal",
      cost: 3,
      effects: [
        { timing: "on_play", condition: { actorBoardHas: { theme: "\uC2EC\uC5F0", min: 2 } }, action: { kind: "deal_damage_to_agent", target: "opponent", value: 3 } },
        { timing: "on_play", condition: { actorBoardHas: { theme: "\uC2EC\uC5F0", min: 1 } }, action: { kind: "deal_damage_to_unit", target: "enemy_front", value: 2 } }
      ]
    },
    supply_field_pack: {
      name: "\uD604\uC7A5 \uBCF4\uAE09\uD329",
      type: "spell",
      spellKind: "normal",
      cost: 1,
      effects: [
        { timing: "on_play", action: { kind: "search_deck_to_hand", filter: { theme: "\uADE0\uD615", type: "spell" }, count: 1, label: "theme" } },
        { timing: "on_play", mode: "optional", cost: { mana: 1 }, action: { kind: "search_deck_to_hand", filter: { theme: "\uADE0\uD615", type: "monster" }, count: 1, label: "theme" } }
      ]
    },
    supply_mana_converter: {
      name: "\uB9C8\uB098 \uBCC0\uD658\uAE30",
      type: "spell",
      spellKind: "continuous",
      cost: 2,
      effects: [
        { timing: "on_play", action: { kind: "gain_mana", value: 1 } },
        { timing: "on_play", mode: "optional", cost: { mana: 1 }, action: { kind: "heal_unit", target: "ally_front", value: 1 } }
      ]
    },
    supply_recycle_protocol: {
      name: "\uC7AC\uC21C\uD658 \uD504\uB85C\uD1A0\uCF5C",
      type: "spell",
      spellKind: "normal",
      cost: 2,
      effects: [
        { timing: "on_play", action: { kind: "search_deck_to_hand", filter: { theme: "\uADE0\uD615", type: "spell" }, count: 1, label: "theme" } }
      ]
    },
    supply_quartermaster: {
      name: "\uBCF4\uAE09\uAD00",
      type: "monster",
      cost: 2,
      atk: 2,
      hp: 3,
      effects: [
        { timing: "on_deploy", action: { kind: "search_deck_to_hand", filter: { theme: "\uADE0\uD615", type: "spell" }, count: 1, label: "theme" } },
        { timing: "on_deploy", mode: "optional", cost: { mana: 1 }, action: { kind: "heal_unit", target: "ally_front", value: 1 } }
      ]
    },
    supply_emergency_ration: {
      name: "\uBE44\uC0C1 \uC2DD\uB7C9",
      type: "spell",
      spellKind: "equip",
      cost: 1,
      effects: [
        { timing: "on_play", action: { kind: "attach_equipment", target: "ally_front", bonus: { atk: 0, hp: 2 } } },
        { timing: "on_play", mode: "optional", cost: { mana: 1 }, action: { kind: "search_deck_to_hand", filter: { theme: "\uADE0\uD615", type: "spell" }, count: 1, label: "theme" } }
      ]
    },
    ritual_spark: {
      name: "\uC758\uC2DD \uBD88\uAF43",
      type: "spell",
      spellKind: "normal",
      cost: 1,
      effects: [
        { timing: "on_play", action: { kind: "enqueue_stack", effectKey: "ritual_spark", stackAction: { kind: "deal_damage_to_agent", target: "opponent", value: 1 } } }
      ]
    },
    ritual_echo_chant: {
      name: "\uBA54\uC544\uB9AC \uC601\uCC3D",
      type: "spell",
      spellKind: "normal",
      cost: 2,
      effects: [
        { timing: "on_play", action: { kind: "enqueue_stack", effectKey: "ritual_echo_chant", stackAction: { kind: "deal_damage_to_agent", target: "opponent", value: 2 } } },
        { timing: "on_play", mode: "optional", condition: { actorBoardHas: { theme: "\uC2EC\uC5F0", min: 1 } }, action: { kind: "deal_damage_to_agent", target: "opponent", value: 1 } }
      ]
    },
    ritual_null_seal: {
      name: "\uACF5\uD5C8 \uBD09\uC778",
      type: "spell",
      spellKind: "continuous",
      cost: 2,
      effects: [
        { timing: "on_play", action: { kind: "deal_damage_to_unit", target: "enemy_front", value: 1 } },
        { timing: "on_play", mode: "optional", cost: { mana: 1 }, action: { kind: "deal_damage_to_agent", target: "opponent", value: 1 } }
      ]
    },
    ritual_adept: {
      name: "\uC758\uC2DD \uC9D1\uD589\uC790",
      type: "monster",
      cost: 3,
      atk: 3,
      hp: 2,
      effects: [
        { timing: "on_deploy", action: { kind: "enqueue_stack", effectKey: "ritual_adept", stackAction: { kind: "deal_damage_to_agent", target: "opponent", value: 1 } } },
        { timing: "on_deploy", mode: "optional", action: { kind: "deal_damage_to_unit", target: "enemy_front", value: 1 } }
      ]
    },
    ritual_cataclysm_count: {
      name: "\uD30C\uAD6D \uCE74\uC6B4\uD2B8",
      type: "spell",
      spellKind: "normal",
      cost: 3,
      effects: [
        { timing: "on_play", condition: { actorBoardHas: { theme: "\uC2EC\uC5F0", min: 2 } }, action: { kind: "deal_damage_to_agent", target: "opponent", value: 3 } },
        { timing: "on_play", action: { kind: "deal_damage_to_unit", target: "enemy_front", value: 2 } }
      ]
    },
    gear_r_reverse: {
      name: "\uAE30\uC5B4 R-\uB9AC\uBC84\uC2A4",
      type: "monster",
      cost: 2,
      atk: 1,
      hp: 3,
      effects: [
        { timing: "on_deploy", mode: "optional", action: { kind: "search_deck_to_hand", filter: { theme: "\uAE30\uC5B4", type: "monster" }, count: 1, label: "theme" } }
      ]
    },
    gear_1_clutch: {
      name: "\uAE30\uC5B4 1-\uD074\uB7EC\uCE58",
      type: "monster",
      cost: 1,
      atk: 1,
      hp: 1,
      effects: [
        { timing: "active", mode: "optional", action: { kind: "self_destroy_unit", target: "self_unit" } },
        { timing: "active", mode: "optional", condition: { actorBoardHas: { theme: "\uAE30\uC5B4", min: 1 } }, action: { kind: "search_deck_to_hand", filter: { key: "gear_2_syncro" }, count: 1, label: "card" } }
      ]
    },
    gear_2_syncro: {
      name: "\uAE30\uC5B4 2-\uC2F1\uD06C\uB85C",
      type: "monster",
      cost: 1,
      atk: 2,
      hp: 1,
      effects: [
        { timing: "active", mode: "optional", action: { kind: "release_unit", target: "ally_front" } },
        { timing: "active", mode: "optional", condition: { actorBoardHas: { theme: "\uAE30\uC5B4", min: 1 } }, action: { kind: "deploy_from_deck", filter: { key: "gear_3_downshift" }, count: 1 } }
      ]
    },
    gear_3_downshift: {
      name: "\uAE30\uC5B4 3-\uB2E4\uC6B4\uC2DC\uD504\uD2B8",
      type: "monster",
      cost: 2,
      atk: 2,
      hp: 2,
      effects: [
        { timing: "on_deploy", action: { kind: "deal_damage_to_unit", target: "enemy_front", value: 1 } },
        { timing: "active", mode: "optional", action: { kind: "banish_unit", target: "enemy_front" } }
      ]
    },
    gear_4_overdrive: {
      name: "\uAE30\uC5B4 4-\uC624\uBC84\uB4DC\uB77C\uC774\uBE0C",
      type: "monster",
      cost: 4,
      atk: 3,
      hp: 3,
      effects: [
        { timing: "on_deploy", mode: "optional", condition: { actorBoardHas: { theme: "\uAE30\uC5B4", min: 1 } }, action: { kind: "deploy_from_deck", filter: { theme: "\uAE30\uC5B4", type: "monster" }, count: 1 } }
      ]
    },
    gear_5_chronomesh: {
      name: "\uAE30\uC5B4 5-\uD06C\uB85C\uB178\uBA54\uC2DC",
      type: "monster",
      cost: 4,
      atk: 4,
      hp: 4,
      guard: true,
      effects: [
        { timing: "on_deploy", mode: "optional", action: { kind: "search_deck_to_hand", filter: { key: "gear_guardian" }, count: 1, label: "card" } }
      ]
    },
    gear_6_antikythera_core: {
      name: "\uAE30\uC5B4 6-\uC548\uD2F0\uD0A4\uD14C\uB77C \uCF54\uC5B4",
      type: "monster",
      cost: 5,
      atk: 6,
      hp: 6,
      cannotAttackOnSummonTurn: true,
      effects: [
        { timing: "on_deploy", mode: "optional", condition: { actorBoardHas: { key: "gear_guardian", min: 1 } }, action: { kind: "deal_damage_to_agent", target: "opponent", value: 2 } }
      ]
    },
    gear_guardian: {
      name: "\uAE30\uC5B4 \uAC00\uB514\uC5B8",
      type: "monster",
      cost: 4,
      atk: 0,
      hp: 8,
      guard: true,
      effects: [
        { timing: "on_deploy", action: { kind: "lock_attack_this_turn" } }
      ]
    },
    gear_phase_signal: {
      name: "\uAE30\uC5B4 \uD398\uC774\uC988 \uC2DC\uADF8\uB110",
      type: "spell",
      spellKind: "normal",
      cost: 2,
      effects: [
        { timing: "on_play", action: { kind: "search_deck_to_hand", filter: { theme: "\uAE30\uC5B4", type: "monster" }, count: 1, label: "theme" } }
      ]
    },
    gear_train_assembly: {
      name: "\uAE30\uC5B4 \uD2B8\uB808\uC778 \uC5B4\uC148\uBE14\uB9AC",
      type: "spell",
      spellKind: "continuous",
      cost: 2,
      effects: [
        { timing: "on_play", action: { kind: "deploy_from_deck", filter: { theme: "\uAE30\uC5B4", type: "monster" }, count: 1 } },
        { timing: "on_play", mode: "optional", condition: { actorBoardHas: { key: "gear_guardian", min: 1 } }, action: { kind: "summon_gear5_route", key: "gear_6_antikythera_core" } }
      ]
    }
  };
  const TEMPO_PATCH_OVERRIDES = {
    alchemista_tank_rabbit: { cost: 5, atk: 6, hp: 6 },
    abyss_direct_hit: {
      cost: 2,
      effects: [
        { timing: "on_play", action: { kind: "enqueue_stack", effectKey: "abyss_direct_hit", stackAction: { kind: "deal_damage_to_agent", target: "opponent", value: 3 } } }
      ]
    },
    abyss_chain_burst: { cost: 3 },
    abyss_doomsday_count: { cost: 3 },
    abyss_dark_ritual_field: { cost: 2 },
    abyss_mark: { cost: 2 },
    abyss_rift_stalker: { cost: 3, atk: 3, hp: 2 },
    balance_observer: { cost: 2, atk: 2, hp: 2 },
    balance_guard_researcher: { cost: 4, atk: 3, hp: 5 },
    balance_reserve_call: {
      cost: 2,
      effects: [
        { timing: "on_play", action: { kind: "search_deck_to_hand", filter: { theme: "\uADE0\uD615", type: "monster" }, count: 1, label: "theme" } },
        { timing: "on_play", mode: "optional", cost: { mana: 2 }, action: { kind: "deploy_from_deck", filter: { theme: "\uADE0\uD615", type: "monster" }, count: 1 } }
      ]
    },
    balance_reinforced_blade: { cost: 2 },
    balance_guardian_plating: { cost: 2 }
  };
  function applyTempoPatch(blueprints) {
    const next = {};
    for (const [key, def] of Object.entries(blueprints || {})) {
      const card = { ...def };
      if (card.type === "monster") {
        if (card.cost >= 3) card.cost = Math.max(1, card.cost - 1);
        if (card.cost <= 2) card.atk = Number(card.atk || 0) + 1;
      }
      if (card.type === "spell") {
        card.cost = Math.max(0, Number(card.cost || 0) - 1);
      }
      const override = TEMPO_PATCH_OVERRIDES[key];
      if (override) Object.assign(card, JSON.parse(JSON.stringify(override)));
      next[key] = card;
    }
    return next;
  }
  function extractCardKey(input) {
    if (!input) return "";
    if (typeof input === "string") return input;
    if (typeof input === "object") return String(input.key || input.cardKey || "").trim();
    return String(input || "").trim();
  }
  const LEGACY_KEY_ALIASES = {
    gear_recycler: "gear_r_reverse",
    gear_seed: "gear_1_clutch",
    gear_link: "gear_2_syncro",
    gear_breaker: "gear_3_downshift",
    gear_forge: "gear_4_overdrive",
    gear_frame: "gear_5_chronomesh",
    gear_overcore: "gear_6_antikythera_core",
    gear_bulk_guardian: "gear_guardian",
    gear_signal: "gear_phase_signal",
    gear_assembly: "gear_train_assembly"
  };
  function normalizeCardKey2(key) {
    const raw = extractCardKey(key);
    if (!raw) return "";
    return LEGACY_KEY_ALIASES[raw] || raw;
  }
  function toUnitLabel(type) {
    if (type === "spell") return "\uB9C8\uBC95";
    if (type === "monster") return "\uC720\uB2DB";
    return "\uCE74\uB4DC";
  }
  function cardDisplayNameByKey(key) {
    const norm = normalizeCardKey2(key);
    if (!norm) return "\uCE74\uB4DC";
    return CARD_BLUEPRINTS[norm]?.name || norm;
  }
  function timingIntro(def, eff) {
    const mana = Number(eff?.cost?.mana || 0);
    const modeLabel = eff?.mode === "optional" ? TERMS.optional : TERMS.forced;
    const mode = mana > 0 ? `${modeLabel}\xB7\uB9C8\uB098 ${mana}` : modeLabel;
    if (eff?.timing === "on_deploy") return `${TERMS.deploy} \uC2DC <${mode}>`;
    if (eff?.timing === "active") return `${TERMS.active} \uC2DC <${mode}>`;
    if (eff?.timing === "on_play") return `${TERMS.active} \uD574\uACB0 \uC2DC <${mode}>`;
    return `<${mode}>`;
  }
  function conditionPhrase(condition = {}) {
    const board = condition?.actorBoardHas;
    if (board) {
      const chunks = [];
      if (board.key) chunks.push(`"${cardDisplayNameByKey(board.key)}"`);
      if (board.race) chunks.push(board.race);
      if (board.theme) chunks.push(board.theme);
      if (board.element) chunks.push(board.element);
      const n = Number(board.min || 1);
      if (chunks.length) return `${chunks.join("\xB7")} ${n}+\uC77C \uB54C`;
    }
    return "";
  }
  function actionSentence(def, eff) {
    const action = eff?.action || {};
    const count = Math.max(1, Number(action.count || 1));
    const value = Number(action.value || 0);
    switch (action.kind) {
      case "heal_self":
        return `${TERMS.heal}: \uCCB4\uB825+${value || 1}`;
      case "search_deck_to_hand": {
        const f = action?.filter || {};
        const chunks = [];
        if (f.key) chunks.push(`"${cardDisplayNameByKey(f.key)}"`);
        if (f.race) chunks.push(`${f.race}`);
        if (f.theme) chunks.push(`${f.theme}`);
        if (f.element) chunks.push(`${f.element}`);
        if (f.type) chunks.push(`${toUnitLabel(f.type)}`);
        const label = chunks.length ? chunks.join(" \xB7 ") : "\uCE74\uB4DC";
        return `${TERMS.search}: ${label} ${count}\uC7A5 \uD0D0\uC0C9`;
      }
      case "deploy_from_deck": {
        const f = action?.filter || {};
        const target = f.key ? `"${cardDisplayNameByKey(f.key)}" ` : "";
        return `${TERMS.recruit}: ${target}\uC720\uB2DB ${count}\uC7A5 \uC989\uC2DC \uC804\uAC1C`;
      }
      case "gain_mana":
        return `${TERMS.overcharge}: \uB9C8\uB098+${value || 0}`;
      case "enqueue_stack": {
        const stackAction = action?.stackAction || STACK_EFFECT_DEFAULTS[action?.effectKey] || null;
        if (stackAction?.kind === "deal_damage_to_agent") {
          return `${TERMS.chain}: \uD53C\uD574 ${Number(stackAction.value || 0)}(\uC0C1\uB300 \uBCF8\uCCB4)`;
        }
        return `${TERMS.chain}: \uC2A4\uD0DD\uC5D0 \uC62C\uB824 \uD574\uACB0`;
      }
      case "deal_damage_to_unit":
        return `${TERMS.pressure}: \uD53C\uD574 ${value || 0}(\uB300\uC0C1 \uC720\uB2DB)`;
      case "heal_unit":
        return `${TERMS.heal}: \uCCB4\uB825+${value || 0}(\uC544\uAD70 1\uAE30)`;
      case "deal_damage_to_agent":
        return `${TERMS.pressure}: \uD53C\uD574 ${value || 0}(\uC0C1\uB300 \uBCF8\uCCB4)`;
      case "self_destroy_unit":
        return `${TERMS.selfDestruct}: \uC544\uAD70 1\uAE30 \uD30C\uAD34`;
      case "release_unit":
        return `${TERMS.release}: \uC544\uAD70 1\uAE30 ${TERMS.release}`;
      case "banish_unit":
        return `${TERMS.banish}: \uB300\uC0C1 \uC720\uB2DB \uC81C\uC678`;
      case "summon_gear5_route": {
        const targetKey = normalizeCardKey2(action?.key || "");
        const targetName = CARD_BLUEPRINTS[targetKey]?.name || targetKey || "\uB300\uC0C1 \uC720\uB2DB";
        const requiredKey = normalizeCardKey2(eff?.condition?.actorBoardHas?.key || "");
        const requiredName = requiredKey ? cardDisplayNameByKey(requiredKey) : null;
        const reqText = requiredName ? `"${requiredName}" \uC788\uC73C\uBA74 ` : "";
        return `${TERMS.recruit}: ${reqText}"${targetName}" \uD2B9\uC218 \uC804\uAC1C`;
      }
      case "lock_attack_this_turn":
        return `\uD574\uB2F9 \uD134\uC5D0\uB294 \uACF5\uACA9\uD560 \uC218 \uC5C6\uB2E4`;
      case "attach_equipment": {
        const atk = Number(action?.bonus?.atk || 0);
        const hp = Number(action?.bonus?.hp || 0);
        const isOptional = (eff?.mode || "forced") === "optional";
        const mana = Number(eff?.cost?.mana || 0);
        const prefix = isOptional ? `${TERMS.equip} \uCD94\uAC00` : `${TERMS.equip}`;
        return `${prefix}: ${atk >= 0 ? "+" : ""}${atk}/${hp >= 0 ? "+" : ""}${hp}(\uC544\uAD70 1\uAE30)`;
      }
      default:
        return "\uD6A8\uACFC \uC801\uC6A9";
    }
  }
  function buildCardEffect(key, def) {
    const effects = Array.isArray(def.effects) ? def.effects : [];
    if (def.type === "monster") {
      const guardText = def.guard ? ` <${TERMS.guard}>.` : "";
      const head = `<${TERMS.deploy}: {${def.cost}}> ${def.atk}/${def.hp}.${guardText}`;
      if (!effects.length) return `${head} \uAE30\uBCF8 \uC720\uB2DB\uC774\uB2E4.`;
      const tails = effects.map((e) => `${timingIntro(def, e)} ${conditionPhrase(e?.condition)} ${actionSentence(def, e)}.`.replace(/\s+/g, " ").trim());
      return `${head} ${tails.join(" ")}`.trim();
    }
    const spellHead = def.spellKind === "continuous" ? `<${TERMS.continuous}: {${def.cost}}>` : def.spellKind === "equip" ? `<${TERMS.equip}: {${def.cost}}>` : `<${TERMS.active}: {${def.cost}}>`;
    if (!effects.length) return `${spellHead} \uD6A8\uACFC \uC5C6\uC74C.`;
    const sentences = effects.map((e) => `${timingIntro(def, e)} ${conditionPhrase(e?.condition)} ${actionSentence(def, e)}.`.replace(/\s+/g, " ").trim());
    return `${spellHead} ${sentences.join(" ")}`.trim();
  }
  const TEMPO_BLUEPRINTS = applyTempoPatch(CARD_BLUEPRINTS);
  const CARD_DEFS2 = (() => {
    const out = {};
    for (const [cardKey, v] of Object.entries(TEMPO_BLUEPRINTS)) {
      const effect = buildCardEffect(cardKey, v);
      const baseMeta = META_DEFAULTS[v.type] || META_DEFAULTS.spell;
      const meta = { ...baseMeta, ...CARD_META_OVERRIDES[cardKey] || {} };
      const def = { ...v, ...meta, key: cardKey, effect };
      out[cardKey] = def;
    }
    return out;
  })();
  function getCardDef(key) {
    return CARD_DEFS2[normalizeCardKey2(key)] || null;
  }
  function getCardCost(key) {
    const def = getCardDef(key);
    return def ? Number(def.cost || 0) : 0;
  }
  function getCardType(key) {
    const def = getCardDef(key);
    return def?.type || "spell";
  }
  function isNormalSpell(key) {
    return getCardDef(key)?.spellKind === "normal";
  }
  function getStackDefaultAction(effectKey) {
    const base = STACK_EFFECT_DEFAULTS[String(effectKey || "").trim()];
    return base ? JSON.parse(JSON.stringify(base)) : null;
  }
  function buildKeywordCatalog() {
    const found = /* @__PURE__ */ new Set();
    const bracket = /<([^>]+)>/g;
    for (const def of Object.values(CARD_DEFS2)) {
      const text = String(def?.effect || "");
      let m;
      while ((m = bracket.exec(text)) !== null) {
        const raw = String(m[1] || "").trim();
        const token = raw.split(":")[0].split("/")[0].trim();
        if (token) found.add(token);
      }
      const effects = Array.isArray(def?.effects) ? def.effects : [];
      for (const e of effects) {
        const kind = e?.action?.kind;
        const kw = ACTION_KEYWORD[kind];
        if (kw) found.add(kw);
      }
      for (const t of Object.values(TERMS)) {
        if (text.includes(t)) found.add(t);
      }
    }
    return Array.from(found).sort((a, b) => a.localeCompare(b, "ko")).map((name) => ({ name, description: KEYWORD_TEXT[name] || "\uCE74\uB4DC \uD6A8\uACFC \uD14D\uC2A4\uD2B8 \uBB38\uB9E5\uC5D0 \uB530\uB77C \uCC98\uB9AC\uB41C\uB2E4." }));
  }
  return {
    TERMS,
    CARD_RACES,
    CARD_THEMES,
    CARD_ELEMENTS,
    CARD_DEFS: CARD_DEFS2,
    KEYWORD_TEXT,
    extractCardKey,
    normalizeCardKey: normalizeCardKey2,
    getCardDef,
    getCardCost,
    getCardType,
    isNormalSpell,
    getStackDefaultAction,
    buildKeywordCatalog,
    buildCardEffect
  };
});

// src/shared/rules-const.ts
var RULES_CONST = {
  MIN_DECK: 30,
  MAX_SAME_CARD: 3,
  START_HP: 20,
  UNIT_ZONE_SIZE: 3,
  SPELL_ZONE_SIZE: 4,
  MAX_MANA: 12
};

// src/shared/deck-codec.ts
var defs = void 0 || {};
var CARD_KEYS = Object.keys(defs).sort((a, b) => a.localeCompare(b));
var keyToIndex = new Map(CARD_KEYS.map((key, index) => [key, index]));
function fromBase64UrlBytes(input) {
  const normalized = String(input || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "===".slice((normalized.length + 3) % 4);
  if (typeof atob === "function") {
    const bin = atob(padded);
    return Uint8Array.from(bin, (char) => char.charCodeAt(0));
  }
  return Uint8Array.from(Buffer.from(padded, "base64"));
}
function decodeDeckCode(code) {
  const raw = String(code || "").trim();
  if (!raw) return { ok: false, reason: "EMPTY" };
  let bytes;
  try {
    bytes = fromBase64UrlBytes(raw);
  } catch {
    return { ok: false, reason: "INVALID_FORMAT" };
  }
  if (!bytes || bytes.length < 3 || bytes[0] !== 2) return { ok: false, reason: "INVALID_FORMAT" };
  const n = bytes[1] << 8 | bytes[2];
  if (bytes.length !== 3 + n * 3) return { ok: false, reason: "INVALID_CARDS" };
  const deck = [];
  let p = 3;
  for (let i = 0; i < n; i += 1) {
    const idx = bytes[p++] << 8 | bytes[p++];
    const qty = bytes[p++];
    const key = CARD_KEYS[idx];
    if (!key) return { ok: false, reason: "UNKNOWN_CARD" };
    if (!Number.isInteger(qty) || qty < 1 || qty > RULES_CONST.MAX_SAME_CARD) {
      return { ok: false, reason: "INVALID_COUNT" };
    }
    for (let j = 0; j < qty; j += 1) deck.push(key);
  }
  return { ok: true, deck, version: 2 };
}
function decodeDeckCodeSummary(code) {
  const parsed = decodeDeckCode(code);
  if (!parsed.ok) return parsed;
  if (parsed.deck.length < RULES_CONST.MIN_DECK) return { ok: false, reason: "DECK_MIN" };
  return { ok: true, total: parsed.deck.length, version: parsed.version };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  decodeDeckCodeSummary
});
