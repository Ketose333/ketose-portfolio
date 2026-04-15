import {
  ENEMY_BULLET_SPEED,
  PLAYFIELD_BOTTOM,
  PLAYFIELD_CENTER_X,
  PLAYFIELD_LEFT,
  PLAYFIELD_RIGHT,
  PLAYFIELD_TOP,
} from '../data/config/gameConfig'
import { createEnemyBullet, type BulletKind, type BulletModel } from '../entities/Bullet'
import type { EnemyModel } from '../entities/Enemy'
import type { GameRank, Vector2 } from '../core/types'

export type BossPatternId =
  | 'guardian-fan'
  | 'route-a-branch'
  | 'route-b-branch'
  | 'route-a-ascent'
  | 'route-b-ascent'
  | 'route-a-final'
  | 'route-b-final'

type BossAttackKind =
  | 'aimed-fan'
  | 'cross-burst'
  | 'sweeping-fan'
  | 'ring-burst'
  | 'spiral-ring'
  | 'chase-pairs'
  | 'slam-spread'
  | 'downpour-columns'
  | 'corner-missiles'
  | 'pillar-fan'
  | 'aimed-laser'
  | 'column-laser'
  | 'side-fan'
  | 'meteor-rain'

type BossMovementKind = 'sine' | 'weave' | 'figure-eight' | 'swoop'

interface BossAttackDefinition {
  kind: BossAttackKind
  intervalByRank: Record<GameRank, number>
  bulletSpeed: number
  count?: number
  spread?: number
  radius?: number
  laneSpacing?: number
  angleStep?: number
  sweepAmplitude?: number
  offsetX?: number
  beamWidth?: number
  telegraphSeconds?: number
  activeSeconds?: number
}

interface BossMovementDefinition {
  kind: BossMovementKind
  anchorY: number
  driftX: number
  driftY: number
  waveSpeedX: number
  waveSpeedY: number
  cycleSeconds?: number
  diveDepth?: number
}

interface BossPatternPhaseDefinition {
  minHealthRatio: number
  movement: BossMovementDefinition
  attacks: BossAttackDefinition[]
}

interface BossPatternDefinition {
  phases: BossPatternPhaseDefinition[]
}

export interface BossPatternState {
  elapsedSeconds: number
  phaseElapsedSeconds: number
  attackTimers: number[]
  attackSequence: number[]
  phaseIndex: number
}

export type BossBeamKind = 'aimed' | 'column'

export interface BossBeamModel {
  id: number
  kind: BossBeamKind
  start: Vector2
  end: Vector2
  width: number
  telegraphSeconds: number
  activeSeconds: number
  elapsedSeconds: number
  active: boolean
}

export interface BossPatternUpdateResult {
  bullets: BulletModel[]
  beams: BossBeamModel[]
}

const MIN_BOSS_PHASE_SECONDS = 1.2

const byRank = (easy: number, normal: number, hard: number, lunatic: number) => ({
  easy,
  normal,
  hard,
  lunatic,
})

