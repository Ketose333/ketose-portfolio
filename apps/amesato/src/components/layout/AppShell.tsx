import { Outlet } from 'react-router-dom'
import { AppFrame } from '@portfolio/ui-shell'

export function AppShell() {
  return (
    <AppFrame
      as="div"
      centered
      className="min-h-dvh"
      innerClassName="relative z-10 flex min-h-dvh flex-col justify-center px-6 py-5 sm:px-8 sm:py-6"
      maxWidth="80rem"
      gutter="32px"
    >
      <main>
        <Outlet />
      </main>
    </AppFrame>
  )
}
