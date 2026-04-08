import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GameFxLayer } from '../app/components/GameFxLayer'
import { GatedPageNotice } from '../app/components/GatedPageNotice'

const GAME_STYLES = [
  { id: 'nulsight-game-style-core', href: '/styles.css' },
  { id: 'nulsight-game-style-board', href: '/game.css' },
] as const

const GAME_SCRIPTS = [
  { id: 'nulsight-game-script-layout', src: '/js/layout.js' },
  { id: 'nulsight-game-script-termbook', src: '/js/termbook.js' },
  { id: 'nulsight-game-script-session', src: '/js/game-session.js' },
  { id: 'nulsight-game-script-format', src: '/js/game-format.js' },
  { id: 'nulsight-game-script-card-render', src: '/js/card-render.js' },
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
    closeGrave?: () => void
    closeCardOverlay?: () => void
    closeEffectPickOverlay?: (commit?: boolean) => void
    openCardOverlayByKey?: (key: string) => void
    openCardOverlayByUnit?: (unitId: string) => void
    handleHandCardClick?: (event: unknown, index: number) => void
  }
}

type GameHudState = {
  turnText: string
  turnTone: 'me' | 'opp'
  phaseText: string
  focusText: string
  noticeText: string
  badges: string[]
}

type PlayerSummary = {
  hp: string
  mana: string
  hand: string
}

type GameSurfaceAction = {
  name: string
  arg?: string | number | boolean | null
}

type GameSlotState = {
  key: string
  html: string
  className: string
  inspectKey?: string
  inspectUnit?: string
  action?: GameSurfaceAction
  doubleAction?: GameSurfaceAction
}

type GameHandCardState = {
  key: string
  cardKey: string
  index: number
  className: string
  html: string
}

type GameOverlayCardState = {
  key: string
  cardKey: string
  className: string
  html: string
  pickIndex?: number
}

type GameSurfaceState = {
  myDeckText: string
  oppDeckText: string
  myGraveText: string
  oppGraveText: string
  endButtonLabel: string
  endButtonDisabled: boolean
  passButtonLabel: string
  passButtonDisabled: boolean
  concedeDisabled: boolean
  attackDisabled: boolean
  uiLocked: boolean
  mySummary: PlayerSummary
  oppSummary: PlayerSummary
  endOverlayVisible: boolean
  endOverlayText: string
  graveVisible: boolean
  graveTitle: string
  cardOverlayVisible: boolean
  cardOverlayPreviewHtml: string
  cardOverlayMetaHtml: string
  cardOverlayKeywordsHtml: string
  effectPickVisible: boolean
  effectPickTitle: string
  effectPickGuide: string
  effectPickCards: GameOverlayCardState[]
  graveCards: GameOverlayCardState[]
  myMonsterSlots: GameSlotState[]
  oppMonsterSlots: GameSlotState[]
  mySpellSlots: GameSlotState[]
  oppSpellSlots: GameSlotState[]
  handCards: GameHandCardState[]
  handOverlapPx: number
  handOverlapEnabled: boolean
  handEmptyText: string
}

const DEFAULT_HUD_STATE: GameHudState = {
  turnText: '턴 정보 불러오는 중',
  turnTone: 'opp',
  phaseText: '-',
  focusText: '선택 없음',
  noticeText: '선택: 없음',
  badges: [],
}

