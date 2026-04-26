import type { PropsWithChildren, ReactNode } from 'react'
import { SectionPanel } from '@portfolio/ui-shell'

type NulsightPanelProps = PropsWithChildren<{
  ariaLabel?: string
  className?: string
  compact?: boolean
  description?: ReactNode
  eyebrow?: ReactNode
  title?: ReactNode
  titleAs?: 'h1' | 'h2' | 'h3' | 'div'
}>

export function NulsightPanel({
  ariaLabel,
  children,
  className = '',
  compact = false,
  description,
  eyebrow,
  title,
  titleAs = 'h2',
}: NulsightPanelProps) {
  return (
    <SectionPanel
      as="section"
      aria-label={ariaLabel}
      className={`nulsight-panel${compact ? ' nulsight-panel--compact' : ''}${className ? ` ${className}` : ''}`}
      description={description}
      descriptionClassName="ui-copy-ko"
      eyebrow={eyebrow}
      eyebrowClassName="nulsight-kicker"
      introClassName="nulsight-panel__head"
      padding={compact ? 'md' : 'lg'}
      title={title}
      titleAs={titleAs}
      titleClassName="nulsight-section-title ui-title-ko"
      tone="strong"
    >
      {children}
    </SectionPanel>
  )
}
