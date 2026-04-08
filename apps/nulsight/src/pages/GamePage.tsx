import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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

const GAME_MARKUP = `
  <main class="nulsight-shell nulsight-shell--game game-wrap" role="main">
    <section class="hud nulsight-panel nulsight-panel--compact" aria-label="전황 정보">
      <div class="nulsight-panel__head hud-head">
        <div>
          <p class="nulsight-kicker hud-kicker">MATCH</p>
          <h1 class="game-section-title">대전 상황</h1>
        </div>
      </div>
      <div class="hud-main">
        <div id="turnBanner" class="hud-turn">턴 정보 불러오는 중</div>
        <div id="phaseBadge" class="hud-phase">-</div>
      </div>
      <div class="hud-sub">
        <div id="focusChip" class="hud-focus">선택 없음</div>
        <div id="metaBadges" class="hud-meta"></div>
      </div>
      <div id="selectedInfo" class="hud-notice">선택: 없음</div>
    </section>

    <section class="board" aria-label="필드">
      <article class="zone-block opp nulsight-panel">
        <h2 class="zone-title">상대 필드</h2>
        <div class="field-matrix">
          <div class="field-main">
            <div class="zone-row"><div id="oppMon" class="slots monster"></div></div>
            <div class="zone-row"><div id="oppSpell" class="slots spell"></div></div>
          </div>
          <div class="field-side">
            <button id="oppGrave" class="utility-zone" type="button" onclick="openGrave('opp')">무덤 0</button>
            <button id="oppDeck" class="utility-zone" type="button">덱 0</button>
          </div>
        </div>
        <div class="zone-footer">
          <div id="oppSide" class="side"></div>
          <button
            id="oppAttackPanel"
            class="attack-agent nulsight-button nulsight-button--primary"
            onclick="attackOpponentAgent()"
          >
            본체 공격
          </button>
        </div>
      </article>

      <section class="game-toolbar inboard nulsight-panel nulsight-panel--compact" aria-label="게임 조작">
        <div class="nulsight-panel__head game-toolbar__head">
          <p class="nulsight-kicker hud-kicker">ACTION</p>
          <h2 class="game-section-title">현재 행동</h2>
        </div>
        <div class="game-toolbar__actions">
        <button type="button" id="btnConcede" class="nulsight-button" onclick="concedeAndExit()">항복</button>
        <button type="button" id="btnStack" class="nulsight-button" onclick="act('priority_pass')">우선권 패스</button>
        <button type="button" id="btnEnd" class="nulsight-button nulsight-button--primary" onclick="act('end_phase')">Phase 진행</button>
        </div>
      </section>

      <article class="zone-block me nulsight-panel">
        <h2 class="zone-title">내 필드</h2>
        <div class="field-matrix">
          <div class="field-main">
            <div class="zone-row"><div id="myMon" class="slots monster"></div></div>
            <div class="zone-row"><div id="mySpell" class="slots spell"></div></div>
          </div>
          <div class="field-side">
            <button id="myGrave" class="utility-zone" type="button" onclick="openGrave('me')">무덤 0</button>
            <button id="myDeck" class="utility-zone" type="button">덱 0</button>
          </div>
        </div>
        <div class="zone-footer">
          <div id="mySide" class="side"></div>
        </div>
      </article>
    </section>

    <section class="hand-wrap nulsight-panel nulsight-panel--compact" aria-label="손패">
      <div class="nulsight-panel__head hand-head">
        <div>
          <p class="nulsight-kicker hud-kicker">HAND</p>
          <h2 class="game-section-title">손패</h2>
        </div>
        <span class="hand-head__status">사용할 카드를 선택하세요.</span>
      </div>
      <div id="hand" class="hand"></div>
    </section>
  </main>

  <div id="gameEndOverlay" class="game-end-overlay hidden">
    <div class="game-end-box">
      <div id="gameEndText">게임 종료</div>
      <button class="nulsight-button nulsight-button--primary" onclick="goLobby(true)">대기실로 이동</button>
    </div>
  </div>

  <aside id="graveDrawer" class="grave-drawer hidden" aria-label="무덤 카드 목록">
    <div class="grave-drawer__head">
      <strong id="graveDrawerTitle">무덤</strong>
      <button type="button" class="nulsight-button" onclick="closeGrave()">닫기</button>
    </div>
    <div id="graveList" class="grave-drawer__list"></div>
  </aside>

  <section id="cardInspectOverlay" class="card-overlay hidden" aria-label="카드 상세 정보" aria-modal="true" role="dialog">
    <div class="card-overlay__backdrop" onclick="closeCardOverlay()"></div>
    <article class="card-overlay__panel">
      <header class="card-overlay__head">
        <strong>카드 정보</strong>
        <button type="button" class="nulsight-button" onclick="closeCardOverlay()">닫기</button>
      </header>
      <div class="card-overlay__content">
        <div id="cardOverlayPreview" class="card-overlay__preview"></div>
        <div class="card-overlay__body">
          <div id="cardOverlayMeta" class="card-overlay__meta"></div>
          <div>
            <h3 class="card-overlay__sub">키워드 설명</h3>
            <div id="cardOverlayKeywords" class="card-overlay__keywords"></div>
          </div>
        </div>
      </div>
    </article>
  </section>

  <section id="effectPickOverlay" class="card-overlay hidden" aria-label="효과 카드 선택" aria-modal="true" role="dialog">
    <div class="card-overlay__backdrop" onclick="closeEffectPickOverlay(false)"></div>
    <article class="card-overlay__panel effect-pick-overlay__panel">
      <header class="card-overlay__head">
        <strong id="effectPickTitle">효과 카드 선택</strong>
        <button type="button" class="nulsight-button" onclick="closeEffectPickOverlay(false)">취소</button>
      </header>
      <p id="effectPickGuide" class="muted effect-pick-overlay__guide">카드를 눌러 선택해줘.</p>
      <div id="effectPickList" class="effect-pick-overlay__list"></div>
    </article>
  </section>

`

declare global {
  interface Window {
    BP_NULSIGHT_GAME?: {
      teardown?: () => void
    }
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

export function GamePage() {
  const location = useLocation()
  const navigate = useNavigate()

  const params = new URLSearchParams(location.search)
  const roomId = params.get('roomId')?.trim() || ''
  const agentId = params.get('agentId')?.trim() || ''

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

  return <div dangerouslySetInnerHTML={{ __html: GAME_MARKUP }} />
}
