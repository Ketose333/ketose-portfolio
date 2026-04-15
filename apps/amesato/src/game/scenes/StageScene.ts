import { Assets, Container, Graphics, Sprite, Text, Texture, TilingSprite } from 'pixi.js'
import itemBombSvgUrl from '../../assets/images/item-bomb.svg'
import itemPointSvgUrl from '../../assets/images/item-point.svg'
import {
  ENEMY_RADIUS,
  GAME_HEIGHT,
  GAME_WIDTH,
  ORB_BOUNCE_RESTITUTION,
  ORB_RADIUS,
  ORB_START_OFFSET_BOTTOM,
  ORB_START_OFFSET_RIGHT,
  PLAYER_HEIGHT,
  PLAYER_HITBOX_RADIUS,
  PLAYER_INVULNERABILITY_SECONDS,
  PLAYER_RENDER_SNAP,
  PLAYER_SHOT_INTERVAL,
  PLAYER_WIDTH,
  PLAYFIELD_BOTTOM,
  PLAYFIELD_CENTER_X,
  PLAYFIELD_HEIGHT,
  PLAYFIELD_LEFT,
  PLAYFIELD_RIGHT,
  PLAYFIELD_TOP,
  PLAYFIELD_WIDTH,
} from '../data/config/gameConfig'
import {
  createEnemyBullet,
  createPlayerBullet,
  type BulletModel,
} from '../entities/Bullet'
import { createEnemy, reviveEnemy, type EnemyModel } from '../entities/Enemy'
import { createPlayer, resetPlayer, type PlayerModel } from '../entities/Player'
import {
  ORB_FORCE_SHOT_BASE,
  ORB_FORCE_START,
  ORB_FORCE_TOP_DIVISOR,
  ORB_GRAVITY_FRAME_DIVISOR,
  ORB_TERMINAL_VELOCITY,
  ORB_VELOCITY_X_START,
  SHOT_COUNT_MAX,
  orbContactProfiles,
  orbVelocityXPixels,
  reflectOrbVelocityX,
  resolveShotVelocityX,
  type OrbVelocityXState,
} from '../data/resources/orbResources'
import {
  CAMPAIGN_STAGE_COUNT,
  BOSS_STAGE_INTERVAL,
  STAGES_PER_SCENE,
  getCampaignStageDefinition,
  getSceneCount,
  getSceneIndex,
  getSceneStartStageNumber,
  getInitialCampaignStageNumber,
  getNextCampaignStageNumber,
  isSceneStartStage,
  type BasicArenaDefinition,
  type BossArenaDefinition,
  type BossRouteDefinition,
  type CampaignStageDefinition,
} from '../data/catalog/stageCatalog'
import {
  getRouteMenuLabel,
  getRouteBranchLabel,
  gameplayTerminology,
} from '../../content/terminology'
import {
  backgroundManifest,
  resolveBackgroundTrackId,
} from '../data/resources/backgroundManifest'
import { appAudio } from '../../app/audio/appAudio'
import {
  getBossDialogueSequence,
  sceneTotalText,
  stageBonusText,
  type BossDialoguePhase,
  type EndingKind,
} from '../../content/intermissionText'
import type {
  StageCardResource,
  StageObstacleResource,
  StageObstacleType,
  StageTurretPattern,
} from '../data/resources/stageResources'
import type { InputManager } from '../core/InputManager'
import type {
  CampaignStageNumber,
  GameRank,
  GameRoute,
  StageMode,
  Vector2,
} from '../core/types'
import {
  type BossBeamModel,
  createBossPatternState,
  isBossBeamDamaging,
  resetBossPatternState,
  updateBossPattern,
} from '../systems/bossPatternSystem'
import { resolveCardFlipScore } from '../systems/cardRuleSystem'
import { circlesIntersect } from '../systems/CollisionSystem'
import {
  canPlayerFireShots,
  consumePendingPlayerShotOffsets,
  createPlayerActionState,
  resetPlayerActionState,
  resolveOrbRepelFromPlayerAction,
  updatePlayerActionState,
} from '../systems/playerActionSystem'
import {
  CARD_FLIP_CYCLE_MAX,
  collectRewardPickups,
  createCardRewardState,
  createRewardPickup,
  isRewardPickupActive,
  MAX_BOMBS,
  normalizeCardRewardPickupType,
  POINT_VALUE_CAP,
  resetCardRewardState,
  resolvePointPickupValue,
  resolveCardRewardPickupType,
  updateRewardPickups,
  type RewardPickup,
} from '../systems/rewardSystem'
import {
  BOMB_ACTIVE_SECONDS,
  createBombState,
  resetBombState,
  triggerBomb,
  updateBombState,
} from '../systems/bombSystem'
import {
  applyScore,
  createExtendState,
  MAX_LIVES,
  syncExtendState,
} from '../systems/extendSystem'
import {
  consumeStageStart,
  createStageStartState,
  prepareStageStartState,
  resolveStageShouldAwaitStart,
} from '../systems/stageStartSystem'
import type {
  GameHudSnapshot,
  GameOverlaySnapshot,
  GameStatus,
} from '../ui/GameHudSnapshot'

interface StageSceneServices {
  initialSnapshot?: GameHudSnapshot | null
  input: InputManager
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

interface OrbModel {
  position: Vector2
  radius: number
  velocityY: number
  force: number
  forceFrame: number
  velocityXState: OrbVelocityXState
}

type ArenaPhase = 'basic' | 'boss'
type StageCardState = 'alive' | 'flipping' | 'removed'

interface StageCard {
  id: string
  x: number
  y: number
  flipsRemaining: number
  maxFlips: number
  scoreBase: number
  state: StageCardState
  flipFrame: number
}

interface StageObstacle {
  id: string
  type: StageObstacleType
  x: number
  y: number
  width: number
  height: number
  linkId?: string
  collisionCooldownFrames: number
  cooldownFrames: number
  fireIntervalFrames: number
  fireTimer: number
  flashFrames: number
  turretPattern: StageTurretPattern
}

interface FloatingPopup {
  id: number
  text: string
  x: number
  y: number
  ttl: number
  lifetime: number
  velocityY: number
  accent: 'bright' | 'soft'
}

interface RectBounds {
  x: number
  y: number
  width: number
  height: number
}

interface StageBonusMetrics {
  time: number
  combo: number
  resources: number
  stage: number
  total: number
}

interface SceneTotalMetrics {
  time: number
  combo: number
  resources: number
  stage: number
  total: number
}

interface EndingVerdictMetrics {
  endingKind: EndingKind
  highScore: number
  score: number
  rank: string
  sceneContinueCounts: number[]
  totalContinues: number
  resources: string
}

type DialogueAdvance =
  | 'resume-boss'
  | 'route-select'
  | 'scene-total'
  | 'scene-total-final'
  | 'ending'
  | 'verdict'

type GameOverAction = 'continue' | 'title'
type ScoreEntryFlow = 'gameover' | 'ending'

type IntermissionState =
  | { kind: 'none' }
  | {
      kind: 'dialogue'
      phase: BossDialoguePhase
      stageNumber: CampaignStageNumber
      next: DialogueAdvance
      lineIndex: number
      endingKind?: EndingKind
    }
  | {
      kind: 'stage-bonus'
      stageNumber: CampaignStageNumber
      nextStageNumber: CampaignStageNumber
      metrics: StageBonusMetrics
    }
  | { kind: 'route-select'; selectedRoute: GameRoute }
  | {
      kind: 'scene-total'
      finalScene: boolean
      clearMessage: string
      stageStart: number
      stageEnd: number
      metrics: SceneTotalMetrics
    }
  | {
      kind: 'gameover-menu'
      selectedAction: GameOverAction
    }
  | {
      kind: 'verdict'
      metrics: EndingVerdictMetrics
    }
  | {
      kind: 'score-entry'
      flow: ScoreEntryFlow
      pendingHighScore: boolean
    }

const FIELD_INSET = 18
const ENEMY_CORE_RADIUS = 22
const ORB_CONTACT_COOLDOWN = 40 / 60
const STAGE_TRANSITION_SECONDS = 1.35
const CARD_FRAMES_PER_CEL = 6
const CARD_EDGE_FRAME = CARD_FRAMES_PER_CEL * 2
const CARD_FLIP_DONE_FRAME = CARD_FRAMES_PER_CEL * 5
const STAGE_TILE_SIZE = 32
const CARD_HIT_DISTANCE = 24
const PORTAL_LOCK_FRAMES = 60
const STAGE_BULLET_SCORE = 1
const PORTAL_SCORE = 0
const BOSS_ORB_HIT_SCORE = 40
const BOSS_SHOT_HIT_SCORE = 2
const BOSS_DEFEAT_SCORE = 320
const START_BOMBS = 1
const PLAYER_SHOT_HITBOX_SIZE = 16
const ENEMY_BULLET_SPRITE_SIZE = 16
const PELLET_SPEED_RAISE_STEP = 4
const BACKDROP_ALPHA = 1
const BACKDROP_FILM_ALPHA = 0.64
const PLAYFIELD_OUTER_OVERLAY_ALPHA = 0.1
const PLAYFIELD_INNER_OVERLAY_ALPHA = 0.08
const PLAYFIELD_OUTER_OVERLAY_COLOR = 0x000000
const PLAYFIELD_INNER_OVERLAY_COLOR = 0x000000
const DIALOGUE_ADVANCE_LOCK_SECONDS = 0.2
const POPUP_CARD_LIFETIME = 0.72
const POPUP_ITEM_LIFETIME = 0.9
const POPUP_CARD_SPEED = 28
const POPUP_ITEM_SPEED = 24

export class StageScene {
  private readonly backdrop = new TilingSprite({ texture: Texture.EMPTY, width: GAME_WIDTH, height: GAME_HEIGHT })
  private readonly backdropMask = new Graphics()
  private readonly background = new Graphics()
  private readonly arena = new Graphics()
  private readonly enemyBulletGraphics = new Graphics()
  private readonly enemyGraphics = new Graphics()
  private readonly playerGraphics = new Graphics()
  private readonly playerBulletGraphics = new Graphics()
  private readonly rewardPickupLayer = new Container()
  private readonly popupLayer = new Container()
  private readonly effectsGraphics = new Graphics()
  private readonly loadedTextures = new Map<string, Texture>()

  private readonly player: PlayerModel = createPlayer()
  private readonly playerAction = createPlayerActionState()
  private readonly enemy: EnemyModel = createEnemy()
  private readonly orb: OrbModel = createOrb()
  private readonly playerBullets: BulletModel[] = []
  private readonly enemyBullets: BulletModel[] = []
  private readonly enemyBeams: BossBeamModel[] = []
  private readonly rewardPickups: RewardPickup[] = []
  private readonly floatingPopups: FloatingPopup[] = []
  private readonly cards: StageCard[] = []
  private readonly stageObstacles: StageObstacle[] = []
  private readonly root: Container
  private readonly services: StageSceneServices
  private readonly initialStageNumber: CampaignStageNumber
  private readonly stageStart = createStageStartState()
  private readonly bossPattern = createBossPatternState()
  private readonly cardRewards = createCardRewardState()
  private readonly bomb = createBombState()
  private readonly extend = createExtendState(0, 3)

  private currentRoute: GameRoute
  private currentStageNumber: CampaignStageNumber
  private currentStageDefinition: CampaignStageDefinition
  private currentArena: ArenaPhase
  private intermission: IntermissionState = { kind: 'none' }
  private transitionTimer = 0
  private transitionMessage = ''
  private status: GameStatus = 'running'
  private score = 0
  private lives = 3
  private bombs = START_BOMBS
  private elapsedSeconds = 0
  private shotsFired = 0
  private cardCombo = 0
  private pointValue = 0
  private pelletSpeedBonus = 0
  private sceneStartScore = 0
  private sceneStartElapsedSeconds = 0
  private sceneMaxCombo = 0
  private stageStartElapsedSeconds = 0
  private stageMaxCombo = 0
  private sceneContinueCounts = createSceneContinueCounts()
  private totalContinues = 0
  private nextBulletId = 0
  private enemyOrbHitCooldown = 0
  private dialogueAdvanceLock = 0
  private portalLockFrames = 0
  private verticalBarsBlockedFrames = 0
  private bombCardCursor = 0
  private topBounceStallFrames = 0
  private nextPopupId = 0

  constructor(root: Container, services: StageSceneServices) {
    this.root = root
    this.services = services
    this.lives = clamp(this.services.startLives, 0, MAX_LIVES)
    this.currentRoute = this.services.route
    syncExtendState(this.extend, this.score, this.lives)
    this.initialStageNumber = getInitialCampaignStageNumber(this.services.stageMode)
    this.currentStageNumber = this.initialStageNumber
    this.currentStageDefinition = getCampaignStageDefinition(this.currentStageNumber, this.currentRoute)
    this.currentArena = this.currentStageDefinition.arena.kind
    this.backdropMask
      .clear()
      .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .fill(0xffffff)
    this.backdrop.mask = this.backdropMask
    this.root.addChild(
      this.background,
      this.backdrop,
      this.backdropMask,
      this.arena,
      this.enemyBulletGraphics,
      this.playerBulletGraphics,
      this.enemyGraphics,
      this.playerGraphics,
      this.rewardPickupLayer,
      this.popupLayer,
      this.effectsGraphics,
    )

    resetCardRewardState(this.cardRewards, 0)
    void this.primeSpriteTextures()

    this.loadStage(this.initialStageNumber, false)

    if (this.services.initialSnapshot) {
      this.restoreSnapshot(this.services.initialSnapshot)
    }

    this.services.onStatusChange(this.status, this.currentStatusMessage())
    this.emitSnapshot(true)
    this.render()
  }

