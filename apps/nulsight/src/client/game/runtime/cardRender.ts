import type { CardDef } from '../../../app/globals'

type CardRenderDeps = {
  esc?: (value: unknown) => string
  normalizeCardKey?: (key: string) => string
  getCardDef?: (key: string) => CardDef | Record<string, unknown>
  getCardType?: (key: string) => string
}

export type CardRenderGlobal = {
  create: (deps?: CardRenderDeps) => {
    renderCardContent: (options?: { key?: string | null; unit?: Record<string, unknown> | null; hand?: boolean }) => string
    renderCardButton: (options?: {
      key?: string
      className?: string
      style?: string
      attrs?: string
      onClick?: string
      onDoubleClick?: string
    }) => string
  }
}

export function createCardRenderGlobal(): CardRenderGlobal {
  return {
    create(deps = {}) {
      const {
        esc = (value) => String(value ?? ''),
        normalizeCardKey = (key) => key,
        getCardDef = () => ({}),
        getCardType = () => 'spell',
      } = deps

      function normalizeEffectText(raw = '') {
        return String(raw || '')
          .replace(/([^\s(])\(/g, '$1 (')
          .replace(/\s{2,}/g, ' ')
          .trim()
      }

      function renderCardContent({
        key = null,
        unit = null,
        hand = false,
      }: {
        key?: string | null
        unit?: Record<string, unknown> | null
        hand?: boolean
      } = {}) {
        const baseKey = key || String(unit?.key || '')
        if (!baseKey) return '<div class="slot-empty"></div>'

        const normalizedKey = normalizeCardKey(baseKey)
        const def = getCardDef(normalizedKey) as CardDef
        const name = def?.name || normalizedKey
        const effect = normalizeEffectText(def?.effect || '')
        const type = getCardType(normalizedKey)
        const stat = unit
          ? `${unit.atk ?? '-'} / ${unit.hp ?? '-'}`
          : (type === 'monster' && Number.isFinite(def?.atk) && Number.isFinite(def?.hp) ? `${def.atk}/${def.hp}` : '')
        const metaParts = [def?.guard ? '가드' : '', def?.race, def?.theme, def?.element].filter(Boolean)
        const meta = metaParts.join(' · ')
        const typeLabel = type === 'monster' ? '유닛' : '마법'
        const cost = Number.isFinite(def?.cost) ? String(def.cost) : '-'
        const footer = stat || (type === 'spell' ? String(def?.spellKind || 'spell').toUpperCase() : '')
        const typeClass = type === 'monster' ? 'bp-card--unit' : 'bp-card--spell'

        return `
          <div class="bp-card ${typeClass} ${hand ? 'bp-card--hand' : 'bp-card--zone'}">
            <div class="bp-card__chrome"></div>
            <div class="bp-card__head">
              <span class="bp-card__cost">${esc(cost)}</span>
              <span class="bp-card__type">${esc(typeLabel)}</span>
            </div>
            <div class="bp-card__body">
              <div class="bp-card__name">${esc(name)}</div>
              ${meta ? `<div class="bp-card__meta">${esc(meta)}</div>` : '<div class="bp-card__meta bp-card__meta--empty">분류 없음</div>'}
              ${effect ? `<div class="bp-card__text">${esc(effect)}</div>` : '<div class="bp-card__text muted">효과 없음</div>'}
            </div>
            <div class="bp-card__foot">
              <span class="bp-card__footer">${esc(footer)}</span>
            </div>
          </div>
        `
      }

      function renderCardButton({
        key,
        className = '',
        style = '',
        attrs = '',
        onClick = '',
        onDoubleClick = '',
      }: {
        key?: string
        className?: string
        style?: string
        attrs?: string
        onClick?: string
        onDoubleClick?: string
      } = {}) {
        const classes = `hand-card ${className}`.trim()
        const styleAttr = style ? ` style="${style}"` : ''
        const clickAttr = onClick ? ` onclick="${onClick}"` : ''
        const doubleClickAttr = onDoubleClick ? ` ondblclick="${onDoubleClick}"` : ''
        return `<button class="${classes}" type="button"${styleAttr}${attrs}${clickAttr}${doubleClickAttr}>${renderCardContent({ key, hand: true })}</button>`
      }

      return { renderCardContent, renderCardButton }
    },
  }
}
