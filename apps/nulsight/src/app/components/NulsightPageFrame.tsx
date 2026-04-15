import type { PropsWithChildren } from 'react'
import { AppFrame } from '@portfolio/ui-shell'

type NulsightPageWidth = 'default' | 'narrow' | 'reading' | 'game'

const WIDTH_MAP: Record<NulsightPageWidth, { maxWidth: string; gutter: string }> = {
  default: { maxWidth: '1180px', gutter: '48px' },
  narrow: { maxWidth: '760px', gutter: '48px' },
  reading: { maxWidth: '980px', gutter: '48px' },
  game: { maxWidth: '1180px', gutter: '40px' },
}

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
  const frame = WIDTH_MAP[width]

  return (
    <AppFrame
      as="main"
      innerClassName={className}
      maxWidth={frame.maxWidth}
      gutter={frame.gutter}
      centered={centered}
    >
      {children}
    </AppFrame>
  )
}
