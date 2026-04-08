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

// src/server/generated/rules-const.ts
var rules_const_exports = {};
__export(rules_const_exports, {
  RULES_CONST: () => RULES_CONST
});
module.exports = __toCommonJS(rules_const_exports);

// src/shared/rules-const.ts
var RULES_CONST = {
  MIN_DECK: 30,
  MAX_SAME_CARD: 3,
  START_HP: 20,
  UNIT_ZONE_SIZE: 3,
  SPELL_ZONE_SIZE: 4,
  MAX_MANA: 12
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RULES_CONST
});
