export class GameLoop {
  private accumulator = 0
  private lastFrameTime = 0
  private rafId: number | null = null
  private readonly stepMs: number
  private readonly update: (deltaSeconds: number) => void

  constructor(stepMs: number, update: (deltaSeconds: number) => void) {
    this.stepMs = stepMs
    this.update = update
  }

  start() {
    if (this.rafId !== null) {
      return
    }

    this.accumulator = 0
    this.lastFrameTime = 0
    this.rafId = window.requestAnimationFrame(this.frame)
  }

  stop() {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private frame = (timestamp: number) => {
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = timestamp
    }

    const deltaMs = Math.min(timestamp - this.lastFrameTime, 250)
    this.lastFrameTime = timestamp
    this.accumulator += deltaMs

    while (this.accumulator >= this.stepMs) {
      this.update(this.stepMs / 1000)
      this.accumulator -= this.stepMs
    }

    this.rafId = window.requestAnimationFrame(this.frame)
  }
}
