import type { InputManager } from '../core/InputManager'
import type { GameRank } from '../core/types'
import type { PlayerModel } from '../entities/Player'
import { ORB_FORCE_REPEL, type OrbVelocityXState } from '../data/resources/orbResources'

const SWING_FRAMES = 23
const SLIDE_FRAMES = 12
const FLIPKICK_FRAMES = 28
const SLIDEKICK_FRAMES = 13
const SHOTCOMBO_FRAMES = 19
const FLIPKICK_DEFLECT_END_FRAME = FLIPKICK_FRAMES
const SHOTCOMBO_DEFLECT_END_FRAME = 16
const SWING_COMBO_READY_FRAME = 20
const SLIDE_COMBO_READY_FRAME = 5
const COMBO_WINDOW_FRAMES = 10
const PLAYER_DASH_SPEED = 240
const PLAYER_SLIDE_SPEED = 360
const PLAYER_SPECIAL_DRIFT_SPEED = 120

type FacingDirection = 'left' | 'right'
type SpecialKind = 'flipkick' | 'slidekick' | 'shotcombo'

export type PlayerActionMode =
  | 'regular'
  | 'swing'
  | 'slide_left'
  | 'slide_right'
  | 'special'

export interface PlayerActionState {
  mode: PlayerActionMode
  frame: number
  deflecting: boolean
  invulnerableAgainstOrb: boolean
  comboWindowFrames: number
  comboChainStep: 0 | 1 | 2 | 3
  facing: FacingDirection
  specialKind: SpecialKind | null
  specialDirection: FacingDirection
  flipkickMovement: 'moving' | 'stationary' | null
  pendingComboDirection: FacingDirection | null
  pendingShotOffsets: number[]
}

export interface OrbRepelResponse {
  forceImmediate: number
  velocityXState: OrbVelocityXState
  snapToPlayer: boolean
}

export function createPlayerActionState(): PlayerActionState {
  return {
    mode: 'regular',
    frame: 0,
    deflecting: false,
    invulnerableAgainstOrb: false,
    comboWindowFrames: 0,
    comboChainStep: 0,
    facing: 'left',
    specialKind: null,
    specialDirection: 'left',
    flipkickMovement: null,
    pendingComboDirection: null,
    pendingShotOffsets: [],
  }
}

export function resetPlayerActionState(state: PlayerActionState) {
  state.mode = 'regular'
  state.frame = 0
  state.deflecting = false
  state.invulnerableAgainstOrb = false
  state.comboWindowFrames = 0
  state.comboChainStep = 0
  state.facing = 'left'
  state.specialKind = null
  state.specialDirection = 'left'
  state.flipkickMovement = null
  state.pendingComboDirection = null
  state.pendingShotOffsets.length = 0
}

export function updatePlayerActionState(
  state: PlayerActionState,
  input: InputManager,
  player: PlayerModel,
  rank: GameRank,
  deltaSeconds: number,
) {
  state.pendingShotOffsets.length = 0

  const movementAxis = Number(input.isDown('right')) - Number(input.isDown('left'))
  if (movementAxis > 0) {
    state.facing = 'right'
  } else if (movementAxis < 0) {
    state.facing = 'left'
  }

  if (state.mode === 'regular') {
    updateComboWindow(state, input, movementAxis)
    if (state.mode !== 'regular') {
      updateSpecialAction(state, input, player, deltaSeconds, movementAxis)
      return
    }

    if (input.consumePress('focus')) {
      if (movementAxis > 0) {
        beginSlide(state, 'slide_right')
      } else if (movementAxis < 0) {
        beginSlide(state, 'slide_left')
      } else {
        beginSwing(state)
      }
      return
    }

    player.position.x += movementAxis * PLAYER_DASH_SPEED * deltaSeconds
    return
  }

  if (state.mode === 'swing') {
    state.frame += 1
    state.deflecting = state.frame < swingDeflectionFrames(rank)
    state.invulnerableAgainstOrb = true

    if (
      state.frame >= SWING_COMBO_READY_FRAME &&
      !input.isDown('focus') &&
      !input.isDown('shoot')
    ) {
      beginComboWindow(state, state.facing, 1)
    }

    if (state.frame >= SWING_FRAMES) {
      finishActionToRegular(state)
    }
    return
  }

  if (state.mode === 'slide_left' || state.mode === 'slide_right') {
    player.position.x +=
      (state.mode === 'slide_right' ? PLAYER_SLIDE_SPEED : -PLAYER_SLIDE_SPEED) * deltaSeconds
    state.frame += 1
    state.deflecting = true
    state.invulnerableAgainstOrb = true

    if (
      state.frame >= SLIDE_COMBO_READY_FRAME &&
      !input.isDown('focus') &&
      !input.isDown('shoot')
    ) {
      beginComboWindow(state, state.mode === 'slide_right' ? 'right' : 'left', 1)
    }

    if (state.frame >= SLIDE_FRAMES) {
      finishActionToRegular(state)
    }
    return
  }

  updateSpecialAction(state, input, player, deltaSeconds, movementAxis)
}

