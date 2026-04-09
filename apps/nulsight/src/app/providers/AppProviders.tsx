import type { PropsWithChildren } from 'react'
import { UiOverlayProvider } from './UiOverlayProvider'

export function AppProviders({ children }: PropsWithChildren) {
  return <UiOverlayProvider>{children}</UiOverlayProvider>
}