  update(deltaSeconds: number) {
    if (
      this.services.input.consumePress('pause') &&
      this.status !== 'gameover' &&
      this.status !== 'cleared'
    ) {
      this.status = this.status === 'paused' ? 'running' : 'paused'
      this.services.onStatusChange(this.status, this.currentStatusMessage())
      this.emitSnapshot(true)
    }

    if (
      this.services.input.consumePress('restart') &&
      (this.status === 'gameover' || this.status === 'cleared')
    ) {
      this.resetRun()
    }

    if (this.status !== 'running') {
      this.render()
      return
    }

    if (this.intermission.kind !== 'none') {
      this.dialogueAdvanceLock = Math.max(0, this.dialogueAdvanceLock - deltaSeconds)
      this.updateIntermission()
      this.render()
      this.emitSnapshot()
      return
    }

    this.elapsedSeconds += deltaSeconds
    this.updateFloatingPopups(deltaSeconds)
    this.enemyOrbHitCooldown = Math.max(0, this.enemyOrbHitCooldown - deltaSeconds)
    this.portalLockFrames = Math.max(0, this.portalLockFrames - 1)
    this.verticalBarsBlockedFrames = Math.max(0, this.verticalBarsBlockedFrames - 1)
    if (this.transitionTimer > 0) {
      this.transitionTimer = Math.max(0, this.transitionTimer - deltaSeconds)
      this.render()
      this.emitSnapshot()
      return
    }

    if (this.stageStart.awaitingShot) {
      this.updatePlayer(deltaSeconds, false)
      if (consumeStageStart(this.stageStart, this.services.input)) {
        this.player.shotCooldown = PLAYER_SHOT_INTERVAL
      }
      this.render()
      this.emitSnapshot()
      return
    }

    if (this.services.input.consumePress('bomb')) {
      this.tryStartBomb()
    }

    this.updatePlayer(deltaSeconds)
    this.updateOrb()

    if (this.currentArena === 'basic') {
      this.updateBasicStage(deltaSeconds)
    } else {
      this.updateBoss(deltaSeconds)
    }

    this.player.invulnerability = Math.max(
      this.player.invulnerability,
      this.bomb.active ? BOMB_ACTIVE_SECONDS * 0.25 : 0,
    )
    const bombPulses = updateBombState(this.bomb, deltaSeconds)
    for (let pulse = 0; pulse < bombPulses; pulse += 1) {
      this.applyBombPulse()
    }

    this.updateBullets(deltaSeconds)
    updateRewardPickups(this.rewardPickups, deltaSeconds, PLAYFIELD_BOTTOM - 10)
    this.resolveCollisions()
    this.cleanupBullets()
    this.render()
    this.emitSnapshot()
  }

  destroy() {
    this.root.removeChild(
      this.background,
      this.backdrop,
      this.backdropMask,
      this.arena,
      this.enemyBulletGraphics,
      this.playerBulletGraphics,
      this.enemyGraphics,
      this.playerGraphics,
      this.rewardPickupLayer,
      this.popupLayer,
      this.effectsGraphics,
    )

    this.backdrop.destroy()
    this.backdropMask.destroy()
    this.background.destroy()
    this.arena.destroy()
    this.enemyBulletGraphics.destroy()
    this.playerBulletGraphics.destroy()
    this.enemyGraphics.destroy()
    this.playerGraphics.destroy()
    this.rewardPickupLayer.destroy({ children: true })
    this.popupLayer.destroy({ children: true })
    this.effectsGraphics.destroy()
  }

  private updatePlayer(deltaSeconds: number, allowShooting = true) {
    updatePlayerActionState(
      this.playerAction,
      this.services.input,
      this.player,
      this.services.rank,
      deltaSeconds,
    )
    this.player.position.x = clamp(
      this.player.position.x,
      PLAYFIELD_LEFT + PLAYER_WIDTH / 2,
      PLAYFIELD_RIGHT - PLAYER_WIDTH / 2,
    )
    this.player.position.y = PLAYFIELD_BOTTOM - PLAYER_HEIGHT / 2
    this.player.shotCooldown = Math.max(0, this.player.shotCooldown - deltaSeconds)
    this.player.invulnerability = Math.max(0, this.player.invulnerability - deltaSeconds)

    const specialShotOffsets = consumePendingPlayerShotOffsets(this.playerAction)
    for (const offset of specialShotOffsets) {
      if (this.playerBullets.length >= SHOT_COUNT_MAX) {
        break
      }

      const bulletX = snapToStep(this.player.position.x + offset, PLAYER_RENDER_SNAP)
      const bulletY = this.player.position.y - PLAYER_HEIGHT / 2 - 6

      this.playerBullets.push(createPlayerBullet(this.nextBulletId++, bulletX, bulletY))
      this.shotsFired += 1
      appAudio.playSfx('shot')
    }

    if (
      allowShooting &&
      canPlayerFireShots(this.playerAction) &&
      this.services.input.consumePress('shoot') &&
      this.playerBullets.length < SHOT_COUNT_MAX
    ) {
      const bulletX = snapToStep(this.player.position.x, PLAYER_RENDER_SNAP)
      const bulletY = this.player.position.y - PLAYER_HEIGHT / 2 - 6

      this.playerBullets.push(createPlayerBullet(this.nextBulletId++, bulletX, bulletY))
      this.shotsFired += 1
      appAudio.playSfx('shot')
    }
  }

  private updateOrb() {
    this.orb.position.x += orbVelocityXPixels[this.orb.velocityXState]
    this.orb.position.y += this.updateOrbVelocityY()

    if (this.orb.position.x - this.orb.radius <= PLAYFIELD_LEFT) {
      this.orb.position.x = PLAYFIELD_LEFT + this.orb.radius
      this.orb.velocityXState = reflectOrbVelocityX(this.orb.velocityXState)
    } else if (this.orb.position.x + this.orb.radius >= PLAYFIELD_RIGHT) {
      this.orb.position.x = PLAYFIELD_RIGHT - this.orb.radius
      this.orb.velocityXState = reflectOrbVelocityX(this.orb.velocityXState)
    }

    if (this.orb.position.y - this.orb.radius <= PLAYFIELD_TOP) {
      this.topBounceStallFrames += 1
      this.orb.position.y = PLAYFIELD_TOP + this.orb.radius
      this.applyTopBounce()
    } else if (this.orb.position.y > PLAYFIELD_TOP + this.orb.radius + 2) {
      this.topBounceStallFrames = 0
    }

    if (this.orb.position.y + this.orb.radius >= PLAYFIELD_BOTTOM) {
      this.orb.position.y = PLAYFIELD_BOTTOM - this.orb.radius
      this.applySurfaceBounce()
      this.cardCombo = 0
    }

    if (this.currentArena === 'basic') {
      this.resolveStageObstacleCollision()
    }

    this.resolvePlayerOrbInteraction()

    if (
      this.player.invulnerability <= 0 &&
      !this.playerAction.invulnerableAgainstOrb &&
      orbHitsPlayerBody(this.orb.position, this.player.position)
    ) {
      this.handlePlayerHit()
    }
  }

  private updateBasicStage(deltaSeconds: number) {
    for (const obstacle of this.stageObstacles) {
      obstacle.cooldownFrames = Math.max(0, obstacle.cooldownFrames - 1)
      obstacle.flashFrames = Math.max(0, obstacle.flashFrames - 1)

      if (obstacle.type === 'turret_slow' || obstacle.type === 'turret_quick') {
        if (this.services.rank === 'easy') {
          obstacle.fireTimer = 0
          continue
        }

        obstacle.fireTimer += deltaSeconds * 60
        if (obstacle.fireTimer >= obstacle.fireIntervalFrames) {
          obstacle.fireTimer = 0
          obstacle.flashFrames = 8
          this.spawnTurretVolley(obstacle)
        }
      }
    }

    let removedCards = 0

    for (const card of this.cards) {
      if (card.state !== 'flipping') {
        if (card.state === 'removed') {
          removedCards += 1
        }
        continue
      }

      card.flipFrame += 1
      if (card.flipFrame === CARD_EDGE_FRAME && this.services.rank === 'lunatic') {
        this.spawnCardBurst(card)
      }

      if (card.flipFrame < CARD_FLIP_DONE_FRAME) {
        continue
      }

      if (card.flipsRemaining > 1) {
        card.flipsRemaining -= 1
        card.state = 'alive'
      } else {
        card.flipsRemaining = 0
        card.state = 'removed'
        removedCards += 1
      }
      card.flipFrame = 0
    }

    if (removedCards === this.cards.length && this.cards.length > 0) {
      this.setArenaCleared(this.basicArenaDefinition.clearMessage)
    }
  }

  private updateBoss(deltaSeconds: number) {
    if (!this.enemy.active) {
      return
    }

    const attackResult = updateBossPattern(
      this.bossPattern,
      this.bossRouteProfile.patternId,
      this.services.rank,
      this.enemy,
      this.player.position,
      deltaSeconds,
      () => this.nextBulletId++,
    )
    this.enemyBullets.push(...attackResult.bullets.map((bullet) => this.applyPelletSpeedBoost(bullet)))
    this.enemyBeams.push(...attackResult.beams)
  }

  private updateBullets(deltaSeconds: number) {
    const playerSliding =
      this.playerAction.mode === 'slide_left' || this.playerAction.mode === 'slide_right'

    for (const bullet of this.playerBullets) {
      bullet.position.x += bullet.velocity.x * deltaSeconds
      bullet.position.y += bullet.velocity.y * deltaSeconds
    }

    for (const bullet of this.enemyBullets) {
      bullet.position.x += bullet.velocity.x * deltaSeconds
      bullet.position.y += bullet.velocity.y * deltaSeconds

      if (circlesIntersect({ position: this.orb.position, radius: this.orb.radius }, bullet)) {
        bullet.active = false
        this.addScore(STAGE_BULLET_SCORE)
        continue
      }

      if (
        this.player.invulnerability <= 0 &&
        enemyBulletHitsPlayerBody(bullet, this.player.position, playerSliding)
      ) {
        bullet.active = false
        this.handlePlayerHit()
      }
    }

    for (const beam of this.enemyBeams) {
      beam.elapsedSeconds += deltaSeconds

      if (beam.elapsedSeconds >= beam.telegraphSeconds + beam.activeSeconds) {
        beam.active = false
        continue
      }

      if (!isBossBeamDamaging(beam) || this.player.invulnerability > 0) {
        continue
      }

      if (
        segmentIntersectsRect(
          beam.start,
          beam.end,
          {
            x: this.player.position.x - orbContactProfiles.default.bodyHalfWidth,
            y: this.player.position.y - orbContactProfiles.default.bodyHalfHeight,
            width: orbContactProfiles.default.bodyHalfWidth * 2,
            height: orbContactProfiles.default.bodyHalfHeight * 2,
          },
          beam.width / 2,
        )
      ) {
        this.handlePlayerHit()
      }
    }
  }

  private updateOrbVelocityY() {
    this.orb.velocityY = clamp(
      this.orb.force + this.orb.forceFrame / ORB_GRAVITY_FRAME_DIVISOR,
      -ORB_TERMINAL_VELOCITY,
      ORB_TERMINAL_VELOCITY,
    )
    const deltaY = this.orb.force + this.orb.forceFrame / ORB_GRAVITY_FRAME_DIVISOR
    this.orb.forceFrame += 1
    return deltaY
  }

  private applyImmediateForce(immediate: number) {
    this.orb.force = immediate
    this.orb.forceFrame = 0
  }

  private applySurfaceBounce() {
    const previousForceFrame = this.orb.forceFrame
    this.applyImmediateForce(-this.orb.velocityY * ORB_BOUNCE_RESTITUTION)

    if (this.orb.velocityXState === '0' && previousForceFrame < 17) {
      const roll = Math.floor(Math.random() * 50)
      if (roll === 0) {
        this.orb.velocityXState = '4_left'
      } else if (roll === 1) {
        this.orb.velocityXState = '4_right'
      }
    }
  }

  private applyTopBounce() {
    let reboundForce = -this.orb.velocityY - this.orb.forceFrame / ORB_FORCE_TOP_DIVISOR
    if (this.topBounceStallFrames >= 2 && reboundForce <= 0) {
      reboundForce = 1
      this.orb.position.y = PLAYFIELD_TOP + this.orb.radius + 1
    }
    this.applyImmediateForce(reboundForce)
  }

  private reflectOrbY() {
    this.applyImmediateForce(-this.orb.velocityY)
  }

  private applyShotImpulse() {
    this.applyImmediateForce(ORB_FORCE_SHOT_BASE + this.orb.velocityY / 2)
  }

  private resolveStageObstacleCollision() {
    for (const obstacle of this.stageObstacles) {
      switch (obstacle.type) {
        case 'bumper':
          this.resolveBumperCollision(obstacle)
          break
        case 'bar_top':
        case 'bar_bottom':
          this.resolveHorizontalBarCollision(obstacle)
          break
        case 'bar_left':
        case 'bar_right':
          this.resolveVerticalBarCollision(obstacle)
          break
        case 'portal':
          this.resolvePortalCollision(obstacle)
          break
        case 'turret_slow':
        case 'turret_quick':
          break
      }
    }
  }

