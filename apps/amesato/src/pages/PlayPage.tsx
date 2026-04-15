import './play-page.css'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useIsMobileBlocked } from '../app/hooks/useIsMobileBlocked'
import { useBgmTrack } from '../app/audio/useBgmTrack'
import type { BgmTrackId } from '../app/audio/audioManifest'
import { useBootConfigStore } from '../app/store/useBootConfigStore'
import { useGameSessionStore } from '../app/store/useGameSessionStore'
import { GameHudCard } from '../components/game/GameHudCard'
import { GameViewport } from '../components/game/GameViewport'
import { Panel } from '../components/ui/Panel'
import { gameplayTerminology } from '../content/terminology'
import type { GameRoute } from '../game/core/types'

export function PlayPage() {
  const isMobileBlocked = useIsMobileBlocked()
  const status = useGameSessionStore((state) => state.status)
  const arenaKind = useGameSessionStore((state) => state.arenaKind)
  const overlay = useGameSessionStore((state) => state.overlay)
  const campaignStageNumber = useGameSessionStore((state) => state.campaignStageNumber)
  const sessionRoute = useGameSessionStore((state) => state.currentRoute)
  const rank = useBootConfigStore((state) => state.rank)
  const route = useBootConfigStore((state) => state.route)
  const stageMode = useBootConfigStore((state) => state.stageMode)
  const bgmEnabled = useBootConfigStore((state) => state.bgmEnabled)
  const effectiveRoute = stageMode === 'arcade' ? sessionRoute : route

  const bgmTrack = useMemo<BgmTrackId | null>(() => {
    const sceneIndex = Math.floor((campaignStageNumber - 1) / 5) + 1

    if (overlay.kind === 'score-entry' && overlay.stateKey.startsWith('ending:')) {
      return null
    }

    if (overlay.kind === 'verdict') {
      return null
    }

    if (overlay.kind === 'dialogue' && overlay.stateKey.startsWith('ending:')) {
      return 'ending'
    }

    if (
      overlay.kind === 'gameover-menu' ||
      (overlay.kind === 'score-entry' && overlay.stateKey.startsWith('gameover:'))
    ) {
      return 'gameover'
    }

    if (status === 'gameover') {
      return 'gameover'
    }

    if (status === 'cleared') {
      return 'ending'
    }

    if (stageMode === 'boss') {
      return resolveBossTrack(sceneIndex, effectiveRoute)
    }

    if (stageMode === 'basic') {
      return 'stageScene1'
    }

    if (arenaKind === 'basic' && campaignStageNumber >= 6) {
      return resolveStageTrack(sceneIndex, effectiveRoute)
    }

    return arenaKind === 'boss'
      ? resolveBossTrack(sceneIndex, effectiveRoute)
      : 'stageScene1'
  }, [arenaKind, campaignStageNumber, effectiveRoute, overlay.kind, overlay.stateKey, stageMode, status])

  useBgmTrack(isMobileBlocked ? 'title' : bgmTrack, bgmEnabled)

  if (isMobileBlocked) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <section className="play-shell p-4">
          <div className="mobile-blocked-grid grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <Panel eyebrow="지원 환경" title={gameplayTerminology.platformLabels.mobileBlockedTitle}>
              <p className="text-sm leading-7 text-app-muted">
                {gameplayTerminology.platformLabels.mobileBlockedBody}
              </p>
            </Panel>

            <div className="flex flex-col gap-4">
              <Link
                to="/guide"
                className="title-menu__item flex min-h-12 items-center justify-center px-4 py-3 text-center text-sm tracking-[0.2em] uppercase"
              >
                가이드
              </Link>
              <Link
                to="/"
                className="title-menu__item flex min-h-12 items-center justify-center px-4 py-3 text-center text-sm tracking-[0.2em] uppercase"
              >
                타이틀
              </Link>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <section className="play-shell play-shell--game p-4">
        <div className="play-layout grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <GameViewport rank={rank} route={effectiveRoute} stageMode={stageMode} />

          <div className="play-side-column flex flex-col gap-3">
            <GameHudCard />
            <div className="grid grid-cols-2 items-stretch gap-3">
              <Link
                to="/guide"
                className="title-menu__item flex min-h-12 items-center justify-center px-4 py-3 text-center text-sm tracking-[0.2em] uppercase"
              >
                가이드
              </Link>
              <Link
                to="/"
                className="title-menu__item flex min-h-12 items-center justify-center px-4 py-3 text-center text-sm tracking-[0.2em] uppercase"
              >
                타이틀
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function resolveStageTrack(sceneIndex: number, route: GameRoute): BgmTrackId {
  if (sceneIndex <= 1) {
    return 'stageScene1'
  }

  if (sceneIndex === 2) {
    return route === 'route-a' ? 'stageScene2RouteA' : 'stageScene2RouteB'
  }

  if (sceneIndex === 3) {
    return route === 'route-a' ? 'stageScene3RouteA' : 'stageScene3RouteB'
  }

  return route === 'route-a' ? 'stageScene4RouteA' : 'stageScene4RouteB'
}

function resolveBossTrack(sceneIndex: number, route: GameRoute): BgmTrackId {
  if (sceneIndex <= 1) {
    return 'bossScene1'
  }

  if (sceneIndex === 2) {
    return route === 'route-a' ? 'bossScene2RouteA' : 'bossScene2RouteB'
  }

  if (sceneIndex === 3) {
    return route === 'route-a' ? 'bossScene3RouteA' : 'bossScene3RouteB'
  }

  return route === 'route-a' ? 'bossScene4RouteA' : 'bossScene4RouteB'
}
