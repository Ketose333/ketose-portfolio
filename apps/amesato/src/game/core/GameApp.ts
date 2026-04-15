import { Application } from 'pixi.js'
import { FIXED_TIMESTEP_MS, GAME_HEIGHT, GAME_WIDTH } from '../data/config/gameConfig'
import { StageScene } from '../scenes/StageScene'
import { AssetLoader } from './AssetLoader'
import { GameLoop } from './GameLoop'
import { InputManager } from './InputManager'
import { SceneManager } from './SceneManager'
import type { GameHudSnapshot, GameStatus } from '../ui/GameHudSnapshot'
import type { GameRank, GameRoute, StageMode } from './types'

interface GameAppOptions {
  initialSnapshot?: GameHudSnapshot | null
  rank: GameRank
  route: GameRoute
  stageMode: StageMode
  startLives: number
  onSnapshot: (snapshot: GameHudSnapshot) => void
  onStatusChange: (status: GameStatus, message?: string) => void
  onReturnToTitle: (resetSession?: boolean) => void
  shouldPromptScoreEntry: () => boolean
  getRecordedHighScore: () => number
  shouldShowHitboxes: () => boolean
}

export class GameApp {
  private app: Application | null = null
  private input: InputManager | null = null
  private loop: GameLoop | null = null
  private sceneManager = new SceneManager()
  private readonly assets = new AssetLoader()
  private readonly options: GameAppOptions

  constructor(options: GameAppOptions) {
    this.options = options
  }

  async mount(host: HTMLElement) {
    if (this.app) {
      return
    }

    await this.assets.preload()

    const app = new Application()
    await app.init({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x050816,
      antialias: true,
      autoDensity: true,
      preference: 'webgl',
      powerPreference: 'high-performance',
      resolution: window.devicePixelRatio || 1,
    })

    app.canvas.style.width = '100%'
    app.canvas.style.height = '100%'
    app.canvas.style.display = 'block'

    host.replaceChildren(app.canvas)

    this.app = app
    this.input = new InputManager()

    const stageScene = new StageScene(app.stage, {
      initialSnapshot: this.options.initialSnapshot ?? null,
      input: this.input,
      rank: this.options.rank,
      route: this.options.route,
      stageMode: this.options.stageMode,
      startLives: this.options.startLives,
      onSnapshot: this.options.onSnapshot,
      onStatusChange: this.options.onStatusChange,
      onReturnToTitle: this.options.onReturnToTitle,
      shouldPromptScoreEntry: this.options.shouldPromptScoreEntry,
      getRecordedHighScore: this.options.getRecordedHighScore,
      shouldShowHitboxes: this.options.shouldShowHitboxes,
    })

    this.sceneManager.setScene(stageScene)
    this.loop = new GameLoop(FIXED_TIMESTEP_MS, (deltaSeconds) =>
      this.sceneManager.update(deltaSeconds),
    )
    this.loop.start()
  }

  async destroy() {
    this.loop?.stop()
    this.loop = null

    this.sceneManager.destroy()
    this.input?.destroy()
    this.input = null

    this.app?.destroy(true, { children: true })
    this.app = null
  }
}
