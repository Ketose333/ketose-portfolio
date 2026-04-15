import { Outlet } from 'react-router-dom'
import { NulsightChrome } from './NulsightChrome'
import { RouteAudioSync } from '../providers/RouteAudioSync'

export function NulsightAppShell() {
  return (
    <>
      <RouteAudioSync />
      <NulsightChrome>
        <Outlet />
      </NulsightChrome>
    </>
  )
}
