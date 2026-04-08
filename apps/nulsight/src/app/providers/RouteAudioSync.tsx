import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { nulsightAudio } from '../../client/audio/appAudio'

export function RouteAudioSync() {
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === '/game') {
      nulsightAudio.stopBgm(180)
      return
    }

    nulsightAudio.playBgm('title')
  }, [location.pathname])

  return null
}
