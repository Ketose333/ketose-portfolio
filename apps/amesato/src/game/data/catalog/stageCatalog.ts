import stage01Json from '../stages/stage-01.json'
import stage02Json from '../stages/stage-02.json'
import stage03Json from '../stages/stage-03.json'
import stage04Json from '../stages/stage-04.json'
import stage05Json from '../stages/stage-05.json'
import stage06Json from '../stages/stage-06.json'
import stage07Json from '../stages/stage-07.json'
import stage08Json from '../stages/stage-08.json'
import stage09Json from '../stages/stage-09.json'
import stage10Json from '../stages/stage-10.json'
import stage11Json from '../stages/stage-11.json'
import stage12Json from '../stages/stage-12.json'
import stage13Json from '../stages/stage-13.json'
import stage14Json from '../stages/stage-14.json'
import stage15Json from '../stages/stage-15.json'
import stage16Json from '../stages/stage-16.json'
import stage17Json from '../stages/stage-17.json'
import stage18Json from '../stages/stage-18.json'
import stage19Json from '../stages/stage-19.json'
import stage20Json from '../stages/stage-20.json'
import type { CampaignStageNumber, GameRank, GameRoute, StageMode } from '../../core/types'
import type { BossPatternId } from '../../systems/bossPatternSystem'
import { PLAYFIELD_WIDTH } from '../config/gameConfig'
import {
  finalBossRankProfiles,
  sharedBossRankProfiles,
  type BossRankProfile,
  type StageCardResource,
  type StageObstacleResource,
} from '../resources/stageResources'
import { gameplayTerminology } from '../../../content/terminology'

export interface StagePalette {
  backgroundBase: number
  backgroundHeader: number
  backgroundField: number
  starColor: number
  frameHighlight: number
  frameShadow: number
  headerFrame: number
  headerFill: number
  playfieldOuter: number
  playfieldInner: number
  playfieldStroke: number
  playfieldInnerStroke: number
  gridRow: number
  gridColumn: number
  bumperOuter: number
  bumperInner: number
  basicBannerFill: number
  basicBannerAccent: number
  targetStroke: number
  targetFill: number
  targetCoreFill: number
  targetBarBackground: number
  targetBarFill: number
}

export interface BossRouteDefinition {
  bossName: string
  clearMessage: string
  bannerColor: number
  bossFill: number
  bossAccent: number
  patternId: BossPatternId
}

export interface BasicArenaDefinition {
  kind: 'basic'
  clearMessage: string
  cards: StageCardResource[]
  obstacles: StageObstacleResource[]
}

export interface BossArenaDefinition {
  kind: 'boss'
  rankProfiles: Record<GameRank, BossRankProfile>
  routes: Record<GameRoute, BossRouteDefinition>
}

export interface CampaignStageDefinition {
  number: CampaignStageNumber
  bannerColor: number
  palette: StagePalette
  arena: BasicArenaDefinition | BossArenaDefinition
}

interface RawBossRouteDefinition {
  bossName: string
  clearMessage: string
  bannerColor: string
  bossFill: string
  bossAccent: string
  patternId: BossPatternId
}

interface RawBasicArenaDefinition {
  kind: 'basic'
  clearMessage: string
  cards: StageCardResource[]
  obstacles: StageObstacleResource[]
}

interface RawBossArenaDefinition {
  kind: 'boss'
  rankProfileId: 'shared-boss' | 'final-boss'
  routes: Record<GameRoute, RawBossRouteDefinition>
}

interface RawStageVariant {
  bannerColor: string
  paletteId: PaletteId
  arena: RawBasicArenaDefinition | RawBossArenaDefinition
}

interface RawSharedStageFile {
  number: CampaignStageNumber
  variant: RawStageVariant
}

interface RawRouteStageFile {
  number: CampaignStageNumber
  variants: Record<GameRoute, RawStageVariant>
}

type RawStageFile = RawSharedStageFile | RawRouteStageFile
type PaletteId = 'shrine' | 'archive' | 'corridor' | 'routeA' | 'routeB' | 'routeALate' | 'routeBLate'
type StoryPaletteBandId =
  | 'stages-1-4'
  | 'boss-5'
  | 'stages-6-9'
  | 'boss-10'
  | 'stages-11-14'
  | 'boss-15'
  | 'stages-16-19'
  | 'boss-20'

interface StoryPaletteGroup {
  shared?: StagePalette
  routes?: Record<GameRoute, StagePalette>
}

