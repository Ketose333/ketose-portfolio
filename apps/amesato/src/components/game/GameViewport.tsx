import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBootConfigStore } from '../../app/store/useBootConfigStore'
import { useGameSessionStore } from '../../app/store/useGameSessionStore'
import { GameApp } from '../../game/core/GameApp'
import type { GameRank, GameRoute, StageMode } from '../../game/core/types'
import { GameOverlaySurface } from './GameOverlaySurface'

interface GameViewportProps {
  rank: GameRank
  route: GameRoute
  stageMode: StageMode
}

export function GameViewport({ rank, route, stageMode }: GameViewportProps) {
  const navigate = useNavigate()
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const status = useGameSessionStore((state) => state.status)
  const message = useGameSessionStore((state) => state.message)
  const overlay = useGameSessionStore((state) => state.overlay)
  const startLives = useBootConfigStore((state) => state.startLives)
  const sessionKey =
    stageMode === 'arcade' ? `${stageMode}:${rank}` : `${stageMode}:${rank}:${route}`

  useEffect(() => {
    const host = hostRef.current

    if (!host) {
      return
    }

    const restoredSnapshot = useGameSessionStore.getState().getRestorableSnapshot(sessionKey)

    const game = new GameApp({
      initialSnapshot: restoredSnapshot,
      rank,
      route,
      stageMode,
      startLives,
      onSnapshot: (snapshot) => {
        useGameSessionStore.getState().syncSnapshot(snapshot, sessionKey)
        useBootConfigStore.getState().recordScore(rank, snapshot.score)
      },
      onStatusChange: (nextStatus, nextMessage) =>
        useGameSessionStore.getState().setStatus(nextStatus, nextMessage),
      onReturnToTitle: (resetSession = true) => {
        if (resetSession) {
          useGameSessionStore.getState().resetSession()
        }
        navigate('/')
      },
      shouldPromptScoreEntry: () => useBootConfigStore.getState().pendingScoreRank === rank,
      getRecordedHighScore: () => useBootConfigStore.getState().highScores[rank].score,
      shouldShowHitboxes: () => false,
    })

    host.tabIndex = 0
    host.focus({ preventScroll: true })

    void game.mount(host).catch((error: unknown) => {
      setErrorMessage(
        error instanceof Error ? error.message : '플레이필드를 초기화하지 못했습니다.',
      )
    })

    return () => {
      void game.destroy()
    }
  }, [navigate, rank, route, sessionKey, stageMode, startLives])

  return (
    <div className="viewport-shell relative isolate overflow-hidden">
      <div
        ref={hostRef}
        onPointerDown={(event) => event.currentTarget.focus({ preventScroll: true })}
        className="viewport-canvas relative z-0 aspect-[8/5] w-full outline-none"
        aria-label="게임 플레이필드"
      />

      {overlay.kind !== 'none' ? (
        <div
          className={`viewport-overlay pointer-events-none absolute inset-0 z-20 flex justify-center p-6 text-center ${
            overlay.kind === 'dialogue'
              ? 'viewport-overlay--dialogue items-end pb-8'
              : 'items-center'
          }`}
        >
          <GameOverlaySurface overlay={overlay} />
        </div>
      ) : null}

      {overlay.kind === 'none' &&
        ((status === 'booting' || status === 'paused') ||
          Boolean(message) ||
          errorMessage) && (
        <div className="viewport-overlay pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-6 text-center">
          <div className="viewport-message-card max-w-md px-6 py-5">
            <p className="text-xs font-semibold tracking-[0.24em] text-app-muted-strong uppercase">
              {errorMessage ? '실행 오류' : toKoreanStatus(status)}
            </p>
            <p className="mt-3 text-sm leading-7 text-app-muted">{errorMessage ?? message}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function toKoreanStatus(status: 'booting' | 'running' | 'paused' | 'gameover' | 'cleared') {
  switch (status) {
    case 'booting':
      return '준비 중'
    case 'running':
      return '플레이 중'
    case 'paused':
      return '일시정지'
    case 'gameover':
      return '게임 오버'
    case 'cleared':
      return '클리어'
  }
}
