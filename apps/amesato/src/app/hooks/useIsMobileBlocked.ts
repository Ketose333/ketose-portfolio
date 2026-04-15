import { useEffect, useState } from 'react'

const MOBILE_MEDIA_QUERY = '(max-width: 900px), (hover: none) and (pointer: coarse)'

function readIsMobileBlocked() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

export function useIsMobileBlocked() {
  const [isMobileBlocked, setIsMobileBlocked] = useState(readIsMobileBlocked)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY)
    const handleChange = () => setIsMobileBlocked(mediaQuery.matches)

    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isMobileBlocked
}
