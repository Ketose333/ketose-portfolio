import type { Vector2 } from '../core/types'

export type BulletOwner = 'player' | 'enemy'
export type BulletKind = 'player-shot' | 'pellet' | 'missile'

export interface BulletModel {
  id: number
  owner: BulletOwner
  kind: BulletKind
  position: Vector2
  velocity: Vector2
  radius: number
  damage: number
  active: boolean
}

export function createPlayerBullet(id: number, x: number, y: number, drift = 0): BulletModel {
  return {
    id,
    owner: 'player',
    kind: 'player-shot',
    position: { x, y },
    velocity: { x: drift, y: -720 },
    radius: 4,
    damage: 1,
    active: true,
  }
}

export function createEnemyBullet(
  id: number,
  x: number,
  y: number,
  angle: number,
  speed: number,
  kind: BulletKind = 'pellet',
): BulletModel {
  return {
    id,
    owner: 'enemy',
    kind,
    position: { x, y },
    velocity: {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    },
    radius: 8,
    damage: 1,
    active: true,
  }
}
