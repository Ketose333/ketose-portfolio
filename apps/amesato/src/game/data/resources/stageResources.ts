import type { GameRank } from '../../core/types'

export type StageObstacleType =
  | 'bumper'
  | 'bar_top'
  | 'bar_bottom'
  | 'bar_left'
  | 'bar_right'
  | 'portal'
  | 'turret_slow'
  | 'turret_quick'

export type StageTurretPattern = 'aimed' | 'spread3'

export interface StageObstacleResource {
  id: string
  type: StageObstacleType
  x: number
  y: number
  width: number
  height: number
  minRank?: GameRank
  collisionCooldownFrames?: number
  fireIntervalFrames?: number
  turretPattern?: StageTurretPattern
  linkId?: string
}

export interface StageCardResource {
  id: string
  x: number
  y: number
  flips: number
  scoreBase: number
}

export interface BossRankProfile {
  targetHealth: number
  bossHealth: number
  bossWaveSpeed: number
  bossDriftHeight: number
}

interface ObstacleResourceOptions {
  minRank?: GameRank
  collisionCooldownFrames?: number
  fireIntervalFrames?: number
  turretPattern?: StageTurretPattern
  linkId?: string
}

export const sharedBossRankProfiles: Record<GameRank, BossRankProfile> = {
  easy: { targetHealth: 3, bossHealth: 18, bossWaveSpeed: 0.44, bossDriftHeight: 8 },
  normal: { targetHealth: 4, bossHealth: 22, bossWaveSpeed: 0.5, bossDriftHeight: 10 },
  hard: { targetHealth: 5, bossHealth: 27, bossWaveSpeed: 0.58, bossDriftHeight: 12 },
  lunatic: { targetHealth: 6, bossHealth: 33, bossWaveSpeed: 0.68, bossDriftHeight: 15 },
}

export const finalBossRankProfiles: Record<GameRank, BossRankProfile> = {
  easy: { targetHealth: 4, bossHealth: 24, bossWaveSpeed: 0.48, bossDriftHeight: 10 },
  normal: { targetHealth: 5, bossHealth: 30, bossWaveSpeed: 0.56, bossDriftHeight: 13 },
  hard: { targetHealth: 6, bossHealth: 36, bossWaveSpeed: 0.66, bossDriftHeight: 17 },
  lunatic: { targetHealth: 7, bossHealth: 44, bossWaveSpeed: 0.78, bossDriftHeight: 21 },
}

export function createStageCardResource(
  id: string,
  x: number,
  y: number,
  flips: number,
  scoreBase: number,
): StageCardResource {
  return { id, x, y, flips, scoreBase }
}

export function createStageObstacleResource(
  id: string,
  type: StageObstacleType,
  x: number,
  y: number,
  width: number,
  height: number,
  options: ObstacleResourceOptions = {},
): StageObstacleResource {
  return {
    id,
    type,
    x,
    y,
    width,
    height,
    minRank: options.minRank,
    collisionCooldownFrames: options.collisionCooldownFrames,
    fireIntervalFrames: options.fireIntervalFrames,
    turretPattern: options.turretPattern,
    linkId: options.linkId,
  }
}