export function resolveOrbRepelFromPlayerAction(
  state: PlayerActionState,
  playerX: number,
  orbX: number,
): OrbRepelResponse | null {
  if (!state.deflecting) {
    return null
  }

  switch (state.mode) {
    case 'swing':
      return {
        forceImmediate: ORB_FORCE_REPEL + Math.floor(state.frame / 2),
        velocityXState: resolveSwingVelocity(playerX, orbX),
        snapToPlayer: true,
      }
    case 'slide_left':
      return {
        forceImmediate: -10,
        velocityXState: '4_left',
        snapToPlayer: false,
      }
    case 'slide_right':
      return {
        forceImmediate: -10,
        velocityXState: '4_right',
        snapToPlayer: false,
      }
    case 'special':
      return resolveSpecialRepel(state, playerX, orbX)
    case 'regular':
      return null
  }
}

export function canPlayerFireShots(state: PlayerActionState) {
  return state.mode === 'regular' && state.comboWindowFrames <= 0
}

export function consumePendingPlayerShotOffsets(state: PlayerActionState) {
  const offsets = [...state.pendingShotOffsets]
  state.pendingShotOffsets.length = 0
  return offsets
}

function updateComboWindow(
  state: PlayerActionState,
  input: InputManager,
  movementAxis: number,
) {
  if (state.comboWindowFrames <= 0 || !state.pendingComboDirection) {
    clearComboWindow(state)
    return
  }

  state.comboWindowFrames -= 1

  if (input.consumePress('focus')) {
    const comboSpecial = resolveComboSpecial(state.pendingComboDirection, movementAxis)
    beginSpecial(
      state,
      comboSpecial.kind,
      comboSpecial.direction,
      nextComboStep(state.comboChainStep),
      comboSpecial.flipkickMovement,
    )
    return
  }

  if (input.consumePress('shoot')) {
    beginSpecial(
      state,
      'shotcombo',
      state.pendingComboDirection,
      nextComboStep(state.comboChainStep),
      null,
    )
    return
  }

  if (state.comboWindowFrames <= 0) {
    clearComboWindow(state)
  }
}

function updateSpecialAction(
  state: PlayerActionState,
  input: InputManager,
  player: PlayerModel,
  deltaSeconds: number,
  movementAxis: number,
) {
  if (state.mode !== 'special' || !state.specialKind) {
    return
  }

  state.frame += 1
  state.invulnerableAgainstOrb = true

  if (state.specialKind === 'slidekick') {
    player.position.x +=
      (state.specialDirection === 'right' ? PLAYER_SLIDE_SPEED : -PLAYER_SLIDE_SPEED) *
      deltaSeconds
  } else if (state.specialKind === 'flipkick' && state.flipkickMovement === 'moving') {
    player.position.x +=
      (state.specialDirection === 'right' ? PLAYER_SPECIAL_DRIFT_SPEED : -PLAYER_SPECIAL_DRIFT_SPEED) *
      deltaSeconds
  }

  if (state.specialKind === 'shotcombo') {
    queueShotcomboBurst(state)
  }

  updateSpecialDeflection(state)
  maybeOpenSpecialComboWindow(state, input)

  if (tryContinueSpecialCombo(state, input, movementAxis)) {
    return
  }

  if (state.frame > specialDuration(state.specialKind)) {
    finishActionToRegular(state)
  }
}

