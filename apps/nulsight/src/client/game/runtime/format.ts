import { phaseLabel } from './termbook'

export type GameFormatGlobal = {
  esc: (value: unknown) => string
  phaseLabel: (phase: string, termbook?: { phaseLabel?: (phase: string) => string }) => string
  gameSig: (game: any) => string
}

export function esc(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function gamePhaseLabel(phase: string, termbook?: { phaseLabel?: (phase: string) => string }) {
  if (typeof termbook?.phaseLabel === 'function') return termbook.phaseLabel(phase)
  return phaseLabel(phase)
}

export function gameSig(game: any) {
  if (!game) return ''
  return [
    game.turn,
    game.phase,
    game.activeAgentId,
    game.winnerId || '-',
    (game.stack || []).length,
    JSON.stringify(game.agents || {}),
  ].join('|')
}
