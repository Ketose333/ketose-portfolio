import type { GameHudState } from '../../client/game/surfaceState'

type GameStatusStripProps = {
  currentPhaseIndex: number
  hudState: GameHudState
  phaseSteps: string[]
}

export function GameStatusStrip({ currentPhaseIndex, hudState, phaseSteps }: GameStatusStripProps) {
  return (
    <section className="hud game-status-strip" aria-label="전황 정보">
      <div className="game-status-strip__main">
        <div className="game-status-strip__identity">
          <p className="nulsight-kicker hud-kicker">듀얼</p>
          <h1 className="game-section-title">NULSIGHT</h1>
        </div>
        <div className="game-status-strip__headline">
          <div className={`hud-turn ${hudState.turnTone === 'me' ? 'is-me' : 'is-opp'}`}>
            {hudState.turnText}
          </div>
          <div className="hud-phase">
            {hudState.phaseText}
          </div>
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
      <div className="hud-phase-track" aria-label="페이즈 진행">
        {phaseSteps.map((step, index) => {
          const active = currentPhaseIndex === index
          const passed = currentPhaseIndex > index
          return (
            <span
              key={step}
              className={`hud-phase-pill${active ? ' is-active' : ''}${passed ? ' is-passed' : ''}`}
            >
              {step}
            </span>
          )
        })}
      </div>
    </section>
  )
}
