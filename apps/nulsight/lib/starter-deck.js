const { CARD_DEFS, normalizeCardKey } = require('./generated/shared-cards.cjs');

const STARTER_DECK_RECIPE = [
  ['gear_1_clutch', 3],
  ['gear_2_syncro', 3],
  ['gear_3_downshift', 3],
  ['gear_r_reverse', 2],
  ['abyss_scout', 2],
  ['supply_quartermaster', 2],
  ['gear_phase_signal', 3],
  ['gear_train_assembly', 2],
  ['supply_field_pack', 3],
  ['supply_mana_converter', 2],
  ['supply_emergency_ration', 2],
  ['abyss_suppression_fire', 2],
  ['abyss_direct_hit', 1]
];

function buildStarterDeck() {
  const deck = [];

  for (const [rawKey, rawCount] of STARTER_DECK_RECIPE) {
    const key = normalizeCardKey(rawKey);
    const count = Number(rawCount || 0);
    if (!CARD_DEFS[key] || count <= 0) continue;

    for (let i = 0; i < count; i += 1) {
      deck.push(key);
    }
  }

  return deck;
}

module.exports = {
  STARTER_DECK_RECIPE,
  buildStarterDeck
};
