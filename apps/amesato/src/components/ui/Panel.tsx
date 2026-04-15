import type { PropsWithChildren, ReactNode } from 'react'
import { SectionIntro } from '@portfolio/ui-shell'

interface PanelProps extends PropsWithChildren {
  eyebrow?: string
  title?: ReactNode
  className?: string
}

export function Panel({ eyebrow, title, className = '', children }: PanelProps) {
  return (
    <section className={`panel-shell p-5 sm:p-6 ${className}`}>
      {(eyebrow || title) ? (
        <SectionIntro
          className="mb-4"
          eyebrow={eyebrow}
          title={title}
          titleAs="div"
          eyebrowClassName="text-xs font-semibold tracking-[0.28em] text-app-muted-strong uppercase"
          titleClassName="font-display text-[1.65rem] leading-tight text-app-text"
        />
      ) : null}
      {children}
    </section>
  )
}
