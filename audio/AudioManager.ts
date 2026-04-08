export type AudioManifest<TId extends string> = Record<TId, string>
export type OptionalAudioManifest<TId extends string> = Record<TId, string | null>

export class AudioManager<TBgmId extends string, TSfxId extends string> {
  private bgm: HTMLAudioElement | null = null
  private currentTrack: TBgmId | null = null
  private bgmEnabled = true
  private unlocked = false
  private masterVolume = 0.8
  private listenersAttached = false
  private fadeFrame: number | null = null
  private readonly sfxBank = new Map<TSfxId, HTMLAudioElement>()
  private readonly bgmManifest: AudioManifest<TBgmId>
  private readonly sfxManifest: OptionalAudioManifest<TSfxId>

  constructor(bgmManifest: AudioManifest<TBgmId>, sfxManifest: OptionalAudioManifest<TSfxId>) {
    this.bgmManifest = bgmManifest
    this.sfxManifest = sfxManifest
    this.primeSfxBank()
    this.attachUnlockListeners()
  }

  setMasterVolume(nextVolume: number) {
    this.masterVolume = clamp(nextVolume, 0, 1)
    if (this.bgm) {
      this.bgm.volume = this.masterVolume
    }
  }

  setBgmEnabled(nextEnabled: boolean) {
    this.bgmEnabled = nextEnabled

    if (!this.bgm) {
      return
    }

    if (!nextEnabled) {
      this.bgm.pause()
      this.bgm.currentTime = 0
      return
    }

    if (this.unlocked) {
      void this.bgm.play().catch(() => undefined)
    }
  }

  playBgm(trackId: TBgmId) {
    this.cancelFade()

    if (this.currentTrack === trackId && this.bgm) {
      if (this.bgmEnabled && this.unlocked && this.bgm.paused) {
        void this.bgm.play().catch(() => undefined)
      }
      return
    }

    if (this.bgm) {
      this.bgm.pause()
      this.bgm.currentTime = 0
    }

    const nextBgm = new Audio(this.bgmManifest[trackId])
    nextBgm.loop = true
    nextBgm.preload = 'auto'
    nextBgm.volume = this.masterVolume

    this.currentTrack = trackId
    this.bgm = nextBgm

    if (this.bgmEnabled && this.unlocked) {
      void nextBgm.play().catch(() => undefined)
    }
  }

  stopBgm(fadeOutMs = 0) {
    if (!this.bgm) {
      return
    }

    this.cancelFade()

    if (fadeOutMs > 0) {
      const bgm = this.bgm
      const startVolume = bgm.volume
      const start = performance.now()

      const step = (now: number) => {
        if (!this.bgm || this.bgm !== bgm) {
          this.fadeFrame = null
          return
        }

        const progress = clamp((now - start) / fadeOutMs, 0, 1)
        bgm.volume = startVolume * (1 - progress)

        if (progress >= 1) {
          bgm.pause()
          bgm.currentTime = 0
          bgm.volume = this.masterVolume
          if (this.bgm === bgm) {
            this.bgm = null
            this.currentTrack = null
          }
          this.fadeFrame = null
          return
        }

        this.fadeFrame = requestAnimationFrame(step)
      }

      this.fadeFrame = requestAnimationFrame(step)
      return
    }

    this.bgm.pause()
    this.bgm.currentTime = 0
    this.bgm = null
    this.currentTrack = null
  }

  playSfx(id: TSfxId) {
    if (!this.unlocked) {
      return
    }

    const base = this.sfxBank.get(id)
    if (!base) {
      return
    }

    const sfx = base.cloneNode(true) as HTMLAudioElement
    sfx.volume = this.masterVolume
    void sfx.play().catch(() => undefined)
  }

  private primeSfxBank() {
    if (typeof Audio === 'undefined') {
      return
    }

    for (const [id, url] of Object.entries(this.sfxManifest) as Array<[TSfxId, string | null]>) {
      if (!url) {
        continue
      }
      const audio = new Audio(url)
      audio.preload = 'auto'
      this.sfxBank.set(id, audio)
    }
  }

  private attachUnlockListeners() {
    if (typeof window === 'undefined' || this.listenersAttached) {
      return
    }

    this.listenersAttached = true
    const unlock = () => {
      this.unlocked = true
      if (this.bgm && this.bgmEnabled) {
        void this.bgm.play().catch(() => undefined)
      }

      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }

    window.addEventListener('pointerdown', unlock, { passive: true, once: true })
    window.addEventListener('keydown', unlock, { once: true })
  }

  private cancelFade() {
    if (this.fadeFrame !== null) {
      cancelAnimationFrame(this.fadeFrame)
      this.fadeFrame = null
    }

    if (this.bgm) {
      this.bgm.volume = this.masterVolume
    }
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
