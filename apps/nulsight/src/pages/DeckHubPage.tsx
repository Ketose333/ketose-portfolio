import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAccountDisplayName, readAuthSession } from '@portfolio/account-client'
import { SectionIntro } from '@portfolio/ui-shell'
import { postJson, readJson } from '../app/api/client'
import { ActionDialog } from '../app/components/ActionDialog'
import { readClipboardTextSafe, writeClipboardTextSafe } from '../client/ui/clipboard'
import { GatedPageNotice } from '../app/components/GatedPageNotice'
import { getDeckCodecGlobal, getSharedCardsGlobal, normalizeCardKey, type CardDef } from '../app/globals'
import type { AuthResponse } from '../app/types'

type DeckHubItem = {
  id: string
  title: string
  description: string
  author: string
  code: string
  cardsCount: number
  tags: string[]
  imports?: number
}

type DeckHubListResponse = {
  ok: boolean
  items?: DeckHubItem[]
  total?: number
  error?: string
}

type DeckHubDetailResponse = {
  ok: boolean
  post?: DeckHubItem
  error?: string
}

const PAGE_SIZE = 20

function compareDeckOrder(aKey: string, bKey: string, defs: Record<string, CardDef>) {
  const a = normalizeCardKey(aKey)
  const b = normalizeCardKey(bKey)
  const themeCompare = String(defs[a]?.theme || '').localeCompare(String(defs[b]?.theme || ''), 'ko')
  if (themeCompare !== 0) return themeCompare
  const nameCompare = String(defs[a]?.name || a).localeCompare(String(defs[b]?.name || b), 'ko')
  if (nameCompare !== 0) return nameCompare
  return a.localeCompare(b)
}

function extractEffectKeywords(effectText = '') {
  const set = new Set<string>()
  const regex = /<([^>]+)>/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(effectText)) !== null) {
    const token = String(match[1] || '')
      .split(':')[0]
      .replace(/\s*·\s*마나\s*\d+$/i, '')
      .trim()
    if (token) set.add(token)
  }
  return [...set]
}

function summarizeDeck(code: string, defs: Record<string, CardDef>) {
  const codec = getDeckCodecGlobal()
  if (!codec?.decodeDeckCode) return null
  const parsed = codec.decodeDeckCode(code)
  if (!parsed.ok || !parsed.deck) return null

  const counts = new Map<string, number>()
  const keywordCounts = new Map<string, number>()

  for (const raw of parsed.deck) {
    const key = normalizeCardKey(raw)
    counts.set(key, (counts.get(key) || 0) + 1)
    for (const keyword of extractEffectKeywords(defs[key]?.effect || '')) {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1)
    }
  }

  const rows = [...counts.entries()]
    .map(([key, qty]) => ({ key, qty, name: defs[key]?.name || key }))
    .sort((a, b) => compareDeckOrder(a.key, b.key, defs))

  const effects = [...keywordCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
    .slice(0, 6)
    .sort((a, b) => a[0].localeCompare(b[0], 'ko'))

  return { total: parsed.deck.length, kinds: rows.length, rows, effects }
}

function renderHubCardPreview(item: ReturnType<typeof summarizeDeck>, defs: Record<string, CardDef>) {
  const rows = item?.rows?.slice(0, 3) || []
  if (!rows.length) {
    return <div className="muted">미리보기 카드 없음</div>
  }

  return rows.map((row) => {
    const def = defs[row.key]
    const type = def?.type === 'monster' ? '유닛' : '마법'
    const meta = [def?.theme, def?.element].filter(Boolean).join(' · ')
    const footer = def?.type === 'monster' ? `${def?.atk ?? '-'} / ${def?.hp ?? '-'}` : (def?.spellKind || 'spell').toUpperCase()

    return (
      <div className="hub-card-preview" key={row.key}>
        <div className={`bp-card ${def?.type === 'monster' ? 'bp-card--unit' : 'bp-card--spell'}`}>
          <div className="bp-card__chrome" />
          <div className="bp-card__head">
            <span className="bp-card__cost">{def?.cost ?? '-'}</span>
            <span className="bp-card__type">{type}</span>
          </div>
          <div className="bp-card__body">
            <div className="bp-card__name">{def?.name || row.key}</div>
            <div className={`bp-card__meta${meta ? '' : ' bp-card__meta--empty'}`}>{meta || '분류 없음'}</div>
            <div className="bp-card__text">{row.qty}장 채용</div>
          </div>
          <div className="bp-card__foot">
            <span className="bp-card__footer">{footer}</span>
            <span className="bp-card__footer">x{row.qty}</span>
          </div>
        </div>
      </div>
    )
  })
}

