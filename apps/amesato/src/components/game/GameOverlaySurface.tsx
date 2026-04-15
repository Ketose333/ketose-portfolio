import type { GameOverlaySnapshot } from '../../game/ui/GameHudSnapshot'
import { ChoiceGrid, OverlaySurface } from '@portfolio/ui-shell'

interface GameOverlaySurfaceProps {
  overlay: GameOverlaySnapshot
}

export function GameOverlaySurface({ overlay }: GameOverlaySurfaceProps) {
  if (overlay.kind === 'none') {
    return null
  }

  if (overlay.kind === 'dialogue') {
    return (
      <OverlaySurface
        className="viewport-message-card viewport-message-card--dialogue game-overlay-surface max-w-3xl"
        eyebrow={overlay.title}
        title={overlay.speaker}
        subtitle={overlay.subtitle}
        body={<p className="min-h-24 text-base leading-8 text-app-text">{overlay.body}</p>}
        footer={
          overlay.prompt ? (
            <p className="text-xs tracking-[0.24em] text-app-muted-strong uppercase">{overlay.prompt}</p>
          ) : null
        }
      />
    )
  }

  return (
    <OverlaySurface
      className="viewport-message-card game-overlay-surface max-w-2xl"
      eyebrow={overlay.speaker}
      title={overlay.title}
      subtitle={overlay.subtitle ? <p className="text-sm text-app-text">{overlay.subtitle}</p> : undefined}
      body={
        <div className="space-y-4">
          {overlay.body ? <p className="text-sm leading-7 text-app-muted">{overlay.body}</p> : null}
          {overlay.stats.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {overlay.stats.map((stat) => (
                <div key={stat.label} className="hud-stat-card px-4 py-3 text-left">
                  <p className="text-[11px] tracking-[0.24em] text-app-muted-strong uppercase">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-lg text-app-text">{stat.value}</p>
                </div>
              ))}
            </div>
          ) : null}
          {overlay.choices.length > 0 ? (
            <ChoiceGrid
              columnsClassName="sm:grid-cols-2"
              items={overlay.choices.map((choice) => ({
                key: choice.id,
                active: choice.active,
                label: (
                  <span className="font-display text-lg tracking-[0.18em]">
                    {choice.label}
                  </span>
                ),
              }))}
            />
          ) : null}
        </div>
      }
      footer={
        overlay.prompt ? (
          <p className="text-xs tracking-[0.24em] text-app-muted-strong uppercase">{overlay.prompt}</p>
        ) : null
      }
    />
  )
}
