import type { InputAction } from './types'

const actionBindings: Record<InputAction, string[]> = {
  up: ['ArrowUp'],
  down: ['ArrowDown'],
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
  shoot: ['KeyZ', 'Space'],
  bomb: [],
  focus: ['KeyX'],
  pause: ['Escape'],
  restart: ['KeyR'],
}

const BOMB_DOUBLETAP_WINDOW_MS = 320

export class InputManager {
  private activeCodes = new Set<string>()
  private pressedActions = new Set<InputAction>()
  private bombWindowStartedAt = 0
  private bombShotTapCount = 0
  private bombFocusTapCount = 0

  constructor() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onBlur)
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    this.activeCodes.clear()
    this.pressedActions.clear()
    this.resetBombDoubleTap()
  }

  isDown(action: InputAction) {
    return actionBindings[action].some((code) => this.activeCodes.has(code))
  }

  consumePress(action: InputAction) {
    if (!this.pressedActions.has(action)) {
      return false
    }

    this.pressedActions.delete(action)
    return true
  }

  clearBufferedPresses() {
    this.pressedActions.clear()
    this.resetBombDoubleTap()
  }

  movementAxis() {
    const x = Number(this.isDown('right')) - Number(this.isDown('left'))
    const y = Number(this.isDown('down')) - Number(this.isDown('up'))

    return { x, y }
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (shouldCaptureKeyboard(event)) {
      event.preventDefault()
    }

    const wasAlreadyHeld = this.activeCodes.has(event.code)
    this.activeCodes.add(event.code)

    if (!wasAlreadyHeld) {
      for (const [action, codes] of Object.entries(actionBindings) as [InputAction, string[]][]) {
        if (codes.includes(event.code)) {
          this.pressedActions.add(action)
        }
      }

      if (actionBindings.shoot.includes(event.code)) {
        this.updateBombDoubleTap('shoot')
        if (this.activeCodes.has('ArrowLeft') && this.activeCodes.has('ArrowRight')) {
          this.pressedActions.add('bomb')
          this.resetBombDoubleTap()
        }
      } else if (actionBindings.focus.includes(event.code)) {
        this.updateBombDoubleTap('focus')
      }
    }
  }

  private onKeyUp = (event: KeyboardEvent) => {
    if (shouldCaptureKeyboard(event)) {
      event.preventDefault()
    }

    this.activeCodes.delete(event.code)
  }

  private onBlur = () => {
    this.activeCodes.clear()
    this.pressedActions.clear()
    this.resetBombDoubleTap()
  }

  private updateBombDoubleTap(kind: 'shoot' | 'focus') {
    const now = performance.now()
    if (now - this.bombWindowStartedAt > BOMB_DOUBLETAP_WINDOW_MS) {
      this.bombWindowStartedAt = now
      this.bombShotTapCount = 0
      this.bombFocusTapCount = 0
    }

    if (kind === 'shoot') {
      this.bombShotTapCount += 1
    } else {
      this.bombFocusTapCount += 1
    }

    if (this.bombShotTapCount >= 2 && this.bombFocusTapCount >= 2) {
      this.pressedActions.add('bomb')
      this.resetBombDoubleTap()
    }
  }

  private resetBombDoubleTap() {
    this.bombWindowStartedAt = 0
    this.bombShotTapCount = 0
    this.bombFocusTapCount = 0
  }
}

function shouldCaptureKeyboard(event: KeyboardEvent) {
  const target = event.target

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  ) {
    return false
  }

  return Object.values(actionBindings).some((codes) => codes.includes(event.code))
}
