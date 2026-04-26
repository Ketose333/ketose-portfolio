import { FormEvent, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { loginAccount, readAuthSession } from '@portfolio/account-client'
import { mapAuthError } from '../app/api/errors'
import { ButtonSurface, FieldGroup } from '@portfolio/ui-shell'
import { NulsightPageFrame } from '../app/components/NulsightPageFrame'
import { NulsightPanel } from '../app/components/NulsightPanel'

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

    void readAuthSession()
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
      const response = await loginAccount({
        username: username.trim(),
        password,
      })

      if (!response.ok) {
        setStatus(`로그인 실패: ${mapAuthError(response.error || '')}`)
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
    <NulsightPageFrame className="nulsight-shell nulsight-shell--narrow" width="narrow" centered>
      <NulsightPanel
        className="nulsight-panel--hero nulsight-auth-panel"
        eyebrow="로그인"
        titleAs="h1"
        title="세션 로그인"
        description={
          <p className="nulsight-copy nulsight-copy--tight">
            로그인하면 대기실이나 요청한 화면으로 이동합니다.
          </p>
        }
      >
        <div className="nulsight-auth-layout">
          <form className="nulsight-form nulsight-auth-form" onSubmit={handleSubmit}>
            <FieldGroup className="nulsight-label" label="아이디">
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="아이디를 입력해 주세요"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
              />
            </FieldGroup>

            <FieldGroup className="nulsight-label" label="비밀번호">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호를 입력해 주세요"
                autoComplete="current-password"
              />
            </FieldGroup>

            <div className="nulsight-actions nulsight-actions--form">
              <ButtonSurface className="nulsight-button nulsight-button--primary" type="submit" variant="solid" disabled={submitting}>
                {submitting ? '로그인 중' : '로그인'}
              </ButtonSurface>
              <ButtonSurface as={Link} className="nulsight-button" to={`/register${location.search}`}>
                회원가입
              </ButtonSurface>
            </div>

            <div className="nulsight-note-stack nulsight-note-stack--panel">
              <p className="nulsight-note">한 계정으로 로비, 덱, 듀얼 로그를 함께 사용합니다.</p>
              <p className="nulsight-status">{status || '로그인 대기 중'}</p>
            </div>
          </form>
        </div>
      </NulsightPanel>
    </NulsightPageFrame>
  )
}