function queueShotcomboBurst(state: PlayerActionState) {
  const offset = shotcomboOffsetForFrame(state.frame)
  if (offset !== null) {
    state.pendingShotOffsets.push(offset)
  }
}

function updateSpecialDeflection(state: PlayerActionState) {
  switch (state.specialKind) {
    case 'flipkick':
      state.deflecting = state.frame < FLIPKICK_DEFLECT_END_FRAME
      break
    case 'slidekick':
      state.deflecting = true
      break
    case 'shotcombo':
      state.deflecting = state.frame < SHOTCOMBO_DEFLECT_END_FRAME
      break
    case null:
      state.deflecting = false
      break
  }
}

function maybeOpenSpecialComboWindow(state: PlayerActionState, input: InputManager) {
  if (state.specialKind !== 'flipkick' || state.comboChainStep >= 3) {
    clearComboWindow(state)
    return
  }

  if (state.frame < FLIPKICK_DEFLECT_END_FRAME || input.isDown('focus') || input.isDown('shoot')) {
    return
  }

  if (state.comboWindowFrames <= 0) {
    beginComboWindow(
      state,
      state.specialDirection,
      Math.max(1, state.comboChainStep) as 1 | 2 | 3,
    )
  }
}

function tryContinueSpecialCombo(
  state: PlayerActionState,
  input: InputManager,
  movementAxis: number,
) {
  if (
    state.specialKind !== 'flipkick' ||
    state.comboWindowFrames <= 0 ||
    !state.pendingComboDirection ||
    state.comboChainStep >= 3
  ) {
    return false
  }

  state.comboWindowFrames -= 1

  if (input.consumePress('focus')) {
    const comboSpecial = resolveComboSpecial(state.pendingComboDirection, movementAxis)
    beginSpecial(
      state,
      comboSpecial.kind,
      comboSpecial.direction,
      nextComboStep(state.comboChainStep),
      comboSpecial.flipkickMovement,
    )
    return true
  }

  if (input.consumePress('shoot')) {
    beginSpecial(
      state,
      'shotcombo',
      state.pendingComboDirection,
      nextComboStep(state.comboChainStep),
      null,
    )
    return true
  }

  if (state.comboWindowFrames <= 0) {
    clearComboWindow(state)
  }

  return false
}

function beginSwing(state: PlayerActionState) {
  state.mode = 'swing'
  state.frame = 0
  state.deflecting = true
  state.invulnerableAgainstOrb = true
  clearComboWindow(state)
  state.specialKind = null
}

function beginSlide(state: PlayerActionState, mode: 'slide_left' | 'slide_right') {
  state.mode = mode
  state.frame = 0
  state.deflecting = true
  state.invulnerableAgainstOrb = true
  clearComboWindow(state)
  state.specialKind = null
}

function beginSpecial(
  state: PlayerActionState,
  kind: SpecialKind,
  direction: FacingDirection,
  comboStep: 1 | 2 | 3,
  flipkickMovement: 'moving' | 'stationary' | null,
) {
  state.mode = 'special'
  state.frame = 0
  state.deflecting = kind !== 'shotcombo'
  state.invulnerableAgainstOrb = true
  state.specialKind = kind
  state.specialDirection = direction
  state.flipkickMovement = kind === 'flipkick' ? flipkickMovement ?? 'moving' : null
  clearComboWindow(state)
  state.comboChainStep = comboStep
  state.facing = direction
}

