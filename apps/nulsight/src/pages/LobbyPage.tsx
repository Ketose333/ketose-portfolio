import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getAccountDisplayName, readAuthSession } from '@portfolio/account-client'
import { ButtonSurface, FieldGroup, PanelSurface, SectionIntro } from '@portfolio/ui-shell'
import { postJson, readJson } from '../app/api/client'
import { mapRoomError } from '../app/api/errors'
import { NulsightPageFrame } from '../app/components/NulsightPageFrame'
import { loadSavedAgent, loadSavedRoom, saveAgent, saveRoom } from '../client/game/persistence'
import { buildGameUrl, sanitizeRoomId } from '../client/game/room'
import { readClipboardTextSafe, writeClipboardTextSafe } from '../client/ui/clipboard'
import type { AuthResponse, RoomStateResponse } from '../app/types'

export function LobbyPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryRoomId = sanitizeRoomId(new URLSearchParams(location.search).get('roomId') || '')
  const [authUser, setAuthUser] = useState<AuthResponse['user'] | null>(null)
  const [roomId, setRoomId] = useState(queryRoomId || loadSavedRoom())
  const [roomState, setRoomState] = useState<RoomStateResponse | null>(null)
  const [status, setStatus] = useState('대기 중')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<null | 'create' | 'check' | 'join'>(null)

  const agentId = authUser?.username || loadSavedAgent()
  const roomCode = sanitizeRoomId(roomState?.roomId || roomId || '------') || '------'
  const roomAgents = roomState?.agents ?? []
  const agentsCount = roomState?.agentsCount ?? roomAgents.length
  const roomStarted = typeof roomState?.started === 'boolean' ? roomState.started : Boolean(roomState?.game)
  const roomJoinable = typeof roomState?.joinable === 'boolean' ? roomState.joinable : agentsCount < 2

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const auth = await readAuthSession()
        if (!auth.ok || !auth.user) {
          if (!cancelled) {
            setAuthUser(null)
            setStatus('로그인하면 방 생성과 입장이 가능합니다.')
          }
          return
        }

        if (cancelled) {
          return
        }

        setAuthUser(auth.user)
        saveAgent(auth.user.username)
        setStatus(`로그인: ${getAccountDisplayName(auth.user)}`)
      } catch {
        if (!cancelled) {
          setAuthUser(null)
          setStatus('로그인하면 방 생성과 입장이 가능합니다.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!roomId || !authUser?.username) {
      return
    }

    saveRoom(roomId)
  }, [authUser?.username, roomId])

  useEffect(() => {
    if (!roomId || !authUser?.username) {
      return
    }

    let cancelled = false

    async function syncState(silent = false) {
      if (!silent) {
        setBusy('check')
      }

      try {
        const response = await readJson<RoomStateResponse>(
          `/api/rooms?action=state&roomId=${encodeURIComponent(roomId)}`,
        )

        if (cancelled) {
          return
        }

        setRoomState(response)

        if (response.ok) {
          setStatus(response.started ? '진행 중' : '방 상태 확인됨')
          if (response.started && response.agents?.includes(authUser.username)) {
            navigate(buildGameUrl(roomId, authUser.username))
          }
        } else {
          setStatus(mapRoomError(response.error || ''))
        }
      } catch {
        if (!cancelled) setStatus('방 상태를 불러오지 못했습니다.')
      } finally {
        if (!cancelled && !silent) {
          setBusy(null)
        }
      }
    }

    void syncState()
    const timer = window.setInterval(() => {
      void syncState(true)
    }, 2000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [authUser?.username, navigate, roomId, roomStarted])

  async function createRoom() {
    if (!authUser?.username) {
      return
    }
    setBusy('create')
    setStatus('방 생성 중')
    try {
      const response = await postJson<RoomStateResponse>('/api/rooms?action=create', {
        agentId: authUser.username,
      })

      if (!response.ok || !response.roomId) {
        setStatus(mapRoomError(response.error || ''))
        return
      }

      const nextRoomId = sanitizeRoomId(response.roomId)
      setRoomId(nextRoomId)
      setRoomState(response)
      setStatus('방 생성 완료')
    } catch {
      setStatus('방 생성 중 문제가 발생했습니다.')
    } finally {
      setBusy(null)
    }
  }

  async function checkRoom() {
    if (!roomId) {
      return
    }
    setBusy('check')
    setStatus('방 상태 확인 중')
    try {
      const response = await readJson<RoomStateResponse>(
        `/api/rooms?action=state&roomId=${encodeURIComponent(roomId)}`,
      )
      setRoomState(response)
      setStatus(response.ok ? '방 상태 확인됨' : mapRoomError(response.error || ''))
    } catch {
      setStatus('방 상태를 불러오지 못했습니다.')
    } finally {
      setBusy(null)
    }
  }

  async function joinRoom() {
    if (!roomId || !authUser?.username) {
      return
    }

    setBusy('join')
    setStatus('입장 중')
    try {
      const response = await postJson<RoomStateResponse>('/api/rooms?action=join', {
        roomId,
        agentId: authUser.username,
      })

      if (!response.ok) {
        setStatus(mapRoomError(response.error || ''))
        return
      }

      setRoomState(response)
      if (response.started) {
        navigate(buildGameUrl(roomId, authUser.username))
        return
      }
      setStatus(response.agents && response.agents.length < 2 ? '입장 완료 · 상대 대기 중' : '입장 완료')
    } catch {
      setStatus('입장 중 문제가 발생했습니다.')
    } finally {
      setBusy(null)
    }
  }

  async function copyRoomCode() {
    if (!roomState?.roomId) {
      setStatus('복사할 방 코드가 없습니다.')
      return
    }
    try {
      const ok = await writeClipboardTextSafe(roomState.roomId)
      setStatus(ok ? '방 코드를 복사했습니다.' : '방 코드 복사에 실패했습니다.')
    } catch {
      setStatus('방 코드 복사에 실패했습니다.')
    }
  }

  async function pasteRoomCode() {
    try {
      const nextCode = sanitizeRoomId(await readClipboardTextSafe())
      if (!nextCode) {
        setStatus('클립보드에 방 코드가 없습니다.')
        return
      }
      setRoomId(nextCode)
      setStatus('방 코드를 붙여넣었습니다.')
    } catch {
      setStatus('클립보드에서 방 코드를 읽지 못했습니다.')
    }
  }

  const ambientRows = useMemo(
    () => [
      { label: '내 상태', value: authUser ? getAccountDisplayName(authUser) : '-' },
      { label: '방 상태', value: roomStarted ? '진행 중' : roomState?.ok ? '대기 중' : '-' },
      { label: '참가 인원', value: `${agentsCount}/2` },
      { label: '입장 가능', value: roomJoinable ? '가능' : '가득참' },
    ],
    [agentsCount, authUser, roomJoinable, roomStarted, roomState?.ok],
  )
  const roomFlow = [
    { title: '1. 로그인', detail: '같은 계정 이름이 방 식별과 듀얼 표시에 사용됩니다.' },
    { title: '2. 코드 공유', detail: '방 생성 후 6자리 코드를 전달하면 바로 합류할 수 있습니다.' },
    { title: '3. 자동 시작', detail: '두 플레이어가 모두 연결되면 인게임으로 자동 이동합니다.' },
  ]

  return (
    <NulsightPageFrame className="nulsight-shell nulsight-shell--lobby">
      <section className="nulsight-page-grid">
        <div className="nulsight-page-main">
          <PanelSurface as="section" className="nulsight-panel nulsight-panel--hero" tone="strong" padding="lg">
            <SectionIntro
              className="nulsight-panel__head"
              eyebrow="대기실"
              title="대기실"
              titleAs="h1"
              description={
                <p className="nulsight-copy nulsight-copy--tight">
                  방을 열거나 코드를 입력하면 두 플레이어가 모이는 즉시 듀얼로 연결됩니다.
                </p>
              }
              eyebrowClassName="nulsight-kicker"
              titleClassName="nulsight-section-title"
            />

            <div className="nulsight-band-list" aria-label="현재 상태 요약">
              {ambientRows.map((entry) => (
                <article key={entry.label} className="nulsight-band">
                  <span className="nulsight-band__label">{entry.label}</span>
                  <strong className="nulsight-band__value">{entry.value}</strong>
                </article>
              ))}
            </div>

            <div className="nulsight-lobby-grid">
              <PanelSurface as="article" className="nulsight-card nulsight-card--stack">
                <FieldGroup className="nulsight-label" label="계정" asLabel={false}>
                  <input value={authUser?.username || ''} placeholder="로그인 필요" readOnly />
                </FieldGroup>
              </PanelSurface>

              <PanelSurface as="article" className="nulsight-card nulsight-card--stack">
                <h2>새 방</h2>
                <ButtonSurface
                  className="nulsight-button nulsight-button--primary"
                  type="button"
                  onClick={createRoom}
                  variant="solid"
                  disabled={loading || busy !== null || !authUser}
                >
                  {busy === 'create' ? '생성 중' : '방 만들기'}
                </ButtonSurface>
              </PanelSurface>

              <PanelSurface as="article" className="nulsight-card nulsight-card--stack nulsight-card--wide">
                <h2>코드로 합류</h2>
                <div className="nulsight-inline-form">
                  <input
                    value={roomId}
                    onChange={(event) => setRoomId(sanitizeRoomId(event.target.value))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && roomId && busy === null && authUser) {
                        event.preventDefault()
                        void joinRoom()
                      }
                    }}
                    placeholder="방 코드를 입력해 주세요"
                    inputMode="text"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={6}
                  />
                  <ButtonSurface className="nulsight-button" type="button" onClick={checkRoom} disabled={!roomId || busy !== null}>
                    {busy === 'check' ? '확인 중' : '방 상태'}
                  </ButtonSurface>
                  <ButtonSurface className="nulsight-button" type="button" onClick={() => void pasteRoomCode()} disabled={busy !== null}>
                    코드 붙여넣기
                  </ButtonSurface>
                  <ButtonSurface
                    className="nulsight-button"
                    type="button"
                    onClick={joinRoom}
                    disabled={!roomId || busy !== null || !authUser}
                  >
                    {busy === 'join' ? '입장 중' : '입장'}
                  </ButtonSurface>
                </div>
              </PanelSurface>
            </div>

            <div className="nulsight-ops-footer">
              <p className="nulsight-status nulsight-status--strong">{status}</p>
              <div className="nulsight-actions nulsight-actions--compact">
                {!authUser ? (
                  <>
                    <ButtonSurface
                      as={Link}
                      className="nulsight-button nulsight-button--primary"
                      to={`/login?next=${encodeURIComponent('/lobby')}`}
                      variant="solid"
                    >
                      로그인
                    </ButtonSurface>
                    <ButtonSurface as={Link} className="nulsight-button" to="/register">
                      회원가입
                    </ButtonSurface>
                  </>
                ) : null}
                <ButtonSurface as={Link} className="nulsight-button" to="/deck">
                  덱빌딩
                </ButtonSurface>
                <ButtonSurface as={Link} className="nulsight-button" to="/guide">
                  가이드
                </ButtonSurface>
              </div>
            </div>
          </PanelSurface>
        </div>

        <aside className="nulsight-page-side">
          <PanelSurface as="section" className="nulsight-panel" tone="strong" padding="lg">
            <SectionIntro
              className="nulsight-panel__head"
              eyebrow="ROOM STATE"
              title="현재 방"
              titleAs="h2"
              eyebrowClassName="nulsight-kicker"
              titleClassName="nulsight-section-title"
            />
            <div className="nulsight-room-code">
              <div className="nulsight-room-code__label">현재 방 코드</div>
              <div className="nulsight-room-code__row">
                <div className="nulsight-code-box">{roomCode}</div>
                <ButtonSurface
                  className="nulsight-button nulsight-room-code__copy"
                  type="button"
                  onClick={() => void copyRoomCode()}
                  disabled={!roomState?.roomId}
                >
                  코드 복사
                </ButtonSurface>
              </div>
            </div>
            <div className="nulsight-agent-strip" aria-label="참가자">
              {(roomAgents.length ? roomAgents : ['EMPTY SLOT', 'EMPTY SLOT']).map((agent, index) => (
                <span
                  key={`${agent}-${index}`}
                  className={`nulsight-agent-chip${roomAgents[index] ? '' : ' nulsight-agent-chip--empty'}`}
                >
                  {roomAgents[index] || agent}
                </span>
              ))}
            </div>
            <dl className="nulsight-kv-list">
              <div>
                <dt>참가 인원</dt>
                <dd>{roomAgents.length ? roomAgents.join(', ') : `${agentsCount}/2`}</dd>
              </div>
              <div>
                <dt>방장</dt>
                <dd>{roomState?.ownerId || '-'}</dd>
              </div>
              <div>
                <dt>매치</dt>
                <dd>{roomStarted ? '진행 중' : '대기 중'}</dd>
              </div>
            </dl>
            <div className="nulsight-flow-block" aria-label="입장 절차">
              <p className="nulsight-panel-label">MATCH FLOW</p>
              <ol className="nulsight-step-list nulsight-step-list--compact">
                {roomFlow.map((entry) => (
                  <li key={entry.title}>
                    <strong>{entry.title}</strong>
                    <span>{entry.detail}</span>
                  </li>
                ))}
              </ol>
            </div>
          </PanelSurface>
        </aside>
      </section>
    </NulsightPageFrame>
  )
}