const bossPatterns: Record<BossPatternId, BossPatternDefinition> = {
  'guardian-fan': {
    phases: [
      {
        minHealthRatio: 0.76,
        movement: {
          kind: 'sine',
          anchorY: 62,
          driftX: 74,
          driftY: 10,
          waveSpeedX: 0.82,
          waveSpeedY: 0.44,
        },
        attacks: [
          {
            kind: 'aimed-fan',
            intervalByRank: byRank(1.34, 1.12, 0.94, 0.76),
            bulletSpeed: ENEMY_BULLET_SPEED + 2,
            count: 5,
            spread: 0.16,
          },
          {
            kind: 'slam-spread',
            intervalByRank: byRank(4.4, 3.7, 3.0, 2.5),
            bulletSpeed: ENEMY_BULLET_SPEED - 12,
            count: 7,
            spread: 0.24,
          },
        ],
      },
      {
        minHealthRatio: 0.5,
        movement: {
          kind: 'swoop',
          anchorY: 66,
          driftX: 48,
          driftY: 12,
          waveSpeedX: 0.78,
          waveSpeedY: 0.48,
          cycleSeconds: 3.6,
          diveDepth: 104,
        },
        attacks: [
          {
            kind: 'chase-pairs',
            intervalByRank: byRank(1.22, 1.0, 0.82, 0.66),
            bulletSpeed: ENEMY_BULLET_SPEED + 8,
            count: 2,
            spread: 0.08,
            offsetX: 20,
          },
          {
            kind: 'cross-burst',
            intervalByRank: byRank(2.5, 2.04, 1.7, 1.36),
            bulletSpeed: ENEMY_BULLET_SPEED - 18,
            count: 8,
          },
          {
            kind: 'aimed-laser',
            intervalByRank: byRank(4.8, 4.0, 3.2, 2.6),
            bulletSpeed: 0,
            beamWidth: 10,
            telegraphSeconds: 0.48,
            activeSeconds: 0.54,
          },
        ],
      },
      {
        minHealthRatio: 0.22,
        movement: {
          kind: 'weave',
          anchorY: 68,
          driftX: 88,
          driftY: 18,
          waveSpeedX: 1.0,
          waveSpeedY: 0.62,
        },
        attacks: [
          {
            kind: 'downpour-columns',
            intervalByRank: byRank(1.82, 1.46, 1.18, 0.94),
            bulletSpeed: ENEMY_BULLET_SPEED + 6,
            count: 5,
            laneSpacing: 60,
          },
          {
            kind: 'sweeping-fan',
            intervalByRank: byRank(1.08, 0.9, 0.74, 0.6),
            bulletSpeed: ENEMY_BULLET_SPEED + 10,
            count: 7,
            spread: 0.12,
            sweepAmplitude: 0.58,
          },
        ],
      },
      {
        minHealthRatio: 0,
        movement: {
          kind: 'swoop',
          anchorY: 70,
          driftX: 62,
          driftY: 18,
          waveSpeedX: 0.88,
          waveSpeedY: 0.64,
          cycleSeconds: 3.1,
          diveDepth: 116,
        },
        attacks: [
          {
            kind: 'chase-pairs',
            intervalByRank: byRank(1.02, 0.82, 0.68, 0.56),
            bulletSpeed: ENEMY_BULLET_SPEED + 10,
            count: 3,
            spread: 0.1,
            offsetX: 24,
          },
          {
            kind: 'ring-burst',
            intervalByRank: byRank(2.88, 2.28, 1.82, 1.44),
            bulletSpeed: ENEMY_BULLET_SPEED - 10,
            count: 10,
          },
        ],
      },
    ],
  },
  'route-a-branch': {
    phases: [
      {
        minHealthRatio: 0.76,
        movement: {
          kind: 'figure-eight',
          anchorY: 60,
          driftX: 88,
          driftY: 18,
          waveSpeedX: 0.88,
          waveSpeedY: 0.68,
        },
        attacks: [
          {
            kind: 'spiral-ring',
            intervalByRank: byRank(1.52, 1.24, 1.02, 0.82),
            bulletSpeed: ENEMY_BULLET_SPEED - 6,
            count: 10,
            angleStep: 0.32,
          },
          {
            kind: 'side-fan',
            intervalByRank: byRank(1.6, 1.28, 1.02, 0.82),
            bulletSpeed: ENEMY_BULLET_SPEED,
            count: 3,
            spread: 0.15,
          },
        ],
      },
      {
        minHealthRatio: 0.5,
        movement: {
          kind: 'weave',
          anchorY: 62,
          driftX: 104,
          driftY: 22,
          waveSpeedX: 1.04,
          waveSpeedY: 0.74,
        },
        attacks: [
          {
            kind: 'downpour-columns',
            intervalByRank: byRank(1.9, 1.52, 1.2, 0.96),
            bulletSpeed: ENEMY_BULLET_SPEED + 4,
            count: 5,
            laneSpacing: 58,
          },
          {
            kind: 'column-laser',
            intervalByRank: byRank(4.7, 3.9, 3.2, 2.5),
            bulletSpeed: 0,
            count: 3,
            laneSpacing: 76,
            beamWidth: 8,
            telegraphSeconds: 0.5,
            activeSeconds: 0.5,
          },
        ],
      },
      {
        minHealthRatio: 0.24,
        movement: {
          kind: 'swoop',
          anchorY: 66,
          driftX: 52,
          driftY: 18,
          waveSpeedX: 0.9,
          waveSpeedY: 0.7,
          cycleSeconds: 3.2,
          diveDepth: 110,
        },
        attacks: [
          {
            kind: 'slam-spread',
            intervalByRank: byRank(3.8, 3.14, 2.56, 2.08),
            bulletSpeed: ENEMY_BULLET_SPEED,
            count: 9,
            spread: 0.2,
          },
          {
            kind: 'spiral-ring',
            intervalByRank: byRank(1.3, 1.08, 0.88, 0.72),
            bulletSpeed: ENEMY_BULLET_SPEED - 4,
            count: 12,
            angleStep: 0.42,
          },
          {
            kind: 'aimed-laser',
            intervalByRank: byRank(4.4, 3.7, 3.0, 2.4),
            bulletSpeed: 0,
            count: 2,
            spread: 0.22,
            beamWidth: 9,
            telegraphSeconds: 0.44,
            activeSeconds: 0.48,
          },
          {
            kind: 'side-fan',
            intervalByRank: byRank(1.5, 1.2, 0.96, 0.78),
            bulletSpeed: ENEMY_BULLET_SPEED + 8,
            count: 4,
            spread: 0.12,
          },
        ],
      },
      {
        minHealthRatio: 0,
        movement: {
          kind: 'figure-eight',
          anchorY: 68,
          driftX: 112,
          driftY: 24,
          waveSpeedX: 1.12,
          waveSpeedY: 0.8,
        },
        attacks: [
          {
            kind: 'pillar-fan',
            intervalByRank: byRank(1.54, 1.22, 0.98, 0.78),
            bulletSpeed: ENEMY_BULLET_SPEED + 4,
            count: 3,
            spread: 0.16,
            offsetX: 24,
          },
          {
            kind: 'cross-burst',
            intervalByRank: byRank(2.26, 1.84, 1.48, 1.18),
            bulletSpeed: ENEMY_BULLET_SPEED - 10,
            count: 8,
          },
        ],
      },
    ],
  },
  'route-b-branch': {
    phases: [
      {
        minHealthRatio: 0.76,
        movement: {
          kind: 'weave',
          anchorY: 62,
          driftX: 82,
          driftY: 24,
          waveSpeedX: 0.74,
          waveSpeedY: 0.7,
        },
        attacks: [
          {
            kind: 'corner-missiles',
            intervalByRank: byRank(1.76, 1.42, 1.14, 0.9),
            bulletSpeed: ENEMY_BULLET_SPEED + 20,
            count: 2,
            spread: 0.12,
            offsetX: 22,
            radius: 10,
          },
          {
            kind: 'meteor-rain',
            intervalByRank: byRank(1.78, 1.42, 1.12, 0.88),
            bulletSpeed: ENEMY_BULLET_SPEED + 16,
            count: 4,
            spread: 0.16,
          },
        ],
      },
      {
        minHealthRatio: 0.5,
        movement: {
          kind: 'figure-eight',
          anchorY: 64,
          driftX: 94,
          driftY: 20,
          waveSpeedX: 0.84,
          waveSpeedY: 0.76,
        },
        attacks: [
          {
            kind: 'pillar-fan',
            intervalByRank: byRank(1.68, 1.34, 1.08, 0.86),
            bulletSpeed: ENEMY_BULLET_SPEED + 2,
            count: 3,
            spread: 0.18,
            offsetX: 26,
          },
          {
            kind: 'aimed-fan',
            intervalByRank: byRank(1.3, 1.06, 0.88, 0.72),
            bulletSpeed: ENEMY_BULLET_SPEED + 6,
            count: 5,
            spread: 0.18,
          },
          {
            kind: 'aimed-laser',
            intervalByRank: byRank(4.6, 3.8, 3.1, 2.4),
            bulletSpeed: 0,
            count: 2,
            spread: 0.16,
            beamWidth: 9,
            telegraphSeconds: 0.46,
            activeSeconds: 0.5,
          },
        ],
      },
      {
        minHealthRatio: 0.24,
        movement: {
          kind: 'swoop',
          anchorY: 66,
          driftX: 56,
          driftY: 22,
          waveSpeedX: 0.8,
          waveSpeedY: 0.84,
          cycleSeconds: 3.28,
          diveDepth: 112,
        },
        attacks: [
          {
            kind: 'corner-missiles',
            intervalByRank: byRank(1.5, 1.2, 0.96, 0.76),
            bulletSpeed: ENEMY_BULLET_SPEED + 28,
            count: 3,
            spread: 0.16,
            offsetX: 24,
            radius: 10,
          },
          {
            kind: 'meteor-rain',
            intervalByRank: byRank(1.62, 1.28, 1.0, 0.78),
            bulletSpeed: ENEMY_BULLET_SPEED + 18,
            count: 4,
            spread: 0.22,
          },
        ],
      },
      {
        minHealthRatio: 0,
        movement: {
          kind: 'weave',
          anchorY: 70,
          driftX: 102,
          driftY: 28,
          waveSpeedX: 0.94,
          waveSpeedY: 0.9,
        },
        attacks: [
          {
            kind: 'cross-burst',
            intervalByRank: byRank(2.1, 1.72, 1.38, 1.08),
            bulletSpeed: ENEMY_BULLET_SPEED - 8,
            count: 8,
          },
          {
            kind: 'sweeping-fan',
            intervalByRank: byRank(1.02, 0.84, 0.68, 0.54),
            bulletSpeed: ENEMY_BULLET_SPEED + 10,
            count: 7,
            spread: 0.12,
            sweepAmplitude: 0.62,
          },
        ],
      },
    ],
  },
  'route-a-ascent': {
    phases: [
      {
        minHealthRatio: 0.76,
        movement: {
          kind: 'weave',
          anchorY: 62,
          driftX: 96,
          driftY: 18,
          waveSpeedX: 0.92,
          waveSpeedY: 0.7,
        },
        attacks: [
          {
            kind: 'side-fan',
            intervalByRank: byRank(1.56, 1.24, 1.0, 0.8),
            bulletSpeed: ENEMY_BULLET_SPEED + 6,
            count: 4,
            spread: 0.12,
          },
          {
            kind: 'spiral-ring',
            intervalByRank: byRank(1.4, 1.14, 0.92, 0.74),
            bulletSpeed: ENEMY_BULLET_SPEED,
            count: 12,
            angleStep: 0.36,
          },
        ],
      },
      {
        minHealthRatio: 0.5,
        movement: {
          kind: 'figure-eight',
          anchorY: 64,
          driftX: 108,
          driftY: 22,
          waveSpeedX: 1.0,
          waveSpeedY: 0.8,
        },
        attacks: [
          {
            kind: 'column-laser',
            intervalByRank: byRank(4.2, 3.4, 2.8, 2.2),
            bulletSpeed: 0,
            count: 3,
            laneSpacing: 78,
            beamWidth: 8,
            telegraphSeconds: 0.46,
            activeSeconds: 0.52,
          },
          {
            kind: 'pillar-fan',
            intervalByRank: byRank(1.48, 1.18, 0.94, 0.76),
            bulletSpeed: ENEMY_BULLET_SPEED + 8,
            count: 3,
            spread: 0.18,
            offsetX: 28,
          },
        ],
      },
      {
        minHealthRatio: 0.2,
        movement: {
          kind: 'swoop',
          anchorY: 68,
          driftX: 66,
          driftY: 24,
          waveSpeedX: 0.92,
          waveSpeedY: 0.84,
          cycleSeconds: 3.0,
          diveDepth: 122,
        },
        attacks: [
          {
            kind: 'aimed-laser',
            intervalByRank: byRank(3.8, 3.1, 2.5, 2.0),
            bulletSpeed: 0,
            count: 2,
            spread: 0.16,
            beamWidth: 10,
            telegraphSeconds: 0.42,
            activeSeconds: 0.5,
          },
          {
            kind: 'ring-burst',
            intervalByRank: byRank(2.1, 1.72, 1.38, 1.08),
            bulletSpeed: ENEMY_BULLET_SPEED + 2,
            count: 12,
          },
        ],
      },
    ],
  },
  'route-b-ascent': {
    phases: [
      {
        minHealthRatio: 0.76,
        movement: {
          kind: 'weave',
          anchorY: 62,
          driftX: 90,
          driftY: 24,
          waveSpeedX: 0.82,
          waveSpeedY: 0.78,
        },
        attacks: [
          {
            kind: 'meteor-rain',
            intervalByRank: byRank(1.74, 1.38, 1.08, 0.84),
            bulletSpeed: ENEMY_BULLET_SPEED + 16,
            count: 5,
            spread: 0.18,
          },
          {
            kind: 'corner-missiles',
            intervalByRank: byRank(1.72, 1.36, 1.08, 0.84),
            bulletSpeed: ENEMY_BULLET_SPEED + 24,
            count: 3,
            spread: 0.16,
            offsetX: 22,
            radius: 10,
          },
        ],
      },
      {
        minHealthRatio: 0.5,
        movement: {
          kind: 'swoop',
          anchorY: 66,
          driftX: 58,
          driftY: 22,
          waveSpeedX: 0.86,
          waveSpeedY: 0.9,
          cycleSeconds: 3.16,
          diveDepth: 118,
        },
        attacks: [
          {
            kind: 'aimed-laser',
            intervalByRank: byRank(4.0, 3.2, 2.6, 2.0),
            bulletSpeed: 0,
            count: 1,
            beamWidth: 10,
            telegraphSeconds: 0.44,
            activeSeconds: 0.54,
          },
          {
            kind: 'meteor-rain',
            intervalByRank: byRank(1.6, 1.26, 0.98, 0.76),
            bulletSpeed: ENEMY_BULLET_SPEED + 20,
            count: 4,
            spread: 0.22,
          },
        ],
      },
      {
        minHealthRatio: 0.2,
        movement: {
          kind: 'figure-eight',
          anchorY: 70,
          driftX: 108,
          driftY: 28,
          waveSpeedX: 0.96,
          waveSpeedY: 0.88,
        },
        attacks: [
          {
            kind: 'column-laser',
            intervalByRank: byRank(4.0, 3.2, 2.5, 2.0),
            bulletSpeed: 0,
            count: 4,
            laneSpacing: 64,
            beamWidth: 8,
            telegraphSeconds: 0.44,
            activeSeconds: 0.56,
          },
          {
            kind: 'cross-burst',
            intervalByRank: byRank(1.94, 1.56, 1.22, 0.96),
            bulletSpeed: ENEMY_BULLET_SPEED,
            count: 8,
          },
        ],
      },
    ],
  },
  'route-a-final': {
    phases: [
      {
        minHealthRatio: 0.78,
        movement: {
          kind: 'figure-eight',
          anchorY: 60,
          driftX: 104,
          driftY: 22,
          waveSpeedX: 0.96,
          waveSpeedY: 0.72,
        },
        attacks: [
          {
            kind: 'spiral-ring',
            intervalByRank: byRank(1.34, 1.08, 0.88, 0.72),
            bulletSpeed: ENEMY_BULLET_SPEED - 2,
            count: 12,
            angleStep: 0.34,
          },
          {
            kind: 'chase-pairs',
            intervalByRank: byRank(1.16, 0.94, 0.76, 0.62),
            bulletSpeed: ENEMY_BULLET_SPEED + 10,
            count: 3,
            spread: 0.08,
            offsetX: 24,
          },
        ],
      },
      {
        minHealthRatio: 0.52,
        movement: {
          kind: 'weave',
          anchorY: 64,
          driftX: 118,
          driftY: 26,
          waveSpeedX: 1.08,
          waveSpeedY: 0.84,
        },
        attacks: [
          {
            kind: 'downpour-columns',
            intervalByRank: byRank(1.62, 1.28, 1.0, 0.8),
            bulletSpeed: ENEMY_BULLET_SPEED + 10,
            count: 5,
            laneSpacing: 56,
          },
          {
            kind: 'aimed-fan',
            intervalByRank: byRank(1.04, 0.84, 0.68, 0.56),
            bulletSpeed: ENEMY_BULLET_SPEED + 12,
            count: 7,
            spread: 0.12,
          },
        ],
      },
      {
        minHealthRatio: 0.26,
        movement: {
          kind: 'swoop',
          anchorY: 68,
          driftX: 64,
          driftY: 24,
          waveSpeedX: 0.96,
          waveSpeedY: 0.86,
          cycleSeconds: 2.96,
          diveDepth: 120,
        },
        attacks: [
          {
            kind: 'slam-spread',
            intervalByRank: byRank(3.2, 2.66, 2.16, 1.74),
            bulletSpeed: ENEMY_BULLET_SPEED + 4,
            count: 11,
            spread: 0.18,
          },
          {
            kind: 'cross-burst',
            intervalByRank: byRank(1.92, 1.58, 1.24, 0.98),
            bulletSpeed: ENEMY_BULLET_SPEED - 4,
            count: 8,
          },
          {
            kind: 'aimed-laser',
            intervalByRank: byRank(3.9, 3.2, 2.6, 2.1),
            bulletSpeed: 0,
            count: 2,
            spread: 0.18,
            beamWidth: 10,
            telegraphSeconds: 0.42,
            activeSeconds: 0.5,
          },
        ],
      },
      {
        minHealthRatio: 0,
        movement: {
          kind: 'figure-eight',
          anchorY: 72,
          driftX: 128,
          driftY: 30,
          waveSpeedX: 1.2,
          waveSpeedY: 0.94,
        },
        attacks: [
          {
            kind: 'pillar-fan',
            intervalByRank: byRank(1.34, 1.08, 0.84, 0.66),
            bulletSpeed: ENEMY_BULLET_SPEED + 8,
            count: 3,
            spread: 0.18,
            offsetX: 28,
          },
          {
            kind: 'ring-burst',
            intervalByRank: byRank(2.22, 1.76, 1.38, 1.08),
            bulletSpeed: ENEMY_BULLET_SPEED,
            count: 12,
          },
        ],
      },
    ],
  },
  'route-b-final': {
    phases: [
      {
        minHealthRatio: 0.78,
        movement: {
          kind: 'weave',
          anchorY: 62,
          driftX: 94,
          driftY: 26,
          waveSpeedX: 0.8,
          waveSpeedY: 0.82,
        },
        attacks: [
          {
            kind: 'corner-missiles',
            intervalByRank: byRank(1.64, 1.3, 1.02, 0.8),
            bulletSpeed: ENEMY_BULLET_SPEED + 24,
            count: 3,
            spread: 0.14,
            offsetX: 24,
            radius: 10,
          },
          {
            kind: 'sweeping-fan',
            intervalByRank: byRank(1.14, 0.92, 0.74, 0.6),
            bulletSpeed: ENEMY_BULLET_SPEED + 8,
            count: 7,
            spread: 0.14,
            sweepAmplitude: 0.52,
          },
        ],
      },
      {
        minHealthRatio: 0.52,
        movement: {
          kind: 'figure-eight',
          anchorY: 66,
          driftX: 102,
          driftY: 28,
          waveSpeedX: 0.9,
          waveSpeedY: 0.88,
        },
        attacks: [
          {
            kind: 'pillar-fan',
            intervalByRank: byRank(1.48, 1.18, 0.94, 0.74),
            bulletSpeed: ENEMY_BULLET_SPEED + 6,
            count: 3,
            spread: 0.2,
            offsetX: 30,
          },
          {
            kind: 'spiral-ring',
            intervalByRank: byRank(1.24, 1.0, 0.82, 0.66),
            bulletSpeed: ENEMY_BULLET_SPEED,
            count: 10,
            angleStep: 0.38,
          },
        ],
      },
      {
        minHealthRatio: 0.26,
        movement: {
          kind: 'swoop',
          anchorY: 70,
          driftX: 60,
          driftY: 24,
          waveSpeedX: 0.84,
          waveSpeedY: 0.92,
          cycleSeconds: 3.02,
          diveDepth: 124,
        },
        attacks: [
          {
            kind: 'corner-missiles',
            intervalByRank: byRank(1.34, 1.06, 0.84, 0.66),
            bulletSpeed: ENEMY_BULLET_SPEED + 30,
            count: 4,
            spread: 0.18,
            offsetX: 26,
            radius: 10,
          },
          {
            kind: 'downpour-columns',
            intervalByRank: byRank(1.56, 1.22, 0.96, 0.74),
            bulletSpeed: ENEMY_BULLET_SPEED + 10,
            count: 5,
            laneSpacing: 54,
          },
        ],
      },
      {
        minHealthRatio: 0,
        movement: {
          kind: 'weave',
          anchorY: 72,
          driftX: 110,
          driftY: 32,
          waveSpeedX: 0.98,
          waveSpeedY: 1.0,
        },
        attacks: [
          {
            kind: 'cross-burst',
            intervalByRank: byRank(1.86, 1.5, 1.16, 0.9),
            bulletSpeed: ENEMY_BULLET_SPEED,
            count: 8,
          },
          {
            kind: 'ring-burst',
            intervalByRank: byRank(2.12, 1.72, 1.34, 1.04),
            bulletSpeed: ENEMY_BULLET_SPEED + 2,
            count: 12,
          },
          {
            kind: 'column-laser',
            intervalByRank: byRank(4.2, 3.4, 2.8, 2.2),
            bulletSpeed: 0,
            count: 4,
            laneSpacing: 64,
            beamWidth: 9,
            telegraphSeconds: 0.46,
            activeSeconds: 0.56,
          },
        ],
      },
    ],
  },
}

