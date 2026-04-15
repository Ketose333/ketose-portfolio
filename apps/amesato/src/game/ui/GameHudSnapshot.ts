import type { GameRoute } from '../core/types'

export type GameStatus = 'booting' | 'running' | 'paused' | 'gameover' | 'cleared'

export type GameOverlayKind =
  | 'none'
  | 'route-select'
  | 'scene-total'
  | 'stage-bonus'
  | 'dialogue'
  | 'gameover-menu'
  | 'verdict'
  | 'score-entry'

export interface GameOverlayChoice {
  id: string
  label: string
  active: boolean
}

export interface GameOverlayStat {
  label: string
  value: string
}

export interface GameOverlaySnapshot {
  kind: GameOverlayKind
  stateKey: string
  title: string
  subtitle: string
  body: string
  prompt: string
  speaker: string
  choices: GameOverlayChoice[]
  stats: GameOverlayStat[]
}

export interface GameHudSnapshot {
  status: GameStatus
  message: string
  arenaKind: 'basic' | 'boss'
  currentRoute: GameRoute
  score: number
  lives: number
  bombs: number
  campaignStageNumber: number
  enemyHealth: number
  enemyMaxHealth: number
  elapsedSeconds: number
  shotsFired: number
  cardCombo: number
  phaseLabel: string
  basicProgress: string | null
  awaitingStageStart: boolean
  rewardFlipCycle: number
  pointValue: number
  pelletSpeedBonus: number
  sceneStartScore: number
  sceneStartElapsedSeconds: number
  sceneMaxCombo: number
  stageStartElapsedSeconds: number
  stageMaxCombo: number
  sceneContinueCounts: number[]
  totalContinues: number
  overlay: GameOverlaySnapshot
}

export const initialHudSnapshot: GameHudSnapshot = {
  status: 'booting',
  message: '게임 플레이필드를 준비하는 중...',
  arenaKind: 'basic',
  currentRoute: 'route-a',
  score: 0,
  lives: 3,
  bombs: 1,
  campaignStageNumber: 1,
  enemyHealth: 0,
  enemyMaxHealth: 0,
  elapsedSeconds: 0,
  shotsFired: 0,
  cardCombo: 0,
  phaseLabel: '봉인 목표 대기',
  basicProgress: null,
  awaitingStageStart: false,
  rewardFlipCycle: 0,
  pointValue: 0,
  pelletSpeedBonus: 0,
  sceneStartScore: 0,
  sceneStartElapsedSeconds: 0,
  sceneMaxCombo: 0,
  stageStartElapsedSeconds: 0,
  stageMaxCombo: 0,
  sceneContinueCounts: [0, 0, 0, 0],
  totalContinues: 0,
  overlay: {
    kind: 'none',
    stateKey: '',
    title: '',
    subtitle: '',
    body: '',
    prompt: '',
    speaker: '',
    choices: [],
    stats: [],
  },
}