export function DeckHubPage() {
  const navigate = useNavigate()
  const shared = getSharedCardsGlobal()
  const defs = shared?.CARD_DEFS || {}
  const [me, setMe] = useState<AuthResponse['user'] | null>(null)
  const [items, setItems] = useState<DeckHubItem[]>([])
  const [status, setStatus] = useState('덱 허브를 불러오는 중입니다.')
  const [booting, setBooting] = useState(true)
  const [authRequired, setAuthRequired] = useState(false)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('latest')
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [description, setDescription] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeckHubItem | null>(null)

  const hasMore = offset < total

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const auth = await readAuthSession()
        if (!auth.ok || !auth.user) {
          if (!cancelled) {
            setAuthRequired(true)
          }
          navigate('/login?next=%2Fdeck-hub', { replace: true })
          return
        }
        if (cancelled) return
        setMe(auth.user)
        await refresh(true)
      } catch {
        if (!cancelled) {
          setAuthRequired(true)
          setStatus('덱 허브를 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) {
          setBooting(false)
        }
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [navigate])

  async function refresh(reset: boolean) {
    const nextOffset = reset ? 0 : offset
    setBusy('refresh')
    try {
      const response = await readJson<DeckHubListResponse>(
        `/api/deck-hub?q=${encodeURIComponent(query.trim())}&sort=${encodeURIComponent(sort)}&limit=${PAGE_SIZE}&offset=${nextOffset}`,
      )
      if (!response.ok) {
        setStatus(response.error || '허브 목록을 불러오지 못했습니다.')
        return
      }

      const nextItems = response.items || []
      setItems((current) => (reset ? nextItems : [...current, ...nextItems]))
      setOffset(nextOffset + nextItems.length)
      setTotal(response.total || 0)
      setStatus(`총 ${response.total || 0}개 · ${nextOffset + nextItems.length}개 표시`)
    } finally {
      setBusy(null)
    }
  }

  async function publishDeckPost() {
    setBusy('publish')
    try {
      const response = await postJson<DeckHubDetailResponse>('/api/deck-hub', {
        title: title.trim(),
        description: description.trim(),
        code: code.trim(),
        tags: tags
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      })

      if (!response.ok) {
        setStatus(`업로드 실패: ${response.error || 'error'}`)
        return
      }

      setTitle('')
      setTags('')
      setDescription('')
      setCode('')
      setStatus('덱을 허브에 올렸습니다.')
      await refresh(true)
    } finally {
      setBusy(null)
    }
  }

  async function importToDeck(id: string) {
    setBusy(`import:${id}`)
    try {
      const detail = await readJson<DeckHubDetailResponse>(`/api/deck-hub?action=detail&id=${encodeURIComponent(id)}`)
      if (!detail.ok || !detail.post) {
        setStatus('덱 정보를 불러오지 못했습니다.')
        return
      }
      await postJson<{ ok: boolean; error?: string }>('/api/deck-hub?action=import', { id })
      navigate('/deck', { state: { importDeckCode: detail.post.code || '' } })
    } finally {
      setBusy(null)
    }
  }

  async function deletePost(id: string) {
    setBusy(`delete:${id}`)
    try {
      const response = await postJson<{ ok: boolean; error?: string }>('/api/deck-hub?action=delete', { id })
      if (!response.ok) {
        setStatus('삭제에 실패했습니다.')
        return
      }
      setStatus('허브에서 삭제했습니다.')
      await refresh(true)
    } finally {
      setBusy(null)
    }
  }

  async function pasteDeckHubCode() {
    const nextCode = await readClipboardTextSafe()
    if (!nextCode.trim()) {
      setStatus('클립보드에 덱 코드가 없습니다.')
      return
    }
    setCode(nextCode.trim())
    setStatus('업로드용 덱 코드를 붙여넣었습니다.')
  }

  const cards = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        summary: summarizeDeck(item.code, defs),
        mine: !!me && item.author === me.username,
      })),
    [defs, items, me],
  )
  const sortLabel = sort === 'imports' ? '가져오기순' : '최신순'
  const hubSignals = [
    { label: '표시', value: `${cards.length} / ${total}` },
    { label: '정렬', value: sortLabel },
    { label: '계정', value: getAccountDisplayName(me) || '-' },
  ]

  if (!booting && authRequired && !me) {
      return (
        <GatedPageNotice
          kicker="덱 허브"
          title="덱 허브는 로그인 뒤에 사용할 수 있습니다."
          description="공개 덱 검색, 가져오기, 업로드는 로그인한 상태에서만 가능합니다."
        primaryAction={{ label: '로그인', onClick: () => navigate('/login?next=%2Fdeck-hub') }}
        secondaryAction={{ label: '대기실', onClick: () => navigate('/lobby') }}
      />
    )
  }

  return (
    <main className="nulsight-shell">
      <section className="nulsight-panel nulsight-panel--compact hub-toolbar" aria-label="덱 허브 검색">
        <SectionIntro
          className="hub-toolbar__head"
          eyebrow="덱 허브"
          title="공개 덱 허브"
          titleAs="h1"
          description={
            <p className="nulsight-copy nulsight-copy--tight">
              공개 덱을 찾아 현재 슬롯으로 가져오거나, 완성한 리스트를 같은 포맷으로 배포할 수 있습니다.
            </p>
          }
          eyebrowClassName="nulsight-kicker"
          titleClassName="nulsight-section-title"
        />
        <div className="hub-toolbar__signals" aria-label="허브 상태">
          {hubSignals.map((entry) => (
            <article className="nulsight-band" key={entry.label}>
              <span className="nulsight-band__label">{entry.label}</span>
              <strong className="nulsight-band__value">{entry.value}</strong>
            </article>
          ))}
        </div>
        <div className="hub-toolbar__row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && busy === null) {
                event.preventDefault()
                void refresh(true)
              }
            }}
            autoComplete="off"
            placeholder="덱명/작성자/태그 검색"
          />
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="정렬 기준">
            <option value="latest">최신순</option>
            <option value="imports">가져오기순</option>
          </select>
          <button className="ghost nulsight-button" type="button" onClick={() => void refresh(true)} disabled={busy !== null}>
            검색
          </button>
        </div>
        <div className="muted hub-status-line" role="status" aria-live="polite">
          {status}
        </div>
      </section>

      <section className="hub-list">
        {cards.length ? (
          cards.map((item) => (
            <article className="hub-card nulsight-panel nulsight-panel--compact" key={item.id}>
              <div className="hub-card__top">
                <div>
                  <h3>{item.title}</h3>
                  <div className="hub-meta">
                    <span>@{item.author}</span>
                    <span>{item.tags.join(', ')}</span>
                    <span>{item.cardsCount}장</span>
                  </div>
                </div>
                <div className="hub-meta">
                  <span>⬇ {item.imports || 0}</span>
                </div>
              </div>

              <p className="muted">{item.description || '설명 없음'}</p>

              <div className="hub-card__body">
                <div className="hub-decklist">
                  <div className="hub-decklist__head">
                    <span>덱 리스트</span>
                    <span className="muted">
                      {item.summary?.total || 0}장 · {item.summary?.kinds || 0}종
                    </span>
                  </div>
                  <ul className="hub-decklist__list">
                    {(item.summary?.rows || []).slice(0, 10).map((row) => (
                      <li key={row.key}>
                        <span>{row.name}</span>
                        <b>x{row.qty}</b>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="hub-effects">
                  <div className="hub-decklist__head">
                    <span>효과 경향</span>
                  </div>
                  <div className="hub-effects__chips">
                    {(item.summary?.effects || []).length ? (
                      item.summary?.effects.map(([name, count]) => (
                        <span className="hub-chip" key={name}>
                          {name} <b>{count}</b>
                        </span>
                      ))
                    ) : (
                      <span className="muted">표시할 효과 없음</span>
                    )}
                  </div>
                  <div className="hub-card-previews">
                    {renderHubCardPreview(item.summary, defs)}
                  </div>
                </div>
              </div>

              <div className="hub-actions">
                <button
                  className="ghost nulsight-button"
                  type="button"
                  onClick={async () => {
                    const copied = await writeClipboardTextSafe(item.code)
                    setStatus(copied ? '덱 코드를 복사했습니다.' : '덱 코드 복사에 실패했습니다.')
                  }}
                >
                  코드 복사
                </button>
                <button className="primary nulsight-button nulsight-button--primary" type="button" onClick={() => void importToDeck(item.id)}>
                  내 덱으로 가져오기
                </button>
                {item.mine ? (
                  <button className="ghost nulsight-button" type="button" onClick={() => setDeleteTarget(item)}>
                    삭제
                  </button>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <article className="hub-card hub-card--empty nulsight-panel nulsight-panel--compact">
            <p className="nulsight-kicker">비어 있음</p>
            <h3>아직 공개된 덱이 없습니다</h3>
            <p className="muted">
              검색 결과가 없거나 허브가 비어 있습니다. 아래 업로드 영역에서 첫 샘플 덱을 올리거나 다른 키워드로 다시 찾아보세요.
            </p>
          </article>
        )}
      </section>

      {hasMore ? (
        <div className="hub-loadmore-wrap">
          <button className="ghost nulsight-button" type="button" onClick={() => void refresh(false)} disabled={busy !== null}>
            더 불러오기
          </button>
        </div>
      ) : null}

      <section className="nulsight-panel nulsight-panel--compact hub-toolbar hub-upload" aria-label="덱 업로드">
        <div>
          <p className="nulsight-kicker">업로드</p>
          <h2 className="nulsight-section-title">덱 업로드</h2>
        </div>
        <div className="hub-toolbar__row">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoComplete="off"
            maxLength={60}
            placeholder="덱 이름 (최대 60자)"
          />
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            autoComplete="off"
            placeholder="태그(쉼표 구분)"
          />
        </div>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          autoComplete="off"
          maxLength={300}
          rows={2}
          placeholder="덱 설명 (선택, 최대 300자)"
        />
        <textarea
          value={code}
          onChange={(event) => setCode(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          rows={3}
          placeholder="공유할 덱 코드를 붙여넣어 주세요"
        />
        <div className="hub-toolbar__row">
          <button className="ghost nulsight-button" type="button" onClick={() => void pasteDeckHubCode()} disabled={busy !== null}>
            코드 붙여넣기
          </button>
          <button className="primary nulsight-button nulsight-button--primary" type="button" onClick={() => void publishDeckPost()} disabled={busy !== null}>
            허브에 올리기
          </button>
        </div>
      </section>

      <ActionDialog
        open={Boolean(deleteTarget)}
        kicker="덱 허브"
        title="이 덱을 허브에서 삭제할까요?"
        description={deleteTarget ? `"${deleteTarget.title}" 게시글이 허브에서 제거됩니다.` : ''}
        confirmLabel="삭제"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) {
            return
          }
          const nextId = deleteTarget.id
          setDeleteTarget(null)
          void deletePost(nextId)
        }}
      />
    </main>
  )
}