function beginComboWindow(
  state: PlayerActionState,
  direction: FacingDirection,
  comboStep: 1 | 2 | 3,
) {
  state.comboWindowFrames = COMBO_WINDOW_FRAMES
  state.comboChainStep = comboStep
  state.pendingComboDirection = direction
}

function clearComboWindow(state: PlayerActionState) {
  state.comboWindowFrames = 0
  state.comboChainStep = 0
  state.pendingComboDirection = null
}

function finishActionToRegular(state: PlayerActionState) {
  state.mode = 'regular'
  state.frame = 0
  state.deflecting = false
  state.invulnerableAgainstOrb = false
  state.specialKind = null
  state.flipkickMovement = null
  clearComboWindow(state)
}

function resolveSwingVelocity(playerX: number, orbX: number): OrbVelocityXState {
  const deltaX = playerX - orbX
  if (deltaX > 0) {
    return '4_left'
  }

  if (deltaX < 0) {
    return '4_right'
  }

  const roll = Math.floor(Math.random() * 8)
  if (roll === 0 || roll === 4) {
    return '4_left'
  }

  return '0'
}

function resolveSpecialRepel(
  state: PlayerActionState,
  playerX: number,
  orbX: number,
): OrbRepelResponse {
  switch (state.specialKind) {
    case 'flipkick':
      return {
        forceImmediate: ORB_FORCE_REPEL + Math.floor(state.frame / 4),
        velocityXState: resolveSwingVelocity(playerX, orbX),
        snapToPlayer: true,
      }
    case 'slidekick':
      return {
        forceImmediate: -10,
        velocityXState: state.specialDirection === 'right' ? '8_right' : '8_left',
        snapToPlayer: false,
      }
    case 'shotcombo':
      return {
        forceImmediate: ORB_FORCE_REPEL + Math.floor(state.frame / 2),
        velocityXState: resolveSwingVelocity(playerX, orbX),
        snapToPlayer: true,
      }
    case null:
      return {
        forceImmediate: ORB_FORCE_REPEL,
        velocityXState: resolveSwingVelocity(playerX, orbX),
        snapToPlayer: true,
      }
  }
}

function swingDeflectionFrames(rank: GameRank) {
  switch (rank) {
    case 'easy':
      return 15
    case 'normal':
      return 12
    case 'hard':
      return 10
    case 'lunatic':
      return 8
  }
}

function nextComboStep(step: 0 | 1 | 2 | 3): 1 | 2 | 3 {
  if (step <= 0) {
    return 1
  }

  if (step === 1) {
    return 2
  }

  return 3
}

function specialDuration(kind: SpecialKind) {
  switch (kind) {
    case 'flipkick':
      return FLIPKICK_FRAMES
    case 'slidekick':
      return SLIDEKICK_FRAMES
    case 'shotcombo':
      return SHOTCOMBO_FRAMES
  }
}

function resolveComboSpecial(
  comboDirection: FacingDirection,
  movementAxis: number,
): {
  kind: 'flipkick' | 'slidekick'
  direction: FacingDirection
  flipkickMovement: 'moving' | 'stationary' | null
} {
  if (movementAxis === 0) {
    return {
      kind: 'flipkick',
      direction: comboDirection,
      flipkickMovement: 'moving',
    }
  }

  const inputDirection: FacingDirection = movementAxis > 0 ? 'right' : 'left'
  if (inputDirection === comboDirection) {
    return {
      kind: 'slidekick',
      direction: inputDirection,
      flipkickMovement: null,
    }
  }

  return {
    kind: 'flipkick',
    direction: comboDirection,
    flipkickMovement: 'stationary',
  }
}

function shotcomboOffsetForFrame(frame: number) {
  switch (frame) {
    case 1:
      return -8
    case 4:
      return 8
    case 7:
      return 0
    case 10:
      return -16
    case 13:
      return 0
    case 16:
      return 16
    case 19:
      return 0
    default:
      return null
  }
}
