type SharedCardsGlobal = {
  TERMS?: Record<string, string>
  KEYWORD_TEXT?: Record<string, string>
  CARD_DEFS?: Record<string, CardDef>
  CARD_RACES?: string[]
  CARD_THEMES?: string[]
  CARD_ELEMENTS?: string[]
  normalizeCardKey?: (key: unknown) => string
  buildKeywordCatalog?: () => Array<{ name: string; description: string }>
}

type DeckCodecGlobal = {
  encodeV2FromCounts?: (counts: Record<string, number>) => string
  decodeDeckCode?: (code: string) => { ok: boolean; deck?: string[]; reason?: string }
}

export type CardDef = {
  key: string
  name?: string
  type?: 'monster' | 'spell'
  spellKind?: 'normal' | 'continuous' | 'equip'
  cost?: number
  atk?: number
  hp?: number
  guard?: boolean
  race?: string
  theme?: string
  element?: string
  effect?: string
}

function readGlobal<T>(key: string): T | null {
  const value = (globalThis as Record<string, unknown>)[key]
  return value ? (value as T) : null
}

export function getSharedCardsGlobal() {
  return readGlobal<SharedCardsGlobal>('BP_SHARED_CARDS')
}

export function getDeckCodecGlobal() {
  return readGlobal<DeckCodecGlobal>('BP_DECK_CODEC')
}

export function normalizeCardKey(key: unknown) {
  return getSharedCardsGlobal()?.normalizeCardKey?.(key) || String(key || '').trim()
}
