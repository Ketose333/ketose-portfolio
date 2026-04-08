import * as sharedCards from './shared-cards.js'
import { RULES_CONST } from './rules-const'

type CardCounts = Record<string, number>

const defs = (sharedCards as any).CARD_DEFS || {}
const normalize = (sharedCards as any).normalizeCardKey || ((key: string) => key)
const CARD_KEYS = Object.keys(defs).sort((a, b) => a.localeCompare(b))
const keyToIndex = new Map(CARD_KEYS.map((key, index) => [key, index]))

function toBase64UrlBytes(bytes: Uint8Array) {
  if (typeof btoa === 'function') {
    let bin = ''
    for (const b of bytes) bin += String.fromCharCode(b)
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }
  return Buffer.from(bytes).toString('base64url')
}

function fromBase64UrlBytes(input: string) {
  const normalized = String(input || '').replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '==='.slice((normalized.length + 3) % 4)
  if (typeof atob === 'function') {
    const bin = atob(padded)
    return Uint8Array.from(bin, (char) => char.charCodeAt(0))
  }
  return Uint8Array.from(Buffer.from(padded, 'base64'))
}

export function encodeV2FromCounts(counts: CardCounts) {
  const entries = Object.entries(counts || {})
    .filter(([, qty]) => Number.isInteger(qty) && qty > 0)
    .map(([cardId, qty]) => [normalize(cardId), qty] as const)
    .filter(([cardId]) => keyToIndex.has(cardId))
    .sort((a, b) => a[0].localeCompare(b[0]))

  const n = entries.length
  const bytes = new Uint8Array(3 + n * 3)
  bytes[0] = 2
  bytes[1] = (n >> 8) & 0xff
  bytes[2] = n & 0xff

  let p = 3
  for (const [cardId, qty] of entries) {
    const idx = keyToIndex.get(cardId) || 0
    bytes[p++] = (idx >> 8) & 0xff
    bytes[p++] = idx & 0xff
    bytes[p++] = qty & 0xff
  }

  return toBase64UrlBytes(bytes)
}

export function decodeDeckCode(code: string) {
  const raw = String(code || '').trim()
  if (!raw) return { ok: false, reason: 'EMPTY' as const }

  let bytes: Uint8Array
  try {
    bytes = fromBase64UrlBytes(raw)
  } catch {
    return { ok: false, reason: 'INVALID_FORMAT' as const }
  }

  if (!bytes || bytes.length < 3 || bytes[0] !== 2) return { ok: false, reason: 'INVALID_FORMAT' as const }
  const n = (bytes[1] << 8) | bytes[2]
  if (bytes.length !== 3 + n * 3) return { ok: false, reason: 'INVALID_CARDS' as const }

  const deck: string[] = []
  let p = 3
  for (let i = 0; i < n; i += 1) {
    const idx = (bytes[p++] << 8) | bytes[p++]
    const qty = bytes[p++]
    const key = CARD_KEYS[idx]
    if (!key) return { ok: false, reason: 'UNKNOWN_CARD' as const }
    if (!Number.isInteger(qty) || qty < 1 || qty > RULES_CONST.MAX_SAME_CARD) {
      return { ok: false, reason: 'INVALID_COUNT' as const }
    }
    for (let j = 0; j < qty; j += 1) deck.push(key)
  }

  return { ok: true as const, deck, version: 2 as const }
}

export function decodeDeckCodeSummary(code: string) {
  const parsed = decodeDeckCode(code)
  if (!parsed.ok) return parsed
  if (parsed.deck.length < RULES_CONST.MIN_DECK) return { ok: false, reason: 'DECK_MIN' as const }
  return { ok: true as const, total: parsed.deck.length, version: parsed.version }
}