  private resolveBumperCollision(obstacle: StageObstacle) {
    if (obstacle.cooldownFrames > 0) {
      return
    }

    if (!circleIntersectsRect(this.orb.position, this.orb.radius, obstacle)) {
      return
    }

    const deltaX = this.orb.position.x - (obstacle.x + obstacle.width / 2)
    const deltaY = this.orb.position.y - (obstacle.y + obstacle.height / 2)
    obstacle.cooldownFrames = obstacle.collisionCooldownFrames
    this.orb.position.y =
      deltaY <= 0
        ? obstacle.y - this.orb.radius
        : obstacle.y + obstacle.height + this.orb.radius

    if (this.orb.velocityXState === '4_right' && deltaX < 0) {
      this.orb.velocityXState = '4_left'
    } else if (this.orb.velocityXState === '4_left' && deltaX > 0) {
      this.orb.velocityXState = '4_right'
    }

    this.applySurfaceBounce()
  }

  private resolveHorizontalBarCollision(obstacle: StageObstacle) {
    if (obstacle.cooldownFrames > 0) {
      return
    }

    if (!circleIntersectsRect(this.orb.position, this.orb.radius, obstacle)) {
      return
    }

    obstacle.cooldownFrames = obstacle.collisionCooldownFrames
    const obstacleMidY = obstacle.y + obstacle.height / 2
    this.orb.position.y =
      this.orb.position.y < obstacleMidY
        ? obstacle.y - this.orb.radius
        : obstacle.y + obstacle.height + this.orb.radius
    this.reflectOrbY()
  }

  private resolveVerticalBarCollision(obstacle: StageObstacle) {
    if (obstacle.cooldownFrames > 0 || this.verticalBarsBlockedFrames > 0) {
      return
    }

    if (!circleIntersectsRect(this.orb.position, this.orb.radius, obstacle)) {
      return
    }

    obstacle.cooldownFrames = obstacle.collisionCooldownFrames
    this.verticalBarsBlockedFrames = obstacle.collisionCooldownFrames
    const obstacleMidX = obstacle.x + obstacle.width / 2
    this.orb.position.x =
      this.orb.position.x < obstacleMidX
        ? obstacle.x - this.orb.radius
        : obstacle.x + obstacle.width + this.orb.radius

    if (this.orb.velocityXState === '0') {
      this.reflectOrbY()
    } else {
      this.orb.velocityXState = reflectOrbVelocityX(this.orb.velocityXState)
    }
  }

  private resolvePortalCollision(obstacle: StageObstacle) {
    if (this.portalLockFrames > 0) {
      return
    }

    if (!circleIntersectsRect(this.orb.position, this.orb.radius, obstacle)) {
      return
    }

    const destination = this.pickPortalDestination(obstacle)
    if (!destination) {
      return
    }

    this.orb.position.x = destination.x + destination.width / 2
    this.orb.position.y = destination.y + destination.height / 2
    this.orb.velocityXState = randomVelocityState()
    this.applyImmediateForce(randomInt(-9, 9))
    this.portalLockFrames = PORTAL_LOCK_FRAMES
    this.addScore(PORTAL_SCORE)
  }

  private resolvePlayerOrbInteraction() {
    const repelResponse = resolveOrbRepelFromPlayerAction(
      this.playerAction,
      this.player.position.x,
      this.orb.position.x,
    )

    if (!repelResponse) {
      return
    }

    if (!orbHitsPlayerRepelWindow(this.orb.position, this.player.position)) {
      return
    }

    if (repelResponse.snapToPlayer) {
      this.orb.position.y = this.player.position.y - orbContactProfiles.default.repelHalfHeight
    }
    this.orb.velocityXState = repelResponse.velocityXState
    this.applyImmediateForce(repelResponse.forceImmediate)
  }

  private resolveCollisions() {
    for (const bullet of this.playerBullets) {
      if (!bullet.active) {
        continue
      }

      if (
        circlesIntersect(
          {
            position: this.orb.position,
            radius: this.orb.radius,
          },
          bullet,
        )
      ) {
        bullet.active = false
        this.orb.velocityXState = resolveShotVelocityX(bullet.position.x - this.orb.position.x)
        this.applyShotImpulse()
        this.orb.position.x += orbVelocityXPixels[this.orb.velocityXState]
        this.orb.position.y += this.updateOrbVelocityY()
      }
    }

    if (this.currentArena === 'basic') {
      this.resolveCardHits()
    } else {
      this.resolveBossHits()
    }

    this.resolveCollectedRewards()
  }

  private resolveCardHits() {
    for (const card of this.cards) {
      if (card.state !== 'alive') {
        continue
      }

      if (!orbTouchesCard(card, this.orb)) {
        continue
      }

      this.flipCard(card)
    }
  }

  private resolveBossHits() {
    if (
      this.enemy.active &&
      this.player.invulnerability <= 0 &&
      bossHitsPlayerBody(this.enemy.position, this.player.position)
    ) {
      this.handlePlayerHit()
      return
    }

    if (
      this.enemy.active &&
      this.enemyOrbHitCooldown <= 0 &&
      circlesIntersect(
        {
          position: this.enemy.position,
          radius: ENEMY_CORE_RADIUS,
        },
        {
          position: this.orb.position,
          radius: this.orb.radius,
        },
      )
    ) {
      this.enemy.health = Math.max(0, this.enemy.health - 2)
      this.enemyOrbHitCooldown = ORB_CONTACT_COOLDOWN
      this.orb.position.y = this.enemy.position.y + ENEMY_CORE_RADIUS + this.orb.radius + 2
      this.applySurfaceBounce()
      if (this.orb.velocityXState === '4_left' || this.orb.velocityXState === '8_left') {
        this.orb.velocityXState = '4_right'
      } else if (this.orb.velocityXState === '4_right' || this.orb.velocityXState === '8_right') {
        this.orb.velocityXState = '4_left'
      } else {
        this.orb.velocityXState =
          this.orb.position.x < PLAYFIELD_CENTER_X ? '4_right' : '4_left'
      }
      this.addScore(BOSS_ORB_HIT_SCORE)
      appAudio.playSfx('bossHit')
    }

    const bossShotHit = this.playerBullets.find(
      (bullet) =>
        bullet.active &&
        this.enemy.active &&
        playerShotHitsBossBody(bullet.position, this.enemy.position),
    )
    if (bossShotHit) {
      bossShotHit.active = false
      this.enemy.health = Math.max(0, this.enemy.health - 1)
      this.addScore(BOSS_SHOT_HIT_SCORE)
      appAudio.playSfx('bossHit')
    }

    if (this.enemy.active && this.enemy.health <= 0) {
      this.enemy.active = false
      this.enemyBeams.length = 0
      this.addScore(BOSS_DEFEAT_SCORE)
      this.setArenaCleared(this.bossRouteProfile.clearMessage)
    }
  }

  private spawnTurretVolley(obstacle: StageObstacle, speed = 170) {
    const sourceX = obstacle.x + obstacle.width / 2
    const sourceY = obstacle.y + obstacle.height / 2
    const baseAngle = Math.atan2(this.player.position.y - sourceY, this.player.position.x - sourceX)
    const offsets = obstacle.turretPattern === 'spread3' ? [-0.28, 0, 0.28] : [0]

    for (const offset of offsets) {
      this.enemyBullets.push(
        this.applyPelletSpeedBoost(
          createEnemyBullet(this.nextBulletId++, sourceX, sourceY, baseAngle + offset, speed),
        ),
      )
    }
  }

  private spawnCardBurst(card: StageCard) {
    const sourceX = card.x + STAGE_TILE_SIZE / 2
    const sourceY = card.y + STAGE_TILE_SIZE / 2
    const baseAngle = Math.atan2(this.player.position.y - sourceY, this.player.position.x - sourceX)

    for (const offset of [-0.22, 0.22]) {
      this.enemyBullets.push(
        this.applyPelletSpeedBoost(
          createEnemyBullet(this.nextBulletId++, sourceX, sourceY, baseAngle + offset, 160),
        ),
      )
    }
  }

  private flipCard(card: StageCard, forcePointReward = false) {
    if (card.state !== 'alive') {
      return
    }

    card.state = 'flipping'
    card.flipFrame = 0
    this.cardCombo += 1
    const score = resolveCardFlipScore(
      this.currentStageNumber,
      this.services.rank,
      this.cardCombo,
    )
    this.stageMaxCombo = Math.max(this.stageMaxCombo, this.cardCombo)
    this.sceneMaxCombo = Math.max(this.sceneMaxCombo, this.cardCombo)
    this.addScore(score)
    this.spawnFloatingPopup(
      score.toLocaleString(),
      card.x + STAGE_TILE_SIZE / 2,
      card.y + STAGE_TILE_SIZE / 2,
      'bright',
      POPUP_CARD_LIFETIME,
      POPUP_CARD_SPEED,
    )
    appAudio.playSfx('flip')
    this.spawnCardReward(card, forcePointReward)
  }

  private spawnCardReward(card: StageCard, forcePointReward = false) {
    const pickupType = normalizeCardRewardPickupType(
      resolveCardRewardPickupType(this.cardRewards),
      forcePointReward,
    )
    if (!pickupType) {
      return
    }

    this.rewardPickups.push(
      createRewardPickup(
        this.nextBulletId++,
        pickupType,
        card.x + STAGE_TILE_SIZE / 2,
        card.y + STAGE_TILE_SIZE / 2,
      ),
    )
  }

  private tryStartBomb() {
    if (this.bombs <= 0 || this.bomb.active || this.status !== 'running') {
      return
    }

    this.bombs -= 1
    triggerBomb(this.bomb)
    this.player.invulnerability = Math.max(this.player.invulnerability, BOMB_ACTIVE_SECONDS)
    appAudio.playSfx('bombStart')
  }

  private applyBombPulse() {
    let clearedBullets = 0
    for (const bullet of this.enemyBullets) {
      if (!bullet.active) {
        continue
      }

      bullet.active = false
      clearedBullets += 1
    }

    this.addScore(Math.floor(clearedBullets / 4))
    if (clearedBullets > 0) {
      appAudio.playSfx('bombPulse')
    }

    if (this.currentArena === 'basic') {
      this.applyBombToCards()
      return
    }

    this.applyBombToBoss()
  }

  private applyBombToCards() {
    if (this.cards.length === 0) {
      return
    }

    let flippedCount = 0
    for (let offset = 0; offset < this.cards.length; offset += 1) {
      const index = (this.bombCardCursor + offset) % this.cards.length
      const card = this.cards[index]
      if (card.state !== 'alive') {
        continue
      }

      this.flipCard(card, true)
      this.bombCardCursor = (index + 1) % this.cards.length
      flippedCount += 1
      if (flippedCount >= 2) {
        return
      }
    }
  }

  private applyBombToBoss() {
    if (!this.enemy.active) {
      return
    }

    const damage = 2 + Math.min(this.bossPattern.phaseIndex, 1)
    this.enemy.health = Math.max(0, this.enemy.health - damage)
    this.addScore(8 + this.bossPattern.phaseIndex * 4)
    this.orb.position.x = this.enemy.position.x
    this.orb.position.y = this.enemy.position.y + ENEMY_CORE_RADIUS + this.orb.radius + 4
    this.orb.velocityXState = '0'
    this.applyImmediateForce(-12)

    if (this.enemy.health <= 0) {
      this.enemy.active = false
      this.enemyBeams.length = 0
      this.addScore(BOSS_DEFEAT_SCORE)
      this.setArenaCleared(this.bossRouteProfile.clearMessage)
    }
  }

  private resolveCollectedRewards() {
    const collected = collectRewardPickups(this.rewardPickups, this.player.position)

    for (const reward of collected) {
      if (reward === 'point') {
        this.pointValue = resolvePointPickupValue(this.pointValue)
        this.addScore(this.pointValue)
        this.spawnFloatingPopup(
          this.pointValue.toLocaleString(),
          this.player.position.x,
          this.player.position.y - 28,
          'bright',
          POPUP_ITEM_LIFETIME,
          POPUP_ITEM_SPEED,
        )
        appAudio.playSfx('item')
        continue
      }

      if (this.bombs < MAX_BOMBS) {
        this.bombs = clamp(this.bombs + 1, 0, MAX_BOMBS)
        this.spawnFloatingPopup(
          'BOMB',
          this.player.position.x,
          this.player.position.y - 28,
          'bright',
          POPUP_ITEM_LIFETIME,
          POPUP_ITEM_SPEED,
        )
      } else {
        this.addScore(10000)
        this.spawnFloatingPopup(
          '10000',
          this.player.position.x,
          this.player.position.y - 28,
          'bright',
          POPUP_ITEM_LIFETIME,
          POPUP_ITEM_SPEED,
        )
      }
      appAudio.playSfx('item')
    }
  }

  private pickPortalDestination(origin: StageObstacle) {
    const linkedPortals = this.stageObstacles.filter(
      (obstacle) =>
        obstacle.type === 'portal' &&
        obstacle.id !== origin.id &&
        obstacle.linkId === origin.linkId,
    )

    if (linkedPortals.length > 0) {
      return linkedPortals[Math.floor(Math.random() * linkedPortals.length)]
    }

    const anyPortal = this.stageObstacles.find(
      (obstacle) => obstacle.type === 'portal' && obstacle.id !== origin.id,
    )
    return anyPortal ?? null
  }

  private handlePlayerHit() {
    if (this.status === 'gameover' || this.status === 'cleared') {
      return
    }

    this.lives -= 1
    this.playerBullets.length = 0
    this.enemyBullets.length = 0
    this.enemyBeams.length = 0
    this.rewardPickups.length = 0
    this.cardCombo = 0
    resetPlayerActionState(this.playerAction)
    resetBombState(this.bomb)
    resetPlayer(this.player)
    resetOrb(this.orb)
    this.player.invulnerability = PLAYER_INVULNERABILITY_SECONDS
    this.score = Math.max(0, this.score - 400)

    if (this.lives <= 0) {
      this.openScoreEntry('gameover')
      return
    }

    this.services.onStatusChange('running', this.currentStatusMessage())
  }