export function createBossPatternState(): BossPatternState {
  return {
    elapsedSeconds: 0,
    phaseElapsedSeconds: 0,
    attackTimers: [],
    attackSequence: [],
    phaseIndex: 0,
  }
}

export function resetBossPatternState(state: BossPatternState, patternId: BossPatternId, rank: GameRank) {
  const pattern = bossPatterns[patternId]
  state.elapsedSeconds = 0
  state.phaseElapsedSeconds = 0
  state.phaseIndex = 0
  state.attackTimers = createAttackTimers(pattern.phases[0], rank, 0.82)
  state.attackSequence = pattern.phases[0].attacks.map(() => 0)
}

export function updateBossPattern(
  state: BossPatternState,
  patternId: BossPatternId,
  rank: GameRank,
  enemy: EnemyModel,
  playerPosition: Vector2,
  deltaSeconds: number,
  idFactory: () => number,
) {
  const pattern = bossPatterns[patternId]
  state.elapsedSeconds += deltaSeconds

  const phaseIndex = resolvePhaseIndex(pattern, enemy, state.phaseIndex, state.phaseElapsedSeconds)
  if (phaseIndex !== state.phaseIndex) {
    state.phaseIndex = phaseIndex
    state.phaseElapsedSeconds = 0
    state.attackTimers = createAttackTimers(pattern.phases[phaseIndex], rank, 0.66)
    state.attackSequence = pattern.phases[phaseIndex].attacks.map(() => 0)
  } else {
    state.phaseElapsedSeconds += deltaSeconds
  }

  const phase = pattern.phases[state.phaseIndex]
  enemy.patternTime = state.elapsedSeconds
  applyBossMovement(enemy, phase.movement, playerPosition, state.phaseElapsedSeconds)

  const bullets: BulletModel[] = []
  const beams: BossBeamModel[] = []
  for (let index = 0; index < phase.attacks.length; index += 1) {
    const attack = phase.attacks[index]
    state.attackTimers[index] -= deltaSeconds
    if (state.attackTimers[index] > 0) {
      continue
    }

    const attackResult = spawnBossAttack(
      attack,
      enemy.position,
      playerPosition,
      state.phaseElapsedSeconds,
      state.attackSequence[index],
      idFactory,
    )
    bullets.push(...attackResult.bullets)
    beams.push(...attackResult.beams)

    state.attackSequence[index] += 1
    state.attackTimers[index] = attack.intervalByRank[rank]
  }

  return { bullets, beams }
}

