import type { PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { getAccountDisplayName, logoutAccount, readAuthSession } from '@portfolio/account-client'
import { ShellChrome } from '@portfolio/ui-shell'
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
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register'

  useEffect(() => {
    let cancelled = false

    async function syncAuth() {
      try {
        const response = await readAuthSession()
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
    const response = await logoutAccount()

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
    <ShellChrome
      shellClassName="nulsight-app-shell"
      headerClassName="nulsight-chrome"
      headerInnerClassName="nulsight-chrome__header"
      contentClassName="nulsight-app-shell__content"
      footerClassName="nulsight-chrome__footer"
      footerInnerClassName="nulsight-chrome__footer-grid"
      brand={
        <Link className="ui-shell-chrome__brand nulsight-chrome__brand" to="/lobby" aria-label="Nulsight 대기실로 이동">
          <strong className="ui-shell-chrome__title nulsight-chrome__wordmark">Nulsight</strong>
        </Link>
      }
      context={null}
      nav={isAuthRoute ? null : (
        <>
          {NAV_ITEMS.map((entry) => (
            <NavLink
              key={entry.to}
              to={entry.to}
              className={({ isActive }) =>
                `ui-shell-chrome__nav-link${isActive ? ' ui-shell-chrome__nav-link--active' : ''}`
              }
            >
              {entry.label}
            </NavLink>
          ))}
        </>
      )}
      actions={
        isAuthRoute ? null : (
          <>
            {authUser ? (
              <strong className="nulsight-chrome__user">{getAccountDisplayName(authUser)}</strong>
            ) : null}
            {authUser ? null : (
              <Link
                className="ui-shell-chrome__button ui-shell-chrome__button--solid"
                to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
              >
                로그인
              </Link>
            )}
            {authUser ? (
              <button className="ui-shell-chrome__button" type="button" onClick={() => void handleLogout()}>
                로그아웃
              </button>
            ) : null}
          </>
        )
      }
      footer={
        <p className="ui-shell-chrome__footer-copy">Nulsight alpha 1.0.0</p>
      }
    >
      {children}
    </ShellChrome>
  )
}
