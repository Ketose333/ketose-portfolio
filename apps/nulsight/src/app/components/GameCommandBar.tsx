import { ButtonSurface } from '@portfolio/ui-shell'
import type { GameActiveActionState, GameSurfaceAction } from '../../client/game/surfaceState'

type CommandMetaItem = {
  label: string
  value: string
}

type GameCommandBarProps = {
  actionGuide: string
  activeActions: GameActiveActionState[]
  commandMetaItems: CommandMetaItem[]
  concedeDisabled: boolean
  endButtonDisabled: boolean
  endButtonLabel: string
  passButtonDisabled: boolean
  passButtonLabel: string
  stackActive: boolean
  stackEntriesCount: number
  uiLocked: boolean
  onConcede: () => void
  onEndPhase: () => void
  onPassPriority: () => void
  onStackOpen: () => void
  onSurfaceAction: (action?: GameSurfaceAction) => void
}

export function GameCommandBar({
  actionGuide,
  activeActions,
  commandMetaItems,
  concedeDisabled,
  endButtonDisabled,
  endButtonLabel,
  passButtonDisabled,
  passButtonLabel,
  stackActive,
  stackEntriesCount,
  uiLocked,
  onConcede,
  onEndPhase,
  onPassPriority,
  onStackOpen,
  onSurfaceAction,
}: GameCommandBarProps) {
  return (
    <section className="game-toolbar game-toolbar--rail" aria-label="게임 조작">
      <div className="game-toolbar__identity">
        <p className="nulsight-kicker zone-kicker">명령</p>
        <p className="game-toolbar__guide">{actionGuide}</p>
        <div className="game-command__meta" aria-label="듀얼 상태">
          {commandMetaItems.map((item) => (
            <span className="game-command__meta-item" key={item.label}>
              <span className="game-command__meta-label">{item.label}</span>
              <strong className="game-command__meta-value">{item.value}</strong>
            </span>
          ))}
        </div>
      </div>
      <div className="game-toolbar__actions">
        <div className="game-toolbar__cluster">
          <span className="game-toolbar__label">즉시 효과</span>
          <div className="game-toolbar__group game-toolbar__group--active">
            {activeActions.length > 0 ? (
              activeActions.map((item) => (
                <ButtonSurface
                  key={item.key}
                  className="nulsight-button nulsight-button--primary"
                  disabled={uiLocked || item.disabled}
                  title={item.detail || item.label}
                  onClick={() => onSurfaceAction(item.action)}
                  variant="solid"
                >
                  {item.label}
                </ButtonSurface>
              ))
            ) : (
              <span className="game-toolbar__empty">사용 가능한 효과 없음</span>
            )}
          </div>
        </div>
        <div className="game-toolbar__cluster">
          <span className="game-toolbar__label">기본 조작</span>
          <div className="game-toolbar__group">
            <ButtonSurface
              id="btnStackPanel"
              className={`nulsight-button${stackActive ? ' nulsight-button--primary' : ''}`}
              disabled={stackEntriesCount === 0}
              onClick={onStackOpen}
              title="현재 스택 확인"
              variant={stackActive ? 'solid' : 'neutral'}
            >
              스택 보기
            </ButtonSurface>
            <ButtonSurface
              id="btnStack"
              className="nulsight-button"
              disabled={passButtonDisabled || uiLocked}
              onClick={onPassPriority}
            >
              {passButtonLabel}
            </ButtonSurface>
            <ButtonSurface
              id="btnEnd"
              className="nulsight-button nulsight-button--primary"
              disabled={endButtonDisabled || uiLocked}
              onClick={onEndPhase}
              variant="solid"
            >
              {endButtonLabel}
            </ButtonSurface>
            <ButtonSurface
              id="btnConcede"
              className="nulsight-button"
              disabled={concedeDisabled || uiLocked}
              onClick={onConcede}
            >
              항복
            </ButtonSurface>
          </div>
        </div>
      </div>
    </section>
  )
}