const STAGE_CARD_SIZE = 32

const obstacleMirrorTypes: Record<StageObstacleResource['type'], StageObstacleResource['type']> = {
  bumper: 'bumper',
  bar_top: 'bar_top',
  bar_bottom: 'bar_bottom',
  bar_left: 'bar_right',
  bar_right: 'bar_left',
  portal: 'portal',
  turret_slow: 'turret_slow',
  turret_quick: 'turret_quick',
}

export const CAMPAIGN_STAGE_COUNT = 20
export const STAGES_PER_SCENE = 5
export const BOSS_STAGE_INTERVAL = 5

const palettePresetRegistry: Record<PaletteId, StagePalette> = {
  shrine: {
    backgroundBase: 0x000000,
    backgroundHeader: 0x040404,
    backgroundField: 0x080808,
    starColor: 0xffffff,
    frameHighlight: 0xffffff,
    frameShadow: 0x666666,
    headerFrame: 0xffffff,
    headerFill: 0x060606,
    playfieldOuter: 0x050505,
    playfieldInner: 0x0d0d0d,
    playfieldStroke: 0xffffff,
    playfieldInnerStroke: 0x787878,
    gridRow: 0x2c2c2c,
    gridColumn: 0x1d1d1d,
    bumperOuter: 0x1a1a1a,
    bumperInner: 0x686868,
    basicBannerFill: 0x141414,
    basicBannerAccent: 0xffffff,
    targetStroke: 0xffffff,
    targetFill: 0x101010,
    targetCoreFill: 0xf2f2f2,
    targetBarBackground: 0x121212,
    targetBarFill: 0xffffff,
  },
  archive: {
    backgroundBase: 0x000000,
    backgroundHeader: 0x090909,
    backgroundField: 0x101010,
    starColor: 0xffffff,
    frameHighlight: 0xffffff,
    frameShadow: 0x575757,
    headerFrame: 0xffffff,
    headerFill: 0x060606,
    playfieldOuter: 0x050505,
    playfieldInner: 0x141414,
    playfieldStroke: 0xffffff,
    playfieldInnerStroke: 0x787878,
    gridRow: 0x2c2c2c,
    gridColumn: 0x1d1d1d,
    bumperOuter: 0x1a1a1a,
    bumperInner: 0x7c7c7c,
    basicBannerFill: 0x202020,
    basicBannerAccent: 0xffffff,
    targetStroke: 0xffffff,
    targetFill: 0x101010,
    targetCoreFill: 0xffffff,
    targetBarBackground: 0x121212,
    targetBarFill: 0xffffff,
  },
  corridor: {
    backgroundBase: 0x000000,
    backgroundHeader: 0x020202,
    backgroundField: 0x060606,
    starColor: 0xffffff,
    frameHighlight: 0xffffff,
    frameShadow: 0x666666,
    headerFrame: 0xffffff,
    headerFill: 0x060606,
    playfieldOuter: 0x050505,
    playfieldInner: 0x0b0b0b,
    playfieldStroke: 0xffffff,
    playfieldInnerStroke: 0x787878,
    gridRow: 0x2c2c2c,
    gridColumn: 0x1d1d1d,
    bumperOuter: 0x1a1a1a,
    bumperInner: 0x8a8a8a,
    basicBannerFill: 0x181818,
    basicBannerAccent: 0xdedede,
    targetStroke: 0xffffff,
    targetFill: 0x101010,
    targetCoreFill: 0xf2f2f2,
    targetBarBackground: 0x121212,
    targetBarFill: 0xffffff,
  },
  routeA: {
    backgroundBase: 0x000000,
    backgroundHeader: 0x040404,
    backgroundField: 0x0a0a0a,
    starColor: 0xffffff,
    frameHighlight: 0xffffff,
    frameShadow: 0x707070,
    headerFrame: 0xffffff,
    headerFill: 0x060606,
    playfieldOuter: 0x050505,
    playfieldInner: 0x111111,
    playfieldStroke: 0xffffff,
    playfieldInnerStroke: 0x787878,
    gridRow: 0x2c2c2c,
    gridColumn: 0x1d1d1d,
    bumperOuter: 0x1a1a1a,
    bumperInner: 0xb0b0b0,
    basicBannerFill: 0x1c1c1c,
    basicBannerAccent: 0xffffff,
    targetStroke: 0xffffff,
    targetFill: 0x101010,
    targetCoreFill: 0xf2f2f2,
    targetBarBackground: 0x121212,
    targetBarFill: 0xffffff,
  },
  routeB: {
    backgroundBase: 0x000000,
    backgroundHeader: 0x040404,
    backgroundField: 0x070707,
    starColor: 0xffffff,
    frameHighlight: 0xffffff,
    frameShadow: 0x5e5e5e,
    headerFrame: 0xffffff,
    headerFill: 0x060606,
    playfieldOuter: 0x050505,
    playfieldInner: 0x121212,
    playfieldStroke: 0xffffff,
    playfieldInnerStroke: 0x787878,
    gridRow: 0x2c2c2c,
    gridColumn: 0x1d1d1d,
    bumperOuter: 0x1a1a1a,
    bumperInner: 0x929292,
    basicBannerFill: 0x1a1a1a,
    basicBannerAccent: 0xe5e5e5,
    targetStroke: 0xffffff,
    targetFill: 0x101010,
    targetCoreFill: 0xf2f2f2,
    targetBarBackground: 0x121212,
    targetBarFill: 0xffffff,
  },
  routeALate: {
    backgroundBase: 0x000000,
    backgroundHeader: 0x050505,
    backgroundField: 0x0f0f0f,
    starColor: 0xffffff,
    frameHighlight: 0xffffff,
    frameShadow: 0x707070,
    headerFrame: 0xffffff,
    headerFill: 0x070707,
    playfieldOuter: 0x050505,
    playfieldInner: 0x151515,
    playfieldStroke: 0xffffff,
    playfieldInnerStroke: 0x8c8c8c,
    gridRow: 0x323232,
    gridColumn: 0x212121,
    bumperOuter: 0x1b1b1b,
    bumperInner: 0xc2c2c2,
    basicBannerFill: 0x212121,
    basicBannerAccent: 0xffffff,
    targetStroke: 0xffffff,
    targetFill: 0x111111,
    targetCoreFill: 0xffffff,
    targetBarBackground: 0x141414,
    targetBarFill: 0xffffff,
  },
  routeBLate: {
    backgroundBase: 0x000000,
    backgroundHeader: 0x050505,
    backgroundField: 0x0d0d0d,
    starColor: 0xffffff,
    frameHighlight: 0xffffff,
    frameShadow: 0x636363,
    headerFrame: 0xffffff,
    headerFill: 0x070707,
    playfieldOuter: 0x050505,
    playfieldInner: 0x171717,
    playfieldStroke: 0xffffff,
    playfieldInnerStroke: 0x888888,
    gridRow: 0x2f2f2f,
    gridColumn: 0x1f1f1f,
    bumperOuter: 0x1b1b1b,
    bumperInner: 0xa8a8a8,
    basicBannerFill: 0x1f1f1f,
    basicBannerAccent: 0xf1f1f1,
    targetStroke: 0xffffff,
    targetFill: 0x111111,
    targetCoreFill: 0xf7f7f7,
    targetBarBackground: 0x141414,
    targetBarFill: 0xffffff,
  },
}