function applyBossMovement(
  enemy: EnemyModel,
  movement: BossMovementDefinition,
  playerPosition: Vector2,
  elapsedSeconds: number,
) {
  switch (movement.kind) {
    case 'sine': {
      enemy.position.x =
        PLAYFIELD_CENTER_X + Math.sin(elapsedSeconds * movement.waveSpeedX) * movement.driftX
      enemy.position.y =
        PLAYFIELD_TOP +
        movement.anchorY +
        Math.sin(elapsedSeconds * movement.waveSpeedY) * movement.driftY
      return
    }
    case 'weave': {
      enemy.position.x =
        PLAYFIELD_CENTER_X +
        Math.sin(elapsedSeconds * movement.waveSpeedX) * movement.driftX +
        Math.sin(elapsedSeconds * movement.waveSpeedX * 2.4) * (movement.driftX * 0.22)
      enemy.position.y =
        PLAYFIELD_TOP +
        movement.anchorY +
        Math.sin(elapsedSeconds * movement.waveSpeedY) * movement.driftY
      return
    }
    case 'figure-eight': {
      enemy.position.x =
        PLAYFIELD_CENTER_X + Math.sin(elapsedSeconds * movement.waveSpeedX) * movement.driftX
      enemy.position.y =
        PLAYFIELD_TOP +
        movement.anchorY +
        Math.sin(elapsedSeconds * movement.waveSpeedY) *
          Math.cos(elapsedSeconds * movement.waveSpeedY * 0.5) *
          movement.driftY
      return
    }
    case 'swoop': {
      const cycle = movement.cycleSeconds ?? 3.2
      const local = elapsedSeconds % cycle
      const hoverY = PLAYFIELD_TOP + movement.anchorY
      const diveY = hoverY + (movement.diveDepth ?? 108)
      const baseX =
        PLAYFIELD_CENTER_X + Math.sin(elapsedSeconds * movement.waveSpeedX) * movement.driftX * 0.42
      const targetX = clamp(playerPosition.x, PLAYFIELD_LEFT + 72, PLAYFIELD_RIGHT - 72)

      if (local < 1.0) {
        enemy.position.x = lerp(
          baseX,
          PLAYFIELD_CENTER_X + Math.sin(elapsedSeconds * movement.waveSpeedX * 1.4) * movement.driftX,
          easeInOut(local / 1.0),
        )
        enemy.position.y = hoverY + Math.sin(elapsedSeconds * movement.waveSpeedY) * movement.driftY * 0.45
        return
      }

      if (local < 1.5) {
        const progress = easeInOut((local - 1.0) / 0.5)
        enemy.position.x = lerp(baseX, targetX, progress)
        enemy.position.y = lerp(hoverY, diveY, progress)
        return
      }

      if (local < 2.1) {
        const progress = (local - 1.5) / 0.6
        enemy.position.x = lerp(targetX, targetX + Math.sin(elapsedSeconds * 5.2) * 12, progress)
        enemy.position.y = diveY - Math.sin(progress * Math.PI) * 8
        return
      }

      const progress = easeInOut((local - 2.1) / Math.max(0.3, cycle - 2.1))
      enemy.position.x = lerp(targetX, baseX, progress)
      enemy.position.y = lerp(diveY, hoverY, progress)
      return
    }
  }
}

