import { useEffect } from 'react'
import { appAudio } from './appAudio'
import type { BgmTrackId } from './audioManifest'

export function useBgmTrack(trackId: BgmTrackId | null, enabled = true) {
  useEffect(() => {
    appAudio.setBgmEnabled(enabled)

    if (!trackId) {
      appAudio.stopBgm(220)
      return
    }

    appAudio.playBgm(trackId)
  }, [enabled, trackId])
}
