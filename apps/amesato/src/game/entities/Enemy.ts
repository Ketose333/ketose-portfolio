import {
  ENEMY_MAX_HEALTH,
  ENEMY_RADIUS,
  ENEMY_SHOT_INTERVAL,
  PLAYFIELD_CENTER_X,
  PLAYFIELD_TOP,
} from '../data/config/gameConfig'
import type { Vector2 } from '../core/types'

export interface EnemyModel {
  position: Vector2
  radius: number
  health: number
  maxHealth: number
  fireCooldown: number
  spawnCooldown: number
  patternTime: number
  active: boolean
}

const spawnPoint = (): Vector2 => ({
  x: PLAYFIELD_CENTER_X,
  y: PLAYFIELD_TOP + 58,
})

export function createEnemy(): EnemyModel {
  return {
    position: spawnPoint(),
    radius: ENEMY_RADIUS,
    health: ENEMY_MAX_HEALTH,
    maxHealth: ENEMY_MAX_HEALTH,
    fireCooldown: ENEMY_SHOT_INTERVAL,
    spawnCooldown: 0,
    patternTime: 0,
    active: true,
  }
}

export function reviveEnemy(enemy: EnemyModel) {
  enemy.position = spawnPoint()
  enemy.health = enemy.maxHealth
  enemy.fireCooldown = ENEMY_SHOT_INTERVAL * 0.75
  enemy.spawnCooldown = 0
  enemy.patternTime = 0
  enemy.active = true
}