  private cleanupBullets() {
    for (const pickup of this.rewardPickups) {
      if (!pickup.active) {
        continue
      }

      if (pickup.position.y >= 440) {
        pickup.active = false
        if (pickup.type === 'point') {
          this.pointValue = 0
        }
      }
    }

    filterInPlace(
      this.playerBullets,
      (bullet) =>
        bullet.active &&
        bullet.position.y > PLAYFIELD_TOP - 40 &&
        bullet.position.y < PLAYFIELD_BOTTOM + 40 &&
        bullet.position.x > PLAYFIELD_LEFT - 40 &&
        bullet.position.x < PLAYFIELD_RIGHT + 40,
    )

    filterInPlace(
      this.enemyBullets,
      (bullet) =>
        bullet.active &&
        bullet.position.y > PLAYFIELD_TOP - 40 &&
        bullet.position.y < PLAYFIELD_BOTTOM + 40 &&
        bullet.position.x > PLAYFIELD_LEFT - 40 &&
        bullet.position.x < PLAYFIELD_RIGHT + 40,
    )
    filterInPlace(this.enemyBeams, (beam) => beam.active)

    filterInPlace(this.rewardPickups, isRewardPickupActive)
  }

  private resetRun() {
    this.status = 'running'
    this.transitionTimer = 0
    this.transitionMessage = ''
    this.score = 0
    this.lives = clamp(this.services.startLives, 0, MAX_LIVES)
    this.bombs = START_BOMBS
    this.elapsedSeconds = 0
    this.shotsFired = 0
    this.cardCombo = 0
    this.pointValue = 0
    this.sceneStartScore = 0
    this.sceneStartElapsedSeconds = 0
    this.sceneMaxCombo = 0
    this.stageStartElapsedSeconds = 0
    this.stageMaxCombo = 0
    this.sceneContinueCounts = createSceneContinueCounts()
    this.totalContinues = 0
    this.playerBullets.length = 0
    this.enemyBullets.length = 0
    this.enemyBeams.length = 0
    this.rewardPickups.length = 0
    this.enemyOrbHitCooldown = 0
    this.portalLockFrames = 0
    this.verticalBarsBlockedFrames = 0
    this.bombCardCursor = 0
    this.topBounceStallFrames = 0
    this.intermission = { kind: 'none' }
    this.currentRoute = this.services.route
    resetPlayerActionState(this.playerAction)
    resetBombState(this.bomb)
    syncExtendState(this.extend, this.score, this.lives)
    resetCardRewardState(this.cardRewards, 0)
    resetPlayer(this.player)
    resetOrb(this.orb)
    this.loadStage(this.initialStageNumber, false)
    this.services.onStatusChange('running', this.currentStatusMessage())
    this.emitSnapshot(true)
  }

  private restoreSnapshot(snapshot: GameHudSnapshot) {
    this.status = snapshot.status
    this.transitionMessage = snapshot.message
    this.score = Math.max(0, snapshot.score)
    this.lives = clamp(snapshot.lives, 0, MAX_LIVES)
    this.bombs = clamp(snapshot.bombs, 0, MAX_BOMBS)
    this.elapsedSeconds = Math.max(0, snapshot.elapsedSeconds)
    this.shotsFired = Math.max(0, snapshot.shotsFired)
    this.cardCombo = Math.max(0, snapshot.cardCombo)
    this.pointValue = clamp(snapshot.pointValue, 0, POINT_VALUE_CAP)
    this.pelletSpeedBonus = Math.max(0, snapshot.pelletSpeedBonus)
    this.sceneStartScore = Math.max(0, snapshot.sceneStartScore)
    this.sceneStartElapsedSeconds = Math.max(0, snapshot.sceneStartElapsedSeconds)
    this.sceneMaxCombo = Math.max(0, snapshot.sceneMaxCombo)
    this.stageStartElapsedSeconds = Math.max(0, snapshot.stageStartElapsedSeconds)
    this.stageMaxCombo = Math.max(0, snapshot.stageMaxCombo)
    this.sceneContinueCounts = normalizeSceneContinueCounts(snapshot.sceneContinueCounts)
    this.totalContinues = Math.max(0, snapshot.totalContinues)
    this.currentRoute = snapshot.currentRoute
    this.enemyOrbHitCooldown = 0
    this.portalLockFrames = 0
    this.verticalBarsBlockedFrames = 0
    this.playerBullets.length = 0
    this.enemyBullets.length = 0
    this.enemyBeams.length = 0
    this.rewardPickups.length = 0
    this.bombCardCursor = 0
    this.topBounceStallFrames = 0
    resetBombState(this.bomb)
    syncExtendState(this.extend, this.score, this.lives)
    resetPlayer(this.player)
    resetOrb(this.orb)

    const restoredStageNumber =
      normalizeCampaignStageNumber(snapshot.campaignStageNumber) ?? this.initialStageNumber
    this.loadStage(restoredStageNumber, false, true)
    this.sceneStartScore = Math.max(0, snapshot.sceneStartScore)
    this.sceneStartElapsedSeconds = Math.max(0, snapshot.sceneStartElapsedSeconds)
    this.sceneMaxCombo = Math.max(0, snapshot.sceneMaxCombo)
    this.stageStartElapsedSeconds = Math.max(0, snapshot.stageStartElapsedSeconds)
    this.stageMaxCombo = Math.max(0, snapshot.stageMaxCombo)
    this.intermission = this.restoreIntermission(snapshot.overlay)

    if (this.currentArena === 'boss') {
      this.enemy.health = clamp(snapshot.enemyHealth, 1, this.enemy.maxHealth)
    } else {
    this.restoreBasicProgress(snapshot.basicProgress)
    }

    this.cardRewards.flipCycle = clamp(snapshot.rewardFlipCycle, 0, CARD_FLIP_CYCLE_MAX)
    this.stageStart.awaitingShot = snapshot.awaitingStageStart
  }

  private loadStage(
    stageNumber: CampaignStageNumber,
    resetActors: boolean,
    suppressBossDialogue = false,
  ) {
    this.currentStageNumber = stageNumber
    this.currentStageDefinition = getCampaignStageDefinition(stageNumber, this.currentRoute)
    this.currentArena = this.currentStageDefinition.arena.kind
    this.intermission = { kind: 'none' }
    this.cardCombo = 0
    this.stageMaxCombo = 0
    this.playerBullets.length = 0
    this.enemyBullets.length = 0
    this.enemyBeams.length = 0
    this.rewardPickups.length = 0
    this.cards.length = 0
    this.stageObstacles.length = 0
    this.portalLockFrames = 0
    this.verticalBarsBlockedFrames = 0
    this.enemyOrbHitCooldown = 0
    this.bombCardCursor = 0
    this.topBounceStallFrames = 0
    this.stageStartElapsedSeconds = this.elapsedSeconds
    if (isSceneStartStage(stageNumber)) {
      this.sceneStartScore = this.score
      this.sceneStartElapsedSeconds = this.elapsedSeconds
      this.sceneMaxCombo = 0
    }
    resetPlayerActionState(this.playerAction)
    resetBombState(this.bomb)
    prepareStageStartState(
      this.stageStart,
      resolveStageShouldAwaitStart(
        this.services.stageMode,
        stageNumber,
        stageNumber === this.initialStageNumber || (resetActors && isSceneStartStage(stageNumber)),
      ),
    )

    if (this.currentArena === 'boss') {
      this.prepareBossStage(resetActors)
      if (!suppressBossDialogue) {
        this.openBossDialogue('before-boss', 'resume-boss')
      }
      return
    }

    this.prepareBasicStage(resetActors)
  }

  private prepareBasicStage(resetActors = false) {
    this.currentArena = 'basic'
    this.transitionTimer = 0
    this.transitionMessage = ''
    this.cardCombo = 0
    this.enemy.active = false
    this.enemy.health = 0
    this.enemy.patternTime = 0
    this.enemyBullets.length = 0
    this.enemyBeams.length = 0
    this.rewardPickups.length = 0
    this.cards.length = 0
    this.stageObstacles.length = 0
    this.portalLockFrames = 0
    this.verticalBarsBlockedFrames = 0
    this.bombCardCursor = 0

    if (resetActors) {
      resetPlayer(this.player)
      resetOrb(this.orb)
    }

    for (const resource of this.basicArenaDefinition.cards) {
      this.cards.push(createStageCard(resource))
    }

    for (const resource of this.basicArenaDefinition.obstacles) {
      if (resource.minRank && rankIndex(this.services.rank) < rankIndex(resource.minRank)) {
        continue
      }
      this.stageObstacles.push(createStageObstacle(resource))
    }
  }

  private prepareBossStage(resetActors = false) {
    this.currentArena = 'boss'
    this.transitionTimer = 0
    this.transitionMessage = ''
    this.cardCombo = 0
    this.cards.length = 0
    this.stageObstacles.length = 0
    this.enemyBullets.length = 0
    this.enemyBeams.length = 0
    this.rewardPickups.length = 0
    reviveEnemy(this.enemy)
    this.enemy.maxHealth = this.bossArenaDefinition.rankProfiles[this.services.rank].bossHealth
    this.enemy.health = this.enemy.maxHealth
    resetBossPatternState(this.bossPattern, this.bossRouteProfile.patternId, this.services.rank)
    if (resetActors) {
      resetPlayer(this.player)
      resetOrb(this.orb)
    }
  }

  private restoreBasicProgress(serialized: string | null) {
    if (!serialized) {
      return
    }

    const states = serialized.split('|')
    if (states.length !== this.cards.length) {
      return
    }

    for (let index = 0; index < this.cards.length; index += 1) {
      const [stateToken, flipsRaw, frameRaw] = states[index].split(':')
      const card = this.cards[index]
      const flipsRemaining = clamp(Number(flipsRaw) || 0, 0, card.maxFlips)
      const flipFrame = clamp(Number(frameRaw) || 0, 0, CARD_FLIP_DONE_FRAME)

      card.flipsRemaining = flipsRemaining
      card.flipFrame = flipFrame
      card.state =
        stateToken === 'f'
          ? 'flipping'
          : stateToken === 'r' || flipsRemaining === 0
            ? 'removed'
            : 'alive'
    }
  }

  private setArenaCleared(message: string) {
    if (this.services.stageMode === 'arcade' && this.currentArena === 'boss') {
      if (this.currentStageNumber === BOSS_STAGE_INTERVAL) {
        this.openBossDialogue('after-boss', 'route-select')
        return
      }

      if (this.currentStageNumber === CAMPAIGN_STAGE_COUNT) {
        this.openBossDialogue('after-boss', 'scene-total-final')
        return
      }

      if (this.currentStageNumber % BOSS_STAGE_INTERVAL === 0) {
        this.openBossDialogue('after-boss', 'scene-total')
        return
      }
    }

    if (this.services.stageMode === 'arcade') {
      const nextStageNumber = getNextCampaignStageNumber(this.currentStageNumber)
      if (nextStageNumber) {
        if (this.currentArena === 'basic') {
          this.openStageBonus(nextStageNumber)
          return
        }
        this.loadStage(nextStageNumber, true)
        this.transitionTimer = STAGE_TRANSITION_SECONDS
        this.transitionMessage = this.resolveStageTransitionMessage()
        this.services.onStatusChange('running', this.currentStatusMessage())
        this.emitSnapshot(true)
        return
      }
    }

    this.status = 'cleared'
    this.transitionMessage = message
    this.services.onStatusChange('cleared', message)
    this.emitSnapshot(true)
  }

