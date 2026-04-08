import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { postJson } from '../app/api/client'
import type { AuthResponse } from '../app/types'

function getNextPath(search: string) {
  const next = new URLSearchParams(search).get('next')?.trim()
  return next || '/lobby'
}

export function RegisterPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const nextPath = getNextPath(location.search)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!username.trim() || !password) {
      setStatus('아이디와 비밀번호를 입력해 주세요.')
      return
    }

    setSubmitting(true)
    setStatus('')
    try {
      const response = await postJson<AuthResponse>('/api/auth?action=register', {
        username: username.trim(),
        displayName: displayName.trim(),
        password,
      })

      if (!response.ok) {
        setStatus(`회원가입 실패: ${response.error || 'error'}`)
        return
      }

      navigate(nextPath, { replace: true })
    } catch {
      setStatus('회원가입 요청 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="nulsight-shell nulsight-shell--narrow">
      <section className="nulsight-panel">
        <div className="nulsight-panel__head">
          <p className="nulsight-kicker">REGISTER</p>
          <h1 className="nulsight-section-title">회원가입</h1>
        </div>

        <form className="nulsight-form" onSubmit={handleSubmit}>
          <label className="nulsight-label">
            <span>아이디</span>
            <input
              className="w100"
              placeholder="아이디 (영문/숫자/_ · 3~24자)"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label className="nulsight-label">
            <span>표시 이름</span>
            <input
              className="w100"
              placeholder="표시 이름 (선택)"
              autoComplete="nickname"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>

          <label className="nulsight-label">
            <span>비밀번호</span>
            <input
              type="password"
              className="w100"
              placeholder="비밀번호 (영문+숫자 · 8자 이상)"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <button type="submit" className="nulsight-button nulsight-button--primary" disabled={submitting}>
            {submitting ? '가입 중' : '회원가입'}
          </button>
        </form>

        <div className="nulsight-note-stack">
          {status ? <p className="nulsight-status">{status}</p> : null}
          <p className="nulsight-note">표시 이름은 선택이며, 아이디와 비밀번호만으로도 가입할 수 있습니다.</p>
          <p className="nulsight-note">
            이미 계정이 있으면 <Link to={`/login${location.search}`}>로그인</Link>해 주세요.
          </p>
        </div>
      </section>
    </main>
  )
}