const DEFAULT_SURFACE_STATE: GameSurfaceState = {
  myDeckText: '덱 0',
  oppDeckText: '덱 0',
  myGraveText: '무덤 0',
  oppGraveText: '무덤 0',
  endButtonLabel: 'Phase 진행',
  endButtonDisabled: true,
  passButtonLabel: '우선권 패스',
  passButtonDisabled: true,
  concedeDisabled: false,
  attackDisabled: true,
  uiLocked: false,
  mySummary: {
    hp: '-',
    mana: '-/-',
    hand: '-',
  },
  oppSummary: {
    hp: '-',
    mana: '-/-',
    hand: '-',
  },
  endOverlayVisible: false,
  endOverlayText: '게임 종료',
  graveVisible: false,
  graveTitle: '무덤',
  cardOverlayVisible: false,
  cardOverlayPreviewHtml: '',
  cardOverlayMetaHtml: '',
  cardOverlayKeywordsHtml: '',
  effectPickVisible: false,
  effectPickTitle: '효과 카드 선택',
  effectPickGuide: '카드를 눌러 선택해줘.',
  effectPickCards: [],
  graveCards: [],
  myMonsterSlots: [],
  oppMonsterSlots: [],
  mySpellSlots: [],
  oppSpellSlots: [],
  handCards: [],
  handOverlapPx: 0,
  handOverlapEnabled: false,
  handEmptyText: '',
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

export function GamePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const duelStageRef = useRef<HTMLElement | null>(null)
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
        onClick={clickable ? () => invokeSurfaceAction(slot.action) : undefined}
        onDoubleClick={slot.doubleAction ? () => invokeSurfaceAction(slot.doubleAction) : undefined}
        dangerouslySetInnerHTML={{ __html: slot.html }}
      />
    )
  }, [invokeSurfaceAction])

  const actionGuide = (() => {
    if (surfaceState.uiLocked) {
      return '상태를 동기화하고 있어요. 잠시만 기다려주세요.'
    }

    switch (hudState.phaseText) {
      case '드로우':
        return '드로우가 끝나면 메인 단계로 넘어가 배치를 준비합니다.'
      case '메인':
        return '손패를 먼저 고른 뒤, 필드 슬롯을 눌러 유닛이나 마법을 배치하세요.'
      case '배틀':
        return '내 유닛을 고른 뒤 상대 유닛이나 본체 공격 버튼을 선택하세요.'
      case '엔드':
        return '이번 턴 행동을 마쳤다면 턴 종료로 넘어가면 됩니다.'
      default:
        return hudState.noticeText
    }
  })()

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
    const loadedScripts: HTMLScriptElement[] = []

    async function mountGame() {
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
      cleanupStyles()
    }
  }, [agentId, roomId])

  useEffect(() => {
    const hasOverlay =
      surfaceState.endOverlayVisible ||
      surfaceState.graveVisible ||
      surfaceState.cardOverlayVisible ||
      surfaceState.effectPickVisible

    document.body.classList.toggle('nulsight-game-overlay-open', hasOverlay)

    return () => {
      document.body.classList.remove('nulsight-game-overlay-open')
    }
  }, [
    surfaceState.cardOverlayVisible,
    surfaceState.effectPickVisible,
    surfaceState.endOverlayVisible,
    surfaceState.graveVisible,
  ])

  if (!roomId || !agentId) {
    return (
      <GatedPageNotice
        kicker="MATCH"
        title="대전은 대기실에서 시작합니다."
        description="방 생성이나 입장이 완료되면 인게임으로 자동 이동합니다."
        primaryAction={{ label: '대기실로 이동', onClick: () => navigate('/lobby') }}
        secondaryAction={{ label: '가이드 보기', onClick: () => navigate('/guide') }}
      />
    )
  }

  return (
    <>
      <main className="nulsight-shell nulsight-shell--game game-wrap" role="main">
        <section className="hud game-status-strip" aria-label="전황 정보">
          <div className="game-status-strip__main">
            <div className="game-status-strip__identity">
              <p className="nulsight-kicker hud-kicker">DUEL</p>
              <h1 className="game-section-title">Nulsight Match</h1>
            </div>
            <div className={`hud-turn ${hudState.turnTone === 'me' ? 'is-me' : 'is-opp'}`}>
              {hudState.turnText}
            </div>
            <div className="hud-phase">
              {hudState.phaseText}
            </div>
          </div>
          <div className="game-status-strip__sub">
            <div className="hud-focus">
              {hudState.focusText}
            </div>
            <div className="hud-notice">
              {hudState.noticeText}
            </div>
            <div className="hud-meta">
              {hudState.badges.map((badge) => (
                <span className="badge" key={badge}>
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section ref={duelStageRef} className="duel-stage" aria-label="듀얼 스테이지">
          <GameFxLayer surfaceRef={duelStageRef} />

          <section className="board" aria-label="필드">
            <article className="zone-block opp nulsight-panel">
              <div className="zone-title-row">
                <p className="nulsight-kicker zone-kicker">OPPONENT</p>
                <h2 className="zone-title">상대 필드</h2>
              </div>
              <div className="field-matrix">
                <div className="field-main">
                  <div className="zone-row">
                    <div id="oppMon" className="slots monster">
                      {surfaceState.oppMonsterSlots.map(renderSlotButton)}
                    </div>
                  </div>
                  <div className="zone-row">
                    <div id="oppSpell" className="slots spell">
                      {surfaceState.oppSpellSlots.map(renderSlotButton)}
                    </div>
                  </div>
                </div>
                <div className="field-side">
                  <button
                    id="oppGrave"
                    className="utility-zone"
                    type="button"
                    onClick={() => invoke('openGrave', 'opp')}
                  >
                    {surfaceState.oppGraveText}
                  </button>
                  <button id="oppDeck" className="utility-zone" type="button">
                    {surfaceState.oppDeckText}
                  </button>
                </div>
              </div>
              <div className="zone-footer">
                <div id="oppSide" className="side">
                  {renderSummary(surfaceState.oppSummary, 'opp')}
                </div>
                <button
                  id="oppAttackPanel"
                  className="attack-agent nulsight-button nulsight-button--primary"
                  type="button"
                  disabled={surfaceState.attackDisabled || surfaceState.uiLocked}
                  onClick={() => invoke('attackOpponentAgent')}
                >
                  본체 공격
                </button>
              </div>
            </article>

            <section className="game-toolbar game-toolbar--rail" aria-label="게임 조작">
              <div className="game-toolbar__identity">
                <p className="nulsight-kicker zone-kicker">COMMAND</p>
                <p className="game-toolbar__guide">{actionGuide}</p>
              </div>
              <div className="game-toolbar__actions">
                <button
                  id="btnConcede"
                  className="nulsight-button"
                  type="button"
                  disabled={surfaceState.concedeDisabled || surfaceState.uiLocked}
                  onClick={() => invoke('concedeAndExit')}
                >
                  항복
                </button>
                <button
                  id="btnStack"
                  className="nulsight-button"
                  type="button"
                  disabled={surfaceState.passButtonDisabled || surfaceState.uiLocked}
                  onClick={() => invoke('act', 'priority_pass')}
                >
                  {surfaceState.passButtonLabel}
                </button>
                <button
                  id="btnEnd"
                  className="nulsight-button nulsight-button--primary"
                  type="button"
                  disabled={surfaceState.endButtonDisabled || surfaceState.uiLocked}
                  onClick={() => invoke('act', 'end_phase')}
                >
                  {surfaceState.endButtonLabel}
                </button>
              </div>
            </section>

            <article className="zone-block me nulsight-panel">
              <div className="zone-title-row">
                <p className="nulsight-kicker zone-kicker">PLAYER</p>
                <h2 className="zone-title">내 필드</h2>
              </div>
              <div className="field-matrix">
                <div className="field-main">
                  <div className="zone-row">
                    <div id="myMon" className="slots monster">
                      {surfaceState.myMonsterSlots.map(renderSlotButton)}
                    </div>
                  </div>
                  <div className="zone-row">
                    <div id="mySpell" className="slots spell">
                      {surfaceState.mySpellSlots.map(renderSlotButton)}
                    </div>
                  </div>
                </div>
                <div className="field-side">
                  <button
                    id="myGrave"
                    className="utility-zone"
                    type="button"
                    onClick={() => invoke('openGrave', 'me')}
                  >
                    {surfaceState.myGraveText}
                  </button>
                  <button id="myDeck" className="utility-zone" type="button">
                    {surfaceState.myDeckText}
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
                <p className="nulsight-kicker hud-kicker">HAND</p>
                <h2 className="game-section-title">손패</h2>
              </div>
              <span className="hand-head__status">
                {surfaceState.uiLocked ? '처리 중이에요.' : '클릭: 선택 · 다시 클릭/길게 누르기: 카드 상세'}
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
                    onClick={() => handleHandCardClick(card.index)}
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
      </main>

      <div id="gameEndOverlay" className={`game-end-overlay${surfaceState.endOverlayVisible ? '' : ' hidden'}`}>
        <div className="game-end-box">
          <div id="gameEndText">{surfaceState.endOverlayText}</div>
          <button
            className="nulsight-button nulsight-button--primary"
            type="button"
            onClick={() => invoke('goLobby', true)}
          >
            대기실로 이동
          </button>
        </div>
      </div>

      <aside id="graveDrawer" className={`grave-drawer${surfaceState.graveVisible ? '' : ' hidden'}`} aria-label="무덤 카드 목록">
        <div className="grave-drawer__head">
          <strong id="graveDrawerTitle">{surfaceState.graveTitle}</strong>
          <button className="nulsight-button" type="button" onClick={() => invoke('closeGrave')}>
            닫기
          </button>
        </div>
        <div
          id="graveList"
          className="grave-drawer__list"
        >
          {surfaceState.graveCards.length > 0 ? (
            surfaceState.graveCards.map((card) => (
              <button
                key={card.key}
                className={card.className}
                type="button"
                data-inspect-key={card.cardKey}
                onClick={() => invoke('openCardOverlayByKey', card.cardKey)}
                onDoubleClick={() => invoke('openCardOverlayByKey', card.cardKey)}
                dangerouslySetInnerHTML={{ __html: card.html }}
              />
            ))
          ) : (
            <div className="muted">무덤이 비어 있어요.</div>
          )}
        </div>
      </aside>

      <section
        id="cardInspectOverlay"
        className={`card-overlay${surfaceState.cardOverlayVisible ? '' : ' hidden'}`}
        aria-label="카드 상세 정보"
        aria-modal="true"
        role="dialog"
      >
        <div className="card-overlay__backdrop" onClick={() => invoke('closeCardOverlay')} />
        <article className="card-overlay__panel">
          <header className="card-overlay__head">
            <strong>카드 정보</strong>
            <button className="nulsight-button" type="button" onClick={() => invoke('closeCardOverlay')}>
              닫기
            </button>
          </header>
          <div className="card-overlay__content">
            <div
              id="cardOverlayPreview"
              className="card-overlay__preview"
              dangerouslySetInnerHTML={{ __html: surfaceState.cardOverlayPreviewHtml }}
            />
            <div className="card-overlay__body">
              <div
                id="cardOverlayMeta"
                className="card-overlay__meta"
                dangerouslySetInnerHTML={{ __html: surfaceState.cardOverlayMetaHtml }}
              />
              <div>
                <h3 className="card-overlay__sub">키워드 설명</h3>
                <div
                  id="cardOverlayKeywords"
                  className="card-overlay__keywords"
                  dangerouslySetInnerHTML={{ __html: surfaceState.cardOverlayKeywordsHtml }}
                />
              </div>
            </div>
          </div>
        </article>
      </section>

      <section
        id="effectPickOverlay"
        className={`card-overlay${surfaceState.effectPickVisible ? '' : ' hidden'}`}
        aria-label="효과 카드 선택"
        aria-modal="true"
        role="dialog"
      >
        <div className="card-overlay__backdrop" onClick={() => invoke('closeEffectPickOverlay', false)} />
        <article className="card-overlay__panel effect-pick-overlay__panel">
          <header className="card-overlay__head">
            <strong id="effectPickTitle">{surfaceState.effectPickTitle}</strong>
            <button className="nulsight-button" type="button" onClick={() => invoke('closeEffectPickOverlay', false)}>
              취소
            </button>
          </header>
          <p id="effectPickGuide" className="muted effect-pick-overlay__guide">
            {surfaceState.effectPickGuide}
          </p>
          <div
            id="effectPickList"
            className="effect-pick-overlay__list"
          >
            {surfaceState.effectPickCards.length > 0 ? (
              surfaceState.effectPickCards.map((card) => (
                <button
                  key={card.key}
                  className={card.className}
                  type="button"
                  data-pick-index={card.pickIndex}
                  data-inspect-key={card.cardKey}
                  onClick={() => {
                    if (typeof card.pickIndex === 'number') {
                      handleEffectPickSelect(card.pickIndex)
                    }
                  }}
                  onDoubleClick={() => invoke('openCardOverlayByKey', card.cardKey)}
                  dangerouslySetInnerHTML={{ __html: card.html }}
                />
              ))
            ) : (
              <div className="muted">선택 가능한 카드가 없어요.</div>
            )}
          </div>
        </article>
      </section>
    </>
  )
}