function spawnBossAttack(
  attack: BossAttackDefinition,
  enemyPosition: Vector2,
  playerPosition: Vector2,
  phaseElapsedSeconds: number,
  attackSequence: number,
  idFactory: () => number,
) : BossPatternUpdateResult {
  const originX = enemyPosition.x
  const originY = enemyPosition.y + 22
  const count = attack.count ?? 5
  const spread = attack.spread ?? 0.18
  const radius = attack.radius ?? 8
  const offsetX = attack.offsetX ?? 18
  const beamWidth = attack.beamWidth ?? 8
  const telegraphSeconds = attack.telegraphSeconds ?? 0.44
  const activeSeconds = attack.activeSeconds ?? 0.5

  switch (attack.kind) {
    case 'aimed-fan': {
      const baseAngle = Math.atan2(playerPosition.y - originY, playerPosition.x - originX)
      return {
        bullets: createFan(originX, originY, baseAngle, count, spread, attack.bulletSpeed, radius, idFactory),
        beams: [],
      }
    }
    case 'cross-burst': {
      const rotation = phaseElapsedSeconds * 1.24 + attackSequence * 0.18
      return {
        bullets: Array.from({ length: count }, (_, index) =>
          createConfiguredBullet(
            idFactory(),
            originX,
            originY,
            rotation + (Math.PI * 2 * index) / count,
            attack.bulletSpeed,
            radius,
          ),
        ),
        beams: [],
      }
    }
    case 'sweeping-fan': {
      const amplitude = attack.sweepAmplitude ?? 0.48
      const sweepCenter = Math.PI / 2 + Math.sin(phaseElapsedSeconds * 1.6) * amplitude
      return {
        bullets: createFan(originX, originY, sweepCenter, count, spread, attack.bulletSpeed, radius, idFactory),
        beams: [],
      }
    }
    case 'ring-burst': {
      const rotation = phaseElapsedSeconds * 0.86 + attackSequence * 0.22
      return {
        bullets: Array.from({ length: count }, (_, index) =>
          createConfiguredBullet(
            idFactory(),
            originX,
            originY,
            rotation + (Math.PI * 2 * index) / count,
            attack.bulletSpeed,
            radius,
          ),
        ),
        beams: [],
      }
    }
    case 'spiral-ring': {
      const rotation = attackSequence * (attack.angleStep ?? 0.34)
      return {
        bullets: Array.from({ length: count }, (_, index) =>
          createConfiguredBullet(
            idFactory(),
            originX,
            originY,
            rotation + (Math.PI * 2 * index) / count,
            attack.bulletSpeed + index * 1.6,
            radius,
          ),
        ),
        beams: [],
      }
    }
    case 'chase-pairs': {
      const bullets: BulletModel[] = []
      const origins = [originX - offsetX, originX + offsetX]
      const pairCount = Math.max(1, count)
      for (const startX of origins) {
        const baseAngle = Math.atan2(playerPosition.y - originY, playerPosition.x - startX)
        const offsets =
          pairCount === 1
            ? [0]
            : Array.from({ length: pairCount }, (_, index) => (index - (pairCount - 1) / 2) * spread)
        for (const angleOffset of offsets) {
          bullets.push(
            createConfiguredBullet(
              idFactory(),
              startX,
              originY,
              baseAngle + angleOffset,
              attack.bulletSpeed,
              radius,
            ),
          )
        }
      }
      return { bullets, beams: [] }
    }
    case 'slam-spread': {
      const center = Math.PI / 2
      return {
        bullets: createFan(
          originX,
          originY + 8,
          center,
          count,
          spread,
          attack.bulletSpeed,
          radius,
          idFactory,
        ),
        beams: [],
      }
    }
    case 'downpour-columns': {
      const spacing = attack.laneSpacing ?? 56
      const bullets: BulletModel[] = []
      for (let index = 0; index < count; index += 1) {
        const laneIndex = index - (count - 1) / 2
        const wobble = ((attackSequence + index) % 2 === 0 ? -1 : 1) * 10
        const x = clamp(playerPosition.x + laneIndex * spacing + wobble, PLAYFIELD_LEFT + 28, PLAYFIELD_RIGHT - 28)
        bullets.push(
          createConfiguredBullet(idFactory(), x, PLAYFIELD_TOP + 18, Math.PI / 2, attack.bulletSpeed, radius),
        )
      }
      return { bullets, beams: [] }
    }
    case 'corner-missiles': {
      const bullets: BulletModel[] = []
      const origins = [originX - offsetX, originX + offsetX]
      const burstCount = Math.max(1, count)
      const sequenceOffsets =
        burstCount === 1
          ? [0]
          : Array.from({ length: burstCount }, (_, index) => (index - (burstCount - 1) / 2) * spread)
      for (const startX of origins) {
        const baseAngle = Math.atan2(playerPosition.y - originY, playerPosition.x - startX)
        for (const angleOffset of sequenceOffsets) {
          bullets.push(
            createConfiguredBullet(
              idFactory(),
              startX,
              originY - 6,
              baseAngle + angleOffset,
              attack.bulletSpeed,
              radius,
              'missile',
            ),
          )
        }
      }
      return { bullets, beams: [] }
    }
    case 'pillar-fan': {
      const bullets: BulletModel[] = []
      const sourceCount = Math.max(1, count)
      for (let sourceIndex = 0; sourceIndex < sourceCount; sourceIndex += 1) {
        const laneOffset = (sourceIndex - (sourceCount - 1) / 2) * offsetX
        bullets.push(
          ...createFan(
            originX + laneOffset,
            originY + 10,
            Math.PI / 2,
            3,
            spread,
            attack.bulletSpeed,
            radius,
            idFactory,
          ),
        )
      }
      return { bullets, beams: [] }
    }
    case 'aimed-laser': {
      const beamCount = Math.max(1, count)
      const offsets =
        beamCount === 1
          ? [0]
          : Array.from({ length: beamCount }, (_, index) => (index - (beamCount - 1) / 2) * spread)
      const baseAngle = Math.atan2(playerPosition.y - originY, playerPosition.x - originX)

      return {
        bullets: [],
        beams: offsets.map((angleOffset) => {
          const angle = baseAngle + angleOffset
          return createBossBeam(
            idFactory(),
            'aimed',
            { x: originX, y: originY },
            resolveBeamEndPoint(originX, originY, angle),
            beamWidth,
            telegraphSeconds,
            activeSeconds,
          )
        }),
      }
    }
    case 'column-laser': {
      const spacing = attack.laneSpacing ?? 64
      return {
        bullets: [],
        beams: Array.from({ length: Math.max(1, count) }, (_, index) => {
          const laneIndex = index - (Math.max(1, count) - 1) / 2
          const x = clamp(originX + laneIndex * spacing, PLAYFIELD_LEFT + 28, PLAYFIELD_RIGHT - 28)
          return createBossBeam(
            idFactory(),
            'column',
            { x, y: PLAYFIELD_TOP + 18 },
            { x, y: PLAYFIELD_BOTTOM - 2 },
            beamWidth,
            telegraphSeconds,
            activeSeconds,
          )
        }),
      }
    }
    case 'side-fan': {
      const bullets: BulletModel[] = []
      const origins = [
        { x: PLAYFIELD_LEFT + 24, y: originY - 18 },
        { x: PLAYFIELD_RIGHT - 24, y: originY - 18 },
      ]
      for (const origin of origins) {
        const centerAngle = Math.atan2(playerPosition.y - origin.y, playerPosition.x - origin.x)
        bullets.push(
          ...createFan(
            origin.x,
            origin.y,
            centerAngle,
            count,
            spread,
            attack.bulletSpeed,
            radius,
            idFactory,
          ),
        )
      }
      return { bullets, beams: [] }
    }
    case 'meteor-rain': {
      const bullets: BulletModel[] = []
      for (let index = 0; index < Math.max(1, count); index += 1) {
        const normalized = Math.max(1, count) === 1 ? 0 : index / (Math.max(1, count) - 1)
        const x = PLAYFIELD_LEFT + 56 + normalized * (PLAYFIELD_RIGHT - PLAYFIELD_LEFT - 112)
        const angle = Math.PI / 2 + (index % 2 === 0 ? -spread : spread)
        bullets.push(
          createConfiguredBullet(
            idFactory(),
            x,
            PLAYFIELD_TOP + 12 + (index % 2) * 10,
            angle,
            attack.bulletSpeed,
            radius + 1,
          ),
        )
      }
      return { bullets, beams: [] }
    }
  }
}