  private updateIntermission() {
    if (
      this.intermission.kind === 'dialogue' &&
      this.dialogueAdvanceLock <= 0 &&
      this.services.input.consumePress('shoot')
    ) {
      const sequence = getBossDialogueSequence(
        this.intermission.stageNumber,
        this.intermission.phase,
        this.currentRoute,
        this.bossRouteProfile.bossName,
      )

      if (this.intermission.lineIndex < sequence.lines.length - 1) {
        this.intermission = {
          ...this.intermission,
          lineIndex: this.intermission.lineIndex + 1,
        }
        this.emitSnapshot(true)
        return
      }

      const nextStep = this.intermission.next

      if (nextStep === 'resume-boss') {
        this.intermission = { kind: 'none' }
        this.services.onStatusChange('running', this.currentStatusMessage())
        this.emitSnapshot(true)
        return
      }

      if (nextStep === 'route-select') {
        this.intermission = {
          kind: 'route-select',
          selectedRoute: this.currentRoute,
        }
        this.services.onStatusChange('running', this.currentStatusMessage())
        this.emitSnapshot(true)
        return
      }

      if (nextStep === 'scene-total') {
        this.openSceneTotal(false, this.bossRouteProfile.clearMessage)
        return
      }

      if (nextStep === 'ending') {
        this.openBossDialogue('ending', 'verdict')
        return
      }

      if (nextStep === 'verdict') {
        this.openVerdict()
        return
      }

      this.openSceneTotal(true, this.bossRouteProfile.clearMessage)
      return
    }

    if (this.intermission.kind === 'stage-bonus' && this.services.input.consumePress('shoot')) {
      const nextStageNumber = this.intermission.nextStageNumber
      this.intermission = { kind: 'none' }
      this.loadStage(nextStageNumber, true)
      this.transitionTimer = STAGE_TRANSITION_SECONDS
      this.transitionMessage = this.resolveStageTransitionMessage()
      this.services.onStatusChange('running', this.currentStatusMessage())
      this.emitSnapshot(true)
      return
    }

    if (this.intermission.kind === 'route-select') {
      if (
        this.services.input.consumePress('left') ||
        this.services.input.consumePress('up')
      ) {
        this.intermission = { kind: 'route-select', selectedRoute: 'route-a' }
      } else if (
        this.services.input.consumePress('right') ||
        this.services.input.consumePress('down')
      ) {
        this.intermission = { kind: 'route-select', selectedRoute: 'route-b' }
      } else if (this.services.input.consumePress('shoot')) {
        this.currentRoute = this.intermission.selectedRoute
        this.openSceneTotal(false, this.bossRouteProfile.clearMessage)
      }

      return
    }

    if (this.intermission.kind === 'scene-total' && this.services.input.consumePress('shoot')) {
      if (this.intermission.finalScene) {
        this.openBossDialogue('ending', 'verdict')
        return
      }

      const nextStageNumber = getNextCampaignStageNumber(this.currentStageNumber)
      if (!nextStageNumber) {
        return
      }

      this.intermission = { kind: 'none' }
      this.loadStage(nextStageNumber, true)
      this.services.onStatusChange('running', this.currentStatusMessage())
      this.emitSnapshot(true)
      return
    }

    if (this.intermission.kind === 'score-entry' && this.services.input.consumePress('shoot')) {
      if (this.intermission.flow === 'gameover') {
        this.openGameOverMenu()
        return
      }

      this.services.onReturnToTitle(true)
      return
    }

    if (this.intermission.kind === 'gameover-menu') {
      if (
        this.services.input.consumePress('left') ||
        this.services.input.consumePress('up')
      ) {
        this.intermission = { kind: 'gameover-menu', selectedAction: 'continue' }
        this.emitSnapshot(true)
        return
      }

      if (
        this.services.input.consumePress('right') ||
        this.services.input.consumePress('down')
      ) {
        this.intermission = { kind: 'gameover-menu', selectedAction: 'title' }
        this.emitSnapshot(true)
        return
      }

      if (this.services.input.consumePress('shoot')) {
        if (this.intermission.selectedAction === 'continue') {
          this.continueFromSceneStart()
          return
        }

        this.services.onReturnToTitle(true)
        return
      }
    }

    if (this.intermission.kind === 'verdict' && this.services.input.consumePress('shoot')) {
      this.openScoreEntry('ending')
    }
  }

  private openSceneTotal(finalScene: boolean, clearMessage: string) {
    const metrics = this.buildSceneTotalMetrics()
    this.addScore(metrics.total)
    const stageStart = getSceneStartStageNumber(this.currentStageNumber)
    this.intermission = {
      kind: 'scene-total',
      finalScene,
      clearMessage,
      stageStart,
      stageEnd: this.currentStageNumber,
      metrics,
    }
    this.transitionMessage = ''
    this.services.onStatusChange('running', this.currentStatusMessage())
    this.emitSnapshot(true)
  }

  private openBossDialogue(phase: BossDialoguePhase, next: DialogueAdvance) {
    this.services.input.clearBufferedPresses()
    this.dialogueAdvanceLock = DIALOGUE_ADVANCE_LOCK_SECONDS
    this.intermission = {
      kind: 'dialogue',
      phase,
      stageNumber: this.currentStageNumber,
      next,
      lineIndex: 0,
      endingKind: phase === 'ending' ? this.resolveEndingKind() : undefined,
    }
    this.transitionMessage = ''
    this.services.onStatusChange('running', this.currentStatusMessage())
    this.emitSnapshot(true)
  }

  private openStageBonus(nextStageNumber: CampaignStageNumber) {
    const metrics = this.buildStageBonusMetrics()
    this.addScore(metrics.total)
    this.intermission = {
      kind: 'stage-bonus',
      stageNumber: this.currentStageNumber,
      nextStageNumber,
      metrics,
    }
    this.transitionMessage = ''
    this.services.onStatusChange('running', this.currentStatusMessage())
    this.emitSnapshot(true)
  }

  private openGameOverMenu() {
    this.intermission = {
      kind: 'gameover-menu',
      selectedAction: 'continue',
    }
    this.transitionMessage = ''
    this.services.onStatusChange('running', this.currentStatusMessage())
    this.emitSnapshot(true)
  }

  private openScoreEntry(flow: ScoreEntryFlow) {
    this.intermission = {
      kind: 'score-entry',
      flow,
      pendingHighScore: this.services.shouldPromptScoreEntry(),
    }
    this.transitionMessage = ''
    this.services.onStatusChange('running', this.currentStatusMessage())
    this.emitSnapshot(true)
  }

  private openVerdict() {
    this.intermission = {
      kind: 'verdict',
      metrics: this.buildEndingVerdictMetrics(),
    }
    this.transitionMessage = ''
    this.services.onStatusChange('running', this.currentStatusMessage())
    this.emitSnapshot(true)
  }

  private buildStageBonusMetrics(): StageBonusMetrics {
    const time = Math.min(6553, Math.max(0, Math.floor(this.currentStageElapsedSeconds() * 3)))
    const combo = Math.min(6553, Math.max(0, this.stageMaxCombo * 100))
    const resources = Math.min(6553, Math.max(0, this.lives * 200 + this.bombs * 100))
    const stage = Math.min(6553, Math.max(0, (this.currentStageNumber - 1) * 200))
    return {
      time,
      combo,
      resources,
      stage,
      total: (time + combo + resources + stage) * 10,
    }
  }

  private buildSceneTotalMetrics(): SceneTotalMetrics {
    const time = Math.min(6553, Math.max(0, Math.floor(this.currentSceneElapsedSeconds() * 5)))
    const combo = Math.min(6553, Math.max(0, this.sceneMaxCombo * 200))
    const resources = Math.min(6553, Math.max(0, this.lives * 500 + this.bombs * 200))
    const stage = Math.min(65530, Math.max(0, this.currentStageNumber * 1000))

    return {
      time,
      combo,
      resources,
      stage,
      total: (time + combo + resources + stage) * 10,
    }
  }

  private buildEndingVerdictMetrics(): EndingVerdictMetrics {
    return {
      endingKind: this.resolveEndingKind(),
      highScore: this.services.getRecordedHighScore(),
      score: this.score,
      rank: this.services.rank.toUpperCase(),
      sceneContinueCounts: [...this.sceneContinueCounts],
      totalContinues: this.totalContinues,
      resources: `${this.lives} / ${this.bombs}`,
    }
  }

  private resolveEndingKind(): EndingKind {
    return this.totalContinues === 0 ? 'good' : 'bad'
  }

  private continueFromSceneStart() {
    const sceneStartStage =
      this.services.stageMode === 'arcade'
        ? getSceneStartStageNumber(this.currentStageNumber)
        : this.initialStageNumber

    const sceneIndex = Math.max(1, getSceneIndex(sceneStartStage))
    this.sceneContinueCounts[sceneIndex - 1] =
      (this.sceneContinueCounts[sceneIndex - 1] ?? 0) + 1
    this.totalContinues += 1

    this.status = 'running'
    this.transitionTimer = 0
    this.transitionMessage = ''
    this.lives = clamp(this.services.startLives, 0, MAX_LIVES)
    this.bombs = START_BOMBS
    this.cardCombo = 0
    this.pointValue = 0
    this.playerBullets.length = 0
    this.enemyBullets.length = 0
    this.enemyBeams.length = 0
    this.rewardPickups.length = 0
    this.enemyOrbHitCooldown = 0
    this.portalLockFrames = 0
    this.verticalBarsBlockedFrames = 0
    this.bombCardCursor = 0
    this.topBounceStallFrames = 0
    this.intermission = { kind: 'none' }
    resetPlayerActionState(this.playerAction)
    resetBombState(this.bomb)
    resetCardRewardState(this.cardRewards, 0)
    resetPlayer(this.player)
    resetOrb(this.orb)
    syncExtendState(this.extend, this.score, this.lives)
    this.loadStage(sceneStartStage, true)
    this.services.onStatusChange('running', this.currentStatusMessage())
    this.emitSnapshot(true)
  }

  private currentSceneElapsedSeconds() {
    return Math.max(0, this.elapsedSeconds - this.sceneStartElapsedSeconds)
  }

  private currentStageElapsedSeconds() {
    return Math.max(0, this.elapsedSeconds - this.stageStartElapsedSeconds)
  }

  private resolveStageTransitionMessage() {
    return this.currentArena === 'boss'
      ? `제 ${this.currentStageNumber}면 보스`
      : `제 ${this.currentStageNumber}면`
  }

  private resolvePhaseLabel() {
    return this.currentArena === 'boss' ? '보스전' : '일반전'
  }

  private addScore(amount: number) {
    if (amount <= 0) {
      return
    }

    const gainedLife = applyScore(this.extend, amount)
    this.score = this.extend.score
    this.lives = this.extend.lives

    if (gainedLife) {
      this.raisePelletSpeed()
      appAudio.playSfx('extend')
    }

    if (gainedLife && this.status === 'running' && this.transitionTimer <= 0) {
      this.services.onStatusChange('running', '잔기가 늘었습니다')
    }
  }

  private raisePelletSpeed() {
    this.pelletSpeedBonus += PELLET_SPEED_RAISE_STEP

    for (const bullet of this.enemyBullets) {
      this.applyPelletSpeedBoost(bullet, PELLET_SPEED_RAISE_STEP)
    }
  }

  private applyPelletSpeedBoost(bullet: BulletModel, bonus = this.pelletSpeedBonus) {
    if (bullet.kind !== 'pellet' || bonus <= 0) {
      return bullet
    }

    const speed = Math.hypot(bullet.velocity.x, bullet.velocity.y)
    if (speed <= 0) {
      return bullet
    }

    const nextSpeed = speed + bonus
    bullet.velocity.x = (bullet.velocity.x / speed) * nextSpeed
    bullet.velocity.y = (bullet.velocity.y / speed) * nextSpeed
    return bullet
  }

  private spawnFloatingPopup(
    text: string,
    x: number,
    y: number,
    accent: 'bright' | 'soft',
    lifetime: number,
    velocityY: number,
  ) {
    this.floatingPopups.push({
      id: this.nextPopupId++,
      text,
      x,
      y,
      ttl: lifetime,
      lifetime,
      velocityY,
      accent,
    })
  }

  private updateFloatingPopups(deltaSeconds: number) {
    for (const popup of this.floatingPopups) {
      popup.ttl = Math.max(0, popup.ttl - deltaSeconds)
      popup.y -= popup.velocityY * deltaSeconds
    }

    for (let index = this.floatingPopups.length - 1; index >= 0; index -= 1) {
      if (this.floatingPopups[index].ttl <= 0) {
        this.floatingPopups.splice(index, 1)
      }
    }
  }

  private currentStatusMessage() {
    if (this.status === 'paused') {
      return '일시 정지 중입니다'
    }

    if (this.status === 'cleared') {
      return this.transitionMessage
    }

      if (this.intermission.kind === 'route-select') {
        return '다음 방향을 선택합니다'
      }

    if (this.intermission.kind === 'dialogue') {
      return '대화를 진행합니다'
    }

    if (this.intermission.kind === 'stage-bonus') {
      return '스테이지 보너스를 집계합니다'
    }

    if (this.intermission.kind === 'scene-total') {
      return '총계를 집계합니다'
    }

    if (this.intermission.kind === 'gameover-menu') {
      return '이어하기 여부를 선택합니다'
    }

    if (this.intermission.kind === 'verdict') {
      return '최종 결과를 정리합니다'
    }

    if (this.intermission.kind === 'score-entry') {
      return this.intermission.flow === 'gameover'
        ? '게임 오버 이후 점수를 정리합니다'
        : '엔딩 이후 점수를 정리합니다'
    }

    if (this.transitionTimer > 0) {
      return this.transitionMessage
    }

    if (this.bomb.active) {
      return '폭탄을 전개하는 중입니다'
    }

    if (this.stageStart.awaitingShot) {
      return `제 ${this.currentStageNumber}면입니다. ${gameplayTerminology.controls.shotKeyLabel}로 시작합니다`
    }

    return ''
  }

  private emitSnapshot(force = false) {
    const [enemyHealth, enemyMaxHealth] =
      this.currentArena === 'boss'
        ? [this.enemy.active ? this.enemy.health : 0, this.enemy.maxHealth]
        : [
            this.cards.reduce((sum, card) => sum + card.flipsRemaining, 0),
            this.cards.reduce((sum, card) => sum + card.maxFlips, 0),
          ]

    const snapshot: GameHudSnapshot = {
      status: this.status,
      message: this.currentStatusMessage(),
      arenaKind: this.currentArena,
      currentRoute: this.currentRoute,
      score: this.score,
      lives: this.lives,
      bombs: this.bombs,
      campaignStageNumber: this.currentStageNumber,
      enemyHealth,
      enemyMaxHealth,
      elapsedSeconds: Number(this.elapsedSeconds.toFixed(1)),
      shotsFired: this.shotsFired,
      cardCombo: this.cardCombo,
      phaseLabel: this.resolvePhaseLabel(),
      basicProgress: this.currentArena === 'basic' ? serializeBasicProgress(this.cards) : null,
      awaitingStageStart: this.stageStart.awaitingShot,
      rewardFlipCycle: this.cardRewards.flipCycle,
      pointValue: this.pointValue,
      pelletSpeedBonus: this.pelletSpeedBonus,
      sceneStartScore: this.sceneStartScore,
      sceneStartElapsedSeconds: this.sceneStartElapsedSeconds,
      sceneMaxCombo: this.sceneMaxCombo,
      stageStartElapsedSeconds: this.stageStartElapsedSeconds,
      stageMaxCombo: this.stageMaxCombo,
      sceneContinueCounts: [...this.sceneContinueCounts],
      totalContinues: this.totalContinues,
      overlay: this.createOverlaySnapshot(),
    }

    this.services.onSnapshot(snapshot)

    if (force) {
      this.services.onStatusChange(snapshot.status, snapshot.message)
    }
  }

