import { getSharedCardsGlobal, normalizeCardKey, type CardDef } from '../globals'

function normalizeEffectText(raw = '') {
  return String(raw || '')
    .replace(/([^\s(])\(/g, '$1 (')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function spellKindLabel(kind?: string) {
  const map: Record<string, string> = { normal: '일반', continuous: '지속', equip: '장착' }
  return map[String(kind || '').toLowerCase()] || '마법'
}

function buildMeta(def?: CardDef | null) {
  return [def?.race, def?.theme, def?.element].filter(Boolean).join(' · ')
}

type GameCardSurfaceProps = {
  cardKey: string
  className?: string
}

export function GameCardSurface({ cardKey, className = '' }: GameCardSurfaceProps) {
  const shared = getSharedCardsGlobal()
  const defs = shared?.CARD_DEFS || {}
  const key = normalizeCardKey(cardKey)
  const def = defs[key]
  const type = def?.type === 'monster' ? '유닛' : '마법'
  const footer = def?.type === 'monster'
    ? `${def?.atk ?? '-'} / ${def?.hp ?? '-'}`
    : spellKindLabel(def?.spellKind)
  const meta = buildMeta(def)
  const effect = normalizeEffectText(def?.effect || '') || '효과 없음'

  return (
    <div className={className}>
      <div className={`bp-card ${def?.type === 'monster' ? 'bp-card--unit' : 'bp-card--spell'}`}>
        <div className="bp-card__chrome" />
        <div className="bp-card__head">
          <span className="bp-card__cost">{def?.cost ?? '-'}</span>
          <span className="bp-card__type">{type}</span>
        </div>
        <div className="bp-card__body">
          <div className="bp-card__name">{def?.name || key}</div>
          <div className={`bp-card__meta${meta ? '' : ' bp-card__meta--empty'}`}>{meta || '분류 없음'}</div>
          <div className="bp-card__text">{effect}</div>
        </div>
        <div className="bp-card__foot">
          <span className="bp-card__footer">{footer}</span>
        </div>
      </div>
    </div>
  )
}

