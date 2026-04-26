import { getSharedCardsGlobal, normalizeCardKey, type CardDef } from '../../app/globals'

export type GameHudState = {
  turnText: string
  turnTone: 'me' | 'opp'
  phaseText: string
  focusText: string
  noticeText: string
  badges: string[]
}

export type PlayerSummary = {
  hp: string
  mana: string
  hand: string
}

export type GameSurfaceAction = {
  name: string
  arg?: string | number | boolean | null
}

export type GameSlotState = {
  key: string
  html: string
  className: string
  inspectKey?: string
  inspectUnit?: string
  action?: GameSurfaceAction
  doubleAction?: GameSurfaceAction
}

export type GameHandCardState = {
  key: string
  cardKey: string
  index: number
  className: string
  html: string
}

export type GameOverlayCardState = {
  key: string
  cardKey: string
  className: string
  pickIndex?: number
}

export type GameStackEntryState = {
  key: string
  actorText: string
  summaryText: string
  cardKey: string
}

export type GameQueryOptionState = {
  label: string
  value: string
  tone?: 'default' | 'primary' | 'danger'
}

export type GameActiveActionState = {
  key: string
  label: string
  detail?: string
  action: GameSurfaceAction
  disabled?: boolean
}

export type GameSurfaceState = {
  myDeckText: string
  oppDeckText: string
  myGraveText: string
  oppGraveText: string
  myBanishText: string
  oppBanishText: string
  myGraveActive: boolean
  oppGraveActive: boolean
  myBanishActive: boolean
  oppBanishActive: boolean
  stackActive: boolean
  endButtonLabel: string
  endButtonDisabled: boolean
  passButtonLabel: string
  passButtonDisabled: boolean
  concedeDisabled: boolean
  attackDisabled: boolean
  uiLocked: boolean
  mySummary: PlayerSummary
  oppSummary: PlayerSummary
  endOverlayVisible: boolean
  endOverlayText: string
  graveVisible: boolean
  graveTitle: string
  stackVisible: boolean
  stackEntries: GameStackEntryState[]
  cardOverlayVisible: boolean
  cardOverlayCardKey: string
  effectPickVisible: boolean
  effectPickTitle: string
  effectPickGuide: string
  effectPickCards: GameOverlayCardState[]
  graveCards: GameOverlayCardState[]
  queryVisible: boolean
  queryTitle: string
  queryMessage: string
  queryOptions: GameQueryOptionState[]
  activeActions: GameActiveActionState[]
  myMonsterSlots: GameSlotState[]
  oppMonsterSlots: GameSlotState[]
  mySpellSlots: GameSlotState[]
  oppSpellSlots: GameSlotState[]
  handCards: GameHandCardState[]
  handOverlapPx: number
  handOverlapEnabled: boolean
  handEmptyText: string
}

export const DEFAULT_HUD_STATE: GameHudState = {
  turnText: '턴 정보 불러오는 중',
  turnTone: 'opp',
  phaseText: '-',
  focusText: '선택 없음',
  noticeText: '선택: 없음',
  badges: [],
}

export const DEFAULT_SURFACE_STATE: GameSurfaceState = {
  myDeckText: '덱 0',
  oppDeckText: '덱 0',
  myGraveText: '무덤 0',
  oppGraveText: '무덤 0',
  endButtonLabel: '페이즈 진행',
  endButtonDisabled: true,
  passButtonLabel: '우선권 패스',
  passButtonDisabled: true,
  concedeDisabled: false,
  attackDisabled: true,
  uiLocked: false,
  mySummary: {
    hp: '-',
    mana: '-/-',
    hand: '-',
  },
  oppSummary: {
    hp: '-',
    mana: '-/-',
    hand: '-',
  },
  endOverlayVisible: false,
  endOverlayText: '게임 종료',
  graveVisible: false,
  graveTitle: '무덤',
  cardOverlayVisible: false,
  cardOverlayCardKey: '',
  effectPickVisible: false,
  effectPickTitle: '효과 카드 선택',
  effectPickGuide: '카드를 눌러 선택하세요.',
  effectPickCards: [],
  graveCards: [],
  stackVisible: false,
  stackEntries: [],
  myMonsterSlots: [],
  oppMonsterSlots: [],
  mySpellSlots: [],
  oppSpellSlots: [],
  handCards: [],
  handOverlapPx: 0,
  handOverlapEnabled: false,
  handEmptyText: '',
  myBanishText: '제외 0',
  oppBanishText: '제외 0',
  myGraveActive: false,
  oppGraveActive: false,
  myBanishActive: false,
  oppBanishActive: false,
  stackActive: false,
  queryVisible: false,
  queryTitle: '확인',
  queryMessage: '',
  queryOptions: [],
  activeActions: [],
}

export function renderPileText(text: string) {
  const [label, value] = String(text || '').split(' ')
  return {
    label: label || '-',
    value: value || '0',
  }
}

export function normalizeEffectText(raw = '') {
  return String(raw || '')
    .replace(/([^\s(])\(/g, '$1 (')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function cardTypeLabel(def?: CardDef | null) {
  return def?.type === 'monster' ? '유닛' : '마법'
}

export function extractKeywordTokens(def?: CardDef | null) {
  const shared = getSharedCardsGlobal()
  const terms = shared?.TERMS || {}
  const out = new Set<string>()
  const raw = String(def?.effect || '')
  const regex = /<([^>]+)>/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(raw)) !== null) {
    const src = String(match[1] || '')
    for (const part of src.split('/')) {
      const token = String(part || '')
        .split(':')[0]
        .replace(/\s*·\s*마나\s*\d+$/i, '')
        .trim()
      if (token) out.add(token)
    }
  }
  if (def?.guard && terms.guard) out.add(terms.guard)
  for (const value of [def?.race, def?.theme, def?.element]) {
    if (value) out.add(String(value))
  }
  return Array.from(out)
}

export function resolveOverlayCardDef(cardKey: string) {
  const defs = getSharedCardsGlobal()?.CARD_DEFS || {}
  const normalizedKey = normalizeCardKey(cardKey)
  return normalizedKey ? defs[normalizedKey] : undefined
}