  private createOverlaySnapshot(): GameOverlaySnapshot {
    if (this.intermission.kind === 'dialogue') {
      const dialogue = getBossDialogueSequence(
        this.intermission.stageNumber,
        this.intermission.phase,
        this.currentRoute,
        this.bossRouteProfile.bossName,
        this.intermission.endingKind ?? this.resolveEndingKind(),
      )
      const line = dialogue.lines[this.intermission.lineIndex] ?? dialogue.lines[dialogue.lines.length - 1]
      return {
        kind: 'dialogue',
        stateKey: `${this.intermission.phase}:${this.intermission.stageNumber}:${this.intermission.next}:${this.intermission.lineIndex}:${this.intermission.endingKind ?? this.resolveEndingKind()}`,
        title: dialogue.title,
        subtitle: `${this.intermission.lineIndex + 1} / ${dialogue.lines.length}`,
        body: line?.text ?? '',
        prompt: dialogue.prompt,
        speaker: line?.speaker ?? '',
        choices: [],
        stats: [],
      }
    }

    if (this.intermission.kind === 'stage-bonus') {
      return {
        kind: 'stage-bonus',
        stateKey: [
          this.intermission.stageNumber,
          this.intermission.nextStageNumber,
          this.intermission.metrics.time,
          this.intermission.metrics.combo,
          this.intermission.metrics.resources,
          this.intermission.metrics.stage,
          this.intermission.metrics.total,
        ].join(':'),
        title: stageBonusText.title,
        subtitle: `${stageBonusText.subtitlePrefix} ${this.intermission.stageNumber}`,
        body: '',
        prompt: stageBonusText.prompt,
        speaker: '',
        choices: [],
        stats: [
          { label: stageBonusText.labels.time, value: this.intermission.metrics.time.toLocaleString() },
          { label: stageBonusText.labels.combo, value: this.intermission.metrics.combo.toLocaleString() },
          {
            label: stageBonusText.labels.resources,
            value: this.intermission.metrics.resources.toLocaleString(),
          },
          { label: stageBonusText.labels.stage, value: this.intermission.metrics.stage.toLocaleString() },
          { label: stageBonusText.labels.total, value: this.intermission.metrics.total.toLocaleString() },
        ],
      }
    }

    if (this.intermission.kind === 'route-select') {
      return {
        kind: 'route-select',
        stateKey: this.intermission.selectedRoute,
        title: '방향 선택',
        subtitle: '기둥 이변에 어떤 태도로 맞설지 고릅니다.',
        body: '',
        prompt: `${gameplayTerminology.controls.shotKeyLabel}로 결정 / ← → 이동`,
        speaker: '',
        choices: [
          {
            id: 'route-a',
            label: getRouteMenuLabel('route-a'),
            active: this.intermission.selectedRoute === 'route-a',
          },
          {
            id: 'route-b',
            label: getRouteMenuLabel('route-b'),
            active: this.intermission.selectedRoute === 'route-b',
          },
        ],
        stats: [
          { label: '현재 점수', value: this.score.toLocaleString() },
          { label: '잔기 / 폭탄', value: `${this.lives} / ${this.bombs}` },
        ],
      }
    }

    if (this.intermission.kind === 'scene-total') {
      return {
        kind: 'scene-total',
        stateKey: [
          `${this.intermission.stageStart}-${this.intermission.stageEnd}`,
          this.intermission.finalScene ? 'final' : 'mid',
          this.intermission.metrics.time,
          this.intermission.metrics.combo,
          this.intermission.metrics.resources,
          this.intermission.metrics.stage,
          this.intermission.metrics.total,
        ].join(':'),
        title: this.intermission.finalScene ? sceneTotalText.finalTitle : sceneTotalText.title,
        subtitle: `${sceneTotalText.subtitlePrefix} ${this.intermission.stageEnd}`,
        body: '',
        prompt: sceneTotalText.prompt,
        speaker: '',
        choices: [],
        stats: [
          { label: sceneTotalText.labels.time, value: this.intermission.metrics.time.toLocaleString() },
          { label: sceneTotalText.labels.combo, value: this.intermission.metrics.combo.toLocaleString() },
          {
            label: sceneTotalText.labels.resources,
            value: this.intermission.metrics.resources.toLocaleString(),
          },
          { label: sceneTotalText.labels.stage, value: this.intermission.metrics.stage.toLocaleString() },
          { label: sceneTotalText.labels.total, value: this.intermission.metrics.total.toLocaleString() },
        ],
      }
    }

    if (this.intermission.kind === 'gameover-menu') {
      return {
        kind: 'gameover-menu',
        stateKey: this.intermission.selectedAction,
        title: '게임 오버',
        subtitle: '점수 정리 후 이어하기 여부를 고릅니다.',
        body: '',
        prompt: `${gameplayTerminology.controls.shotKeyLabel}로 결정 / ← → 이동`,
        speaker: '',
        choices: [
          {
            id: 'continue',
            label: gameplayTerminology.menuLabels.continueGame,
            active: this.intermission.selectedAction === 'continue',
          },
          {
            id: 'title',
            label: gameplayTerminology.menuLabels.backToTitle,
            active: this.intermission.selectedAction === 'title',
          },
        ],
        stats: [
          { label: '현재 점수', value: this.score.toLocaleString() },
          { label: '현재 면', value: `제 ${this.currentStageNumber}면` },
          ...buildSceneContinueStats(this.sceneContinueCounts),
          { label: '전체 이어하기', value: this.totalContinues.toLocaleString() },
          { label: '잔기 / 폭탄', value: `${this.lives} / ${this.bombs}` },
        ],
      }
    }

    if (this.intermission.kind === 'verdict') {
      return {
        kind: 'verdict',
        stateKey: [
          this.intermission.metrics.endingKind,
          this.intermission.metrics.highScore,
          this.intermission.metrics.score,
          this.intermission.metrics.rank,
          serializeSceneContinueCounts(this.intermission.metrics.sceneContinueCounts),
          this.intermission.metrics.totalContinues,
          this.intermission.metrics.resources,
        ].join(':'),
        title: this.intermission.metrics.endingKind === 'good' ? '굿 엔딩 판정' : '배드 엔딩 판정',
        subtitle: `${getRouteBranchLabel(this.currentRoute)} 결과`,
        body:
          this.intermission.metrics.endingKind === 'good'
            ? '이어하기 없이 완주했습니다. 최종 결과를 정리합니다.'
            : '이어하기를 사용한 완주입니다. 최종 결과를 정리합니다.',
        prompt: `${gameplayTerminology.controls.shotKeyLabel}로 진행`,
        speaker: '',
        choices: [],
        stats: [
          {
            label: '엔딩',
            value: this.intermission.metrics.endingKind === 'good' ? '굿 엔딩' : '배드 엔딩',
          },
          { label: '최고 점수', value: this.intermission.metrics.highScore.toLocaleString() },
          { label: '현재 점수', value: this.intermission.metrics.score.toLocaleString() },
          { label: '난이도', value: this.intermission.metrics.rank },
          ...buildSceneContinueStats(this.intermission.metrics.sceneContinueCounts),
          { label: '전체 이어하기', value: this.intermission.metrics.totalContinues.toLocaleString() },
          { label: '잔기 / 폭탄', value: this.intermission.metrics.resources },
        ],
      }
    }

    if (this.intermission.kind === 'score-entry') {
      const isGameOverFlow = this.intermission.flow === 'gameover'
      return {
        kind: 'score-entry',
        stateKey: `${this.intermission.flow}:${this.intermission.pendingHighScore ? 'pending' : 'plain'}`,
        title: isGameOverFlow ? '기록 정리' : '이름 등록',
        subtitle: isGameOverFlow ? '게임 오버 이후 처리' : '타이틀에서 이어집니다',
        body: this.intermission.pendingHighScore
          ? '이번 점수는 최고 점수로 저장되었습니다. 타이틀에서 등록 이름을 바로 바꿀 수 있습니다.'
          : isGameOverFlow
            ? '현재 점수를 정리한 뒤 이어하기 여부를 고를 수 있습니다.'
            : '현재 결과를 정리한 뒤 타이틀로 돌아갑니다.',
        prompt: isGameOverFlow
          ? `${gameplayTerminology.controls.shotKeyLabel}로 계속`
          : `${gameplayTerminology.controls.shotKeyLabel}로 타이틀 이동`,
        speaker: '',
        choices: [],
        stats: [
          { label: '현재 점수', value: this.score.toLocaleString() },
          { label: '난이도', value: this.services.rank.toUpperCase() },
        ],
      }
    }

    return {
      kind: 'none',
      stateKey: '',
      title: '',
      subtitle: '',
      body: '',
      prompt: '',
      speaker: '',
      choices: [],
      stats: [],
    }
  }

  private restoreIntermission(overlay: GameOverlaySnapshot): IntermissionState {
    if (overlay.kind === 'dialogue') {
      const [phaseRaw, stageRaw, nextRaw, lineIndexRaw, endingKindRaw] = overlay.stateKey.split(':')
      const stageNumber = normalizeCampaignStageNumber(Number(stageRaw)) ?? this.currentStageNumber
      const phase: BossDialoguePhase =
        phaseRaw === 'after-boss' || phaseRaw === 'ending' ? phaseRaw : 'before-boss'
      const endingKind: EndingKind = endingKindRaw === 'bad' ? 'bad' : 'good'
      const next: DialogueAdvance =
        nextRaw === 'route-select' ||
        nextRaw === 'scene-total-final' ||
        nextRaw === 'ending' ||
        nextRaw === 'verdict'
          ? nextRaw
          : 'resume-boss'

      return {
        kind: 'dialogue',
        phase,
        stageNumber,
        next,
        lineIndex: Math.max(0, Number(lineIndexRaw) || 0),
        endingKind,
      }
    }

    if (overlay.kind === 'stage-bonus') {
      const [
        stageRaw,
        nextStageRaw,
        timeRaw,
        comboRaw,
        resourcesRaw,
        stageValueRaw,
        totalRaw,
      ] = overlay.stateKey.split(':')
      const stageNumber = normalizeCampaignStageNumber(Number(stageRaw)) ?? this.currentStageNumber
      const nextStageNumber =
        normalizeCampaignStageNumber(Number(nextStageRaw)) ??
        getNextCampaignStageNumber(stageNumber) ??
        stageNumber

      return {
        kind: 'stage-bonus',
        stageNumber,
        nextStageNumber,
        metrics: {
          time: Math.max(0, Number(timeRaw) || 0),
          combo: Math.max(0, Number(comboRaw) || 0),
          resources: Math.max(0, Number(resourcesRaw) || 0),
          stage: Math.max(0, Number(stageValueRaw) || 0),
          total: Math.max(0, Number(totalRaw) || 0),
        },
      }
    }

    if (overlay.kind === 'route-select') {
      return {
        kind: 'route-select',
        selectedRoute: overlay.stateKey === 'route-b' ? 'route-b' : 'route-a',
      }
    }

    if (overlay.kind === 'scene-total') {
      const [
        stageRange,
        finalToken,
        timeRaw,
        comboRaw,
        resourcesRaw,
        stageValueRaw,
        totalRaw,
      ] = overlay.stateKey.split(':')
      const [stageStartRaw, stageEndRaw] = stageRange.split('-')
      const stageStart = Number(stageStartRaw)
      const stageEnd = Number(stageEndRaw)

      return {
        kind: 'scene-total',
        finalScene: finalToken === 'final',
        clearMessage: this.currentArena === 'boss' ? this.bossRouteProfile.clearMessage : overlay.body,
        stageStart: Number.isFinite(stageStart)
          ? stageStart
          : getSceneStartStageNumber(this.currentStageNumber),
        stageEnd: Number.isFinite(stageEnd) ? stageEnd : this.currentStageNumber,
        metrics: {
          time: Math.max(0, Number(timeRaw) || 0),
          combo: Math.max(0, Number(comboRaw) || 0),
          resources: Math.max(0, Number(resourcesRaw) || 0),
          stage: Math.max(0, Number(stageValueRaw) || 0),
          total: Math.max(0, Number(totalRaw) || 0),
        },
      }
    }

    if (overlay.kind === 'gameover-menu') {
      return {
        kind: 'gameover-menu',
        selectedAction: overlay.stateKey === 'title' ? 'title' : 'continue',
      }
    }

    if (overlay.kind === 'verdict') {
      const verdictParts = overlay.stateKey.split(':')
      const endingKindRaw = verdictParts[0]
      const highScoreRaw = verdictParts[1]
      const scoreRaw = verdictParts[2]
      const rank = verdictParts[3]
      const sceneContinueCountsRaw = verdictParts[4] ?? ''
      const totalContinuesRaw = verdictParts[5]
      const resourcesParts = verdictParts.slice(6)

      return {
        kind: 'verdict',
        metrics: {
          endingKind: endingKindRaw === 'bad' ? 'bad' : 'good',
          highScore: Math.max(0, Number(highScoreRaw) || 0),
          score: Math.max(0, Number(scoreRaw) || 0),
          rank: rank || this.services.rank.toUpperCase(),
          sceneContinueCounts: deserializeSceneContinueCounts(sceneContinueCountsRaw),
          totalContinues: Math.max(0, Number(totalContinuesRaw) || 0),
          resources: resourcesParts.join(':') || `${this.lives} / ${this.bombs}`,
        },
      }
    }

    if (overlay.kind === 'score-entry') {
      const [flowRaw, pendingRaw] = overlay.stateKey.split(':')
      return {
        kind: 'score-entry',
        flow: flowRaw === 'ending' ? 'ending' : 'gameover',
        pendingHighScore: pendingRaw === 'pending',
      }
    }

    return { kind: 'none' }
  }

