import type { StageMode } from '../core/types'
import type { InputManager } from '../core/InputManager'

export interface StageStartState {
  awaitingShot: boolean
}

export function createStageStartState(): StageStartState {
  return {
    awaitingShot: false,
  }
}

export function prepareStageStartState(state: StageStartState, shouldAwait: boolean) {
  state.awaitingShot = shouldAwait
}

export function resolveStageShouldAwaitStart(
  stageMode: StageMode,
  stageNumber: number,
  isInitialLoad: boolean,
) {
  if (stageMode !== 'arcade') {
    return isInitialLoad
  }

  if (isInitialLoad) {
    return true
  }

  return stageNumber === 6
}

export function consumeStageStart(state: StageStartState, input: InputManager) {
  if (!state.awaitingShot) {
    return false
  }

  if (!input.consumePress('shoot')) {
    return false
  }

  state.awaitingShot = false
  return true
}
