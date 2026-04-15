export type OrbVelocityXState = '0' | '4_left' | '4_right' | '8_left' | '8_right'

export interface OrbRepelProfile {
  id: string
  forceImmediate: number
  centerBias: OrbVelocityXState
  centeredLeftBiasChance: number
}

export interface OrbContactProfile {
  bodyHalfWidth: number
  bodyHalfHeight: number
  repelHalfWidth: number
  repelHalfHeight: number
}

export const orbVelocityXPixels: Record<OrbVelocityXState, number> = {
  '0': 0,
  '4_left': -4,
  '4_right': 4,
  '8_left': -8,
  '8_right': 8,
}

export const ORB_FORCE_START = -8
export const ORB_FORCE_REPEL = -13
export const ORB_FORCE_SHOT_BASE = -10
export const ORB_FORCE_TOP_DIVISOR = 4
export const ORB_GRAVITY_FRAME_DIVISOR = 5
export const ORB_TERMINAL_VELOCITY = 16
export const ORB_VELOCITY_X_START: OrbVelocityXState = '4_left'
export const ORB_BOUNCE_RANDOMIZED_X_THRESHOLD = 17
export const SHOT_COUNT_MAX = 8

export const orbRepelProfiles: Record<'guard', OrbRepelProfile> = {
  guard: {
    id: 'guard',
    forceImmediate: ORB_FORCE_REPEL + 1,
    centerBias: '0',
    centeredLeftBiasChance: 15 / 64,
  },
}

export const orbContactProfiles: Record<'default', OrbContactProfile> = {
  default: {
    bodyHalfWidth: 24,
    bodyHalfHeight: 16,
    repelHalfWidth: 40,
    repelHalfHeight: 32,
  },
}

export function reflectOrbVelocityX(velocityX: OrbVelocityXState): OrbVelocityXState {
  switch (velocityX) {
    case '4_left':
      return '4_right'
    case '4_right':
      return '4_left'
    case '8_left':
      return '8_right'
    case '8_right':
      return '8_left'
    case '0':
      return '0'
  }
}

export function resolveShotVelocityX(deltaX: number): OrbVelocityXState {
  if (deltaX > 2) {
    return '4_left'
  }

  if (deltaX >= -2) {
    return '0'
  }

  return '4_right'
}

export function resolveRepelVelocityX(
  deltaX: number,
  centerBias: OrbVelocityXState,
  centeredLeftBiasChance = 0,
): OrbVelocityXState {
  if (deltaX > 0) {
    return '4_left'
  }

  if (deltaX < 0) {
    return '4_right'
  }

  if (centeredLeftBiasChance > 0 && Math.random() < centeredLeftBiasChance) {
    return '4_left'
  }

  return centerBias
}