  private render() {
    this.updateBackdrop()

    this.background.clear()
    this.background.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill(0x000000)

    this.arena.clear()
    this.arena.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({
      color: 0x000000,
      alpha: BACKDROP_FILM_ALPHA,
    })
    this.arena
      .rect(PLAYFIELD_LEFT, PLAYFIELD_TOP, PLAYFIELD_WIDTH, PLAYFIELD_HEIGHT)
      .fill({ color: PLAYFIELD_OUTER_OVERLAY_COLOR, alpha: PLAYFIELD_OUTER_OVERLAY_ALPHA })
    this.arena.rect(
      PLAYFIELD_LEFT + FIELD_INSET,
      PLAYFIELD_TOP + FIELD_INSET,
      PLAYFIELD_WIDTH - FIELD_INSET * 2,
      PLAYFIELD_HEIGHT - FIELD_INSET * 2,
    ).fill({ color: PLAYFIELD_INNER_OVERLAY_COLOR, alpha: PLAYFIELD_INNER_OVERLAY_ALPHA })

    if (this.currentArena === 'basic') {
      this.renderBasicArena()
    } else {
      this.renderBossArena()
    }

    this.playerBulletGraphics.clear()
    for (const bullet of this.playerBullets) {
      const bulletX = snapToStep(bullet.position.x, PLAYER_RENDER_SNAP)

      this.playerBulletGraphics.rect(bulletX - 2, bullet.position.y - 12, 4, 16).fill(0xffffff)
      this.playerBulletGraphics.rect(bulletX - 1, bullet.position.y - 14, 2, 20).fill(0x3a3a3a)
    }

    this.enemyBulletGraphics.clear()
    for (const beam of this.enemyBeams) {
      const damaging = isBossBeamDamaging(beam)
      const outerAlpha = damaging ? 0.88 : 0.3
      const innerAlpha = damaging ? 0.9 : 0.42
      const outerWidth = damaging ? beam.width + 4 : beam.width + 1
      const innerWidth = damaging ? beam.width : Math.max(2, beam.width - 2)

      this.enemyBulletGraphics
        .moveTo(beam.start.x, beam.start.y)
        .lineTo(beam.end.x, beam.end.y)
        .stroke({
          width: outerWidth,
          color: damaging ? 0xf2f2f2 : 0x5e5e5e,
          alpha: outerAlpha,
        })
      this.enemyBulletGraphics
        .moveTo(beam.start.x, beam.start.y)
        .lineTo(beam.end.x, beam.end.y)
        .stroke({
          width: innerWidth,
          color: damaging ? 0xffffff : 0xbdbdbd,
          alpha: innerAlpha,
        })
    }
    for (const bullet of this.enemyBullets) {
      this.enemyBulletGraphics.circle(bullet.position.x, bullet.position.y, bullet.radius).stroke({
        width: 1,
        color: 0xffffff,
      })
      this.enemyBulletGraphics.circle(bullet.position.x, bullet.position.y, Math.max(2, bullet.radius - 3)).fill(0x2d2d2d)
    }

    this.playerGraphics.clear()
    const playerX = snapToStep(this.player.position.x, PLAYER_RENDER_SNAP)
    const playerY = this.player.position.y
    const playerTint =
      this.player.invulnerability > 0 && Math.floor(this.player.invulnerability * 14) % 2 === 0
        ? 0xffffff
        : 0xcccccc

    this.playerGraphics.rect(playerX - 16, playerY - 16, 32, 32).fill(0xf0f0f0)
    this.playerGraphics.rect(playerX - 16, playerY - 16, 32, 12).fill(0x111111)
    this.playerGraphics.rect(playerX - 22, playerY - 4, 12, 14).fill(0xffffff)
    this.playerGraphics.rect(playerX + 10, playerY - 4, 12, 14).fill(0xffffff)
    this.playerGraphics.rect(playerX - 8, playerY - 2, 16, 18).fill(0x3a3a3a)
    this.playerGraphics.rect(playerX - 4, playerY - 18, 8, 6).fill(playerTint)

    if (playerTint !== 0xcccccc) {
      this.playerGraphics.rect(playerX - 16, playerY - 16, 32, 32).stroke({
        width: 1,
        color: 0xffffff,
      })
    }

    if (this.services.shouldShowHitboxes() || this.playerAction.deflecting) {
      this.playerGraphics.circle(playerX, playerY, PLAYER_HITBOX_RADIUS).fill(0xffffff)
    }

    this.effectsGraphics.clear()
    const orbX = snapToStep(this.orb.position.x, PLAYER_RENDER_SNAP)
    const orbY = this.orb.position.y

    this.effectsGraphics.circle(orbX, orbY, this.orb.radius + 1).fill(0xffffff)
    this.effectsGraphics.circle(orbX, orbY, this.orb.radius - 4).fill(0x1d1d1d)
    this.effectsGraphics.circle(orbX, orbY, 3).fill(0xd9d9d9)

    if (this.bomb.active) {
      const playerX = snapToStep(this.player.position.x, PLAYER_RENDER_SNAP)
      const playerY = this.player.position.y
      const chargeRatio = Math.min(1, this.bomb.frame / 50)
      const bombRadius = this.bomb.damaging
        ? 48 + Math.sin(this.elapsedSeconds * 18) * 6
        : 18 + chargeRatio * 20
      const flashAlpha = this.bomb.damaging ? 0.12 : 0.04 + chargeRatio * 0.08
      this.effectsGraphics.rect(PLAYFIELD_LEFT, PLAYFIELD_TOP, PLAYFIELD_WIDTH, PLAYFIELD_HEIGHT).fill({
        color: 0xffffff,
        alpha: flashAlpha,
      })
      this.effectsGraphics.circle(playerX, playerY, bombRadius).stroke({
        width: 2,
        color: 0xffffff,
      })
      this.effectsGraphics.circle(playerX, playerY, Math.max(10, bombRadius - 14)).stroke({
        width: 1,
        color: 0xffffff,
        alpha: this.bomb.damaging ? 0.9 : 0.45,
      })
      if (this.bomb.damaging) {
        this.effectsGraphics.circle(playerX, playerY, bombRadius + 16).stroke({
          width: 1,
          color: 0xbdbdbd,
          alpha: 0.65,
        })
      }
    }

    this.renderRewardPickups()
    this.renderFloatingPopups()

    if (this.playerAction.deflecting && this.status === 'running') {
      this.effectsGraphics.circle(orbX, orbY, this.orb.radius + 8).stroke({
        width: 1,
        color: 0xffffff,
      })
    }
  }

  private updateBackdrop() {
    const textureUrl = backgroundManifest[
      resolveBackgroundTrackId(this.currentStageNumber, this.currentArena, this.currentRoute)
    ]
    const nextTexture = this.getLoadedTexture(textureUrl)

    if (!nextTexture) {
      return
    }

    if (this.backdrop.texture !== nextTexture) {
      this.backdrop.texture = nextTexture
    }

    const textureWidth = Math.max(1, nextTexture.width)
    const textureHeight = Math.max(1, nextTexture.height)
    const playfieldCenterY = PLAYFIELD_TOP + PLAYFIELD_HEIGHT / 2

    this.backdrop.width = GAME_WIDTH
    this.backdrop.height = GAME_HEIGHT
    this.backdrop.position.set(0, 0)
    this.backdrop.tileScale.set(1, 1)
    this.backdrop.tilePosition.set(
      PLAYFIELD_CENTER_X - textureWidth / 2,
      playfieldCenterY - textureHeight / 2,
    )
    this.backdrop.alpha = BACKDROP_ALPHA
    this.backdrop.tint = 0xffffff
  }

  private renderBasicArena() {
    const palette = this.currentStageDefinition.palette

    for (const obstacle of this.stageObstacles) {
      const flashColor = obstacle.flashFrames > 0 ? 0xffffff : palette.bumperInner

      if (obstacle.type === 'portal') {
        const pulse = 4 + Math.abs(Math.sin(this.elapsedSeconds * 4)) * 8
        this.arena.rect(obstacle.x, obstacle.y, obstacle.width, obstacle.height).stroke({
          width: 2,
          color: 0xffffff,
        })
        this.arena.rect(
          obstacle.x + pulse / 2,
          obstacle.y + pulse / 2,
          obstacle.width - pulse,
          obstacle.height - pulse,
        ).stroke({
          width: 1,
          color: 0x8a8a8a,
        })
        continue
      }

      if (obstacle.type === 'turret_slow' || obstacle.type === 'turret_quick') {
        this.arena.rect(obstacle.x, obstacle.y, obstacle.width, obstacle.height).fill(0x141414)
        this.arena.rect(obstacle.x, obstacle.y, obstacle.width, obstacle.height).stroke({
          width: 2,
          color: 0xffffff,
        })
        this.arena.rect(obstacle.x + 12, obstacle.y + 4, 8, 24).fill(flashColor)
        continue
      }

      if (obstacle.type === 'bumper') {
        this.arena.rect(obstacle.x - 4, obstacle.y - 4, obstacle.width + 8, obstacle.height + 8).fill(
          palette.bumperOuter,
        )
        this.arena.rect(obstacle.x, obstacle.y, obstacle.width, obstacle.height).fill(flashColor)
        continue
      }

      this.arena.rect(obstacle.x, obstacle.y, obstacle.width, obstacle.height).fill(0x2a2a2a)
      this.arena.rect(obstacle.x, obstacle.y, obstacle.width, obstacle.height).stroke({
        width: 1,
        color: flashColor,
      })
    }

    this.enemyGraphics.clear()
    for (const card of this.cards) {
      if (card.state === 'removed') {
        continue
      }

      const cardCenterX = card.x + STAGE_TILE_SIZE / 2
      const hpRatio = card.maxFlips > 0 ? card.flipsRemaining / card.maxFlips : 0
      const widthScale =
        card.state === 'flipping'
          ? card.flipFrame < CARD_EDGE_FRAME
            ? 1 - (card.flipFrame / CARD_EDGE_FRAME) * 0.85
            : 0.15 + ((card.flipFrame - CARD_EDGE_FRAME) / (CARD_FLIP_DONE_FRAME - CARD_EDGE_FRAME)) * 0.85
          : 1
      const cardWidth = Math.max(4, Math.round(STAGE_TILE_SIZE * widthScale))
      const left = cardCenterX - cardWidth / 2
      const coreFill = hpRatio > 0.66 ? 0xffffff : hpRatio > 0.33 ? 0xaaaaaa : 0x5c5c5c

      this.enemyGraphics.rect(left, card.y, cardWidth, STAGE_TILE_SIZE).fill(palette.targetFill)
      this.enemyGraphics.rect(left, card.y, cardWidth, STAGE_TILE_SIZE).stroke({
        width: 2,
        color: palette.targetStroke,
      })
      this.enemyGraphics.rect(left + 4, card.y + 4, Math.max(2, cardWidth - 8), STAGE_TILE_SIZE - 8).fill(coreFill)

      for (let pip = 0; pip < card.flipsRemaining; pip += 1) {
        this.enemyGraphics.rect(card.x + 4 + pip * 6, card.y + STAGE_TILE_SIZE - 6, 4, 2).fill(0xffffff)
      }
    }
  }

  private renderRewardPickups() {
    this.rewardPickupLayer.removeChildren().forEach((child) => child.destroy())

    for (const pickup of this.rewardPickups) {
      if (pickup.state === 'splash') {
        const splash = new Graphics()
        splash.circle(pickup.position.x, pickup.position.y, pickup.splashRadius).stroke({
          width: 1,
          color: 0xffffff,
          alpha: 0.75,
        })
        this.rewardPickupLayer.addChild(splash)
        continue
      }

      const texture = this.getLoadedTexture(
        pickup.type === 'bomb' ? itemBombSvgUrl : itemPointSvgUrl,
      )
      if (!texture) {
        continue
      }
      const sprite = new Sprite(texture)
      sprite.anchor.set(0.5)
      sprite.position.set(pickup.position.x, pickup.position.y)
      sprite.width = 18
      sprite.height = 18
      sprite.alpha = pickup.type === 'bomb' ? 0.92 : 0.98
      this.rewardPickupLayer.addChild(sprite)
    }
  }

  private async primeSpriteTextures() {
    const urls = [...new Set([...Object.values(backgroundManifest), itemBombSvgUrl, itemPointSvgUrl])]

    for (const url of urls) {
      if (this.loadedTextures.has(url)) {
        continue
      }

      const asset = await Assets.load(url)
      const texture = asset instanceof Texture ? asset : Texture.from(url)
      this.loadedTextures.set(url, texture)
    }
  }

  private getLoadedTexture(url: string) {
    return this.loadedTextures.get(url) ?? null
  }

