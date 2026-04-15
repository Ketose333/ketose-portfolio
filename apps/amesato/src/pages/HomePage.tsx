import './home-page.css'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBgmTrack } from '../app/audio/useBgmTrack'
import { useIsMobileBlocked } from '../app/hooks/useIsMobileBlocked'
import { useBootConfigStore } from '../app/store/useBootConfigStore'
import {
  musicTrackLabels,
  titleMenuEntries,
  titlePanelLabels,
  titleUiText,
  type TitleMenuAction,
  type TitlePanel,
} from '../content/titleText'
import { useGameSessionStore } from '../app/store/useGameSessionStore'
import type { BgmTrackId } from '../app/audio/audioManifest'
import type { GameRank, GameRoute, StageMode } from '../game/core/types'
import { gameplayTerminology, routeCycleOrder } from '../content/terminology'

const panelLengths: Record<TitlePanel, number> = Object.fromEntries(
  Object.entries(titleMenuEntries).map(([panel, entries]) => [panel, entries.length]),
) as Record<TitlePanel, number>

export function HomePage() {
  const navigate = useNavigate()
  const rank = useBootConfigStore((state) => state.rank)
  const bgmEnabled = useBootConfigStore((state) => state.bgmEnabled)
  const startLives = useBootConfigStore((state) => state.startLives)
  const highScores = useBootConfigStore((state) => state.highScores)
  const pendingScoreRank = useBootConfigStore((state) => state.pendingScoreRank)
  const cycleRank = useBootConfigStore((state) => state.cycleRank)
  const setRank = useBootConfigStore((state) => state.setRank)
  const setRoute = useBootConfigStore((state) => state.setRoute)
  const setStageMode = useBootConfigStore((state) => state.setStageMode)
  const toggleBgmEnabled = useBootConfigStore((state) => state.toggleBgmEnabled)
  const cycleStartLives = useBootConfigStore((state) => state.cycleStartLives)
  const updateScoreName = useBootConfigStore((state) => state.updateScoreName)
  const clearPendingScoreRank = useBootConfigStore((state) => state.clearPendingScoreRank)
  const sessionKey = useGameSessionStore((state) => state.sessionKey)
  const sessionStatus = useGameSessionStore((state) => state.status)
  const sessionScore = useGameSessionStore((state) => state.score)
  const sessionStageNumber = useGameSessionStore((state) => state.campaignStageNumber)
  const sessionElapsedSeconds = useGameSessionStore((state) => state.elapsedSeconds)
  const sessionRoute = useGameSessionStore((state) => state.currentRoute)
  const [panel, setPanel] = useState<TitlePanel>('main')
  const [selectedMusicTrack, setSelectedMusicTrack] = useState<BgmTrackId>('title')
  const [cursor, setCursor] = useState<Record<TitlePanel, number>>({
    main: 0,
    options: 0,
    music: 0,
    scoreEntry: 0,
  })

  const scoreEntryRank = pendingScoreRank ?? rank
  const isMobileBlocked = useIsMobileBlocked()
  const [scoreNameDraft, setScoreNameDraft] = useState(highScores[scoreEntryRank].name)
  const bgmTrack = panel === 'music' ? selectedMusicTrack : 'title'
  useBgmTrack(bgmTrack, bgmEnabled)

  const currentScore = useMemo(() => highScores[rank].score.toLocaleString(), [highScores, rank])
  const continueTarget = useMemo(() => parseSessionKey(sessionKey), [sessionKey])
  const canContinue = Boolean(
    continueTarget &&
      sessionStatus !== 'cleared' &&
      (
        sessionStatus !== 'booting' ||
        sessionScore > 0 ||
        sessionStageNumber > 1 ||
        sessionElapsedSeconds > 0
      ),
  )

  useEffect(() => {
    setScoreNameDraft(highScores[scoreEntryRank].name)
  }, [highScores, scoreEntryRank])

  useEffect(() => {
    if (pendingScoreRank) {
      setPanel('scoreEntry')
      setCursor((state) => ({ ...state, scoreEntry: 0 }))
    }
  }, [pendingScoreRank])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return
      }

      if (event.code === 'ArrowUp') {
        event.preventDefault()
        moveCursor(-1)
        return
      }

      if (event.code === 'ArrowDown') {
        event.preventDefault()
        moveCursor(1)
        return
      }

      if (panel === 'options' && (event.code === 'ArrowLeft' || event.code === 'ArrowRight')) {
        event.preventDefault()
        cycleOptionValue(cursor.options, event.code === 'ArrowRight' ? 1 : -1)
        return
      }

      if (event.code === 'Enter' || event.code === 'KeyZ' || event.code === 'Space') {
        event.preventDefault()
        activateSelection()
        return
      }

      if (event.code === 'Escape' || event.code === 'KeyX') {
        event.preventDefault()
        if (panel !== 'main') {
          setPanel('main')
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activateSelection, cursor.options, panel])

  function moveCursor(direction: 1 | -1) {
    setCursor((state) => {
      const nextValue = (state[panel] + direction + panelLengths[panel]) % panelLengths[panel]
      return { ...state, [panel]: nextValue }
    })
  }

  function setPanelCursor(nextPanel: TitlePanel, index: number) {
    setPanel(nextPanel)
    setCursor((state) => ({ ...state, [nextPanel]: index }))
  }

  function activateSelection() {
    const entry = titleMenuEntries[panel][cursor[panel]]
    if (entry) {
      handleTitleAction(entry.id)
    }
  }

  function cycleOptionValue(index: number, direction: 1 | -1) {
    void direction
    switch (index) {
      case 0:
        cycleRank(direction)
        return
      case 1:
        toggleBgmEnabled()
        return
      case 2:
        cycleStartLives(direction)
        return
      default:
        return
    }
  }

  function launch(mode: StageMode, resetSession = true) {
    const launchRoute = routeCycleOrder[0]
    setRank(rank)
    setRoute(launchRoute)
    setStageMode(mode)
    if (resetSession) {
      useGameSessionStore.getState().resetSession(buildSessionKey(mode, rank, launchRoute))
    }
    navigate('/play')
  }

  function saveScoreEntry() {
    updateScoreName(scoreEntryRank, scoreNameDraft)
    clearPendingScoreRank()
  }

  function handleTitleAction(action: TitleMenuAction) {
    switch (action) {
      case 'start-game':
        if (isMobileBlocked) {
          return
        }
        launch('arcade')
        return
      case 'continue-game':
        if (isMobileBlocked || !canContinue || !continueTarget) {
          return
        }
        setRank(continueTarget.rank)
        setRoute(sessionRoute)
        setStageMode(continueTarget.mode)
        navigate('/play')
        return
      case 'open-options':
        setPanel('options')
        return
      case 'open-guide':
        navigate('/guide')
        return
      case 'cycle-rank':
        cycleRank(1)
        return
      case 'toggle-bgm':
        toggleBgmEnabled()
        return
      case 'cycle-start-lives':
        cycleStartLives(1)
        return
      case 'open-music':
        setPanel('music')
        return
      case 'options-back':
      case 'music-back':
      case 'score-entry-back':
        setPanel('main')
        return
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <section className="home-hero overflow-hidden p-4">
        <div className="home-hero__frame relative overflow-hidden p-6 sm:p-8">
          <div className="home-hero__header relative z-10 border-b border-[var(--c-app-border)] pb-6 text-center">
            <p className="home-hero__title font-display text-4xl tracking-[0.18em] sm:text-5xl">
              {titleUiText.title}
            </p>
          </div>

          <div className="home-title-grid relative z-10 mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="title-panel min-w-0 p-5">
              <p className="title-panel__eyebrow text-[11px] tracking-[0.28em] uppercase">
                {titlePanelLabels[panel]}
              </p>
              <div className="mt-4 space-y-3">
                {panel === 'options'
                  ? (
                      <>
                        <OptionRow
                          active={cursor.options === 0}
                          label={titleMenuEntries.options[0].label}
                          value={rank.toUpperCase()}
                          onHover={() => setPanelCursor('options', 0)}
                          onClick={() => handleTitleAction(titleMenuEntries.options[0].id)}
                        />
                        <OptionRow
                          active={cursor.options === 1}
                          label={titleMenuEntries.options[1].label}
                          value={bgmEnabled ? titleUiText.bgmModeLabels.on : titleUiText.bgmModeLabels.off}
                          onHover={() => setPanelCursor('options', 1)}
                          onClick={() => handleTitleAction(titleMenuEntries.options[1].id)}
                        />
                        <OptionRow
                          active={cursor.options === 2}
                          label={titleMenuEntries.options[2].label}
                          value={String(startLives)}
                          onHover={() => setPanelCursor('options', 2)}
                          onClick={() => handleTitleAction(titleMenuEntries.options[2].id)}
                        />
                        <TitleButton
                          active={cursor.options === 3}
                          label={titleMenuEntries.options[3].label}
                          onHover={() => setPanelCursor('options', 3)}
                          onClick={() => handleTitleAction(titleMenuEntries.options[3].id)}
                        />
                        <TitleButton
                          active={cursor.options === 4}
                          label={titleMenuEntries.options[4].label}
                          onHover={() => setPanelCursor('options', 4)}
                          onClick={() => handleTitleAction(titleMenuEntries.options[4].id)}
                        />
                      </>
                    )
                  : titleMenuEntries[panel].map((entry, index) =>
                      <TitleButton
                        key={entry.id}
                        active={cursor[panel] === index}
                        disabled={
                          (entry.id === 'continue-game' && !canContinue) ||
                          (isMobileBlocked &&
                            (entry.id === 'start-game' || entry.id === 'continue-game'))
                        }
                        label={entry.label}
                        onHover={() => setPanelCursor(panel, index)}
                        onClick={() => handleTitleAction(entry.id)}
                      />,
                    )}
              </div>
            </div>

            <div className="title-panel min-w-0 p-6">
              {panel === 'main' ? (
                <div className="space-y-5">
                  <InfoBlock label={titleUiText.infoLabels.rank} value={rank.toUpperCase()} />
                  <InfoBlock label={titleUiText.infoLabels.startLives} value={String(startLives)} />
                  <InfoBlock label={titleUiText.infoLabels.campaign} value={titleUiText.ranges.campaign} />
                  <InfoBlock label={titleUiText.infoLabels.highScore} value={currentScore} />
                  {isMobileBlocked ? (
                    <InfoBlock
                      label={gameplayTerminology.menuLabels.guide}
                      value={gameplayTerminology.platformLabels.mobileBlockedShort}
                      compact
                    />
                  ) : null}
                </div>
              ) : null}

              {panel !== 'main' ? (
                <>
                {panel === 'options' ? (
                  <div className="space-y-5 text-sm leading-7 text-app-muted">
                    <InfoBlock label={titleUiText.infoLabels.rank} value={rank.toUpperCase()} />
                    <InfoBlock
                      label={titleUiText.infoLabels.bgm}
                      value={bgmEnabled ? titleUiText.bgmModeLabels.on : titleUiText.bgmModeLabels.off}
                    />
                    <InfoBlock label={titleUiText.infoLabels.startLives} value={String(startLives)} />
                  </div>
                ) : null}

                {panel === 'music' ? (
                  <div className="space-y-5">
                    <InfoBlock
                      label={titleUiText.infoLabels.activeTrack}
                      value={musicTrackLabels[selectedMusicTrack]}
                    />
                    <p className="text-sm leading-7 text-app-muted">{titleUiText.musicTestHint}</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {(Object.keys(musicTrackLabels) as BgmTrackId[]).map((trackId) => (
                        <button
                          key={trackId}
                          type="button"
                          onClick={() => setSelectedMusicTrack(trackId)}
                          className={`title-menu__item px-4 py-3 text-left ${
                            selectedMusicTrack === trackId ? 'title-menu__item--active' : ''
                          }`}
                        >
                          {musicTrackLabels[trackId]}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {panel === 'scoreEntry' ? (
                  <div className="space-y-5">
                    <InfoBlock
                      label={titleUiText.infoLabels.scoreName}
                      value={`${scoreEntryRank.toUpperCase()} / ${highScores[scoreEntryRank].score.toLocaleString()}`}
                      compact
                    />
                    <p className="text-sm leading-7 text-app-muted">{titleUiText.scoreEntryHint}</p>
                    <label className="flex flex-col gap-2">
                      <span className="text-xs tracking-[0.28em] text-app-muted-strong uppercase">
                        {titleUiText.infoLabels.scoreName}
                      </span>
                      <input
                        value={scoreNameDraft}
                        onChange={(event) => setScoreNameDraft(event.target.value)}
                        maxLength={12}
                        placeholder={titleUiText.scoreEntryPlaceholder}
                        className="title-input px-4 py-3 font-display text-lg tracking-[0.16em] outline-none"
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={saveScoreEntry}
                        className="title-menu__item px-4 py-3 text-center font-display text-lg tracking-[0.18em]"
                      >
                        SAVE
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          clearPendingScoreRank()
                          setPanel('main')
                        }}
                        className="title-menu__item px-4 py-3 text-center font-display text-lg tracking-[0.18em]"
                      >
                        BACK
                      </button>
                    </div>
                  </div>
                ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function TitleButton({
  active,
  disabled = false,
  label,
  onHover,
  onClick,
}: {
  active: boolean
  disabled?: boolean
  label: string
  onHover: () => void
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onClick}
      className={`title-menu__item w-full px-4 py-3 text-left font-display text-lg tracking-[0.18em] transition ${
        !disabled && active ? 'title-menu__item--active' : ''
      } ${disabled ? 'title-menu__item--disabled' : ''}`}
    >
      {label}
    </button>
  )
}

function OptionRow({
  active,
  label,
  value,
  onHover,
  onClick,
}: {
  active: boolean
  label: string
  value: string
  onHover: () => void
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onClick}
      className={`title-menu__item w-full px-4 py-3 text-left transition ${
        active ? 'title-menu__item--active' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs tracking-[0.28em] text-app-muted-strong uppercase">{label}</span>
        <span className="font-display text-lg tracking-[0.18em] text-app-text">{value}</span>
      </div>
    </button>
  )
}

function InfoBlock({
  label,
  value,
  compact = false,
}: {
  label: string
  value: string
  compact?: boolean
}) {
  return (
    <div className="title-info-block px-4 py-4">
      <p className="text-xs tracking-[0.28em] text-app-muted-strong uppercase">{label}</p>
      <p className={`mt-2 text-app-text ${compact ? 'text-sm leading-7' : 'font-display text-2xl'}`}>
        {value}
      </p>
    </div>
  )
}

function parseSessionKey(sessionKey: string | null) {
  if (!sessionKey) {
    return null
  }

  const [mode, rank, route] = sessionKey.split(':')
  if (!isStageMode(mode) || !isRank(rank)) {
    return null
  }

  if (route && !isRoute(route)) {
    return null
  }

  return { mode, rank, route: route ?? null }
}

function buildSessionKey(mode: StageMode, rank: GameRank, route: GameRoute) {
  return mode === 'arcade' ? `${mode}:${rank}` : `${mode}:${rank}:${route}`
}

function isRank(value: string | null | undefined): value is GameRank {
  return value === 'easy' || value === 'normal' || value === 'hard' || value === 'lunatic'
}

function isRoute(value: string | null | undefined): value is GameRoute {
  return value === 'route-a' || value === 'route-b'
}

function isStageMode(value: string | null | undefined): value is StageMode {
  return value === 'arcade' || value === 'basic' || value === 'boss'
}
