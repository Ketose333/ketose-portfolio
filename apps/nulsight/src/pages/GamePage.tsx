import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ButtonSurface, ChoiceGrid, OverlaySurface } from '@portfolio/ui-shell'
import { GameCommandBar } from '../app/components/GameCommandBar'
import { GameCardSurface } from '../app/components/GameCardSurface'
import { GameFxLayer } from '../app/components/GameFxLayer'
import { GameStatusStrip } from '../app/components/GameStatusStrip'
import { GatedPageNotice } from '../app/components/GatedPageNotice'
import { NulsightPageFrame } from '../app/components/NulsightPageFrame'
import { getSharedCardsGlobal } from '../app/globals'
import {
  cardTypeLabel,
  DEFAULT_HUD_STATE,
  DEFAULT_SURFACE_STATE,
  extractKeywordTokens,
  normalizeEffectText,
  renderPileText,
  resolveOverlayCardDef,
  type GameActiveActionState,
  type GameHandCardState,
  type GameHudState,
  type GameOverlayCardState,
  type GameQueryOptionState,
  type GameSlotState,
  type GameStackEntryState,
  type GameSurfaceAction,
  type GameSurfaceState,
  type PlayerSummary,
} from '../client/game/surfaceState'
import { installGameRuntimeBridges } from '../client/game/runtimeBridges'

const GAME_STYLES = [
  { id: 'nulsight-game-style-board', href: '/game.css' },
] as const

const GAME_SCRIPTS = [
  { id: 'nulsight-game-script-runtime', src: '/js/game.js' },
] as const

declare global {
  interface Window {
    BP_NULSIGHT_GAME?: {
      teardown?: () => void
      setHudState?: (state: GameHudState) => void
      setSurfaceState?: (state: Partial<GameSurfaceState>) => void
      pickEffectIndex?: (index: number) => void
    }
    act?: (type: string, payload?: unknown) => void
    concedeAndExit?: () => void
    attackOpponentAgent?: () => void
    goLobby?: (force?: boolean) => void
    openGrave?: (which: string) => void
    openBanish?: (which: string) => void
    closeGrave?: () => void
    openStackOverlay?: () => void
    closeStackOverlay?: () => void
    closeCardOverlay?: () => void
    closeEffectPickOverlay?: (commit?: boolean) => void
    respondQueryOverlay?: (value: string) => void
    openCardOverlayByKey?: (key: string) => void
    openCardOverlayByUnit?: (unitId: string) => void
    handleHandCardClick?: (event: unknown, index: number) => void
  }
}

function ensureStyles() {
  const created: HTMLLinkElement[] = []

  for (const entry of GAME_STYLES) {
    if (document.getElementById(entry.id)) {
      continue
    }

    const link = document.createElement('link')
    link.id = entry.id
    link.rel = 'stylesheet'
    link.href = entry.href
    document.head.appendChild(link)
    created.push(link)
  }

  return () => {
    for (const link of created) {
      link.remove()
    }
  }
}

function loadScript(id: string, src: string) {
  return new Promise<HTMLScriptElement>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null
    if (existing) {
      existing.remove()
    }

    const script = document.createElement('script')
    script.id = id
    script.src = src
    script.async = false
    script.onload = () => resolve(script)
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.body.appendChild(script)
  })
}

type GameOverlayDialogProps = {
  id: string
  visible: boolean
  ariaLabel: string
  panelClassName?: string
  eyebrow?: ReactNode
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  body?: ReactNode
  footer?: ReactNode
  onBackdropClick?: () => void
}

function GameOverlayDialog({
  id,
  visible,
  ariaLabel,
  panelClassName,
  eyebrow,
  title,
  subtitle,
  actions,
  body,
  footer,
  onBackdropClick,
}: GameOverlayDialogProps) {
  return (
    <section
      id={id}
      className={`card-overlay${visible ? '' : ' hidden'}`}
      aria-label={ariaLabel}
      aria-modal="true"
      role="dialog"
    >
      <div className="card-overlay__backdrop" onClick={onBackdropClick} />
      <OverlaySurface
        className={`card-overlay__panel${panelClassName ? ` ${panelClassName}` : ''}`}
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        actions={actions}
        body={body}
        footer={footer}
      />
    </section>
  )
}