export function isBossBeamDamaging(beam: BossBeamModel) {
  return beam.elapsedSeconds >= beam.telegraphSeconds && beam.elapsedSeconds < beam.telegraphSeconds + beam.activeSeconds
}

function createBossBeam(
  id: number,
  kind: BossBeamKind,
  start: Vector2,
  end: Vector2,
  width: number,
  telegraphSeconds: number,
  activeSeconds: number,
): BossBeamModel {
  return {
    id,
    kind,
    start,
    end,
    width,
    telegraphSeconds,
    activeSeconds,
    elapsedSeconds: 0,
    active: true,
  }
}

function resolveBeamEndPoint(originX: number, originY: number, angle: number): Vector2 {
  const directionX = Math.cos(angle)
  const directionY = Math.sin(angle)
  const distances: number[] = []

  if (Math.abs(directionX) > 0.0001) {
    distances.push((PLAYFIELD_LEFT - originX) / directionX, (PLAYFIELD_RIGHT - originX) / directionX)
  }
  if (Math.abs(directionY) > 0.0001) {
    distances.push((PLAYFIELD_TOP - originY) / directionY, (PLAYFIELD_BOTTOM - originY) / directionY)
  }

  const positiveDistance = distances
    .filter((distance) => distance > 0)
    .sort((left, right) => left - right)[0] ?? 0

  return {
    x: originX + directionX * positiveDistance,
    y: originY + directionY * positiveDistance,
  }
}

