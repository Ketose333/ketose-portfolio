import backdropBossScene1Url from '../../../assets/images/bg-boss-scene-1.png'
import backdropBossScene2RouteAUrl from '../../../assets/images/bg-boss-scene-2-route-a.png'
import backdropBossScene2RouteBUrl from '../../../assets/images/bg-boss-scene-2-route-b.png'
import backdropBossScene3RouteAUrl from '../../../assets/images/bg-boss-scene-3-route-a.png'
import backdropBossScene3RouteBUrl from '../../../assets/images/bg-boss-scene-3-route-b.png'
import backdropBossScene4RouteAUrl from '../../../assets/images/bg-boss-scene-4-route-a.png'
import backdropBossScene4RouteBUrl from '../../../assets/images/bg-boss-scene-4-route-b.png'
import backdropStageScene1Url from '../../../assets/images/bg-stage-scene-1.png'
import backdropStageScene2RouteAUrl from '../../../assets/images/bg-stage-scene-2-route-a.png'
import backdropStageScene2RouteBUrl from '../../../assets/images/bg-stage-scene-2-route-b.png'
import backdropStageScene3RouteAUrl from '../../../assets/images/bg-stage-scene-3-route-a.png'
import backdropStageScene3RouteBUrl from '../../../assets/images/bg-stage-scene-3-route-b.png'
import backdropStageScene4RouteAUrl from '../../../assets/images/bg-stage-scene-4-route-a.png'
import backdropStageScene4RouteBUrl from '../../../assets/images/bg-stage-scene-4-route-b.png'

export const backgroundManifest = {
  stageScene1: backdropStageScene1Url,
  stageScene2RouteA: backdropStageScene2RouteAUrl,
  stageScene2RouteB: backdropStageScene2RouteBUrl,
  stageScene3RouteA: backdropStageScene3RouteAUrl,
  stageScene3RouteB: backdropStageScene3RouteBUrl,
  stageScene4RouteA: backdropStageScene4RouteAUrl,
  stageScene4RouteB: backdropStageScene4RouteBUrl,
  bossScene1: backdropBossScene1Url,
  bossScene2RouteA: backdropBossScene2RouteAUrl,
  bossScene2RouteB: backdropBossScene2RouteBUrl,
  bossScene3RouteA: backdropBossScene3RouteAUrl,
  bossScene3RouteB: backdropBossScene3RouteBUrl,
  bossScene4RouteA: backdropBossScene4RouteAUrl,
  bossScene4RouteB: backdropBossScene4RouteBUrl,
} as const

export type BackgroundTrackId = keyof typeof backgroundManifest

export function resolveBackgroundTrackId(stageNumber: number, arena: 'basic' | 'boss', route: 'route-a' | 'route-b') {
  const sceneIndex = Math.ceil(stageNumber / 5)

  if (arena === 'boss') {
    if (sceneIndex <= 1) {
      return 'bossScene1' as const
    }
    if (sceneIndex === 2) {
      return route === 'route-a' ? 'bossScene2RouteA' : 'bossScene2RouteB'
    }
    if (sceneIndex === 3) {
      return route === 'route-a' ? 'bossScene3RouteA' : 'bossScene3RouteB'
    }

    return route === 'route-a' ? 'bossScene4RouteA' : 'bossScene4RouteB'
  }

  if (sceneIndex <= 1) {
    return 'stageScene1' as const
  }
  if (sceneIndex === 2) {
    return route === 'route-a' ? 'stageScene2RouteA' : 'stageScene2RouteB'
  }
  if (sceneIndex === 3) {
    return route === 'route-a' ? 'stageScene3RouteA' : 'stageScene3RouteB'
  }

  return route === 'route-a' ? 'stageScene4RouteA' : 'stageScene4RouteB'
}
