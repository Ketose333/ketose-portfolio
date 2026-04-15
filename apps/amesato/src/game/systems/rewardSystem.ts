import type { Vector2 } from '../core/types'

export type RewardPickupType = 'point' | 'bomb'

export interface RewardPickup {
  id: number
  type: RewardPickupType
  position: Vector2
  velocity: Vector2
  state: 'splash' | 'fall' | 'bounce'
  splashRadius: number
  active: boolean
}

export interface CardRewardState {
  flipCycle: number
}

export const CARD_FLIP_CYCLE_MAX = 140
export const MAX_BOMBS = 5
export const POINT_VALUE_CAP = 65530

const POINT_PICKUP_SPEED_Y = 40
const PICKUP_GRAVITY = 460
const PICKUP_DRIFT_SPEED = 18
const PICKUP_COLLECT_DISTANCE = 20
const PICKUP_SPLASH_RADIUS_START = 4
const PICKUP_SPLASH_RADIUS_MAX = 40
const PICKUP_BOUNCE_VELOCITY = -120

export function createCardRewardState(seed = 0): CardRewardState {
  return {
    flipCycle: normalizeInitialFlipCycle(seed),
  }
}

export function resetCardRewardState(state: CardRewardState, seed = 0) {
  state.flipCycle = normalizeInitialFlipCycle(seed)
}

export function resolveCardRewardPickupType(state: CardRewardState): RewardPickupType | null {
  state.flipCycle += 1

  if (state.flipCycle % 10 !== 0) {
    return null
  }

  if (state.flipCycle >= CARD_FLIP_CYCLE_MAX) {
    state.flipCycle = 0
    return 'bomb'
  }

  return 'point'
}

export function normalizeCardRewardPickupType(
  pickupType: RewardPickupType | null,
  forcePointReward: boolean,
) {
  if (!pickupType) {
    return null
  }

  if (pickupType === 'bomb' && forcePointReward) {
    return 'point'
  }

  return pickupType
}

export function createRewardPickup(
  id: number,
  type: RewardPickupType,
  x: number,
  y: number,
): RewardPickup {
  const driftDirection = id % 2 === 0 ? -1 : 1

  return {
    id,
    type,
    position: { x, y },
    velocity: {
      x: driftDirection * PICKUP_DRIFT_SPEED,
      y: -POINT_PICKUP_SPEED_Y,
    },
    state: 'splash',
    splashRadius: PICKUP_SPLASH_RADIUS_START,
    active: true,
  }
}

export function updateRewardPickups(pickups: RewardPickup[], deltaSeconds: number, floorY: number) {
  for (const pickup of pickups) {
    if (!pickup.active) {
      continue
    }

    if (pickup.state === 'splash') {
      pickup.splashRadius += 140 * deltaSeconds
      if (pickup.splashRadius >= PICKUP_SPLASH_RADIUS_MAX) {
        pickup.state = 'fall'
      }
      continue
    }

    pickup.position.x += pickup.velocity.x * deltaSeconds
    pickup.position.y += pickup.velocity.y * deltaSeconds
    pickup.velocity.y += PICKUP_GRAVITY * deltaSeconds

    if (pickup.position.y >= floorY) {
      if (pickup.state === 'fall') {
        pickup.position.y = floorY
        pickup.velocity.y = PICKUP_BOUNCE_VELOCITY
        pickup.state = 'bounce'
      } else {
        pickup.active = false
      }
    }
  }
}

export function collectRewardPickups(pickups: RewardPickup[], playerPosition: Vector2) {
  const collected: RewardPickupType[] = []

  for (const pickup of pickups) {
    if (!pickup.active) {
      continue
    }

    const deltaX = pickup.position.x - playerPosition.x
    const deltaY = pickup.position.y - playerPosition.y

    if (pickup.state === 'splash' || Math.hypot(deltaX, deltaY) > PICKUP_COLLECT_DISTANCE) {
      continue
    }

    pickup.active = false
    collected.push(pickup.type)
  }

  return collected
}

export function isRewardPickupActive(pickup: RewardPickup) {
  return pickup.active && (pickup.state === 'splash' || pickup.position.y < 440)
}

export function resolvePointPickupValue(pointValue: number) {
  let nextValue = Math.max(0, pointValue)

  if (nextValue < 59999) {
    nextValue += nextValue < 10000 ? 1000 : 10000
  }

  if (nextValue >= 60000) {
    nextValue = POINT_VALUE_CAP
  }

  return nextValue
}

function normalizeInitialFlipCycle(seed: number) {
  return Math.min(CARD_FLIP_CYCLE_MAX, Math.max(0, Math.floor(Math.abs(seed))))
}