  private renderFloatingPopups() {
    this.popupLayer.removeChildren().forEach((child) => child.destroy())

    for (const popup of this.floatingPopups) {
      const alpha = Math.max(0, popup.ttl / popup.lifetime)
      const fontSize = popup.text === 'BOMB' ? 14 : 16
      const shadow = new Text(popup.text, {
        fill: 0x111111,
        fontFamily: 'monospace',
        fontSize,
        fontWeight: '700',
        letterSpacing: 1,
      })
      shadow.anchor.set(0.5)
      shadow.position.set(popup.x + 1, popup.y + 1)
      shadow.alpha = alpha * 0.82
      this.popupLayer.addChild(shadow)

      const text = new Text(popup.text, {
        fill: popup.accent === 'bright' ? 0xffffff : 0xc8c8c8,
        fontFamily: 'monospace',
        fontSize,
        fontWeight: '700',
        letterSpacing: 1,
      })
      text.anchor.set(0.5)
      text.position.set(popup.x, popup.y)
      text.alpha = alpha
      this.popupLayer.addChild(text)
    }
  }

  private renderBossArena() {
    this.enemyGraphics.clear()
    if (this.enemy.active) {
      const enemyX = this.enemy.position.x
      const enemyY = this.enemy.position.y

      this.enemyGraphics.circle(enemyX, enemyY, ENEMY_RADIUS + 8).stroke({
        width: 2,
        color: this.bossRouteProfile.bossAccent,
      })
      this.enemyGraphics.circle(enemyX, enemyY, ENEMY_RADIUS).fill(0xf1f1f1)
      this.enemyGraphics.circle(enemyX, enemyY, ENEMY_RADIUS - 4).fill(this.bossRouteProfile.bossFill)
      this.enemyGraphics.circle(enemyX, enemyY, ENEMY_CORE_RADIUS).stroke({
        width: 2,
        color: this.bossRouteProfile.bannerColor,
      })
      this.enemyGraphics.circle(enemyX, enemyY, 8).fill(0x7a7a7a)
    } else if (
      this.intermission.kind === 'dialogue' &&
      this.intermission.phase === 'before-boss' &&
      this.intermission.next === 'resume-boss'
    ) {
      const warpRadius = 24 + Math.sin(this.elapsedSeconds * 9) * 4

      this.enemyGraphics.circle(PLAYFIELD_CENTER_X, PLAYFIELD_TOP + 58, warpRadius).stroke({
        width: 3,
        color: this.bossRouteProfile.bossAccent,
      })
    }
  }

  private get basicArenaDefinition(): BasicArenaDefinition {
    return this.currentStageDefinition.arena as BasicArenaDefinition
  }

  private get bossArenaDefinition(): BossArenaDefinition {
    return this.currentStageDefinition.arena as BossArenaDefinition
  }

  private get bossRouteProfile(): BossRouteDefinition {
    return this.bossArenaDefinition.routes[this.currentRoute]
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function snapToStep(value: number, step: number) {
  return Math.round(value / step) * step
}

function createOrb(): OrbModel {
  return {
    position: {
      x: PLAYFIELD_RIGHT - ORB_RADIUS - ORB_START_OFFSET_RIGHT,
      y: PLAYFIELD_BOTTOM - ORB_RADIUS - ORB_START_OFFSET_BOTTOM,
    },
    radius: ORB_RADIUS,
    velocityY: ORB_FORCE_START,
    force: ORB_FORCE_START,
    forceFrame: 0,
    velocityXState: ORB_VELOCITY_X_START,
  }
}

function resetOrb(orb: OrbModel) {
  orb.position.x = PLAYFIELD_RIGHT - ORB_RADIUS - ORB_START_OFFSET_RIGHT
  orb.position.y = PLAYFIELD_BOTTOM - ORB_RADIUS - ORB_START_OFFSET_BOTTOM
  orb.velocityY = ORB_FORCE_START
  orb.force = ORB_FORCE_START
  orb.forceFrame = 0
  orb.velocityXState = ORB_VELOCITY_X_START
}

function circleIntersectsRect(position: Vector2, radius: number, rect: RectBounds) {
  const closestX = clamp(position.x, rect.x, rect.x + rect.width)
  const closestY = clamp(position.y, rect.y, rect.y + rect.height)
  const dx = position.x - closestX
  const dy = position.y - closestY

  return dx * dx + dy * dy <= radius * radius
}

function segmentIntersectsRect(
  start: Vector2,
  end: Vector2,
  rect: RectBounds,
  padding = 0,
) {
  const expanded = {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  }

  if (pointInRect(start, expanded) || pointInRect(end, expanded)) {
    return true
  }

  const topLeft = { x: expanded.x, y: expanded.y }
  const topRight = { x: expanded.x + expanded.width, y: expanded.y }
  const bottomLeft = { x: expanded.x, y: expanded.y + expanded.height }
  const bottomRight = { x: expanded.x + expanded.width, y: expanded.y + expanded.height }

  return (
    segmentsIntersect(start, end, topLeft, topRight) ||
    segmentsIntersect(start, end, topRight, bottomRight) ||
    segmentsIntersect(start, end, bottomRight, bottomLeft) ||
    segmentsIntersect(start, end, bottomLeft, topLeft)
  )
}

function pointInRect(point: Vector2, rect: RectBounds) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

function segmentsIntersect(a: Vector2, b: Vector2, c: Vector2, d: Vector2) {
  const ab = orientation(a, b, c)
  const ac = orientation(a, b, d)
  const cd = orientation(c, d, a)
  const ca = orientation(c, d, b)

  if (ab === 0 && onSegment(a, c, b)) {
    return true
  }
  if (ac === 0 && onSegment(a, d, b)) {
    return true
  }
  if (cd === 0 && onSegment(c, a, d)) {
    return true
  }
  if (ca === 0 && onSegment(c, b, d)) {
    return true
  }

  return (ab > 0) !== (ac > 0) && (cd > 0) !== (ca > 0)
}

function orientation(a: Vector2, b: Vector2, c: Vector2) {
  const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)
  if (Math.abs(value) < 0.0001) {
    return 0
  }
  return value > 0 ? 1 : -1
}

function onSegment(a: Vector2, b: Vector2, c: Vector2) {
  return (
    b.x >= Math.min(a.x, c.x) &&
    b.x <= Math.max(a.x, c.x) &&
    b.y >= Math.min(a.y, c.y) &&
    b.y <= Math.max(a.y, c.y)
  )
}

function createStageCard(resource: StageCardResource): StageCard {
  return {
    id: resource.id,
    x: PLAYFIELD_LEFT + resource.x,
    y: PLAYFIELD_TOP + resource.y,
    flipsRemaining: resource.flips,
    maxFlips: resource.flips,
    scoreBase: resource.scoreBase,
    state: 'alive',
    flipFrame: 0,
  }
}

function createStageObstacle(resource: StageObstacleResource): StageObstacle {
  return {
    id: resource.id,
    type: resource.type,
    x: PLAYFIELD_LEFT + resource.x,
    y: PLAYFIELD_TOP + resource.y,
    width: resource.width,
    height: resource.height,
    linkId: resource.linkId,
    collisionCooldownFrames: resource.collisionCooldownFrames ?? 8,
    cooldownFrames: 0,
    fireIntervalFrames: resource.fireIntervalFrames ?? 0,
    fireTimer: 0,
    flashFrames: 0,
    turretPattern: resource.turretPattern ?? 'aimed',
  }
}

function orbTouchesCard(card: StageCard, orb: OrbModel) {
  const orbLeft = orb.position.x - orb.radius
  const orbTop = orb.position.y - orb.radius
  return Math.abs(card.x - orbLeft) < CARD_HIT_DISTANCE && Math.abs(card.y - orbTop) < CARD_HIT_DISTANCE
}

function orbHitsPlayerBody(orbPosition: Vector2, playerPosition: Vector2) {
  return (
    Math.abs(orbPosition.x - playerPosition.x) < orbContactProfiles.default.bodyHalfWidth &&
    Math.abs(orbPosition.y - playerPosition.y) < orbContactProfiles.default.bodyHalfHeight
  )
}

function bossHitsPlayerBody(bossPosition: Vector2, playerPosition: Vector2) {
  return circleIntersectsRect(
    bossPosition,
    ENEMY_RADIUS,
    {
      x: playerPosition.x - orbContactProfiles.default.bodyHalfWidth,
      y: playerPosition.y - orbContactProfiles.default.bodyHalfHeight,
      width: orbContactProfiles.default.bodyHalfWidth * 2,
      height: orbContactProfiles.default.bodyHalfHeight * 2,
    },
  )
}

function enemyBulletHitsPlayerBody(
  bullet: BulletModel,
  playerPosition: Vector2,
  playerSliding: boolean,
) {
  return bullet.kind === 'missile'
    ? missileHitsPlayerBody(bullet.position, playerPosition)
    : pelletHitsPlayerBody(bullet.position, playerPosition, playerSliding)
}

function pelletHitsPlayerBody(
  bulletPosition: Vector2,
  playerPosition: Vector2,
  playerSliding: boolean,
) {
  const playerLeft = playerPosition.x - PLAYER_WIDTH / 2
  const playerTop = playerPosition.y - PLAYER_HEIGHT / 2
  const bulletLeft = bulletPosition.x - ENEMY_BULLET_SPRITE_SIZE / 2
  const bulletTop = bulletPosition.y - ENEMY_BULLET_SPRITE_SIZE / 2

  return (
    bulletLeft >= playerLeft + 4 &&
    bulletLeft <= playerLeft + 20 &&
    bulletTop >= playerTop + (playerSliding ? 8 : 0) &&
    bulletTop < playerTop + PLAYER_HEIGHT - ENEMY_BULLET_SPRITE_SIZE
  )
}

function missileHitsPlayerBody(bulletPosition: Vector2, playerPosition: Vector2) {
  const playerLeft = playerPosition.x - PLAYER_WIDTH / 2
  const playerTop = playerPosition.y - PLAYER_HEIGHT / 2
  const bulletLeft = bulletPosition.x - ENEMY_BULLET_SPRITE_SIZE / 2
  const bulletTop = bulletPosition.y - ENEMY_BULLET_SPRITE_SIZE / 2

  return (
    bulletLeft > playerLeft - ENEMY_BULLET_SPRITE_SIZE / 2 &&
    bulletLeft < playerLeft + PLAYER_WIDTH / 2 + ENEMY_BULLET_SPRITE_SIZE / 2 &&
    bulletTop < playerTop + PLAYER_HEIGHT &&
    bulletTop > playerTop - ENEMY_BULLET_SPRITE_SIZE / 2
  )
}

function playerShotHitsBossBody(shotPosition: Vector2, bossPosition: Vector2) {
  const shotLeft = shotPosition.x - PLAYER_SHOT_HITBOX_SIZE / 2
  const shotTop = shotPosition.y - PLAYER_SHOT_HITBOX_SIZE / 2
  const bossLeft = bossPosition.x - ENEMY_RADIUS
  const bossTop = bossPosition.y - ENEMY_RADIUS

  return (
    shotLeft >= bossLeft &&
    shotLeft <= bossLeft + ENEMY_RADIUS * 2 - PLAYER_SHOT_HITBOX_SIZE &&
    shotTop >= bossTop &&
    shotTop <= bossTop + ENEMY_RADIUS * 2 - PLAYER_SHOT_HITBOX_SIZE
  )
}

function orbHitsPlayerRepelWindow(orbPosition: Vector2, playerPosition: Vector2) {
  return (
    Math.abs(orbPosition.x - playerPosition.x) < orbContactProfiles.default.repelHalfWidth &&
    Math.abs(orbPosition.y - playerPosition.y) < orbContactProfiles.default.repelHalfHeight
  )
}

function filterInPlace<T>(items: T[], predicate: (item: T) => boolean) {
  let writeIndex = 0

  for (const item of items) {
    if (predicate(item)) {
      items[writeIndex] = item
      writeIndex += 1
    }
  }

  items.length = writeIndex
}

function serializeBasicProgress(cards: StageCard[]) {
  return cards
    .map((card) => {
      const stateToken = card.state === 'alive' ? 'a' : card.state === 'flipping' ? 'f' : 'r'
      return `${stateToken}:${card.flipsRemaining}:${card.flipFrame}`
    })
    .join('|')
}

function randomVelocityState(): OrbVelocityXState {
  const states: OrbVelocityXState[] = ['0', '4_left', '4_right', '8_left', '8_right']
  return states[Math.floor(Math.random() * states.length)]
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function rankIndex(rank: GameRank) {
  switch (rank) {
    case 'easy':
      return 0
    case 'normal':
      return 1
    case 'hard':
      return 2
    case 'lunatic':
      return 3
  }
}

function normalizeCampaignStageNumber(value: number): CampaignStageNumber | null {
  if (value >= 1 && value <= 20) {
    return value as CampaignStageNumber
  }

  return null
}

function createSceneContinueCounts() {
  return Array.from({ length: getSceneCount() }, () => 0)
}

function normalizeSceneContinueCounts(values: number[] | undefined) {
  const normalized = createSceneContinueCounts()
  if (!Array.isArray(values)) {
    return normalized
  }

  for (let index = 0; index < normalized.length; index += 1) {
    normalized[index] = Math.max(0, Number(values[index]) || 0)
  }

  return normalized
}

function serializeSceneContinueCounts(values: number[]) {
  return normalizeSceneContinueCounts(values).join(',')
}

function deserializeSceneContinueCounts(serialized: string) {
  if (!serialized) {
    return createSceneContinueCounts()
  }

  return normalizeSceneContinueCounts(serialized.split(',').map((value) => Number(value)))
}

function buildSceneContinueStats(values: number[]) {
  const normalized = normalizeSceneContinueCounts(values)

  return normalized.map((count, index) => {
    const start = index * STAGES_PER_SCENE + 1
    const end = start + STAGES_PER_SCENE - 1
    return {
      label: `${start}-${end}면 이어하기`,
      value: count.toLocaleString(),
    }
  })
}
