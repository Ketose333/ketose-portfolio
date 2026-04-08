import type { PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { readJson } from '../api/client'
import type { AuthResponse } from '../types'

const NAV_ITEMS = [
  { label: '대기실', to: '/lobby' },
  { label: '가이드', to: '/guide' },
  { label: '덱 편집', to: '/deck' },
  { label: '덱 허브', to: '/deck-hub' },
] as const

export function NulsightChrome({ children }: PropsWithChildren) {
  const location = useLocation()
  const navigate = useNavigate()
  const [authUser, setAuthUser] = useState<AuthResponse['user'] | null>(null)
  const isGameRoute = location.pathname === '/game'

  useEffect(() => {
    let cancelled = false

    async function syncAuth() {
      try {
        const response = await readJson<AuthResponse>('/api/auth?action=me')
        if (cancelled) {
          return
        }
        setAuthUser(response.ok ? response.user ?? null : null)
      } catch {
        if (!cancelled) {
          setAuthUser(null)
        }
      }
    }

    void syncAuth()

    return () => {
      cancelled = true
    }
  }, [location.pathname])

  async function handleLogout() {
    const response = await fetch('/api/auth?action=logout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      return
    }

    setAuthUser(null)
    navigate('/login', { replace: true })
  }

  if (isGameRoute) {
    return (
      <div className="nulsight-app-shell nulsight-app-shell--game">
        <div className="nulsight-app-shell__content nulsight-app-shell__content--game">{children}</div>
      </div>
    )
  }

  return (
    <div className="nulsight-app-shell">
      <header className="bp-header" role="banner">
        <div className="bp-header__inner">
          <Link className="bp-brand bp-logo" to="/lobby" aria-label="NULSIGHT 대기실로 이동">
            NULSIGHT
          </Link>
          <nav className="bp-header__nav" aria-label="주요 메뉴">
            {NAV_ITEMS.map((entry) => (
              <NavLink
                key={entry.to}
                to={entry.to}
                className={({ isActive }) =>
                  `bp-nav-link${isActive ? ' bp-nav-link--active' : ''}`
                }
              >
                {entry.label}
              </NavLink>
            ))}
          </nav>
          <div className="bp-header__actions" aria-label="계정">
            {authUser ? (
              location.pathname === '/login' ? (
                <Link className="bp-header-btn" to="/lobby">
                  대기실로
                </Link>
              ) : (
                <button className="bp-header-btn" type="button" onClick={() => void handleLogout()}>
                  로그아웃
                </button>
              )
            ) : (
              <Link
                className="bp-header-btn"
                to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="nulsight-app-shell__content">{children}</div>

      <footer className="bp-footer" role="contentinfo">
        <div className="bp-footer__inner">
          <span>NULSIGHT</span>
          <span className="bp-footer__dot" aria-hidden="true">
            •
          </span>
          <span>Alpha 1.0.0</span>
        </div>
      </footer>
    </div>
  )
}
