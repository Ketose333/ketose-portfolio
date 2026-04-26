import type { ReactNode } from 'react'
import { ButtonSurface, NoticeSurface } from '@portfolio/ui-shell'
import { NulsightPageFrame } from './NulsightPageFrame'

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
    <NulsightPageFrame className="nulsight-shell nulsight-shell--narrow" width="narrow">
      <NoticeSurface
        className="nulsight-panel"
        introClassName="nulsight-panel__head"
        bodyClassName="nulsight-note-stack"
        actionsClassName="nulsight-actions nulsight-actions--compact"
        eyebrow={<span className="nulsight-kicker">{kicker}</span>}
        title={<span className="nulsight-section-title">{title}</span>}
        body={<p className="nulsight-status">{description}</p>}
        actions={
          <>
            <ButtonSurface
              className={`nulsight-button${primaryAction.primary === false ? '' : ' nulsight-button--primary'}`}
              type="button"
              onClick={primaryAction.onClick}
              variant={primaryAction.primary === false ? 'neutral' : 'solid'}
            >
              {primaryAction.label}
            </ButtonSurface>
            {secondaryAction ? (
              <ButtonSurface className="nulsight-button" type="button" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </ButtonSurface>
            ) : null}
          </>
        }
      />
    </NulsightPageFrame>
  )
}
