import { FormEvent, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { postJson, readJson } from '../app/api/client'
import type { AuthResponse } from '../app/types'

function getNextPath(search: string) {
  const next = new URLSearchParams(search).get('next')?.trim()
  return next || '/lobby'
}

export function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const nextPath = getNextPath(location.search)

  useEffect(() => {
    let cancelled = false

    void readJson<AuthResponse>('/api/auth?action=me')
      .then((response) => {
        if (!cancelled && response.ok) {
          navigate(nextPath, { replace: true })
        }
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [navigate, nextPath])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!username.trim() || !password) {
      setStatus('아이디와 비밀번호를 입력해 주세요.')
      return
    }

    setSubmitting(true)
    setStatus('')
    try {
      const response = await postJson<AuthResponse>('/api/auth?action=login', {
        username: username.trim(),
        password,
      })

      if (!response.ok) {
        setStatus(`로그인 실패: ${response.error || 'error'}`)
        return
      }

      navigate(nextPath, { replace: true })
    } catch {
      setStatus('로그인 요청 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="nulsight-shell nulsight-shell--narrow">
      <section className="nulsight-panel">
        <div className="nulsight-panel__head">
          <p className="nulsight-kicker">LOGIN</p>
          <h1 className="nulsight-section-title">로그인</h1>
        </div>

        <form className="nulsight-form" onSubmit={handleSubmit}>
          <label className="nulsight-label">
            <span>아이디</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="아이디를 입력해 주세요"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
            />
          </label>

          <label className="nulsight-label">
            <span>비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력해 주세요"
              autoComplete="current-password"
            />
          </label>

          <button className="nulsight-button nulsight-button--primary" type="submit" disabled={submitting}>
            {submitting ? '로그인 중' : '로그인'}
          </button>
        </form>

        <div className="nulsight-note-stack">
          {status ? <p className="nulsight-status">{status}</p> : null}
          <Link className="nulsight-inline-link" to={`/register${location.search}`}>
            회원가입으로 이동
          </Link>
        </div>
      </section>
    </main>
  )
}
