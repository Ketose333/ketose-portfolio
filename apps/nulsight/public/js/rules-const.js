(() => {
  // src/shared/rules-const.ts
  var RULES_CONST = {
    MIN_DECK: 30,
    MAX_SAME_CARD: 3,
    START_HP: 20,
    UNIT_ZONE_SIZE: 3,
    SPELL_ZONE_SIZE: 4,
    MAX_MANA: 12
  };

  // src/client/globals/rules-const.ts
  globalThis.BP_RULES_CONST = RULES_CONST;
})();
