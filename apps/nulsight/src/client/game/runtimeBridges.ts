import { AGENT_KEY, ROOM_KEY, loadSavedAgent, loadSavedRoom, saveAgent, saveRoom } from './persistence'
import { createCardRenderGlobal, type CardRenderGlobal } from './runtime/cardRender'
import { esc, gamePhaseLabel, gameSig, type GameFormatGlobal } from './runtime/format'
import { mapApiError, phaseLabel, TERMBOOK, type TermbookGlobal } from './runtime/termbook'
import {
  buildActiveActionState,
  buildHudState,
  buildStackEntryState,
  buildSurfaceMeta,
  displayName,
  phaseAdvanceLabel,
  winnerLabel,
  type GameViewGlobal,
} from './runtime/viewState'

type GameSessionGlobal = {
  ROOM_KEY: string
  AGENT_KEY: string
  loadSavedRoom: () => string
  saveRoom: (roomId: string) => void
  loadSavedAgent: () => string
  saveAgent: (agentId: string) => void
}

declare global {
  interface Window {
    BP_TERMBOOK?: TermbookGlobal
    BP_CARD_RENDER?: CardRenderGlobal
    BP_GAME_SESSION?: GameSessionGlobal
    BP_GAME_FORMAT?: GameFormatGlobal
    BP_GAME_VIEW?: GameViewGlobal
  }
}

export function installGameRuntimeBridges() {
  const previousTermbook = window.BP_TERMBOOK
  const previousCardRender = window.BP_CARD_RENDER
  const previousGameSession = window.BP_GAME_SESSION
  const previousGameFormat = window.BP_GAME_FORMAT
  const previousGameView = window.BP_GAME_VIEW

  window.BP_TERMBOOK = {
    ...TERMBOOK,
    phaseLabel,
    mapApiError,
  }

  window.BP_CARD_RENDER = createCardRenderGlobal()
  window.BP_GAME_SESSION = {
    ROOM_KEY,
    AGENT_KEY,
    loadSavedRoom,
    saveRoom,
    loadSavedAgent,
    saveAgent,
  }
  window.BP_GAME_FORMAT = {
    esc,
    phaseLabel: gamePhaseLabel,
    gameSig,
  }
  window.BP_GAME_VIEW = {
    displayName,
    winnerLabel,
    phaseAdvanceLabel,
    buildActiveActionState,
    buildHudState,
    buildSurfaceMeta,
    buildStackEntryState,
  }

  return () => {
    if (previousTermbook) window.BP_TERMBOOK = previousTermbook
    else delete window.BP_TERMBOOK

    if (previousCardRender) window.BP_CARD_RENDER = previousCardRender
    else delete window.BP_CARD_RENDER

    if (previousGameSession) window.BP_GAME_SESSION = previousGameSession
    else delete window.BP_GAME_SESSION

    if (previousGameFormat) window.BP_GAME_FORMAT = previousGameFormat
    else delete window.BP_GAME_FORMAT

    if (previousGameView) window.BP_GAME_VIEW = previousGameView
    else delete window.BP_GAME_VIEW
  }
}
