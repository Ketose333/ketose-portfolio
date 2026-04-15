import { useGameSessionStore } from '../../app/store/useGameSessionStore'
import { Panel } from '../ui/Panel'

export function GameHudCard() {
  const score = useGameSessionStore((state) => state.score)
  const lives = useGameSessionStore((state) => state.lives)
  const bombs = useGameSessionStore((state) => state.bombs)
  const enemyHealth = useGameSessionStore((state) => state.enemyHealth)
  const enemyMaxHealth = useGameSessionStore((state) => state.enemyMaxHealth)
  const cardCombo = useGameSessionStore((state) => state.cardCombo)
  const phaseLabel = useGameSessionStore((state) => state.phaseLabel)
  const status = useGameSessionStore((state) => state.status)
  const campaignStageNumber = useGameSessionStore((state) => state.campaignStageNumber)

  const enemyRatio = enemyMaxHealth > 0 ? Math.max(enemyHealth, 0) / enemyMaxHealth : 0

  return (
    <Panel className="panel-shell--hud">
      <div className="space-y-4">
        <div className="hud-stat-card p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.18em] text-app-muted-strong uppercase">현재 면</p>
              <p className="mt-2 font-display text-2xl text-app-text">{campaignStageNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs tracking-[0.18em] text-app-muted-strong uppercase">상태</p>
              <p className="mt-2 text-sm text-app-text">{toKoreanStatus(status)}</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-app-muted">{phaseLabel}</p>
        </div>

        <div className="grid grid-cols-2 items-stretch gap-3">
          <div className="hud-stat-card col-span-2 flex h-full min-w-0 flex-col justify-between p-4">
            <p className="text-xs tracking-[0.18em] text-app-muted-strong uppercase">점수</p>
            <p className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap font-display text-[clamp(1.15rem,3vw,1.5rem)] leading-none text-app-text">
              {score.toLocaleString()}
            </p>
          </div>
          <div className="hud-stat-card flex h-full min-w-0 flex-col justify-between p-4">
            <p className="text-xs tracking-[0.18em] text-app-muted-strong uppercase">목숨</p>
            <p className="mt-2 font-display text-2xl text-app-text">{lives}</p>
          </div>
          <div className="hud-stat-card flex h-full min-w-0 flex-col justify-between p-4">
            <p className="text-xs tracking-[0.18em] text-app-muted-strong uppercase">폭탄</p>
            <p className="mt-2 font-display text-2xl text-app-text">{bombs}</p>
          </div>
        </div>

        <div className="hud-stat-card p-4">
          <div className="hud-progress-track mt-3 h-2 overflow-hidden">
            <div
              className="hud-progress-fill h-full transition-[width]"
              style={{ width: `${enemyRatio * 100}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-app-muted-strong">
            <span>봉인 잔량</span>
            <span>
              {enemyHealth} / {enemyMaxHealth}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 text-sm text-app-muted">
          <div className="hud-stat-card flex h-full min-w-0 flex-col justify-between p-4">
            <p className="text-xs tracking-[0.18em] text-app-muted-strong uppercase">콤보</p>
            <p className="mt-2 text-lg text-app-text">{cardCombo}</p>
          </div>
        </div>
      </div>
    </Panel>
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