const storyPaletteRegistry: Record<StoryPaletteBandId, StoryPaletteGroup> = {
  'stages-1-4': {
    shared: palettePresetRegistry.archive,
  },
  'boss-5': {
    shared: palettePresetRegistry.shrine,
  },
  'stages-6-9': {
    routes: {
      'route-a': palettePresetRegistry.routeA,
      'route-b': palettePresetRegistry.routeB,
    },
  },
  'boss-10': {
    routes: {
      'route-a': palettePresetRegistry.routeA,
      'route-b': palettePresetRegistry.routeB,
    },
  },
  'stages-11-14': {
    routes: {
      'route-a': palettePresetRegistry.routeALate,
      'route-b': palettePresetRegistry.routeBLate,
    },
  },
  'boss-15': {
    routes: {
      'route-a': palettePresetRegistry.routeALate,
      'route-b': palettePresetRegistry.routeBLate,
    },
  },
  'stages-16-19': {
    routes: {
      'route-a': palettePresetRegistry.routeALate,
      'route-b': palettePresetRegistry.routeBLate,
    },
  },
  'boss-20': {
    routes: {
      'route-a': palettePresetRegistry.routeALate,
      'route-b': palettePresetRegistry.routeBLate,
    },
  },
}

const rankProfileRegistry: Record<RawBossArenaDefinition['rankProfileId'], Record<GameRank, BossRankProfile>> = {
  'shared-boss': sharedBossRankProfiles,
  'final-boss': finalBossRankProfiles,
}

