export interface BombState {
  active: boolean
  damaging: boolean
  frame: number
}

export const BOMB_TOTAL_FRAMES = 140
export const BOMB_DAMAGE_START_FRAME = 50
export const BOMB_DAMAGE_END_FRAME = 126
export const BOMB_PULSE_INTERVAL_FRAMES = 8
export const BOMB_ACTIVE_SECONDS = BOMB_TOTAL_FRAMES / 60

export function createBombState(): BombState {
  return {
    active: false,
    damaging: false,
    frame: 0,
  }
}

export function resetBombState(state: BombState) {
  state.active = false
  state.damaging = false
  state.frame = 0
}

export function triggerBomb(state: BombState) {
  state.active = true
  state.damaging = false
  state.frame = 0
}

export function updateBombState(state: BombState, deltaSeconds: number) {
  if (!state.active) {
    return 0
  }

  const previousFrame = Math.floor(state.frame)
  state.frame += deltaSeconds * 60
  const currentFrame = Math.floor(state.frame)

  let pulses = 0
  for (let frame = previousFrame + 1; frame <= currentFrame; frame += 1) {
    if (frame >= BOMB_DAMAGE_START_FRAME && frame < BOMB_DAMAGE_END_FRAME) {
      state.damaging = true

      if ((frame - BOMB_DAMAGE_START_FRAME) % BOMB_PULSE_INTERVAL_FRAMES === 0) {
        pulses += 1
      }
      continue
    }

    if (frame >= BOMB_DAMAGE_END_FRAME) {
      state.damaging = false
    }
  }

  if (state.frame >= BOMB_TOTAL_FRAMES) {
    state.active = false
    state.damaging = false
    state.frame = 0
  }

  return pulses
}
