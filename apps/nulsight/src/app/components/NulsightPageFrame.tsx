import type { PropsWithChildren } from 'react'
import { AppFrame } from '@portfolio/ui-shell'

type NulsightPageWidth = 'default' | 'narrow' | 'reading' | 'game'

type NulsightPageFrameProps = PropsWithChildren<{
  className?: string
  width?: NulsightPageWidth
  centered?: boolean
}>

export function NulsightPageFrame({
  className = 'nulsight-shell',
  width = 'default',
  centered = false,
  children,
}: NulsightPageFrameProps) {
  return (
    <AppFrame
      as="main"
      innerClassName={className}
      preset={width}
      centered={centered}
    >
      {children}
    </AppFrame>
  )
}
