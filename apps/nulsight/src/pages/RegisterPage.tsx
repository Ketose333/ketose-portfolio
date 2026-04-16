import { FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { registerAccount } from '@portfolio/account-client'
import { mapAuthError } from '../app/api/errors'
import { ButtonSurface, FieldGroup, PanelSurface, SectionIntro } from '@portfolio/ui-shell'
import { NulsightPageFrame } from '../app/components/NulsightPageFrame'

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
      const response = await registerAccount({
        username: username.trim(),
        displayName: displayName.trim(),
        password,
      })

      if (!response.ok) {
        setStatus(`회원가입 실패: ${mapAuthError(response.error || '')}`)
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
    <NulsightPageFrame className="nulsight-shell nulsight-shell--narrow" width="narrow" centered>
      <PanelSurface as="section" className="nulsight-panel nulsight-panel--hero nulsight-auth-panel" tone="strong" padding="lg">
        <SectionIntro
          className="nulsight-panel__head"
          eyebrow="가입"
          title="플레이어 등록"
          titleAs="h1"
          description={
            <p className="nulsight-copy nulsight-copy--tight">
              가입이 끝나면 같은 식별자로 방 생성, 합류, 덱 저장이 모두 이어집니다.
            </p>
          }
          eyebrowClassName="nulsight-kicker"
          titleClassName="nulsight-section-title"
        />

        <div className="nulsight-auth-layout">
          <form className="nulsight-form nulsight-auth-form" onSubmit={handleSubmit}>
            <FieldGroup className="nulsight-label" label="아이디">
              <input
                className="w100"
                placeholder="아이디 (영문/숫자/_ · 3~24자)"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </FieldGroup>

            <FieldGroup className="nulsight-label" label="표시 이름">
              <input
                className="w100"
                placeholder="표시 이름 (선택)"
                autoComplete="nickname"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </FieldGroup>

            <FieldGroup className="nulsight-label" label="비밀번호">
              <input
                type="password"
                className="w100"
                placeholder="비밀번호 (영문+숫자 · 8자 이상)"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </FieldGroup>

            <div className="nulsight-actions nulsight-actions--form">
              <ButtonSurface type="submit" className="nulsight-button nulsight-button--primary" variant="solid" disabled={submitting}>
                {submitting ? '가입 중' : '회원가입'}
              </ButtonSurface>
              <ButtonSurface as={Link} className="nulsight-button" to={`/login${location.search}`}>
                로그인
              </ButtonSurface>
            </div>

            <div className="nulsight-note-stack nulsight-note-stack--panel">
              <p className="nulsight-note">표시 이름은 선택 사항이며 비워 두면 아이디를 그대로 사용합니다.</p>
              <p className="nulsight-status">{status || `다음 이동: ${nextPath}`}</p>
            </div>
          </form>
        </div>
      </PanelSurface>
    </NulsightPageFrame>
  )
}
