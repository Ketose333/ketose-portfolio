(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // ../../audio/AudioManager.ts
  var AudioManager = class {
    constructor(bgmManifest, sfxManifest) {
      __publicField(this, "bgm", null);
      __publicField(this, "currentTrack", null);
      __publicField(this, "bgmEnabled", true);
      __publicField(this, "unlocked", false);
      __publicField(this, "masterVolume", 0.8);
      __publicField(this, "listenersAttached", false);
      __publicField(this, "fadeFrame", null);
      __publicField(this, "sfxBank", /* @__PURE__ */ new Map());
      __publicField(this, "bgmManifest");
      __publicField(this, "sfxManifest");
      this.bgmManifest = bgmManifest;
      this.sfxManifest = sfxManifest;
      this.primeSfxBank();
      this.attachUnlockListeners();
    }
    setMasterVolume(nextVolume) {
      this.masterVolume = clamp(nextVolume, 0, 1);
      if (this.bgm) {
        this.bgm.volume = this.masterVolume;
      }
    }
    setBgmEnabled(nextEnabled) {
      this.bgmEnabled = nextEnabled;
      if (!this.bgm) {
        return;
      }
      if (!nextEnabled) {
        this.bgm.pause();
        this.bgm.currentTime = 0;
        return;
      }
      if (this.unlocked) {
        void this.bgm.play().catch(() => void 0);
      }
    }
    playBgm(trackId) {
      this.cancelFade();
      if (this.currentTrack === trackId && this.bgm) {
        if (this.bgmEnabled && this.unlocked && this.bgm.paused) {
          void this.bgm.play().catch(() => void 0);
        }
        return;
      }
      if (this.bgm) {
        this.bgm.pause();
        this.bgm.currentTime = 0;
      }
      const nextBgm = new Audio(this.bgmManifest[trackId]);
      nextBgm.loop = true;
      nextBgm.preload = "auto";
      nextBgm.volume = this.masterVolume;
      this.currentTrack = trackId;
      this.bgm = nextBgm;
      if (this.bgmEnabled && this.unlocked) {
        void nextBgm.play().catch(() => void 0);
      }
    }
    stopBgm(fadeOutMs = 0) {
      if (!this.bgm) {
        return;
      }
      this.cancelFade();
      if (fadeOutMs > 0) {
        const bgm = this.bgm;
        const startVolume = bgm.volume;
        const start = performance.now();
        const step = (now) => {
          if (!this.bgm || this.bgm !== bgm) {
            this.fadeFrame = null;
            return;
          }
          const progress = clamp((now - start) / fadeOutMs, 0, 1);
          bgm.volume = startVolume * (1 - progress);
          if (progress >= 1) {
            bgm.pause();
            bgm.currentTime = 0;
            bgm.volume = this.masterVolume;
            if (this.bgm === bgm) {
              this.bgm = null;
              this.currentTrack = null;
            }
            this.fadeFrame = null;
            return;
          }
          this.fadeFrame = requestAnimationFrame(step);
        };
        this.fadeFrame = requestAnimationFrame(step);
        return;
      }
      this.bgm.pause();
      this.bgm.currentTime = 0;
      this.bgm = null;
      this.currentTrack = null;
    }
    playSfx(id) {
      if (!this.unlocked) {
        return;
      }
      const base = this.sfxBank.get(id);
      if (!base) {
        return;
      }
      const sfx = base.cloneNode(true);
      sfx.volume = this.masterVolume;
      void sfx.play().catch(() => void 0);
    }
    primeSfxBank() {
      if (typeof Audio === "undefined") {
        return;
      }
      for (const [id, url] of Object.entries(this.sfxManifest)) {
        if (!url) {
          continue;
        }
        const audio = new Audio(url);
        audio.preload = "auto";
        this.sfxBank.set(id, audio);
      }
    }
    attachUnlockListeners() {
      if (typeof window === "undefined" || this.listenersAttached) {
        return;
      }
      this.listenersAttached = true;
      const unlock = () => {
        this.unlocked = true;
        if (this.bgm && this.bgmEnabled) {
          void this.bgm.play().catch(() => void 0);
        }
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
      };
      window.addEventListener("pointerdown", unlock, { passive: true, once: true });
      window.addEventListener("keydown", unlock, { once: true });
    }
    cancelFade() {
      if (this.fadeFrame !== null) {
        cancelAnimationFrame(this.fadeFrame);
        this.fadeFrame = null;
      }
      if (this.bgm) {
        this.bgm.volume = this.masterVolume;
      }
    }
  };
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  // ../../audio/staticManifest.ts
  function resolveStaticAsset(path) {
    return path;
  }
  function resolveOptionalStaticAsset(path) {
    return path;
  }

  // src/client/audio/manifest.ts
  var nulsightBgmManifest = {
    title: resolveStaticAsset("/audio/bgm/title.ogg"),
    lobby: resolveStaticAsset("/audio/bgm/lobby.ogg"),
    game: resolveStaticAsset("/audio/bgm/game.ogg"),
    guide: resolveStaticAsset("/audio/bgm/guide.ogg"),
    deck: resolveStaticAsset("/audio/bgm/deck.ogg"),
    deckHub: resolveStaticAsset("/audio/bgm/deck-hub.ogg")
  };
  var nulsightSfxManifest = {
    click: resolveOptionalStaticAsset("/audio/sfx/click.ogg"),
    confirm: resolveOptionalStaticAsset("/audio/sfx/confirm.ogg"),
    draw: resolveOptionalStaticAsset("/audio/sfx/draw.ogg"),
    summon: resolveOptionalStaticAsset("/audio/sfx/summon.ogg"),
    attack: resolveOptionalStaticAsset("/audio/sfx/attack.ogg"),
    damage: resolveOptionalStaticAsset("/audio/sfx/damage.ogg")
  };

  // src/client/audio/runtime.ts
  function createNulsightAudio() {
    return new AudioManager(nulsightBgmManifest, nulsightSfxManifest);
  }
  if (typeof window !== "undefined") {
    window.createNulsightAudio = createNulsightAudio;
  }
})();