function createFan(
  x: number,
  y: number,
  centerAngle: number,
  count: number,
  spread: number,
  speed: number,
  radius: number,
  idFactory: () => number,
) {
  if (count <= 1) {
    return [createConfiguredBullet(idFactory(), x, y, centerAngle, speed, radius)]
  }

  return Array.from({ length: count }, (_, index) => {
    const normalized = index - (count - 1) / 2
    return createConfiguredBullet(idFactory(), x, y, centerAngle + normalized * spread, speed, radius)
  })
}

function createConfiguredBullet(
  id: number,
  x: number,
  y: number,
  angle: number,
  speed: number,
  radius: number,
  kind: BulletKind = 'pellet',
) {
  const bullet = createEnemyBullet(id, x, y, angle, speed, kind)
  bullet.radius = radius
  return bullet
}

function resolvePhaseIndex(
  pattern: BossPatternDefinition,
  enemy: EnemyModel,
  currentPhaseIndex: number,
  phaseElapsedSeconds: number,
) {
  if (enemy.maxHealth <= 0) {
    return pattern.phases.length - 1
  }

  const healthRatio = enemy.health / enemy.maxHealth
  const clampedPhaseIndex = clamp(currentPhaseIndex, 0, pattern.phases.length - 1)
  const currentPhase = pattern.phases[clampedPhaseIndex]
  const nextPhaseIndex = Math.min(clampedPhaseIndex + 1, pattern.phases.length - 1)

  if (clampedPhaseIndex === pattern.phases.length - 1) {
    return clampedPhaseIndex
  }

  if (phaseElapsedSeconds < MIN_BOSS_PHASE_SECONDS) {
    return clampedPhaseIndex
  }

  if (healthRatio < currentPhase.minHealthRatio) {
    return nextPhaseIndex
  }

  return clampedPhaseIndex
}

function createAttackTimers(
  phase: BossPatternPhaseDefinition,
  rank: GameRank,
  multiplier: number,
) {
  return phase.attacks.map((attack) => attack.intervalByRank[rank] * multiplier)
}

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t
}

function easeInOut(t: number) {
  const clamped = clamp(t, 0, 1)
  return clamped * clamped * (3 - 2 * clamped)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
