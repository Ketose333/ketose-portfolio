interface Scene {
  update: (deltaSeconds: number) => void
  destroy?: () => void
}

export class SceneManager {
  private currentScene: Scene | null = null

  setScene(scene: Scene) {
    this.currentScene?.destroy?.()
    this.currentScene = scene
  }

  update(deltaSeconds: number) {
    this.currentScene?.update(deltaSeconds)
  }

  destroy() {
    this.currentScene?.destroy?.()
    this.currentScene = null
  }
}