export function GamePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const duelStageRef = useRef<HTMLElement | null>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const longPressTargetRef = useRef<HTMLElement | null>(null)
  const longPressTriggeredRef = useRef(false)
  const [hudState, setHudState] = useState<GameHudState>(DEFAULT_HUD_STATE)
  const [surfaceState, setSurfaceState] = useState<GameSurfaceState>(DEFAULT_SURFACE_STATE)

  const params = new URLSearchParams(location.search)
  const roomId = params.get('roomId')?.trim() || ''
  const agentId = params.get('agentId')?.trim() || ''

  const invoke = useCallback((name: keyof Window, ...args: unknown[]) => {
    const fn = window[name]
    if (typeof fn === 'function') {
      ;(fn as (...items: unknown[]) => void)(...args)
    }
  }, [])

  const invokeSurfaceAction = useCallback((action?: GameSurfaceAction) => {
    if (!action?.name) {
      return
    }

    const fn = window[action.name as keyof Window]
    if (typeof fn === 'function') {
      if (action.arg === undefined || action.arg === null) {
        ;(fn as (...items: unknown[]) => void)()
      } else {
        ;(fn as (...items: unknown[]) => void)(action.arg)
      }
    }
  }, [])

  const handleEffectPickSelect = useCallback((index: number) => {
    window.BP_NULSIGHT_GAME?.pickEffectIndex?.(index)
  }, [])

  const clearLongPress = useCallback((resetTriggered = false) => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    if (longPressTargetRef.current) {
      longPressTargetRef.current.classList.remove('pressing')
      longPressTargetRef.current = null
    }

    if (resetTriggered) {
      longPressTriggeredRef.current = false
    }
  }, [])

  const startLongPress = useCallback((event: ReactPointerEvent<HTMLElement>, onLongPress?: () => void) => {
    if (!onLongPress) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    clearLongPress(true)
    const target = event.currentTarget
    target.classList.add('pressing')
    longPressTargetRef.current = target
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true
      target.classList.remove('pressing')
      longPressTargetRef.current = null
      longPressTimerRef.current = null
      onLongPress()
    }, 420)
  }, [clearLongPress])

  const stopLongPress = useCallback(() => {
    clearLongPress(false)
  }, [clearLongPress])

  const shouldSuppressClick = useCallback(() => {
    if (!longPressTriggeredRef.current) {
      return false
    }

    longPressTriggeredRef.current = false
    return true
  }, [])

  const openInspectTarget = useCallback((inspectKey?: string, inspectUnit?: string) => {
    if (inspectUnit) {
      invoke('openCardOverlayByUnit', inspectUnit)
      return
    }
    if (inspectKey) {
      invoke('openCardOverlayByKey', inspectKey)
    }
  }, [invoke])

  const handleHandCardClick = useCallback((index: number) => {
    const fn = window.handleHandCardClick as ((event: unknown, index: number) => void) | undefined
    if (typeof fn === 'function') {
      fn(undefined, index)
    }
  }, [])

  const renderSlotButton = useCallback((slot: GameSlotState) => {
    const clickable = slot.className.includes('clickable')
    return (
      <button
        key={slot.key}
        className={slot.className}
        type="button"
        data-inspect-key={slot.inspectKey || undefined}
        data-inspect-unit={slot.inspectUnit || undefined}
        aria-disabled={!clickable}
        title={slot.inspectUnit || slot.inspectKey ? '클릭: 선택 또는 행동 · 더블 클릭: 카드 상세' : undefined}
        onPointerDown={(event) => startLongPress(event, slot.inspectUnit || slot.inspectKey ? () => openInspectTarget(slot.inspectKey, slot.inspectUnit) : undefined)}
        onPointerUp={stopLongPress}
        onPointerCancel={stopLongPress}
        onPointerLeave={stopLongPress}
        onClick={clickable ? () => {
          if (shouldSuppressClick()) return
          invokeSurfaceAction(slot.action)
        } : () => {
          shouldSuppressClick()
        }}
        onDoubleClick={slot.doubleAction ? () => invokeSurfaceAction(slot.doubleAction) : undefined}
        dangerouslySetInnerHTML={{ __html: slot.html }}
      />
    )
  }, [invokeSurfaceAction, openInspectTarget, shouldSuppressClick, startLongPress, stopLongPress])

  const actionGuide = (() => {
    if (surfaceState.uiLocked) {
      return '상태를 동기화하는 중입니다.'
    }

    switch (hudState.phaseText) {
      case '드로우':
        return '드로우 후 메인으로 넘어갑니다.'
      case '메인':
        return '손패를 고른 뒤 슬롯을 눌러 배치하세요.'
      case '배틀':
        return '내 유닛을 고른 뒤 공격 대상을 선택하세요.'
      case '엔드':
        return '행동을 마쳤다면 턴을 넘기세요.'
      default:
        return hudState.noticeText
    }
  })()

  const phaseSteps = ['드로우', '메인', '배틀', '엔드']
  const monsterSequence = ['M1', 'M2', 'M3']
  const spellSequence = ['S1', 'S2', 'S3', 'S4']
  const currentPhaseIndex = phaseSteps.indexOf(hudState.phaseText)
  const myDeck = renderPileText(surfaceState.myDeckText)
  const myGrave = renderPileText(surfaceState.myGraveText)
  const myBanish = renderPileText(surfaceState.myBanishText)
  const oppDeck = renderPileText(surfaceState.oppDeckText)
  const oppGrave = renderPileText(surfaceState.oppGraveText)
  const oppBanish = renderPileText(surfaceState.oppBanishText)
  const shared = getSharedCardsGlobal()
  const keywordText = shared?.KEYWORD_TEXT || {}
  const overlayCardKey = surfaceState.cardOverlayCardKey
  const overlayCardDef = resolveOverlayCardDef(overlayCardKey)
  const overlayKeywords = overlayCardDef
    ? extractKeywordTokens(overlayCardDef).map((name) => ({
        name,
        description: keywordText[name] || '카드 효과 텍스트 문맥에 따라 처리됩니다.',
      }))
    : []
  const priorityState = surfaceState.uiLocked
    ? '동기화 중'
    : surfaceState.passButtonDisabled
      ? '상대 또는 없음'
      : '내가 보유'
  const timingState = surfaceState.activeActions.length > 0
    ? `효과 ${surfaceState.activeActions.length}개`
    : surfaceState.stackEntries.length > 0
      ? '체인 대기'
      : '열린 창 없음'
  const commandMetaItems = [
    { label: '우선권', value: priorityState },
    { label: '타이밍', value: timingState },
  ]

  const renderSummary = useCallback((summary: PlayerSummary, scope: 'me' | 'opp') => (
    <>
      <div className="stat-box stat-hp" aria-label={scope === 'me' ? '내 체력' : '상대 체력'}>
        <div className="stat-label">체력</div>
        <div className="stat-value">{summary.hp}</div>
      </div>
      <div className="stat-box stat-mana" aria-label={scope === 'me' ? '내 마나' : '상대 마나'}>
        <div className="stat-label">마나</div>
        <div className="stat-value">{summary.mana}</div>
      </div>
      <div className="stat-box" aria-label={scope === 'me' ? '내 손패' : '상대 손패'}>
        <div className="stat-label">손패</div>
        <div className="stat-value">{summary.hand}</div>
      </div>
    </>
  ), [])
  const renderZoneRow = (rowId: string, className: string, labels: string[], nodes: GameSlotState[]) => (
    <div className={`zone-row zone-row--labeled zone-row--${className}`}>
      <div className="zone-row__labels" aria-hidden="true">
        {labels.map((label) => (
          <span className="zone-row__label" key={`${rowId}-${label}`}>
            {label}
          </span>
        ))}
      </div>
      <div id={rowId} className={`slots ${className}`}>
        {nodes.map(renderSlotButton)}
      </div>
    </div>
  )

  useEffect(() => {
    return () => {
      clearLongPress(true)
    }
  }, [clearLongPress])

  useEffect(() => {
    window.BP_NULSIGHT_GAME = {
      ...(window.BP_NULSIGHT_GAME || {}),
      setHudState: (nextState) => {
        setHudState({
          ...DEFAULT_HUD_STATE,
          ...nextState,
          badges: Array.isArray(nextState?.badges) ? nextState.badges : [],
        })
      },
      setSurfaceState: (nextState) => {
        setSurfaceState((current) => ({
          ...current,
          ...nextState,
        }))
      },
    }

    return () => {
      if (window.BP_NULSIGHT_GAME?.setHudState) {
        delete window.BP_NULSIGHT_GAME.setHudState
      }
      if (window.BP_NULSIGHT_GAME?.setSurfaceState) {
        delete window.BP_NULSIGHT_GAME.setSurfaceState
      }
      if (window.BP_NULSIGHT_GAME?.pickEffectIndex) {
        delete window.BP_NULSIGHT_GAME.pickEffectIndex
      }
      setHudState(DEFAULT_HUD_STATE)
      setSurfaceState(DEFAULT_SURFACE_STATE)
    }
  }, [])

  useEffect(() => {
    if (!roomId || !agentId) {
      return
    }

    let disposed = false
    const cleanupStyles = ensureStyles()
    const cleanupBridges = installGameRuntimeBridges()
    const loadedScripts: HTMLScriptElement[] = []

    async function mountGame() {
      // Loading, session, termbook, format, and card-render globals now come from
      // React/runtime bridges, so the game page only mounts the gameplay runtime.
      window.BP_NULSIGHT_GAME?.teardown?.()

      for (const entry of GAME_SCRIPTS) {
        if (disposed) {
          return
        }

        const script = await loadScript(entry.id, entry.src)
        loadedScripts.push(script)
      }
    }

    void mountGame()

    return () => {
      disposed = true
      window.BP_NULSIGHT_GAME?.teardown?.()
      for (const script of loadedScripts) {
        script.remove()
      }
      document.getElementById('bpLoading')?.remove()
      cleanupBridges()
      cleanupStyles()
    }
  }, [agentId, roomId])

  useEffect(() => {
    const hasOverlay =
      surfaceState.endOverlayVisible ||
      surfaceState.graveVisible ||
      surfaceState.stackVisible ||
      surfaceState.cardOverlayVisible ||
      surfaceState.effectPickVisible ||
      surfaceState.queryVisible

    document.body.classList.toggle('nulsight-game-overlay-open', hasOverlay)

    return () => {
      document.body.classList.remove('nulsight-game-overlay-open')
    }
  }, [
    surfaceState.cardOverlayVisible,
    surfaceState.effectPickVisible,
    surfaceState.endOverlayVisible,
    surfaceState.graveVisible,
    surfaceState.queryVisible,
    surfaceState.stackVisible,
  ])

  if (!roomId || !agentId) {
    return (
      <GatedPageNotice
        kicker="대전"
        title="대전은 대기실에서 시작합니다."
        description="방 생성이나 입장이 완료되면 인게임으로 자동 이동합니다."
        primaryAction={{ label: '대기실로 이동', onClick: () => navigate('/lobby') }}
        secondaryAction={{ label: '가이드 보기', onClick: () => navigate('/guide') }}
      />
    )
  }

  return (
    <>
      <NulsightPageFrame className="nulsight-shell nulsight-shell--game game-wrap" width="game">
        <GameStatusStrip
          currentPhaseIndex={currentPhaseIndex}
          hudState={hudState}
          phaseSteps={phaseSteps}
        />

        <section ref={duelStageRef} className="duel-stage" aria-label="듀얼 스테이지">
          <GameFxLayer surfaceRef={duelStageRef} />

          <section className="board" aria-label="필드">
            <article className="zone-block opp nulsight-panel">
              <div className="zone-title-row">
                <p className="nulsight-kicker zone-kicker">상대</p>
                <h2 className="zone-title">상대 필드</h2>
              </div>
              <div className="field-matrix">
                <div className="field-main">
                  {renderZoneRow('oppSpell', 'spell', spellSequence, surfaceState.oppSpellSlots)}
                  {renderZoneRow('oppMon', 'monster', monsterSequence, surfaceState.oppMonsterSlots)}
                </div>
                <div className="field-side">
                  <button
                    id="oppGrave"
                    className={`utility-zone${surfaceState.oppGraveActive ? ' is-live' : ''}`}
                    type="button"
                    onClick={() => invoke('openGrave', 'opp')}
                    title="상대 무덤 보기"
                  >
                    <span className="utility-zone__label">{oppGrave.label}</span>
                    <span className="utility-zone__value">{oppGrave.value}</span>
                  </button>
                  <button id="oppDeck" className="utility-zone" type="button" title="상대 덱 수">
                    <span className="utility-zone__label">{oppDeck.label}</span>
                    <span className="utility-zone__value">{oppDeck.value}</span>
                  </button>
                  <button
                    id="oppBanish"
                    className={`utility-zone${surfaceState.oppBanishActive ? ' is-live' : ''}`}
                    type="button"
                    onClick={() => invoke('openBanish', 'opp')}
                    title="상대 제외 보기"
                  >
                    <span className="utility-zone__label">{oppBanish.label}</span>
                    <span className="utility-zone__value">{oppBanish.value}</span>
                  </button>
                </div>
              </div>
              <div className="zone-footer">
                <div id="oppSide" className="side">
                  {renderSummary(surfaceState.oppSummary, 'opp')}
                </div>
                  <ButtonSurface
                    id="oppAttackPanel"
                    className="attack-agent nulsight-button nulsight-button--primary"
                    disabled={surfaceState.attackDisabled || surfaceState.uiLocked}
                    onClick={() => invoke('attackOpponentAgent')}
                    variant="solid"
                  >
                    본체 공격
                  </ButtonSurface>
              </div>
            </article>

            <GameCommandBar
              actionGuide={actionGuide}
              activeActions={surfaceState.activeActions}
              commandMetaItems={commandMetaItems}
              concedeDisabled={surfaceState.concedeDisabled}
              endButtonDisabled={surfaceState.endButtonDisabled}
              endButtonLabel={surfaceState.endButtonLabel}
              passButtonDisabled={surfaceState.passButtonDisabled}
              passButtonLabel={surfaceState.passButtonLabel}
              stackActive={surfaceState.stackActive}
              stackEntriesCount={surfaceState.stackEntries.length}
              uiLocked={surfaceState.uiLocked}
              onConcede={() => invoke('concedeAndExit')}
              onEndPhase={() => invoke('act', 'end_phase')}
              onPassPriority={() => invoke('act', 'priority_pass')}
              onStackOpen={() => invoke('openStackOverlay')}
              onSurfaceAction={invokeSurfaceAction}
            />

            <article className="zone-block me nulsight-panel">
              <div className="zone-title-row">
                <p className="nulsight-kicker zone-kicker">나</p>
                <h2 className="zone-title">내 필드</h2>
              </div>
              <div className="field-matrix">
                <div className="field-main">
                  {renderZoneRow('myMon', 'monster', monsterSequence, surfaceState.myMonsterSlots)}
                  {renderZoneRow('mySpell', 'spell', spellSequence, surfaceState.mySpellSlots)}
                </div>
                <div className="field-side">
                  <button
                    id="myGrave"
                    className={`utility-zone${surfaceState.myGraveActive ? ' is-live' : ''}`}
                    type="button"
                    onClick={() => invoke('openGrave', 'me')}
                    title="내 무덤 보기"
                  >
                    <span className="utility-zone__label">{myGrave.label}</span>
                    <span className="utility-zone__value">{myGrave.value}</span>
                  </button>
                  <button id="myDeck" className="utility-zone" type="button" title="내 덱 수">
                    <span className="utility-zone__label">{myDeck.label}</span>
                    <span className="utility-zone__value">{myDeck.value}</span>
                  </button>
                  <button
                    id="myBanish"
                    className={`utility-zone${surfaceState.myBanishActive ? ' is-live' : ''}`}
                    type="button"
                    onClick={() => invoke('openBanish', 'me')}
                    title="내 제외 보기"
                  >
                    <span className="utility-zone__label">{myBanish.label}</span>
                    <span className="utility-zone__value">{myBanish.value}</span>
                  </button>
                </div>
              </div>
              <div className="zone-footer">
                <div id="mySide" className="side">
                  {renderSummary(surfaceState.mySummary, 'me')}
                </div>
              </div>
            </article>
          </section>

          <section className="hand-wrap nulsight-panel nulsight-panel--compact" aria-label="손패">
            <div className="nulsight-panel__head hand-head">
              <div>
                <p className="nulsight-kicker hud-kicker">손패</p>
                <h2 className="game-section-title">손패</h2>
              </div>
              <span className="hand-head__status">
                {surfaceState.uiLocked ? '처리 중' : '클릭: 선택 · 다시 클릭/길게 누르기: 카드 상세'}
              </span>
            </div>
            <div
              id="hand"
              className={`hand${surfaceState.handOverlapEnabled ? ' is-overlap' : ''}`}
              style={{ '--hand-overlap': `${surfaceState.handOverlapPx}px` } as React.CSSProperties}
            >
              {surfaceState.handCards.length > 0 ? (
                surfaceState.handCards.map((card) => (
                  <button
                    key={card.key}
                    className={card.className}
                    type="button"
                    data-hand-index={card.index}
                    data-inspect-key={card.cardKey}
                    style={{ '--hand-i': card.index } as React.CSSProperties}
                    title="클릭: 선택 · 다시 클릭/더블 클릭: 카드 상세"
                    onPointerDown={(event) => startLongPress(event, () => invoke('openCardOverlayByKey', card.cardKey))}
                    onPointerUp={stopLongPress}
                    onPointerCancel={stopLongPress}
                    onPointerLeave={stopLongPress}
                    onClick={() => {
                      if (shouldSuppressClick()) return
                      handleHandCardClick(card.index)
                    }}
                    onDoubleClick={() => invoke('openCardOverlayByKey', card.cardKey)}
                    dangerouslySetInnerHTML={{ __html: card.html }}
                  />
                ))
              ) : (
                <div className="muted hand-empty">{surfaceState.handEmptyText}</div>
              )}
            </div>
          </section>
        </section>
      </NulsightPageFrame>

      <GameOverlayDialog
        id="stackOverlay"
        visible={surfaceState.stackVisible}
        ariaLabel="스택 상태"
        panelClassName="stack-overlay__panel"
        eyebrow="효과 처리"
        title="스택"
        subtitle={surfaceState.stackEntries.length > 0 ? `${surfaceState.stackEntries.length}개 대기 중` : '대기 중인 효과가 없습니다.'}
        actions={
          <ButtonSurface className="nulsight-button" onClick={() => invoke('closeStackOverlay')}>
            닫기
          </ButtonSurface>
        }
        body={
          <div className="stack-overlay__list">
            {surfaceState.stackEntries.length > 0 ? (
              surfaceState.stackEntries.map((entry) => (
                <article key={entry.key} className="stack-entry">
                  <div className="stack-entry__card">
                    <GameCardSurface cardKey={entry.cardKey} />
                  </div>
                  <div className="stack-entry__body">
                    <div className="stack-entry__actor">{entry.actorText}</div>
                    <div className="stack-entry__summary">{entry.summaryText}</div>
                  </div>
                </article>
              ))
            ) : (
              <div className="muted">대기 중인 스택이 없습니다.</div>
            )}
          </div>
        }
        onBackdropClick={() => invoke('closeStackOverlay')}
      />

      <div id="gameEndOverlay" className={`game-end-overlay${surfaceState.endOverlayVisible ? '' : ' hidden'}`}>
        <div className="game-end-box">
          <div id="gameEndText">{surfaceState.endOverlayText}</div>
          <ButtonSurface
            className="nulsight-button nulsight-button--primary"
            onClick={() => invoke('goLobby', true)}
            variant="solid"
          >
            대기실로 이동
          </ButtonSurface>
        </div>
      </div>

      <GameOverlayDialog
        id="graveDrawer"
        visible={surfaceState.graveVisible}
        ariaLabel="카드 더미 목록"
        panelClassName="pile-overlay__panel"
        eyebrow="더미"
        title={<span id="graveDrawerTitle">{surfaceState.graveTitle}</span>}
        actions={
          <ButtonSurface className="nulsight-button" onClick={() => invoke('closeGrave')}>
            닫기
          </ButtonSurface>
        }
        body={
          <div id="graveList" className="pile-overlay__list">
            {surfaceState.graveCards.length > 0 ? (
              surfaceState.graveCards.map((card) => (
                <button
                  key={card.key}
                  className={card.className}
                  type="button"
                  data-inspect-key={card.cardKey}
                  title="클릭: 카드 상세"
                  onPointerDown={(event) => startLongPress(event, () => invoke('openCardOverlayByKey', card.cardKey))}
                  onPointerUp={stopLongPress}
                  onPointerCancel={stopLongPress}
                  onPointerLeave={stopLongPress}
                  onClick={() => {
                    if (shouldSuppressClick()) return
                    invoke('openCardOverlayByKey', card.cardKey)
                  }}
                  onDoubleClick={() => invoke('openCardOverlayByKey', card.cardKey)}
                >
                  <GameCardSurface cardKey={card.cardKey} />
                </button>
              ))
            ) : (
              <div className="muted">카드가 없습니다.</div>
            )}
          </div>
        }
        onBackdropClick={() => invoke('closeGrave')}
      />

      <GameOverlayDialog
        id="cardInspectOverlay"
        visible={surfaceState.cardOverlayVisible}
        ariaLabel="카드 상세 정보"
        eyebrow="카드"
        title={overlayCardDef?.name || overlayCardKey || '카드 정보'}
        subtitle={`종류 ${cardTypeLabel(overlayCardDef)} · 코스트 ${overlayCardDef?.cost ?? 0}`}
        actions={
          <ButtonSurface className="nulsight-button" onClick={() => invoke('closeCardOverlay')}>
            닫기
          </ButtonSurface>
        }
        body={
          <div className="card-overlay__content">
            <div id="cardOverlayPreview" className="card-overlay__preview">
              {overlayCardKey ? (
                <div className="card-overlay__preview-card">
                  <GameCardSurface cardKey={overlayCardKey} />
                </div>
              ) : null}
            </div>
            <div className="card-overlay__body">
              <div id="cardOverlayMeta" className="card-overlay__meta">
                <div className="card-overlay__effect">
                  {normalizeEffectText(overlayCardDef?.effect || '') || '효과 없음'}
                </div>
              </div>
              <div>
                <h3 className="card-overlay__sub">키워드 설명</h3>
                <div id="cardOverlayKeywords" className="card-overlay__keywords">
                  {overlayKeywords.length > 0 ? (
                    overlayKeywords.map((entry) => (
                      <div key={entry.name} className="card-overlay__kw">
                        <strong>{entry.name}</strong>
                        <span>{entry.description}</span>
                      </div>
                    ))
                  ) : (
                    <div className="muted">키워드 없음</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        }
        onBackdropClick={() => invoke('closeCardOverlay')}
      />

      <GameOverlayDialog
        id="effectPickOverlay"
        visible={surfaceState.effectPickVisible}
        ariaLabel="효과 카드 선택"
        panelClassName="effect-pick-overlay__panel"
        eyebrow="효과 선택"
        title={<span id="effectPickTitle">{surfaceState.effectPickTitle}</span>}
        subtitle={<span id="effectPickGuide" className="muted effect-pick-overlay__guide">{surfaceState.effectPickGuide}</span>}
        actions={
          <ButtonSurface className="nulsight-button" onClick={() => invoke('closeEffectPickOverlay', false)}>
            취소
          </ButtonSurface>
        }
        body={
          <div id="effectPickList" className="effect-pick-overlay__list">
            {surfaceState.effectPickCards.length > 0 ? (
              surfaceState.effectPickCards.map((card) => (
                <button
                  key={card.key}
                  className={card.className}
                  type="button"
                  data-pick-index={card.pickIndex}
                  data-inspect-key={card.cardKey}
                  title="클릭: 이 카드 선택 · 더블 클릭: 카드 상세"
                  onPointerDown={(event) => startLongPress(event, () => invoke('openCardOverlayByKey', card.cardKey))}
                  onPointerUp={stopLongPress}
                  onPointerCancel={stopLongPress}
                  onPointerLeave={stopLongPress}
                  onClick={() => {
                    if (shouldSuppressClick()) return
                    if (typeof card.pickIndex === 'number') {
                      handleEffectPickSelect(card.pickIndex)
                    }
                  }}
                  onDoubleClick={() => invoke('openCardOverlayByKey', card.cardKey)}
                >
                  <GameCardSurface cardKey={card.cardKey} />
                </button>
              ))
            ) : (
              <div className="muted">선택 가능한 카드가 없어요.</div>
            )}
          </div>
        }
        onBackdropClick={() => invoke('closeEffectPickOverlay', false)}
      />

      <GameOverlayDialog
        id="queryOverlay"
        visible={surfaceState.queryVisible}
        ariaLabel="질의"
        panelClassName="query-overlay__panel"
        eyebrow="선택"
        title={surfaceState.queryTitle}
        body={<p className="query-overlay__message">{surfaceState.queryMessage}</p>}
        footer={
          <ChoiceGrid
            className="query-overlay__actions"
            columnsClassName="ui-shell-choice-grid--two"
            items={surfaceState.queryOptions.map((option) => ({
              key: `${option.value}-${option.label}`,
              label: option.label,
              onClick: () => invoke('respondQueryOverlay', option.value),
              active: option.tone === 'primary',
            }))}
          />
        }
      />
    </>
  )
}