const rawStages: Record<CampaignStageNumber, RawStageFile> = {
  1: stage01Json as RawStageFile,
  2: stage02Json as RawStageFile,
  3: stage03Json as RawStageFile,
  4: stage04Json as RawStageFile,
  5: stage05Json as RawStageFile,
  6: stage06Json as RawStageFile,
  7: stage07Json as RawStageFile,
  8: stage08Json as RawStageFile,
  9: stage09Json as RawStageFile,
  10: stage10Json as RawStageFile,
  11: stage11Json as RawStageFile,
  12: stage12Json as RawStageFile,
  13: stage13Json as RawStageFile,
  14: stage14Json as RawStageFile,
  15: stage15Json as RawStageFile,
  16: stage16Json as RawStageFile,
  17: stage17Json as RawStageFile,
  18: stage18Json as RawStageFile,
  19: stage19Json as RawStageFile,
  20: stage20Json as RawStageFile,
}

assertBasicStageSymmetry()

export function getCampaignStageDefinition(
  stageNumber: CampaignStageNumber,
  route: GameRoute,
): CampaignStageDefinition {
  const stageFile = rawStages[stageNumber]
  const variant = 'variants' in stageFile ? stageFile.variants[route] : stageFile.variant
  return hydrateStageDefinition(stageFile.number, variant, route)
}

export function getNextCampaignStageNumber(stageNumber: CampaignStageNumber) {
  if (stageNumber >= CAMPAIGN_STAGE_COUNT) {
    return null
  }

  return (stageNumber + 1) as CampaignStageNumber
}

export function getInitialCampaignStageNumber(stageMode: StageMode): CampaignStageNumber {
  if (stageMode === 'boss') {
    return 20
  }

  return 1
}

export function isBossCampaignStage(stageNumber: CampaignStageNumber) {
  return stageNumber % BOSS_STAGE_INTERVAL === 0
}

export function getSceneStartStageNumber(stageNumber: CampaignStageNumber): CampaignStageNumber {
  return (Math.floor((stageNumber - 1) / STAGES_PER_SCENE) * STAGES_PER_SCENE + 1) as CampaignStageNumber
}

export function getSceneEndStageNumber(stageNumber: CampaignStageNumber): CampaignStageNumber {
  return Math.min(
    CAMPAIGN_STAGE_COUNT,
    getSceneStartStageNumber(stageNumber) + STAGES_PER_SCENE - 1,
  ) as CampaignStageNumber
}

export function isSceneStartStage(stageNumber: CampaignStageNumber) {
  return getSceneStartStageNumber(stageNumber) === stageNumber
}

export function getSceneIndex(stageNumber: CampaignStageNumber) {
  return Math.floor((stageNumber - 1) / STAGES_PER_SCENE) + 1
}

export function getSceneCount() {
  return Math.ceil(CAMPAIGN_STAGE_COUNT / STAGES_PER_SCENE)
}

export function isFinalSceneStage(stageNumber: CampaignStageNumber) {
  return getSceneIndex(stageNumber) === getSceneCount()
}

function hydrateStageDefinition(
  stageNumber: CampaignStageNumber,
  variant: RawStageVariant,
  route: GameRoute,
): CampaignStageDefinition {
  return {
    number: stageNumber,
    bannerColor: parseColor(variant.bannerColor),
    palette: resolveStoryPalette(stageNumber, route),
    arena:
      variant.arena.kind === 'basic'
        ? {
            kind: 'basic',
            clearMessage: resolveTemplate(variant.arena.clearMessage, route),
            cards: variant.arena.cards,
            obstacles: variant.arena.obstacles,
          }
        : {
            kind: 'boss',
            rankProfiles: rankProfileRegistry[variant.arena.rankProfileId],
            routes: {
              'route-a': hydrateBossRoute(variant.arena.routes['route-a'], 'route-a'),
              'route-b': hydrateBossRoute(variant.arena.routes['route-b'], 'route-b'),
            },
          },
  }
}

function resolveStoryPalette(stageNumber: CampaignStageNumber, route: GameRoute) {
  const paletteGroup = storyPaletteRegistry[resolveStoryPaletteBand(stageNumber)]
  return paletteGroup.shared ?? paletteGroup.routes?.[route] ?? palettePresetRegistry.archive
}

