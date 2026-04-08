import type { ReactNode } from 'react'

type Action = {
  label: string
  onClick: () => void
  primary?: boolean
}

type GatedPageNoticeProps = {
  kicker: string
  title: string
  description: ReactNode
  primaryAction: Action
  secondaryAction?: Action
}

export function GatedPageNotice({
  kicker,
  title,
  description,
  primaryAction,
  secondaryAction,
}: GatedPageNoticeProps) {
  return (
    <main className="nulsight-shell nulsight-shell--narrow">
      <section className="nulsight-panel">
        <div className="nulsight-panel__head">
          <p className="nulsight-kicker">{kicker}</p>
          <h1 className="nulsight-section-title">{title}</h1>
        </div>
        <div className="nulsight-note-stack">
          <p className="nulsight-status">{description}</p>
        </div>
        <div className="nulsight-actions nulsight-actions--compact">
          <button
            className={`nulsight-button${primaryAction.primary === false ? '' : ' nulsight-button--primary'}`}
            type="button"
            onClick={primaryAction.onClick}
          >
            {primaryAction.label}
          </button>
          {secondaryAction ? (
            <button className="nulsight-button" type="button" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </button>
          ) : null}
        </div>
      </section>
    </main>
  )
}
