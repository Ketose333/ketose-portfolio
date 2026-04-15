import {
  PLAYER_HEIGHT,
  PLAYER_FOCUS_SPEED,
  PLAYER_HITBOX_RADIUS,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  PLAYFIELD_BOTTOM,
  PLAYFIELD_CENTER_X,
} from '../data/config/gameConfig'
import type { Vector2 } from '../core/types'

export interface PlayerModel {
  position: Vector2
  radius: number
  hitboxRadius: number
  speed: number
  focusSpeed: number
  shotCooldown: number
  invulnerability: number
}

const spawnPoint = (): Vector2 => ({
  x: PLAYFIELD_CENTER_X,
  y: PLAYFIELD_BOTTOM - PLAYER_HEIGHT / 2,
})

export function createPlayer(): PlayerModel {
  return {
    position: spawnPoint(),
    radius: PLAYER_RADIUS,
    hitboxRadius: PLAYER_HITBOX_RADIUS,
    speed: PLAYER_SPEED,
    focusSpeed: PLAYER_FOCUS_SPEED,
    shotCooldown: 0,
    invulnerability: 0,
  }
}

export function resetPlayer(player: PlayerModel) {
  player.position = spawnPoint()
  player.shotCooldown = 0
  player.invulnerability = 0
}