function resolveStoryPaletteBand(stageNumber: CampaignStageNumber): StoryPaletteBandId {
  if (stageNumber <= 4) {
    return 'stages-1-4'
  }

  if (stageNumber === 5) {
    return 'boss-5'
  }

  if (stageNumber <= 9) {
    return 'stages-6-9'
  }

  if (stageNumber === 10) {
    return 'boss-10'
  }

  if (stageNumber <= 14) {
    return 'stages-11-14'
  }

  if (stageNumber === 15) {
    return 'boss-15'
  }

  if (stageNumber <= 19) {
    return 'stages-16-19'
  }

  return 'boss-20'
}

function assertBasicStageSymmetry() {
  for (const [stageKey, stageFile] of Object.entries(rawStages)) {
    const stageNumber = Number(stageKey) as CampaignStageNumber

    if ('variants' in stageFile) {
      for (const route of Object.keys(stageFile.variants) as GameRoute[]) {
        const variant = stageFile.variants[route]
        if (variant.arena.kind === 'basic') {
          assertBasicArenaSymmetry(stageNumber, route, variant.arena)
        }
      }
      continue
    }

    if (stageFile.variant.arena.kind === 'basic') {
      assertBasicArenaSymmetry(stageNumber, 'route-a', stageFile.variant.arena)
    }
  }
}

function assertBasicArenaSymmetry(
  stageNumber: CampaignStageNumber,
  route: GameRoute,
  arena: RawBasicArenaDefinition,
) {
  const cardCounts = createCountMap(
    arena.cards,
    (card) => createCardSignature(card.x, card.y, card.flips, card.scoreBase),
  )

  for (const card of arena.cards) {
    const mirroredSignature = createCardSignature(
      mirrorCoordinate(card.x, STAGE_CARD_SIZE),
      card.y,
      card.flips,
      card.scoreBase,
    )

    if ((cardCounts.get(mirroredSignature) ?? 0) === 0) {
      throw new Error(
        `[stage symmetry] stage ${stageNumber} ${route} card "${card.id}" has no mirrored counterpart at x=${mirrorCoordinate(card.x, STAGE_CARD_SIZE)}`,
      )
    }
  }

  const obstacleCounts = createCountMap(arena.obstacles, createObstacleSignature)

  for (const obstacle of arena.obstacles) {
    const mirroredSignature = createObstacleSignature({
      ...obstacle,
      type: obstacleMirrorTypes[obstacle.type],
      x: mirrorCoordinate(obstacle.x, obstacle.width),
    })

    if ((obstacleCounts.get(mirroredSignature) ?? 0) === 0) {
      throw new Error(
        `[stage symmetry] stage ${stageNumber} ${route} obstacle "${obstacle.id}" has no mirrored counterpart at x=${mirrorCoordinate(obstacle.x, obstacle.width)}`,
      )
    }
  }
}

function createCountMap<T>(items: T[], getKey: (item: T) => string) {
  const counts = new Map<string, number>()

  for (const item of items) {
    const key = getKey(item)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return counts
}

function createCardSignature(x: number, y: number, flips: number, scoreBase: number) {
  return [x, y, flips, scoreBase].join('|')
}

function createObstacleSignature(obstacle: StageObstacleResource) {
  return [
    obstacle.type,
    obstacle.x,
    obstacle.y,
    obstacle.width,
    obstacle.height,
    obstacle.minRank ?? '',
    obstacle.collisionCooldownFrames ?? '',
    obstacle.fireIntervalFrames ?? '',
    obstacle.turretPattern ?? '',
    obstacle.linkId ?? '',
  ].join('|')
}

function mirrorCoordinate(x: number, width: number) {
  return PLAYFIELD_WIDTH - x - width
}

function hydrateBossRoute(rawRoute: RawBossRouteDefinition, route: GameRoute): BossRouteDefinition {
  return {
    bossName: resolveTemplate(rawRoute.bossName, route),
    clearMessage: resolveTemplate(rawRoute.clearMessage, route),
    bannerColor: parseColor(rawRoute.bannerColor),
    bossFill: parseColor(rawRoute.bossFill),
    bossAccent: parseColor(rawRoute.bossAccent),
    patternId: rawRoute.patternId,
  }
}

function resolveTemplate(value: string, route: GameRoute) {
  const routeTerms = gameplayTerminology.routeLabels[route]

  return value
    .replaceAll('{{route.label}}', routeTerms.label)
    .replaceAll('{{route.menuLabel}}', routeTerms.menuLabel)
    .replaceAll('{{route.branchLabel}}', routeTerms.branchLabel)
}

function parseColor(value: string) {
  return Number.parseInt(value.replace(/^0x/i, ''), 16)
}
