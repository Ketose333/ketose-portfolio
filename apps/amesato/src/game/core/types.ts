export interface Vector2 {
  x: number
  y: number
}

export interface CircleCollider {
  position: Vector2
  radius: number
}

export type GameRank = 'easy' | 'normal' | 'hard' | 'lunatic'

export const routeKeys = ['route-a', 'route-b'] as const

export type GameRoute = (typeof routeKeys)[number]

export type StageMode = 'arcade' | 'basic' | 'boss'

export type CampaignStageNumber =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20

export type InputAction =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'shoot'
  | 'bomb'
  | 'focus'
  | 'pause'
  | 'restart'
